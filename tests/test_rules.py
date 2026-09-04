from src.models import PatientCase
from src.triage_engine import TriageEngine


def test_chest_pain_case():

    engine = TriageEngine()

    case = PatientCase(
        complaint="chest_pain",
        facts={
            "chest_pain": True,
            "breathing_difficulty": True,
            "pain_severity": "moderate"
        },
        confidence=0.95
    )

    result = engine.evaluate(case)

    print("\n--- TEST 1 ---")
    print("Urgency:", result.urgency)
    print("Department:", result.department)
    print("Rule:", result.rule_id)
    print("Reason:", result.reasoning)
    print("Human Review:", result.human_review_required)


def test_fever_case():

    engine = TriageEngine()

    case = PatientCase(
        complaint="fever",
        facts={
            "fever": True,
            "duration_hours": 48
        },
        confidence=0.90
    )

    result = engine.evaluate(case)

    print("\n--- TEST 2 ---")
    print("Urgency:", result.urgency)
    print("Department:", result.department)
    print("Rule:", result.rule_id)


def test_unknown_case():

    engine = TriageEngine()

    case = PatientCase(
        complaint=None,
        facts={
            "something_wrong": True
        },
        missing_information=[
            "complaint_type"
        ],
        confidence=0.20
    )

    result = engine.evaluate(case)

    print("\n--- TEST 3 ---")
    print("Urgency:", result.urgency)
    print("Department:", result.department)
    print("Rule:", result.rule_id)
    print("Human Review:", result.human_review_required)


if __name__ == "__main__":

    test_chest_pain_case()
    test_fever_case()
    test_unknown_case()