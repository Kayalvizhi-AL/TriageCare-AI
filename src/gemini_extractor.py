import json
import os

from google import genai
from google.genai import types
from dotenv import load_dotenv


load_dotenv()


class GeminiExtractor:

    def __init__(self):

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY was not found in the .env file."
            )

        self.client = genai.Client(
            api_key=api_key
        )

        self.model = "gemini-3.6-flash"


    def extract_facts(self, symptoms: str):

        prompt = f"""
You are an information extraction assistant for a
healthcare triage prototype.

ONLY extract information explicitly reported by the patient.

Do NOT diagnose.
Do NOT recommend treatment.
Do NOT invent information.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "chest_pain": false,
    "breathing_difficulty": false,
    "fever": false,
    "injury": false,
    "severe_bleeding": false,
    "abdominal_pain": false,
    "pain_severity": null,
    "duration_hours": null,
    "missing_information": []
}}

Patient description:

{symptoms}
"""

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0,
                response_mime_type="application/json"
            )
        )

        if not response.text:
            raise ValueError(
                "Gemini returned an empty response."
            )

        try:
            data = json.loads(response.text)

        except json.JSONDecodeError:
            raise ValueError(
                "Gemini returned invalid JSON:\n"
                + response.text
            )

        return data