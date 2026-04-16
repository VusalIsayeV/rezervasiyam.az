from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.database import engine, SessionLocal
from app.models import Base, User
from app.security import hash_password
from app.routers import auth, business, bookings

Base.metadata.create_all(bind=engine)

# lightweight migration: add columns that create_all won't add to existing tables
from sqlalchemy import text, inspect as sa_inspect

def _migrate():
    insp = sa_inspect(engine)
    if "businesses" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("businesses")}
        with engine.begin() as conn:
            if "discounts" not in cols:
                conn.execute(text("ALTER TABLE businesses ADD COLUMN discounts JSON"))
    if "bookings" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("bookings")}
        with engine.begin() as conn:
            if "price" not in cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN price FLOAT"))

_migrate()

app = FastAPI(title="rezervasiyam.az API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(business.router)
app.include_router(bookings.router)


@app.on_event("startup")
def seed_mentor():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "mentor@rezervasiyam.az").first():
            db.add(User(
                email="mentor@rezervasiyam.az",
                password_hash=hash_password("mentor123"),
                role="mentor",
            ))
            db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"ok": True}
