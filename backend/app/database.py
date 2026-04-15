from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from fastapi import Depends

from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=280)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


DbSession = Session
