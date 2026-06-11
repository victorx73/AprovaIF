# main.py
# Este é o ponto de entrada da nossa API.
# Aqui criamos o app FastAPI e registramos todas as rotas.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # importar models faz o SQLAlchemy "conhecer" as tabelas

# Importa os roteadores de cada área
from routers import auth, questions, answers

# Cria todas as tabelas no banco de dados se não existirem
# Em produção usaríamos migrations (Alembic), mas para o MVP isso é suficiente
Base.metadata.create_all(bind=engine)

# Cria o app FastAPI
app = FastAPI(
    title="Banco de Questões IF",
    description="API para plataforma de preparação para os Institutos Federais",
    version="0.1.0"
)

# Configura o CORS
# CORS é necessário para o frontend (rodando em localhost:3000) 
# poder fazer requisições para o backend (rodando em localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra as rotas com prefixo /api
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questões"])
app.include_router(answers.router, prefix="/api/answers", tags=["Respostas"])


@app.get("/")
def root():
    """Rota de health check — confirma que a API está funcionando."""
    return {"status": "ok", "message": "Banco de Questões IF API"}