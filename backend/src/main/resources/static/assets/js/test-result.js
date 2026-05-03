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

const API_BASE_URL = window.location.port === "8080" ? "" : "http://localhost:8080";
const TESTS_API_URL = `${API_BASE_URL}/api/tests`;

let loadedResultDetails = null;

function parseStoredJson(value) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function decodeJwtPayload(token) {
    try {
        if (!token || !token.includes(".")) return null;

        const payload = token.split(".")[1];
        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = atob(normalizedPayload);

        return JSON.parse(decoded);
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
        const rawValue =
            localStorage.getItem(key) ||
            sessionStorage.getItem(key);

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
    if (obj.studentId != null && obj.studentId !== "") return Number(obj.studentId);

    if (obj.user && obj.user.id != null && obj.user.id !== "") {
        return Number(obj.user.id);
    }

    if (obj.data && obj.data.id != null && obj.data.id !== "") {
        return Number(obj.data.id);
    }

    return null;
}

function getStoredToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("jwtToken") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("jwtToken") ||
        sessionStorage.getItem("accessToken") ||
        ""
    ).trim();
}

function requireAuthToken() {
    const token = getStoredToken();

    if (!token) {
        throw new Error("Missing login token. Please login again.");
    }

    return token;
}

function getCurrentUserId() {
    const storedUser = getStoredUserObject();
    const extractedUserId = extractUserIdFromObject(storedUser);

    if (extractedUserId != null && !Number.isNaN(extractedUserId)) {
        return Number(extractedUserId);
    }

    const localUserId =
        localStorage.getItem("userId") ||
        localStorage.getItem("studentId") ||
        sessionStorage.getItem("userId") ||
        sessionStorage.getItem("studentId");

    if (localUserId != null && localUserId !== "" && !Number.isNaN(Number(localUserId))) {
        return Number(localUserId);
    }

    const payload = decodeJwtPayload(getStoredToken());

    const jwtUserId =
        payload?.userId ||
        payload?.id ||
        payload?.studentId ||
        payload?.uid;

    if (jwtUserId != null && jwtUserId !== "" && !Number.isNaN(Number(jwtUserId))) {
        return Number(jwtUserId);
    }

    if (payload?.sub != null && !Number.isNaN(Number(payload.sub))) {
        return Number(payload.sub);
    }

    throw new Error("Logged-in user id not found. Please login again.");
}

function getAuthHeaders(extraHeaders = {}) {
    const token = requireAuthToken();

    return {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
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
            return parsed.message || parsed.error || parsed.field || `HTTP ${responseStatus}`;
        }
    } catch (error) {
        // raw text fallback
    }

    return responseText;
}

async function fetchJson(url, options = {}) {
    const finalOptions = {
        ...options,
        headers: {
            ...getAuthHeaders(options.headers || {})
        }
    };

    const response = await fetch(url, finalOptions);

    let responseText = "";

    try {
        responseText = await response.text();
    } catch (error) {
        responseText = "";
    }

    if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized. Your session may have expired. Please login again.");
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

function showResultToast(message, type = "info") {
    const oldToast = document.querySelector(".result-toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = `result-toast ${type}`;

    const iconClass =
        type === "success"
            ? "fa-circle-check"
            : type === "error"
                ? "fa-triangle-exclamation"
                : "fa-circle-info";

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    document.body.appendChild(toast);

    if (!document.getElementById("resultToastStyle")) {
        const style = document.createElement("style");
        style.id = "resultToastStyle";
        style.textContent = `
            .result-toast {
                position: fixed;
                top: 22px;
                right: 22px;
                z-index: 999999;
                min-width: 280px;
                max-width: 430px;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 14px 16px;
                border-radius: 14px;
                font-family: "Poppins", sans-serif;
                font-size: 13px;
                font-weight: 700;
                line-height: 1.5;
                color: #ffffff;
                box-shadow: 0 20px 50px rgba(0,0,0,0.35);
                animation: resultToastIn 0.25s ease;
            }

            .result-toast.info {
                background: #164e63;
                border: 1px solid rgba(103,232,249,0.35);
            }

            .result-toast.success {
                background: #065f46;
                border: 1px solid rgba(110,231,183,0.35);
            }

            .result-toast.error {
                background: #7f1d1d;
                border: 1px solid rgba(252,165,165,0.35);
            }

            @keyframes resultToastIn {
                from {
                    opacity: 0;
                    transform: translateY(-8px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;

        document.head.appendChild(style);
    }

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

function redirectToLoginSoon(message) {
    showResultToast(message || "Please login again.", "error");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1200);
}

function escapeHtml(value) {
    return String(value ?? "")
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

function normalizeNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
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

function getPerformanceLevel(percentage) {
    const safePercentage = normalizeNumber(percentage);

    if (safePercentage >= 85) {
        return {
            label: "Excellent",
            message: "Excellent performance. Keep revising consistently and maintain this momentum.",
            className: "excellent"
        };
    }

    if (safePercentage >= 70) {
        return {
            label: "Very Good",
            message: "Strong performance. Review minor mistakes and practice mixed questions.",
            className: "good"
        };
    }

    if (safePercentage >= 50) {
        return {
            label: "Good Attempt",
            message: "Good attempt. Focus on weak areas and reattempt after revision.",
            className: "average"
        };
    }

    return {
        label: "Needs Improvement",
        message: "Revise core concepts first, then solve short practice sets before reattempting.",
        className: "weak"
    };
}

function ensurePerformanceSummaryCard() {
    let card = document.getElementById("resultPerformanceSummaryCard");

    if (card) return card;

    const heroCard = document.querySelector(".result-hero-card");

    if (!heroCard) return null;

    card = document.createElement("section");
    card.id = "resultPerformanceSummaryCard";
    card.className = "result-performance-summary-card";

    heroCard.insertAdjacentElement("afterend", card);

    if (!document.getElementById("resultPerformanceStyle")) {
        const style = document.createElement("style");
        style.id = "resultPerformanceStyle";
        style.textContent = `
            .result-performance-summary-card {
                background: var(--result-surface);
                border: 1px solid var(--result-border);
                border-radius: 16px;
                padding: 18px;
                display: grid;
                grid-template-columns: 220px minmax(0, 1fr);
                gap: 18px;
                box-shadow: var(--result-shadow);
            }

            .result-performance-grade {
                border-radius: 16px;
                padding: 18px;
                color: #ffffff;
                min-height: 120px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 6px;
                background: linear-gradient(135deg, #0b63b6, #0ea5e9);
            }

            .result-performance-grade.excellent {
                background: linear-gradient(135deg, #15803d, #16a34a);
            }

            .result-performance-grade.good {
                background: linear-gradient(135deg, #0369a1, #0ea5e9);
            }

            .result-performance-grade.average {
                background: linear-gradient(135deg, #c2410c, #f97316);
            }

            .result-performance-grade.weak {
                background: linear-gradient(135deg, #b91c1c, #ef4444);
            }

            .result-performance-grade span {
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                opacity: 0.9;
            }

            .result-performance-grade strong {
                font-size: 26px;
                line-height: 1.2;
            }

            .result-performance-details {
                display: flex;
                flex-direction: column;
                gap: 12px;
                justify-content: center;
            }

            .result-performance-details h3 {
                margin: 0;
                font-size: 18px;
                color: var(--result-text);
            }

            .result-performance-details p {
                margin: 0;
                font-size: 14px;
                line-height: 1.8;
                color: var(--result-text-soft);
            }

            .result-progress-wrap {
                width: 100%;
                height: 10px;
                border-radius: 999px;
                background: rgba(148, 163, 184, 0.22);
                overflow: hidden;
            }

            .result-progress-fill {
                height: 100%;
                border-radius: inherit;
                background: linear-gradient(90deg, #0b63b6, #16a34a);
                width: 0%;
                transition: width 0.5s ease;
            }

            @media (max-width: 780px) {
                .result-performance-summary-card {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }

    return card;
}

function renderPerformanceSummary(details) {
    const card = ensurePerformanceSummaryCard();

    if (!card) return;

    const percentage = Math.round(normalizeNumber(details?.percentage));
    const performance = getPerformanceLevel(percentage);

    card.innerHTML = `
        <div class="result-performance-grade ${performance.className}">
            <span>Performance Level</span>
            <strong>${escapeHtml(performance.label)}</strong>
            <small>${percentage}% Score</small>
        </div>

        <div class="result-performance-details">
            <h3>Personalized Result Insight</h3>
            <p>${escapeHtml(performance.message)}</p>

            <div class="result-progress-wrap">
                <div class="result-progress-fill" style="width: ${Math.max(0, Math.min(100, percentage))}%;"></div>
            </div>
        </div>
    `;
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
                <p>No question review is available for this attempt.</p>
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
        const awardedMarks = normalizeNumber(answer.marksAwarded);
        const totalMarks = normalizeNumber(answer.totalMarks);
        const questionOrder = normalizeNumber(answer.questionOrder, index + 1);

        return `
            <div class="result-answer-card ${statusClass}">
                <div class="result-answer-top">
                    <div class="result-answer-top-left">
                        <span class="result-question-index">Question ${questionOrder}</span>

                        <div class="result-question-meta">
                            <span class="result-meta-chip">${escapeHtml(questionType)}</span>
                            <span class="result-meta-chip">${escapeHtml(focusTopic)}</span>
                        </div>
                    </div>

                    <span class="result-answer-status ${statusClass}">${escapeHtml(statusLabel)}</span>
                </div>

                <h4 class="result-answer-question">${escapeHtml(questionText)}</h4>

                <div class="result-answer-grid">
                    <div class="result-answer-block ${statusClass}">
                        <span>Your Answer</span>
                        <p>${escapeHtml(submittedAnswer)}</p>
                    </div>

                    <div class="result-answer-block correct-answer">
                        <span>Correct Answer</span>
                        <p>${escapeHtml(correctAnswer)}</p>
                    </div>

                    <div class="result-answer-block marks-box">
                        <span>Marks Awarded</span>
                        <p>${escapeHtml(`${awardedMarks}/${totalMarks}`)}</p>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function renderResultPage(details) {
    loadedResultDetails = details || {};

    const answers = Array.isArray(details?.answers) ? details.answers : [];
    const calculatedTotalMarks = answers.reduce((sum, item) => sum + normalizeNumber(item?.totalMarks), 0);
    const totalMarks = calculatedTotalMarks > 0 ? calculatedTotalMarks : normalizeNumber(details?.totalMarks);
    const totalQuestions = normalizeNumber(details?.totalQuestions);
    const answeredQuestions = normalizeNumber(details?.answeredQuestions);
    const correctAnswers = normalizeNumber(details?.correctAnswers);
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
            ? `${normalizeNumber(details?.score)}/${totalMarks}`
            : `${normalizeNumber(details?.score)}`;
    }

    if (resultPercentageMain) {
        resultPercentageMain.textContent = `${Math.round(normalizeNumber(details?.percentage))}%`;
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

    renderPerformanceSummary(details);
    renderAnswers(answers);
    showContent();
}

async function loadResultPage() {
    try {
        showLoading();

        requireAuthToken();
        getCurrentUserId();

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
        showResultToast("Result loaded successfully.", "success");

    } catch (error) {
        console.error("Result page load failed:", error);

        const message = String(error.message || "");

        if (
            message.toLowerCase().includes("token") ||
            message.toLowerCase().includes("unauthorized") ||
            message.toLowerCase().includes("user id")
        ) {
            showError("Your session has expired. Redirecting to login...");
            redirectToLoginSoon(message);
            return;
        }

        showError(message || "We could not load this result.");
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