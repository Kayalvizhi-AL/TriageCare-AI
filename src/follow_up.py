# ========================================
# TRIAGECARE AI
# Follow-up Question Engine
# ========================================


FOLLOW_UP_QUESTIONS = {

    "pain_severity": {

        "question":
            "How severe is the pain?",

        "options": [

            {
                "label": "Mild",
                "value": "mild"
            },

            {
                "label": "Moderate",
                "value": "moderate"
            },

            {
                "label": "Severe",
                "value": "severe"
            }

        ]

    },


    "duration_hours": {

        "question":
            "How long have you had these symptoms?",

        "options": [

            {
                "label": "Less than 24 hours",
                "value": 12
            },

            {
                "label": "24–48 hours",
                "value": 36
            },

            {
                "label": "More than 48 hours",
                "value": 49
            }

        ]

    }

}


def get_follow_up_questions(missing_information):

    """
    Convert missing information into
    follow-up questions.

    This module only collects information.
    It does not make medical decisions.
    """

    questions = []


    for field in missing_information:

        if field in FOLLOW_UP_QUESTIONS:

            question_data = FOLLOW_UP_QUESTIONS[field]


            questions.append({

                "field": field,

                "question":
                    question_data["question"],

                "options":
                    question_data["options"]

            })


    return questions