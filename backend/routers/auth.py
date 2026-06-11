# routers/auth.py
# Aqui ficam as rotas relacionadas a autenticação:
# POST /api/auth/register → cria um novo usuário
# POST /api/auth/login    → autentica e retorna o token JWT
# GET  /api/auth/me       → retorna os dados do usuário logado

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


@router.post("/register", response_model=schemas.UserResponse, status_code=201)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Cria um novo usuário.
    
    1. Verifica se o email já existe
    2. Criptografa a senha
    3. Salva no banco
    4. Retorna os dados do usuário (sem a senha)
    """
    # Verifica se já existe um usuário com esse email
    existing = db.query(models.User).filter(
        models.User.email == user_data.email
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está cadastrado"
        )
    
    # Cria o objeto usuário com a senha criptografada
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # atualiza o objeto com o id gerado pelo banco
    
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica o usuário e retorna um token JWT.
    
    1. Busca o usuário pelo email
    2. Verifica a senha
    3. Gera e retorna o token
    
    Usamos a mensagem genérica "Email ou senha inválidos" intencionalmente:
    não queremos revelar se o email existe ou não (segurança).
    """
    user = db.query(models.User).filter(
        models.User.email == credentials.email
    ).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )
    
    # O "sub" (subject) do token é o ID do usuário como string
    token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Retorna os dados do usuário atualmente logado.
    Depends(get_current_user) já valida o token automaticamente.
    """
    return current_user