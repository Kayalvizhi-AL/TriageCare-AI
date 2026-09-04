import json
from pathlib import Path

from .models import PatientCase, TriageResult


class TriageEngine:

    def __init__(self, rules_path="data/triage_rules.json"):
        self.rules_path = Path(rules_path)
        self.rules = self._load_rules()

    def _load_rules(self):
        """Load triage rules from JSON."""

        if not self.rules_path.exists():
            raise FileNotFoundError(
                f"Triage rules file not found: {self.rules_path}"
            )

        with open(self.rules_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        return data["rules"]

    def evaluate(self, case: PatientCase) -> TriageResult:
        """Evaluate a patient case against deterministic rules."""

        facts = case.facts

        for rule in self.rules:

            if self._rule_matches(rule, facts):

                return TriageResult(
                    urgency=rule["urgency"],
                    department=rule["department"],
                    rule_id=rule["rule_id"],
                    rule_name=rule["name"],
                    reasoning=rule["reasoning"],
                    patient_reported=facts,
                    follow_up_established={},
                    unknown_information=case.missing_information,
                    human_review_required=rule["human_review_required"]
                )

        # No rule matched.
        # We do NOT guess.

        return TriageResult(
            urgency="UNDETERMINED",
            department="Human Review",
            rule_id="R-DEFAULT-01",
            rule_name="Insufficient information",
            reasoning=(
                "The available information does not reliably "
                "match a configured triage rule."
            ),
            patient_reported=facts,
            follow_up_established={},
            unknown_information=case.missing_information,
            human_review_required=True
        )

    def _rule_matches(self, rule, facts):
        """Check whether all conditions in a rule are satisfied."""

        conditions = rule.get("conditions", [])

        for condition in conditions:

            fact_name = condition["fact"]
            operator = condition["operator"]
            expected_value = condition["value"]

            actual_value = facts.get(fact_name)

            if not self._condition_matches(
                actual_value,
                operator,
                expected_value
            ):
                return False

        return True

    def _condition_matches(
        self,
        actual_value,
        operator,
        expected_value
    ):
        """Evaluate one condition."""

        if operator == "equals":
            return actual_value == expected_value

        if operator == "not_equals":
            return actual_value != expected_value

        if operator == "exists":
            return actual_value is not None

        if operator == "contains":

            if actual_value is None:
                return False

            if isinstance(actual_value, list):
                return expected_value in actual_value

            return str(expected_value).lower() in str(
                actual_value
            ).lower()

        if operator == "greater_than":

            try:
                return float(actual_value) > float(expected_value)
            except (TypeError, ValueError):
                return False

        if operator == "less_than":

            try:
                return float(actual_value) < float(expected_value)
            except (TypeError, ValueError):
                return False

        return False