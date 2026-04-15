import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
