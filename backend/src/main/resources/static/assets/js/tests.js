const openTestModalBtn   = document.getElementById("openTestModalBtn");
const testModalOverlay   = document.getElementById("testModalOverlay");
const closeTestModalBtn  = document.getElementById("closeTestModalBtn");
const cancelTestModalBtn = document.getElementById("cancelTestModalBtn");
const testModalForm      = document.getElementById("testModalForm");
const testModalTitle     = document.getElementById("testModalTitle");
const testSaveBtn        = document.getElementById("testSaveBtn");

const testList          = document.getElementById("testList");
const testsEmptyState   = document.getElementById("testsEmptyState");
const testSearchInput   = document.getElementById("testSearchInput");
const testFilterSelect  = document.getElementById("testFilterSelect");

const upcomingTestsCount  = document.getElementById("upcomingTestsCount");
const thisWeekTestsCount  = document.getElementById("thisWeekTestsCount");
const completedTestsCount = document.getElementById("completedTestsCount");
const averageScoreCount   = document.getElementById("averageScoreCount");

const testTitleInput       = document.getElementById("testTitle");
const testSubjectInput     = document.getElementById("testSubject");
const testDateInput        = document.getElementById("testDate");
const testTypeInput        = document.getElementById("testType");
const testDurationInput    = document.getElementById("testDuration");
const testDescriptionInput = document.getElementById("testDescription");

const resultList   = document.querySelector(".result-list");
const focusAreaList = document.querySelector(".focus-area-list");
const testTipList   = document.querySelector(".test-tip-list");

const defaultRecentResultsHTML = resultList    ? resultList.innerHTML    : "";
const defaultFocusAreaHTML     = focusAreaList ? focusAreaList.innerHTML : "";
const defaultTestTipHTML       = testTipList   ? testTipList.innerHTML   : "";

/* Review modal */
const reviewResultOverlay      = document.getElementById("reviewResultOverlay");
const closeReviewResultModalBtn = document.getElementById("closeReviewResultModalBtn");
const reviewResultCloseBtn     = document.getElementById("reviewResultCloseBtn");
const reviewResultTitle        = document.getElementById("reviewResultTitle");
const reviewResultSubtitle     = document.getElementById("reviewResultSubtitle");
const reviewScoreText          = document.getElementById("reviewScoreText");
const reviewPercentageText     = document.getElementById("reviewPercentageText");
const reviewCorrectText        = document.getElementById("reviewCorrectText");
const reviewStatusText         = document.getElementById("reviewStatusText");
const reviewSubjectText        = document.getElementById("reviewSubjectText");
const reviewDurationText       = document.getElementById("reviewDurationText");
const reviewAnsweredText       = document.getElementById("reviewAnsweredText");
const reviewFocusAreaText      = document.getElementById("reviewFocusAreaText");
const reviewTestTipText        = document.getElementById("reviewTestTipText");
const reviewAnswersList        = document.getElementById("reviewAnswersList");

// ─── API URLs ────────────────────────────────────────────
const API_BASE_URL               = window.location.port === "8080" ? "" : "http://localhost:8080";
const TESTS_API_URL              = `${API_BASE_URL}/api/tests`;
const SUBJECTS_API_URL           = `${API_BASE_URL}/api/subjects`;  // ← Fixed: /api/subjects
const TESTS_RECENT_RESULTS_API_URL = `${API_BASE_URL}/api/tests/attempts/recent`;
const TESTS_HISTORY_API_URL      = `${API_BASE_URL}/api/tests/attempts/history`;

let editingTestId = null;
let allTests      = [];
let recentAttemptResults = [];
let attemptHistory       = [];
let latestSubmittedAttemptByTestId = new Map();

// ─── AUTH & USER ID ──────────────────────────────────────
function getToken() { return (localStorage.getItem("token") || "").trim(); }

function getCurrentUserId() {
    // 1. Direct userId
    const uid = localStorage.getItem("userId");
    if (uid) return Number(uid);

    // 2. edumind_logged_in_user object
    try {
        const raw = localStorage.getItem("edumind_logged_in_user");
        if (raw) {
            const u = JSON.parse(raw);
            if (u && u.id) return Number(u.id);
        }
    } catch(e) {}

    // 3. JWT payload
    const token = getToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const id = payload.userId || payload.id;
            if (id && !isNaN(Number(id))) return Number(id);
        } catch(e) {}
    }

    throw new Error("User ID not found. Please login again.");
}

// ─── URL BUILDERS ────────────────────────────────────────
function buildTestsApiUrl(testId = "") {
    const path = testId ? `/${testId}` : "";
    return `${TESTS_API_URL}${path}`;
}

// ✅ Subjects JWT se milega — userId nahi chahiye
function buildSubjectsApiUrl() {
    return SUBJECTS_API_URL;
}

function buildRecentResultsApiUrl() {
    const userId = getCurrentUserId();
    return `${TESTS_RECENT_RESULTS_API_URL}?userId=${encodeURIComponent(userId)}`;
}

function buildHistoryApiUrl() {
    const userId = getCurrentUserId();
    return `${TESTS_HISTORY_API_URL}?userId=${encodeURIComponent(userId)}`;
}

function buildAttemptDetailsApiUrl(attemptId) {
    const userId = getCurrentUserId();
    return `${TESTS_API_URL}/attempts/${encodeURIComponent(attemptId)}?userId=${encodeURIComponent(userId)}`;
}

// ─── FETCH HELPER ────────────────────────────────────────
async function fetchJson(url, options = {}) {
    const token    = getToken();
    const response = await fetch(url, {
        headers: {
            "Accept":        "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        },
        ...options
    });

    let text = "";
    try { text = await response.text(); } catch(e) {}

    if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try { const p = JSON.parse(text); msg = p.message || p.error || msg; } catch(e) { if (text) msg = text; }
        throw new Error(msg);
    }

    if (!text) return null;
    try { return JSON.parse(text); } catch(e) { return null; }
}

// ─── DATE HELPERS ────────────────────────────────────────
function parseDateValue(dateValue) {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return isNaN(dateValue.getTime()) ? null : dateValue;
    if (typeof dateValue === "string") {
        const trimmed = dateValue.trim();
        if (!trimmed) return null;
        const d = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
            ? new Date(`${trimmed}T00:00:00`)
            : new Date(trimmed);
        return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
}

function getMonthShort(dateValue) {
    const d = parseDateValue(dateValue);
    return d ? d.toLocaleDateString("en-US", { month: "short" }).toUpperCase() : "---";
}

function getDayNumber(dateValue) {
    const d = parseDateValue(dateValue);
    return d ? String(d.getDate()).padStart(2,"0") : "--";
}

function formatShortDate(dateValue) {
    const d = parseDateValue(dateValue);
    return d ? d.toLocaleDateString("en-GB", { day:"2-digit", month:"short" }) : "Date not available";
}

// ─── NORMALIZERS ─────────────────────────────────────────
function normalizeTestType(typeText) {
    const v = (typeText || "").trim().toLowerCase();
    if (v === "upcoming")                    return "Upcoming";
    if (v === "this week")                   return "This Week";
    if (v === "mock test" || v === "mock tests") return "Mock Test";
    if (v === "completed")                   return "Completed";
    return "Upcoming";
}

function normalizeAdminStatus(statusText, publishedValue = false) {
    const v = (statusText || "").trim().toUpperCase();
    if (v === "PUBLISHED") return "PUBLISHED";
    if (v === "DRAFT")     return "DRAFT";
    return publishedValue ? "PUBLISHED" : "DRAFT";
}

function isPublishedForStudent(test) {
    const pub = Boolean(test?.published);
    return pub || normalizeAdminStatus(test?.adminStatus, pub) === "PUBLISHED";
}

function shouldShowTestOnStudentPage(test) {
    return isPublishedForStudent(test);
}

function getTestBadgeClass(type) {
    const v = (type || "").toLowerCase();
    if (v === "upcoming")   return "upcoming";
    if (v === "this week")  return "week";
    if (v === "mock test" || v === "mock tests") return "mock";
    if (v === "completed")  return "completed";
    return "upcoming";
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

// ─── SORT HELPERS ────────────────────────────────────────
function sortTestsByDate(tests) {
    return [...tests].sort((a,b) => {
        const aT = parseDateValue(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bT = parseDateValue(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aT !== bT ? aT - bT : Number(b.id||0) - Number(a.id||0);
    });
}

function sortBySubmitted(results) {
    return [...results].sort((a,b) => {
        const aT = parseDateValue(a.submittedAt)?.getTime() ?? 0;
        const bT = parseDateValue(b.submittedAt)?.getTime() ?? 0;
        return bT - aT;
    });
}

function sortByStarted(items) {
    return [...items].sort((a,b) => {
        const aT = parseDateValue(a.startedAt)?.getTime() ?? 0;
        const bT = parseDateValue(b.startedAt)?.getTime() ?? 0;
        return bT - aT;
    });
}

// ─── DATA MAPPING ────────────────────────────────────────
function mapBackendTestToFrontend(test) {
    const pub = typeof test.published === "boolean" ? test.published : false;
    return {
        id:          test.id,
        title:       test.title       || "",
        subject:     test.subject     || "",
        date:        test.testDate    || "",
        type:        normalizeTestType(test.testType || ""),
        duration:    test.duration    || "",
        description: test.description || "",
        score:       test.score       ?? null,
        focusArea:   test.focusArea   || "",
        testTip:     test.testTip     || "",
        published:   pub,
        adminStatus: normalizeAdminStatus(test.adminStatus, pub)
    };
}

function mapBackendRecentResult(result) {
    return {
        attemptId:   result.attemptId  ?? null,
        testId:      result.testId     ?? null,
        title:       result.title      || "",
        subject:     result.subject    || "",
        percentage:  result.percentage ?? null,
        score:       result.score      ?? null,
        focusArea:   result.focusArea  || "",
        testTip:     result.testTip    || "",
        submittedAt: result.submittedAt || ""
    };
}

function mapBackendHistory(item) {
    return {
        attemptId:        item.attemptId        ?? null,
        testId:           item.testId           ?? null,
        title:            item.title            || "",
        subject:          item.subject          || "",
        testType:         normalizeTestType(item.testType || ""),
        duration:         item.duration         || "",
        totalQuestions:   item.totalQuestions   ?? 0,
        answeredQuestions:item.answeredQuestions ?? 0,
        correctAnswers:   item.correctAnswers   ?? 0,
        score:            item.score            ?? null,
        percentage:       item.percentage       ?? null,
        focusArea:        item.focusArea        || "",
        testTip:          item.testTip          || "",
        status:           item.status           || "",
        startedAt:        item.startedAt        || "",
        submittedAt:      item.submittedAt      || ""
    };
}

function rebuildLatestAttemptIndex() {
    latestSubmittedAttemptByTestId = new Map();
    attemptHistory
        .filter(item => String(item.status||"").toUpperCase() === "SUBMITTED")
        .forEach(item => {
            if (!latestSubmittedAttemptByTestId.has(String(item.testId))) {
                latestSubmittedAttemptByTestId.set(String(item.testId), item);
            }
        });
}

function getLatestSubmittedAttempt(testId) {
    return latestSubmittedAttemptByTestId.get(String(testId)) || null;
}

// ─── RENDER: TEST LIST ───────────────────────────────────
function getDisplayTypeForStudent(test) {
    return normalizeTestType(test.type);
}

function createTestItem(test) {
    const { id, title, subject, date, duration, description } = test;
    const latestAttempt = getLatestSubmittedAttempt(id);
    const displayType   = getDisplayTypeForStudent(test);

    const item = document.createElement("div");
    item.className       = "test-item";
    item.dataset.testId  = id;
    item.dataset.date    = date        || "";
    item.dataset.type    = displayType;
    item.dataset.subject = subject     || "";
    item.dataset.duration    = duration    || "";
    item.dataset.description = description || "";

    const startBtn  = !latestAttempt
        ? `<button class="test-action-btn start" title="Start Test"><i class="fa-solid fa-play"></i></button>`
        : "";
    const reviewBtn = latestAttempt
        ? `<button class="test-action-btn review" title="Review Result" data-attempt-id="${escapeHtml(latestAttempt.attemptId)}"><i class="fa-solid fa-eye"></i></button>`
        : "";

    const infoParts = [`Subject: ${subject || "-"}`];
    if (duration)    infoParts.push(`Duration: ${duration}`);
    if (description) infoParts.push(description);

    item.innerHTML = `
        <div class="test-date-box"><span>${getDayNumber(date)}</span><small>${getMonthShort(date)}</small></div>
        <div class="test-info">
            <h4>${escapeHtml(title || "Untitled Test")}</h4>
            <p>${escapeHtml(infoParts.join(" • "))}</p>
        </div>
        <span class="test-badge ${getTestBadgeClass(displayType)}">${escapeHtml(displayType)}</span>
        <div class="test-actions">${startBtn}${reviewBtn}</div>`;
    return item;
}
function updateTestsCounts() {
    const completed = allTests.filter(t =>
        normalizeTestType(t.type) === "Completed"
    ).length;

    const upcoming = allTests.filter(t =>
        normalizeTestType(t.type) === "Upcoming"
    ).length;

    const thisWeek = allTests.filter(t =>
        normalizeTestType(t.type) === "This Week"
    ).length;

    const scores = allTests
        .filter(t => t.score != null)
        .map(t => Number(t.score))
        .filter(Number.isFinite);
    const avg = scores.length > 0
        ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
        : 0;

    if (upcomingTestsCount)  upcomingTestsCount.textContent  = String(upcoming).padStart(2, "0");
    if (thisWeekTestsCount)  thisWeekTestsCount.textContent  = String(thisWeek).padStart(2, "0");
    if (completedTestsCount) completedTestsCount.textContent = String(completed).padStart(2, "0");
    if (averageScoreCount)   averageScoreCount.textContent   = `${avg}%`;
}

function bindRecentResultClicks() {
    if (!resultList) return;
    resultList.querySelectorAll(".result-item[data-attempt-id]").forEach(item => {
        item.style.cursor = "pointer";
        item.setAttribute("title", "View Result Review");
        item.onclick = async () => await openReviewForAttempt(item.dataset.attemptId);
    });
}

function renderRecentResults() {
    if (!resultList) return;
    const results = sortBySubmitted(recentAttemptResults).slice(0,3);
    if (results.length > 0) {
        resultList.innerHTML = results.map(r => {
            const pct     = Number.isFinite(Number(r.percentage)) ? `${Math.round(Number(r.percentage))}%` : "--%";
            const dateText = r.submittedAt ? `Completed on ${formatShortDate(r.submittedAt)}` : "Completed test";
            const attr     = r.attemptId != null ? `data-attempt-id="${escapeHtml(r.attemptId)}"` : "";
            return `<div class="result-item" ${attr}>
                <div class="result-info"><h4>${escapeHtml(r.title||"Completed Test")}</h4><p>${escapeHtml(dateText)}</p></div>
                <span class="result-score">${escapeHtml(pct)}</span>
            </div>`;
        }).join("");
        bindRecentResultClicks();
    } else {
        resultList.innerHTML = defaultRecentResultsHTML;
    }
}

function renderFocusAreas() {
    if (!focusAreaList) return;
    const areas = [...new Set([
        ...recentAttemptResults.map(i=>i.focusArea||""),
        ...allTests.map(i=>i.focusArea||"")
    ].map(s=>String(s||"").trim()).filter(Boolean))].slice(0,3);
    focusAreaList.innerHTML = areas.length > 0
        ? areas.map(a=>`<div class="focus-area-item"><i class="fa-solid fa-circle-exclamation"></i><span>${escapeHtml(a)}</span></div>`).join("")
        : defaultFocusAreaHTML;
}

function renderTestTips() {
    if (!testTipList) return;
    const tips = [...new Set([
        ...recentAttemptResults.map(i=>i.testTip||""),
        ...allTests.map(i=>i.testTip||"")
    ].map(s=>String(s||"").trim()).filter(Boolean))].slice(0,4);
    testTipList.innerHTML = tips.length > 0
        ? tips.map(t=>`<div class="test-tip-item"><i class="fa-solid fa-circle-check"></i><span>${escapeHtml(t)}</span></div>`).join("")
        : defaultTestTipHTML;
}

function renderTests(tests) {
    if (!testList) return;
    testList.innerHTML = "";
    tests.forEach(t => testList.appendChild(createTestItem(t)));
    updateTestsCounts();
    renderRecentResults();
    renderFocusAreas();
    renderTestTips();
    applyTestFilters();
}

// ─── LOAD ────────────────────────────────────────────────
async function loadTests() {
    try {
        const [testsRes, recentRes, historyRes] = await Promise.allSettled([
            fetchJson(buildTestsApiUrl()),
            fetchJson(buildRecentResultsApiUrl()),
            fetchJson(buildHistoryApiUrl())
        ]);

        if (testsRes.status !== "fulfilled") throw testsRes.reason;

        const mapped = Array.isArray(testsRes.value)
            ? sortTestsByDate(testsRes.value.map(mapBackendTestToFrontend))
            : [];

        recentAttemptResults = recentRes.status === "fulfilled" && Array.isArray(recentRes.value)
            ? sortBySubmitted(recentRes.value.map(mapBackendRecentResult))
            : [];

        attemptHistory = historyRes.status === "fulfilled" && Array.isArray(historyRes.value)
            ? sortByStarted(historyRes.value.map(mapBackendHistory))
            : [];

        rebuildLatestAttemptIndex();
        allTests = mapped.filter(shouldShowTestOnStudentPage);
        renderTests(allTests);
    } catch (error) {
        console.error("Failed to load tests:", error);
        // Silent fail — empty state dikhega
    }
}

// ─── REVIEW MODAL ────────────────────────────────────────
function renderReviewAnswers(answers) {
    if (!reviewAnswersList) return;
    if (!Array.isArray(answers) || answers.length === 0) {
        reviewAnswersList.innerHTML = `<div class="review-answer-empty"><i class="fa-regular fa-file-lines"></i><p>Question-wise review will appear here.</p></div>`;
        return;
    }
    reviewAnswersList.innerHTML = answers.map((a, i) => {
        const correct = Boolean(a.isCorrect);
        return `<div class="review-answer-card">
            <div class="review-answer-top">
                <div class="review-answer-top-left">
                    <span class="review-question-index">Question ${i+1}</span>
                    <span class="review-question-topic">${escapeHtml(a.focusTopic||"General concepts")}</span>
                </div>
                <span class="review-answer-status ${correct?"correct":"wrong"}">${correct?"Correct":"Needs Review"}</span>
            </div>
            <h4 class="review-answer-question">${escapeHtml(a.questionText||"Question text not available.")}</h4>
            <div class="review-answer-grid">
                <div class="review-answer-block"><span>Your Answer</span><p>${escapeHtml(a.submittedAnswer||"Not answered")}</p></div>
                <div class="review-answer-block"><span>Correct Answer</span><p>${escapeHtml(a.correctAnswer||"Not available")}</p></div>
                <div class="review-answer-block"><span>Marks</span><p>${escapeHtml(`${a.marksAwarded??0}/${a.totalMarks??0}`)}</p></div>
            </div>
        </div>`;
    }).join("");
}

function fillReviewModal(details) {
    if (reviewResultTitle)     reviewResultTitle.textContent     = details.title || "Test Review";
    if (reviewResultSubtitle)  reviewResultSubtitle.textContent  = details.submittedAt ? `Submitted on ${formatShortDate(details.submittedAt)}` : "Question-wise performance and answer analysis.";
    if (reviewScoreText)       reviewScoreText.textContent       = `${details.score ?? 0}`;
    if (reviewPercentageText)  reviewPercentageText.textContent  = `${Math.round(Number(details.percentage??0))}%`;
    if (reviewCorrectText)     reviewCorrectText.textContent     = `${details.correctAnswers??0}/${details.totalQuestions??0}`;
    if (reviewStatusText)      reviewStatusText.textContent      = details.status    || "-";
    if (reviewSubjectText)     reviewSubjectText.textContent     = details.subject   || "-";
    if (reviewDurationText)    reviewDurationText.textContent    = details.duration  || "-";
    if (reviewAnsweredText)    reviewAnsweredText.textContent    = `${details.answeredQuestions??0}/${details.totalQuestions??0}`;
    if (reviewFocusAreaText)   reviewFocusAreaText.textContent   = details.focusArea || "No major weak area detected.";
    if (reviewTestTipText)     reviewTestTipText.textContent     = details.testTip   || "No test tip available.";
    renderReviewAnswers(details.answers || []);
}

function openReviewResultModal() {
    if (!reviewResultOverlay) return;
    reviewResultOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeReviewResultModal() {
    if (!reviewResultOverlay) return;
    reviewResultOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

async function openReviewForAttempt(attemptId) {
    if (!attemptId) { alert("Review data not found."); return; }
    try {
        const details = await fetchJson(buildAttemptDetailsApiUrl(attemptId));
        fillReviewModal(details || {});
        openReviewResultModal();
    } catch (error) {
        console.error("Review load failed:", error);
        alert(`Result review load nahi hua: ${error.message}`);
    }
}

// ─── FILTER ──────────────────────────────────────────────
function matchesTestFilter(testItem, filterValue) {
    if (!filterValue || filterValue === "All Tests") return true;
    const type = normalizeTestType(testItem.dataset.type);
    if (filterValue === "Upcoming")   return type === "Upcoming";
    if (filterValue === "Completed")  return type === "Completed";
    if (filterValue === "This Week")  return type === "This Week";
    if (filterValue === "Mock Tests") return type === "Mock Test";
    return true;
}

function applyTestFilters() {
    if (!testList) return;
    const items       = testList.querySelectorAll(".test-item");
    const search      = testSearchInput  ? testSearchInput.value.toLowerCase().trim() : "";
    const filterValue = testFilterSelect ? testFilterSelect.value : "All Tests";
    let visible = 0;
    items.forEach(item => {
        const title = item.querySelector(".test-info h4")?.textContent.toLowerCase() || "";
        const desc  = item.querySelector(".test-info p")?.textContent.toLowerCase()  || "";
        const show  = (title.includes(search) || desc.includes(search)) && matchesTestFilter(item, filterValue);
        item.style.display = show ? "" : "none";
        if (show) visible++;
    });
    if (testsEmptyState) testsEmptyState.classList.toggle("hidden", visible > 0);
}

// ─── SUBJECTS DROPDOWN ───────────────────────────────────
function extractSubjectName(s) {
    if (typeof s === "string") return s.trim();
    if (!s || typeof s !== "object") return "";
    return String(s.name ?? s.subjectName ?? s.title ?? s.subject ?? "").trim();
}

async function loadSubjectOptions() {
    if (!testSubjectInput) return;
    try {
        const subjects = await fetchJson(buildSubjectsApiUrl());
        if (!Array.isArray(subjects) || subjects.length === 0) return;
        const current = testSubjectInput.value;
        const names   = [...new Set(subjects.map(extractSubjectName).filter(Boolean))];
        if (names.length === 0) return;
        testSubjectInput.innerHTML = "";
        names.forEach(name => {
            const opt = document.createElement("option");
            opt.value = opt.textContent = name;
            testSubjectInput.appendChild(opt);
        });
        testSubjectInput.value = names.includes(current) ? current : names[0];
    } catch (error) {
        console.warn("Subjects dropdown load nahi hua:", error);
    }
}

// ─── TEST ACTIONS ────────────────────────────────────────
function handleStartTest(testId) {
    if (!testId) { alert("Test id not found."); return; }
    window.location.href = `test-engine.html?testId=${encodeURIComponent(testId)}`;
}

async function handleTestListClick(e) {
    const startBtn  = e.target.closest(".test-action-btn.start");
    const reviewBtn = e.target.closest(".test-action-btn.review");
    if (startBtn)  { handleStartTest(startBtn.closest(".test-item")?.dataset.testId); return; }
    if (reviewBtn) { await openReviewForAttempt(reviewBtn.dataset.attemptId); }
}

// ─── INIT ────────────────────────────────────────────────
function initializeTestsPage() {
    if (!testList) return;

    // Hide add test modal (student page)
    if (openTestModalBtn)  openTestModalBtn.style.display = "none";
    if (testModalOverlay)  testModalOverlay.classList.add("hidden");

    // Test modal close buttons
    if (closeTestModalBtn)  closeTestModalBtn.addEventListener("click",  () => testModalOverlay?.classList.add("hidden"));
    if (cancelTestModalBtn) cancelTestModalBtn.addEventListener("click", () => testModalOverlay?.classList.add("hidden"));
    if (testModalOverlay) {
        testModalOverlay.addEventListener("click", e => {
            if (e.target === testModalOverlay) testModalOverlay.classList.add("hidden");
        });
    }

    // Review modal close buttons
    if (closeReviewResultModalBtn) closeReviewResultModalBtn.addEventListener("click", closeReviewResultModal);
    if (reviewResultCloseBtn)      reviewResultCloseBtn.addEventListener("click",      closeReviewResultModal);
    if (reviewResultOverlay) {
        reviewResultOverlay.addEventListener("click", e => {
            if (e.target === reviewResultOverlay) closeReviewResultModal();
        });
    }

    // Test list clicks
    testList.addEventListener("click", handleTestListClick);

    // Search & filter
    if (testSearchInput)  testSearchInput.addEventListener("input",  applyTestFilters);
    if (testFilterSelect) testFilterSelect.addEventListener("change", applyTestFilters);

    // ESC key
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && reviewResultOverlay && !reviewResultOverlay.classList.contains("hidden")) {
            closeReviewResultModal();
        }
    });

    editingTestId = null;
    loadSubjectOptions();
    loadTests();
}

initializeTestsPage();