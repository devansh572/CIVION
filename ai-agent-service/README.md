# Civic Report Aggregator Agent (FastAPI + LangChain + PostGIS + pgvector)

AI Deduplication and Aggregation microservice for civic and municipal reporting.

## Overview
- **Spatial Pre-Filter**: PostGIS `ST_DWithin` spatial query (radius $\le 100\text{m}$).
- **Semantic Embeddings**: `text-embedding-3-small` (1536-dimensional vector).
- **Vector Cosine Similarity**: pgvector `<=>` cosine distance operator with `0.82` threshold.
- **LLM Synthesis**: `gpt-4o-mini` dynamic re-summarization merging incoming citizen signals into an authoritative master ticket.

---

## Setup & Running

### 1. Install Dependencies
```bash
cd ai-agent-service
pip install -r requirements.txt
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure credentials:
```bash
cp .env.example .env
```
Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/civic_db
OPENAI_API_KEY=sk-...
```

### 3. Initialize Database Schema
Execute the SQL schema in `database/ai_dedup_schema.sql` on your PostgreSQL instance:
```bash
psql -d civic_db -f ../database/ai_dedup_schema.sql
```

### 4. Start the FastAPI Service
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## API Endpoints

### `POST /api/v1/report`
Submit an incoming citizen report. The agent automatically decides whether to merge into an existing master issue or create a new one.

#### Request Body
```json
{
  "resident_name": "Anita Das",
  "resident_contact": "+91 98765 43210",
  "description": "Deep crater under metro pillar 42 causing vehicle rim damage on 100 Feet Road.",
  "latitude": 12.9784,
  "longitude": 77.6408,
  "radius_meters": 100.0
}
```

#### Response (Merged Example)
```json
{
  "status": "success",
  "action_taken": "merged_into_master_issue",
  "master_issue_id": 1,
  "report_count": 4,
  "title": "Deep Hazardous Road Crater - Indiranagar Metro Corridor",
  "summary": "Multiple resident reports indicate expanding asphalt cavity under pillar 42 with vehicle rim damage hazard."
}
```
