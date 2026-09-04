from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import os

from .models import PatientCase
from .triage_engine import TriageEngine
from .gemini_extractor import GeminiExtractor
from .follow_up import get_follow_up_questions


# ============================================================
# TRIAGECARE AI
# Main FastAPI Backend
# ============================================================


# ============================================================
# CREATE FASTAPI APP
# ============================================================

app = FastAPI(
    title="TriageCare AI",
    description="AI-assisted patient triage prototype",
    version="1.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],

    allow_credentials=False,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ============================================================
# INITIALIZE TRIAGE ENGINE
# ============================================================

engine = TriageEngine()


# ============================================================
# INITIALIZE GEMINI
# ============================================================

gemini = None

try:

    gemini = GeminiExtractor()

    print("========================================")
    print("Gemini extractor initialized.")
    print("========================================")

except Exception as error:

    print("========================================")
    print("Gemini initialization failed.")
    print("Fallback extraction will be available.")
    print("Error:", str(error))
    print("========================================")


# ============================================================
# DEMO MODE
# ============================================================

DEMO_MODE = (
    os.getenv(
        "DEMO_MODE",
        "false"
    ).lower()
    == "true"
)


# ============================================================
# REQUEST MODEL
# ============================================================

class SymptomRequest(BaseModel):

    symptoms: str

    follow_up_answers: Optional[
        Dict[str, object]
    ] = None


# ============================================================
# DEMO / FALLBACK FACT EXTRACTION
# ============================================================

def extract_demo_facts(symptoms: str):
    """
    Deterministic fallback fact extractor.

    This is NOT the triage engine.

    Its only purpose is to extract a small set
    of explicitly mentioned facts when Gemini
    is unavailable or DEMO_MODE is enabled.

    The final triage decision is still made by
    TriageEngine.
    """

    text = symptoms.lower()


    # --------------------------------------------------------
    # Default facts
    # --------------------------------------------------------

    facts = {

        "chest_pain": False,

        "breathing_difficulty": False,

        "fever": False,

        "injury": False,

        "severe_bleeding": False,

        "abdominal_pain": False,

        "pain_severity": None,

        "duration_hours": None,

        "missing_information": []

    }


    # ========================================================
    # CHEST PAIN
    # ========================================================

    if (
        "chest pain" in text
        or "chest hurts" in text
        or "pain in my chest" in text
        or "chest is hurting" in text
    ):

        facts["chest_pain"] = True


    # ========================================================
    # BREATHING DIFFICULTY
    # ========================================================

    if (
        "difficulty breathing" in text
        or "difficult to breathe" in text
        or "difficulty in breathing" in text
        or "trouble breathing" in text
        or "shortness of breath" in text
        or "breathing problem" in text
        or "can't breathe" in text
        or "cannot breathe" in text
    ):

        facts["breathing_difficulty"] = True


    # ========================================================
    # FEVER
    # ========================================================

    if (
        "fever" in text
        or "high temperature" in text
        or "temperature" in text
    ):

        facts["fever"] = True


    # ========================================================
    # INJURY
    # ========================================================

    if (
        "injury" in text
        or "injured" in text
        or "accident" in text
        or "wound" in text
        or "hurt myself" in text
    ):

        facts["injury"] = True


    # ========================================================
    # SEVERE BLEEDING
    # ========================================================

    if (
        "severe bleeding" in text
        or "heavy bleeding" in text
        or "bleeding heavily" in text
        or "bleeding a lot" in text
    ):

        facts["severe_bleeding"] = True


    # ========================================================
    # ABDOMINAL PAIN
    # ========================================================

    if (
        "abdominal pain" in text
        or "stomach pain" in text
        or "pain in my stomach" in text
        or "stomach hurts" in text
    ):

        facts["abdominal_pain"] = True


    # ========================================================
    # PAIN SEVERITY
    # ========================================================

    if "severe" in text:

        facts["pain_severity"] = "severe"

    elif "moderate" in text:

        facts["pain_severity"] = "moderate"

    elif "mild" in text:

        facts["pain_severity"] = "mild"


    # ========================================================
    # DURATION / TIME
    # ========================================================
    #
    # These are prototype bucket values.
    #
    # Less than 24h -> 12
    # 24-48h       -> 36
    # More than 48 -> 49
    #
    # These values are only used by the configured
    # prototype rule R-FEV-01.
    # ========================================================

    if (
        "more than 48 hours" in text
        or "more than 48 hour" in text
        or "more than two days" in text
        or "more than 2 days" in text
        or "over 48 hours" in text
        or "over two days" in text
        or "over 2 days" in text
    ):

        facts["duration_hours"] = 49


    elif (
        "48 hours" in text
        or "48 hour" in text
        or "2 days" in text
        or "two days" in text
    ):

        facts["duration_hours"] = 36


    elif (
        "24 hours" in text
        or "24 hour" in text
        or "1 day" in text
        or "one day" in text
        or "36 hours" in text
        or "36 hour" in text
    ):

        facts["duration_hours"] = 36


    elif (
        "less than 24 hours" in text
        or "less than 24 hour" in text
        or "today" in text
        or "a few hours" in text
        or "few hours" in text
    ):

        facts["duration_hours"] = 12


    # ========================================================
    # FOLLOW-UP QUESTIONS
    # ========================================================

    # --------------------------------------------------------
    # Ask duration when it was not explicitly provided.
    # --------------------------------------------------------

    if facts["duration_hours"] is None:

        facts["missing_information"].append(
            "duration_hours"
        )


    # --------------------------------------------------------
    # Ask pain severity when relevant.
    # --------------------------------------------------------

    if (
        (
            facts["chest_pain"]
            or facts["abdominal_pain"]
        )
        and facts["pain_severity"] is None
    ):

        facts["missing_information"].append(
            "pain_severity"
        )


    return facts


# ============================================================
# EXTRACT FACTS
# ============================================================

def extract_facts(symptoms: str):
    """
    Extraction priority:

    1. DEMO_MODE -> deterministic fallback
    2. Gemini -> AI extraction
    3. Gemini quota/error -> deterministic fallback

    Returns:

        extracted_facts
        extraction_source
    """


    # ========================================================
    # DEMO MODE
    # ========================================================

    if DEMO_MODE:

        print("----------------------------------------")
        print("DEMO MODE ENABLED")
        print("Gemini request skipped.")
        print("----------------------------------------")

        return (
            extract_demo_facts(symptoms),
            "DEMO"
        )


    # ========================================================
    # GEMINI NOT AVAILABLE
    # ========================================================

    if gemini is None:

        print("----------------------------------------")
        print("Gemini is unavailable.")
        print("Using fallback extraction.")
        print("----------------------------------------")

        return (
            extract_demo_facts(symptoms),
            "FALLBACK"
        )


    # ========================================================
    # TRY GEMINI
    # ========================================================

    try:

        extracted = gemini.extract_facts(
            symptoms
        )

        print("----------------------------------------")
        print("Gemini extraction successful.")
        print("----------------------------------------")

        return (
            extracted,
            "GEMINI"
        )


    except Exception as error:

        error_text = str(error)


        print("----------------------------------------")
        print("Gemini extraction failed.")
        print(error_text)
        print("----------------------------------------")


        # ====================================================
        # GEMINI QUOTA / RATE LIMIT
        # ====================================================

        if (
            "429" in error_text
            or "RESOURCE_EXHAUSTED"
            in error_text
            or "quota"
            in error_text.lower()
            or "rate limit"
            in error_text.lower()
        ):

            print("----------------------------------------")
            print("Gemini quota exceeded.")
            print("Using deterministic fallback.")
            print("----------------------------------------")

            return (
                extract_demo_facts(symptoms),
                "QUOTA_FALLBACK"
            )


        # ====================================================
        # OTHER GEMINI FAILURE
        # ====================================================

        print("----------------------------------------")
        print("Gemini unavailable.")
        print("Using deterministic fallback.")
        print("----------------------------------------")

        return (
            extract_demo_facts(symptoms),
            "FALLBACK"
        )


# ============================================================
# HOME / HEALTH CHECK
# ============================================================

@app.get("/")
def home():

    return {

        "message":
            "TriageCare AI backend is running!",

        "status":
            "online",

        "demo_mode":
            DEMO_MODE,

        "gemini_available":
            gemini is not None

    }


# ============================================================
# TRIAGE ENDPOINT
# ============================================================

@app.post("/triage")
def triage(request: SymptomRequest):


    # ========================================================
    # VALIDATE INPUT
    # ========================================================

    symptoms = request.symptoms.strip()


    if not symptoms:

        raise HTTPException(

            status_code=400,

            detail={
                "error":
                    "EMPTY_SYMPTOMS",

                "message":
                    "Please describe your symptoms."
            }

        )


    # ========================================================
    # EXTRACT FACTS
    # ========================================================

    extracted, extraction_source = (
        extract_facts(symptoms)
    )


    # ========================================================
    # SAFELY GET MISSING INFORMATION
    # ========================================================

    missing_information = extracted.pop(
        "missing_information",
        []
    )


    if missing_information is None:

        missing_information = []


    # ========================================================
    # FOLLOW-UP ANSWERS
    # ========================================================

    follow_up_answers = (
        request.follow_up_answers or {}
    )


    # Apply answers supplied by frontend.

    for field, answer in (
        follow_up_answers.items()
    ):

        extracted[field] = answer


    # ========================================================
    # REMOVE ANSWERED QUESTIONS
    # ========================================================

    missing_information = [

        field

        for field in missing_information

        if field not in follow_up_answers

    ]


    # ========================================================
    # REMOVE NULL VALUES
    # ========================================================

    facts = {

        key: value

        for key, value in extracted.items()

        if value is not None

    }


    # ========================================================
    # CREATE PATIENT CASE
    # ========================================================

    case = PatientCase(

        complaint=None,

        facts=facts,

        missing_information=
            missing_information,

        confidence=0.90

    )


    # ========================================================
    # GENERATE FOLLOW-UP QUESTIONS
    # ========================================================

    follow_up_questions = (
        get_follow_up_questions(
            missing_information
        )
    )


    # ========================================================
    # FOLLOW-UP REQUIRED
    # ========================================================

    if follow_up_questions:

        return {

            "status":
                "FOLLOW_UP_REQUIRED",

            "extraction_source":
                extraction_source,

            "follow_up_questions":
                follow_up_questions,

            "patient_reported":
                facts,

            "unknown_information":
                missing_information

        }


    # ========================================================
    # DETERMINISTIC TRIAGE ENGINE
    # ========================================================

    result = engine.evaluate(case)


    # ========================================================
    # FINAL RESULT
    # ========================================================

    return {

        "status":
            "TRIAGE_COMPLETE",

        "urgency":
            result.urgency,

        "department":
            result.department,

        "rule":
            result.rule_id,

        "rule_name":
            result.rule_name,

        "reasoning":
            result.reasoning,

        "patient_reported":
            result.patient_reported,

        "unknown_information":
            result.unknown_information,

        "human_review":
            result.human_review_required,

        "extraction_source":
            extraction_source

    }