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

const API_BASE_URL =
    window.location.port === "8080"
        ? ""
        : "http://localhost:8080";

const TESTS_API_URL = `${API_BASE_URL}/api/tests`;

let selectedTestId = null;
let selectedTestMeta = null;
let allQuestions = [];
let editingQuestionId = null;

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

function getCurrentUserId() {
    const user = getStoredUserObject();

    if (user && user.id != null && user.id !== "") {
        return Number(user.id);
    }

    throw new Error("Logged-in user id not found in localStorage.");
}

function buildQuestionsApiUrl(testId, questionId = "") {
    const userId = getCurrentUserId();
    const questionPath = questionId ? `/${questionId}` : "";
    return `${TESTS_API_URL}/${encodeURIComponent(testId)}/questions${questionPath}?userId=${encodeURIComponent(userId)}`;
}

function buildTestsApiUrl(testId = "") {
    const userId = getCurrentUserId();
    const path = testId ? `/${testId}` : "";
    return `${TESTS_API_URL}${path}?userId=${encodeURIComponent(userId)}`;
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
        // use raw text
    }

    return responseText;
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
            ...(options.headers || {})
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

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);

    return {
        testId: params.get("testId"),
        title: params.get("title") || "",
        subject: params.get("subject") || ""
    };
}

function normalizeQuestionType(value) {
    const type = String(value || "").trim().toUpperCase();
    return type === "THEORY" ? "THEORY" : "MCQ";
}

function mapBackendQuestionToFrontend(question) {
    return {
        id: question.id,
        questionText: question.questionText || "",
        questionType: normalizeQuestionType(question.questionType),
        correctAnswer: question.correctAnswer || "",
        marks: Number(question.marks ?? 1),
        focusTopic: question.focusTopic || "",
        questionOrder: Number(question.questionOrder ?? 1),
        options: Array.isArray(question.options)
            ? question.options.map((option) => ({
                id: option.id,
                optionLabel: option.optionLabel || "",
                optionText: option.optionText || ""
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

function renderSelectedTestMeta() {
    if (!selectedTestMeta) return;

    if (selectedTestTitle) {
        selectedTestTitle.textContent = selectedTestMeta.title || "Selected Test";
    }

    if (selectedTestSubtitle) {
        selectedTestSubtitle.textContent = "Manage all questions linked to this selected test.";
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
    questionItem.className = "admin-question-item";
    questionItem.dataset.questionId = question.id;
    questionItem.dataset.questionType = question.questionType;
    questionItem.dataset.questionText = question.questionText;
    questionItem.dataset.focusTopic = question.focusTopic || "";
    questionItem.dataset.correctAnswer = question.correctAnswer || "";
    questionItem.dataset.marks = String(question.marks || 1);
    questionItem.dataset.questionOrder = String(question.questionOrder || 1);

    const optionsSummary =
        question.questionType === "MCQ" && Array.isArray(question.options) && question.options.length > 0
            ? question.options.map((option) => `${option.optionLabel}. ${option.optionText}`).join(" | ")
            : "";

    questionItem.dataset.optionsSummary = optionsSummary;

    questionItem.innerHTML = `
        <div class="admin-question-top">
            <div class="admin-question-top-left">
                <span class="admin-question-order">Question ${escapeHtml(question.questionOrder)}</span>
                <span class="admin-question-topic">${escapeHtml(question.focusTopic || "General concepts")}</span>
            </div>

            <span class="admin-question-badge ${question.questionType === "MCQ" ? "mcq" : "theory"}">
                ${escapeHtml(question.questionType)}
            </span>
        </div>

        <h4 class="admin-question-text">${escapeHtml(question.questionText || "Question text not available.")}</h4>

        <div class="admin-question-meta">
            <span class="admin-question-pill">${escapeHtml(`${question.marks} mark${question.marks > 1 ? "s" : ""}`)}</span>
            <span class="admin-question-pill">${escapeHtml(`Correct: ${question.correctAnswer || "-"}`)}</span>
        </div>

        <div class="admin-question-answer-box">
            <span>${question.questionType === "MCQ" ? "Options" : "Model Answer"}</span>
            <p>${escapeHtml(question.questionType === "MCQ" ? optionsSummary || "No options available" : question.correctAnswer || "No model answer available")}</p>
        </div>

        <div class="admin-question-actions">
            <button class="admin-question-action-btn edit" title="Edit Question">
                <i class="fa-solid fa-pen"></i>
                <span>Edit</span>
            </button>

            <button class="admin-question-action-btn delete" title="Delete Question">
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

    const items = adminQuestionList.querySelectorAll(".admin-question-item");
    const searchText = questionSearchInput ? questionSearchInput.value.toLowerCase().trim() : "";
    const filterValue = questionTypeFilter ? questionTypeFilter.value : "ALL";

    let visibleCount = 0;

    items.forEach((item) => {
        const questionTextValue = (item.dataset.questionText || "").toLowerCase();
        const focusTopicValue = (item.dataset.focusTopic || "").toLowerCase();
        const typeValue = normalizeQuestionType(item.dataset.questionType || "");

        const matchesSearch =
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

function fillQuestionFormForEdit(questionId) {
    const question = allQuestions.find((item) => String(item.id) === String(questionId));
    if (!question) return;

    editingQuestionId = question.id;
    setQuestionModalEditMode();

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

function buildQuestionPayload() {
    const questionTextValue = questionText ? questionText.value.trim() : "";
    const questionTypeValue = normalizeQuestionType(questionType?.value);
    const marksValue = questionMarks ? Number(questionMarks.value || 1) : 1;
    const questionOrderValue = questionOrder ? questionOrder.value.trim() : "";
    const focusTopicValue = questionFocusTopic ? questionFocusTopic.value.trim() : "";
    const correctAnswerValue = questionCorrectAnswer ? questionCorrectAnswer.value.trim() : "";

    if (!questionTextValue) {
        throw new Error("Question text is required.");
    }

    if (!correctAnswerValue) {
        throw new Error("Correct answer is required.");
    }

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

        if (options.length < 2) {
            throw new Error("MCQ question must have at least 2 options.");
        }

        const optionLabels = options.map((option) => option.optionLabel);
        const normalizedCorrect = correctAnswerValue.toUpperCase();

        if (!optionLabels.includes(normalizedCorrect)) {
            throw new Error("Correct answer must match one of the filled option labels (A/B/C/D).");
        }

        payload.correctAnswer = normalizedCorrect;
        payload.options = options;
    }

    return payload;
}

async function loadSelectedTestDetails() {
    if (!selectedTestId) return;

    try {
        const test = await fetchJson(buildTestsApiUrl(selectedTestId));

        selectedTestMeta = {
            id: test.id,
            title: test.title || selectedTestMeta?.title || "Selected Test",
            subject: test.subject || selectedTestMeta?.subject || "-",
            type: test.testType || "-",
            duration: test.duration || "-"
        };

        renderSelectedTestMeta();
    } catch (error) {
        console.warn("Selected test details load failed.", error);
        renderSelectedTestMeta();
    }
}

async function loadQuestions() {
    if (!selectedTestId) return;

    try {
        const questions = await fetchJson(buildQuestionsApiUrl(selectedTestId));

        allQuestions = Array.isArray(questions)
            ? sortQuestions(questions.map(mapBackendQuestionToFrontend))
            : [];

        renderQuestions();
    } catch (error) {
        console.error("Questions load failed:", error);
        alert(`Questions load nahi ho pa rahe: ${error.message}`);
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

async function handleQuestionModalSubmit(event) {
    event.preventDefault();

    if (!selectedTestId) {
        alert("No test selected for question management.");
        return;
    }

    try {
        const payload = buildQuestionPayload();

        if (saveQuestionModalBtn) {
            saveQuestionModalBtn.disabled = true;
            saveQuestionModalBtn.textContent = editingQuestionId ? "Updating..." : "Saving...";
        }

        if (editingQuestionId) {
            await updateQuestion(editingQuestionId, payload);
        } else {
            await createQuestion(payload);
        }

        closeQuestionModal();
        clearQuestionModalState();
        await loadQuestions();
    } catch (error) {
        console.error("Question save failed:", error);
        alert(`Question save nahi hua: ${error.message}`);
    } finally {
        if (saveQuestionModalBtn) {
            saveQuestionModalBtn.disabled = false;
            saveQuestionModalBtn.textContent = editingQuestionId ? "Update Question" : "Save Question";
        }
    }
}

async function handleQuestionListClick(event) {
    const editButton = event.target.closest(".admin-question-action-btn.edit");
    const deleteButton = event.target.closest(".admin-question-action-btn.delete");

    if (editButton) {
        const questionItem = editButton.closest(".admin-question-item");
        const questionId = questionItem?.dataset.questionId;
        if (!questionId) return;

        fillQuestionFormForEdit(questionId);
        return;
    }

    if (deleteButton) {
        const questionItem = deleteButton.closest(".admin-question-item");
        const questionId = questionItem?.dataset.questionId;
        if (!questionId) return;

        const shouldDelete = confirm("Do you want to delete this question?");
        if (!shouldDelete) return;

        try {
            await deleteQuestion(questionId);
            await loadQuestions();
        } catch (error) {
            console.error("Question delete failed:", error);
            alert(`Question delete nahi hua: ${error.message}`);
        }
    }
}

function initializeSelectedTest() {
    const params = getQueryParams();

    if (!params.testId) {
        selectedTestTitle.textContent = "No test selected";
        selectedTestSubtitle.textContent = "Please go back to Admin Tests and open a test first.";
        return false;
    }

    selectedTestId = params.testId;
    selectedTestMeta = {
        id: params.testId,
        title: params.title || "Selected Test",
        subject: params.subject || "-",
        type: "-",
        duration: "-"
    };

    renderSelectedTestMeta();
    return true;
}


function initializeAdminQuestionsPage() {
    if (
        !openQuestionModalBtn ||
        !questionModalOverlay ||
        !closeQuestionModalBtn ||
        !questionModalForm ||
        !adminQuestionList
    ) {
        return;
    }

    const isValid = initializeSelectedTest();

    openQuestionModalBtn.addEventListener("click", function () {
        if (!selectedTestId) {
            alert("Please open this page from Admin Tests > Questions so a test is selected first.");
            return;
        }

        clearQuestionModalState();
        openQuestionModal();
    });

    closeQuestionModalBtn.addEventListener("click", function () {
        closeQuestionModal();
        clearQuestionModalState();
    });

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

    questionModalForm.addEventListener("submit", handleQuestionModalSubmit);
    adminQuestionList.addEventListener("click", handleQuestionListClick);

    if (questionSearchInput) {
        questionSearchInput.addEventListener("input", applyQuestionFilters);
    }

    if (questionTypeFilter) {
        questionTypeFilter.addEventListener("change", applyQuestionFilters);
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !questionModalOverlay.classList.contains("hidden")) {
            closeQuestionModal();
            clearQuestionModalState();
        }
    });

    clearQuestionModalState();

    if (isValid) {
        loadSelectedTestDetails();
        loadQuestions();
    } else {
        renderQuestions();
    }
}
initializeAdminQuestionsPage();