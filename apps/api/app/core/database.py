from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = None
SessionLocal = None


class Base(DeclarativeBase):
    pass


def init_database() -> bool:
    global engine, SessionLocal
    if not settings.database_enabled:
        return False

    url = settings.database_url
    if url.startswith("postgresql://") and "sslmode" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"

    try:
        engine = create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=10)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"[SafarAI] Database connection failed: {e}")
        engine = None
        SessionLocal = None
        return False


def get_db():
    if SessionLocal is None:
        raise RuntimeError("Database not initialized")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
