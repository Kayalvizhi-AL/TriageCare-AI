from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class PatientCase:
    """
    Structured information extracted from the patient's description.

    This represents reported information only.
    It is NOT a medical diagnosis.
    """

    complaint: Optional[str] = None

    facts: Dict[str, object] = field(default_factory=dict)

    missing_information: List[str] = field(default_factory=list)

    confidence: float = 0.0


@dataclass
class TriageResult:
    """
    Result produced by the deterministic triage engine.
    """

    urgency: str

    department: str

    rule_id: str

    rule_name: str

    reasoning: str

    patient_reported: Dict[str, object] = field(default_factory=dict)

    follow_up_established: Dict[str, object] = field(default_factory=dict)

    unknown_information: List[str] = field(default_factory=list)

    human_review_required: bool = False