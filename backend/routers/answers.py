from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def answers_test():
    return {"message": "answers ok"}