# auth.py
# Este arquivo cuida de tudo relacionado à segurança:
# - Criptografar senhas (nunca salvamos a senha real no banco)
# - Criar tokens JWT (o "crachá" que prova que o usuário está logado)
# - Verificar se um token é válido

from datetime import datetime, timedelta
from typing import Optional
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models
from database import get_db

load_dotenv()

# Configurações do JWT — lidas do arquivo .env
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

# Contexto para criptografar senhas com bcrypt
# bcrypt é um algoritmo seguro e lento de propósito — dificulta força bruta
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema OAuth2: diz ao FastAPI onde esperar o token (no header Authorization)
# 🔥 ALTERADO: agora usamos HTTPBearer (JWT simples, sem OAuth2 confuso no Swagger)
oauth2_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    """Transforma a senha em um hash irreversível."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha digitada corresponde ao hash salvo."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """
    Cria um token JWT.
    O token contém o ID do usuário e uma data de expiração.
    Qualquer um com o token pode se identificar na API — por isso protegemos o SECRET_KEY.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Dependência do FastAPI: extrai e valida o token JWT do header.
    
    Quando uma rota usa Depends(get_current_user), o FastAPI
    automaticamente chama esta função e injeta o usuário logado.
    Se o token for inválido ou expirado, retorna 401.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials

        # Decodifica o token usando o SECRET_KEY
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Busca o usuário no banco
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


def get_current_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    """
    Dependência que exige que o usuário seja admin.
    Usamos isso nas rotas do painel administrativo.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para administradores"
        )
    return current_user