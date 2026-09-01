# src/utils/security.py

import jwt
from datetime import datetime, timedelta
from typing import Optional, Any
#from passlib.context import CryptContext
import bcrypt
from ..config import settings

#pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie le mot de passe en clair contre le hash stocké."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    """Hash le mot de passe avec bcrypt directement (sans passlib)."""
    password_bytes = password.encode("utf-8")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    """Génère un token JWT contenant le user_id (subject)."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt