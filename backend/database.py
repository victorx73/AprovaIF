# database.py
# Este arquivo configura a conexão com o PostgreSQL.
# SQLAlchemy é uma biblioteca que nos permite trabalhar com bancos de dados
# usando Python, sem precisar escrever SQL na mão para tudo.

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

# Pega a URL do banco de dados do arquivo .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Cria a "engine" — é a conexão real com o banco
engine = create_engine(DATABASE_URL)

# SessionLocal é uma fábrica de sessões.
# Cada vez que precisamos falar com o banco, abrimos uma "sessão".
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base é a classe pai de todos os nossos "models" (tabelas)
Base = declarative_base()


def get_db():
    """
    Função geradora que fornece uma sessão do banco de dados.
    O 'yield' garante que a sessão seja fechada após o uso,
    mesmo que ocorra um erro.
    
    Usamos isso com o sistema de injeção de dependências do FastAPI.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()