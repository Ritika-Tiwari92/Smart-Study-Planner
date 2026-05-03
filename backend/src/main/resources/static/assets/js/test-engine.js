const examLanguageSelect = document.getElementById("examLanguageSelect");
const examRemainingTime = document.getElementById("examRemainingTime");
const engineHeaderTimer = document.getElementById("engineHeaderTimer");

const examCandidateName = document.getElementById("examCandidateName");
const examNameValue = document.getElementById("examNameValue");
const examSubjectValue = document.getElementById("examSubjectValue");
const examTotalQuestionsValue = document.getElementById("examTotalQuestionsValue");

const engineQuestionTypeTop = document.getElementById("engineQuestionTypeTop");
const engineCurrentQuestionTop = document.getElementById("engineCurrentQuestionTop");

const engineSectionName = document.getElementById("engineSectionName");
const engineQuestionProgressChip = document.getElementById("engineQuestionProgressChip");

const sidebarCandidateImage = document.getElementById("sidebarCandidateImage");
const sidebarCandidateName = document.getElementById("sidebarCandidateName");
const sidebarCandidateSubject = document.getElementById("sidebarCandidateSubject");
const sidebarExamName = document.getElementById("sidebarExamName");
const sidebarCurrentQuestion = document.getElementById("sidebarCurrentQuestion");

const engineQuestionNumber = document.getElementById("engineQuestionNumber");
const engineQuestionMeta = document.getElementById("engineQuestionMeta");
const engineFocusTopicWrap = document.getElementById("engineFocusTopicWrap");
const engineFocusTopic = document.getElementById("engineFocusTopic");
const engineQuestionText = document.getElementById("engineQuestionText");
const engineOptionsList = document.getElementById("engineOptionsList");
const engineTheoryWrap = document.getElementById("engineTheoryWrap");
const engineTheoryAnswer = document.getElementById("engineTheoryAnswer");

const engineSaveNextBtn = document.getElementById("engineSaveNextBtn");
const engineClearResponseBtn = document.getElementById("engineClearResponseBtn");
const engineSaveMarkReviewBtn = document.getElementById("engineSaveMarkReviewBtn");
const engineMarkReviewNextBtn = document.getElementById("engineMarkReviewNextBtn");
const enginePrevBtn = document.getElementById("enginePrevBtn");
const engineNextBtn = document.getElementById("engineNextBtn");
const engineSubmitBtn = document.getElementById("engineSubmitBtn");

const legendNotVisitedCount = document.getElementById("legendNotVisitedCount");
const legendNotAnsweredCount = document.getElementById("legendNotAnsweredCount");
const legendAnsweredCount = document.getElementById("legendAnsweredCount");
const legendMarkedCount = document.getElementById("legendMarkedCount");
const legendAnsweredMarkedCount = document.getElementById("legendAnsweredMarkedCount");

const engineQuestionPalette = document.getElementById("engineQuestionPalette");
const enginePaletteCollapseBtn = document.getElementById("enginePaletteCollapseBtn");

const submitSummaryOverlay = document.getElementById("submitSummaryOverlay");
const closeSubmitSummaryBtn = document.getElementById("closeSubmitSummaryBtn");
const cancelSubmitSummaryBtn = document.getElementById("cancelSubmitSummaryBtn");
const confirmFinalSubmitBtn = document.getElementById("confirmFinalSubmitBtn");

const summaryExamName = document.getElementById("summaryExamName");
const summarySubjectName = document.getElementById("summarySubjectName");
const summaryRemainingTime = document.getElementById("summaryRemainingTime");
const summaryTotalQuestions = document.getElementById("summaryTotalQuestions");
const summaryAnswered = document.getElementById("summaryAnswered");
const summaryNotAnswered = document.getElementById("summaryNotAnswered");
const summaryMarked = document.getElementById("summaryMarked");
const summaryAnsweredMarked = document.getElementById("summaryAnsweredMarked");
const summaryNotVisited = document.getElementById("summaryNotVisited");

const API_BASE_URL = window.location.port === "8080" ? "" : "http://localhost:8080";
const TESTS_API_URL = `${API_BASE_URL}/api/tests`;

const DEFAULT_CANDIDATE_IMAGE = "../assets/avatar/default-user.png";

const STATUS = {
    NOT_VISITED: "not-visited",
    NOT_ANSWERED: "not-answered",
    ANSWERED: "answered",
    MARKED: "marked",
    ANSWERED_MARKED: "answered-marked"
};

let examSession = null;
let timerInterval = null;
let timerEndAt = null;
let submitInProgress = false;
let paletteCollapsed = false;

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

function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("jwtToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("adminToken") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("jwtToken") ||
        sessionStorage.getItem("accessToken") ||
        ""
    );
}

function requireAuthToken() {
    const token = getAuthToken();

    if (!token || !String(token).trim()) {
        throw new Error("Missing login token. Please login again.");
    }

    return token.trim();
}

function redirectToLoginSoon(message) {
    showEngineToast(message || "Session expired. Please login again.", "error");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1200);
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
        const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (!raw) continue;

        const parsed = parseStoredJson(raw);
        if (parsed && typeof parsed === "object") {
            return parsed;
        }
    }

    return null;
}

function getCurrentUserId() {
    const user = getStoredUserObject();

    if (user && user.id != null && user.id !== "") {
        return Number(user.id);
    }

    if (user && user.userId != null && user.userId !== "") {
        return Number(user.userId);
    }

    if (user && user.studentId != null && user.studentId !== "") {
        return Number(user.studentId);
    }

    const directUserId =
        localStorage.getItem("userId") ||
        localStorage.getItem("studentId") ||
        sessionStorage.getItem("userId") ||
        sessionStorage.getItem("studentId");

    if (directUserId && !Number.isNaN(Number(directUserId))) {
        return Number(directUserId);
    }

    const tokenPayload = decodeJwtPayload(getAuthToken());

    const jwtUserId =
        tokenPayload?.userId ||
        tokenPayload?.id ||
        tokenPayload?.studentId ||
        tokenPayload?.uid;

    if (jwtUserId != null && jwtUserId !== "" && !Number.isNaN(Number(jwtUserId))) {
        return Number(jwtUserId);
    }

    if (tokenPayload?.sub != null && !Number.isNaN(Number(tokenPayload.sub))) {
        return Number(tokenPayload.sub);
    }

    throw new Error("Logged-in user id not found. Please login again.");
}

function getCurrentUserName() {
    const user = getStoredUserObject();

    if (!user) {
        const payload = decodeJwtPayload(getAuthToken());
        return payload?.name || payload?.fullName || payload?.email || "Student";
    }

    const candidate =
        user.name ||
        user.fullName ||
        user.username ||
        user.email ||
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

    return candidate || "Student";
}

function getCandidateImageUrl() {
    const user = getStoredUserObject();
    if (!user) return DEFAULT_CANDIDATE_IMAGE;

    const possibleImage =
        user.profilePhoto ||
        user.profileImage ||
        user.photo ||
        user.image ||
        user.avatar ||
        "";

    const trimmed = String(possibleImage || "").trim();
    return trimmed || DEFAULT_CANDIDATE_IMAGE;
}

function setCandidateImage() {
    if (!sidebarCandidateImage) return;

    sidebarCandidateImage.src = getCandidateImageUrl();
    sidebarCandidateImage.onerror = function () {
        sidebarCandidateImage.onerror = null;
        sidebarCandidateImage.src = DEFAULT_CANDIDATE_IMAGE;
    };
}

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function buildStartTestApiUrl(testId) {
    const userId = getCurrentUserId();
    return `${TESTS_API_URL}/${encodeURIComponent(testId)}/start?userId=${encodeURIComponent(userId)}`;
}

function buildSubmitAttemptApiUrl(attemptId) {
    const userId = getCurrentUserId();
    return `${TESTS_API_URL}/attempts/${encodeURIComponent(attemptId)}/submit?userId=${encodeURIComponent(userId)}`;
}

function buildAttemptDetailsUrl(attemptId) {
    const userId = getCurrentUserId();
    return `${TESTS_API_URL}/attempts/${encodeURIComponent(attemptId)}?userId=${encodeURIComponent(userId)}`;
}

function extractApiErrorMessage(responseText, responseStatus) {
    if (!responseText) return `HTTP ${responseStatus}`;

    try {
        const parsed = JSON.parse(responseText);
        if (parsed && typeof parsed === "object") {
            return parsed.message || parsed.error || parsed.field || `HTTP ${responseStatus}`;
        }
    } catch (error) {
        // ignore invalid json
    }

    return responseText;
}

async function fetchJson(url, options = {}) {
    const token = requireAuthToken();

    const finalOptions = {
        ...options,
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
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
        throw new Error("Unauthorized. Missing or invalid token.");
    }

    if (!response.ok) {
        throw new Error(extractApiErrorMessage(responseText, response.status));
    }

    if (!responseText) return null;

    try {
        return JSON.parse(responseText);
    } catch (error) {
        return null;
    }
}

function showEngineToast(message, type = "info") {
    const oldToast = document.querySelector(".engine-toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = `engine-toast ${type}`;

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

    if (!document.getElementById("engineToastStyle")) {
        const style = document.createElement("style");
        style.id = "engineToastStyle";
        style.textContent = `
            .engine-toast {
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
                animation: engineToastIn 0.25s ease;
            }

            .engine-toast.info {
                background: #164e63;
                border: 1px solid rgba(103,232,249,0.35);
            }

            .engine-toast.success {
                background: #065f46;
                border: 1px solid rgba(110,231,183,0.35);
            }

            .engine-toast.error {
                background: #7f1d1d;
                border: 1px solid rgba(252,165,165,0.35);
            }

            @keyframes engineToastIn {
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

function normalizeQuestion(rawQuestion) {
    return {
        id: rawQuestion.id,
        questionText: rawQuestion.questionText || "",
        questionType: String(rawQuestion.questionType || "MCQ").toUpperCase(),
        correctAnswer: rawQuestion.correctAnswer || "",
        marks: Number(rawQuestion.marks ?? 1),
        focusTopic: rawQuestion.focusTopic || "",
        questionOrder: Number(rawQuestion.questionOrder ?? 1),
        options: Array.isArray(rawQuestion.options)
            ? rawQuestion.options.map((option) => ({
                id: option.id,
                optionLabel: option.optionLabel || "",
                optionText: option.optionText || ""
            }))
            : []
    };
}

function normalizeQuestions(questions) {
    return (Array.isArray(questions) ? questions : [])
        .map(normalizeQuestion)
        .sort((a, b) => {
            if (a.questionOrder !== b.questionOrder) {
                return a.questionOrder - b.questionOrder;
            }
            return Number(a.id || 0) - Number(b.id || 0);
        });
}

function questionKey(questionId) {
    return String(questionId);
}

function normalizeAnswerValue(value) {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
}

function getSavedAnswer(questionId) {
    if (!examSession) return null;
    return normalizeAnswerValue(examSession.answers[questionKey(questionId)]);
}

function hasAnswer(questionId) {
    return Boolean(getSavedAnswer(questionId));
}

function hasVisited(questionId) {
    return examSession?.visited.has(questionKey(questionId));
}

function isMarkedForReview(questionId) {
    return examSession?.reviewMarks.has(questionKey(questionId));
}

function markVisited(questionId) {
    if (!examSession) return;
    examSession.visited.add(questionKey(questionId));
}

function removeReviewMark(questionId) {
    if (!examSession) return;
    examSession.reviewMarks.delete(questionKey(questionId));
}

function addReviewMark(questionId) {
    if (!examSession) return;
    examSession.reviewMarks.add(questionKey(questionId));
}

function getQuestionStatus(questionId) {
    const visited = hasVisited(questionId);
    const answered = hasAnswer(questionId);
    const review = isMarkedForReview(questionId);

    if (review && answered) return STATUS.ANSWERED_MARKED;
    if (review) return STATUS.MARKED;
    if (!visited) return STATUS.NOT_VISITED;
    if (answered) return STATUS.ANSWERED;
    return STATUS.NOT_ANSWERED;
}

function getCurrentQuestion() {
    if (!examSession || !Array.isArray(examSession.questions)) return null;
    return examSession.questions[examSession.currentIndex] || null;
}

function saveTheoryAnswerSilently() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !examSession) return;
    if (currentQuestion.questionType !== "THEORY") return;

    const value = normalizeAnswerValue(engineTheoryAnswer ? engineTheoryAnswer.value : "");
    if (value) {
        examSession.answers[questionKey(currentQuestion.id)] = value;
    } else {
        delete examSession.answers[questionKey(currentQuestion.id)];
    }
}

function saveCurrentAnswerFromUi() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !examSession) return;

    if (currentQuestion.questionType === "THEORY") {
        saveTheoryAnswerSilently();
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

function updateTopInfo() {
    if (!examSession) return;

    const candidateName = getCurrentUserName();
    const currentQuestion = getCurrentQuestion();
    const currentQuestionIndex = examSession.currentIndex + 1;
    const totalQuestions = examSession.questions.length;
    const subjectName = examSession.subject || "General Test";
    const examTitle = examSession.title || "Test";

    if (examCandidateName) examCandidateName.textContent = candidateName;
    if (examNameValue) examNameValue.textContent = examTitle;
    if (examSubjectValue) examSubjectValue.textContent = subjectName;
    if (examTotalQuestionsValue) examTotalQuestionsValue.textContent = String(totalQuestions);
    if (engineSectionName) engineSectionName.textContent = subjectName;

    if (engineQuestionProgressChip) {
        engineQuestionProgressChip.textContent = `Question ${currentQuestionIndex} of ${totalQuestions}`;
    }

    if (sidebarCandidateName) sidebarCandidateName.textContent = candidateName;
    if (sidebarCandidateSubject) sidebarCandidateSubject.textContent = subjectName;
    if (sidebarExamName) sidebarExamName.textContent = examTitle;
    if (sidebarCurrentQuestion) sidebarCurrentQuestion.textContent = `Q${currentQuestionIndex}`;

    if (currentQuestion) {
        if (engineQuestionTypeTop) engineQuestionTypeTop.textContent = currentQuestion.questionType || "MCQ";
        if (engineCurrentQuestionTop) engineCurrentQuestionTop.textContent = `Q${currentQuestionIndex}`;
    }
}

function renderQuestionMeta() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    if (engineQuestionNumber) {
        engineQuestionNumber.textContent = `Question ${examSession.currentIndex + 1}`;
    }

    if (engineQuestionMeta) {
        engineQuestionMeta.textContent = `Marks: ${currentQuestion.marks || 1}`;
    }

    if (engineQuestionText) {
        engineQuestionText.textContent = currentQuestion.questionText || "Question text not available.";
    }

    if (currentQuestion.focusTopic && currentQuestion.focusTopic.trim()) {
        if (engineFocusTopic) engineFocusTopic.textContent = currentQuestion.focusTopic;
        if (engineFocusTopicWrap) engineFocusTopicWrap.classList.remove("hidden");
    } else {
        if (engineFocusTopic) engineFocusTopic.textContent = "";
        if (engineFocusTopicWrap) engineFocusTopicWrap.classList.add("hidden");
    }
}

function renderQuestionInputArea() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    const savedAnswer = getSavedAnswer(currentQuestion.id);

    if (currentQuestion.questionType === "THEORY") {
        if (engineOptionsList) engineOptionsList.innerHTML = "";
        if (engineTheoryWrap) engineTheoryWrap.classList.remove("hidden");
        if (engineTheoryAnswer) engineTheoryAnswer.value = savedAnswer || "";
        return;
    }

    if (engineTheoryWrap) engineTheoryWrap.classList.add("hidden");
    if (engineTheoryAnswer) engineTheoryAnswer.value = "";

    if (engineOptionsList) {
        const options = Array.isArray(currentQuestion.options) ? currentQuestion.options : [];

        if (!options.length) {
            engineOptionsList.innerHTML = `
                <div class="engine-empty-options">
                    No options found for this MCQ question.
                </div>
            `;
            return;
        }

        engineOptionsList.innerHTML = options.map((option) => {
            const selected = savedAnswer === option.optionLabel ? "selected" : "";
            return `
                <div class="engine-option-item ${selected}" data-option-label="${escapeHtml(option.optionLabel)}">
                    <div class="engine-option-radio"></div>
                    <div class="engine-option-content">
                        <span class="engine-option-label">${escapeHtml(option.optionLabel)}</span>
                        <span class="engine-option-text">${escapeHtml(option.optionText || "")}</span>
                    </div>
                </div>
            `;
        }).join("");
    }
}

function updateNavButtons() {
    if (!examSession) return;

    if (enginePrevBtn) enginePrevBtn.disabled = examSession.currentIndex === 0;
    if (engineNextBtn) engineNextBtn.disabled = examSession.currentIndex === examSession.questions.length - 1;
}

function computeStatusSummary() {
    const summary = {
        total: 0,
        notVisited: 0,
        notAnswered: 0,
        answered: 0,
        marked: 0,
        answeredMarked: 0
    };

    if (!examSession) return summary;

    summary.total = examSession.questions.length;

    examSession.questions.forEach((question) => {
        const status = getQuestionStatus(question.id);

        if (status === STATUS.NOT_VISITED) summary.notVisited++;
        else if (status === STATUS.NOT_ANSWERED) summary.notAnswered++;
        else if (status === STATUS.ANSWERED) summary.answered++;
        else if (status === STATUS.MARKED) summary.marked++;
        else if (status === STATUS.ANSWERED_MARKED) summary.answeredMarked++;
    });

    return summary;
}

function renderLegendCounts() {
    const summary = computeStatusSummary();

    if (legendNotVisitedCount) legendNotVisitedCount.textContent = String(summary.notVisited);
    if (legendNotAnsweredCount) legendNotAnsweredCount.textContent = String(summary.notAnswered);
    if (legendAnsweredCount) legendAnsweredCount.textContent = String(summary.answered);
    if (legendMarkedCount) legendMarkedCount.textContent = String(summary.marked);
    if (legendAnsweredMarkedCount) legendAnsweredMarkedCount.textContent = String(summary.answeredMarked);
}

function renderPalette() {
    if (!examSession || !engineQuestionPalette) return;

    engineQuestionPalette.innerHTML = examSession.questions.map((question, index) => {
        const status = getQuestionStatus(question.id);
        const currentClass = index === examSession.currentIndex ? "current" : "";

        return `
            <button
                type="button"
                class="engine-palette-btn ${status} ${currentClass}"
                data-question-index="${index}">
                ${String(index + 1).padStart(2, "0")}
            </button>
        `;
    }).join("");
}

function refreshSidePanelsOnly() {
    renderLegendCounts();
    renderPalette();
    updateTopInfo();
}

function refreshUi() {
    updateTopInfo();
    renderQuestionMeta();
    renderQuestionInputArea();
    renderLegendCounts();
    renderPalette();
    updateNavButtons();
}

function visitQuestion(index) {
    if (!examSession) return;
    if (index < 0 || index >= examSession.questions.length) return;

    examSession.currentIndex = index;
    const currentQuestion = getCurrentQuestion();

    if (currentQuestion) {
        markVisited(currentQuestion.id);
    }

    refreshUi();
}

function goToNextQuestion() {
    if (!examSession) return;

    if (examSession.currentIndex < examSession.questions.length - 1) {
        visitQuestion(examSession.currentIndex + 1);
    } else {
        refreshUi();
    }
}

function goToPreviousQuestion() {
    if (!examSession) return;

    if (examSession.currentIndex > 0) {
        visitQuestion(examSession.currentIndex - 1);
    } else {
        refreshUi();
    }
}

function handleSaveAndNext() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !examSession) return;

    saveCurrentAnswerFromUi();
    removeReviewMark(currentQuestion.id);

    if (examSession.currentIndex < examSession.questions.length - 1) {
        visitQuestion(examSession.currentIndex + 1);
    } else {
        refreshUi();
    }
}

function handleClearResponse() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !examSession) return;

    delete examSession.answers[questionKey(currentQuestion.id)];

    if (currentQuestion.questionType === "THEORY" && engineTheoryAnswer) {
        engineTheoryAnswer.value = "";
    }

    refreshUi();
}

function handleSaveAndMarkReview() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !examSession) return;

    saveCurrentAnswerFromUi();
    addReviewMark(currentQuestion.id);
    refreshUi();
}

function handleMarkReviewAndNext() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !examSession) return;

    saveCurrentAnswerFromUi();
    addReviewMark(currentQuestion.id);

    if (examSession.currentIndex < examSession.questions.length - 1) {
        visitQuestion(examSession.currentIndex + 1);
    } else {
        refreshUi();
    }
}

function buildSubmitPayload() {
    if (!examSession) return { answers: [] };

    return {
        answers: Object.entries(examSession.answers)
            .map(([questionId, submittedAnswer]) => ({
                questionId: Number(questionId),
                submittedAnswer
            }))
            .filter((item) => normalizeAnswerValue(item.submittedAnswer))
    };
}

function getAnsweredCount() {
    if (!examSession) return 0;

    return Object.values(examSession.answers)
        .map(normalizeAnswerValue)
        .filter(Boolean)
        .length;
}

function isSummaryModalOpen() {
    return submitSummaryOverlay && !submitSummaryOverlay.classList.contains("hidden");
}

function openSubmitSummaryModal() {
    if (!submitSummaryOverlay || !examSession) return;

    const summary = computeStatusSummary();

    if (summaryExamName) summaryExamName.textContent = examSession.title || "Test";
    if (summarySubjectName) summarySubjectName.textContent = examSession.subject || "-";
    if (summaryRemainingTime) summaryRemainingTime.textContent = examRemainingTime ? examRemainingTime.textContent : "00:00:00";
    if (summaryTotalQuestions) summaryTotalQuestions.textContent = String(summary.total);
    if (summaryAnswered) summaryAnswered.textContent = String(summary.answered);
    if (summaryNotAnswered) summaryNotAnswered.textContent = String(summary.notAnswered);
    if (summaryMarked) summaryMarked.textContent = String(summary.marked);
    if (summaryAnsweredMarked) summaryAnsweredMarked.textContent = String(summary.answeredMarked);
    if (summaryNotVisited) summaryNotVisited.textContent = String(summary.notVisited);

    submitSummaryOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeSubmitSummaryModal() {
    if (!submitSummaryOverlay) return;
    submitSummaryOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

function handleOpenSubmitSummary() {
    if (!examSession || submitInProgress) return;
    saveCurrentAnswerFromUi();
    openSubmitSummaryModal();
}

async function submitExam(forceSubmit = false) {
    if (!examSession || !examSession.attemptId || submitInProgress) return;

    saveCurrentAnswerFromUi();

    const totalQuestions = examSession.questions.length;
    const answeredCount = getAnsweredCount();
    const unansweredCount = Math.max(0, totalQuestions - answeredCount);

    if (!forceSubmit && unansweredCount > 0 && !isSummaryModalOpen()) {
        const shouldSubmit = confirm(
            `You still have ${unansweredCount} unanswered question${unansweredCount > 1 ? "s" : ""}. Submit anyway?`
        );
        if (!shouldSubmit) return;
    }

    try {
        submitInProgress = true;
        stopExamTimer(false);

        if (engineSubmitBtn) {
            engineSubmitBtn.disabled = true;
            engineSubmitBtn.textContent = "Submitting...";
        }

        if (confirmFinalSubmitBtn) {
            confirmFinalSubmitBtn.disabled = true;
            confirmFinalSubmitBtn.textContent = "Submitting...";
        }

        const result = await fetchJson(buildSubmitAttemptApiUrl(examSession.attemptId), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(buildSubmitPayload())
        });

        if (!result || !result.attemptId) {
            throw new Error("Invalid submit response received from backend.");
        }

        sessionStorage.setItem("edumind_latest_attempt_id", String(result.attemptId));
        showEngineToast("Test submitted successfully.", "success");

        closeSubmitSummaryModal();

        setTimeout(() => {
            window.location.href = `test-result.html?attemptId=${encodeURIComponent(result.attemptId)}`;
        }, 650);

    } catch (error) {
        console.error("Exam submit failed:", error);

        if (String(error.message || "").toLowerCase().includes("unauthorized")) {
            redirectToLoginSoon("Session expired. Please login again.");
            return;
        }

        showEngineToast(`Test submit failed: ${error.message}`, "error");
        startExamTimerFromExistingEndTime();

    } finally {
        submitInProgress = false;

        if (engineSubmitBtn) {
            engineSubmitBtn.disabled = false;
            engineSubmitBtn.textContent = "Submit";
        }

        if (confirmFinalSubmitBtn) {
            confirmFinalSubmitBtn.disabled = false;
            confirmFinalSubmitBtn.textContent = "Final Submit";
        }
    }
}

function parseDurationToSeconds(durationValue) {
    if (durationValue == null) return 0;

    if (typeof durationValue === "number" && Number.isFinite(durationValue)) {
        return durationValue > 0 ? Math.round(durationValue * 60) : 0;
    }

    const raw = String(durationValue).trim().toLowerCase();
    if (!raw) return 0;

    const timeMatch = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
        const first = Number(timeMatch[1] || 0);
        const second = Number(timeMatch[2] || 0);
        const third = Number(timeMatch[3] || 0);

        if (timeMatch[3] !== undefined) {
            return first * 3600 + second * 60 + third;
        }

        return first * 60 + second;
    }

    let totalSeconds = 0;

    const hourMatches = [...raw.matchAll(/(\d+)\s*(hours?|hrs?|hr|h)\b/g)];
    const minuteMatches = [...raw.matchAll(/(\d+)\s*(minutes?|mins?|min|m)\b/g)];
    const secondMatches = [...raw.matchAll(/(\d+)\s*(seconds?|secs?|sec|s)\b/g)];

    hourMatches.forEach((match) => {
        totalSeconds += Number(match[1]) * 3600;
    });

    minuteMatches.forEach((match) => {
        totalSeconds += Number(match[1]) * 60;
    });

    secondMatches.forEach((match) => {
        totalSeconds += Number(match[1]);
    });

    if (totalSeconds > 0) return totalSeconds;
    if (/^\d+$/.test(raw)) return Number(raw) * 60;

    return 0;
}

function formatRemainingTime(totalSeconds) {
    const safe = Math.max(0, Number(totalSeconds || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateTimerUi(secondsLeft) {
    if (examRemainingTime) {
        examRemainingTime.textContent = formatRemainingTime(secondsLeft);
    }

    if (engineHeaderTimer) {
        engineHeaderTimer.classList.remove("warning", "danger");

        if (secondsLeft <= 60) {
            engineHeaderTimer.classList.add("danger");
        } else if (secondsLeft <= 300) {
            engineHeaderTimer.classList.add("warning");
        }
    }

    if (isSummaryModalOpen() && summaryRemainingTime) {
        summaryRemainingTime.textContent = examRemainingTime ? examRemainingTime.textContent : formatRemainingTime(secondsLeft);
    }
}

function stopExamTimer(resetUi = false) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (resetUi) {
        timerEndAt = null;

        if (examRemainingTime) {
            examRemainingTime.textContent = "00:00:00";
        }

        if (engineHeaderTimer) {
            engineHeaderTimer.classList.remove("warning", "danger");
        }
    }
}

function startExamTimerFromExistingEndTime() {
    if (!timerEndAt || submitInProgress) return;

    stopExamTimer(false);

    timerInterval = setInterval(async () => {
        const remaining = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
        updateTimerUi(remaining);

        if (remaining <= 0) {
            stopExamTimer(false);

            if (!submitInProgress) {
                closeSubmitSummaryModal();
                showEngineToast("Time is up. Your test will be submitted automatically.", "info");
                await submitExam(true);
            }
        }
    }, 1000);
}

function startExamTimer(durationValue) {
    stopExamTimer(true);

    const totalSeconds = parseDurationToSeconds(durationValue);

    if (totalSeconds <= 0) {
        if (examRemainingTime) {
            examRemainingTime.textContent = "No Limit";
        }

        if (engineHeaderTimer) {
            engineHeaderTimer.classList.remove("warning", "danger");
        }

        return;
    }

    timerEndAt = Date.now() + totalSeconds * 1000;
    updateTimerUi(totalSeconds);
    startExamTimerFromExistingEndTime();
}

async function startExamSession(testId) {
    const response = await fetchJson(buildStartTestApiUrl(testId), {
        method: "POST"
    });

    const questions = normalizeQuestions(response?.questions || []);

    if (!questions.length) {
        throw new Error("No questions found for this test.");
    }

    examSession = {
        attemptId: response.attemptId,
        testId: response.testId,
        title: response.title || "Test",
        subject: response.subject || "General Test",
        duration: response.duration || "",
        description: response.description || "",
        questions,
        currentIndex: 0,
        answers: {},
        visited: new Set(),
        reviewMarks: new Set()
    };

    setCandidateImage();
    visitQuestion(0);
    startExamTimer(examSession.duration);
    showEngineToast("Test loaded successfully.", "success");
}

function bindOptionSelection() {
    if (!engineOptionsList) return;

    engineOptionsList.addEventListener("click", (event) => {
        const optionItem = event.target.closest(".engine-option-item");
        const currentQuestion = getCurrentQuestion();

        if (!optionItem || !currentQuestion || !examSession) return;

        const optionLabel = optionItem.dataset.optionLabel;
        if (!optionLabel) return;

        examSession.answers[questionKey(currentQuestion.id)] = optionLabel;
        refreshUi();
    });
}

function bindTheoryInput() {
    if (!engineTheoryAnswer) return;

    engineTheoryAnswer.addEventListener("input", () => {
        const currentQuestion = getCurrentQuestion();
        if (!currentQuestion || !examSession || currentQuestion.questionType !== "THEORY") return;

        saveTheoryAnswerSilently();
        refreshSidePanelsOnly();
    });
}

function bindPaletteNavigation() {
    if (!engineQuestionPalette) return;

    engineQuestionPalette.addEventListener("click", (event) => {
        const btn = event.target.closest(".engine-palette-btn");
        if (!btn || !examSession) return;

        saveCurrentAnswerFromUi();

        const index = Number(btn.dataset.questionIndex);
        if (!Number.isInteger(index)) return;

        visitQuestion(index);
    });
}

function bindActionButtons() {
    engineSaveNextBtn?.addEventListener("click", handleSaveAndNext);
    engineClearResponseBtn?.addEventListener("click", handleClearResponse);
    engineSaveMarkReviewBtn?.addEventListener("click", handleSaveAndMarkReview);
    engineMarkReviewNextBtn?.addEventListener("click", handleMarkReviewAndNext);
    enginePrevBtn?.addEventListener("click", goToPreviousQuestion);

    engineNextBtn?.addEventListener("click", () => {
        saveCurrentAnswerFromUi();
        goToNextQuestion();
    });

    engineSubmitBtn?.addEventListener("click", handleOpenSubmitSummary);
}

function bindLanguageSelector() {
    examLanguageSelect?.addEventListener("change", () => {
        const selected = examLanguageSelect.value;

        if (selected === "Hindi") {
            showEngineToast("Hindi UI is ready, but translated question content must come from backend.", "info");
        }
    });
}

function bindPaletteCollapse() {
    enginePaletteCollapseBtn?.addEventListener("click", () => {
        paletteCollapsed = !paletteCollapsed;

        if (engineQuestionPalette) {
            engineQuestionPalette.classList.toggle("hidden", paletteCollapsed);
        }

        enginePaletteCollapseBtn.innerHTML = paletteCollapsed
            ? `<i class="fa-solid fa-chevron-left"></i>`
            : `<i class="fa-solid fa-chevron-right"></i>`;
    });
}

function bindBeforeUnloadGuard() {
    window.addEventListener("beforeunload", (event) => {
        if (!examSession || submitInProgress) return;
        event.preventDefault();
        event.returnValue = "";
    });
}

function bindSubmitSummaryModal() {
    closeSubmitSummaryBtn?.addEventListener("click", closeSubmitSummaryModal);
    cancelSubmitSummaryBtn?.addEventListener("click", closeSubmitSummaryModal);
    confirmFinalSubmitBtn?.addEventListener("click", () => submitExam(false));

    submitSummaryOverlay?.addEventListener("click", (event) => {
        if (event.target === submitSummaryOverlay) {
            closeSubmitSummaryModal();
        }
    });
}

function bindKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isSummaryModalOpen()) {
            closeSubmitSummaryModal();
        }
    });
}

async function initializeTestEngine() {
    try {
        requireAuthToken();
        getCurrentUserId();

        bindOptionSelection();
        bindTheoryInput();
        bindPaletteNavigation();
        bindActionButtons();
        bindLanguageSelector();
        bindPaletteCollapse();
        bindBeforeUnloadGuard();
        bindSubmitSummaryModal();
        bindKeyboardShortcuts();
        setCandidateImage();

        const testId = getQueryParam("testId");

        if (!testId) {
            showEngineToast("Test id not found.", "error");

            setTimeout(() => {
                window.location.href = "tests.html";
            }, 1000);

            return;
        }

        await startExamSession(testId);

    } catch (error) {
        console.error("Test engine init failed:", error);

        const message = String(error.message || "");

        if (
            message.toLowerCase().includes("token") ||
            message.toLowerCase().includes("unauthorized") ||
            message.toLowerCase().includes("user id")
        ) {
            redirectToLoginSoon(message);
            return;
        }

        showEngineToast(`Test engine load failed: ${message}`, "error");

        setTimeout(() => {
            window.location.href = "tests.html";
        }, 1500);
    }
}

initializeTestEngine();