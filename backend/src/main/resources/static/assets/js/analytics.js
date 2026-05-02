const analyticsFilterSelect = document.querySelector(".analytics-filter select");

const overallStudyProgressValue = document.getElementById("overallStudyProgressValue");
const averageTestScoreValue = document.getElementById("averageTestScoreValue");
const completedSessionsValue = document.getElementById("completedSessionsValue");
const weeklyConsistencyValue = document.getElementById("weeklyConsistencyValue");

const mockTestsValue = document.getElementById("mockTestsValue");
const revisionAccuracyValue = document.getElementById("revisionAccuracyValue");
const taskCompletionValue = document.getElementById("taskCompletionValue");
const focusEfficiencyValue = document.getElementById("focusEfficiencyValue");

const subjectInsightList = document.getElementById("subjectInsightList");
const recommendationList = document.getElementById("recommendationList");
const chartBarsContainer = document.getElementById("chartBars");
const chartLabelsContainer = document.getElementById("chartLabels");
const exportReportBtn = document.querySelector(".export-report-btn");

const API_BASE_URL = window.location.port === "8080" ? "" : "http://localhost:8080";
const SUBJECTS_API_URL = `${API_BASE_URL}/api/subjects`;
const TASKS_API_URL    = `${API_BASE_URL}/api/tasks`;
const REVISIONS_API_URL = `${API_BASE_URL}/api/revisions`;
const TESTS_API_URL = `${API_BASE_URL}/api/tests`;
const PLANS_API_URL = `${API_BASE_URL}/api/plans`;

const analyticsStore = {
    subjects: [],
    tasks: [],
    revisions: [],
    tests: [],
    plans: []
};

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

function getStoredUserObject() {
    try {
        return JSON.parse(localStorage.getItem("edumind_logged_in_user"));
    } catch {
        return null;
    }
}

function getCurrentUserId() {
    const user = getStoredUserObject();
    if (user && user.id != null && user.id !== "") return Number(user.id);
    throw new Error("Logged-in user id not found.");
}

function buildApiUrlWithUserId(baseUrl) {
    const userId = getCurrentUserId();
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}userId=${encodeURIComponent(userId)}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function parseDateOnly(dateValue) {
    if (!dateValue) return null;
    const normalized = String(dateValue).slice(0, 10);
    const parsed = new Date(`${normalized}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateToYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getTodayString() {
    return formatDateToYMD(new Date());
}

function getSelectedRange() {
    return analyticsFilterSelect ? analyticsFilterSelect.value : "This Week";
}

function safePercent(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

function average(numbers) {
    const valid = numbers.filter(Number.isFinite);
    if (!valid.length) return 0;
    return Math.round(valid.reduce((sum, n) => sum + n, 0) / valid.length);
}

function isDarkTheme() {
    return (
        document.body.classList.contains("dark-theme") ||
        document.body.classList.contains("preview-dark") ||
        document.documentElement.classList.contains("dark-theme") ||
        document.documentElement.classList.contains("dark") ||
        document.body.dataset.theme === "dark" ||
        document.documentElement.dataset.theme === "dark"
    );
}

function textKey(value) {
    return String(value || "").trim().toLowerCase();
}

function getRecent7DaysWindow() {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    return { start, end };
}

function getWeekRange(date = new Date()) {
    const current = new Date(date);
    const day = current.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(current);
    start.setDate(current.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

function isDateInCurrentWeek(dateValue) {
    const parsed = parseDateOnly(dateValue);
    if (!parsed) return false;
    const { start, end } = getWeekRange();
    return parsed >= start && parsed <= end;
}

function isDateInSelectedRange(dateValue, rangeValue) {
    if (!dateValue) return false;

    const parsed = parseDateOnly(dateValue);
    if (!parsed) return false;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (rangeValue === "Overall") return true;
    if (rangeValue === "This Week") return isDateInCurrentWeek(dateValue);

    if (rangeValue === "This Month") {
        return parsed.getFullYear() === today.getFullYear() &&
            parsed.getMonth() === today.getMonth();
    }

    if (rangeValue === "Last 30 Days") {
        const start = new Date();
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return parsed >= start && parsed <= today;
    }

    return true;
}

function getPerformanceTone(percent) {
    if (percent >= 80) return "Excellent";
    if (percent >= 65) return "Strong";
    if (percent >= 45) return "Steady";
    if (percent > 0) return "Improving";
    return "Not enough data";
}

function ensureSummaryNote(cardSelector, noteId) {
    const card = document.querySelector(cardSelector);
    const info = card?.querySelector(".asc-info");
    if (!info) return null;

    let note = info.querySelector(".analytics-summary-note");
    if (!note) {
        note = document.createElement("span");
        note.className = "analytics-summary-note";
        if (noteId) note.id = noteId;
        info.appendChild(note);
    }
    return note;
}

function ensureChartHighlightChipRow() {
    const card = document.querySelector(".progress-chart-card");
    const sectionTitle = card?.querySelector(".analytics-section-title");
    if (!card || !sectionTitle) return null;

    let row = document.getElementById("analyticsChartHighlightRow");
    if (!row) {
        row = document.createElement("div");
        row.id = "analyticsChartHighlightRow";
        row.className = "analytics-highlight-chip-row";
        sectionTitle.insertAdjacentElement("afterend", row);
    }
    return row;
}

function ensureChartMiniInsight() {
    const card = document.querySelector(".progress-chart-card");
    if (!card) return null;

    let text = document.getElementById("analyticsChartMiniInsight");
    if (!text) {
        text = document.createElement("div");
        text.id = "analyticsChartMiniInsight";
        text.className = "analytics-mini-insight";
        const insight = document.getElementById("analyticsChartInsight");
        if (insight) insight.insertAdjacentElement("beforebegin", text);
    }
    return text;
}

function setScoreCardDescription(valueElement, text) {
    if (!valueElement) return;
    const item = valueElement.closest(".score-stat-item");
    if (!item) return;
    const paragraph = item.querySelector(".score-stat-info p");
    if (paragraph) paragraph.textContent = text;
}

function extractSubjectName(value) {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    return String(value.name || value.subjectName || value.title || "").trim();
}

function ensureAnalyticsRuntimeStyles() {
    let style = document.getElementById("analyticsRuntimeThemeStyles");
    if (!style) {
        style = document.createElement("style");
        style.id = "analyticsRuntimeThemeStyles";
        document.head.appendChild(style);
    }

    style.textContent = `
        .analytics-summary-note{
            display:block;
            margin-top:6px;
            font-size:12px;
            line-height:1.45;
            opacity:0.88;
        }

        .analytics-highlight-chip-row{
            display:flex;
            flex-wrap:wrap;
            gap:12px;
            margin:16px 0 18px;
        }

        .analytics-highlight-chip{
            display:inline-flex;
            align-items:center;
            gap:8px;
            padding:10px 14px;
            border-radius:999px;
            font-size:14px;
            font-weight:700;
        }

        .analytics-mini-insight{
            margin-top:14px;
            margin-bottom:10px;
            font-size:15px;
            font-weight:600;
            line-height:1.5;
        }

        #chartBars{
            display:grid !important;
            grid-template-columns:repeat(7, minmax(0, 1fr));
            gap:14px;
            align-items:stretch;
            min-height:340px;
        }

        #chartLabels{
            display:none !important;
        }

        .analytics-bar-group{
            position:relative;
            display:flex;
            flex-direction:column;
            justify-content:flex-end;
            min-height:320px;
            padding:14px 10px 12px;
            border-radius:22px;
            overflow:hidden;
        }

        .analytics-bar-group-topline{
            position:absolute;
            inset:0 0 auto 0;
            height:4px;
        }

        .analytics-bar-group-head{
            display:flex;
            justify-content:center;
            margin-top:8px;
            margin-bottom:12px;
        }

        .analytics-day-total{
            min-width:48px;
            height:46px;
            padding:0 14px;
            border-radius:999px;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            font-size:18px;
            font-weight:800;
        }

        .analytics-bar-group-body{
            flex:1;
            display:flex;
            align-items:flex-end;
            justify-content:center;
            gap:8px;
            min-height:205px;
        }

        .analytics-single-bar-wrap{
            flex:1;
            min-width:0;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:flex-end;
            gap:6px;
        }

        .analytics-single-bar-value{
            font-size:12px;
            font-weight:800;
            line-height:1;
            min-height:14px;
        }

        .analytics-single-bar{
            width:100%;
            border-radius:10px 10px 6px 6px;
            min-height:4px;
            transition:all 0.2s ease;
        }

        .analytics-group-empty{
            flex:1;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            gap:10px;
            text-align:center;
        }

        .analytics-group-empty-icon{
            width:38px;
            height:38px;
            border-radius:50%;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            font-size:15px;
        }

        .analytics-day-label{
            margin-top:14px;
            text-align:center;
            font-size:14px;
            font-weight:800;
            line-height:1.2;
        }

        .analytics-today-badge{
            position:absolute;
            top:12px;
            right:10px;
            padding:5px 10px;
            border-radius:999px;
            font-size:11px;
            font-weight:800;
            line-height:1;
            z-index:2;
        }

        .chart-footer-legend{
            display:flex;
            flex-wrap:wrap;
            gap:12px;
            margin-top:16px;
        }

        .chart-footer-legend .chart-legend-item{
            display:inline-flex;
            align-items:center;
            gap:8px;
            padding:10px 16px;
            border-radius:999px;
        }

        .chart-footer-legend .cfl-label{
            font-size:13px;
            font-weight:700;
        }

        .chart-footer-legend .cfl-dot{
            width:12px !important;
            height:12px !important;
            border-radius:50%;
            display:inline-block;
            flex-shrink:0;
        }

        .subject-insight-meta{
            margin:6px 0 10px;
            font-size:12px;
            line-height:1.6;
            opacity:0.92;
        }

        body.dark-theme .progress-chart-card,
        body.preview-dark .progress-chart-card,
        html.dark-theme .progress-chart-card,
        html.dark .progress-chart-card,
        body[data-theme="dark"] .progress-chart-card,
        html[data-theme="dark"] .progress-chart-card,
        body.dark-theme .score-overview-card,
        body.preview-dark .score-overview-card,
        html.dark-theme .score-overview-card,
        html.dark .score-overview-card,
        body[data-theme="dark"] .score-overview-card,
        html[data-theme="dark"] .score-overview-card,
        body.dark-theme .subject-insights-card,
        body.preview-dark .subject-insights-card,
        html.dark-theme .subject-insights-card,
        html.dark .subject-insights-card,
        body[data-theme="dark"] .subject-insights-card,
        html[data-theme="dark"] .subject-insights-card,
        body.dark-theme .recommendations-card,
        body.preview-dark .recommendations-card,
        html.dark-theme .recommendations-card,
        html.dark .recommendations-card,
        body[data-theme="dark"] .recommendations-card,
        html[data-theme="dark"] .recommendations-card{
            color:#f8fafc !important;
        }

        body.dark-theme .progress-chart-card p,
        body.preview-dark .progress-chart-card p,
        html.dark-theme .progress-chart-card p,
        html.dark .progress-chart-card p,
        body[data-theme="dark"] .progress-chart-card p,
        html[data-theme="dark"] .progress-chart-card p,
        body.dark-theme .progress-chart-card span,
        body.preview-dark .progress-chart-card span,
        html.dark-theme .progress-chart-card span,
        html.dark .progress-chart-card span,
        body[data-theme="dark"] .progress-chart-card span,
        html[data-theme="dark"] .progress-chart-card span,
        body.dark-theme .score-overview-card p,
        body.preview-dark .score-overview-card p,
        html.dark-theme .score-overview-card p,
        html.dark .score-overview-card p,
        body[data-theme="dark"] .score-overview-card p,
        html[data-theme="dark"] .score-overview-card p,
        body.dark-theme .subject-insights-card p,
        body.preview-dark .subject-insights-card p,
        html.dark-theme .subject-insights-card p,
        html.dark .subject-insights-card p,
        body[data-theme="dark"] .subject-insights-card p,
        html[data-theme="dark"] .subject-insights-card p,
        body.dark-theme .recommendations-card p,
        body.preview-dark .recommendations-card p,
        html.dark-theme .recommendations-card p,
        html.dark .recommendations-card p,
        body[data-theme="dark"] .recommendations-card p,
        html[data-theme="dark"] .recommendations-card p{
            color:#cbd5e1 !important;
        }

        body.dark-theme .subject-insights-card h4,
        body.preview-dark .subject-insights-card h4,
        html.dark-theme .subject-insights-card h4,
        html.dark .subject-insights-card h4,
        body[data-theme="dark"] .subject-insights-card h4,
        html[data-theme="dark"] .subject-insights-card h4,
        body.dark-theme .recommendations-card h4,
        body.preview-dark .recommendations-card h4,
        html.dark-theme .recommendations-card h4,
        html.dark .recommendations-card h4,
        body[data-theme="dark"] .recommendations-card h4,
        html[data-theme="dark"] .recommendations-card h4,
        body.dark-theme .score-overview-card h4,
        body.preview-dark .score-overview-card h4,
        html.dark-theme .score-overview-card h4,
        html.dark .score-overview-card h4,
        body[data-theme="dark"] .score-overview-card h4,
        html[data-theme="dark"] .score-overview-card h4{
            color:#ffffff !important;
        }

        body.dark-theme #analyticsChartInsight,
        body.preview-dark #analyticsChartInsight,
        html.dark-theme #analyticsChartInsight,
        html.dark #analyticsChartInsight,
        body[data-theme="dark"] #analyticsChartInsight,
        html[data-theme="dark"] #analyticsChartInsight{
            color:#f8fafc !important;
        }

        body.dark-theme #analyticsChartMiniInsight,
        body.preview-dark #analyticsChartMiniInsight,
        html.dark-theme #analyticsChartMiniInsight,
        html.dark #analyticsChartMiniInsight,
        body[data-theme="dark"] #analyticsChartMiniInsight,
        html[data-theme="dark"] #analyticsChartMiniInsight{
            color:#cbd5e1 !important;
        }
    `;
}

function getChartTypeMeta(type) {
    const dark = isDarkTheme();
    const metaMap = {
        tasks: {
            key: "tasks",
            label: "Tasks",
            dot: "#7c6cff",
            bg: dark ? "rgba(124,108,255,0.18)" : "#f3f0ff",
            border: dark ? "rgba(124,108,255,0.34)" : "#ddd6fe",
            text: dark ? "#e9e5ff" : "#5b4ef5",
            badgeBg: dark ? "rgba(124,108,255,0.22)" : "#ede9fe",
            badgeText: dark ? "#ffffff" : "#5b4ef5"
        },
        revisions: {
            key: "revisions",
            label: "Revisions",
            dot: "#3b82f6",
            bg: dark ? "rgba(59,130,246,0.16)" : "#eff6ff",
            border: dark ? "rgba(59,130,246,0.34)" : "#bfdbfe",
            text: dark ? "#dbeafe" : "#2563eb",
            badgeBg: dark ? "rgba(59,130,246,0.22)" : "#dbeafe",
            badgeText: dark ? "#ffffff" : "#2563eb"
        },
        plans: {
            key: "plans",
            label: "Plans",
            dot: "#10b981",
            bg: dark ? "rgba(16,185,129,0.16)" : "#ecfdf5",
            border: dark ? "rgba(16,185,129,0.34)" : "#bbf7d0",
            text: dark ? "#d1fae5" : "#059669",
            badgeBg: dark ? "rgba(16,185,129,0.22)" : "#d1fae5",
            badgeText: dark ? "#ffffff" : "#059669"
        },
        tests: {
            key: "tests",
            label: "Tests",
            dot: "#f59e0b",
            bg: dark ? "rgba(245,158,11,0.16)" : "#fff7ed",
            border: dark ? "rgba(245,158,11,0.34)" : "#fed7aa",
            text: dark ? "#fde68a" : "#d97706",
            badgeBg: dark ? "rgba(245,158,11,0.22)" : "#ffedd5",
            badgeText: dark ? "#ffffff" : "#d97706"
        }
    };
    return metaMap[type];
}

function isCompletedTest(test) {
    return test.type === "Completed" || Number.isFinite(test.score);
}

function isDonePlan(plan) {
    return plan.status === "Done";
}

// ─────────────────────────────────────────────────────────────
// Normalizers
// ─────────────────────────────────────────────────────────────

function normalizeSubjectName(subject) {
    if (typeof subject === "string") return subject.trim();
    if (!subject || typeof subject !== "object") return "";
    return String(subject.name ?? subject.subjectName ?? subject.title ?? "").trim();
}

function normalizeTaskStatus(text) {
    const v = String(text || "").toLowerCase().trim();
    if (v === "completed" || v === "done") return "Completed";
    if (v === "in progress") return "In Progress";
    if (v === "overdue") return "Overdue";
    return "Pending";
}

function getTaskDisplayStatus(rawStatus, dueDate) {
    const n = normalizeTaskStatus(rawStatus);
    const parsed = parseDateOnly(dueDate);
    const today = parseDateOnly(getTodayString());

    if (n === "Completed") return "Completed";
    if (n === "Overdue") return "Overdue";
    if (n === "In Progress") return "In Progress";
    if (parsed && today && parsed < today) return "Overdue";
    return "Pending";
}

function normalizeTestType(typeText, score) {
    const v = String(typeText || "").trim().toLowerCase();
    if (Number.isFinite(score)) return "Completed";
    if (v === "completed") return "Completed";
    if (v === "upcoming") return "Upcoming";
    if (v === "this week") return "This Week";
    if (v === "mock test" || v === "mock tests") return "Mock Test";
    return "Upcoming";
}

function normalizePlanStatus(statusText) {
    const v = String(statusText || "").toLowerCase().trim();
    if (v === "done" || v === "completed") return "Done";
    if (v === "in progress") return "In Progress";
    return "Pending";
}

function normalizeRevisionTopic(topic) {
    return {
        id: topic?.id ?? null,
        title: String(topic?.title || topic?.topic || "").trim(),
        subject: extractSubjectName(topic?.subject),
        priority: String(topic?.priority || "").trim(),
        date: String(topic?.date || topic?.revisionDate || "").trim(),
        status: String(topic?.status || "").trim()
    };
}

function normalizeTask(task) {
    const subjectName = extractSubjectName(task?.subject) || String(task?.subjectName || "").trim();
    const dueDate = String(task?.dueDate || task?.date || "").trim();
    const rawStatus = normalizeTaskStatus(task?.status || "Pending");

    return {
        id: task?.id ?? null,
        title: String(task?.title || "").trim(),
        dueDate,
        status: rawStatus,
        displayStatus: getTaskDisplayStatus(rawStatus, dueDate),
        priority: String(task?.priority || "").trim(),
        subjectName
    };
}

function normalizeTest(test) {
    const rawScore = test?.score;
    const numericScore = rawScore === null || rawScore === undefined || rawScore === ""
        ? null
        : Number(rawScore);

    return {
        id: test?.id ?? null,
        title: String(test?.title || "").trim(),
        subject: extractSubjectName(test?.subject),
        date: String(test?.date || test?.testDate || "").trim(),
        type: normalizeTestType(test?.type || test?.testType || "", numericScore),
        score: Number.isFinite(numericScore) ? numericScore : null,
        focusArea: String(test?.focusArea || "").trim(),
        testTip: String(test?.testTip || "").trim()
    };
}

function normalizePlan(plan) {
    return {
        id: plan?.id ?? null,
        title: String(plan?.title || "").trim(),
        subject: extractSubjectName(plan?.subject),
        date: String(plan?.date || plan?.planDate || "").trim(),
        status: normalizePlanStatus(plan?.status || "Pending")
    };
}

function isCompletedRevision(topic) {
    const status = textKey(topic?.status);
    const priority = textKey(topic?.priority);
    return status === "completed" || priority === "completed";
}

function isWeakRevision(topic) {
    const status = textKey(topic?.status);
    const priority = textKey(topic?.priority);
    return status === "weak topic" || priority === "weak topic";
}

// ─────────────────────────────────────────────────────────────
// Fetch
// ─────────────────────────────────────────────────────────────

async function fetchJson(url) {

    const token = (localStorage.getItem("token") || "").trim();
    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed: ${url} (${response.status})`);
    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return response.json();

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function loadAllAnalyticsData() {
    const results = await Promise.allSettled([
         fetchJson(SUBJECTS_API_URL),    
         fetchJson(TASKS_API_URL),
         fetchJson(REVISIONS_API_URL),
         fetchJson(TESTS_API_URL),
        fetchJson(PLANS_API_URL)
    ]);

    const [subR, taskR, revR, testR, planR] = results;

    analyticsStore.subjects =
        subR.status === "fulfilled" && Array.isArray(subR.value)
            ? subR.value.map(normalizeSubjectName).filter(Boolean)
            : [];

    analyticsStore.tasks =
        taskR.status === "fulfilled" && Array.isArray(taskR.value)
            ? taskR.value.map(normalizeTask)
            : [];

    analyticsStore.revisions =
        revR.status === "fulfilled" && Array.isArray(revR.value)
            ? revR.value.map(normalizeRevisionTopic)
            : [];

    analyticsStore.tests =
        testR.status === "fulfilled" && Array.isArray(testR.value)
            ? testR.value.map(normalizeTest)
            : [];

    analyticsStore.plans =
        planR.status === "fulfilled" && Array.isArray(planR.value)
            ? planR.value.map(normalizePlan)
            : [];
}

// ─────────────────────────────────────────────────────────────
// Filter + Metrics
// ─────────────────────────────────────────────────────────────

function getFilteredAnalyticsData() {
    const rangeValue = getSelectedRange();

    return {
        rangeValue,
        subjects: analyticsStore.subjects,
        tasks: analyticsStore.tasks.filter((t) => isDateInSelectedRange(t.dueDate, rangeValue)),
        revisions: analyticsStore.revisions.filter((r) => isDateInSelectedRange(r.date, rangeValue)),
        tests: analyticsStore.tests.filter((t) => isDateInSelectedRange(t.date, rangeValue)),
        plans: analyticsStore.plans.filter((p) => isDateInSelectedRange(p.date, rangeValue))
    };
}

function calculateTaskMetrics(tasks) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.displayStatus === "Completed").length;
    const overdue = tasks.filter((t) => t.displayStatus === "Overdue").length;
    return {
        total,
        completed,
        overdue,
        completionPercent: total > 0 ? safePercent((completed / total) * 100) : 0
    };
}

function calculateRevisionMetrics(revisions) {
    const total = revisions.length;
    const completed = revisions.filter(isCompletedRevision).length;
    const weak = revisions.filter(isWeakRevision).length;
    return {
        total,
        completed,
        weak,
        completionPercent: total > 0 ? safePercent((completed / total) * 100) : 0
    };
}

function calculateTestMetrics(tests) {
    const withScore = tests.filter((t) => isCompletedTest(t) && Number.isFinite(t.score));
    const averageScore =
        withScore.length > 0
            ? safePercent(withScore.reduce((s, t) => s + Number(t.score), 0) / withScore.length)
            : 0;

    const upcomingCount = tests.filter((t) => !isCompletedTest(t)).length;
    return { completedCount: withScore.length, averageScore, upcomingCount };
}

function calculatePlanMetrics(plans) {
    const total = plans.length;
    const done = plans.filter(isDonePlan).length;
    const weekPlans = plans.filter((p) => isDateInCurrentWeek(p.date));
    const weekDone = weekPlans.filter(isDonePlan).length;

    return {
        total,
        done,
        completionPercent: total > 0 ? safePercent((done / total) * 100) : 0,
        weeklyFocusPercent: weekPlans.length > 0 ? safePercent((weekDone / weekPlans.length) * 100) : 0
    };
}

function calculateOverallStudyProgress(tM, rM, testM, pM) {
    const scores = [];
    if (tM.total > 0) scores.push(tM.completionPercent);
    if (rM.total > 0) scores.push(rM.completionPercent);
    if (testM.completedCount > 0) scores.push(testM.averageScore);
    if (pM.total > 0) scores.push(pM.completionPercent);
    return scores.length > 0 ? average(scores) : 0;
}

function calculateWeeklyConsistency(filteredData) {
    const activeDays = new Set();

    filteredData.tasks.forEach((t) => { if (isDateInCurrentWeek(t.dueDate)) activeDays.add(t.dueDate); });
    filteredData.revisions.forEach((r) => { if (isDateInCurrentWeek(r.date)) activeDays.add(r.date); });
    filteredData.tests.forEach((t) => { if (isDateInCurrentWeek(t.date)) activeDays.add(t.date); });
    filteredData.plans.forEach((p) => { if (isDateInCurrentWeek(p.date)) activeDays.add(p.date); });

    return Math.min(activeDays.size, 7);
}

function buildMetrics(filteredData) {
    const tM = calculateTaskMetrics(filteredData.tasks);
    const rM = calculateRevisionMetrics(filteredData.revisions);
    const testM = calculateTestMetrics(filteredData.tests);
    const pM = calculatePlanMetrics(filteredData.plans);

    return {
        overallStudyProgress: calculateOverallStudyProgress(tM, rM, testM, pM),
        averageTestScore: testM.averageScore,
        completedSessions: pM.done,
        weeklyConsistency: calculateWeeklyConsistency(filteredData),
        taskCompletion: tM.completionPercent,
        revisionCompletion: rM.completionPercent,
        focusEfficiency: pM.weeklyFocusPercent,
        extra: { tM, rM, testM, pM }
    };
}

// ─────────────────────────────────────────────────────────────
// Summary Cards + Score Overview
// ─────────────────────────────────────────────────────────────

function updateSummaryCards(metrics, filteredData, subjectInsights) {
    if (overallStudyProgressValue) overallStudyProgressValue.textContent = `${metrics.overallStudyProgress}%`;
    if (averageTestScoreValue) averageTestScoreValue.textContent = `${metrics.averageTestScore}%`;
    if (completedSessionsValue) completedSessionsValue.textContent = String(metrics.completedSessions);
    if (weeklyConsistencyValue) weeklyConsistencyValue.textContent = `${metrics.weeklyConsistency} Days`;

    const overallNote = ensureSummaryNote(".asc-progress", "overallProgressNote");
    const scoreNote = ensureSummaryNote(".asc-score", "averageScoreNote");
    const sessionsNote = ensureSummaryNote(".asc-sessions", "completedSessionsNote");
    const consistencyNote = ensureSummaryNote(".asc-consistency", "weeklyConsistencyNote");

    const strongest = subjectInsights[0];
    const completedTests = filteredData.tests.filter((t) => isCompletedTest(t) && Number.isFinite(t.score)).length;
    const activeRangeDays = new Set([
        ...filteredData.tasks.map((t) => t.dueDate).filter(Boolean),
        ...filteredData.revisions.map((r) => r.date).filter(Boolean),
        ...filteredData.tests.map((t) => t.date).filter(Boolean),
        ...filteredData.plans.map((p) => p.date).filter(Boolean)
    ]).size;

    if (overallNote) {
        overallNote.textContent = strongest
            ? `${getPerformanceTone(metrics.overallStudyProgress)} performance · Best subject: ${strongest.subjectName}`
            : "Complete tasks, plans, revisions, or tests to unlock progress insights";
    }

    if (scoreNote) {
        scoreNote.textContent = completedTests > 0
            ? `${completedTests} scored test${completedTests > 1 ? "s" : ""} in this range`
            : "No scored tests yet in this range";
    }

    if (sessionsNote) {
        sessionsNote.textContent = filteredData.plans.length > 0
            ? `${metrics.extra.pM.done}/${filteredData.plans.length} plans completed`
            : "No planner sessions found in this range";
    }

    if (consistencyNote) {
        consistencyNote.textContent = activeRangeDays > 0
            ? `${activeRangeDays} active date${activeRangeDays > 1 ? "s" : ""} recorded`
            : "No activity dates available yet";
    }
}

function updateScoreOverview(metrics, filteredData) {
    if (mockTestsValue) mockTestsValue.textContent = `${metrics.averageTestScore}%`;
    if (revisionAccuracyValue) revisionAccuracyValue.textContent = `${metrics.revisionCompletion}%`;
    if (taskCompletionValue) taskCompletionValue.textContent = `${metrics.taskCompletion}%`;
    if (focusEfficiencyValue) focusEfficiencyValue.textContent = `${metrics.focusEfficiency}%`;

    const completedTests = filteredData.tests.filter((t) => isCompletedTest(t) && Number.isFinite(t.score)).length;
    const totalRevisions = filteredData.revisions.length;
    const completedRevisions = filteredData.revisions.filter(isCompletedRevision).length;
    const totalTasks = filteredData.tasks.length;
    const completedTasks = filteredData.tasks.filter((t) => t.displayStatus === "Completed").length;
    const weekPlans = filteredData.plans.filter((p) => isDateInCurrentWeek(p.date));
    const weekDonePlans = weekPlans.filter(isDonePlan);

    setScoreCardDescription(
        mockTestsValue,
        completedTests > 0
            ? `${completedTests} completed test${completedTests > 1 ? "s" : ""} se average bana hai`
            : "Abhi completed scored tests nahi mile"
    );

    setScoreCardDescription(
        revisionAccuracyValue,
        totalRevisions > 0
            ? `${completedRevisions}/${totalRevisions} revision topic${totalRevisions > 1 ? "s" : ""} completed`
            : "Abhi revision data available nahi hai"
    );

    setScoreCardDescription(
        taskCompletionValue,
        totalTasks > 0
            ? `${completedTasks}/${totalTasks} task${totalTasks > 1 ? "s" : ""} completed`
            : "Abhi task completion data available nahi hai"
    );

    setScoreCardDescription(
        focusEfficiencyValue,
        weekPlans.length > 0
            ? `${weekDonePlans.length}/${weekPlans.length} planner block${weekPlans.length > 1 ? "s" : ""} done this week`
            : "Is week planner focus data available nahi hai"
    );
}

// ─────────────────────────────────────────────────────────────
// Grouped Activity Chart
// ─────────────────────────────────────────────────────────────

function buildRecent7DayTrend(filteredData) {
    const { start } = getRecent7DaysWindow();
    const todayYmd = getTodayString();
    const days = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);

        const ymd = formatDateToYMD(date);
        const label = date.toLocaleDateString("en-US", { weekday: "short" });
        const isToday = ymd === todayYmd;

        const tasks = filteredData.tasks.filter(
            (t) => t.dueDate === ymd && t.displayStatus === "Completed"
        ).length;

        const revisions = filteredData.revisions.filter(
            (r) => r.date === ymd && isCompletedRevision(r)
        ).length;

        const plans = filteredData.plans.filter(
            (p) => p.date === ymd && isDonePlan(p)
        ).length;

        const tests = filteredData.tests.filter(
            (t) => t.date === ymd && isCompletedTest(t)
        ).length;

        const total = tasks + revisions + plans + tests;

        days.push({ label, ymd, isToday, tasks, revisions, plans, tests, total });
    }

    return days;
}

function getDominantTrendType(trend) {
    const totals = trend.reduce((acc, d) => {
        acc.tasks += d.tasks;
        acc.revisions += d.revisions;
        acc.plans += d.plans;
        acc.tests += d.tests;
        return acc;
    }, { tasks: 0, revisions: 0, plans: 0, tests: 0 });

    const map = { tasks: "Tasks", revisions: "Revisions", plans: "Plans", tests: "Tests" };
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    if (!top || top[1] <= 0) return "No focus yet";
    return map[top[0]] || "Mixed";
}

function renderChartHighlightChips(trend) {
    const row = ensureChartHighlightChipRow();
    if (!row) return;

    const total = trend.reduce((sum, day) => sum + day.total, 0);
    const activeDays = trend.filter((day) => day.total > 0).length;
    const bestDay = trend.reduce((a, b) => a.total >= b.total ? a : b, trend[0]);
    const focus = getDominantTrendType(trend);

    const totalMeta = getChartTypeMeta("tasks");
    const activeMeta = getChartTypeMeta("plans");
    const bestMeta = getChartTypeMeta("revisions");
    const focusMeta = getChartTypeMeta("tests");

    row.innerHTML = `
        <span class="analytics-highlight-chip" style="background:${totalMeta.bg};border:1px solid ${totalMeta.border};color:${totalMeta.text};">
            <i class="fa-solid fa-layer-group" style="color:${totalMeta.dot};"></i>
            <span>Total: ${total}</span>
        </span>

        <span class="analytics-highlight-chip" style="background:${activeMeta.bg};border:1px solid ${activeMeta.border};color:${activeMeta.text};">
            <i class="fa-solid fa-calendar-check" style="color:${activeMeta.dot};"></i>
            <span>Active Days: ${activeDays}</span>
        </span>

        <span class="analytics-highlight-chip" style="background:${bestMeta.bg};border:1px solid ${bestMeta.border};color:${bestMeta.text};">
            <i class="fa-solid fa-trophy" style="color:${bestMeta.dot};"></i>
            <span>Best Day: ${bestDay && bestDay.total > 0 ? escapeHtml(bestDay.label) : "—"}</span>
        </span>

        <span class="analytics-highlight-chip" style="background:${focusMeta.bg};border:1px solid ${focusMeta.border};color:${focusMeta.text};">
            <i class="fa-solid fa-bullseye" style="color:${focusMeta.dot};"></i>
            <span>Focus: ${escapeHtml(focus)}</span>
        </span>
    `;
}

function colorizeChartLegend() {
    const legendItems = document.querySelectorAll(".chart-footer-legend .chart-legend-item");

    legendItems.forEach((item) => {
        const labelEl = item.querySelector(".cfl-label");
        const dotEl = item.querySelector(".cfl-dot");
        const text = (labelEl?.textContent || "").trim().toLowerCase();

        let meta = getChartTypeMeta("tasks");
        if (text.includes("revision")) meta = getChartTypeMeta("revisions");
        else if (text.includes("plan")) meta = getChartTypeMeta("plans");
        else if (text.includes("test")) meta = getChartTypeMeta("tests");

        item.style.background = meta.bg;
        item.style.border = `1px solid ${meta.border}`;
        item.style.color = meta.text;

        if (labelEl) {
            labelEl.style.color = meta.text;
            labelEl.style.fontWeight = "700";
        }

        if (dotEl) {
            dotEl.style.background = meta.dot;
            dotEl.style.boxShadow = `0 0 0 4px ${meta.bg}`;
        }
    });
}

function renderTrendChart(filteredData) {
    if (!chartBarsContainer || !chartLabelsContainer) return;

    const trend = buildRecent7DayTrend(filteredData);
    const dark = isDarkTheme();

    renderChartHighlightChips(trend);

    const yAxisEl = document.querySelector(".chart-y-axis");
    const maxBarValue = Math.max(
        1,
        ...trend.flatMap((d) => [d.tasks, d.revisions, d.plans, d.tests])
    );

    if (yAxisEl) {
        yAxisEl.innerHTML = `
            <span>${maxBarValue}</span>
            <span>${Math.ceil(maxBarValue / 2)}</span>
            <span>0</span>
        `;
    }

    chartLabelsContainer.innerHTML = "";
    chartLabelsContainer.style.display = "none";
    chartBarsContainer.innerHTML = "";

    const categoriesOrder = ["tasks", "revisions", "plans", "tests"];

    trend.forEach((day) => {
        const card = document.createElement("div");
        card.className = "analytics-bar-group";

        const normalCardBg = dark ? "#0f172a" : "#ffffff";
        const normalCardBorder = dark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
        const normalCardShadow = dark ? "0 14px 28px rgba(0,0,0,0.24)" : "0 8px 20px rgba(15,23,42,0.06)";
        const todayBorder = dark ? "#8b7cff" : "#8b5cf6";
        const todayText = dark ? "#ffffff" : "#5b4ef5";
        const emptyText = dark ? "#94a3b8" : "#94a3b8";

        card.style.background = day.isToday
            ? (dark ? "linear-gradient(180deg, rgba(108,99,255,0.18), rgba(91,78,245,0.12))" : "linear-gradient(180deg,#f5f3ff,#eef2ff)")
            : normalCardBg;

        card.style.border = day.isToday
            ? `2px solid ${todayBorder}`
            : `1px solid ${normalCardBorder}`;

        card.style.boxShadow = normalCardShadow;

        const topLine = document.createElement("div");
        topLine.className = "analytics-bar-group-topline";
        topLine.style.background = day.isToday
            ? "linear-gradient(90deg,#7c6cff,#5b4ef5)"
            : (dark ? "linear-gradient(90deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02))" : "linear-gradient(90deg,#ede9fe,#eef2ff)");
        card.appendChild(topLine);

        if (day.isToday) {
            const todayBadge = document.createElement("span");
            todayBadge.className = "analytics-today-badge";
            todayBadge.textContent = "Today";
            todayBadge.style.background = dark ? "rgba(255,255,255,0.12)" : "#ede9fe";
            todayBadge.style.border = `1px solid ${dark ? "rgba(255,255,255,0.18)" : "#d8ccff"}`;
            todayBadge.style.color = dark ? "#ffffff" : "#5b4ef5";
            card.appendChild(todayBadge);
        }

        const head = document.createElement("div");
        head.className = "analytics-bar-group-head";

        const totalBubble = document.createElement("span");
        totalBubble.className = "analytics-day-total";
        totalBubble.textContent = day.total;
        totalBubble.style.background = day.isToday
            ? "linear-gradient(135deg,#7c6cff,#5b4ef5)"
            : (dark ? "rgba(255,255,255,0.10)" : "#f3f0ff");
        totalBubble.style.color = day.isToday ? "#ffffff" : "#5b4ef5";

        head.appendChild(totalBubble);
        card.appendChild(head);

        const body = document.createElement("div");
        body.className = "analytics-bar-group-body";

        if (day.total === 0) {
            const empty = document.createElement("div");
            empty.className = "analytics-group-empty";

            const icon = document.createElement("span");
            icon.className = "analytics-group-empty-icon";
            icon.innerHTML = `<i class="fa-regular fa-bell-slash"></i>`;
            icon.style.background = dark ? "rgba(255,255,255,0.06)" : "#f3f4f6";
            icon.style.color = emptyText;

            const text = document.createElement("span");
            text.textContent = "No activity";
            text.style.fontSize = "13px";
            text.style.fontWeight = "700";
            text.style.lineHeight = "1.45";
            text.style.color = emptyText;

            empty.appendChild(icon);
            empty.appendChild(text);
            body.appendChild(empty);
        } else {
            categoriesOrder.forEach((key) => {
                const meta = getChartTypeMeta(key);
                const value = day[key];
                const wrap = document.createElement("div");
                wrap.className = "analytics-single-bar-wrap";

                const valueEl = document.createElement("span");
                valueEl.className = "analytics-single-bar-value";
                valueEl.textContent = value;
                valueEl.style.color = value > 0 ? meta.text : (dark ? "#94a3b8" : "#94a3b8");

                const bar = document.createElement("div");
                bar.className = "analytics-single-bar";
                bar.style.background = value > 0
                    ? `linear-gradient(180deg, ${meta.dot}, ${meta.dot})`
                    : (dark ? "rgba(255,255,255,0.06)" : "#edf2f7");

                bar.style.border = value > 0
                    ? `1px solid ${meta.border}`
                    : `1px solid ${dark ? "rgba(255,255,255,0.06)" : "#e5e7eb"}`;

                const height = value > 0
                    ? Math.max(18, Math.round((value / maxBarValue) * 150))
                    : 6;

                bar.style.height = `${height}px`;
                bar.title = `${meta.label}: ${value}`;

                wrap.appendChild(valueEl);
                wrap.appendChild(bar);
                body.appendChild(wrap);
            });
        }

        card.appendChild(body);

        const footer = document.createElement("div");
        footer.className = "analytics-day-label";
        footer.textContent = day.label;
        footer.style.color = day.isToday
            ? todayText
            : (dark ? "#e2e8f0" : "#64748b");

        card.appendChild(footer);
        chartBarsContainer.appendChild(card);
    });

    colorizeChartLegend();
    renderChartInsightLine(trend);
}

function renderChartInsightLine(trend) {
    const insightEl = document.getElementById("analyticsChartInsight");
    const miniInsightEl = ensureChartMiniInsight();
    if (!insightEl) return;

    const total = trend.reduce((s, d) => s + d.total, 0);
    const activeDays = trend.filter((d) => d.total > 0).length;
    const busiest = trend.reduce((a, b) => a.total >= b.total ? a : b, trend[0]);
    const todayData = trend.find((d) => d.isToday);
    const dominantType = getDominantTrendType(trend);

    if (total === 0) {
        if (miniInsightEl) {
            miniInsightEl.textContent = "This section tracks tasks, revisions, planner completions, and tests across the last 7 days.";
        }
        insightEl.textContent = "No completed activity recorded in the last 7 days. Complete one task, revision, planner item, or test to start your recent performance trend.";
        return;
    }

    if (miniInsightEl) {
        miniInsightEl.textContent = `Last 7 days show ${getPerformanceTone(Math.round((activeDays / 7) * 100)).toLowerCase()} consistency, with ${dominantType.toLowerCase()} contributing the most.`;
    }

    let insightText = `${total} completed activit${total > 1 ? "ies" : "y"} tracked in the last 7 days.`;

    if (busiest && busiest.total > 0) {
        insightText += ` ${busiest.label} is your strongest day with ${busiest.total} activit${busiest.total > 1 ? "ies" : "y"}.`;
    }

    insightText += ` You stayed active on ${activeDays} day${activeDays > 1 ? "s" : ""}.`;

    if (todayData && todayData.total > 0) {
        insightText += ` Today already has ${todayData.total} completed activit${todayData.total > 1 ? "ies" : "y"}.`;
    } else {
        insightText += ` No completed activity is tracked for today yet.`;
    }

    insightEl.textContent = insightText;
}

// ─────────────────────────────────────────────────────────────
// Subject Insights
// ─────────────────────────────────────────────────────────────

function getAllSubjectNames(filteredData) {
    const subjectMap = new Map();

    const add = (value) => {
        const display = String(value || "").trim();
        if (!display) return;
        const key = textKey(display);
        if (!subjectMap.has(key)) subjectMap.set(key, display);
    };

    analyticsStore.subjects.forEach(add);
    filteredData.tasks.forEach((t) => add(t.subjectName));
    filteredData.revisions.forEach((r) => add(r.subject));
    filteredData.tests.forEach((t) => add(t.subject));
    filteredData.plans.forEach((p) => add(p.subject));

    return [...subjectMap.values()];
}

function buildSubjectInsights(filteredData) {
    const subjectNames = getAllSubjectNames(filteredData);

    const subjectStats = subjectNames.map((name) => {
        const key = textKey(name);

        const sTasks = filteredData.tasks.filter((t) => textKey(t.subjectName) === key);
        const sRevisions = filteredData.revisions.filter((r) => textKey(r.subject) === key);
        const sTests = filteredData.tests.filter((t) => textKey(t.subject) === key);
        const sPlans = filteredData.plans.filter((p) => textKey(p.subject) === key);

        const completedTasks = sTasks.filter((t) => t.displayStatus === "Completed");
        const completedRevisions = sRevisions.filter(isCompletedRevision);
        const completedPlans = sPlans.filter(isDonePlan);
        const scoredTests = sTests.filter((t) => isCompletedTest(t) && Number.isFinite(t.score));

        const taskScore = sTasks.length > 0
            ? safePercent((completedTasks.length / sTasks.length) * 100)
            : null;

        const revisionScore = sRevisions.length > 0
            ? safePercent((completedRevisions.length / sRevisions.length) * 100)
            : null;

        const testScore = scoredTests.length > 0
            ? safePercent(scoredTests.reduce((sum, item) => sum + Number(item.score), 0) / scoredTests.length)
            : null;

        const planScore = sPlans.length > 0
            ? safePercent((completedPlans.length / sPlans.length) * 100)
            : null;

        const finalScore = average(
            [taskScore, revisionScore, testScore, planScore].filter(Number.isFinite)
        );

        return {
            subjectName: name,
            finalScore,
            taskCount: sTasks.length,
            revisionCount: sRevisions.length,
            testCount: sTests.length,
            planCount: sPlans.length,
            completedTaskCount: completedTasks.length,
            completedRevisionCount: completedRevisions.length,
            completedPlanCount: completedPlans.length,
            scoredTestCount: scoredTests.length,
            activityCount: sTasks.length + sRevisions.length + sTests.length + sPlans.length
        };
    });

    return subjectStats
        .filter((s) => s.activityCount > 0)
        .sort((a, b) => {
            if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
            return b.activityCount - a.activityCount;
        });
}

function renderSubjectInsights(subjectInsights) {
    if (!subjectInsightList) return;

    const strongestEl = document.getElementById("strongestSubjectBadge");
    const weakestEl = document.getElementById("weakestSubjectBadge");

    if (subjectInsights.length > 0 && strongestEl) {
        strongestEl.querySelector("span").textContent =
            `Strongest: ${subjectInsights[0].subjectName} (${subjectInsights[0].finalScore}%)`;
    } else if (strongestEl) {
        strongestEl.querySelector("span").textContent = "Strongest: —";
    }

    if (subjectInsights.length > 1 && weakestEl) {
        const weakest = [...subjectInsights].sort((a, b) => a.finalScore - b.finalScore)[0];
        weakestEl.querySelector("span").textContent =
            `Needs Focus: ${weakest.subjectName} (${weakest.finalScore}%)`;
    } else if (weakestEl) {
        weakestEl.querySelector("span").textContent = "Needs Focus: —";
    }

    if (subjectInsights.length === 0) {
        subjectInsightList.innerHTML = `
            <div class="analytics-empty-state">
                <i class="fa-solid fa-book-open"></i>
                <h4>No subject insight yet</h4>
                <p>Add tasks, revisions, plans, or completed tests to unlock subject-wise analytics.</p>
            </div>
        `;
        return;
    }

    const weakestSubject = [...subjectInsights].sort((a, b) => a.finalScore - b.finalScore)[0];

    subjectInsightList.innerHTML = subjectInsights.slice(0, 5).map((item, index) => {
        const pctClass = item.finalScore >= 70 ? "pct-high" : item.finalScore >= 50 ? "pct-mid" : "pct-low";
        const isStrongest = index === 0 && subjectInsights.length > 1;
        const isWeakest =
            weakestSubject &&
            item.subjectName === weakestSubject.subjectName &&
            weakestSubject.finalScore < subjectInsights[0].finalScore;

        let badge = "";
        if (isStrongest) {
            badge = `
                <span class="subject-rank-badge rank-top"
                      style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:11px;font-weight:700;">
                    <i class="fa-solid fa-trophy"></i> Top
                </span>
            `;
        } else if (isWeakest) {
            badge = `
                <span class="subject-rank-badge rank-focus"
                      style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;background:#fff7ed;color:#c2410c;font-size:11px;font-weight:700;">
                    <i class="fa-solid fa-arrow-trend-up"></i> Focus
                </span>
            `;
        }

        const fillStyle = isStrongest
            ? "background:linear-gradient(90deg,#10b981,#34d399);box-shadow:0 6px 14px rgba(16,185,129,0.16);"
            : isWeakest
                ? "background:linear-gradient(90deg,#f59e0b,#fbbf24);box-shadow:0 6px 14px rgba(245,158,11,0.16);"
                : "background:linear-gradient(90deg,#7c6cff,#8b5cf6);";

        return `
            <div class="subject-insight-item ${isStrongest ? "item-top" : ""} ${isWeakest ? "item-focus" : ""}">
                <div class="subject-insight-top">
                    <div style="display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap;">
                        <h4>${escapeHtml(item.subjectName)}</h4>
                        ${badge}
                    </div>
                    <span class="insight-pct ${pctClass}">${item.finalScore}%</span>
                </div>

                <div class="subject-insight-meta">
                    Tasks: ${item.completedTaskCount}/${item.taskCount}
                    &nbsp;•&nbsp;
                    Revisions: ${item.completedRevisionCount}/${item.revisionCount}
                    &nbsp;•&nbsp;
                    Plans: ${item.completedPlanCount}/${item.planCount}
                    &nbsp;•&nbsp;
                    Tests: ${item.scoredTestCount}/${item.testCount}
                </div>

                <div class="subject-progress-bar">
                    <div class="subject-progress-fill" style="width:${item.finalScore}%;${fillStyle}"></div>
                </div>
            </div>
        `;
    }).join("");
}

// ─────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────

function generateRecommendations(filteredData, metrics, subjectInsights) {
    const recs = [];
    const overdueTasks = filteredData.tasks.filter((t) => t.displayStatus === "Overdue").length;
    const weakRevisions = filteredData.revisions.filter(isWeakRevision).length;
    const upcomingTests = filteredData.tests.filter((t) => !isCompletedTest(t)).length;
    const weakest = [...subjectInsights].sort((a, b) => a.finalScore - b.finalScore)[0];
    const strongest = [...subjectInsights].sort((a, b) => b.finalScore - a.finalScore)[0];

    if (overdueTasks > 0) {
        recs.push({
            type: "warn",
            text: `You have ${overdueTasks} overdue task${overdueTasks > 1 ? "s" : ""}. Clear overdue work first to reduce study backlog.`
        });
    }

    if (weakRevisions > 0) {
        recs.push({
            type: "warn",
            text: `You have ${weakRevisions} weak revision topic${weakRevisions > 1 ? "s" : ""}. Revise weak areas before starting new topics.`
        });
    }

    if (metrics.averageTestScore > 0 && metrics.averageTestScore < 70) {
        recs.push({
            type: "tip",
            text: "Your average test score is below 70%. Add one extra mock test and revise mistakes before the next exam."
        });
    }

    if (weakest && weakest.finalScore < 65) {
        recs.push({
            type: "warn",
            text: `Focus more on ${weakest.subjectName} — its combined performance score (${weakest.finalScore}%) is currently the lowest.`
        });
    }

    if (metrics.focusEfficiency > 0 && metrics.focusEfficiency < 60) {
        recs.push({
            type: "tip",
            text: "Your focus efficiency is low in this range. Try shorter study blocks with fixed breaks for better retention."
        });
    }

    if (upcomingTests > 0) {
        recs.push({
            type: "info",
            text: `You have ${upcomingTests} upcoming test${upcomingTests > 1 ? "s" : ""}. Schedule revision before test dates for stronger performance.`
        });
    }

    if (strongest && strongest.finalScore >= 80) {
        recs.push({
            type: "success",
            text: `Maintain your momentum in ${strongest.subjectName} (${strongest.finalScore}%) — it is your strongest subject right now.`
        });
    }

    if (recs.length === 0) {
        recs.push({
            type: "info",
            text: "Add more study activity in tasks, planner, revision, and tests to unlock smarter analytics insights."
        });
    }

    return [...new Map(recs.map((r) => [r.text, r])).values()].slice(0, 4);
}

function renderRecommendations(recommendations, filteredData) {
    if (!recommendationList) return;

    const hasData =
        filteredData.tasks.length > 0 ||
        filteredData.revisions.length > 0 ||
        filteredData.tests.length > 0 ||
        filteredData.plans.length > 0;

    if (!hasData) {
        recommendationList.innerHTML = `
            <div class="analytics-empty-state">
                <i class="fa-solid fa-lightbulb"></i>
                <h4>No recommendations yet</h4>
                <p>Add tasks, plans, revisions, or tests to see smart recommendations here.</p>
            </div>
        `;
        return;
    }

    const iconMap = {
        warn: "fa-triangle-exclamation",
        success: "fa-circle-check",
        info: "fa-circle-info",
        tip: "fa-lightbulb"
    };

    const classMap = {
        warn: "rec-warn",
        success: "rec-success",
        info: "rec-info",
        tip: "rec-tip"
    };

    recommendationList.innerHTML = recommendations.map((rec) => `
        <div class="recommendation-item ${classMap[rec.type] || "rec-tip"}">
            <div class="rec-icon-wrap">
                <i class="fa-solid ${iconMap[rec.type] || "fa-lightbulb"}"></i>
            </div>
            <span>${escapeHtml(rec.text)}</span>
        </div>
    `).join("");
}

// ─────────────────────────────────────────────────────────────
// Main Render
// ─────────────────────────────────────────────────────────────

function renderAnalytics() {
    ensureAnalyticsRuntimeStyles();

    const filteredData = getFilteredAnalyticsData();
    const metrics = buildMetrics(filteredData);
    const subjectInsights = buildSubjectInsights(filteredData);
    const recommendations = generateRecommendations(filteredData, metrics, subjectInsights);

    updateSummaryCards(metrics, filteredData, subjectInsights);
    updateScoreOverview(metrics, filteredData);
    renderTrendChart(filteredData);
    renderSubjectInsights(subjectInsights);
    renderRecommendations(recommendations, filteredData);
}

// ─────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────

function getRangeFileLabel(rangeValue) {
    return String(rangeValue || "overall").toLowerCase().replace(/\s+/g, "-");
}

function buildExportText() {
    const filteredData = getFilteredAnalyticsData();
    const metrics = buildMetrics(filteredData);
    const subjectInsights = buildSubjectInsights(filteredData);
    const recommendations = generateRecommendations(filteredData, metrics, subjectInsights);

    const lines = [
        "EduMind AI — Analytics Report",
        "----------------------------------------",
        `Range: ${getSelectedRange()}`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        "SUMMARY",
        `Overall Study Progress : ${metrics.overallStudyProgress}%`,
        `Average Test Score     : ${metrics.averageTestScore}%`,
        `Completed Sessions     : ${metrics.completedSessions}`,
        `Weekly Consistency     : ${metrics.weeklyConsistency} Days`,
        "",
        "SCORE OVERVIEW",
        `Mock Tests         : ${metrics.averageTestScore}%`,
        `Revision Accuracy  : ${metrics.revisionCompletion}%`,
        `Task Completion    : ${metrics.taskCompletion}%`,
        `Focus Efficiency   : ${metrics.focusEfficiency}%`,
        "",
        "SUBJECT INSIGHTS",
        ...(subjectInsights.length > 0
            ? subjectInsights.slice(0, 6).map((s, i) => `${i + 1}. ${s.subjectName} — ${s.finalScore}%`)
            : ["No subject data available."]),
        "",
        "RECOMMENDATIONS",
        ...recommendations.map((r, i) => `${i + 1}. ${r.text}`),
        "",
        "RAW COUNTS",
        `Tasks     : ${filteredData.tasks.length}`,
        `Revisions : ${filteredData.revisions.length}`,
        `Tests     : ${filteredData.tests.length}`,
        `Plans     : ${filteredData.plans.length}`
    ];

    return lines.join("\n");
}

function exportAnalyticsReport() {
    const blob = new Blob([buildExportText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${getRangeFileLabel(getSelectedRange())}-${formatDateToYMD(new Date())}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// Theme + Init
// ─────────────────────────────────────────────────────────────

function attachThemeAwareRerender() {
    const rerenderIfReady = () => {
        if (chartBarsContainer && document.body) renderAnalytics();
    };

    const observer = new MutationObserver(() => {
        rerenderIfReady();
    });

    if (document.body) {
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class", "data-theme"]
        });
    }

    if (document.documentElement) {
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme"]
        });
    }

    const themeToggleBtn = document.getElementById("themeToggleBtn");
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            setTimeout(rerenderIfReady, 60);
        });
    }
}

function attachProfileDropdown() {
    const profileToggle = document.getElementById("profileMenuToggle");
    const profileDropdown = document.getElementById("dashboardProfileDropdown");

    if (profileToggle && profileDropdown) {
        profileToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle("hidden");
        });

        document.addEventListener("click", () => {
            profileDropdown.classList.add("hidden");
        });
    }
}

async function initializeAnalyticsPage() {
    const pageReady =
        overallStudyProgressValue &&
        averageTestScoreValue &&
        completedSessionsValue &&
        weeklyConsistencyValue &&
        mockTestsValue &&
        revisionAccuracyValue &&
        taskCompletionValue &&
        focusEfficiencyValue &&
        subjectInsightList &&
        recommendationList &&
        chartBarsContainer &&
        chartLabelsContainer;

    if (!pageReady) return;

    ensureAnalyticsRuntimeStyles();

    if (analyticsFilterSelect) {
        analyticsFilterSelect.addEventListener("change", renderAnalytics);
    }

    if (exportReportBtn) {
        exportReportBtn.addEventListener("click", exportAnalyticsReport);
    }

    attachProfileDropdown();
    attachThemeAwareRerender();

    try {
        await loadAllAnalyticsData();
        renderAnalytics();
    } catch (error) {
        console.error("Analytics init failed:", error);
        renderAnalytics();
    }
}

initializeAnalyticsPage();