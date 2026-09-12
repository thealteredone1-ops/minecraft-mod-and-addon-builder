from __future__ import annotations

import os
from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request

from lib.auth import optional_user
from lib.db import db
from models.schemas import CheckoutRequest, CheckoutResponse, PaymentStatus, User

router = APIRouter(tags=["payments"])

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

# Digital subscription sold from a US sandbox account -> Stripe-managed payments ("full").
TAX_MODE = "full"

PLANS = [
    {"lookup_key": "pro_monthly", "name": "Pro Monthly", "price": "$9", "interval": "month"},
    {"lookup_key": "pro_yearly", "name": "Pro Yearly", "price": "$86.40", "interval": "year"},
]


@router.get("/plans")
async def list_plans() -> dict:
    return {"plans": PLANS}


@router.post("/payments/checkout", response_model=CheckoutResponse)
async def create_checkout(req: CheckoutRequest, user: User | None = Depends(optional_user)) -> CheckoutResponse:
    if not user:
        raise HTTPException(status_code=401, detail="Sign in before upgrading")
    prices = stripe.Price.list(lookup_keys=[req.lookup_key], active=True, limit=1).data
    if not prices:
        raise HTTPException(status_code=500, detail=f"Price not found: {req.lookup_key}")
    price = prices[0]
    kwargs = dict(
        line_items=[{"price": price.id, "quantity": 1}],
        mode="subscription" if price.recurring else "payment",
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/payment/cancel",
        metadata={"user_id": user.id, "lookup_key": req.lookup_key},
    )
    try:
        session = stripe.checkout.Session.create(**kwargs, managed_payments={"enabled": True})
    except stripe.error.InvalidRequestError as exc:
        msg = (exc.user_message or str(exc)).lower()
        if "managed payments" in msg or "ineligible" in msg:
            session = stripe.checkout.Session.create(
                **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required"
            )
        else:
            raise HTTPException(status_code=502, detail="Could not start checkout") from exc

    now = datetime.now(timezone.utc)
    await db.payment_transactions.insert_one(
        {
            "session_id": session.id,
            "user_id": user.id,
            "lookup_key": req.lookup_key,
            "amount": float(price.unit_amount or 0),
            "currency": price.currency,
            "status": "initiated",
            "payment_status": "pending",
            "created_at": now,
            "updated_at": now,
        }
    )
    return CheckoutResponse(checkout_url=session.url, session_id=session.id)


async def _mark_paid(session_id: str, subscription_id: str | None, payment_intent: str | None) -> None:
    record = await db.payment_transactions.find_one_and_update(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {
            "$set": {
                "status": "completed",
                "payment_status": "paid",
                "stripe_subscription_id": subscription_id,
                "stripe_payment_intent_id": payment_intent,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    if record and record.get("user_id"):
        await db.users.update_one({"id": record["user_id"]}, {"$set": {"plan": "pro"}})


@router.get("/payments/status/{session_id}", response_model=PaymentStatus)
async def get_status(session_id: str) -> PaymentStatus:
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await _mark_paid(session_id, s.subscription, s.payment_intent)
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except stripe.error.StripeError:
            pass
    return PaymentStatus(
        session_id=record["session_id"],
        status=record["status"],
        payment_status=record["payment_status"],
    )


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request) -> dict:
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc
    obj, t = event["data"]["object"], event["type"]
    now = datetime.now(timezone.utc)
    if t == "checkout.session.completed":
        await _mark_paid(obj["id"], obj.get("subscription"), obj.get("payment_intent"))
    elif t == "checkout.session.async_payment_succeeded":
        await _mark_paid(obj["id"], obj.get("subscription"), obj.get("payment_intent"))
    elif t in ("checkout.session.async_payment_failed", "checkout.session.expired"):
        state = "failed" if t.endswith("failed") else "expired"
        await db.payment_transactions.update_one(
            {"session_id": obj["id"]},
            {"$set": {"status": state, "payment_status": state, "updated_at": now}},
        )
    elif t == "charge.refunded":
        await db.payment_transactions.update_one(
            {"stripe_payment_intent_id": obj.get("payment_intent")},
            {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": now}},
        )
    return {"status": "ok"}
