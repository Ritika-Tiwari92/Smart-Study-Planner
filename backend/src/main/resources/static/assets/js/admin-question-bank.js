/* =====================================================
   EduMind AI — Admin Question Bank JS
   Full updated copy-paste file

   Features:
   - Selected test metadata from URL
   - Load questions from backend in real-time
   - Add / Edit / Delete MCQ and Theory questions
   - Field-wise validation
   - Toast messages
   - Search + type filter
   - Summary cards update in real-time
   - Keeps existing backend endpoints:
     /api/tests/{testId}/questions?userId=...
===================================================== */

/* =====================================================
   DOM References
===================================================== */

const selectedTestTitle = document.getElementById("selectedTestTitle");
const selectedTestSubtitle = document.getElementById("selectedTestSubtitle");
const selectedTestSubject = document.getElementById("selectedTestSubject");
const selectedTestType = document.getElementById("selectedTestType");
const selectedTestDuration = document.getElementById("selectedTestDuration");

const totalQuestionCount = document.getElementById("totalQuestionCount");
const mcqQuestionCount = document.getElementById("mcqQuestionCount");
const theoryQuestionCount = document.getElementById("theoryQuestionCount");
const totalMarksCount = document.getElementById("totalMarksCount");

const questionSearchInput = document.getElementById("questionSearchInput");
const questionTypeFilter = document.getElementById("questionTypeFilter");
const adminQuestionList = document.getElementById("adminQuestionList");
const adminQuestionsEmptyState = document.getElementById("adminQuestionsEmptyState");

const openQuestionModalBtn = document.getElementById("openQuestionModalBtn");
const questionModalOverlay = document.getElementById("questionModalOverlay");
const closeQuestionModalBtn = document.getElementById("closeQuestionModalBtn");
const questionModalTitle = document.getElementById("questionModalTitle");
const questionModalForm = document.getElementById("questionModalForm");
const resetQuestionModalBtn = document.getElementById("resetQuestionModalBtn");
const saveQuestionModalBtn = document.getElementById("saveQuestionModalBtn");

const questionText = document.getElementById("questionText");
const questionType = document.getElementById("questionType");
const questionMarks = document.getElementById("questionMarks");
const questionOrder = document.getElementById("questionOrder");
const questionFocusTopic = document.getElementById("questionFocusTopic");
const questionCorrectAnswer = document.getElementById("questionCorrectAnswer");
const questionOptionsWrap = document.getElementById("questionOptionsWrap");

const optionA = document.getElementById("optionA");
const optionB = document.getElementById("optionB");
const optionC = document.getElementById("optionC");
const optionD = document.getElementById("optionD");

/* =====================================================
   API + State
===================================================== */

const API_BASE_URL = window.location.port === "8080" ? "" : "http://localhost:8080";
const TESTS_API_URL = `${API_BASE_URL}/api/tests`;

let selectedTestId = null;
let selectedTestMeta = null;
let allQuestions = [];
let editingQuestionId = null;

/* =====================================================
   Storage + Auth Helpers
===================================================== */

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
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");

        const decoded = atob(
            normalized.padEnd(
                normalized.length + (4 - (normalized.length % 4)) % 4,
                "="
            )
        );

        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
}

function clearAdminSessionAndRedirect() {
    [
        "adminToken",
        "adminRole",
        "adminName",
        "adminEmail",
        "token",
        "refreshToken",
        "userRole",
        "userId",
        "userEmail",
        "userName",
        "edumind_is_logged_in",
        "edumind_logged_in_user"
    ].forEach(function (key) {
        localStorage.removeItem(key);
    });

    setTimeout(function () {
        window.location.href = "/pages/admin/login.html";
    }, 900);
}

function getStoredUserObject() {
    const possibleKeys = [
        "edumind_logged_in_user",
        "edumind_registered_user",
        "loggedInUser",
        "currentUser",
        "user",
        "authUser",
        "studyPlannerUser",
        "adminUser",
        "edumind_admin_user"
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

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);

    return {
        testId: params.get("testId"),
        title: params.get("title") || "",
        subject: params.get("subject") || "",
        type: params.get("type") || "",
        duration: params.get("duration") || "",
        userId: params.get("userId") || ""
    };
}

function getCurrentUserId() {
    const params = getQueryParams();

    if (params.userId) {
        const numericParamId = Number(params.userId);
        return Number.isNaN(numericParamId) ? params.userId : numericParamId;
    }

    const user = getStoredUserObject();

    const directUserId =
        user?.id ??
        user?.userId ??
        user?.adminId ??
        localStorage.getItem("userId") ??
        localStorage.getItem("adminId") ??
        localStorage.getItem("edumind_user_id");

    if (directUserId != null && directUserId !== "") {
        const numericId = Number(directUserId);
        return Number.isNaN(numericId) ? directUserId : numericId;
    }

    const tokenPayload = decodeJwtPayload(getAuthToken());

    const jwtUserId =
        tokenPayload?.id ??
        tokenPayload?.userId ??
        tokenPayload?.adminId ??
        tokenPayload?.uid ??
        tokenPayload?.subId;

    if (jwtUserId != null && jwtUserId !== "") {
        const numericJwtId = Number(jwtUserId);
        return Number.isNaN(numericJwtId) ? jwtUserId : numericJwtId;
    }

    return null;
}

/* =====================================================
   API Helpers
===================================================== */

function addUserIdIfAvailable(url) {
    const userId = getCurrentUserId();

    if (userId == null || userId === "") {
        return url;
    }

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}userId=${encodeURIComponent(userId)}`;
}

function buildQuestionsApiUrl(testId, questionId = "") {
    const questionPath = questionId ? `/${encodeURIComponent(questionId)}` : "";

    return addUserIdIfAvailable(
        `${TESTS_API_URL}/${encodeURIComponent(testId)}/questions${questionPath}`
    );
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
        // raw text use hoga
    }

    return responseText;
}

async function fetchJson(url, options = {}) {
    const token = getAuthToken();

    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {})
        }
    });

    let responseText = "";

    try {
        responseText = await response.text();
    } catch (error) {
        responseText = "";
    }

    if (response.status === 401 || response.status === 403) {
        showQuestionToast("Admin session expired. Please login again.", "error");
        clearAdminSessionAndRedirect();
        throw new Error("Unauthorized admin session.");
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

function unwrapArrayResponse(data, possibleKeys = []) {
    if (Array.isArray(data)) return data;

    if (data && typeof data === "object") {
        for (const key of possibleKeys) {
            if (Array.isArray(data[key])) return data[key];
        }

        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.content)) return data.content;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.questions)) return data.questions;
        if (Array.isArray(data.tests)) return data.tests;
    }

    return [];
}

/* =====================================================
   UI Helpers
===================================================== */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function showQuestionToast(message, type = "success") {
    const oldToast = document.querySelector(".question-toast");

    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = `question-toast ${type}`;

    const iconClass =
        type === "success"
            ? "circle-check"
            : type === "info"
                ? "circle-info"
                : "triangle-exclamation";

    toast.innerHTML = `
        <i class="fa-solid fa-${iconClass}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(function () {
        toast.remove();
    }, 3500);
}

function getFieldWrapper(input) {
    return input ? input.closest(".question-form-group") : null;
}

function setQuestionFieldError(input, message) {
    if (!input) return;

    const wrapper = getFieldWrapper(input);

    input.classList.remove("question-input-valid");
    input.classList.add("question-input-error");

    if (!wrapper) return;

    let error = wrapper.querySelector(".question-field-error");

    if (!error) {
        error = document.createElement("div");
        error.className = "question-field-error";
        wrapper.appendChild(error);
    }

    error.textContent = message;
}

function clearQuestionFieldError(input) {
    if (!input) return;

    const wrapper = getFieldWrapper(input);

    input.classList.remove("question-input-error");

    if (String(input.value || "").trim()) {
        input.classList.add("question-input-valid");
    } else {
        input.classList.remove("question-input-valid");
    }

    if (!wrapper) return;

    const error = wrapper.querySelector(".question-field-error");

    if (error) {
        error.remove();
    }
}

function clearAllQuestionFieldErrors() {
    [
        questionText,
        questionType,
        questionMarks,
        questionOrder,
        questionFocusTopic,
        questionCorrectAnswer,
        optionA,
        optionB,
        optionC,
        optionD
    ].forEach(clearQuestionFieldError);
}

/* =====================================================
   Normalization + Mapping
===================================================== */

function normalizeQuestionType(value) {
    const type = String(value || "").trim().toUpperCase();
    return type === "THEORY" ? "THEORY" : "MCQ";
}

function normalizeCorrectAnswerForMcq(value) {
    return String(value || "").trim().toUpperCase();
}

function mapBackendQuestionToFrontend(question) {
    return {
        id: question.id,
        questionText: question.questionText || question.text || "",
        questionType: normalizeQuestionType(question.questionType || question.type),
        correctAnswer: question.correctAnswer || question.answer || "",
        marks: Number(question.marks ?? 1),
        focusTopic: question.focusTopic || question.focusArea || "",
        questionOrder: Number(question.questionOrder ?? question.orderNo ?? 1),
        options: Array.isArray(question.options)
            ? question.options.map((option) => ({
                id: option.id,
                optionLabel: option.optionLabel || option.label || "",
                optionText: option.optionText || option.text || ""
            }))
            : []
    };
}

function sortQuestions(items) {
    return [...items].sort((a, b) => {
        if (a.questionOrder !== b.questionOrder) {
            return a.questionOrder - b.questionOrder;
        }

        return Number(a.id || 0) - Number(b.id || 0);
    });
}

/* =====================================================
   Modal Helpers
===================================================== */

function setQuestionModalAddMode() {
    editingQuestionId = null;

    if (questionModalTitle) {
        questionModalTitle.textContent = "Add Question";
    }

    if (saveQuestionModalBtn) {
        saveQuestionModalBtn.textContent = "Save Question";
    }
}

function setQuestionModalEditMode() {
    if (questionModalTitle) {
        questionModalTitle.textContent = "Edit Question";
    }

    if (saveQuestionModalBtn) {
        saveQuestionModalBtn.textContent = "Update Question";
    }
}

function resetQuestionForm() {
    if (!questionModalForm) return;

    questionModalForm.reset();
    clearAllQuestionFieldErrors();

    if (questionType) {
        questionType.value = "MCQ";
    }

    if (questionMarks) {
        questionMarks.value = "1";
    }

    if (questionOrder) {
        questionOrder.value = "";
    }

    updateQuestionTypeVisibility();
}

function clearQuestionModalState() {
    resetQuestionForm();
    setQuestionModalAddMode();
}

function openQuestionModal() {
    if (!questionModalOverlay) return;

    questionModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    setTimeout(function () {
        questionText?.focus();
    }, 120);
}

function closeQuestionModal() {
    if (!questionModalOverlay) return;

    questionModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

function updateQuestionTypeVisibility() {
    const currentType = normalizeQuestionType(questionType?.value);

    if (!questionOptionsWrap) return;

    if (currentType === "THEORY") {
        questionOptionsWrap.classList.add("hidden");

        if (questionCorrectAnswer) {
            questionCorrectAnswer.placeholder = "Write the model answer for this theory question";
        }
    } else {
        questionOptionsWrap.classList.remove("hidden");

        if (questionCorrectAnswer) {
            questionCorrectAnswer.placeholder = "For MCQ use A / B / C / D";
        }
    }
}

/* =====================================================
   Selected Test
===================================================== */

function renderSelectedTestMeta() {
    if (!selectedTestMeta) return;

    if (selectedTestTitle) {
        selectedTestTitle.textContent = selectedTestMeta.title || "Selected Test";
    }

    if (selectedTestSubtitle) {
        selectedTestSubtitle.textContent = selectedTestId
            ? "Manage all questions linked to this selected test."
            : "Please open this page from Admin Tests > Questions.";
    }

    if (selectedTestSubject) {
        selectedTestSubject.textContent = selectedTestMeta.subject || "-";
    }

    if (selectedTestType) {
        selectedTestType.textContent = selectedTestMeta.type || "-";
    }

    if (selectedTestDuration) {
        selectedTestDuration.textContent = selectedTestMeta.duration || "-";
    }
}

async function loadSelectedTestDetails() {
    renderSelectedTestMeta();
}

/* =====================================================
   Summary + Render
===================================================== */

function updateQuestionSummaryCards() {
    const total = allQuestions.length;
    const mcqCount = allQuestions.filter((item) => item.questionType === "MCQ").length;
    const theoryCount = allQuestions.filter((item) => item.questionType === "THEORY").length;
    const totalMarks = allQuestions.reduce((sum, item) => sum + Number(item.marks || 0), 0);

    if (totalQuestionCount) {
        totalQuestionCount.textContent = String(total).padStart(2, "0");
    }

    if (mcqQuestionCount) {
        mcqQuestionCount.textContent = String(mcqCount).padStart(2, "0");
    }

    if (theoryQuestionCount) {
        theoryQuestionCount.textContent = String(theoryCount).padStart(2, "0");
    }

    if (totalMarksCount) {
        totalMarksCount.textContent = String(totalMarks).padStart(2, "0");
    }
}

function createQuestionCard(question) {
    const questionItem = document.createElement("div");

    questionItem.className = "question-item";
    questionItem.dataset.questionId = question.id;
    questionItem.dataset.questionType = question.questionType;
    questionItem.dataset.questionText = question.questionText;
    questionItem.dataset.focusTopic = question.focusTopic || "";
    questionItem.dataset.correctAnswer = question.correctAnswer || "";
    questionItem.dataset.marks = String(question.marks || 1);
    questionItem.dataset.questionOrder = String(question.questionOrder || 1);

    const optionsSummary =
        question.questionType === "MCQ" &&
            Array.isArray(question.options) &&
            question.options.length > 0
            ? question.options
                .map((option) => `${option.optionLabel}. ${option.optionText}`)
                .join(" | ")
            : "";

    questionItem.dataset.optionsSummary = optionsSummary;

    const answerBoxLabel = question.questionType === "MCQ" ? "Options" : "Model Answer";
    const answerBoxText = question.questionType === "MCQ"
        ? optionsSummary || "No options available"
        : question.correctAnswer || "No model answer available";

    questionItem.innerHTML = `
        <div class="question-item-top">
            <div class="question-item-left">
                <span class="question-order">Question ${escapeHtml(question.questionOrder)}</span>
                <span class="question-topic">${escapeHtml(question.focusTopic || "General concepts")}</span>
            </div>

            <span class="question-badge ${question.questionType === "MCQ" ? "mcq" : "theory"}">
                ${escapeHtml(question.questionType)}
            </span>
        </div>

        <h4 class="question-text">${escapeHtml(question.questionText || "Question text not available.")}</h4>

        <div class="question-meta">
            <span class="question-pill">${escapeHtml(`${question.marks} mark${Number(question.marks) > 1 ? "s" : ""}`)}</span>
            <span class="question-pill">${escapeHtml(`Correct: ${question.correctAnswer || "-"}`)}</span>
        </div>

        <div class="question-answer-box">
            <span>${escapeHtml(answerBoxLabel)}</span>
            <p>${escapeHtml(answerBoxText)}</p>
        </div>

        <div class="question-actions">
            <button class="question-action-btn edit" type="button" title="Edit Question">
                <i class="fa-solid fa-pen"></i>
                <span>Edit</span>
            </button>

            <button class="question-action-btn delete" type="button" title="Delete Question">
                <i class="fa-solid fa-trash"></i>
                <span>Delete</span>
            </button>
        </div>
    `;

    return questionItem;
}

function updateQuestionEmptyState(visibleCount) {
    if (!adminQuestionsEmptyState) return;

    if (visibleCount === 0) {
        adminQuestionsEmptyState.classList.remove("hidden");
    } else {
        adminQuestionsEmptyState.classList.add("hidden");
    }
}

function applyQuestionFilters() {
    if (!adminQuestionList) return;

    const items = adminQuestionList.querySelectorAll(".question-item");
    const searchText = questionSearchInput ? questionSearchInput.value.toLowerCase().trim() : "";
    const filterValue = questionTypeFilter ? questionTypeFilter.value : "ALL";

    let visibleCount = 0;

    items.forEach((item) => {
        const questionTextValue = (item.dataset.questionText || "").toLowerCase();
        const focusTopicValue = (item.dataset.focusTopic || "").toLowerCase();
        const typeValue = normalizeQuestionType(item.dataset.questionType || "");

        const matchesSearch =
            !searchText ||
            questionTextValue.includes(searchText) ||
            focusTopicValue.includes(searchText);

        const matchesType = filterValue === "ALL" || typeValue === filterValue;

        if (matchesSearch && matchesType) {
            item.style.display = "";
            visibleCount++;
        } else {
            item.style.display = "none";
        }
    });

    updateQuestionEmptyState(visibleCount);
}

function renderQuestions() {
    if (!adminQuestionList) return;

    adminQuestionList.innerHTML = "";

    allQuestions.forEach((question) => {
        adminQuestionList.appendChild(createQuestionCard(question));
    });

    updateQuestionSummaryCards();
    applyQuestionFilters();
}

/* =====================================================
   Edit Fill
===================================================== */

function fillQuestionFormForEdit(questionId) {
    const question = allQuestions.find((item) => String(item.id) === String(questionId));

    if (!question) {
        showQuestionToast("Selected question not found.", "error");
        return;
    }

    editingQuestionId = question.id;
    setQuestionModalEditMode();
    clearAllQuestionFieldErrors();

    if (questionText) {
        questionText.value = question.questionText || "";
    }

    if (questionType) {
        questionType.value = normalizeQuestionType(question.questionType);
    }

    if (questionMarks) {
        questionMarks.value = String(question.marks || 1);
    }

    if (questionOrder) {
        questionOrder.value = String(question.questionOrder || "");
    }

    if (questionFocusTopic) {
        questionFocusTopic.value = question.focusTopic || "";
    }

    if (questionCorrectAnswer) {
        questionCorrectAnswer.value = question.correctAnswer || "";
    }

    if (optionA) optionA.value = "";
    if (optionB) optionB.value = "";
    if (optionC) optionC.value = "";
    if (optionD) optionD.value = "";

    if (Array.isArray(question.options)) {
        question.options.forEach((option) => {
            const label = String(option.optionLabel || "").toUpperCase();

            if (label === "A" && optionA) optionA.value = option.optionText || "";
            if (label === "B" && optionB) optionB.value = option.optionText || "";
            if (label === "C" && optionC) optionC.value = option.optionText || "";
            if (label === "D" && optionD) optionD.value = option.optionText || "";
        });
    }

    updateQuestionTypeVisibility();
    openQuestionModal();
}

/* =====================================================
   Validation + Payload
===================================================== */

function validateQuestionForm() {
    clearAllQuestionFieldErrors();

    let isValid = true;

    const questionTextValue = questionText ? questionText.value.trim() : "";
    const questionTypeValue = normalizeQuestionType(questionType?.value);
    const marksValue = questionMarks ? Number(questionMarks.value || 1) : 1;
    const correctAnswerValue = questionCorrectAnswer ? questionCorrectAnswer.value.trim() : "";
    const orderValue = questionOrder ? questionOrder.value.trim() : "";

    if (!questionTextValue) {
        setQuestionFieldError(questionText, "Question text is required.");
        isValid = false;
    } else if (questionTextValue.length < 5) {
        setQuestionFieldError(questionText, "Question text must be at least 5 characters.");
        isValid = false;
    }

    if (!Number.isFinite(marksValue) || marksValue < 1) {
        setQuestionFieldError(questionMarks, "Marks must be at least 1.");
        isValid = false;
    }

    if (orderValue && Number(orderValue) < 1) {
        setQuestionFieldError(questionOrder, "Question order must be at least 1.");
        isValid = false;
    }

    if (!correctAnswerValue) {
        setQuestionFieldError(questionCorrectAnswer, "Correct answer is required.");
        isValid = false;
    }

    if (questionTypeValue === "MCQ") {
        const options = [
            { input: optionA, label: "A", value: optionA ? optionA.value.trim() : "" },
            { input: optionB, label: "B", value: optionB ? optionB.value.trim() : "" },
            { input: optionC, label: "C", value: optionC ? optionC.value.trim() : "" },
            { input: optionD, label: "D", value: optionD ? optionD.value.trim() : "" }
        ];

        const filledOptions = options.filter((option) => option.value);

        if (filledOptions.length < 2) {
            setQuestionFieldError(optionA, "MCQ must have at least 2 filled options.");
            isValid = false;
        }

        const normalizedCorrect = normalizeCorrectAnswerForMcq(correctAnswerValue);
        const filledLabels = filledOptions.map((option) => option.label);

        if (correctAnswerValue && !filledLabels.includes(normalizedCorrect)) {
            setQuestionFieldError(
                questionCorrectAnswer,
                "Correct answer must match one filled option label: A, B, C, or D."
            );
            isValid = false;
        }

        filledOptions.forEach((option) => {
            if (option.value.length < 1) {
                setQuestionFieldError(option.input, `Option ${option.label} cannot be empty.`);
                isValid = false;
            }
        });
    }

    if (!isValid) {
        showQuestionToast("Please fix the highlighted fields.", "error");
    }

    return isValid;
}

function buildQuestionPayload() {
    if (!validateQuestionForm()) {
        throw new Error("Validation failed.");
    }

    const questionTextValue = questionText ? questionText.value.trim() : "";
    const questionTypeValue = normalizeQuestionType(questionType?.value);
    const marksValue = questionMarks ? Number(questionMarks.value || 1) : 1;
    const questionOrderValue = questionOrder ? questionOrder.value.trim() : "";
    const focusTopicValue = questionFocusTopic ? questionFocusTopic.value.trim() : "";
    const correctAnswerValue = questionCorrectAnswer ? questionCorrectAnswer.value.trim() : "";

    const payload = {
        questionText: questionTextValue,
        questionType: questionTypeValue,
        correctAnswer: correctAnswerValue,
        marks: Number.isFinite(marksValue) && marksValue > 0 ? marksValue : 1,
        focusTopic: focusTopicValue || null,
        questionOrder: questionOrderValue ? Number(questionOrderValue) : null,
        options: []
    };

    if (questionTypeValue === "MCQ") {
        const options = [
            { optionLabel: "A", optionText: optionA ? optionA.value.trim() : "" },
            { optionLabel: "B", optionText: optionB ? optionB.value.trim() : "" },
            { optionLabel: "C", optionText: optionC ? optionC.value.trim() : "" },
            { optionLabel: "D", optionText: optionD ? optionD.value.trim() : "" }
        ].filter((option) => option.optionText);

        const normalizedCorrect = normalizeCorrectAnswerForMcq(correctAnswerValue);

        payload.correctAnswer = normalizedCorrect;
        payload.options = options;
    } else {
        payload.correctAnswer = correctAnswerValue;
        payload.options = [];
    }

    return payload;
}

/* =====================================================
   Backend CRUD
===================================================== */

async function loadQuestions() {
    if (!selectedTestId) {
        allQuestions = [];
        renderQuestions();
        return;
    }

    try {
        if (adminQuestionList) {
            adminQuestionList.innerHTML = `
                <div class="questions-empty-state">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <h3>Loading questions...</h3>
                    <p>Please wait while questions are loading.</p>
                </div>
            `;
        }

        const response = await fetchJson(buildQuestionsApiUrl(selectedTestId));
        const questions = unwrapArrayResponse(response, ["questions"]);

        allQuestions = Array.isArray(questions)
            ? sortQuestions(questions.map(mapBackendQuestionToFrontend))
            : [];

        renderQuestions();

    } catch (error) {
        console.error("Questions load failed:", error);

        allQuestions = [];
        updateQuestionSummaryCards();

        if (adminQuestionList) {
            adminQuestionList.innerHTML = `
                <div class="questions-empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Questions load nahi ho pa rahe</h3>
                    <p>${escapeHtml(error.message || "Please check backend, token, or API URL.")}</p>
                </div>
            `;
        }

        updateQuestionEmptyState(1);
        showQuestionToast(`Questions load failed: ${error.message}`, "error");
    }
}

async function createQuestion(payload) {
    await fetchJson(buildQuestionsApiUrl(selectedTestId), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
}

async function updateQuestion(questionId, payload) {
    await fetchJson(buildQuestionsApiUrl(selectedTestId, questionId), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
}

async function deleteQuestion(questionId) {
    await fetchJson(buildQuestionsApiUrl(selectedTestId, questionId), {
        method: "DELETE"
    });
}

/* =====================================================
   Submit + Actions
===================================================== */

async function handleQuestionModalSubmit(event) {
    event.preventDefault();

    if (!selectedTestId) {
        showQuestionToast("No test selected for question management.", "error");
        return;
    }

    try {
        const wasEditing = Boolean(editingQuestionId);
        const currentEditingQuestionId = editingQuestionId;
        const payload = buildQuestionPayload();

        if (saveQuestionModalBtn) {
            saveQuestionModalBtn.disabled = true;
            saveQuestionModalBtn.textContent = wasEditing ? "Updating..." : "Saving...";
        }

        if (wasEditing) {
            await updateQuestion(currentEditingQuestionId, payload);
        } else {
            await createQuestion(payload);
        }

        closeQuestionModal();
        clearQuestionModalState();
        await loadQuestions();

        showQuestionToast(wasEditing ? "Question updated successfully." : "Question added successfully.");

    } catch (error) {
        console.error("Question save failed:", error);

        if (error.message !== "Validation failed.") {
            showQuestionToast(`Question save failed: ${error.message}`, "error");
        }

    } finally {
        if (saveQuestionModalBtn) {
            saveQuestionModalBtn.disabled = false;
            saveQuestionModalBtn.textContent = editingQuestionId ? "Update Question" : "Save Question";
        }
    }
}

async function handleQuestionListClick(event) {
    const editButton = event.target.closest(".question-action-btn.edit");
    const deleteButton = event.target.closest(".question-action-btn.delete");

    if (editButton) {
        const questionItem = editButton.closest(".question-item");
        const questionId = questionItem?.dataset.questionId;

        if (!questionId) return;

        fillQuestionFormForEdit(questionId);
        return;
    }

    if (deleteButton) {
        const questionItem = deleteButton.closest(".question-item");
        const questionId = questionItem?.dataset.questionId;

        if (!questionId) return;

        const shouldDelete = confirm("Do you want to delete this question?");
        if (!shouldDelete) return;

        try {
            await deleteQuestion(questionId);
            await loadQuestions();

            showQuestionToast("Question deleted successfully.");
        } catch (error) {
            console.error("Question delete failed:", error);
            showQuestionToast(`Question delete failed: ${error.message}`, "error");
        }
    }
}

/* =====================================================
   Init
===================================================== */

function initializeSelectedTest() {
    const params = getQueryParams();

    if (!params.testId) {
        selectedTestId = null;

        selectedTestMeta = {
            title: "No test selected",
            subject: "-",
            type: "-",
            duration: "-"
        };

        if (selectedTestTitle) {
            selectedTestTitle.textContent = "No test selected";
        }

        if (selectedTestSubtitle) {
            selectedTestSubtitle.textContent = "Please go back to Admin Tests and open Questions for a test.";
        }

        renderSelectedTestMeta();
        return false;
    }

    selectedTestId = params.testId;

    selectedTestMeta = {
        id: params.testId,
        title: params.title || "Selected Test",
        subject: params.subject || "-",
        type: params.type || "-",
        duration: params.duration || "-"
    };

    renderSelectedTestMeta();
    return true;
}

function initializeQuestionBankPage() {
    const isValid = initializeSelectedTest();

    if (openQuestionModalBtn) {
        openQuestionModalBtn.addEventListener("click", function () {
            if (!selectedTestId) {
                showQuestionToast("Please open this page from Admin Tests > Questions.", "error");
                return;
            }

            clearQuestionModalState();
            openQuestionModal();
        });
    }

    if (closeQuestionModalBtn) {
        closeQuestionModalBtn.addEventListener("click", function () {
            closeQuestionModal();
            clearQuestionModalState();
        });
    }

    if (resetQuestionModalBtn) {
        resetQuestionModalBtn.addEventListener("click", function () {
            resetQuestionForm();
        });
    }

    if (questionModalOverlay) {
        questionModalOverlay.addEventListener("click", function (event) {
            if (event.target === questionModalOverlay) {
                closeQuestionModal();
                clearQuestionModalState();
            }
        });
    }

    if (questionType) {
        questionType.addEventListener("change", updateQuestionTypeVisibility);
    }

    if (questionModalForm) {
        questionModalForm.addEventListener("submit", handleQuestionModalSubmit);
    }

    if (adminQuestionList) {
        adminQuestionList.addEventListener("click", handleQuestionListClick);
    }

    if (questionSearchInput) {
        questionSearchInput.addEventListener("input", applyQuestionFilters);
    }

    if (questionTypeFilter) {
        questionTypeFilter.addEventListener("change", applyQuestionFilters);
    }

    [
        questionText,
        questionType,
        questionMarks,
        questionOrder,
        questionFocusTopic,
        questionCorrectAnswer,
        optionA,
        optionB,
        optionC,
        optionD
    ].forEach(function (input) {
        if (!input) return;

        input.addEventListener("input", function () {
            clearQuestionFieldError(input);
        });

        input.addEventListener("change", function () {
            clearQuestionFieldError(input);
        });
    });

    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            questionModalOverlay &&
            !questionModalOverlay.classList.contains("hidden")
        ) {
            closeQuestionModal();
            clearQuestionModalState();
        }
    });

    clearQuestionModalState();

    if (isValid) {
        renderSelectedTestMeta();
        loadQuestions();
    } else {
        renderQuestions();
    }
}

initializeQuestionBankPage();