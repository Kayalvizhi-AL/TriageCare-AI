from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models import PatientCase
from .triage_engine import TriageEngine
from .gemini_extractor import GeminiExtractor


# ========================================
# TRIAGECARE AI - FASTAPI BACKEND
# ========================================

app = FastAPI(
    title="TriageCare AI",
    description="AI-assisted patient triage prototype",
    version="1.0"
)


# ========================================
# CORS
# ========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================================
# AI + TRIAGE ENGINE
# ========================================

engine = TriageEngine()
gemini = GeminiExtractor()


# ========================================
# REQUEST MODEL
# ========================================

class SymptomRequest(BaseModel):
    symptoms: str


# ========================================
# HOME / HEALTH CHECK
# ========================================

@app.get("/")
def home():

    return {
        "message": "TriageCare AI backend is running!",
        "status": "online"
    }


# ========================================
# TRIAGE ENDPOINT
# ========================================

@app.post("/triage")
def triage(request: SymptomRequest):

    symptoms = request.symptoms.strip()

    if not symptoms:

        return {
            "error": "Please describe your symptoms."
        }


    # ------------------------------------
    # STEP 1: Gemini extracts facts
    # ------------------------------------

    extracted = gemini.extract_facts(symptoms)


    # ------------------------------------
    # STEP 2: Separate facts and missing info
    # ------------------------------------

    missing_information = extracted.pop(
        "missing_information",
        []
    )


    # Remove empty optional values

    facts = {
        key: value
        for key, value in extracted.items()
        if value is not None
    }


    # ------------------------------------
    # STEP 3: Create PatientCase
    # ------------------------------------

    case = PatientCase(

        complaint=None,

        facts=facts,

        missing_information=missing_information,

        confidence=0.90
    )


    # ------------------------------------
    # STEP 4: Deterministic triage
    # ------------------------------------

    result = engine.evaluate(case)


    # ------------------------------------
    # STEP 5: Return result
    # ------------------------------------

    return {

        "urgency": result.urgency,

        "department": result.department,

        "rule": result.rule_id,

        "rule_name": result.rule_name,

        "reasoning": result.reasoning,

        "patient_reported":
            result.patient_reported,

        "unknown_information":
            result.unknown_information,

        "human_review":
            result.human_review_required
    }