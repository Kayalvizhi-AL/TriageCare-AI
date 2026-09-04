// ========================================
// TRIAGECARE AI
// Premium Frontend Controller
// ========================================


// ========================================
// GLOBAL STATE
// ========================================

let originalSymptoms = "";

let followUpAnswers = {};

let casesAnalyzed = 0;

const HISTORY_KEY =
    "triagecare_history";


// ========================================
// DOM READY
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    const symptoms =
        document.getElementById("symptoms");


    if (symptoms) {

        symptoms.addEventListener(
            "input",
            updateCharacterCount
        );

    }

});


// ========================================
// CHARACTER COUNT
// ========================================

function updateCharacterCount() {

    const symptoms =
        document.getElementById("symptoms");


    const counter =
        document.getElementById("charCount");


    counter.textContent =
        symptoms.value.length;

}


// ========================================
// EXAMPLES
// ========================================

function useExample(text) {

    const symptoms =
        document.getElementById("symptoms");


    symptoms.value = text;


    updateCharacterCount();


    symptoms.focus();

}


// ========================================
// STEP INDICATOR
// ========================================

function setStep(step) {

    const steps = [
        document.getElementById("step1"),
        document.getElementById("step2"),
        document.getElementById("step3")
    ];


    steps.forEach(
        (item, index) => {

            if (!item) return;


            item.classList.remove(
                "active",
                "completed"
            );


            if (index + 1 < step) {

                item.classList.add(
                    "completed"
                );

            }


            if (index + 1 === step) {

                item.classList.add(
                    "active"
                );

            }

        }
    );

}


// ========================================
// ANALYZE SYMPTOMS
// ========================================

async function analyzeSymptoms() {

    const symptoms =
        document
            .getElementById("symptoms")
            .value
            .trim();


    if (symptoms === "") {

        alert(
            "Please describe your symptoms first."
        );

        return;
    }


    originalSymptoms = symptoms;

    followUpAnswers = {};


    document
        .getElementById("followUpCard")
        .classList.add("hidden");


    document
        .getElementById("resultCard")
        .classList.add("hidden");


    setStep(1);


    const button =
        document.getElementById(
            "analyzeButton"
        );


    const text =
        document.getElementById(
            "analyzeText"
        );


    const arrow =
        document.getElementById(
            "analyzeArrow"
        );


    button.disabled = true;


    text.innerHTML =
        'Analyzing<span class="loading-dots"></span>';


    arrow.textContent = "⏳";


    try {

        const result =
            await sendToBackend(
                originalSymptoms,
                followUpAnswers
            );


        displayResult(result);


    } catch (error) {

        console.error(
            "TriageCare AI Error:",
            error
        );


        alert(
            "TriageCare AI Error:\n\n" +
            error.message
        );


    } finally {

        button.disabled = false;


        text.textContent =
            "Analyze Symptoms";


        arrow.textContent = "→";

    }

}


// ========================================
// SEND TO BACKEND
// ========================================

async function sendToBackend(
    symptoms,
    answers
) {

    console.log(
        "Sending request to FastAPI..."
    );


    const response =
        await fetch(
            "http://127.0.0.1:8000/triage",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    symptoms:
                        symptoms,

                    follow_up_answers:
                        answers

                })

            }
        );


    const text =
        await response.text();


    console.log(
        "FastAPI response:",
        text
    );


    if (!response.ok) {

        throw new Error(

            "Backend returned HTTP " +
            response.status +
            "\n\n" +
            text

        );

    }


    try {

        return JSON.parse(text);

    } catch {

        throw new Error(

            "FastAPI returned invalid JSON:\n\n" +
            text

        );

    }

}


// ========================================
// DISPLAY RESULT
// ========================================

function displayResult(result) {

    console.log(
        "Triage result:",
        result
    );

    // If more information is needed,
    // show follow-up questions first.
    if (
        result.status ===
        "FOLLOW_UP_REQUIRED"
    ) {

        setStep(2);

        displayFollowUpQuestions(
            result.follow_up_questions
        );

        return;
    }

    // Only count/display completed triage results
    updateDashboard(result);

    setStep(3);

    const resultCard =
        document.getElementById(
            "resultCard"
        );


    const followUpCard =
        document.getElementById(
            "followUpCard"
        );


    const urgencyBadge =
        document.getElementById(
            "urgencyBadge"
        );


    const department =
        document.getElementById(
            "department"
        );


    const rule =
        document.getElementById(
            "rule"
        );


    const reasoning =
        document.getElementById(
            "reasoning"
        );


    const reviewText =
        document.getElementById(
            "reviewText"
        );


    const extractionSource =
        document.getElementById(
            "extractionSource"
        );


    followUpCard.classList.add(
        "hidden"
    );


    urgencyBadge.textContent =
        result.urgency || "UNKNOWN";


    department.textContent =
        result.department || "—";

    rule.textContent =
        result.rule_name ||
        result.rule_id ||
        "—";


    reasoning.textContent =
        result.reasoning || "—";


    extractionSource.textContent =
        result.extraction_source ||
        "DETERMINISTIC";


    displayPatientFacts(
        result.patient_reported
    );


    displayReviewStatus(
        result.human_review,
        reviewText
    );


    applyUrgencyStyle(
        urgencyBadge,
        result.urgency
    );


    resultCard.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        resultCard.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

    }, 100);

}


// ========================================
// PATIENT FACTS
// ========================================

function displayPatientFacts(facts) {

    const container =
        document.getElementById(
            "patientFacts"
        );


    container.innerHTML = "";


    if (
        !facts ||
        Object.keys(facts).length === 0
    ) {

        container.innerHTML =

            '<div class="fact-item">' +
            '<span>No structured information available</span>' +
            '</div>';

        return;
    }


    const labels = {

        chest_pain:
            "Chest pain",

        breathing_difficulty:
            "Breathing difficulty",

        fever:
            "Fever",

        injury:
            "Injury",

        severe_bleeding:
            "Severe bleeding",

        abdominal_pain:
            "Abdominal pain",

        pain_severity:
            "Pain severity",

        duration_hours:
            "Duration"

    };


    Object.entries(facts).forEach(
        ([key, value]) => {

            if (
                value === null ||
                value === undefined ||
                value === false
            ) {

                return;

            }


            let displayValue =
                value;


            if (key === "duration_hours") {

                displayValue =
                    value + " hours";

            }


            if (
                typeof value === "boolean"
            ) {

                displayValue =
                    value ? "Yes" : "No";

            }


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "fact-item";


            item.innerHTML =

                "<span>" +
                (labels[key] || key) +
                "</span>" +

                "<span class='fact-value'>" +
                displayValue +
                "</span>";


            container.appendChild(
                item
            );

        }
    );


    if (container.children.length === 0) {

        container.innerHTML =

            '<div class="fact-item">' +
            '<span>No additional facts established</span>' +
            '</div>';

    }

}


// ========================================
// REVIEW STATUS
// ========================================

function displayReviewStatus(
    requiresReview,
    reviewText
) {

    const reviewBox =
        document.getElementById(
            "reviewBox"
        );


    if (requiresReview) {

        reviewBox.classList.remove(
            "hidden"
        );


        reviewText.textContent =
            "This prototype flags the case for review by a healthcare professional.";

    } else {

        reviewBox.classList.add(
            "hidden"
        );

    }

}


// ========================================
// URGENCY STYLE
// ========================================

function applyUrgencyStyle(
    badge,
    urgency
) {

    if (urgency === "HIGH") {

        badge.style.background =
            "#ffe8e8";

        badge.style.color =
            "#c62828";

        return;
    }


    if (urgency === "MODERATE") {

        badge.style.background =
            "#fff3d6";

        badge.style.color =
            "#9a6700";

        return;
    }


    badge.style.background =
        "#eef1f5";

    badge.style.color =
        "#566174";

}


// ========================================
// FOLLOW-UP QUESTIONS
// ========================================

function displayFollowUpQuestions(
    questions
) {

    const followUpCard =
        document.getElementById(
            "followUpCard"
        );


    const container =
        document.getElementById(
            "followUpQuestions"
        );


    container.innerHTML = "";


    if (
        !questions ||
        questions.length === 0
    ) {

        return;

    }


    questions.forEach(
        (item, index) => {

            const questionBox =
                document.createElement(
                    "div"
                );


            questionBox.className =
                "follow-up-question";


            const question =
                document.createElement(
                    "h3"
                );


            question.textContent =
                item.question;


            questionBox.appendChild(
                question
            );


            const options =
                document.createElement(
                    "div"
                );


            options.className =
                "follow-up-options";


            item.options.forEach(
                (option) => {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.className =
                        "follow-up-option";


                    button.textContent =
                        option.label;


                    button.addEventListener(
                        "click",
                        () => {

                            handleFollowUpAnswer(

                                item.field,

                                option.value,

                                button,

                                options

                            );

                        }
                    );


                    options.appendChild(
                        button
                    );

                }
            );


            questionBox.appendChild(
                options
            );


            container.appendChild(
                questionBox
            );

        }
    );


    followUpCard.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        followUpCard.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

    }, 100);

}


// ========================================
// HANDLE FOLLOW-UP
// ========================================

async function handleFollowUpAnswer(
    field,
    answer,
    selectedButton,
    optionsContainer
) {

    followUpAnswers[field] =
        answer;


    const buttons =
        optionsContainer.querySelectorAll(
            ".follow-up-option"
        );


    buttons.forEach(
        (button) => {

            button.disabled = true;

        }
    );


    selectedButton.classList.add(
        "selected"
    );


    selectedButton.textContent =
        selectedButton.textContent +
        " ✓";


    const oldMessage =
        document.getElementById(
            "followUpLoading"
        );


    if (oldMessage) {

        oldMessage.remove();

    }


    const loading =
        document.createElement(
            "p"
        );


    loading.id =
        "followUpLoading";


    loading.className =
        "loading-dots";


    loading.textContent =
        "Updating triage information";


    loading.style.marginTop =
        "20px";


    loading.style.color =
        "#1769e0";


    loading.style.fontWeight =
        "600";


    const followUpCard =
        document.getElementById(
            "followUpCard"
        );


    followUpCard.appendChild(
        loading
    );


    try {

        const result =
            await sendToBackend(

                originalSymptoms,

                followUpAnswers

            );


        loading.remove();


        if (
            result.status ===
            "FOLLOW_UP_REQUIRED"
        ) {

            displayFollowUpQuestions(
                result.follow_up_questions
            );

            return;
        }


        displayResult(result);


    } catch (error) {

        console.error(
            "Follow-up error:",
            error
        );


        loading.remove();


        alert(
            "TriageCare AI Error:\n\n" +
            error.message
        );


        buttons.forEach(
            (button) => {

                button.disabled = false;

            }
        );

    }

}


// ========================================
// RESET CASE
// ========================================

function resetCase() {

    originalSymptoms = "";

    followUpAnswers = {};


    document.getElementById(
        "symptoms"
    ).value = "";


    updateCharacterCount();


    document.getElementById(
        "followUpCard"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "resultCard"
    ).classList.add(
        "hidden"
    );


    setStep(1);


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ========================================
// VOICE INPUT
// ========================================

const voiceButton =
    document.getElementById(
        "voiceButton"
    );


if (
    voiceButton &&
    "webkitSpeechRecognition" in window
) {

    const recognition =
        new webkitSpeechRecognition();


    recognition.lang =
        "en-IN";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    voiceButton.addEventListener(
        "click",
        () => {

            try {

                recognition.start();

                voiceButton.textContent =
                    "🔴";

            } catch (error) {

                console.error(
                    "Voice error:",
                    error
                );

            }

        }
    );


    recognition.onresult =
        (event) => {

            const transcript =
                event.results[0][0]
                    .transcript;


            document.getElementById(
                "symptoms"
            ).value =
                transcript;


            updateCharacterCount();


            voiceButton.textContent =
                "🎤";

        };


    recognition.onerror =
        (event) => {

            console.error(
                "Voice recognition error:",
                event
            );


            voiceButton.textContent =
                "🎤";


            alert(
                "Voice input could not be started. " +
                "You can type your symptoms instead."
            );

        };


    recognition.onend =
        () => {

            voiceButton.textContent =
                "🎤";

        };

} else if (voiceButton) {

    voiceButton.addEventListener(
        "click",
        () => {

            alert(
                "Voice input is not supported by this browser. " +
                "Please type your symptoms instead."
            );

        }
    );

}
// ========================================
// DASHBOARD
// ========================================

function updateDashboard(result) {

    casesAnalyzed++;


    const casesElement =
        document.getElementById(
            "casesAnalyzed"
        );


    const sourceElement =
        document.getElementById(
            "dashboardSource"
        );


    const reviewElement =
        document.getElementById(
            "dashboardReview"
        );


    const caseElement =
        document.getElementById(
            "dashboardCase"
        );


    const statusElement =
        document.getElementById(
            "dashboardStatus"
        );


    if (casesElement) {

        casesElement.textContent =
            casesAnalyzed;

    }


    if (sourceElement) {

        sourceElement.textContent =
            result.extraction_source ||
            "DETERMINISTIC";

    }


    if (reviewElement) {

        reviewElement.textContent =
            result.human_review
                ? "Required"
                : "Not triggered";

    }


    if (caseElement) {

        caseElement.textContent =
            originalSymptoms;

    }


    if (statusElement) {

        statusElement.textContent =
            result.urgency ||
            "COMPLETE";

    }


    // Save completed case
    saveToHistory(result);

}
// ========================================
// CASE HISTORY
// ========================================

function saveToHistory(result) {

    const history =
        JSON.parse(
            localStorage.getItem(
                HISTORY_KEY
            ) || "[]"
        );


    const historyItem = {

        symptoms:
            originalSymptoms,

        urgency:
            result.urgency ||
            "UNDETERMINED",

        department:
            result.department ||
            "Human Review",

        rule:
            result.rule_name ||
            result.rule_id ||
            "—",

        reasoning:
            result.reasoning ||
            "—",

        human_review:
            result.human_review ||
            false,

        extraction_source:
            result.extraction_source ||
            "DETERMINISTIC",

        date:
            new Date().toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )

    };


    history.unshift(
        historyItem
    );


    // Keep the latest 20 cases
    const limitedHistory =
        history.slice(0, 20);


    localStorage.setItem(

        HISTORY_KEY,

        JSON.stringify(
            limitedHistory
        )

    );


    renderHistory();

}


// ========================================
// LOAD HISTORY
// ========================================

function loadHistory() {

    renderHistory();

}


// ========================================
// DISPLAY HISTORY
// ========================================

function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );


    if (!container) return;


    const history =
        JSON.parse(
            localStorage.getItem(
                HISTORY_KEY
            ) || "[]"
        );


    if (history.length === 0) {

        container.innerHTML = `

            <div class="history-empty">

                <div class="history-empty-icon">
                    +
                </div>

                <p>
                    No previous analyses yet.
                </p>

                <span>
                    Completed cases will appear here.
                </span>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    history.forEach(
        (item) => {

            const urgency =
                (
                    item.urgency ||
                    "UNDETERMINED"
                ).toLowerCase();


            const historyItem =
                document.createElement(
                    "div"
                );


            historyItem.className =
                "history-item";


            historyItem.innerHTML = `

                <div class="history-content">

                    <div class="history-symptoms">

                        ${escapeHistoryText(
                            item.symptoms
                        )}

                    </div>


                    <div class="history-details">

                        <span class="history-department">

                            ${escapeHistoryText(
                                item.department
                            )}

                        </span>


                        <span class="history-date">

                            ${escapeHistoryText(
                                item.date
                            )}

                        </span>

                    </div>

                </div>


                <div
                    class="history-urgency ${urgency}">

                    ${escapeHistoryText(
                        item.urgency
                    )}

                </div>

            `;


            container.appendChild(
                historyItem
            );

        }
    );

}


// ========================================
// CLEAR HISTORY
// ========================================

function clearHistory() {

    const history =
        JSON.parse(
            localStorage.getItem(
                HISTORY_KEY
            ) || "[]"
        );


    if (history.length === 0) {

        return;

    }


    const confirmed =
        confirm(
            "Clear all saved case history?"
        );


    if (!confirmed) {

        return;

    }


    localStorage.removeItem(
        HISTORY_KEY
    );


    renderHistory();

}


// ========================================
// SAFE TEXT DISPLAY
// ========================================

function escapeHistoryText(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// ========================================
// INITIALIZE HISTORY
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadHistory();

    }
);