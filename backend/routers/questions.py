# routers/questions.py
# Rotas do banco de questões:
#
# GET  /api/questions              → lista questões com filtros opcionais
# GET  /api/questions/{id}         → detalhe de uma questão (sem revelar resposta)
# POST /api/questions              → cria questão (só admin)
# PUT  /api/questions/{id}         → edita questão (só admin)
# DELETE /api/questions/{id}       → remove questão (só admin)
#
# GET  /api/questions/disciplines  → lista todas as disciplinas
# POST /api/questions/disciplines  → cria disciplina (só admin)

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

import models
import schemas
from database import get_db
from auth import get_current_user, get_current_admin

router = APIRouter()


# ─── DISCIPLINAS ──────────────────────────────────────────────────────────────

@router.get("/disciplines", response_model=list[schemas.DisciplineResponse])
def list_disciplines(db: Session = Depends(get_db)):
    """
    Retorna todas as disciplinas.
    Rota pública — qualquer um pode ver as disciplinas para filtrar questões.
    """
    return db.query(models.Discipline).order_by(models.Discipline.name).all()


@router.post("/disciplines", response_model=schemas.DisciplineResponse, status_code=201)
def create_discipline(
    data: schemas.DisciplineCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)  # só admin
):
    """Cria uma nova disciplina."""
    # Verifica se já existe
    existing = db.query(models.Discipline).filter(
        models.Discipline.name == data.name
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Disciplina já cadastrada"
        )

    discipline = models.Discipline(name=data.name)
    db.add(discipline)
    db.commit()
    db.refresh(discipline)
    return discipline


# ─── QUESTÕES ─────────────────────────────────────────────────────────────────

@router.get("", response_model=schemas.QuestionListResponse)
def list_questions(
    # Filtros opcionais via query string
    # Exemplo: /api/questions?discipline_id=1&difficulty=easy&page=2
    discipline_id: Optional[int] = Query(None, description="Filtrar por disciplina"),
    difficulty: Optional[str]   = Query(None, description="easy, medium ou hard"),
    year: Optional[int]         = Query(None, description="Ano da prova"),
    search: Optional[str]       = Query(None, description="Busca no enunciado"),
    page: int                   = Query(1, ge=1, description="Número da página"),
    size: int                   = Query(10, ge=1, le=50, description="Itens por página"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Lista questões com filtros e paginação.
    
    Como funciona a paginação:
    - page=1, size=10 → registros 1 a 10
    - page=2, size=10 → registros 11 a 20
    - offset = (page - 1) * size
    """
    # Começa com todas as questões ativas
    query = db.query(models.Question).filter(models.Question.is_active == True)

    # Aplica os filtros se foram informados
    if discipline_id:
        query = query.filter(models.Question.discipline_id == discipline_id)

    if difficulty:
        query = query.filter(models.Question.difficulty == difficulty)

    if year:
        query = query.filter(models.Question.year == year)

    if search:
        # ILIKE = LIKE case-insensitive no PostgreSQL
        # %termo% = contém o termo em qualquer posição
        query = query.filter(
            models.Question.statement.ilike(f"%{search}%")
        )

    # Conta o total antes de paginar (para o frontend saber quantas páginas há)
    total = query.count()

    # Aplica paginação
    offset = (page - 1) * size
    questions = query.offset(offset).limit(size).all()

    return {
        "items": questions,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size  # arredonda para cima
    }


@router.get("/{question_id}", response_model=schemas.QuestionResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retorna uma questão pelo ID.
    NÃO inclui a resposta correta — o aluno vê apenas o enunciado e alternativas.
    A resposta só é revelada após ele responder (rota POST /api/answers).
    """
    question = db.query(models.Question).filter(
        models.Question.id == question_id,
        models.Question.is_active == True
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    return question


@router.post("", response_model=schemas.QuestionResponse, status_code=201)
def create_question(
    data: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)  # só admin
):
    """Cria uma nova questão. Apenas administradores."""
    # Verifica se a disciplina existe
    discipline = db.query(models.Discipline).filter(
        models.Discipline.id == data.discipline_id
    ).first()
    if not discipline:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")

    # Valida a resposta correta
    valid_answers = ["a", "b", "c", "d", "e"]
    if data.correct_answer.lower() not in valid_answers:
        raise HTTPException(
            status_code=400,
            detail="Resposta correta deve ser a, b, c, d ou e"
        )

    # Se não tem opção E, não pode ter E como resposta
    if data.correct_answer.lower() == "e" and not data.option_e:
        raise HTTPException(
            status_code=400,
            detail="Informe a alternativa E ou escolha outra resposta correta"
        )

    question = models.Question(
        statement=data.statement,
        option_a=data.option_a,
        option_b=data.option_b,
        option_c=data.option_c,
        option_d=data.option_d,
        option_e=data.option_e,
        correct_answer=data.correct_answer.lower(),
        explanation=data.explanation,
        difficulty=data.difficulty,
        year=data.year,
        discipline_id=data.discipline_id
    )

    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.put("/{question_id}", response_model=schemas.QuestionResponse)
def update_question(
    question_id: int,
    data: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Edita uma questão existente. Apenas administradores."""
    question = db.query(models.Question).filter(
        models.Question.id == question_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    # Atualiza cada campo
    question.statement    = data.statement
    question.option_a     = data.option_a
    question.option_b     = data.option_b
    question.option_c     = data.option_c
    question.option_d     = data.option_d
    question.option_e     = data.option_e
    question.correct_answer = data.correct_answer.lower()
    question.explanation  = data.explanation
    question.difficulty   = data.difficulty
    question.year         = data.year
    question.discipline_id = data.discipline_id

    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=204)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """
    Remove uma questão (soft delete: apenas marca como inativa).
    Soft delete preserva o histórico de respostas dos alunos.
    """
    question = db.query(models.Question).filter(
        models.Question.id == question_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    question.is_active = False
    db.commit()