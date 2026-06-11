from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def questions_test():
    return {"message": "questions ok"}