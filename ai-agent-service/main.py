import os
import json
from contextlib import asynccontextmanager
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import asyncpg
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/civic_db")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

# --- Pydantic Schemas ---

class ReportInput(BaseModel):
    resident_name: str
    resident_contact: str
    description: str = Field(..., min_length=5)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    radius_meters: Optional[float] = 100.0

class ReportResponse(BaseModel):
    status: str
    action_taken: str
    master_issue_id: int
    report_count: int
    title: str
    summary: str

# --- Database Pool Manager ---

db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL)
    yield
    await db_pool.close()

app = FastAPI(title="Civic Report Aggregator Agent", lifespan=lifespan)

# --- AI Helper Functions ---

async def generate_master_summary(existing_summary: str, new_report_text: str) -> dict:
    """Uses LLM to synthesize combined resident reports into an updated municipal ticket."""
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an AI assistant for municipal authorities. 
Synthesize multiple citizen reports for the same incident into a single structured master ticket.
Respond strictly in JSON with keys:
- "title": A concise, clear incident title.
- "summary": A synthesis incorporating key details from all reports (landmarks, impact, specifics).
- "severity": One of ["Low", "Medium", "High", "Critical"].
- "category": e.g., Road/Pothole, Water/Sewage, Electricity/Streetlight, Waste Management, Other.
"""),
        ("user", """Existing Ticket Summary: {existing_summary}
New Incoming Resident Report: {new_report_text}

Generate the updated master ticket.""")
    ])
    
    chain = prompt | llm
    response = await chain.ainvoke({
        "existing_summary": existing_summary or "No existing reports.",
        "new_report_text": new_report_text
    })
    
    clean_json = response.content.strip().replace("```json", "").replace("```", "")
    return json.loads(clean_json)

# --- Main Aggregation API ---

@app.post("/api/v1/report", response_model=ReportResponse)
async def submit_resident_report(report: ReportInput):
    # 1. Generate embedding vector for the incoming description
    vector = await embeddings_model.aembed_query(report.description)
    vector_str = f"[{','.join(map(str, vector))}]"

    async with db_pool.acquire() as conn:
        async with conn.transaction():
            # 2. Query spatial matches (radius) + calculate cosine distance
            # (1 - (embedding <=> target_vector)) gives the cosine similarity score
            query = """
                SELECT 
                    id, 
                    title, 
                    summary, 
                    report_count,
                    (1 - (embedding <=> $1::vector)) AS similarity_score
                FROM master_issues
                WHERE status = 'open'
                  AND ST_DWithin(
                        geom, 
                        ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 
                        $4
                      )
                ORDER BY similarity_score DESC
                LIMIT 1;
            """
            
            candidate = await conn.fetchrow(
                query, 
                vector_str, 
                report.longitude, 
                report.latitude, 
                report.radius_meters
            )

            # Similarity threshold: 0.82 (adjust as needed for strictness)
            if candidate and candidate["similarity_score"] >= 0.82:
                master_id = candidate["id"]
                current_count = candidate["report_count"] + 1

                # 3a. LLM updates the aggregate summary
                updated_data = await generate_master_summary(
                    existing_summary=candidate["summary"],
                    new_report_text=report.description
                )

                # Update master issue
                await conn.execute("""
                    UPDATE master_issues
                    SET summary = $1,
                        title = $2,
                        severity = $3,
                        report_count = $4,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $5;
                """, updated_data["summary"], updated_data["title"], updated_data["severity"], current_count, master_id)

                # Append citizen report
                await conn.execute("""
                    INSERT INTO citizen_reports (master_issue_id, resident_name, resident_contact, raw_text, geom)
                    VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326));
                """, master_id, report.resident_name, report.resident_contact, report.description, report.longitude, report.latitude)

                return ReportResponse(
                    status="success",
                    action_taken="merged_into_master_issue",
                    master_issue_id=master_id,
                    report_count=current_count,
                    title=updated_data["title"],
                    summary=updated_data["summary"]
                )

            else:
                # 3b. Create brand new master issue
                initial_data = await generate_master_summary(
                    existing_summary="",
                    new_report_text=report.description
                )

                new_master = await conn.fetchrow("""
                    INSERT INTO master_issues (title, summary, category, severity, geom, embedding, report_count)
                    VALUES (
                        $1, 
                        $2, 
                        $3, 
                        $4, 
                        ST_SetSRID(ST_MakePoint($5, $6), 4326), 
                        $7::vector, 
                        1
                    )
                    RETURNING id;
                """, initial_data["title"], initial_data["summary"], initial_data["category"], 
                     initial_data["severity"], report.longitude, report.latitude, vector_str)

                master_id = new_master["id"]

                # Add citizen report record
                await conn.execute("""
                    INSERT INTO citizen_reports (master_issue_id, resident_name, resident_contact, raw_text, geom)
                    VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326));
                """, master_id, report.resident_name, report.resident_contact, report.description, report.longitude, report.latitude)

                return ReportResponse(
                    status="success",
                    action_taken="created_new_master_issue",
                    master_issue_id=master_id,
                    report_count=1,
                    title=initial_data["title"],
                    summary=initial_data["summary"]
                )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
