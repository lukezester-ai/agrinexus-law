# AgriNexus Brain — FastAPI (старт)

Минимален **FastAPI** сървър като начална точка за backend „мозъка“ (дълги задачи, AI pipeline, workers). Виж **`docs/BACKEND-ARCHITECTURE.md`**.

## Локален старт

```bash
cd services/agrinexus-brain
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8088
```

- Health: <http://127.0.0.1:8088/health>
- OpenAPI: <http://127.0.0.1:8088/docs>

## LlamaIndex (опционален RAG в Python)

За напреднал retrieval/query engine върху същите или нови индекси виж **`docs/RAG-SYSTEM.md`**. Допълнителни пакети:

```bash
pip install -r requirements-rag.txt
```

## Следващи стъпки

- Роутове за ingest / reindex / internal chat (със service auth).
- Споделяне на Pydantic модели с фронта (генериран TypeScript от OpenAPI, или ръчно).
- Deploy като контейнер; Next.js проксира с `AGRI_BRAIN_URL`.
