from __future__ import annotations

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response

from lib.auth import (
    COOKIE_NAME,
    create_session,
    current_user,
    destroy_session,
    hash_password,
    optional_user,
    to_user,
    verify_password,
)
from lib.db import db
from models.schemas import LoginRequest, MessageResponse, SignupRequest, User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=User)
async def signup(payload: SignupRequest, response: Response) -> User:
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with that email already exists")
    import uuid

    doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "display_name": payload.display_name,
        "password_hash": hash_password(payload.password),
        "plan": "free",
        "mods_generated": 0,
    }
    await db.users.insert_one(doc)
    await create_session(doc["id"], response)
    return to_user(doc)


@router.post("/login", response_model=User)
async def login(payload: LoginRequest, response: Response) -> User:
    doc = await db.users.find_one({"email": payload.email.lower()})
    if not doc or not verify_password(payload.password, doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await create_session(doc["id"], response)
    return to_user(doc)


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response, modcraft_session: str | None = Cookie(default=None)) -> MessageResponse:
    await destroy_session(modcraft_session, response)
    return MessageResponse(message="signed out")


@router.get("/me", response_model=User)
async def me(user: User = Depends(current_user)) -> User:
    return user


@router.get("/session", response_model=User | None)
async def session(user: User | None = Depends(optional_user)) -> User | None:
    return user


COOKIE_NAME  # noqa: B018
