from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.db import user_public
from app.schemas import RegisterIn, LoginIn, TokenOut
from app.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Email artıq qeydiyyatdadır")
    if payload.voen and db.query(User).filter(User.voen == payload.voen).first():
        raise HTTPException(400, "VOEN artıq qeydiyyatdadır")
    u = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="owner",
        voen=payload.voen,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    token = create_access_token({"sub": str(u.id)})
    return TokenOut(access_token=token, user=user_public(u))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(or_(User.email == payload.identifier, User.voen == payload.identifier))
        .first()
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Yanlış giriş məlumatları")
    token = create_access_token({"sub": str(user.id)})
    return TokenOut(access_token=token, user=user_public(user))
