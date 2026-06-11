# schemas.py
# Schemas definem o "formato" dos dados que entram e saem da nossa API.
# Usamos Pydantic (já vem com o FastAPI) para isso.
# Eles também fazem validação automática: se o frontend mandar um email
# inválido, o Pydantic rejeita antes mesmo de chegar no nosso código.

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ─── USUÁRIOS ────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Dados necessários para criar um usuário (vem do frontend)."""
    name: str
    email: EmailStr  # valida o formato do email automaticamente
    password: str


class UserResponse(BaseModel):
    """Dados do usuário que enviamos de volta (nunca enviamos a senha!)."""
    id: int
    name: str
    email: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True  # permite converter objetos SQLAlchemy para este schema


# ─── AUTENTICAÇÃO ─────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Dados para fazer login."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Token JWT retornado após login bem-sucedido."""
    access_token: str
    token_type: str = "bearer"


# ─── DISCIPLINAS ──────────────────────────────────────────────

class DisciplineCreate(BaseModel):
    name: str


class DisciplineResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# ─── QUESTÕES ─────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    """Dados para criar uma questão (usado pelo admin)."""
    statement: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    option_e: Optional[str] = None
    correct_answer: str  # "a", "b", "c", "d" ou "e"
    explanation: Optional[str] = None
    difficulty: str = "medium"
    year: Optional[int] = None
    discipline_id: int


class QuestionResponse(BaseModel):
    """Dados da questão enviados ao aluno — SEM revelar a resposta correta."""
    id: int
    statement: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    option_e: Optional[str]
    difficulty: str
    year: Optional[int]
    discipline: DisciplineResponse

    class Config:
        from_attributes = True


class QuestionWithAnswer(QuestionResponse):
    """Versão com a resposta correta — usada APÓS o aluno responder."""
    correct_answer: str
    explanation: Optional[str]


# ─── RESPOSTAS ────────────────────────────────────────────────

class AnswerSubmit(BaseModel):
    """Dados enviados quando o aluno responde uma questão."""
    question_id: int
    selected_answer: str  # "a", "b", "c", "d" ou "e"


class AnswerResponse(BaseModel):
    """Resultado após responder: corrigido, com a resposta certa e explicação."""
    is_correct: bool
    correct_answer: str
    explanation: Optional[str]
    selected_answer: str


class AnswerHistory(BaseModel):
    """Item do histórico de respostas."""
    id: int
    question_id: int
    question_statement: str
    discipline_name: str
    selected_answer: str
    correct_answer: str
    is_correct: bool
    answered_at: datetime

    class Config:
        from_attributes = True


# ─── DASHBOARD ────────────────────────────────────────────────

class DashboardStats(BaseModel):
    """Estatísticas do aluno para o dashboard."""
    total_answered: int
    total_correct: int
    total_wrong: int
    accuracy_percentage: float
    by_discipline: list[dict]  # [{"discipline": "Matemática", "correct": 5, "total": 10}]