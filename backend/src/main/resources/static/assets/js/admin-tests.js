const openAdminTestModalBtn = document.getElementById("openAdminTestModalBtn");
const adminTestModalOverlay = document.getElementById("adminTestModalOverlay");
const closeAdminTestModalBtn = document.getElementById("closeAdminTestModalBtn");
const cancelAdminTestModalBtn = document.getElementById("cancelAdminTestModalBtn");

const adminTestModalForm = document.getElementById("adminTestModalForm");
const adminTestModalTitle = document.getElementById("adminTestModalTitle");
const saveAdminTestBtn = document.getElementById("saveAdminTestBtn");

const adminTestList = document.getElementById("adminTestList");
const adminTestsEmptyState = document.getElementById("adminTestsEmptyState");
const adminTestSearchInput = document.getElementById("adminTestSearchInput");
const adminTestFilterSelect = document.getElementById("adminTestFilterSelect");

const adminTotalTestsCount = document.getElementById("adminTotalTestsCount");
const adminDraftTestsCount = document.getElementById("adminDraftTestsCount");
const adminPublishedTestsCount = document.getElementById("adminPublishedTestsCount");
const adminTotalQuestionsCount = document.getElementById("adminTotalQuestionsCount");

const adminTestTitleInput = document.getElementById("adminTestTitle");
const adminTestSubjectInput = document.getElementById("adminTestSubject");
const adminTestDateInput = document.getElementById("adminTestDate");
const adminTestTypeInput = document.getElementById("adminTestType");
const adminTestDurationInput = document.getElementById("adminTestDuration");
const adminTestStatusInput = document.getElementById("adminTestStatus");
const adminNegativeMarkingInput = document.getElementById("adminNegativeMarking");
const adminTestDescriptionInput = document.getElementById("adminTestDescription");
const adminTestInstructionsInput = document.getElementById("adminTestInstructions");

const API_BASE_URL =
    window.location.port === "8080"
        ? ""
        : "http://localhost:8080";

const TESTS_API_URL = `${API_BASE_URL}/api/tests`;
const SUBJECTS_API_URL = `${API_BASE_URL}/subjects`;

let editingAdminTestId = null;
let allAdminTests = [];
let questionCountByTestId = new Map();

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

function buildTestsApiUrl(testId = "") {
    const userId = getCurrentUserId();
    const path = testId ? `/${testId}` : "";
    return `${TESTS_API_URL}${path}?userId=${encodeURIComponent(userId)}`;
}

function buildSubjectsApiUrl() {
    const userId = getCurrentUserId();
    return `${SUBJECTS_API_URL}?userId=${encodeURIComponent(userId)}`;
}

function buildQuestionsApiUrl(testId) {
    const userId = getCurrentUserId();
    return `${TESTS_API_URL}/${encodeURIComponent(testId)}/questions?userId=${encodeURIComponent(userId)}`;
}

function openAdminTestModal() {
    if (!adminTestModalOverlay) return;
    adminTestModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeAdminTestModal() {
    if (!adminTestModalOverlay) return;
    adminTestModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

function setCreateAdminTestMode() {
    editingAdminTestId = null;

    if (adminTestModalTitle) {
        adminTestModalTitle.textContent = "Create Test";
    }

    if (saveAdminTestBtn) {
        saveAdminTestBtn.textContent = "Save Test";
    }
}

function setEditAdminTestMode() {
    if (adminTestModalTitle) {
        adminTestModalTitle.textContent = "Edit Test";
    }

    if (saveAdminTestBtn) {
        saveAdminTestBtn.textContent = "Update Test";
    }
}

function resetAdminTestForm() {
    if (!adminTestModalForm) return;

    adminTestModalForm.reset();

    if (adminTestTypeInput) {
        adminTestTypeInput.value = "Upcoming";
    }

    if (adminTestStatusInput) {
        adminTestStatusInput.value = "DRAFT";
    }

    if (adminNegativeMarkingInput) {
        adminNegativeMarkingInput.value = "false";
    }
}

function clearAdminTestModalState() {
    resetAdminTestForm();
    setCreateAdminTestMode();
}

function normalizeTestType(typeText) {
    const value = (typeText || "").trim().toLowerCase();

    if (value === "upcoming") return "Upcoming";
    if (value === "this week") return "This Week";
    if (value === "mock test" || value === "mock tests") return "Mock Test";
    if (value === "completed") return "Completed";

    return "Upcoming";
}

function normalizeAdminStatus(statusText, publishedValue = false) {
    const value = (statusText || "").trim().toUpperCase();

    if (value === "PUBLISHED") return "PUBLISHED";
    if (value === "DRAFT") return "DRAFT";

    return publishedValue ? "PUBLISHED" : "DRAFT";
}

function getPublishStateFromStatus(statusText) {
    return normalizeAdminStatus(statusText) === "PUBLISHED";
}

function getTestBadgeClass(type) {
    const normalized = normalizeTestType(type);

    if (normalized === "Upcoming") return "upcoming";
    if (normalized === "This Week") return "this-week";
    if (normalized === "Mock Test") return "mock-test";
    if (normalized === "Completed") return "completed";

    return "upcoming";
}

function parseDateValue(dateValue) {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
        return Number.isNaN(dateValue.getTime()) ? null : dateValue;
    }

    if (typeof dateValue === "string") {
        const trimmed = dateValue.trim();
        if (!trimmed) return null;

        const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
            ? new Date(`${trimmed}T00:00:00`)
            : new Date(trimmed);

        return Number.isNaN(safeDate.getTime()) ? null : safeDate;
    }

    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMonthShort(dateValue) {
    const date = parseDateValue(dateValue);
    if (!date) return "---";

    return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

function getDayNumber(dateValue) {
    const date = parseDateValue(dateValue);
    if (!date) return "--";

    return String(date.getDate()).padStart(2, "0");
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
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
    // token seedha localStorage se lo
    const token = localStorage.getItem("token") || "";

    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

function mapBackendTestToFrontend(test) {
    const publishedValue =
        typeof test.published === "boolean"
            ? test.published
            : getPublishStateFromStatus(test.adminStatus);

    return {
        id: test.id,
        title: test.title || "",
        subject: test.subject || "",
        date: test.testDate || "",
        type: normalizeTestType(test.testType || ""),
        duration: test.duration || "",
        description: test.description || "",
        instructions: test.instructions || "",
        negativeMarking: Boolean(test.negativeMarking),
        published: publishedValue,
        adminStatus: normalizeAdminStatus(test.adminStatus, publishedValue)
    };
}

function sortAdminTests(items) {
    return [...items].sort((a, b) => {
        const aDate = parseDateValue(a.date);
        const bDate = parseDateValue(b.date);

        const aTime = aDate ? aDate.getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = bDate ? bDate.getTime() : Number.MAX_SAFE_INTEGER;

        if (aTime !== bTime) {
            return aTime - bTime;
        }

        return Number(b.id || 0) - Number(a.id || 0);
    });
}

function buildAdminTestPayload(testData) {
    const adminStatus = normalizeAdminStatus(testData.adminStatus, testData.published);

    return {
        title: testData.title,
        subject: testData.subject,
        testDate: testData.date,
        testType: normalizeTestType(testData.type),
        duration: testData.duration,
        description: testData.description,
        published: Boolean(testData.published),
        adminStatus,
        instructions: testData.instructions || null,
        negativeMarking: Boolean(testData.negativeMarking),
        score: null,
        focusArea: null,
        testTip: null
    };
}

function createAdminTestItem(test) {
    const questionCount = questionCountByTestId.get(String(test.id)) ?? 0;
    const badgeClass = getTestBadgeClass(test.type);
    const publishClass = test.adminStatus === "PUBLISHED" ? "published" : "draft";
    const publishLabel = test.adminStatus === "PUBLISHED" ? "Published" : "Draft";
    const publishActionLabel = test.adminStatus === "PUBLISHED" ? "Unpublish" : "Publish";
    const publishActionClass = test.adminStatus === "PUBLISHED" ? "unpublish" : "publish";
    const publishActionIcon = test.adminStatus === "PUBLISHED"
        ? "fa-arrow-rotate-left"
        : "fa-paper-plane";

    const item = document.createElement("div");
    item.className = "admin-test-item";
    item.dataset.testId = test.id;
    item.dataset.type = test.type;
    item.dataset.status = test.adminStatus;
    item.dataset.subject = test.subject;
    item.dataset.duration = test.duration;
    item.dataset.description = test.description;
    item.dataset.instructions = test.instructions || "";
    item.dataset.negativeMarking = String(Boolean(test.negativeMarking));
    item.dataset.date = test.date || "";

    item.innerHTML = `
        <div class="admin-test-date-box">
            <span>${escapeHtml(getDayNumber(test.date))}</span>
            <small>${escapeHtml(getMonthShort(test.date))}</small>
        </div>

        <div class="admin-test-main">
            <div class="admin-test-title-row">
                <h4>${escapeHtml(test.title || "Untitled Test")}</h4>
                <span class="admin-test-badge ${badgeClass}">${escapeHtml(test.type)}</span>
                <span class="admin-publish-badge ${publishClass}">${escapeHtml(publishLabel)}</span>
            </div>

            <div class="admin-test-meta">
                <span class="admin-test-meta-chip">${escapeHtml(`Subject: ${test.subject || "-"}`)}</span>
                <span class="admin-test-meta-chip">${escapeHtml(`Duration: ${test.duration || "-"}`)}</span>
                <span class="admin-test-meta-chip">${escapeHtml(`Questions: ${questionCount}`)}</span>
                <span class="admin-test-meta-chip">${escapeHtml(`Negative Marking: ${test.negativeMarking ? "Yes" : "No"}`)}</span>
            </div>

            <p class="admin-test-description">${escapeHtml(test.description || "No description available.")}</p>
        </div>

        <div class="admin-test-actions">
            <button class="admin-action-btn manage" title="Manage Questions">
                <i class="fa-solid fa-list-ul"></i>
                <span>Questions</span>
            </button>

            <button class="admin-action-btn ${publishActionClass}" title="${escapeHtml(publishActionLabel)}">
                <i class="fa-solid ${publishActionIcon}"></i>
                <span>${escapeHtml(publishActionLabel)}</span>
            </button>

            <button class="admin-action-btn edit" title="Edit Test">
                <i class="fa-solid fa-pen"></i>
                <span>Edit</span>
            </button>

            <button class="admin-action-btn delete" title="Delete Test">
                <i class="fa-solid fa-trash"></i>
                <span>Delete</span>
            </button>
        </div>
    `;

    return item;
}

function renderAdminTests(tests) {
    if (!adminTestList) return;

    adminTestList.innerHTML = "";

    tests.forEach((test) => {
        adminTestList.appendChild(createAdminTestItem(test));
    });

    applyAdminFilters();
    updateAdminSummaryCards();
}

function updateAdminSummaryCards() {
    const totalTests = allAdminTests.length;
    const draftTests = allAdminTests.filter((item) => item.adminStatus === "DRAFT").length;
    const publishedTests = allAdminTests.filter((item) => item.adminStatus === "PUBLISHED").length;

    let totalQuestions = 0;
    questionCountByTestId.forEach((count) => {
        totalQuestions += Number(count || 0);
    });

    if (adminTotalTestsCount) {
        adminTotalTestsCount.textContent = String(totalTests).padStart(2, "0");
    }

    if (adminDraftTestsCount) {
        adminDraftTestsCount.textContent = String(draftTests).padStart(2, "0");
    }

    if (adminPublishedTestsCount) {
        adminPublishedTestsCount.textContent = String(publishedTests).padStart(2, "0");
    }

    if (adminTotalQuestionsCount) {
        adminTotalQuestionsCount.textContent = String(totalQuestions).padStart(2, "0");
    }
}

function updateAdminEmptyState(visibleCount) {
    if (!adminTestsEmptyState) return;

    if (visibleCount === 0) {
        adminTestsEmptyState.classList.remove("hidden");
    } else {
        adminTestsEmptyState.classList.add("hidden");
    }
}

function matchesAdminFilter(item, filterValue) {
    if (!filterValue || filterValue === "ALL") return true;

    const type = normalizeTestType(item.dataset.type || "");
    const status = normalizeAdminStatus(item.dataset.status || "");

    if (filterValue === "DRAFT") return status === "DRAFT";
    if (filterValue === "PUBLISHED") return status === "PUBLISHED";
    if (filterValue === "UPCOMING") return type === "Upcoming";
    if (filterValue === "THIS_WEEK") return type === "This Week";
    if (filterValue === "MOCK_TEST") return type === "Mock Test";

    return true;
}

function applyAdminFilters() {
    if (!adminTestList) return;

    const items = adminTestList.querySelectorAll(".admin-test-item");
    const searchText = adminTestSearchInput ? adminTestSearchInput.value.toLowerCase().trim() : "";
    const filterValue = adminTestFilterSelect ? adminTestFilterSelect.value : "ALL";

    let visibleCount = 0;

    items.forEach((item) => {
        const title = item.querySelector(".admin-test-title-row h4")?.textContent.toLowerCase() || "";
        const description = item.querySelector(".admin-test-description")?.textContent.toLowerCase() || "";
        const subject = (item.dataset.subject || "").toLowerCase();

        const matchesSearch =
            title.includes(searchText) ||
            description.includes(searchText) ||
            subject.includes(searchText);

        const passesFilter = matchesAdminFilter(item, filterValue);

        if (matchesSearch && passesFilter) {
            item.style.display = "";
            visibleCount++;
        } else {
            item.style.display = "none";
        }
    });

    updateAdminEmptyState(visibleCount);
}

function extractSubjectName(subjectItem) {
    if (typeof subjectItem === "string") {
        return subjectItem.trim();
    }

    if (!subjectItem || typeof subjectItem !== "object") {
        return "";
    }

    return String(
        subjectItem.name ??
        subjectItem.subjectName ??
        subjectItem.title ??
        subjectItem.subject ??
        ""
    ).trim();
}

async function loadAdminSubjectOptions() {
    if (!adminTestSubjectInput) return;

    try {
        const subjects = await fetchJson(buildSubjectsApiUrl());

        if (!Array.isArray(subjects) || subjects.length === 0) {
            return;
        }

        const currentValue = adminTestSubjectInput.value;
        const subjectNames = [...new Set(subjects.map(extractSubjectName).filter(Boolean))];

        adminTestSubjectInput.innerHTML = `<option value="">Select subject</option>`;

        subjectNames.forEach((name) => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            adminTestSubjectInput.appendChild(option);
        });

        if (currentValue && subjectNames.includes(currentValue)) {
            adminTestSubjectInput.value = currentValue;
        }
    } catch (error) {
        console.warn("Admin subjects dropdown load failed.", error);
    }
}

async function loadQuestionCountsForTests(tests) {
    questionCountByTestId = new Map();

    const settled = await Promise.allSettled(
        tests.map(async (test) => {
            const questions = await fetchJson(buildQuestionsApiUrl(test.id));
            return {
                testId: test.id,
                count: Array.isArray(questions) ? questions.length : 0
            };
        })
    );

    settled.forEach((result) => {
        if (result.status === "fulfilled") {
            questionCountByTestId.set(String(result.value.testId), result.value.count);
        }
    });
}

async function loadAdminTests() {
    try {
        const tests = await fetchJson(buildTestsApiUrl());

        allAdminTests = Array.isArray(tests)
            ? sortAdminTests(tests.map(mapBackendTestToFrontend))
            : [];

        await loadQuestionCountsForTests(allAdminTests);
        renderAdminTests(allAdminTests);
    } catch (error) {
        console.error("Admin tests load failed:", error);
        alert(`Admin tests load nahi ho pa rahe: ${error.message}`);
    }
}

function fillAdminFormForEdit(testItem) {
    editingAdminTestId = testItem.dataset.testId || null;

    const testData = allAdminTests.find((item) => String(item.id) === String(editingAdminTestId));
    if (!testData) return;

    if (adminTestTitleInput) {
        adminTestTitleInput.value = testData.title || "";
    }

    if (adminTestSubjectInput) {
        adminTestSubjectInput.value = testData.subject || "";
    }

    if (adminTestDateInput) {
        adminTestDateInput.value = testData.date || "";
    }

    if (adminTestTypeInput) {
        adminTestTypeInput.value = normalizeTestType(testData.type);
    }

    if (adminTestDurationInput) {
        adminTestDurationInput.value = testData.duration || "";
    }

    if (adminTestStatusInput) {
        adminTestStatusInput.value = normalizeAdminStatus(testData.adminStatus, testData.published);
    }

    if (adminNegativeMarkingInput) {
        adminNegativeMarkingInput.value = String(Boolean(testData.negativeMarking));
    }

    if (adminTestDescriptionInput) {
        adminTestDescriptionInput.value = testData.description || "";
    }

    if (adminTestInstructionsInput) {
        adminTestInstructionsInput.value = testData.instructions || "";
    }
}

async function createAdminTest(testData) {
    await fetchJson(buildTestsApiUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildAdminTestPayload(testData))
    });

    await loadAdminTests();
}

async function updateAdminTest(testId, testData) {
    await fetchJson(buildTestsApiUrl(testId), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildAdminTestPayload(testData))
    });

    await loadAdminTests();
}

async function deleteAdminTest(testId) {
    await fetchJson(buildTestsApiUrl(testId), {
        method: "DELETE"
    });

    await loadAdminTests();
}

async function handleAdminModalSubmit(event) {
    event.preventDefault();

    const title = adminTestTitleInput ? adminTestTitleInput.value.trim() : "";
    const subject = adminTestSubjectInput ? adminTestSubjectInput.value : "";
    const date = adminTestDateInput ? adminTestDateInput.value : "";
    const type = adminTestTypeInput ? adminTestTypeInput.value : "Upcoming";
    const duration = adminTestDurationInput ? adminTestDurationInput.value.trim() : "";
    const adminStatus = adminTestStatusInput ? adminTestStatusInput.value : "DRAFT";
    const negativeMarking = adminNegativeMarkingInput ? adminNegativeMarkingInput.value === "true" : false;
    const description = adminTestDescriptionInput ? adminTestDescriptionInput.value.trim() : "";
    const instructions = adminTestInstructionsInput ? adminTestInstructionsInput.value.trim() : "";

    if (!title) {
        alert("Please enter test title.");
        return;
    }

    if (!subject) {
        alert("Please select a subject.");
        return;
    }

    if (!date) {
        alert("Please select test date.");
        return;
    }

    const payload = {
        title,
        subject,
        date,
        type,
        duration,
        description: description || "Admin managed test draft.",
        instructions,
        adminStatus,
        published: adminStatus === "PUBLISHED",
        negativeMarking
    };

    try {
        if (saveAdminTestBtn) {
            saveAdminTestBtn.disabled = true;
            saveAdminTestBtn.textContent = editingAdminTestId ? "Updating..." : "Saving...";
        }

        if (editingAdminTestId) {
            await updateAdminTest(editingAdminTestId, payload);
        } else {
            await createAdminTest(payload);
        }

        closeAdminTestModal();
        clearAdminTestModalState();
    } catch (error) {
        console.error("Admin test save failed:", error);
        alert(`Admin test save nahi hua: ${error.message}`);
    } finally {
        if (saveAdminTestBtn) {
            saveAdminTestBtn.disabled = false;
        }

        if (editingAdminTestId) {
            setEditAdminTestMode();
        } else {
            setCreateAdminTestMode();
        }
    }
}

function buildPublishTogglePayload(testData) {
    const nextPublished = !Boolean(testData.published);
    const nextStatus = nextPublished ? "PUBLISHED" : "DRAFT";

    return {
        ...testData,
        published: nextPublished,
        adminStatus: nextStatus
    };
}

async function handleAdminTestListClick(event) {
    const manageButton = event.target.closest(".admin-action-btn.manage");
    const publishButton = event.target.closest(".admin-action-btn.publish, .admin-action-btn.unpublish");
    const editButton = event.target.closest(".admin-action-btn.edit");
    const deleteButton = event.target.closest(".admin-action-btn.delete");

    if (manageButton) {
        const item = manageButton.closest(".admin-test-item");
        const testId = item?.dataset.testId;
        if (!testId) return;

        const testData = allAdminTests.find((test) => String(test.id) === String(testId));
        const query = new URLSearchParams({
            testId: testId,
            title: testData?.title || "",
            subject: testData?.subject || ""
        });

        window.location.href = `admin-questions.html?${query.toString()}`;
        return;
    }

    if (publishButton) {
        const item = publishButton.closest(".admin-test-item");
        const testId = item?.dataset.testId;
        if (!testId) return;

        const testData = allAdminTests.find((test) => String(test.id) === String(testId));
        if (!testData) return;

        const nextStateLabel = testData.published ? "unpublish" : "publish";
        const shouldContinue = confirm(`Do you want to ${nextStateLabel} this test?`);
        if (!shouldContinue) return;

        try {
            await updateAdminTest(testId, buildPublishTogglePayload(testData));
        } catch (error) {
            console.error("Publish toggle failed:", error);
            alert(`Publish status update nahi hua: ${error.message}`);
        }
        return;
    }

    if (editButton) {
        const item = editButton.closest(".admin-test-item");
        if (!item) return;

        setEditAdminTestMode();
        fillAdminFormForEdit(item);
        openAdminTestModal();
        return;
    }

    if (deleteButton) {
        const item = deleteButton.closest(".admin-test-item");
        const testId = item?.dataset.testId;
        if (!testId) return;

        const shouldDelete = confirm("Do you want to delete this test?");
        if (!shouldDelete) return;

        try {
            await deleteAdminTest(testId);
        } catch (error) {
            console.error("Admin delete failed:", error);
            alert(`Test delete nahi hua: ${error.message}`);
        }
    }
}

function initializeAdminTestsPage() {

    // ─── Modal Open ───────────────────────────────────────────────
    if (openAdminTestModalBtn) {
        openAdminTestModalBtn.addEventListener("click", function () {
            clearAdminTestModalState();
            loadAdminSubjectOptions();
            openAdminTestModal();
        });
    }

    // ─── Modal Close — X button ───────────────────────────────────
    if (closeAdminTestModalBtn) {
        closeAdminTestModalBtn.addEventListener("click", function () {
            closeAdminTestModal();
            clearAdminTestModalState();
        });
    }

    // ─── Modal Close — Cancel button ─────────────────────────────
    if (cancelAdminTestModalBtn) {
        cancelAdminTestModalBtn.addEventListener("click", function () {
            closeAdminTestModal();
            clearAdminTestModalState();
        });
    }

    // ─── Modal Close — Overlay click ─────────────────────────────
    if (adminTestModalOverlay) {
        adminTestModalOverlay.addEventListener("click", function (event) {
            if (event.target === adminTestModalOverlay) {
                closeAdminTestModal();
                clearAdminTestModalState();
            }
        });
    }

    // ─── Modal Close — Escape key ────────────────────────────────
    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            adminTestModalOverlay &&
            !adminTestModalOverlay.classList.contains("hidden")
        ) {
            closeAdminTestModal();
            clearAdminTestModalState();
        }
    });

    // ─── Form Submit ──────────────────────────────────────────────
    if (adminTestModalForm) {
        adminTestModalForm.addEventListener("submit", handleAdminModalSubmit);
    }

    // ─── Test List Click (edit/delete/publish/manage) ─────────────
    if (adminTestList) {
        adminTestList.addEventListener("click", handleAdminTestListClick);
    }

    // ─── Search & Filter ──────────────────────────────────────────
    if (adminTestSearchInput) {
        adminTestSearchInput.addEventListener("input", applyAdminFilters);
    }

    if (adminTestFilterSelect) {
        adminTestFilterSelect.addEventListener("change", applyAdminFilters);
    }

    // ─── Init ─────────────────────────────────────────────────────
    setCreateAdminTestMode();
    loadAdminSubjectOptions();
    loadAdminTests();
}

initializeAdminTestsPage();