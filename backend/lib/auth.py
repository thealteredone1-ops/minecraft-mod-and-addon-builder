"""Cookie-session auth: httpOnly signed session id, bcrypt-ish password hashing via passlib."""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Cookie, HTTPException, Response
from passlib.context import CryptContext

from lib.db import db
from models.schemas import User

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
COOKIE_NAME = "modcraft_session"
SESSION_DAYS = 30


def hash_password(raw: str) -> str:
    return pwd_context.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(raw, hashed)
    except Exception:
        return False


async def create_session(user_id: str, response: Response) -> str:
    token = str(uuid.uuid4())
    await db.sessions.insert_one(
        {
            "token": token,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS),
        }
    )
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=SESSION_DAYS * 86400,
        path="/",
    )
    return token


async def destroy_session(token: str | None, response: Response) -> None:
    if token:
        await db.sessions.delete_one({"token": token})
    response.delete_cookie(COOKIE_NAME, path="/", samesite="none", secure=True)


def to_user(doc: dict) -> User:
    return User(
        id=doc["id"],
        email=doc["email"],
        display_name=doc.get("display_name", ""),
        plan=doc.get("plan", "free"),
        mods_generated=doc.get("mods_generated", 0),
        free_limit=int(os.environ.get("FREE_LIMIT", 3)),
    )


async def optional_user(modcraft_session: str | None = Cookie(default=None)) -> User | None:
    if not modcraft_session:
        return None
    sess = await db.sessions.find_one({"token": modcraft_session})
    if not sess:
        return None
    expires = sess.get("expires_at")
    if expires and expires.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return None
    doc = await db.users.find_one({"id": sess["user_id"]})
    return to_user(doc) if doc else None


async def current_user(modcraft_session: str | None = Cookie(default=None)) -> User:
    user = await optional_user(modcraft_session)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
