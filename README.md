# TriageCare AI

### AI-Assisted Patient Triage & Department Routing

TriageCare AI is a hackathon project built for **PS01**. The idea is simple: a patient describes what they are experiencing in normal everyday language, and the system extracts the important information and suggests how the case could be routed.

Instead of letting AI make the final decision, we use **Gemini for information extraction** and a **rule-based Python engine for the actual triage decision**. This makes the result easier to understand, test, and explain.

> **Note:** This is a hackathon prototype only. It is not a medical diagnosis tool and should not be used as a replacement for professional medical care.

---

## What problem are we trying to solve?

Patients don't always describe their symptoms in a structured format.

For example, someone might simply type:

> "I've been having chest pain and it's difficult to breathe."

A healthcare system still needs to identify the important information from that sentence before deciding where the case should be routed.

Our project demonstrates how this process can be made more structured and explainable.

---

## How TriageCare AI works

The basic flow is:

```text
Patient describes symptoms
          ↓
       Gemini AI
          ↓
Important information is extracted
          ↓
   Triage Rule Engine
          ↓
   Triage Result
          ↓
Urgency + Department + Reasoning
          ↓
Human Review when required
```

Gemini does **not** decide the final urgency.

It only helps convert the patient's natural-language description into structured information.

The Python rule engine then checks those facts against the rules stored in:

```text
data/triage_rules.json
```

---

## Main Features

### Natural Language Input

Patients can describe their symptoms in their own words instead of filling out a complicated form.

### Gemini-Powered Information Extraction

Gemini identifies information such as:

* Chest pain
* Breathing difficulty
* Fever
* Injury
* Severe bleeding
* Abdominal pain
* Pain severity
* Duration

It also identifies information that is missing.

### Rule-Based Triage

After the information is extracted, the Python engine checks it against predefined rules.

For example, a case containing both chest pain and breathing difficulty can match a configured high-urgency prototype rule.

### Explainable Results

Instead of simply showing an urgency level, the application also shows:

* Recommended department
* Rule that was triggered
* Reasoning behind the result
* Information reported by the patient
* Missing information
* Whether human review is required

### Human-in-the-Loop

If a case matches a high-risk prototype rule or there isn't enough information to make a reliable match, the system can flag it for human review.

We designed this so that the system **doesn't simply guess when information is insufficient**.

### Voice Input

The frontend also supports browser-based voice input where speech recognition is available.

---

## Technologies Used

### Frontend

* HTML
* CSS
* JavaScript
* Browser Speech Recognition API

### Backend

* Python
* FastAPI
* Uvicorn

### AI

* Google Gemini
* `google-genai`

### Other

* JSON for configurable triage rules
* Python dataclasses
* `.env` for API key configuration

---

## Project Structure

```text
TriageCare-AI/
│
├── data/
│   └── triage_rules.json
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── src/
│   ├── __init__.py
│   ├── models.py
│   ├── triage_engine.py
│   ├── gemini_extractor.py
│   └── main.py
│
├── tests/
│   └── test_rules.py
│
├── .env
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Running the Project

### 1. Install Python

Make sure Python is installed on your computer.

Check it using:

```bash
python --version
```

### 2. Install the dependencies

From the project folder:

```bash
pip install -r requirements.txt
```

### 3. Add your Gemini API key

Create a `.env` file in the project folder:

```text
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

**Never upload your actual API key to GitHub.**

### 4. Start the backend

Run:

```bash
python -m uvicorn src.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

You can also open the API documentation at:

```text
http://127.0.0.1:8000/docs
```

### 5. Start the frontend

Open:

```text
frontend/index.html
```

using VS Code Live Server or another local web server.

---

## Testing

We tested the system using different types of cases.

### Example 1 — High urgency

```text
I have chest pain and difficulty breathing.
```

The prototype identifies:

```text
Urgency: HIGH
Department: Emergency / Immediate Assessment
Rule: R-CHP-01
Human Review: Yes
```

### Example 2 — Fever

```text
I have had a fever for 48 hours.
```

The prototype identifies:

```text
Urgency: MODERATE
Department: General Medicine
Rule: R-FEV-01
```

### Example 3 — Abdominal pain

```text
I have moderate abdominal pain.
```

The prototype identifies:

```text
Urgency: MODERATE
Department: General Medicine
Rule: R-ABD-01
```

### Example 4 — Injury

```text
I have an injury with severe bleeding.
```

The prototype identifies:

```text
Urgency: HIGH
Department: Emergency / Immediate Assessment
Rule: R-INJ-01
Human Review: Yes
```

### Example 5 — Not enough information

```text
I don't feel well and something seems wrong.
```

Instead of guessing, the system returns:

```text
Urgency: UNDETERMINED
Department: Human Review
```

---

## Responsible AI Approach

Since this project deals with healthcare-related information, we wanted the system to be careful about how AI is used.

### AI is used for extraction, not diagnosis

Gemini helps identify information from what the patient says. It does not diagnose a disease.

### The final decision is rule-based

The triage engine uses predefined rules rather than allowing the AI model to freely decide the outcome.

### The system can say "I don't know"

If the available information doesn't match a configured rule, the system returns **UNDETERMINED** instead of making up an answer.

### Human review is supported

Certain prototype cases are flagged for human review.

### Minimal information

The prototype doesn't require unnecessary personal information from the user.

---

## Future Improvements

There are several things we would like to add if we continue developing the project:

* Smart follow-up questions
* More configurable triage rules
* Multilingual input
* Better accessibility
* Retrieval-augmented grounding
* Healthcare professional review dashboard
* Secure authentication
* Audit logs
* Better deployment and security
* Clinical validation with qualified healthcare professionals
* Integration with existing healthcare systems

---

## Hackathon Demo

Our recommended demo flow is:

```text
1. Open TriageCare AI
        ↓
2. Enter a symptom description
        ↓
3. Click "Analyze Symptoms"
        ↓
4. Gemini extracts the important information
        ↓
5. Python checks the configured rules
        ↓
6. Result is displayed
        ↓
7. Show the rule and reasoning
        ↓
8. Demonstrate the human-review case
```

This allows the judges to see both the **AI part** and the **explainable rule-based decision system**.

---

## Current Status

**Hackathon Prototype**

Implemented:

* Natural-language symptom input
* Gemini information extraction
* Missing-information detection
* Deterministic triage engine
* JSON-based rules
* FastAPI backend
* Browser frontend
* Explainable results
* Human-in-the-loop handling
* Voice input
* Multiple test cases

---

## Disclaimer

TriageCare AI is a student hackathon prototype created for demonstration purposes.

It is **not a medical diagnosis system or a replacement for professional medical advice**.

The triage rules currently included in this project are demonstration rules and have **not been clinically validated**.

---

## Built for the Hackathon

**Project:** TriageCare AI
**Problem Statement:** PS01
**Type:** AI-assisted browser-based healthcare triage prototype
