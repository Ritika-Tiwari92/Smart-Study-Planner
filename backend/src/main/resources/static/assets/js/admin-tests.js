/* =====================================================
   EduMind AI — Admin Tests JS
   Full Clean Updated Copy-Paste File

   Fixed:
   - Create / Update / Delete uses /api/admin/tests
   - List / Count reloads from /api/admin/tests
   - No fake success if backend save fails
   - Toast messages instead of alert
   - Field-wise validation
   - Existing Question Bank flow preserved
   - FIX: duration sent as String (matches private String duration in Test.java)
   - FIX: score sent as 0 (NOT NULL guard per prepareTestBeforeSave in TestService)
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

const API_BASE_URL = window.location.port === "8080" ? "" : "http://localhost:8080";

const ADMIN_TESTS_API_URL = `${API_BASE_URL}/api/admin/tests`;
const SUBJECTS_API_URL = `${API_BASE_URL}/api/admin/subjects`;
const STUDENT_TESTS_API_URL = `${API_BASE_URL}/api/tests`;

let editingAdminTestId = null;
let allAdminTests = [];
let questionCountByTestId = new Map();

/* =====================================================
   Toast + Field Error Helpers
===================================================== */

function injectAdminTestUtilityStyles() {
    if (document.getElementById("adminTestsUtilityStyles")) return;

    const style = document.createElement("style");
    style.id = "adminTestsUtilityStyles";
    style.textContent = `
        .admin-toast {
            position: fixed;
            top: 82px;
            right: 22px;
            z-index: 99999;
            min-width: 270px;
            max-width: 390px;
            padding: 14px 16px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            font-weight: 700;
            box-shadow: 0 18px 40px rgba(0,0,0,0.28);
            animation: adminToastIn 0.25s ease;
        }

        @keyframes adminToastIn {
            from { opacity: 0; transform: translateX(18px); }
            to   { opacity: 1; transform: translateX(0); }
        }

        .admin-toast.success {
            background: #065f46;
            color: #6ee7b7;
            border: 1px solid rgba(52, 211, 153, 0.3);
        }

        .admin-toast.error {
            background: #7f1d1d;
            color: #fca5a5;
            border: 1px solid rgba(248, 113, 113, 0.3);
        }

        .admin-toast.info {
            background: #164e63;
            color: #67e8f9;
            border: 1px solid rgba(34, 211, 238, 0.3);
        }

        .admin-field-error {
            margin-top: 6px;
            color: #fca5a5;
            font-size: 11.5px;
            font-weight: 600;
            line-height: 1.4;
        }

        .admin-input-error {
            border-color: rgba(244, 63, 94, 0.75) !important;
            box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.10) !important;
        }

        .admin-input-valid {
            border-color: rgba(16, 185, 129, 0.55) !important;
        }
    `;

    document.head.appendChild(style);
}

function showAdminToast(type, message) {
    const oldToast = document.querySelector(".admin-toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = `admin-toast ${type}`;

    const iconClass =
        type === "success" ? "circle-check" :
        type === "info"    ? "circle-info"  :
                             "triangle-exclamation";

    toast.innerHTML = `
        <i class="fa-solid fa-${iconClass}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3500);
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
    if (error) error.remove();
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
    try { return JSON.parse(value); }
    catch (error) { return null; }
}

function decodeJwtPayload(token) {
    try {
        if (!token || !token.includes(".")) return null;

        const payload    = token.split(".")[1];
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decoded    = atob(
            normalized.padEnd(
                normalized.length + (4 - (normalized.length % 4)) % 4,
                "="
            )
        );

        return JSON.parse(decoded);
    } catch (error) { return null; }
}

function getAuthToken() {
    return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
}

function clearAdminSessionAndRedirect() {
    [
        "adminToken", "adminRole", "adminName", "adminEmail",
        "token", "refreshToken", "userRole", "userId", "userEmail", "userName",
        "edumind_is_logged_in", "edumind_logged_in_user"
    ].forEach(function (key) { localStorage.removeItem(key); });

    setTimeout(function () {
        window.location.href = "/pages/admin/admin-login.html";
    }, 900);
}

function getStoredUserObject() {
    const possibleKeys = [
        "edumind_logged_in_user", "edumind_registered_user",
        "loggedInUser", "currentUser", "user", "authUser",
        "studyPlannerUser", "adminUser", "edumind_admin_user"
    ];

    for (const key of possibleKeys) {
        const rawValue = localStorage.getItem(key);
        if (!rawValue) continue;

        const parsed = parseStoredJson(rawValue);
        if (parsed && typeof parsed === "object") return parsed;
    }

    return null;
}

function getCurrentUserId() {
    const user = getStoredUserObject();

    const directUserId =
        user?.id ?? user?.userId ?? user?.adminId ??
        localStorage.getItem("userId") ??
        localStorage.getItem("adminId") ??
        localStorage.getItem("edumind_user_id");

    if (directUserId != null && directUserId !== "") {
        const numericId = Number(directUserId);
        return Number.isNaN(numericId) ? directUserId : numericId;
    }

    const tokenPayload = decodeJwtPayload(getAuthToken());
    const jwtUserId =
        tokenPayload?.id ?? tokenPayload?.userId ??
        tokenPayload?.adminId ?? tokenPayload?.uid;

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
    if (userId == null || userId === "") return url;

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
    if (adminTestModalTitle) adminTestModalTitle.textContent = "Create Test";
    if (saveAdminTestBtn)    saveAdminTestBtn.textContent    = "Save Test";
}

function setEditAdminTestMode() {
    if (adminTestModalTitle) adminTestModalTitle.textContent = "Edit Test";
    if (saveAdminTestBtn)    saveAdminTestBtn.textContent    = "Update Test";
}

function resetAdminTestForm() {
    if (!adminTestModalForm) return;

    adminTestModalForm.reset();
    clearAllFieldErrors();

    if (adminTestTypeInput)         adminTestTypeInput.value         = "Upcoming";
    if (adminTestStatusInput)       adminTestStatusInput.value       = "DRAFT";
    if (adminNegativeMarkingInput)  adminNegativeMarkingInput.value  = "false";
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
    if (value === "upcoming")                          return "Upcoming";
    if (value === "this week")                         return "This Week";
    if (value === "mock test" || value === "mock tests") return "Mock Test";
    if (value === "completed")                         return "Completed";
    return "Upcoming";
}

function normalizeAdminStatus(statusText, publishedValue = false) {
    const value = String(statusText || "").trim().toUpperCase();
    if (value === "PUBLISHED") return "PUBLISHED";
    if (value === "DRAFT")     return "DRAFT";
    return publishedValue ? "PUBLISHED" : "DRAFT";
}

function getTestBadgeClass(type) {
    const normalized = normalizeTestType(type);
    if (normalized === "Upcoming")  return "upcoming";
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

/* =====================================================
   ✅ FIX: Duration Parser
   Converts "60 mins", "60", "1h 30m", etc. → Integer minutes
   Backend expects Integer, not String
===================================================== */

function parseDurationToInt(durationRaw) {
    if (durationRaw == null || String(durationRaw).trim() === "") return null;

    const raw = String(durationRaw).trim().toLowerCase();

    // Already a plain number e.g. "60" or 60
    if (/^\d+$/.test(raw)) {
        const n = parseInt(raw, 10);
        return Number.isNaN(n) ? null : n;
    }

    // e.g. "60 mins", "60 min", "60 minutes"
    const minsMatch = raw.match(/^(\d+)\s*(?:min(?:ute)?s?)?$/);
    if (minsMatch) {
        const n = parseInt(minsMatch[1], 10);
        return Number.isNaN(n) ? null : n;
    }

    // e.g. "1h 30m", "1h30m", "1 hr 30 min"
    const hhmm = raw.match(/(?:(\d+)\s*h(?:r(?:s)?|ours?)?)?\s*(?:(\d+)\s*m(?:in(?:ute)?s?)?)?/);
    if (hhmm && (hhmm[1] || hhmm[2])) {
        const hours = parseInt(hhmm[1] || "0", 10);
        const mins  = parseInt(hhmm[2] || "0", 10);
        const total = (hours * 60) + mins;
        return total > 0 ? total : null;
    }

    // Fallback: extract first number found
    const firstNum = raw.match(/(\d+)/);
    if (firstNum) {
        const n = parseInt(firstNum[1], 10);
        return Number.isNaN(n) ? null : n;
    }

    return null;
}

/* =====================================================
   API Helpers
===================================================== */

function extractApiErrorMessage(responseText, responseStatus) {
    if (!responseText) return `HTTP ${responseStatus}`;

    try {
        const parsed = JSON.parse(responseText);
        if (parsed && typeof parsed === "object") {
            return parsed.message || parsed.error || `HTTP ${responseStatus}`;
        }
    } catch (error) { /* raw response use hoga */ }

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
    try { responseText = await response.text(); }
    catch (error) { responseText = ""; }

    if (response.status === 401 || response.status === 403) {
        showAdminToast("error", "Admin session expired. Please login again.");
        clearAdminSessionAndRedirect();
        throw new Error("Unauthorized admin session.");
    }

    if (!response.ok) {
        throw new Error(extractApiErrorMessage(responseText, response.status));
    }

    if (!responseText) return null;

    try { return JSON.parse(responseText); }
    catch (error) { throw new Error("Invalid backend response format."); }
}

function unwrapArrayResponse(data, possibleKeys = []) {
    if (Array.isArray(data)) return data;

    if (data && typeof data === "object") {
        for (const key of possibleKeys) {
            if (Array.isArray(data[key])) return data[key];
        }

        if (Array.isArray(data.data))      return data.data;
        if (Array.isArray(data.content))   return data.content;
        if (Array.isArray(data.items))     return data.items;
        if (Array.isArray(data.tests))     return data.tests;
        if (Array.isArray(data.subjects))  return data.subjects;
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
        id:             test.id,
        userId:         test.userId || test.studentId || test.ownerId || null,
        title:          test.title || "",
        subject:        test.subject || test.subjectName || "",
        date:           test.testDate || test.date || "",
        type:           normalizeTestType(test.testType || test.type || ""),
        duration:       test.duration != null ? String(test.duration) : "",
        description:    test.description || "",
        instructions:   test.instructions || "",
        negativeMarking: Boolean(test.negativeMarking),
        published:      publishedValue,
        adminStatus:    normalizeAdminStatus(test.adminStatus, publishedValue),
        studentName:    test.studentName || "",
        studentEmail:   test.studentEmail || ""
    };
}

function sortAdminTests(items) {
    return [...items].sort((a, b) => {
        const aDate = parseDateValue(a.date);
        const bDate = parseDateValue(b.date);

        const aTime = aDate ? aDate.getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = bDate ? bDate.getTime() : Number.MAX_SAFE_INTEGER;

        if (aTime !== bTime) return aTime - bTime;

        return Number(b.id || 0) - Number(a.id || 0);
    });
}

/* =====================================================
   ✅ FIX: buildAdminTestPayload
   - duration: Java model is "String duration" → send as String
   - description: backend sets default if null, but sending
     null causes Jackson/JPA issue — send empty string instead
   - score: backend has "if score==null set score=0" guard,
     BUT some DB schemas have score NOT NULL. Send 0 safely.
   - focusArea / testTip: send null safely (TEXT column, nullable)
   - instructions: send null if empty (TEXT column, nullable)
===================================================== */

function buildAdminTestPayload(testData) {
    const adminStatus = normalizeAdminStatus(testData.adminStatus, testData.published);

    // Duration stays as String — matches: private String duration; in Test.java
    // Normalize: trim whitespace, send empty string if blank (backend handles default)
    const durationStr = String(testData.duration || "").trim();

    return {
        title:           testData.title,
        subject:         testData.subject,
        testDate:        testData.date,
        testType:        normalizeTestType(testData.type),
        duration:        durationStr,
        adminStatus:     adminStatus,
        published:       Boolean(testData.published),
        negativeMarking: Boolean(testData.negativeMarking),
        description:     testData.description || "",
        instructions:    testData.instructions || null,
        score:           0,
        focusArea:       null,
        testTip:         null
    };
}

/* =====================================================
   Render Tests
===================================================== */

function createAdminTestItem(test) {
    const questionCount    = questionCountByTestId.get(String(test.id)) ?? 0;
    const badgeClass       = getTestBadgeClass(test.type);
    const publishClass     = test.adminStatus === "PUBLISHED" ? "published" : "draft";
    const publishLabel     = test.adminStatus === "PUBLISHED" ? "Published" : "Draft";
    const publishActionLabel = test.adminStatus === "PUBLISHED" ? "Unpublish" : "Publish";
    const publishActionClass = test.adminStatus === "PUBLISHED" ? "unpublish" : "publish";
    const publishActionIcon  = test.adminStatus === "PUBLISHED"
        ? "fa-arrow-rotate-left"
        : "fa-paper-plane";

    // Show duration as-is from backend (already a string for display)
    const durationDisplay = test.duration
        ? `${test.duration} mins`
        : "-";

    const item = document.createElement("div");
    item.className         = "admin-test-item";
    item.dataset.testId    = test.id;
    item.dataset.userId    = test.userId || "";
    item.dataset.type      = test.type;
    item.dataset.status    = test.adminStatus;
    item.dataset.subject   = test.subject;
    item.dataset.duration  = test.duration;
    item.dataset.description   = test.description;
    item.dataset.instructions  = test.instructions || "";
    item.dataset.negativeMarking = String(Boolean(test.negativeMarking));
    item.dataset.date      = test.date || "";

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
                <span class="admin-test-meta-chip">${escapeHtml("Subject: " + (test.subject || "-"))}</span>
                <span class="admin-test-meta-chip">${escapeHtml("Duration: " + durationDisplay)}</span>
                <span class="admin-test-meta-chip">${escapeHtml("Questions: " + questionCount)}</span>
                <span class="admin-test-meta-chip">${escapeHtml("Owner ID: " + (test.userId || "-"))}</span>
            </div>

            <p class="admin-test-description">${escapeHtml(test.description || "No description available.")}</p>
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

    return item;
}

function renderAdminTests(tests) {
    if (!adminTestList) return;

    adminTestList.innerHTML = "";
    tests.forEach((test) => { adminTestList.appendChild(createAdminTestItem(test)); });

    applyAdminFilters();
    updateAdminSummaryCards();
}

function updateAdminSummaryCards() {
    const totalTests     = allAdminTests.length;
    const draftTests     = allAdminTests.filter((t) => t.adminStatus === "DRAFT").length;
    const publishedTests = allAdminTests.filter((t) => t.adminStatus === "PUBLISHED").length;

    let totalQuestions = 0;
    questionCountByTestId.forEach((count) => { totalQuestions += Number(count || 0); });

    if (adminTotalTestsCount)     adminTotalTestsCount.textContent     = String(totalTests).padStart(2, "0");
    if (adminDraftTestsCount)     adminDraftTestsCount.textContent     = String(draftTests).padStart(2, "0");
    if (adminPublishedTestsCount) adminPublishedTestsCount.textContent = String(publishedTests).padStart(2, "0");
    if (adminTotalQuestionsCount) adminTotalQuestionsCount.textContent = String(totalQuestions).padStart(2, "0");
}

function updateAdminEmptyState(visibleCount) {
    if (!adminTestsEmptyState) return;
    visibleCount === 0
        ? adminTestsEmptyState.classList.remove("hidden")
        : adminTestsEmptyState.classList.add("hidden");
}

function matchesAdminFilter(item, filterValue) {
    if (!filterValue || filterValue === "ALL") return true;

    const type   = normalizeTestType(item.dataset.type || "");
    const status = normalizeAdminStatus(item.dataset.status || "");

    if (filterValue === "DRAFT")     return status === "DRAFT";
    if (filterValue === "PUBLISHED") return status === "PUBLISHED";
    if (filterValue === "UPCOMING")  return type === "Upcoming";
    if (filterValue === "THIS_WEEK") return type === "This Week";
    if (filterValue === "MOCK_TEST") return type === "Mock Test";

    return true;
}

function applyAdminFilters() {
    if (!adminTestList) return;

    const items       = adminTestList.querySelectorAll(".admin-test-item");
    const searchText  = adminTestSearchInput  ? adminTestSearchInput.value.toLowerCase().trim() : "";
    const filterValue = adminTestFilterSelect ? adminTestFilterSelect.value : "ALL";

    let visibleCount = 0;

    items.forEach((item) => {
        const title       = item.querySelector(".admin-test-title-row h4")?.textContent.toLowerCase() || "";
        const description = item.querySelector(".admin-test-description")?.textContent.toLowerCase() || "";
        const subject     = (item.dataset.subject || "").toLowerCase();

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

/* =====================================================
   Subject Dropdown + Question Count
===================================================== */

function extractSubjectName(subjectItem) {
    if (typeof subjectItem === "string") return subjectItem.trim();

    if (!subjectItem || typeof subjectItem !== "object") return "";

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
        const subjects  = unwrapArrayResponse(response, ["subjects"]);

        if (!Array.isArray(subjects) || subjects.length === 0) return;

        const currentValue  = adminTestSubjectInput.value;
        const subjectNames  = [...new Set(subjects.map(extractSubjectName).filter(Boolean))];

        adminTestSubjectInput.innerHTML = `<option value="">Select subject</option>`;

        subjectNames.forEach((name) => {
            const option       = document.createElement("option");
            option.value       = name;
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
            const response  = await fetchJson(buildQuestionsApiUrl(test.id, test.userId));
            const questions = unwrapArrayResponse(response, ["questions"]);

            return {
                testId: test.id,
                count:  Array.isArray(questions) ? questions.length : 0
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
        const tests    = unwrapArrayResponse(response, ["tests"]);

        allAdminTests = Array.isArray(tests)
            ? sortAdminTests(tests.map(mapBackendTestToFrontend))
            : [];

        await loadQuestionCountsForTests(allAdminTests);
        renderAdminTests(allAdminTests);

        if (showToastAfterLoad) showAdminToast("success", "Tests refreshed successfully.");

    } catch (error) {
        console.error("Admin tests load failed:", error);

        allAdminTests = [];
        questionCountByTestId = new Map();
        updateAdminSummaryCards();

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
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildAdminTestPayload(testData))
    });

    await loadAdminTests(false);
}

async function updateAdminTest(testId, testData) {
    await fetchJson(buildAdminTestsApiUrl(testId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildAdminTestPayload(testData))
    });

    await loadAdminTests(false);
}

async function deleteAdminTest(testId) {
    await fetchJson(buildAdminTestsApiUrl(testId), { method: "DELETE" });
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
            const option       = document.createElement("option");
            option.value       = testData.subject;
            option.textContent = testData.subject;
            adminTestSubjectInput.appendChild(option);
        }

        adminTestSubjectInput.value = testData.subject || "";
    }

    if (adminTestDateInput)         adminTestDateInput.value         = testData.date || "";
    if (adminTestTypeInput)         adminTestTypeInput.value         = normalizeTestType(testData.type);
    // Show raw number in input for editing (user sees "60", not "60 mins")
    if (adminTestDurationInput)     adminTestDurationInput.value     = testData.duration || "";
    if (adminTestStatusInput)       adminTestStatusInput.value       = normalizeAdminStatus(testData.adminStatus, testData.published);
    if (adminNegativeMarkingInput)  adminNegativeMarkingInput.value  = String(Boolean(testData.negativeMarking));
    if (adminTestDescriptionInput)  adminTestDescriptionInput.value  = testData.description || "";
    if (adminTestInstructionsInput) adminTestInstructionsInput.value = testData.instructions || "";
}

/* =====================================================
   Validation + Submit
===================================================== */

function validateAdminTestForm() {
    clearAllFieldErrors();

    let isValid = true;

    const title    = adminTestTitleInput    ? adminTestTitleInput.value.trim()    : "";
    const subject  = adminTestSubjectInput  ? adminTestSubjectInput.value          : "";
    const date     = adminTestDateInput     ? adminTestDateInput.value             : "";
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

    // Validate duration: if provided, it must parse to a valid number
    if (duration) {
        const parsed = parseDurationToInt(duration);
        if (parsed === null || parsed <= 0) {
            setFieldError(adminTestDurationInput, "Enter a valid duration, e.g. 60 or 60 mins.");
            isValid = false;
        } else {
            clearFieldError(adminTestDurationInput);
        }
    } else {
        clearFieldError(adminTestDurationInput);
    }

    if (!isValid) showAdminToast("error", "Please fix the highlighted fields.");

    return isValid;
}

async function handleAdminModalSubmit(event) {
    event.preventDefault();

    if (!validateAdminTestForm()) return;

    const payload = {
        title:          adminTestTitleInput     ? adminTestTitleInput.value.trim()     : "",
        subject:        adminTestSubjectInput   ? adminTestSubjectInput.value           : "",
        date:           adminTestDateInput      ? adminTestDateInput.value              : "",
        type:           adminTestTypeInput      ? adminTestTypeInput.value             : "Upcoming",
        duration:       adminTestDurationInput  ? adminTestDurationInput.value.trim()  : "",
        description:    adminTestDescriptionInput
            ? adminTestDescriptionInput.value.trim() || null
            : null,
        instructions:   adminTestInstructionsInput ? adminTestInstructionsInput.value.trim() : "",
        adminStatus:    adminTestStatusInput    ? adminTestStatusInput.value            : "DRAFT",
        published:      adminTestStatusInput    ? adminTestStatusInput.value === "PUBLISHED" : false,
        negativeMarking: adminNegativeMarkingInput ? adminNegativeMarkingInput.value === "true" : false
    };

    try {
        if (saveAdminTestBtn) {
            saveAdminTestBtn.disabled     = true;
            saveAdminTestBtn.textContent  = editingAdminTestId ? "Updating..." : "Saving...";
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
        if (saveAdminTestBtn) saveAdminTestBtn.disabled = false;

        if (editingAdminTestId) setEditAdminTestMode();
        else                    setCreateAdminTestMode();
    }
}

/* =====================================================
   Publish / Delete / Manage Actions
===================================================== */

function buildPublishTogglePayload(testData) {
    const nextPublished = !Boolean(testData.published);
    const nextStatus    = nextPublished ? "PUBLISHED" : "DRAFT";

    return { ...testData, published: nextPublished, adminStatus: nextStatus };
}

async function handleAdminTestListClick(event) {
    const manageButton  = event.target.closest(".admin-action-btn.manage");
    const publishButton = event.target.closest(".admin-action-btn.publish, .admin-action-btn.unpublish");
    const editButton    = event.target.closest(".admin-action-btn.edit");
    const deleteButton  = event.target.closest(".admin-action-btn.delete");

    if (manageButton) {
        const item   = manageButton.closest(".admin-test-item");
        const testId = item?.dataset.testId;

        if (!testId) { showAdminToast("error", "Test ID not found."); return; }

        const testData = allAdminTests.find((test) => String(test.id) === String(testId));

        const query = new URLSearchParams({
            testId:  testId,
            title:   testData?.title   || "",
            subject: testData?.subject || ""
        });

        const ownerUserId = testData?.userId || item?.dataset.userId;
        if (ownerUserId) query.set("userId", ownerUserId);

        window.location.href = `admin-question-bank.html?${query.toString()}`;
        return;
    }

    if (publishButton) {
        const item   = publishButton.closest(".admin-test-item");
        const testId = item?.dataset.testId;

        if (!testId) { showAdminToast("error", "Test ID not found."); return; }

        const testData = allAdminTests.find((test) => String(test.id) === String(testId));

        if (!testData) { showAdminToast("error", "Selected test not found."); return; }

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

        if (!item) { showAdminToast("error", "Selected test item not found."); return; }

        setEditAdminTestMode();
        await loadAdminSubjectOptions();
        fillAdminFormForEdit(item);
        openAdminTestModal();
        return;
    }

    if (deleteButton) {
        const item   = deleteButton.closest(".admin-test-item");
        const testId = item?.dataset.testId;

        if (!testId) { showAdminToast("error", "Test ID not found."); return; }

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
   Init
===================================================== */

function initializeAdminTestsPage() {
    injectAdminTestUtilityStyles();

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

    if (adminTestSearchInput) {
        adminTestSearchInput.addEventListener("input", applyAdminFilters);
    }

    if (adminTestFilterSelect) {
        adminTestFilterSelect.addEventListener("change", applyAdminFilters);
    }

    [adminTestTitleInput, adminTestSubjectInput, adminTestDateInput, adminTestDurationInput].forEach(function (input) {
        if (!input) return;

        input.addEventListener("input",  function () { clearFieldError(input); });
        input.addEventListener("change", function () { clearFieldError(input); });
    });

    setCreateAdminTestMode();
    loadAdminSubjectOptions();
    loadAdminTests(false);
}

initializeAdminTestsPage();