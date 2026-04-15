from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import SECRET_KEY
from app.database import get_db
from app.models import User

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    pw = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    exc = HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if uid is None:
            raise exc
    except JWTError:
        raise exc
    user = db.get(User, int(uid))
    if not user:
        raise exc
    return user


def require_mentor(user: User = Depends(get_current_user)) -> User:
    if user.role != "mentor":
        raise HTTPException(403, "Mentor only")
    return user


def require_owner(user: User = Depends(get_current_user)) -> User:
    if user.role != "owner":
        raise HTTPException(403, "Owner only")
    return user
