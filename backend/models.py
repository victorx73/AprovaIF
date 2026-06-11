# models.py
# Aqui definimos as tabelas do nosso banco de dados usando Python.
# Cada classe vira uma tabela. Cada atributo da classe vira uma coluna.
# O SQLAlchemy cuida de criar o SQL para nós.

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


# Enum para dificuldade da questão
class DifficultyEnum(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class User(Base):
    """Tabela de usuários."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(254), unique=True, index=True, nullable=False)
    password_hash = Column(String(100), nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamento: um usuário tem muitas respostas
    # back_populates faz a ligação bidirecional com o model UserAnswer
    answers = relationship("UserAnswer", back_populates="user")


class Discipline(Base):
    """Tabela de disciplinas (ex: Matemática, Português, etc.)."""
    __tablename__ = "disciplines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    # Uma disciplina tem muitas questões
    questions = relationship("Question", back_populates="discipline")


class Question(Base):
    """Tabela de questões."""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Enunciado da questão
    statement = Column(Text, nullable=False)
    
    # Alternativas armazenadas como texto simples separado por |
    # Exemplo: "Paris|Londres|Roma|Berlim"
    # (Simples para o MVP. Futuramente podemos mudar para JSON)
    option_a = Column(String(500), nullable=False)
    option_b = Column(String(500), nullable=False)
    option_c = Column(String(500), nullable=False)
    option_d = Column(String(500), nullable=False)
    option_e = Column(String(500))  # opcional
    
    # A resposta correta: "a", "b", "c", "d" ou "e"
    correct_answer = Column(String(1), nullable=False)
    
    # Explicação da resposta (opcional)
    explanation = Column(Text)
    
    # Metadados
    difficulty = Column(String(10), default="medium")
    year = Column(Integer)
    
    # Chave estrangeira: referencia a tabela disciplines
    discipline_id = Column(Integer, ForeignKey("disciplines.id"), nullable=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    discipline = relationship("Discipline", back_populates="questions")
    answers = relationship("UserAnswer", back_populates="question")


class UserAnswer(Base):
    """Tabela que registra cada resposta de um usuário a uma questão."""
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    
    # Chaves estrangeiras
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    # O que o usuário respondeu e se acertou
    selected_answer = Column(String(1), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    
    answered_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    user = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")