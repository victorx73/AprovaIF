# Banco de Questões IF

Plataforma de preparação para os Institutos Federais do Brasil.

## Como rodar localmente

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```