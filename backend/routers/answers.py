# routers/answers.py
# Rota de respostas — registra a resposta do aluno e retorna o resultado.
# O arquivo completo com histórico e dashboard virá na Fase 4,
# mas precisamos do endpoint básico agora para o modal funcionar.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter()


@router.post("", response_model=schemas.AnswerResponse)
def submit_answer(
    data: schemas.AnswerSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Registra a resposta do aluno e retorna se acertou.
    
    1. Busca a questão (com a resposta correta)
    2. Compara com o que o aluno respondeu
    3. Salva no banco
    4. Retorna o resultado com a resposta certa e explicação
    """
    # Busca a questão — aqui precisamos da correct_answer, então buscamos direto no model
    question = db.query(models.Question).filter(
        models.Question.id == data.question_id,
        models.Question.is_active == True
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    # Valida a alternativa enviada
    valid = ['a', 'b', 'c', 'd', 'e']
    if data.selected_answer.lower() not in valid:
        raise HTTPException(status_code=400, detail="Alternativa inválida")

    selected = data.selected_answer.lower()
    is_correct = selected == question.correct_answer

    # Salva a resposta no banco
    answer = models.UserAnswer(
        user_id=current_user.id,
        question_id=question.id,
        selected_answer=selected,
        is_correct=is_correct
    )
    db.add(answer)
    db.commit()

    return {
        "is_correct": is_correct,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
        "selected_answer": selected
    }