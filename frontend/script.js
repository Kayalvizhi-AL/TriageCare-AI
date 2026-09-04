// ========================================
// TRIAGECARE AI
// Frontend → FastAPI Backend
// ========================================


// ---------- EXAMPLE BUTTONS ----------

function useExample(text) {
    document.getElementById("symptoms").value = text;
    document.getElementById("symptoms").focus();
}


// ---------- ANALYZE SYMPTOMS ----------

async function analyzeSymptoms() {

    const symptoms =
        document.getElementById("symptoms").value.trim();


    // Empty input

    if (symptoms === "") {

        alert("Please describe your symptoms first.");

        return;
    }


    // Button

    const button =
        document.getElementById("analyzeButton");


    button.innerHTML =
        "<span>Analyzing...</span><span>⏳</span>";

    button.disabled = true;


    try {

        // Send symptoms to Python backend

        const response = await fetch(
            "http://127.0.0.1:8000/triage",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    symptoms: symptoms
                })
            }
        );


        // Check server response

        if (!response.ok) {

            throw new Error(
                "Backend returned an error."
            );
        }


        // Convert response to JSON

        const result =
            await response.json();


        // Display backend result

        displayResult(result);


    } catch (error) {

        console.error(error);

        alert(
            "Could not connect to the TriageCare AI backend. " +
            "Make sure the FastAPI server is running."
        );

    } finally {

        button.innerHTML =
            "<span>Analyze Symptoms</span>" +
            "<span class='arrow'>→</span>";

        button.disabled = false;
    }
}


// ---------- DISPLAY RESULT ----------

function displayResult(result) {

    const resultCard =
        document.getElementById("resultCard");


    const urgencyBadge =
        document.getElementById("urgencyBadge");


    const department =
        document.getElementById("department");


    const rule =
        document.getElementById("rule");


    const reasoning =
        document.getElementById("reasoning");


    const reviewText =
        document.getElementById("reviewText");


    // Set result values

    urgencyBadge.textContent =
        result.urgency;


    department.textContent =
        result.department;


    rule.textContent =
        result.rule;


    reasoning.textContent =
        result.reasoning;


    // Human review

    if (result.human_review) {

        reviewText.textContent =
            "This case should be reviewed by a healthcare professional.";

    } else {

        reviewText.textContent =
            "No additional human review was triggered by the configured prototype rule.";
    }


    // Badge styling

    urgencyBadge.style.background =
        getUrgencyBackground(result.urgency);


    urgencyBadge.style.color =
        getUrgencyTextColor(result.urgency);


    // Show result

    resultCard.classList.remove("hidden");


    // Scroll to result

    resultCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ---------- URGENCY STYLING ----------

function getUrgencyBackground(urgency) {

    if (urgency === "HIGH") {

        return "#ffe8e8";
    }


    if (urgency === "MODERATE") {

        return "#fff3d6";
    }


    return "#eef1f5";
}


function getUrgencyTextColor(urgency) {

    if (urgency === "HIGH") {

        return "#c62828";
    }


    if (urgency === "MODERATE") {

        return "#9a6700";
    }


    return "#566174";
}


// ---------- VOICE INPUT ----------

const voiceButton =
    document.getElementById("voiceButton");


if ("webkitSpeechRecognition" in window) {

    const recognition =
        new webkitSpeechRecognition();


    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    voiceButton.addEventListener("click", () => {

        recognition.start();

        voiceButton.textContent = "🔴";
    });


    recognition.onresult = (event) => {

        const transcript =
            event.results[0][0].transcript;


        document.getElementById("symptoms").value =
            transcript;


        voiceButton.textContent = "🎤";
    };


    recognition.onerror = () => {

        voiceButton.textContent = "🎤";

        alert(
            "Voice input could not be started. " +
            "You can type your symptoms instead."
        );
    };


    recognition.onend = () => {

        voiceButton.textContent = "🎤";
    };

} else {

    voiceButton.addEventListener("click", () => {

        alert(
            "Voice input is not supported by this browser. " +
            "Please type your symptoms instead."
        );
    });
}