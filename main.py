import html
import logging
import os
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from huggingface_hub import InferenceClient
from pdfminer.high_level import extract_text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
from models import ResumeAnalysis, ResumeRewrite

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resume_app")

MODEL_ID = os.getenv("HF_MODEL_ID", "HuggingFaceH4/zephyr-7b-beta")
HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
INDEX_FILE = Path(__file__).with_name("index.html")
MAX_UPLOAD_MB = 8

KEYWORDS = {
    "python": 14,
    "react": 12,
    "javascript": 12,
    "typescript": 10,
    "sql": 10,
    "docker": 10,
    "aws": 12,
    "java": 10,
    "html": 5,
    "css": 5,
}

STYLE_INSTRUCTIONS = {
    "standard": "Use a conservative ATS-first layout with neutral colors and compact spacing.",
    "modern": "Use a modern startup layout with clear hierarchy and subtle visual emphasis.",
    "executive": "Use an executive, premium layout with strong typography and minimal visual noise.",
}

app = FastAPI(title="KeyResume API", version="2.2.1")


def _resolve_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if not raw:
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
        ]
    if raw == "*":
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


cors_origins = _resolve_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

ai_client = InferenceClient(model=MODEL_ID, token=HF_TOKEN) if HF_TOKEN else None


def _extract_pdf_text(upload_file: UploadFile) -> str:
    if not upload_file.filename or not upload_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    if upload_file.size is not None and upload_file.size > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File is too large. Maximum allowed size is {MAX_UPLOAD_MB}MB.",
        )

    upload_file.file.seek(0)
    raw = upload_file.file.read()

    # Fallback size check for cases where upload_file.size is None
    if len(raw) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File is too large. Maximum allowed size is {MAX_UPLOAD_MB}MB.",
        )


    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(raw)
        tmp_path = tmp.name

    try:
        text = extract_text(tmp_path).strip()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Failed to read PDF content.") from exc
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            logger.warning("Could not remove temporary file: %s", tmp_path)

    if not text:
        raise HTTPException(status_code=400, detail="No readable text found in this PDF.")
    return text


def _query_ai(system_prompt: str, user_prompt: str, max_tokens: int = 700) -> Optional[str]:
    if not ai_client:
        return None

    try:
        response = ai_client.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.6,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.exception("AI request failed: %s", exc)
        return None


def _score_resume(text: str) -> tuple[int, list[str], list[str]]:
    lowered = text.lower()
    found = [skill for skill in KEYWORDS if skill in lowered]
    missing = [skill for skill in KEYWORDS if skill not in lowered]
    score = min(100, sum(KEYWORDS[s] for s in found))
    return score, found, missing


def _extract_roast_advice(raw_text: str) -> dict:
    payload = raw_text or ""
    parts = payload.split("[ADVICE]", 1)
    roast = payload
    advice = []

    if len(parts) == 2:
        roast = parts[0].replace("[ROAST]", "").strip()
        advice = [line.replace(">", "").strip() for line in parts[1].splitlines() if line.strip()]
    else:
        lines = [line.strip() for line in payload.splitlines() if line.strip()]
        if lines:
            roast = lines[0]
            advice = lines[1:]

    return {"roast": roast, "advice": advice[:6]}


def _fallback_roast_and_advice(score: int, missing_skills: list[str]) -> str:
    roast = (
        "Your resume reads like a feature list without business impact."
        if score >= 65
        else "Your resume is too generic and undersells your technical depth."
    )
    tips = [
        "Quantify results with numbers (latency, revenue, users, defects).",
        "Lead every bullet with action + scope + measurable outcome.",
        "Tailor your skills section to match the target job description.",
        "Add 1-2 standout projects with architecture and tradeoffs.",
    ]
    if missing_skills:
        tips[2] = f"Add relevant skills where truthful: {', '.join(missing_skills[:4])}."

    return "\n".join(["[ROAST]", roast, "", "[ADVICE]", *[f"> {tip}" for tip in tips]])


def _fallback_html_resume(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = html.escape(lines[0]) if lines else "Your Name"
    summary = html.escape(" ".join(lines[1:4])) if len(lines) > 1 else "Experienced professional focused on measurable outcomes."
    bullets = lines[4:10] if len(lines) > 4 else [
        "Delivered customer-facing features with measurable quality gains.",
        "Improved workflow efficiency by automating repetitive tasks.",
        "Collaborated cross-functionally to ship reliable releases on time.",
    ]

    bullets_html = "".join(f"<li>{html.escape(item)}</li>" for item in bullets[:5])
    return f"""
<style>
  body {{ font-family: 'Lora', Georgia, serif; color: #1a1a1a; line-height: 1.6; margin: 0; }}
  .resume {{ max-width: 820px; margin: 28px auto; padding: 24px 28px; border: 1px solid #d8d8d8; border-radius: 10px; }}
  .top {{ border-bottom: 2px solid #0f4c5c; padding-bottom: 12px; margin-bottom: 20px; }}
  h1 {{ margin: 0; font-size: 2.1rem; color: #0f4c5c; }}
  h2 {{ margin-top: 24px; color: #0f4c5c; letter-spacing: .03em; font-size: 1rem; text-transform: uppercase; }}
  ul {{ margin-top: 8px; }}
</style>
<div class="resume">
  <div class="top">
    <h1>{name}</h1>
    <p>{summary}</p>
  </div>
  <h2>Professional Experience</h2>
  <ul>{bullets_html}</ul>
  <h2>Skills</h2>
  <p>Python, JavaScript, SQL, Cloud Platforms, System Design</p>
  <h2>Education</h2>
  <p>Add your degree, institution, and graduation year.</p>
</div>
""".strip()


def _clean_html_output(content: str) -> str:
    cleaned = content.replace("```html", "").replace("```", "").strip()
    if "<" not in cleaned or ">" not in cleaned:
        return f"<p>{cleaned}</p>"
    return cleaned


def _analysis_summary(analysis: ResumeAnalysis) -> dict:
    return {
        "id": analysis.id,
        "user_id": analysis.user_id,
        "ats_score": analysis.ats_score,
        "missing_skills": analysis.missing_skills,
        "created_at": analysis.created_at,
    }


@app.get("/health")
def healthcheck() -> dict:
    return {
        "status": "ok",
        "ai_enabled": bool(ai_client),
        "model": MODEL_ID,
        "cors_origins": cors_origins,
    }


@app.get("/")
def home() -> FileResponse:
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=404, detail="Frontend file not found.")
    return FileResponse(INDEX_FILE)


@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    text = _extract_pdf_text(file)
    score, found_skills, missing_skills = _score_resume(text)
    resume_slice = text[:2200]

    user_prompt = f"""
Analyze this resume text and return exactly this format:

[ROAST]
Two direct, constructive sentences.

[ADVICE]
> Tip 1
> Tip 2
> Tip 3
> Tip 4

Resume:
{resume_slice}
"""
    ai_feedback = _query_ai(
        system_prompt="You are a senior technical recruiter giving sharp, fair feedback.",
        user_prompt=user_prompt,
        max_tokens=500,
    )

    if not ai_feedback:
        ai_feedback = _fallback_roast_and_advice(score=score, missing_skills=missing_skills)

    feedback_data = _extract_roast_advice(ai_feedback)
    analysis_id = None

    try:
        analysis = ResumeAnalysis(
            user_id=None,
            raw_text=text,
            ats_score=score,
            missing_skills=missing_skills,
            feedback_data={
                "roast": feedback_data["roast"],
                "advice": feedback_data["advice"],
                "matched_skills": found_skills,
            },
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        analysis_id = analysis.id
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to persist analysis: %s", exc)

    return {
        "analysis_id": analysis_id,
        "filename": file.filename,
        "ats_score": score,
        "matched_skills": found_skills,
        "missing_skills": missing_skills,
        "roast_and_advice": ai_feedback,
        "ai_enabled": bool(ai_client),
    }


@app.post("/rewrite")
async def rewrite_resume(
    file: UploadFile = File(...),
    style: str = Query(default="standard"),
    analysis_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
) -> dict:
    normalized_style = style.lower().strip()
    if normalized_style not in STYLE_INSTRUCTIONS:
        raise HTTPException(status_code=400, detail="style must be one of: standard, modern, executive")

    text = _extract_pdf_text(file)
    resume_slice = text[:2600]
    style_instruction = STYLE_INSTRUCTIONS[normalized_style]

    user_prompt = f"""
Rewrite this resume into clean, ATS-friendly HTML.
Style: {normalized_style}
Style instruction: {style_instruction}
Rules:
1. Output valid HTML only, no markdown fences.
2. Include sections: Header, Summary, Experience, Skills, Education.
3. Keep content concise and achievement-focused.
4. Use embedded CSS in a <style> tag.

Resume:
{resume_slice}
"""
    ai_html = _query_ai(
        system_prompt="You are an expert resume writer and frontend designer.",
        user_prompt=user_prompt,
        max_tokens=900,
    )

    html_resume = _clean_html_output(ai_html) if ai_html else _fallback_html_resume(text)
    rewrite_id = None

    try:
        rewrite = ResumeRewrite(
            analysis_id=analysis_id,
            target_style=normalized_style,
            html_content=html_resume,
        )
        db.add(rewrite)
        db.commit()
        db.refresh(rewrite)
        rewrite_id = rewrite.id
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to persist rewrite: %s", exc)

    return {
        "rewrite_id": rewrite_id,
        "analysis_id": analysis_id,
        "style": normalized_style,
        "html_resume": html_resume,
        "ai_enabled": bool(ai_client),
    }


@app.get("/history/analyses")
async def get_recent_analyses(
    limit: int = Query(default=10, ge=1, le=100),
    user_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(ResumeAnalysis)

    if user_id is not None:
        query = query.filter(ResumeAnalysis.user_id == user_id)

    try:
        analyses = query.order_by(ResumeAnalysis.created_at.desc()).limit(limit).all()
    except SQLAlchemyError as exc:
        logger.exception("Failed to fetch analyses history: %s", exc)
        raise HTTPException(status_code=503, detail="Database unavailable.")

    return {
        "count": len(analyses),
        "history": [_analysis_summary(analysis) for analysis in analyses],
    }


@app.get("/history/analyses/{analysis_id}")
async def get_analysis_detail(analysis_id: int, db: Session = Depends(get_db)) -> dict:
    try:
        analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id).first()
    except SQLAlchemyError as exc:
        logger.exception("Failed to fetch analysis detail: %s", exc)
        raise HTTPException(status_code=503, detail="Database unavailable.")

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return {
        **_analysis_summary(analysis),
        "feedback_data": analysis.feedback_data or {},
    }


@app.get("/history/rewrites/download/{rewrite_id}")
async def download_rewrite_by_id(rewrite_id: int, db: Session = Depends(get_db)) -> dict:
    try:
        rewrite = db.query(ResumeRewrite).filter(ResumeRewrite.id == rewrite_id).first()
    except SQLAlchemyError as exc:
        logger.exception("Failed to fetch rewrite by id: %s", exc)
        raise HTTPException(status_code=503, detail="Database unavailable.")

    if not rewrite:
        raise HTTPException(status_code=404, detail="Rewrite not found.")

    analysis = None
    if rewrite.analysis_id is not None:
        try:
            analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == rewrite.analysis_id).first()
        except SQLAlchemyError as exc:
            logger.exception("Failed to fetch parent analysis: %s", exc)
            raise HTTPException(status_code=503, detail="Database unavailable.")

    return {
        "id": rewrite.id,
        "analysis_id": rewrite.analysis_id,
        "style": rewrite.target_style,
        "created_at": rewrite.created_at,
        "html_content": rewrite.html_content,
        "original_text": analysis.raw_text if analysis else None,
    }


@app.get("/history/rewrites/{analysis_id}")
async def get_rewrites_for_analysis(analysis_id: int, db: Session = Depends(get_db)) -> dict:
    try:
        rewrites = (
            db.query(ResumeRewrite)
            .filter(ResumeRewrite.analysis_id == analysis_id)
            .order_by(ResumeRewrite.created_at.desc())
            .all()
        )
    except SQLAlchemyError as exc:
        logger.exception("Failed to fetch rewrites history: %s", exc)
        raise HTTPException(status_code=503, detail="Database unavailable.")


    return {
        "analysis_id": analysis_id,
        "count": len(rewrites),
        "rewrites": [
            {
                "id": rewrite.id,
                "style": rewrite.target_style,
                "created_at": rewrite.created_at,
                "html_length": len(rewrite.html_content or ""),
            }
            for rewrite in rewrites
        ],
    }




@app.post("/rewrite/from-analysis/{analysis_id}")
async def rewrite_from_analysis(
    analysis_id: int,
    style: str = Query(default="standard"),
    db: Session = Depends(get_db),
) -> dict:
    normalized_style = style.lower().strip()
    if normalized_style not in STYLE_INSTRUCTIONS:
        raise HTTPException(status_code=400, detail="style must be one of: standard, modern, executive")

    try:
        analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id).first()
    except SQLAlchemyError as exc:
        logger.exception("Failed to load analysis for rewrite generation: %s", exc)
        raise HTTPException(status_code=503, detail="Database unavailable.")

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    resume_slice = (analysis.raw_text or "")[:2600]
    style_instruction = STYLE_INSTRUCTIONS[normalized_style]

    user_prompt = f"""
Rewrite this resume into clean, ATS-friendly HTML.
Style: {normalized_style}
Style instruction: {style_instruction}
Rules:
1. Output valid HTML only, no markdown fences.
2. Include sections: Header, Summary, Experience, Skills, Education.
3. Keep content concise and achievement-focused.
4. Use embedded CSS in a <style> tag.

Resume:
{resume_slice}
"""

    ai_html = _query_ai(
        system_prompt="You are an expert resume writer and frontend designer.",
        user_prompt=user_prompt,
        max_tokens=900,
    )

    html_resume = _clean_html_output(ai_html) if ai_html else _fallback_html_resume(analysis.raw_text or "")
    rewrite_id = None

    try:
        rewrite = ResumeRewrite(
            analysis_id=analysis_id,
            target_style=normalized_style,
            html_content=html_resume,
        )
        db.add(rewrite)
        db.commit()
        db.refresh(rewrite)
        rewrite_id = rewrite.id
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to persist rewrite from analysis: %s", exc)

    return {
        "rewrite_id": rewrite_id,
        "analysis_id": analysis_id,
        "style": normalized_style,
        "html_resume": html_resume,
        "ai_enabled": bool(ai_client),
    }
