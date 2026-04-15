from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.database import engine, SessionLocal
from app.models import Base, User
from app.security import hash_password
from app.routers import auth, business, bookings

Base.metadata.create_all(bind=engine)

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
