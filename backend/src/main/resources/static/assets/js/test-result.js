const resultLoadingState = document.getElementById("resultLoadingState");
const resultErrorState = document.getElementById("resultErrorState");
const resultErrorText = document.getElementById("resultErrorText");
const resultPageContent = document.getElementById("resultPageContent");

const resultTitle = document.getElementById("resultTitle");
const resultSubject = document.getElementById("resultSubject");
const resultStatusBadge = document.getElementById("resultStatusBadge");
const resultSubmittedAt = document.getElementById("resultSubmittedAt");
const resultScoreMain = document.getElementById("resultScoreMain");
const resultPercentageMain = document.getElementById("resultPercentageMain");

const resultTotalQuestions = document.getElementById("resultTotalQuestions");
const resultAnsweredQuestions = document.getElementById("resultAnsweredQuestions");
const resultCorrectAnswers = document.getElementById("resultCorrectAnswers");
const resultIncorrectAnswers = document.getElementById("resultIncorrectAnswers");
const resultAccuracy = document.getElementById("resultAccuracy");

const resultFocusArea = document.getElementById("resultFocusArea");
const resultTestTip = document.getElementById("resultTestTip");
const resultAnswersList = document.getElementById("resultAnswersList");

const backToTestsBtn = document.getElementById("backToTestsBtn");
const errorBackToTestsBtn = document.getElementById("errorBackToTestsBtn");
const reviewAnswersBtn = document.getElementById("reviewAnswersBtn");
const resultAnswersSection = document.getElementById("resultAnswersSection");

const API_BASE_URL = window.location.origin;
const TESTS_API_URL = `${API_BASE_URL}/api/tests`;

function parseStoredJson(value) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function getStoredUserObject() {
    const possibleKeys = [
        "edumind_logged_in_user",
        "edumind_registered_user",
        "loggedInUser",
        "currentUser",
        "user",
        "authUser",
        "studyPlannerUser"
    ];

    for (const key of possibleKeys) {
        const rawValue = localStorage.getItem(key);
        if (!rawValue) continue;

        const parsed = parseStoredJson(rawValue);
        if (parsed && typeof parsed === "object") {
            return parsed;
        }
    }

    return null;
}

function extractUserIdFromObject(obj) {
    if (!obj || typeof obj !== "object") return null;

    if (obj.id != null && obj.id !== "") return Number(obj.id);
    if (obj.userId != null && obj.userId !== "") return Number(obj.userId);

    if (obj.user && obj.user.id != null && obj.user.id !== "") {
        return Number(obj.user.id);
    }

    if (obj.data && obj.data.id != null && obj.data.id !== "") {
        return Number(obj.data.id);
    }

    return null;
}

function getCurrentUserId() {
    const storedUser = getStoredUserObject();
    const extractedUserId = extractUserIdFromObject(storedUser);

    if (extractedUserId != null && !Number.isNaN(extractedUserId)) {
        return Number(extractedUserId);
    }

    const localUserId = localStorage.getItem("userId");
    if (localUserId != null && localUserId !== "" && !Number.isNaN(Number(localUserId))) {
        return Number(localUserId);
    }

    throw new Error("Logged-in user id not found in localStorage.");
}

function getStoredToken() {
    return (localStorage.getItem("token") || "").trim();
}

function getAuthHeaders(extraHeaders = {}) {
    const token = getStoredToken();

    return {
        "Authorization": `Bearer ${token}`,
        ...extraHeaders
    };
}

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function buildAttemptDetailsApiUrl(attemptId) {
    const userId = getCurrentUserId();
    return `${TESTS_API_URL}/attempts/${encodeURIComponent(attemptId)}?userId=${encodeURIComponent(userId)}`;
}

function extractApiErrorMessage(responseText, responseStatus) {
    if (!responseText) {
        return `HTTP ${responseStatus}`;
    }

    try {
        const parsed = JSON.parse(responseText);
        if (parsed && typeof parsed === "object") {
            return parsed.message || parsed.error || `HTTP ${responseStatus}`;
        }
    } catch (error) {
        // raw text fallback
    }

    return responseText;
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
            ...getAuthHeaders(options.headers || {})
        },
        ...options
    });

    let responseText = "";
    try {
        responseText = await response.text();
    } catch (error) {
        responseText = "";
    }

    if (!response.ok) {
        throw new Error(extractApiErrorMessage(responseText, response.status));
    }

    if (!responseText) {
        return null;
    }

    try {
        return JSON.parse(responseText);
    } catch (error) {
        return null;
    }
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function parseDateValue(dateValue) {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
        return Number.isNaN(dateValue.getTime()) ? null : dateValue;
    }

    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(dateValue) {
    const date = parseDateValue(dateValue);
    if (!date) return "--";

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function normalizeText(value, fallback = "") {
    const text = String(value ?? "").trim();
    return text || fallback;
}

function getStatusClass(answer) {
    const submitted = normalizeText(answer?.submittedAnswer);

    if (!submitted) return "unanswered";
    if (answer?.isCorrect === true) return "correct";
    return "wrong";
}

function getStatusLabel(answer) {
    const submitted = normalizeText(answer?.submittedAnswer);

    if (!submitted) return "Not Answered";
    if (answer?.isCorrect === true) return "Correct";
    return "Incorrect";
}

function showLoading() {
    resultLoadingState?.classList.remove("hidden");
    resultErrorState?.classList.add("hidden");
    resultPageContent?.classList.add("hidden");
}

function showError(message) {
    resultLoadingState?.classList.add("hidden");
    resultPageContent?.classList.add("hidden");
    resultErrorState?.classList.remove("hidden");

    if (resultErrorText) {
        resultErrorText.textContent = message || "We could not load this result.";
    }
}

function showContent() {
    resultLoadingState?.classList.add("hidden");
    resultErrorState?.classList.add("hidden");
    resultPageContent?.classList.remove("hidden");
}

function renderAnswers(answers) {
    if (!resultAnswersList) return;

    if (!Array.isArray(answers) || answers.length === 0) {
        resultAnswersList.innerHTML = `
            <div class="result-answer-empty">
                <i class="fa-regular fa-file-lines"></i>
                <p>Question review will appear here.</p>
            </div>
        `;
        return;
    }

    resultAnswersList.innerHTML = answers.map((answer, index) => {
        const statusClass = getStatusClass(answer);
        const statusLabel = getStatusLabel(answer);
        const questionType = normalizeText(answer.questionType, "Question");
        const focusTopic = normalizeText(answer.focusTopic, "General Concepts");
        const questionText = normalizeText(answer.questionText, "Question text not available.");
        const submittedAnswer = normalizeText(answer.submittedAnswer, "Not Answered");
        const correctAnswer = normalizeText(answer.correctAnswer, "Not available");
        const awardedMarks = Number(answer.marksAwarded ?? 0);
        const totalMarks = Number(answer.totalMarks ?? 0);

        return `
            <div class="result-answer-card">
                <div class="result-answer-top">
                    <div class="result-answer-top-left">
                        <span class="result-question-index">Question ${index + 1}</span>

                        <div class="result-question-meta">
                            <span class="result-meta-chip">${escapeHtml(questionType)}</span>
                            <span class="result-meta-chip">${escapeHtml(focusTopic)}</span>
                        </div>
                    </div>

                    <span class="result-answer-status ${statusClass}">${escapeHtml(statusLabel)}</span>
                </div>

                <h4 class="result-answer-question">${escapeHtml(questionText)}</h4>

                <div class="result-answer-grid">
                    <div class="result-answer-block">
                        <span>Your Answer</span>
                        <p>${escapeHtml(submittedAnswer)}</p>
                    </div>

                    <div class="result-answer-block">
                        <span>Correct Answer</span>
                        <p>${escapeHtml(correctAnswer)}</p>
                    </div>

                    <div class="result-answer-block">
                        <span>Marks</span>
                        <p>${escapeHtml(`${awardedMarks}/${totalMarks}`)}</p>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function renderResultPage(details) {
    const answers = Array.isArray(details?.answers) ? details.answers : [];
    const totalMarks = answers.reduce((sum, item) => sum + Number(item?.totalMarks || 0), 0);
    const totalQuestions = Number(details?.totalQuestions || 0);
    const answeredQuestions = Number(details?.answeredQuestions || 0);
    const correctAnswers = Number(details?.correctAnswers || 0);
    const incorrectAnswers = Math.max(0, answeredQuestions - correctAnswers);
    const accuracy = answeredQuestions > 0
        ? Math.round((correctAnswers / answeredQuestions) * 100)
        : 0;

    if (resultTitle) {
        resultTitle.textContent = normalizeText(details?.title, "Test Result");
    }

    if (resultSubject) {
        resultSubject.textContent = normalizeText(details?.subject, "Subject not available");
    }

    if (resultStatusBadge) {
        resultStatusBadge.textContent = normalizeText(details?.status, "SUBMITTED").toUpperCase();
    }

    if (resultSubmittedAt) {
        resultSubmittedAt.textContent = details?.submittedAt
            ? `Submitted on ${formatDateTime(details.submittedAt)}`
            : "Submitted on --";
    }

    if (resultScoreMain) {
        resultScoreMain.textContent = totalMarks > 0
            ? `${Number(details?.score ?? 0)}/${totalMarks}`
            : `${Number(details?.score ?? 0)}`;
    }

    if (resultPercentageMain) {
        resultPercentageMain.textContent = `${Math.round(Number(details?.percentage ?? 0))}%`;
    }

    if (resultTotalQuestions) {
        resultTotalQuestions.textContent = String(totalQuestions);
    }

    if (resultAnsweredQuestions) {
        resultAnsweredQuestions.textContent = String(answeredQuestions);
    }

    if (resultCorrectAnswers) {
        resultCorrectAnswers.textContent = String(correctAnswers);
    }

    if (resultIncorrectAnswers) {
        resultIncorrectAnswers.textContent = String(incorrectAnswers);
    }

    if (resultAccuracy) {
        resultAccuracy.textContent = `${accuracy}%`;
    }

    if (resultFocusArea) {
        resultFocusArea.textContent = normalizeText(details?.focusArea, "No focus area available.");
    }

    if (resultTestTip) {
        resultTestTip.textContent = normalizeText(details?.testTip, "No test tip available.");
    }

    renderAnswers(answers);
    showContent();
}

async function loadResultPage() {
    try {
        showLoading();

        const attemptId =
            getQueryParam("attemptId") ||
            sessionStorage.getItem("edumind_latest_attempt_id");

        if (!attemptId) {
            throw new Error("Attempt id not found.");
        }

        const details = await fetchJson(buildAttemptDetailsApiUrl(attemptId), {
            method: "GET"
        });

        renderResultPage(details || {});
    } catch (error) {
        console.error("Result page load failed:", error);
        showError(error.message || "We could not load this result.");
    }
}

function bindActions() {
    backToTestsBtn?.addEventListener("click", () => {
        window.location.href = "tests.html";
    });

    errorBackToTestsBtn?.addEventListener("click", () => {
        window.location.href = "tests.html";
    });

    reviewAnswersBtn?.addEventListener("click", () => {
        resultAnswersSection?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}

bindActions();
loadResultPage();