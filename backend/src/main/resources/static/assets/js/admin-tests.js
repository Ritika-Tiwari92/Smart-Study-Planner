/* =====================================================
   EduMind AI — Admin Tests JS
   Full updated file

   Includes:
   - Existing CRUD preserved
   - Enhanced filters: search + quick + subject + type + status + date range
   - Active filter chips
   - Bulk select / publish / unpublish / delete
   - Export visible/filtered tests as CSV
   - Sidebar tests count badge
   - Student name display instead of Owner ID
===================================================== */

/* =====================================================
   DOM References
===================================================== */

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

const adminSubjectFilterSelect = document.getElementById("adminSubjectFilterSelect");
const adminTypeFilterSelect = document.getElementById("adminTypeFilterSelect");
const adminStatusFilterSelect = document.getElementById("adminStatusFilterSelect");
const adminDateFromFilter = document.getElementById("adminDateFromFilter");
const adminDateToFilter = document.getElementById("adminDateToFilter");
const clearAdminTestFiltersBtn = document.getElementById("clearAdminTestFiltersBtn");
const adminActiveFilterChips = document.getElementById("adminActiveFilterChips");

const exportAdminTestsCsvBtn = document.getElementById("exportAdminTestsCsvBtn");

const selectAllAdminTestsCheckbox = document.getElementById("selectAllAdminTestsCheckbox");
const adminBulkActionBar = document.getElementById("adminBulkActionBar");
const bulkSelectedCountText = document.getElementById("bulkSelectedCountText");
const bulkPublishTestsBtn = document.getElementById("bulkPublishTestsBtn");
const bulkUnpublishTestsBtn = document.getElementById("bulkUnpublishTestsBtn");
const bulkDeleteTestsBtn = document.getElementById("bulkDeleteTestsBtn");
const bulkCancelSelectionBtn = document.getElementById("bulkCancelSelectionBtn");

const sidebarTestsCount = document.getElementById("sidebarTestsCount");

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

/* =====================================================
   API Constants + State
===================================================== */

const API_BASE_URL = window.location.port === "8080" ? "" : "http://localhost:8080";

const ADMIN_TESTS_API_URL = `${API_BASE_URL}/api/admin/tests`;
const SUBJECTS_API_URL = `${API_BASE_URL}/api/admin/subjects`;
const STUDENT_TESTS_API_URL = `${API_BASE_URL}/api/tests`;

let editingAdminTestId = null;
let allAdminTests = [];
let questionCountByTestId = new Map();
let selectedAdminTestIds = new Set();

/* =====================================================
   Toast + Field Error Helpers
===================================================== */

function showAdminToast(type, message) {
    const oldToast = document.querySelector(".admin-toast");

    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = `admin-toast ${type}`;

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
    return input ? input.closest(".test-form-group") : null;
}

function setFieldError(input, message) {
    if (!input) return;

    const wrapper = getFieldWrapper(input);

    input.classList.remove("admin-input-valid");
    input.classList.add("admin-input-error");

    if (!wrapper) return;

    let error = wrapper.querySelector(".admin-field-error");

    if (!error) {
        error = document.createElement("div");
        error.className = "admin-field-error";
        wrapper.appendChild(error);
    }

    error.textContent = message;
}

function clearFieldError(input) {
    if (!input) return;

    const wrapper = getFieldWrapper(input);

    input.classList.remove("admin-input-error");

    if (String(input.value || "").trim()) {
        input.classList.add("admin-input-valid");
    } else {
        input.classList.remove("admin-input-valid");
    }

    if (!wrapper) return;

    const error = wrapper.querySelector(".admin-field-error");

    if (error) {
        error.remove();
    }
}

function clearAllFieldErrors() {
    [
        adminTestTitleInput,
        adminTestSubjectInput,
        adminTestDateInput,
        adminTestDurationInput,
        adminTestDescriptionInput,
        adminTestInstructionsInput
    ].forEach(clearFieldError);
}

/* =====================================================
   Auth + Storage Helpers
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
        window.location.href = "/pages/login.html";
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

function getCurrentUserId() {
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
        tokenPayload?.uid;

    if (jwtUserId != null && jwtUserId !== "") {
        const numericJwtId = Number(jwtUserId);
        return Number.isNaN(numericJwtId) ? jwtUserId : numericJwtId;
    }

    return null;
}

/* =====================================================
   API URL Builders
===================================================== */

function addUserIdIfAvailable(url, explicitUserId = null) {
    const userId = explicitUserId || getCurrentUserId();

    if (userId == null || userId === "") {
        return url;
    }

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}userId=${encodeURIComponent(userId)}`;
}

function buildAdminTestsApiUrl(testId = "") {
    const path = testId ? `/${encodeURIComponent(testId)}` : "";
    return `${ADMIN_TESTS_API_URL}${path}`;
}

function buildSubjectsApiUrl() {
    return SUBJECTS_API_URL;
}

function buildQuestionsApiUrl(testId, explicitUserId = null) {
    return addUserIdIfAvailable(
        `${STUDENT_TESTS_API_URL}/${encodeURIComponent(testId)}/questions`,
        explicitUserId
    );
}

/* =====================================================
   Modal Helpers
===================================================== */

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
    clearAllFieldErrors();

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

/* =====================================================
   Normalize + Format Helpers
===================================================== */

function normalizeTestType(typeText) {
    const value = String(typeText || "").trim().toLowerCase();

    if (value === "upcoming") return "Upcoming";
    if (value === "this week") return "This Week";
    if (value === "mock test" || value === "mock tests") return "Mock Test";
    if (value === "completed") return "Completed";

    return "Upcoming";
}

function normalizeAdminStatus(statusText, publishedValue = false) {
    const value = String(statusText || "").trim().toUpperCase();

    if (value === "PUBLISHED") return "PUBLISHED";
    if (value === "DRAFT") return "DRAFT";

    return publishedValue ? "PUBLISHED" : "DRAFT";
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
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function isDefaultDescription(description) {
    const value = String(description || "").trim().toLowerCase();
    return !value || value === "admin managed test draft.";
}

function getOwnerLabel(test) {
    if (test.studentName && String(test.studentName).trim()) {
        return `Student: ${test.studentName}`;
    }

    if (test.fullName && String(test.fullName).trim()) {
        return `Student: ${test.fullName}`;
    }

    if (test.name && String(test.name).trim()) {
        return `Student: ${test.name}`;
    }

    if (test.studentEmail && String(test.studentEmail).trim()) {
        return `Student: ${test.studentEmail}`;
    }

    return test.userId ? `Owner: #${test.userId}` : "Owner: Admin";
}

/* =====================================================
   API Helpers
===================================================== */

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
        // raw response use hoga
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
        showAdminToast("error", "Admin session expired. Please login again.");
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
        throw new Error("Invalid backend response format.");
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
        if (Array.isArray(data.tests)) return data.tests;
        if (Array.isArray(data.subjects)) return data.subjects;
        if (Array.isArray(data.questions)) return data.questions;
    }

    return [];
}

/* =====================================================
   Mapping
===================================================== */

function mapBackendTestToFrontend(test) {
    const publishedValue =
        typeof test.published === "boolean"
            ? test.published
            : normalizeAdminStatus(test.adminStatus) === "PUBLISHED";

    return {
        id: test.id,
        userId: test.userId || test.studentId || test.ownerId || test.user?.id || null,
        title: test.title || "",
        subject: test.subject || test.subjectName || "",
        date: test.testDate || test.date || "",
        type: normalizeTestType(test.testType || test.type || ""),
        duration: test.duration || "",
        description: test.description || "",
        instructions: test.instructions || "",
        negativeMarking: Boolean(test.negativeMarking),
        published: publishedValue,
        adminStatus: normalizeAdminStatus(test.adminStatus, publishedValue),
        studentName: test.studentName || test.fullName || test.name || test.user?.fullName || test.user?.name || "",
        studentEmail: test.studentEmail || test.email || test.user?.email || ""
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
        adminStatus: adminStatus,
        instructions: testData.instructions || null,
        negativeMarking: Boolean(testData.negativeMarking),
        score: testData.score ?? null,
        focusArea: testData.focusArea ?? null,
        testTip: testData.testTip ?? null
    };
}

/* =====================================================
   Render Tests
===================================================== */

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
    item.dataset.userId = test.userId || "";
    item.dataset.type = test.type;
    item.dataset.status = test.adminStatus;
    item.dataset.subject = test.subject;
    item.dataset.duration = test.duration;
    item.dataset.description = test.description;
    item.dataset.instructions = test.instructions || "";
    item.dataset.negativeMarking = String(Boolean(test.negativeMarking));
    item.dataset.date = test.date || "";
    item.dataset.title = test.title || "";
    item.dataset.studentName = test.studentName || "";
    item.dataset.studentEmail = test.studentEmail || "";
    item.dataset.questionCount = String(questionCount);

    const descriptionHtml = isDefaultDescription(test.description)
        ? ""
        : `<p class="admin-test-description">${escapeHtml(test.description)}</p>`;

    item.innerHTML = `
        <div class="admin-test-checkbox-wrap">
            <input type="checkbox" class="admin-test-select-checkbox" data-test-id="${escapeHtml(test.id)}" />
        </div>

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
                <span class="admin-test-meta-chip">${escapeHtml(getOwnerLabel(test))}</span>
            </div>

            ${descriptionHtml}
        </div>

        <div class="admin-test-actions">
            <button class="admin-action-btn manage" type="button" title="Manage Questions">
                <i class="fa-solid fa-list-ul"></i>
                <span>Questions</span>
            </button>

            <button class="admin-action-btn ${publishActionClass}" type="button" title="${escapeHtml(publishActionLabel)}">
                <i class="fa-solid ${publishActionIcon}"></i>
                <span>${escapeHtml(publishActionLabel)}</span>
            </button>

            <button class="admin-action-btn edit" type="button" title="Edit Test">
                <i class="fa-solid fa-pen"></i>
                <span>Edit</span>
            </button>

            <button class="admin-action-btn delete" type="button" title="Delete Test">
                <i class="fa-solid fa-trash"></i>
                <span>Delete</span>
            </button>
        </div>
    `;

    if (selectedAdminTestIds.has(String(test.id))) {
        item.classList.add("selected");
        const checkbox = item.querySelector(".admin-test-select-checkbox");
        if (checkbox) checkbox.checked = true;
    }

    return item;
}

function renderAdminTests(tests) {
    if (!adminTestList) return;

    adminTestList.innerHTML = "";

    tests.forEach((test) => {
        adminTestList.appendChild(createAdminTestItem(test));
    });

    populateEnhancedFilterOptions();
    applyAdminFilters();
    updateAdminSummaryCards();
    updateSidebarTestsCount();
    syncBulkSelectionUI();
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

function updateSidebarTestsCount() {
    if (!sidebarTestsCount) return;

    sidebarTestsCount.textContent = String(allAdminTests.length);

    if (allAdminTests.length <= 0) {
        sidebarTestsCount.classList.add("hidden");
    } else {
        sidebarTestsCount.classList.remove("hidden");
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

/* =====================================================
   Enhanced Filters
===================================================== */

function getFilterValues() {
    return {
        search: adminTestSearchInput ? adminTestSearchInput.value.toLowerCase().trim() : "",
        quick: adminTestFilterSelect ? adminTestFilterSelect.value : "ALL",
        subject: adminSubjectFilterSelect ? adminSubjectFilterSelect.value : "ALL",
        type: adminTypeFilterSelect ? adminTypeFilterSelect.value : "ALL",
        status: adminStatusFilterSelect ? adminStatusFilterSelect.value : "ALL",
        dateFrom: adminDateFromFilter ? adminDateFromFilter.value : "",
        dateTo: adminDateToFilter ? adminDateToFilter.value : ""
    };
}

function getUniqueSortedValues(items, getter) {
    return [...new Set(items.map(getter).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b)));
}

function preserveSelectValue(select, callback) {
    if (!select) return;

    const oldValue = select.value;
    callback();

    const exists = [...select.options].some((option) => option.value === oldValue);

    if (exists) {
        select.value = oldValue;
    }
}

function populateEnhancedFilterOptions() {
    preserveSelectValue(adminSubjectFilterSelect, function () {
        if (!adminSubjectFilterSelect) return;

        const subjects = getUniqueSortedValues(allAdminTests, (test) => test.subject);

        adminSubjectFilterSelect.innerHTML = `<option value="ALL">All Subjects</option>`;

        subjects.forEach((subject) => {
            const option = document.createElement("option");
            option.value = subject;
            option.textContent = subject;
            adminSubjectFilterSelect.appendChild(option);
        });
    });

    preserveSelectValue(adminTypeFilterSelect, function () {
        if (!adminTypeFilterSelect) return;

        const existingTypes = getUniqueSortedValues(allAdminTests, (test) => normalizeTestType(test.type));
        const baseTypes = ["Upcoming", "This Week", "Mock Test", "Completed"];
        const types = [...new Set([...baseTypes, ...existingTypes])];

        adminTypeFilterSelect.innerHTML = `<option value="ALL">All Types</option>`;

        types.forEach((type) => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            adminTypeFilterSelect.appendChild(option);
        });
    });
}

function matchesQuickFilter(test, quickValue) {
    if (!quickValue || quickValue === "ALL") return true;

    const type = normalizeTestType(test.type);
    const status = normalizeAdminStatus(test.adminStatus, test.published);

    if (quickValue === "DRAFT") return status === "DRAFT";
    if (quickValue === "PUBLISHED") return status === "PUBLISHED";
    if (quickValue === "UPCOMING") return type === "Upcoming";
    if (quickValue === "THIS_WEEK") return type === "This Week";
    if (quickValue === "MOCK_TEST") return type === "Mock Test";

    return true;
}

function matchesDateRange(testDateValue, dateFrom, dateTo) {
    if (!dateFrom && !dateTo) return true;

    const testDate = parseDateValue(testDateValue);
    if (!testDate) return false;

    const testTime = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate()).getTime();

    if (dateFrom) {
        const fromDate = parseDateValue(dateFrom);
        if (fromDate) {
            const fromTime = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime();
            if (testTime < fromTime) return false;
        }
    }

    if (dateTo) {
        const toDate = parseDateValue(dateTo);
        if (toDate) {
            const toTime = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()).getTime();
            if (testTime > toTime) return false;
        }
    }

    return true;
}

function getTestByIdFromDataset(testId) {
    return allAdminTests.find((test) => String(test.id) === String(testId));
}

function applyAdminFilters() {
    if (!adminTestList) return;

    const filters = getFilterValues();
    const items = adminTestList.querySelectorAll(".admin-test-item");

    let visibleCount = 0;

    items.forEach((item) => {
        const testId = item.dataset.testId;
        const test = getTestByIdFromDataset(testId);

        if (!test) {
            item.style.display = "none";
            return;
        }

        const title = String(test.title || "").toLowerCase();
        const description = String(test.description || "").toLowerCase();
        const subject = String(test.subject || "").toLowerCase();
        const studentName = String(test.studentName || "").toLowerCase();
        const studentEmail = String(test.studentEmail || "").toLowerCase();

        const matchesSearch =
            !filters.search ||
            title.includes(filters.search) ||
            description.includes(filters.search) ||
            subject.includes(filters.search) ||
            studentName.includes(filters.search) ||
            studentEmail.includes(filters.search);

        const matchesQuick = matchesQuickFilter(test, filters.quick);

        const matchesSubject =
            filters.subject === "ALL" ||
            String(test.subject || "") === filters.subject;

        const matchesType =
            filters.type === "ALL" ||
            normalizeTestType(test.type) === filters.type;

        const matchesStatus =
            filters.status === "ALL" ||
            normalizeAdminStatus(test.adminStatus, test.published) === filters.status;

        const matchesDate = matchesDateRange(test.date, filters.dateFrom, filters.dateTo);

        const visible =
            matchesSearch &&
            matchesQuick &&
            matchesSubject &&
            matchesType &&
            matchesStatus &&
            matchesDate;

        if (visible) {
            item.style.display = "";
            visibleCount++;
        } else {
            item.style.display = "none";

            if (selectedAdminTestIds.has(String(test.id))) {
                selectedAdminTestIds.delete(String(test.id));
            }
        }
    });

    renderActiveFilterChips(filters);
    updateAdminEmptyState(visibleCount);
    syncBulkSelectionUI();
}

function renderActiveFilterChips(filters = getFilterValues()) {
    if (!adminActiveFilterChips) return;

    const chips = [];

    if (filters.search) {
        chips.push({
            key: "search",
            label: `Search: ${filters.search}`
        });
    }

    if (filters.quick && filters.quick !== "ALL") {
        chips.push({
            key: "quick",
            label: `Quick: ${filters.quick.replace("_", " ")}`
        });
    }

    if (filters.subject && filters.subject !== "ALL") {
        chips.push({
            key: "subject",
            label: `Subject: ${filters.subject}`
        });
    }

    if (filters.type && filters.type !== "ALL") {
        chips.push({
            key: "type",
            label: `Type: ${filters.type}`
        });
    }

    if (filters.status && filters.status !== "ALL") {
        chips.push({
            key: "status",
            label: `Status: ${filters.status}`
        });
    }

    if (filters.dateFrom) {
        chips.push({
            key: "dateFrom",
            label: `From: ${filters.dateFrom}`
        });
    }

    if (filters.dateTo) {
        chips.push({
            key: "dateTo",
            label: `To: ${filters.dateTo}`
        });
    }

    if (!chips.length) {
        adminActiveFilterChips.innerHTML = `
            <span class="filter-chip empty-chip">
                <i class="fa-solid fa-circle-info"></i>
                No active filters
            </span>
        `;
        return;
    }

    adminActiveFilterChips.innerHTML = chips.map((chip) => `
        <span class="filter-chip">
            ${escapeHtml(chip.label)}
            <button type="button" data-clear-filter="${escapeHtml(chip.key)}" title="Remove filter">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </span>
    `).join("");
}

function clearSingleFilter(key) {
    if (key === "search" && adminTestSearchInput) adminTestSearchInput.value = "";
    if (key === "quick" && adminTestFilterSelect) adminTestFilterSelect.value = "ALL";
    if (key === "subject" && adminSubjectFilterSelect) adminSubjectFilterSelect.value = "ALL";
    if (key === "type" && adminTypeFilterSelect) adminTypeFilterSelect.value = "ALL";
    if (key === "status" && adminStatusFilterSelect) adminStatusFilterSelect.value = "ALL";
    if (key === "dateFrom" && adminDateFromFilter) adminDateFromFilter.value = "";
    if (key === "dateTo" && adminDateToFilter) adminDateToFilter.value = "";

    applyAdminFilters();
}

function clearAllAdminFilters() {
    if (adminTestSearchInput) adminTestSearchInput.value = "";
    if (adminTestFilterSelect) adminTestFilterSelect.value = "ALL";
    if (adminSubjectFilterSelect) adminSubjectFilterSelect.value = "ALL";
    if (adminTypeFilterSelect) adminTypeFilterSelect.value = "ALL";
    if (adminStatusFilterSelect) adminStatusFilterSelect.value = "ALL";
    if (adminDateFromFilter) adminDateFromFilter.value = "";
    if (adminDateToFilter) adminDateToFilter.value = "";

    selectedAdminTestIds.clear();
    applyAdminFilters();
    showAdminToast("info", "Filters cleared.");
}

function getVisibleTestItems() {
    if (!adminTestList) return [];

    return [...adminTestList.querySelectorAll(".admin-test-item")]
        .filter((item) => item.style.display !== "none");
}

function getVisibleTests() {
    return getVisibleTestItems()
        .map((item) => getTestByIdFromDataset(item.dataset.testId))
        .filter(Boolean);
}

/* =====================================================
   Subject Dropdown + Question Count
===================================================== */

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
        const response = await fetchJson(buildSubjectsApiUrl());
        const subjects = unwrapArrayResponse(response, ["subjects"]);

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
        showAdminToast("error", "Subjects dropdown load nahi hua.");
    }
}

async function loadQuestionCountsForTests(tests) {
    questionCountByTestId = new Map();

    const settled = await Promise.allSettled(
        tests.map(async (test) => {
            const response = await fetchJson(buildQuestionsApiUrl(test.id, test.userId));
            const questions = unwrapArrayResponse(response, ["questions"]);

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

/* =====================================================
   Backend CRUD
===================================================== */

async function loadAdminTests(showToastAfterLoad = false) {
    try {
        if (adminTestList) {
            adminTestList.innerHTML = `
                <div class="tests-empty-state">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <h3>Loading tests...</h3>
                    <p>Please wait while admin tests are loading.</p>
                </div>
            `;
        }

        const response = await fetchJson(ADMIN_TESTS_API_URL);
        const tests = unwrapArrayResponse(response, ["tests"]);

        allAdminTests = Array.isArray(tests)
            ? sortAdminTests(tests.map(mapBackendTestToFrontend))
            : [];

        selectedAdminTestIds = new Set(
            [...selectedAdminTestIds].filter((id) =>
                allAdminTests.some((test) => String(test.id) === String(id))
            )
        );

        await loadQuestionCountsForTests(allAdminTests);
        renderAdminTests(allAdminTests);

        if (showToastAfterLoad) {
            showAdminToast("success", "Tests refreshed successfully.");
        }

    } catch (error) {
        console.error("Admin tests load failed:", error);

        allAdminTests = [];
        questionCountByTestId = new Map();
        selectedAdminTestIds.clear();

        updateAdminSummaryCards();
        updateSidebarTestsCount();
        syncBulkSelectionUI();

        if (adminTestList) {
            adminTestList.innerHTML = `
                <div class="tests-empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Admin tests load nahi ho pa rahe</h3>
                    <p>${escapeHtml(error.message || "Please check backend, token, or API URL.")}</p>
                </div>
            `;
        }

        updateAdminEmptyState(1);
        showAdminToast("error", error.message || "Admin tests load nahi ho pa rahe.");
    }
}

async function createAdminTest(testData) {
    await fetchJson(buildAdminTestsApiUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildAdminTestPayload(testData))
    });

    await loadAdminTests(false);
}

async function updateAdminTest(testId, testData) {
    await fetchJson(buildAdminTestsApiUrl(testId), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildAdminTestPayload(testData))
    });

    await loadAdminTests(false);
}

async function deleteAdminTest(testId) {
    await fetchJson(buildAdminTestsApiUrl(testId), {
        method: "DELETE"
    });

    selectedAdminTestIds.delete(String(testId));
    await loadAdminTests(false);
}

/* =====================================================
   Edit Fill
===================================================== */

function fillAdminFormForEdit(testItem) {
    editingAdminTestId = testItem.dataset.testId || null;

    const testData = allAdminTests.find((item) => String(item.id) === String(editingAdminTestId));

    if (!testData) {
        showAdminToast("error", "Selected test data not found.");
        return;
    }

    clearAllFieldErrors();

    if (adminTestTitleInput) adminTestTitleInput.value = testData.title || "";

    if (adminTestSubjectInput) {
        const existingOption = [...adminTestSubjectInput.options].some(
            (option) => option.value === testData.subject
        );

        if (testData.subject && !existingOption) {
            const option = document.createElement("option");
            option.value = testData.subject;
            option.textContent = testData.subject;
            adminTestSubjectInput.appendChild(option);
        }

        adminTestSubjectInput.value = testData.subject || "";
    }

    if (adminTestDateInput) adminTestDateInput.value = testData.date || "";
    if (adminTestTypeInput) adminTestTypeInput.value = normalizeTestType(testData.type);
    if (adminTestDurationInput) adminTestDurationInput.value = testData.duration || "";
    if (adminTestStatusInput) adminTestStatusInput.value = normalizeAdminStatus(testData.adminStatus, testData.published);
    if (adminNegativeMarkingInput) adminNegativeMarkingInput.value = String(Boolean(testData.negativeMarking));
    if (adminTestDescriptionInput) adminTestDescriptionInput.value = isDefaultDescription(testData.description) ? "" : testData.description;
    if (adminTestInstructionsInput) adminTestInstructionsInput.value = testData.instructions || "";
}

/* =====================================================
   Validation + Submit
===================================================== */

function validateAdminTestForm() {
    clearAllFieldErrors();

    let isValid = true;

    const title = adminTestTitleInput ? adminTestTitleInput.value.trim() : "";
    const subject = adminTestSubjectInput ? adminTestSubjectInput.value : "";
    const date = adminTestDateInput ? adminTestDateInput.value : "";
    const duration = adminTestDurationInput ? adminTestDurationInput.value.trim() : "";

    if (!title) {
        setFieldError(adminTestTitleInput, "Test title is required.");
        isValid = false;
    } else if (title.length < 3) {
        setFieldError(adminTestTitleInput, "Test title must be at least 3 characters.");
        isValid = false;
    } else {
        clearFieldError(adminTestTitleInput);
    }

    if (!subject) {
        setFieldError(adminTestSubjectInput, "Please select a subject.");
        isValid = false;
    } else {
        clearFieldError(adminTestSubjectInput);
    }

    if (!date) {
        setFieldError(adminTestDateInput, "Please select test date.");
        isValid = false;
    } else {
        clearFieldError(adminTestDateInput);
    }

    if (duration && duration.length < 1) {
        setFieldError(adminTestDurationInput, "Duration should be clear, e.g. 60 mins.");
        isValid = false;
    } else {
        clearFieldError(adminTestDurationInput);
    }

    if (!isValid) {
        showAdminToast("error", "Please fix the highlighted fields.");
    }

    return isValid;
}

async function handleAdminModalSubmit(event) {
    event.preventDefault();

    if (!validateAdminTestForm()) return;

    const payload = {
        title: adminTestTitleInput ? adminTestTitleInput.value.trim() : "",
        subject: adminTestSubjectInput ? adminTestSubjectInput.value : "",
        date: adminTestDateInput ? adminTestDateInput.value : "",
        type: adminTestTypeInput ? adminTestTypeInput.value : "Upcoming",
        duration: adminTestDurationInput ? adminTestDurationInput.value.trim() : "",
        description: adminTestDescriptionInput
            ? adminTestDescriptionInput.value.trim() || "Admin managed test draft."
            : "Admin managed test draft.",
        instructions: adminTestInstructionsInput ? adminTestInstructionsInput.value.trim() : "",
        adminStatus: adminTestStatusInput ? adminTestStatusInput.value : "DRAFT",
        published: adminTestStatusInput ? adminTestStatusInput.value === "PUBLISHED" : false,
        negativeMarking: adminNegativeMarkingInput ? adminNegativeMarkingInput.value === "true" : false
    };

    try {
        if (saveAdminTestBtn) {
            saveAdminTestBtn.disabled = true;
            saveAdminTestBtn.textContent = editingAdminTestId ? "Updating..." : "Saving...";
        }

        if (editingAdminTestId) {
            await updateAdminTest(editingAdminTestId, payload);
            showAdminToast("success", "Test updated successfully.");
        } else {
            await createAdminTest(payload);
            showAdminToast("success", "Test created successfully.");
        }

        closeAdminTestModal();
        clearAdminTestModalState();

    } catch (error) {
        console.error("Admin test save failed:", error);
        showAdminToast("error", `Admin test save nahi hua: ${error.message}`);

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

/* =====================================================
   Publish / Delete / Manage Actions
===================================================== */

function buildPublishTogglePayload(testData) {
    const nextPublished = !Boolean(testData.published);
    const nextStatus = nextPublished ? "PUBLISHED" : "DRAFT";

    return {
        ...testData,
        published: nextPublished,
        adminStatus: nextStatus
    };
}

function buildStatusPayload(testData, targetStatus) {
    const normalizedStatus = normalizeAdminStatus(targetStatus, targetStatus === "PUBLISHED");

    return {
        ...testData,
        published: normalizedStatus === "PUBLISHED",
        adminStatus: normalizedStatus
    };
}

async function handleAdminTestListClick(event) {
    const checkbox = event.target.closest(".admin-test-select-checkbox");

    if (checkbox) {
        handleSingleTestCheckboxChange(checkbox);
        return;
    }

    const manageButton = event.target.closest(".admin-action-btn.manage");
    const publishButton = event.target.closest(".admin-action-btn.publish, .admin-action-btn.unpublish");
    const editButton = event.target.closest(".admin-action-btn.edit");
    const deleteButton = event.target.closest(".admin-action-btn.delete");

    if (manageButton) {
        const item = manageButton.closest(".admin-test-item");
        const testId = item?.dataset.testId;

        if (!testId) {
            showAdminToast("error", "Test ID not found.");
            return;
        }

        const testData = allAdminTests.find((test) => String(test.id) === String(testId));

        const query = new URLSearchParams({
            testId: testId,
            title: testData?.title || "",
            subject: testData?.subject || ""
        });

        const ownerUserId = testData?.userId || item?.dataset.userId;

        if (ownerUserId) {
            query.set("userId", ownerUserId);
        }

        window.location.href = `admin-question-bank.html?${query.toString()}`;
        return;
    }

    if (publishButton) {
        const item = publishButton.closest(".admin-test-item");
        const testId = item?.dataset.testId;

        if (!testId) {
            showAdminToast("error", "Test ID not found.");
            return;
        }

        const testData = allAdminTests.find((test) => String(test.id) === String(testId));

        if (!testData) {
            showAdminToast("error", "Selected test not found.");
            return;
        }

        const nextStateLabel = testData.published ? "unpublish" : "publish";
        const shouldContinue = confirm(`Do you want to ${nextStateLabel} this test?`);

        if (!shouldContinue) return;

        try {
            await updateAdminTest(testId, buildPublishTogglePayload(testData));
            showAdminToast("success", `Test ${nextStateLabel}ed successfully.`);
        } catch (error) {
            console.error("Publish toggle failed:", error);
            showAdminToast("error", `Publish status update nahi hua: ${error.message}`);
        }

        return;
    }

    if (editButton) {
        const item = editButton.closest(".admin-test-item");

        if (!item) {
            showAdminToast("error", "Selected test item not found.");
            return;
        }

        setEditAdminTestMode();
        await loadAdminSubjectOptions();
        fillAdminFormForEdit(item);
        openAdminTestModal();
        return;
    }

    if (deleteButton) {
        const item = deleteButton.closest(".admin-test-item");
        const testId = item?.dataset.testId;

        if (!testId) {
            showAdminToast("error", "Test ID not found.");
            return;
        }

        const shouldDelete = confirm("Do you want to delete this test?");

        if (!shouldDelete) return;

        try {
            await deleteAdminTest(testId);
            showAdminToast("success", "Test deleted successfully.");
        } catch (error) {
            console.error("Admin delete failed:", error);
            showAdminToast("error", `Test delete nahi hua: ${error.message}`);
        }
    }
}

/* =====================================================
   Bulk Actions
===================================================== */

function handleSingleTestCheckboxChange(checkbox) {
    const testId = checkbox.dataset.testId;
    const item = checkbox.closest(".admin-test-item");

    if (!testId) return;

    if (checkbox.checked) {
        selectedAdminTestIds.add(String(testId));
        item?.classList.add("selected");
    } else {
        selectedAdminTestIds.delete(String(testId));
        item?.classList.remove("selected");
    }

    syncBulkSelectionUI();
}

function getVisibleSelectableTestIds() {
    return getVisibleTestItems().map((item) => String(item.dataset.testId)).filter(Boolean);
}

function syncBulkSelectionUI() {
    const visibleIds = getVisibleSelectableTestIds();

    selectedAdminTestIds = new Set(
        [...selectedAdminTestIds].filter((id) => visibleIds.includes(String(id)))
    );

    if (adminTestList) {
        adminTestList.querySelectorAll(".admin-test-item").forEach((item) => {
            const testId = String(item.dataset.testId);
            const checkbox = item.querySelector(".admin-test-select-checkbox");
            const selected = selectedAdminTestIds.has(testId);

            if (checkbox) checkbox.checked = selected;
            item.classList.toggle("selected", selected);
        });
    }

    const selectedCount = selectedAdminTestIds.size;

    if (bulkSelectedCountText) {
        bulkSelectedCountText.textContent = `${selectedCount} test${selectedCount === 1 ? "" : "s"} selected`;
    }

    if (adminBulkActionBar) {
        adminBulkActionBar.classList.toggle("hidden", selectedCount === 0);
    }

    if (selectAllAdminTestsCheckbox) {
        const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedAdminTestIds.has(String(id)));
        const someVisibleSelected = visibleIds.some((id) => selectedAdminTestIds.has(String(id)));

        selectAllAdminTestsCheckbox.checked = allVisibleSelected;
        selectAllAdminTestsCheckbox.indeterminate = !allVisibleSelected && someVisibleSelected;
    }
}

function toggleSelectAllVisibleTests(checked) {
    const visibleIds = getVisibleSelectableTestIds();

    if (checked) {
        visibleIds.forEach((id) => selectedAdminTestIds.add(String(id)));
    } else {
        visibleIds.forEach((id) => selectedAdminTestIds.delete(String(id)));
    }

    syncBulkSelectionUI();
}

function clearBulkSelection() {
    selectedAdminTestIds.clear();
    syncBulkSelectionUI();
}

async function performBulkStatusUpdate(targetStatus) {
    const selectedIds = [...selectedAdminTestIds];

    if (!selectedIds.length) {
        showAdminToast("info", "Please select tests first.");
        return;
    }

    const label = targetStatus === "PUBLISHED" ? "publish" : "unpublish";
    const shouldContinue = confirm(`Do you want to ${label} ${selectedIds.length} selected test(s)?`);

    if (!shouldContinue) return;

    try {
        for (const testId of selectedIds) {
            const testData = allAdminTests.find((test) => String(test.id) === String(testId));

            if (!testData) continue;

            await fetchJson(buildAdminTestsApiUrl(testId), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(buildAdminTestPayload(buildStatusPayload(testData, targetStatus)))
            });
        }

        selectedAdminTestIds.clear();
        await loadAdminTests(false);
        showAdminToast("success", `Bulk ${label} completed successfully.`);

    } catch (error) {
        console.error("Bulk status update failed:", error);
        showAdminToast("error", `Bulk action failed: ${error.message}`);
        await loadAdminTests(false);
    }
}

async function performBulkDelete() {
    const selectedIds = [...selectedAdminTestIds];

    if (!selectedIds.length) {
        showAdminToast("info", "Please select tests first.");
        return;
    }

    const shouldDelete = confirm(`Do you want to delete ${selectedIds.length} selected test(s)?`);

    if (!shouldDelete) return;

    try {
        for (const testId of selectedIds) {
            await fetchJson(buildAdminTestsApiUrl(testId), {
                method: "DELETE"
            });
        }

        selectedAdminTestIds.clear();
        await loadAdminTests(false);
        showAdminToast("success", "Selected tests deleted successfully.");

    } catch (error) {
        console.error("Bulk delete failed:", error);
        showAdminToast("error", `Bulk delete failed: ${error.message}`);
        await loadAdminTests(false);
    }
}

/* =====================================================
   Export CSV
===================================================== */

function csvEscape(value) {
    const stringValue = String(value ?? "");

    if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

function exportVisibleTestsToCsv() {
    const visibleTests = getVisibleTests();

    if (!visibleTests.length) {
        showAdminToast("info", "No visible tests to export.");
        return;
    }

    const headers = [
        "Title",
        "Subject",
        "Test Date",
        "Type",
        "Duration",
        "Status",
        "Questions Count",
        "Owner ID"
    ];

    const rows = visibleTests.map((test) => {
        const questionCount = questionCountByTestId.get(String(test.id)) ?? 0;

        return [
            test.title || "",
            test.subject || "",
            test.date || "",
            normalizeTestType(test.type),
            test.duration || "",
            normalizeAdminStatus(test.adminStatus, test.published),
            questionCount,
            test.userId || ""
        ];
    });

    const csvContent = [
        headers.map(csvEscape).join(","),
        ...rows.map((row) => row.map(csvEscape).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const today = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `edumind-tests-${today}.csv`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAdminToast("success", "Filtered tests exported as CSV.");
}

/* =====================================================
   Init
===================================================== */

function initializeAdminTestsPage() {
    if (openAdminTestModalBtn) {
        openAdminTestModalBtn.addEventListener("click", function () {
            clearAdminTestModalState();
            loadAdminSubjectOptions();
            openAdminTestModal();
        });
    }

    if (closeAdminTestModalBtn) {
        closeAdminTestModalBtn.addEventListener("click", function () {
            closeAdminTestModal();
            clearAdminTestModalState();
        });
    }

    if (cancelAdminTestModalBtn) {
        cancelAdminTestModalBtn.addEventListener("click", function () {
            closeAdminTestModal();
            clearAdminTestModalState();
        });
    }

    if (adminTestModalOverlay) {
        adminTestModalOverlay.addEventListener("click", function (event) {
            if (event.target === adminTestModalOverlay) {
                closeAdminTestModal();
                clearAdminTestModalState();
            }
        });
    }

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

    if (adminTestModalForm) {
        adminTestModalForm.addEventListener("submit", handleAdminModalSubmit);
    }

    if (adminTestList) {
        adminTestList.addEventListener("click", handleAdminTestListClick);
    }

    [
        adminTestSearchInput,
        adminTestFilterSelect,
        adminSubjectFilterSelect,
        adminTypeFilterSelect,
        adminStatusFilterSelect,
        adminDateFromFilter,
        adminDateToFilter
    ].forEach(function (input) {
        if (!input) return;

        input.addEventListener("input", applyAdminFilters);
        input.addEventListener("change", applyAdminFilters);
    });

    if (clearAdminTestFiltersBtn) {
        clearAdminTestFiltersBtn.addEventListener("click", clearAllAdminFilters);
    }

    if (adminActiveFilterChips) {
        adminActiveFilterChips.addEventListener("click", function (event) {
            const clearBtn = event.target.closest("[data-clear-filter]");

            if (!clearBtn) return;

            clearSingleFilter(clearBtn.dataset.clearFilter);
        });
    }

    if (selectAllAdminTestsCheckbox) {
        selectAllAdminTestsCheckbox.addEventListener("change", function () {
            toggleSelectAllVisibleTests(this.checked);
        });
    }

    if (bulkPublishTestsBtn) {
        bulkPublishTestsBtn.addEventListener("click", function () {
            performBulkStatusUpdate("PUBLISHED");
        });
    }

    if (bulkUnpublishTestsBtn) {
        bulkUnpublishTestsBtn.addEventListener("click", function () {
            performBulkStatusUpdate("DRAFT");
        });
    }

    if (bulkDeleteTestsBtn) {
        bulkDeleteTestsBtn.addEventListener("click", performBulkDelete);
    }

    if (bulkCancelSelectionBtn) {
        bulkCancelSelectionBtn.addEventListener("click", clearBulkSelection);
    }

    if (exportAdminTestsCsvBtn) {
        exportAdminTestsCsvBtn.addEventListener("click", exportVisibleTestsToCsv);
    }

    [adminTestTitleInput, adminTestSubjectInput, adminTestDateInput, adminTestDurationInput].forEach(function (input) {
        if (!input) return;

        input.addEventListener("input", function () {
            clearFieldError(input);
        });

        input.addEventListener("change", function () {
            clearFieldError(input);
        });
    });

    setCreateAdminTestMode();
    loadAdminSubjectOptions();
    loadAdminTests(false);
}

initializeAdminTestsPage();