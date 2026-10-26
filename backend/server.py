from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique a URL do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carregar modelo (será baixado na primeira execução)
print("Carregando modelo de IA... isso pode levar alguns segundos na primeira vez.")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Modelo carregado!")

class TransactionRequest(BaseModel):
    description: str
    categories: list[str]

class CategorizationResponse(BaseModel):
    category: str
    confidence: float
    clean_description: str

def clean_description(text: str) -> str:
    # Simples limpeza: title case e remover caracteres extras comuns
    # Pode ser expandido com regex se necessário
    return text.strip().title()

@app.post("/categorize", response_model=CategorizationResponse)
async def categorize_transaction(request: TransactionRequest):
    if not request.categories:
        raise HTTPException(status_code=400, detail="Lista de categorias vazia")

    # 1. Gerar embeddings
    # O modelo converte texto em vetores numéricos (significado semântico)
    description_embedding = model.encode(request.description, convert_to_tensor=True)
    category_embeddings = model.encode(request.categories, convert_to_tensor=True)

    # 2. Calcular similaridade (Cosseno)
    # Compara o vetor da descrição com cada vetor de categoria
    cosine_scores = util.cos_sim(description_embedding, category_embeddings)[0]

    # 3. Encontrar o melhor match
    best_score_idx = cosine_scores.argmax()
    best_score = cosine_scores[best_score_idx].item()
    best_category = request.categories[best_score_idx]

    return CategorizationResponse(
        category=best_category,
        confidence=best_score,
        clean_description=clean_description(request.description)
    )

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "all-MiniLM-L6-v2"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
