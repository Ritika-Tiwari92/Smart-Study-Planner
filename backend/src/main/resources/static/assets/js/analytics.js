/**
 * analytics.js — EduMind AI
 * Student Analytics Premium UI
 *
 * Works without a separate Analytics backend.
 * Uses existing APIs:
 * GET /api/subjects
 * GET /api/tasks
 * GET /api/revisions
 * GET /api/tests
 * GET /api/plans
 * GET /api/dashboard/study-summary
 * GET /api/pomodoro/my
 */

document.addEventListener("DOMContentLoaded", function () {
    const API_BASE_URL = window.location.port === "8080" ? "" : "http://localhost:8080";

    const ENDPOINTS = {
        subjects: `${API_BASE_URL}/api/subjects`,
        tasks: `${API_BASE_URL}/api/tasks`,
        revisions: `${API_BASE_URL}/api/revisions`,
        tests: `${API_BASE_URL}/api/tests`,
        plans: `${API_BASE_URL}/api/plans`,
        studySummary: `${API_BASE_URL}/api/dashboard/study-summary`,
        pomodoro: `${API_BASE_URL}/api/pomodoro/my`
    };

    const els = {
        filter: document.querySelector(".analytics-filter select"),
        exportBtn: document.querySelector(".export-report-btn"),

        overallStudyProgressValue: document.getElementById("overallStudyProgressValue"),
        averageTestScoreValue: document.getElementById("averageTestScoreValue"),
        completedSessionsValue: document.getElementById("completedSessionsValue"),
        weeklyConsistencyValue: document.getElementById("weeklyConsistencyValue"),

        mockTestsValue: document.getElementById("mockTestsValue"),
        revisionAccuracyValue: document.getElementById("revisionAccuracyValue"),
        taskCompletionValue: document.getElementById("taskCompletionValue"),
        focusEfficiencyValue: document.getElementById("focusEfficiencyValue"),

        subjectInsightList: document.getElementById("subjectInsightList"),
        recommendationList: document.getElementById("recommendationList"),
        chartBars: document.getElementById("chartBars"),
        chartLabels: document.getElementById("chartLabels"),
        chartInsight: document.getElementById("analyticsChartInsight"),

        strongestSubjectBadge: document.getElementById("strongestSubjectBadge"),
        weakestSubjectBadge: document.getElementById("weakestSubjectBadge")
    };

    const store = {
        subjects: [],
        tasks: [],
        revisions: [],
        tests: [],
        plans: [],
        pomodoro: [],
        studySummary: null,
        loaded: false
    };

    function getToken() {
        return (localStorage.getItem("token") || "").trim();
    }

    function parseStoredJson(value) {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    function getStoredUser() {
        const possibleKeys = [
            "edumind_logged_in_user",
            "loggedInUser",
            "currentUser",
            "user",
            "authUser",
            "studyPlannerUser"
        ];

        for (const key of possibleKeys) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;

            const parsed = parseStoredJson(raw);
            if (parsed && typeof parsed === "object") return parsed;
        }

        return null;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function safeNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function percent(part, total) {
        if (!total || total <= 0) return 0;
        return clamp(Math.round((part * 100) / total), 0, 100);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function average(values) {
        const nums = values.filter((value) => Number.isFinite(value));
        if (!nums.length) return 0;
        return Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length);
    }

    function textKey(value) {
        return String(value || "").trim().toLowerCase();
    }

    function firstAvailable(obj, keys, fallback = "") {
        if (!obj || typeof obj !== "object") return fallback;

        for (const key of keys) {
            const value = obj[key];
            if (value !== undefined && value !== null && value !== "") return value;
        }

        return fallback;
    }

    function getArrayFromResponse(data, fallbackKey) {
        if (Array.isArray(data)) return data;
        if (!data || typeof data !== "object") return [];

        const keys = [
            fallbackKey,
            "data",
            "content",
            "items",
            "results",
            "list",
            "subjects",
            "tasks",
            "revisions",
            "tests",
            "plans",
            "sessions"
        ];

        for (const key of keys) {
            if (Array.isArray(data[key])) return data[key];
        }

        return [];
    }

    function parseDateValue(value) {
        if (!value) return null;

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        const raw = String(value).trim();
        if (!raw) return null;

        const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
            ? `${raw}T00:00:00`
            : raw;

        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function toYmd(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    function todayYmd() {
        return toYmd(new Date());
    }

    function dateToYmd(value) {
        const date = parseDateValue(value);
        return date ? toYmd(date) : "";
    }

    function dayLabel(date) {
        return date.toLocaleDateString("en-US", { weekday: "short" });
    }

    function isSameDay(a, b) {
        const da = parseDateValue(a);
        const db = parseDateValue(b);
        if (!da || !db) return false;
        return toYmd(da) === toYmd(db);
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

    function isInSelectedRange(dateValue, rangeValue) {
        if (rangeValue === "Overall") return true;

        const date = parseDateValue(dateValue);
        if (!date) return false;

        const now = new Date();
        now.setHours(23, 59, 59, 999);

        if (rangeValue === "This Week") {
            const { start, end } = getWeekRange();
            return date >= start && date <= end;
        }

        if (rangeValue === "This Month") {
            return date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth();
        }

        if (rangeValue === "Last 30 Days") {
            const start = new Date();
            start.setDate(start.getDate() - 29);
            start.setHours(0, 0, 0, 0);
            return date >= start && date <= now;
        }

        return true;
    }

    function getSelectedRange() {
        return els.filter ? els.filter.value : "This Week";
    }

    function isDarkTheme() {
        return document.body.classList.contains("preview-dark") ||
            document.body.classList.contains("dark-theme") ||
            document.documentElement.classList.contains("dark") ||
            document.documentElement.classList.contains("dark-theme") ||
            document.body.dataset.theme === "dark" ||
            document.documentElement.dataset.theme === "dark";
    }

    async function fetchJson(url, fallbackKey) {
        const token = getToken();

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "Authorization": token ? `Bearer ${token}` : ""
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            window.location.href = "login.html";
            return null;
        }

        const text = await response.text();
        let data = null;

        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = null;
            }
        }

        if (!response.ok) {
            console.warn("Analytics API failed:", url, response.status, data || text);
            return fallbackKey ? [] : null;
        }

        return fallbackKey ? getArrayFromResponse(data, fallbackKey) : data;
    }

    function normalizeSubject(subject) {
        if (typeof subject === "string") {
            return {
                id: null,
                name: subject.trim(),
                progress: 0
            };
        }

        const name = firstAvailable(subject, ["subjectName", "name", "title"], "Subject");

        return {
            id: firstAvailable(subject, ["id", "subjectId"], null),
            name: String(name || "Subject").trim(),
            progress: safeNumber(firstAvailable(subject, ["progress", "completionPercentage", "coverage"], 0), 0),
            difficulty: firstAvailable(subject, ["difficultyLevel", "difficulty"], "")
        };
    }

    function extractSubjectName(value) {
        if (!value) return "";
        if (typeof value === "string") return value.trim();
        return String(value.subjectName || value.name || value.title || "").trim();
    }

    function extractSubjectId(obj) {
        if (!obj || typeof obj !== "object") return "";
        if (obj.subjectId) return String(obj.subjectId);
        if (obj.subject && typeof obj.subject === "object") return String(obj.subject.id || obj.subject.subjectId || "");
        return "";
    }

    function normalizeStatus(value) {
        const status = textKey(value);
        if (["completed", "complete", "done"].includes(status)) return "COMPLETED";
        if (["in progress", "progress", "active", "ongoing"].includes(status)) return "IN_PROGRESS";
        if (["cancelled", "canceled", "interrupted"].includes(status)) return "INTERRUPTED";
        return "PENDING";
    }

    function normalizeTask(task) {
        const dueDate = firstAvailable(task, ["dueDate", "date", "createdAt", "updatedAt"], "");
        const status = normalizeStatus(firstAvailable(task, ["status", "taskStatus"], "PENDING"));
        const today = parseDateValue(todayYmd());
        const due = parseDateValue(dueDate);
        const isOverdue = status !== "COMPLETED" && due && today && due < today;

        return {
            id: firstAvailable(task, ["id", "taskId"], null),
            title: firstAvailable(task, ["title", "taskTitle", "name"], "Untitled Task"),
            subjectId: extractSubjectId(task),
            subjectName: firstAvailable(task, ["subjectName"], "") || extractSubjectName(task.subject),
            date: dateToYmd(dueDate),
            status: isOverdue ? "OVERDUE" : status,
            priority: firstAvailable(task, ["priority"], "Normal")
        };
    }

    function normalizeRevision(revision) {
        return {
            id: firstAvailable(revision, ["id", "revisionId"], null),
            title: firstAvailable(revision, ["title", "topic", "name"], "Revision Topic"),
            subjectName: firstAvailable(revision, ["subject", "subjectName"], "") || extractSubjectName(revision.subject),
            date: dateToYmd(firstAvailable(revision, ["revisionDate", "date", "createdAt"], "")),
            status: normalizeStatus(firstAvailable(revision, ["status", "priority"], "PENDING")),
            priority: firstAvailable(revision, ["priority"], "")
        };
    }

    function normalizePlan(plan) {
        return {
            id: firstAvailable(plan, ["id", "planId"], null),
            title: firstAvailable(plan, ["title", "topic", "planTitle", "name"], "Study Plan"),
            subjectName: firstAvailable(plan, ["subject", "subjectName"], "") || extractSubjectName(plan.subject),
            date: dateToYmd(firstAvailable(plan, ["date", "planDate", "createdAt"], "")),
            status: normalizeStatus(firstAvailable(plan, ["status"], "PENDING"))
        };
    }

    function normalizeTest(test) {
        const rawScore = firstAvailable(test, ["score", "percentage", "marks", "obtainedScore"], null);
        const score = rawScore === null || rawScore === "" ? null : Number(rawScore);

        return {
            id: firstAvailable(test, ["id", "testId"], null),
            title: firstAvailable(test, ["title", "testName", "name"], "Test"),
            subjectName: firstAvailable(test, ["subject", "subjectName"], "") || extractSubjectName(test.subject),
            date: dateToYmd(firstAvailable(test, ["testDate", "date", "createdAt"], "")),
            score: Number.isFinite(score) ? score : null,
            status: Number.isFinite(score) ? "COMPLETED" : normalizeStatus(firstAvailable(test, ["status", "adminStatus"], "PENDING"))
        };
    }

    function normalizePomodoro(session) {
        const dateValue = firstAvailable(session, ["sessionDate", "startedAt", "createdAt", "startTime"], "");
        const minutes = safeNumber(firstAvailable(session, ["actualDurationMinutes", "focusMinutes", "actualMinutes"], 0), 0);

        return {
            id: firstAvailable(session, ["id", "sessionId"], null),
            subjectName: firstAvailable(session, ["linkedSubjectName", "subjectName", "topic"], "Focus Session"),
            date: dateToYmd(dateValue),
            minutes,
            status: normalizeStatus(firstAvailable(session, ["status"], "PENDING")),
            sessionType: firstAvailable(session, ["sessionType", "type"], "POMODORO")
        };
    }

    function isCompleted(item) {
        return item && item.status === "COMPLETED";
    }

    function isCompletedTest(test) {
        return test && Number.isFinite(test.score);
    }

    async function loadAllData() {
        const [subjects, tasks, revisions, tests, plans, studySummary, pomodoro] = await Promise.all([
            fetchJson(ENDPOINTS.subjects, "subjects"),
            fetchJson(ENDPOINTS.tasks, "tasks"),
            fetchJson(ENDPOINTS.revisions, "revisions"),
            fetchJson(ENDPOINTS.tests, "tests"),
            fetchJson(ENDPOINTS.plans, "plans"),
            fetchJson(ENDPOINTS.studySummary, null),
            fetchJson(ENDPOINTS.pomodoro, "sessions")
        ]);

        store.subjects = (subjects || []).map(normalizeSubject).filter((item) => item.name);
        store.tasks = (tasks || []).map(normalizeTask);
        store.revisions = (revisions || []).map(normalizeRevision);
        store.tests = (tests || []).map(normalizeTest);
        store.plans = (plans || []).map(normalizePlan);
        store.studySummary = studySummary || null;
        store.pomodoro = (pomodoro || []).map(normalizePomodoro);
        store.loaded = true;
    }

    function filterByRange(list, dateKey, rangeValue) {
        return list.filter((item) => isInSelectedRange(item[dateKey], rangeValue));
    }

    function getFilteredData() {
        const range = getSelectedRange();

        return {
            range,
            subjects: store.subjects,
            tasks: filterByRange(store.tasks, "date", range),
            revisions: filterByRange(store.revisions, "date", range),
            tests: filterByRange(store.tests, "date", range),
            plans: filterByRange(store.plans, "date", range),
            pomodoro: filterByRange(store.pomodoro, "date", range)
        };
    }

    function calculateMetrics(data) {
        const completedTasks = data.tasks.filter(isCompleted).length;
        const totalTasks = data.tasks.length;
        const taskCompletion = percent(completedTasks, totalTasks);

        const completedRevisions = data.revisions.filter(isCompleted).length;
        const totalRevisions = data.revisions.length;
        const revisionCompletion = percent(completedRevisions, totalRevisions);

        const scoredTests = data.tests.filter(isCompletedTest);
        const averageTestScore = scoredTests.length
            ? average(scoredTests.map((test) => clamp(Number(test.score), 0, 100)))
            : 0;

        const completedPlans = data.plans.filter(isCompleted).length;
        const totalPlans = data.plans.length;
        const planCompletion = percent(completedPlans, totalPlans);

        const completedPomodoro = data.pomodoro.filter(isCompleted);
        const focusMinutes = completedPomodoro.reduce((sum, session) => sum + safeNumber(session.minutes), 0);
        const focusEfficiency = completedPomodoro.length
            ? clamp(Math.round((focusMinutes / completedPomodoro.length / 25) * 100), 0, 100)
            : 0;

        const activeDays = new Set([
            ...data.tasks.filter(isCompleted).map((item) => item.date),
            ...data.revisions.filter(isCompleted).map((item) => item.date),
            ...data.tests.filter(isCompletedTest).map((item) => item.date),
            ...data.plans.filter(isCompleted).map((item) => item.date),
            ...completedPomodoro.map((item) => item.date)
        ].filter(Boolean));

        const overallStudyProgress = average([
            totalTasks ? taskCompletion : NaN,
            totalRevisions ? revisionCompletion : NaN,
            scoredTests.length ? averageTestScore : NaN,
            totalPlans ? planCompletion : NaN,
            completedPomodoro.length ? focusEfficiency : NaN
        ]);

        const weeklyActiveDays = store.studySummary?.weekly?.activeDays;
        const weeklyConsistency = getSelectedRange() === "This Week" && Number.isFinite(Number(weeklyActiveDays))
            ? clamp(Number(weeklyActiveDays), 0, 7)
            : clamp(activeDays.size, 0, 7);

        return {
            overallStudyProgress,
            averageTestScore,
            completedSessions: completedPomodoro.length,
            weeklyConsistency,
            taskCompletion,
            revisionCompletion,
            planCompletion,
            focusEfficiency,
            focusMinutes,
            totalTasks,
            completedTasks,
            totalRevisions,
            completedRevisions,
            scoredTests: scoredTests.length,
            completedPlans,
            totalPlans,
            activeDays: activeDays.size
        };
    }

    function setText(el, text) {
        if (el) el.textContent = text;
    }

    function ensureNote(cardSelector) {
        const card = document.querySelector(cardSelector);
        const info = card?.querySelector(".asc-info");
        if (!info) return null;

        let note = info.querySelector(".analytics-summary-note");
        if (!note) {
            note = document.createElement("span");
            note.className = "analytics-summary-note";
            info.appendChild(note);
        }

        return note;
    }

    function performanceTone(score) {
        if (score >= 85) return "Excellent";
        if (score >= 70) return "Strong";
        if (score >= 50) return "Improving";
        if (score > 0) return "Needs focus";
        return "No data yet";
    }

    function renderSummary(metrics, subjectInsights) {
        setText(els.overallStudyProgressValue, `${metrics.overallStudyProgress}%`);
        setText(els.averageTestScoreValue, `${metrics.averageTestScore}%`);
        setText(els.completedSessionsValue, `${metrics.completedSessions}`);
        setText(els.weeklyConsistencyValue, `${metrics.weeklyConsistency} Days`);

        const strongest = subjectInsights[0];

        const overallNote = ensureNote(".asc-progress");
        const scoreNote = ensureNote(".asc-score");
        const sessionNote = ensureNote(".asc-sessions");
        const consistencyNote = ensureNote(".asc-consistency");

        if (overallNote) {
            overallNote.textContent = strongest
                ? `${performanceTone(metrics.overallStudyProgress)} · Best subject: ${strongest.subjectName}`
                : "Complete study activity to unlock progress insights";
        }

        if (scoreNote) {
            scoreNote.textContent = metrics.scoredTests
                ? `${metrics.scoredTests} scored test${metrics.scoredTests > 1 ? "s" : ""} included`
                : "No scored test found in this range";
        }

        if (sessionNote) {
            sessionNote.textContent = metrics.completedSessions
                ? `${metrics.focusMinutes} focus minutes tracked`
                : "Start Pomodoro to track focus sessions";
        }

        if (consistencyNote) {
            consistencyNote.textContent = metrics.weeklyConsistency
                ? `${metrics.weeklyConsistency}/7 active days`
                : "No active day recorded yet";
        }
    }

    function setScoreDescription(valueElement, text) {
        const item = valueElement?.closest(".score-stat-item");
        const paragraph = item?.querySelector(".score-stat-info p");
        if (paragraph) paragraph.textContent = text;
    }

    function renderScoreOverview(metrics) {
        setText(els.mockTestsValue, `${metrics.averageTestScore}%`);
        setText(els.revisionAccuracyValue, `${metrics.revisionCompletion}%`);
        setText(els.taskCompletionValue, `${metrics.taskCompletion}%`);
        setText(els.focusEfficiencyValue, `${metrics.focusEfficiency}%`);

        setScoreDescription(
            els.mockTestsValue,
            metrics.scoredTests ? `${metrics.scoredTests} scored test result${metrics.scoredTests > 1 ? "s" : ""}` : "No scored test result available yet"
        );

        setScoreDescription(
            els.revisionAccuracyValue,
            metrics.totalRevisions ? `${metrics.completedRevisions}/${metrics.totalRevisions} revisions completed` : "No revision data in this range"
        );

        setScoreDescription(
            els.taskCompletionValue,
            metrics.totalTasks ? `${metrics.completedTasks}/${metrics.totalTasks} tasks completed` : "No task data in this range"
        );

        setScoreDescription(
            els.focusEfficiencyValue,
            metrics.completedSessions ? `${metrics.focusMinutes} minutes from ${metrics.completedSessions} Pomodoro sessions` : "No Pomodoro focus data yet"
        );
    }

    function createTooltip() {
        let tooltip = document.getElementById("analyticsPremiumTooltip");
        if (tooltip) return tooltip;

        tooltip = document.createElement("div");
        tooltip.id = "analyticsPremiumTooltip";
        tooltip.className = "analytics-premium-tooltip hidden";
        document.body.appendChild(tooltip);
        return tooltip;
    }

    function showTooltip(html, event) {
        const tooltip = createTooltip();
        tooltip.innerHTML = html;
        tooltip.classList.remove("hidden");
        moveTooltip(event);
    }

    function moveTooltip(event) {
        const tooltip = createTooltip();
        const padding = 14;
        const tooltipWidth = tooltip.offsetWidth || 260;
        const tooltipHeight = tooltip.offsetHeight || 120;

        let left = event.clientX + padding;
        let top = event.clientY + padding;

        if (left + tooltipWidth > window.innerWidth - 12) {
            left = event.clientX - tooltipWidth - padding;
        }

        if (top + tooltipHeight > window.innerHeight - 12) {
            top = event.clientY - tooltipHeight - padding;
        }

        tooltip.style.left = `${Math.max(12, left)}px`;
        tooltip.style.top = `${Math.max(12, top)}px`;
    }

    function hideTooltip() {
        createTooltip().classList.add("hidden");
    }

    function chartMeta(type) {
        const dark = isDarkTheme();
        const map = {
            tasks: {
                label: "Tasks",
                icon: "fa-list-check",
                color: "#7c6cff",
                bg: dark ? "rgba(124,108,255,0.18)" : "#f3f0ff",
                text: dark ? "#ede9fe" : "#5b4ef5"
            },
            revisions: {
                label: "Revisions",
                icon: "fa-rotate",
                color: "#3b82f6",
                bg: dark ? "rgba(59,130,246,0.18)" : "#eff6ff",
                text: dark ? "#dbeafe" : "#2563eb"
            },
            plans: {
                label: "Plans",
                icon: "fa-calendar-days",
                color: "#10b981",
                bg: dark ? "rgba(16,185,129,0.18)" : "#ecfdf5",
                text: dark ? "#d1fae5" : "#059669"
            },
            tests: {
                label: "Tests",
                icon: "fa-file-lines",
                color: "#f59e0b",
                bg: dark ? "rgba(245,158,11,0.18)" : "#fff7ed",
                text: dark ? "#fde68a" : "#d97706"
            },
            focus: {
                label: "Focus",
                icon: "fa-stopwatch",
                color: "#ef4444",
                bg: dark ? "rgba(239,68,68,0.17)" : "#fff1f2",
                text: dark ? "#fecaca" : "#dc2626"
            }
        };

        return map[type];
    }

    function buildTrendData() {
        const start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        const days = [];
        const today = todayYmd();

        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const ymd = toYmd(date);

            const tasks = store.tasks.filter((item) => item.date === ymd && isCompleted(item)).length;
            const revisions = store.revisions.filter((item) => item.date === ymd && isCompleted(item)).length;
            const plans = store.plans.filter((item) => item.date === ymd && isCompleted(item)).length;
            const tests = store.tests.filter((item) => item.date === ymd && isCompletedTest(item)).length;
            const focusMinutes = store.pomodoro
                .filter((item) => item.date === ymd && isCompleted(item))
                .reduce((sum, item) => sum + safeNumber(item.minutes), 0);
            const focusBlocks = focusMinutes > 0 ? Math.max(1, Math.round(focusMinutes / 25)) : 0;

            const total = tasks + revisions + plans + tests + focusBlocks;

            days.push({
                date,
                ymd,
                label: dayLabel(date),
                isToday: ymd === today,
                tasks,
                revisions,
                plans,
                tests,
                focus: focusBlocks,
                focusMinutes,
                total
            });
        }

        return days;
    }

    function dominantType(trend) {
        const totals = trend.reduce((acc, day) => {
            acc.tasks += day.tasks;
            acc.revisions += day.revisions;
            acc.plans += day.plans;
            acc.tests += day.tests;
            acc.focus += day.focus;
            return acc;
        }, { tasks: 0, revisions: 0, plans: 0, tests: 0, focus: 0 });

        const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
        if (!top || top[1] <= 0) return "No focus yet";
        return chartMeta(top[0])?.label || "Mixed";
    }

    function ensureHighlightRow() {
        const card = document.querySelector(".progress-chart-card");
        const title = card?.querySelector(".analytics-section-title");
        if (!card || !title) return null;

        let row = document.getElementById("analyticsChartHighlightRow");
        if (!row) {
            row = document.createElement("div");
            row.id = "analyticsChartHighlightRow";
            row.className = "analytics-highlight-chip-row";
            title.insertAdjacentElement("afterend", row);
        }

        return row;
    }

    function ensureMiniInsight() {
        const insight = els.chartInsight;
        if (!insight) return null;

        let mini = document.getElementById("analyticsChartMiniInsight");
        if (!mini) {
            mini = document.createElement("div");
            mini.id = "analyticsChartMiniInsight";
            mini.className = "analytics-mini-insight";
            insight.insertAdjacentElement("beforebegin", mini);
        }

        return mini;
    }

    function renderHighlightChips(trend) {
        const row = ensureHighlightRow();
        if (!row) return;

        const total = trend.reduce((sum, day) => sum + day.total, 0);
        const activeDays = trend.filter((day) => day.total > 0).length;
        const bestDay = trend.reduce((best, day) => day.total > best.total ? day : best, trend[0]);
        const focus = dominantType(trend);

        const chips = [
            { label: "Total", value: total, type: "tasks", icon: "fa-layer-group" },
            { label: "Active Days", value: activeDays, type: "plans", icon: "fa-calendar-check" },
            { label: "Best Day", value: bestDay && bestDay.total > 0 ? bestDay.label : "—", type: "revisions", icon: "fa-trophy" },
            { label: "Main Focus", value: focus, type: "tests", icon: "fa-bullseye" }
        ];

        row.innerHTML = chips.map((chip) => {
            const meta = chartMeta(chip.type);
            return `
                <span class="analytics-highlight-chip" style="background:${meta.bg};color:${meta.text};border-color:${meta.color}22;">
                    <i class="fa-solid ${chip.icon}" style="color:${meta.color};"></i>
                    <span>${escapeHtml(chip.label)}:</span>
                    <strong>${escapeHtml(chip.value)}</strong>
                </span>
            `;
        }).join("");
    }

    function renderTrendChart() {
        if (!els.chartBars) return;

        const trend = buildTrendData();
        const maxValue = Math.max(1, ...trend.flatMap((day) => [day.tasks, day.revisions, day.plans, day.tests, day.focus]));
        const categories = ["tasks", "revisions", "plans", "tests", "focus"];
        const dark = isDarkTheme();

        renderHighlightChips(trend);

        const yAxis = document.querySelector(".chart-y-axis");
        if (yAxis) {
            yAxis.innerHTML = `
                <span>${maxValue}</span>
                <span>${Math.ceil(maxValue / 2)}</span>
                <span>0</span>
            `;
        }

        if (els.chartLabels) {
            els.chartLabels.innerHTML = "";
            els.chartLabels.style.display = "none";
        }

        els.chartBars.innerHTML = trend.map((day) => {
            const tooltipRows = categories.map((type) => {
                const meta = chartMeta(type);
                const value = type === "focus" ? `${day.focusMinutes} min` : day[type];
                return `
                    <div class="apt-row">
                        <span><i class="fa-solid ${meta.icon}" style="color:${meta.color}"></i> ${meta.label}</span>
                        <strong>${value}</strong>
                    </div>
                `;
            }).join("");

            const tooltip = `
                <div class="apt-title">${day.label} • ${day.ymd}</div>
                ${tooltipRows}
                <div class="apt-total">Total activity score: ${day.total}</div>
            `;

            const bars = categories.map((type) => {
                const meta = chartMeta(type);
                const value = day[type];
                const height = value > 0 ? Math.max(22, Math.round((value / maxValue) * 155)) : 7;
                return `
                    <div class="analytics-single-bar-wrap" data-tooltip="${escapeHtml(`<div class='apt-title'>${meta.label}</div><div class='apt-total'>${type === "focus" ? day.focusMinutes + " focus minutes" : value + " completed"}</div>`)}">
                        <span class="analytics-single-bar-value" style="color:${value > 0 ? meta.text : dark ? "#64748b" : "#94a3b8"}">${type === "focus" && day.focusMinutes > 0 ? day.focusMinutes : value || ""}</span>
                        <div class="analytics-single-bar" style="height:${height}px;background:${value > 0 ? `linear-gradient(180deg, ${meta.color}, ${meta.color})` : dark ? "rgba(255,255,255,0.06)" : "#eef2f7"};box-shadow:${value > 0 ? `0 10px 22px ${meta.color}25` : "none"};"></div>
                    </div>
                `;
            }).join("");

            return `
                <div class="analytics-bar-group ${day.isToday ? "today" : ""}" data-tooltip="${escapeHtml(tooltip)}">
                    ${day.isToday ? `<span class="analytics-today-badge">Today</span>` : ""}
                    <div class="analytics-bar-group-head">
                        <span class="analytics-day-total">${day.total}</span>
                    </div>
                    <div class="analytics-bar-group-body">
                        ${day.total > 0 ? bars : `
                            <div class="analytics-group-empty">
                                <span class="analytics-group-empty-icon"><i class="fa-regular fa-bell-slash"></i></span>
                                <span>No activity</span>
                            </div>
                        `}
                    </div>
                    <div class="analytics-day-label">${day.label}</div>
                </div>
            `;
        }).join("");

        bindTooltipEvents();
        renderChartLegend();
        renderChartInsight(trend);
    }

    function renderChartLegend() {
        const legend = document.querySelector(".chart-footer-legend");
        if (!legend) return;

        const items = ["tasks", "revisions", "plans", "tests", "focus"];

        legend.innerHTML = items.map((type) => {
            const meta = chartMeta(type);
            return `
                <div class="chart-legend-item" style="background:${meta.bg};border-color:${meta.color}22;color:${meta.text};">
                    <span class="cfl-dot" style="background:${meta.color};box-shadow:0 0 0 4px ${meta.bg};"></span>
                    <span class="cfl-label" style="color:${meta.text};">${meta.label}</span>
                </div>
            `;
        }).join("");
    }

    function renderChartInsight(trend) {
        if (!els.chartInsight) return;

        const mini = ensureMiniInsight();
        const total = trend.reduce((sum, day) => sum + day.total, 0);
        const activeDays = trend.filter((day) => day.total > 0).length;
        const bestDay = trend.reduce((best, day) => day.total > best.total ? day : best, trend[0]);
        const today = trend.find((day) => day.isToday);
        const focus = dominantType(trend);

        if (total === 0) {
            if (mini) {
                mini.textContent = "This chart tracks tasks, revisions, planner completion, tests, and Pomodoro focus blocks.";
            }
            els.chartInsight.textContent = "No completed activity recorded in the last 7 days. Complete one task, revision, planner item, test, or Pomodoro session to start your analytics trend.";
            return;
        }

        if (mini) {
            mini.textContent = `Your last 7 days show ${performanceTone(Math.round((activeDays / 7) * 100)).toLowerCase()} consistency, with ${focus.toLowerCase()} contributing the most.`;
        }

        let text = `${total} activity points tracked across ${activeDays} active day${activeDays > 1 ? "s" : ""}.`;

        if (bestDay && bestDay.total > 0) {
            text += ` ${bestDay.label} was your strongest day with ${bestDay.total} activity point${bestDay.total > 1 ? "s" : ""}.`;
        }

        if (today && today.total > 0) {
            text += ` Today already has ${today.total} tracked activity point${today.total > 1 ? "s" : ""}.`;
        } else {
            text += " No completed activity is tracked for today yet.";
        }

        els.chartInsight.textContent = text;
    }

    function bindTooltipEvents() {
        document.querySelectorAll("[data-tooltip]").forEach((node) => {
            node.addEventListener("mouseenter", (event) => {
                const html = node.getAttribute("data-tooltip");
                if (html) showTooltip(html, event);
            });

            node.addEventListener("mousemove", moveTooltip);
            node.addEventListener("mouseleave", hideTooltip);
        });
    }

    function getSubjectNames(data) {
        const map = new Map();

        const add = (name) => {
            const display = String(name || "").trim();
            if (!display) return;
            const key = textKey(display);
            if (!map.has(key)) map.set(key, display);
        };

        store.subjects.forEach((subject) => add(subject.name));
        data.tasks.forEach((item) => add(item.subjectName));
        data.revisions.forEach((item) => add(item.subjectName));
        data.tests.forEach((item) => add(item.subjectName));
        data.plans.forEach((item) => add(item.subjectName));
        data.pomodoro.forEach((item) => add(item.subjectName));

        return [...map.values()];
    }

    function buildSubjectInsights(data) {
        const names = getSubjectNames(data);

        const insights = names.map((name) => {
            const key = textKey(name);
            const subject = store.subjects.find((item) => textKey(item.name) === key);

            const tasks = data.tasks.filter((item) => textKey(item.subjectName) === key);
            const revisions = data.revisions.filter((item) => textKey(item.subjectName) === key);
            const tests = data.tests.filter((item) => textKey(item.subjectName) === key);
            const plans = data.plans.filter((item) => textKey(item.subjectName) === key);
            const pomodoro = data.pomodoro.filter((item) => textKey(item.subjectName) === key);

            const taskScore = tasks.length ? percent(tasks.filter(isCompleted).length, tasks.length) : NaN;
            const revisionScore = revisions.length ? percent(revisions.filter(isCompleted).length, revisions.length) : NaN;
            const testScore = tests.filter(isCompletedTest).length
                ? average(tests.filter(isCompletedTest).map((item) => clamp(Number(item.score), 0, 100)))
                : NaN;
            const planScore = plans.length ? percent(plans.filter(isCompleted).length, plans.length) : NaN;
            const focusMinutes = pomodoro.filter(isCompleted).reduce((sum, item) => sum + safeNumber(item.minutes), 0);
            const focusScore = focusMinutes ? clamp(Math.round((focusMinutes / Math.max(25, pomodoro.length * 25)) * 100), 0, 100) : NaN;
            const explicitProgress = subject && subject.progress > 0 ? subject.progress : NaN;

            const finalScore = average([taskScore, revisionScore, testScore, planScore, focusScore, explicitProgress]);
            const activityCount = tasks.length + revisions.length + tests.length + plans.length + pomodoro.length;

            return {
                subjectName: name,
                finalScore,
                activityCount,
                tasks: tasks.length,
                completedTasks: tasks.filter(isCompleted).length,
                revisions: revisions.length,
                completedRevisions: revisions.filter(isCompleted).length,
                tests: tests.length,
                scoredTests: tests.filter(isCompletedTest).length,
                plans: plans.length,
                completedPlans: plans.filter(isCompleted).length,
                focusMinutes
            };
        });

        return insights
            .filter((item) => item.activityCount > 0 || item.finalScore > 0)
            .sort((a, b) => {
                if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
                return b.activityCount - a.activityCount;
            });
    }

    function renderSubjectInsights(insights) {
        if (!els.subjectInsightList) return;

        const strongest = insights[0];
        const weakest = insights.length > 1
            ? [...insights].sort((a, b) => a.finalScore - b.finalScore)[0]
            : null;

        const strongSpan = els.strongestSubjectBadge?.querySelector("span");
        const weakSpan = els.weakestSubjectBadge?.querySelector("span");

        if (strongSpan) {
            strongSpan.textContent = strongest
                ? `Strongest: ${strongest.subjectName} (${strongest.finalScore}%)`
                : "Strongest: —";
        }

        if (weakSpan) {
            weakSpan.textContent = weakest
                ? `Needs Focus: ${weakest.subjectName} (${weakest.finalScore}%)`
                : "Needs Focus: —";
        }

        if (!insights.length) {
            els.subjectInsightList.innerHTML = `
                <div class="analytics-empty-state">
                    <i class="fa-solid fa-book-open"></i>
                    <h4>No subject insight yet</h4>
                    <p>Add tasks, revisions, tests, plans, or Pomodoro sessions to unlock subject-wise analytics.</p>
                </div>
            `;
            return;
        }

        els.subjectInsightList.innerHTML = insights.slice(0, 6).map((item, index) => {
            const isStrongest = index === 0 && insights.length > 1;
            const isWeakest = weakest && item.subjectName === weakest.subjectName && weakest.finalScore < strongest.finalScore;
            const pctClass = item.finalScore >= 70 ? "pct-high" : item.finalScore >= 45 ? "pct-mid" : "pct-low";
            const fill = isStrongest
                ? "linear-gradient(90deg,#10b981,#34d399)"
                : isWeakest
                    ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                    : "linear-gradient(90deg,#6c63ff,#8b7cff)";

            const badge = isStrongest
                ? `<span class="subject-rank-badge rank-top"><i class="fa-solid fa-trophy"></i> Top</span>`
                : isWeakest
                    ? `<span class="subject-rank-badge rank-focus"><i class="fa-solid fa-arrow-trend-up"></i> Focus</span>`
                    : "";

            return `
                <div class="subject-insight-item" data-tooltip="${escapeHtml(`<div class='apt-title'>${item.subjectName}</div><div class='apt-row'><span>Tasks</span><strong>${item.completedTasks}/${item.tasks}</strong></div><div class='apt-row'><span>Revisions</span><strong>${item.completedRevisions}/${item.revisions}</strong></div><div class='apt-row'><span>Plans</span><strong>${item.completedPlans}/${item.plans}</strong></div><div class='apt-row'><span>Tests</span><strong>${item.scoredTests}/${item.tests}</strong></div><div class='apt-total'>Focus: ${item.focusMinutes} min</div>`)}">
                    <div class="subject-insight-top">
                        <div class="subject-title-wrap">
                            <h4>${escapeHtml(item.subjectName)}</h4>
                            ${badge}
                        </div>
                        <span class="insight-pct ${pctClass}">${item.finalScore}%</span>
                    </div>
                    <div class="subject-insight-meta">
                        Tasks ${item.completedTasks}/${item.tasks} · Revisions ${item.completedRevisions}/${item.revisions} · Focus ${item.focusMinutes}m
                    </div>
                    <div class="subject-progress-bar">
                        <div class="subject-progress-fill" style="width:${item.finalScore}%;background:${fill};"></div>
                    </div>
                </div>
            `;
        }).join("");

        bindTooltipEvents();
    }

    function buildRecommendations(data, metrics, insights) {
        const recs = [];
        const overdue = data.tasks.filter((item) => item.status === "OVERDUE").length;
        const pendingTasks = data.tasks.filter((item) => !isCompleted(item)).length;
        const pendingRevisions = data.revisions.filter((item) => !isCompleted(item)).length;
        const upcomingTests = data.tests.filter((item) => !isCompletedTest(item)).length;
        const weakest = insights.length ? [...insights].sort((a, b) => a.finalScore - b.finalScore)[0] : null;
        const strongest = insights[0];

        if (overdue > 0) {
            recs.push({
                type: "warn",
                text: `${overdue} overdue task${overdue > 1 ? "s" : ""} pending hain. Pehle overdue work clear karo.`
            });
        }

        if (weakest && weakest.finalScore < 55) {
            recs.push({
                type: "warn",
                text: `${weakest.subjectName} needs focus. Is subject ke liye 2 Pomodoro sessions aur revision add karo.`
            });
        }

        if (pendingRevisions > 0) {
            recs.push({
                type: "tip",
                text: `${pendingRevisions} revision item${pendingRevisions > 1 ? "s" : ""} pending hain. Daily 20-minute quick revision slot rakho.`
            });
        }

        if (metrics.completedSessions === 0) {
            recs.push({
                type: "tip",
                text: "Pomodoro data abhi empty hai. Study Timer se 1 focus session complete karo to focus analytics improve hogi."
            });
        }

        if (metrics.averageTestScore > 0 && metrics.averageTestScore < 70) {
            recs.push({
                type: "warn",
                text: "Average test score 70% se low hai. Mock test ke mistakes ko revise karo."
            });
        }

        if (upcomingTests > 0) {
            recs.push({
                type: "info",
                text: `${upcomingTests} upcoming test${upcomingTests > 1 ? "s" : ""} found. Test date se pehle revision plan schedule karo.`
            });
        }

        if (pendingTasks > 0 && overdue === 0) {
            recs.push({
                type: "tip",
                text: `${pendingTasks} task${pendingTasks > 1 ? "s" : ""} pending hain. High priority task se start karo.`
            });
        }

        if (strongest && strongest.finalScore >= 80) {
            recs.push({
                type: "success",
                text: `${strongest.subjectName} strong chal raha hai (${strongest.finalScore}%). Is momentum ko maintain rakho.`
            });
        }

        if (!recs.length) {
            recs.push({
                type: "info",
                text: "More activities add karo — tasks, revisions, tests, plans aur Pomodoro sessions — smart recommendations aur accurate hongi."
            });
        }

        return [...new Map(recs.map((item) => [item.text, item])).values()].slice(0, 5);
    }

    function renderRecommendations(recommendations) {
        if (!els.recommendationList) return;

        const config = {
            warn: { icon: "fa-triangle-exclamation", cls: "rec-warn" },
            tip: { icon: "fa-lightbulb", cls: "rec-tip" },
            info: { icon: "fa-circle-info", cls: "rec-info" },
            success: { icon: "fa-circle-check", cls: "rec-success" }
        };

        els.recommendationList.innerHTML = recommendations.map((rec) => {
            const item = config[rec.type] || config.tip;
            return `
                <div class="recommendation-item ${item.cls}">
                    <div class="rec-icon-wrap">
                        <i class="fa-solid ${item.icon}"></i>
                    </div>
                    <span>${escapeHtml(rec.text)}</span>
                </div>
            `;
        }).join("");
    }

    function renderAnalytics() {
        injectPremiumStyles();

        const data = getFilteredData();
        const subjectInsights = buildSubjectInsights(data);
        const metrics = calculateMetrics(data);
        const recommendations = buildRecommendations(data, metrics, subjectInsights);

        renderSummary(metrics, subjectInsights);
        renderScoreOverview(metrics);
        renderTrendChart();
        renderSubjectInsights(subjectInsights);
        renderRecommendations(recommendations);
    }

    function buildExportText() {
        const data = getFilteredData();
        const subjectInsights = buildSubjectInsights(data);
        const metrics = calculateMetrics(data);
        const recommendations = buildRecommendations(data, metrics, subjectInsights);

        const lines = [
            "EduMind AI — Student Analytics Report",
            "----------------------------------------",
            `Range: ${getSelectedRange()}`,
            `Generated: ${new Date().toLocaleString()}`,
            "",
            "SUMMARY",
            `Overall Study Progress: ${metrics.overallStudyProgress}%`,
            `Average Test Score: ${metrics.averageTestScore}%`,
            `Completed Pomodoro Sessions: ${metrics.completedSessions}`,
            `Weekly Consistency: ${metrics.weeklyConsistency} Days`,
            `Focus Minutes: ${metrics.focusMinutes}`,
            "",
            "SCORE OVERVIEW",
            `Task Completion: ${metrics.taskCompletion}%`,
            `Revision Completion: ${metrics.revisionCompletion}%`,
            `Focus Efficiency: ${metrics.focusEfficiency}%`,
            "",
            "SUBJECT INSIGHTS",
            ...(subjectInsights.length
                ? subjectInsights.map((item, index) => `${index + 1}. ${item.subjectName} — ${item.finalScore}% | Focus ${item.focusMinutes}m`)
                : ["No subject insights available."]),
            "",
            "RECOMMENDATIONS",
            ...recommendations.map((item, index) => `${index + 1}. ${item.text}`)
        ];

        return lines.join("\n");
    }

    function exportReport() {
        const blob = new Blob([buildExportText()], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const range = getSelectedRange().toLowerCase().replace(/\s+/g, "-");

        link.href = url;
        link.download = `edumind-analytics-${range}-${todayYmd()}.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function attachProfileDropdown() {
        const profileToggle = document.getElementById("profileMenuToggle");
        const profileDropdown = document.getElementById("dashboardProfileDropdown");

        if (!profileToggle || !profileDropdown) return;

        profileToggle.addEventListener("click", (event) => {
            event.stopPropagation();
            profileDropdown.classList.toggle("hidden");
        });

        profileDropdown.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        document.addEventListener("click", () => {
            profileDropdown.classList.add("hidden");
        });
    }

    function renderProfileInfo() {
        const user = getStoredUser() || {};
        const fullName = user.fullName || user.name || user.username || "Student";
        const firstName = fullName.split(" ")[0] || "Student";
        const role = user.role || user.course || "Student";
        const userId = user.id;

        let avatar = user.profilePhoto || user.avatar || user.photoUrl || "../assets/avatar/default-user.png";
        if (userId) {
            const stored = localStorage.getItem(`edumind_profile_photo_${userId}`);
            if (stored) avatar = stored;
        }

        const nameEl = document.getElementById("analyticsProfileName");
        const roleEl = document.getElementById("analyticsProfileRole");
        const avatarEl = document.getElementById("analyticsProfileAvatar");
        const nameDropEl = document.getElementById("analyticsProfileNameDropdown");

        if (nameEl) nameEl.textContent = firstName;
        if (roleEl) roleEl.textContent = role;
        if (avatarEl) {
            avatarEl.src = avatar;
            avatarEl.alt = fullName;
            avatarEl.onerror = function () {
                avatarEl.src = "../assets/avatar/default-user.png";
            };
        }
        if (nameDropEl) nameDropEl.textContent = fullName;
    }

    function attachThemeObserver() {
        const rerender = () => {
            if (store.loaded) {
                clearTimeout(attachThemeObserver.timer);
                attachThemeObserver.timer = setTimeout(renderAnalytics, 80);
            }
        };

        const observer = new MutationObserver(rerender);

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class", "data-theme"]
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme"]
        });
    }

    function showLoadingState() {
        if (els.chartBars) {
            els.chartBars.innerHTML = `
                <div class="analytics-loading-state">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Loading analytics...</span>
                </div>
            `;
        }
    }

    function injectPremiumStyles() {
        let style = document.getElementById("analyticsPremiumRuntimeStyles");
        if (!style) {
            style = document.createElement("style");
            style.id = "analyticsPremiumRuntimeStyles";
            document.head.appendChild(style);
        }

        style.textContent = `
            .analytics-summary-note {
                display: block;
                margin-top: 6px;
                font-size: 11.5px;
                line-height: 1.5;
                font-weight: 600;
                color: #94a3b8;
            }

            .analytics-highlight-chip-row {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin: 4px 0 16px;
            }

            .analytics-highlight-chip {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                padding: 9px 13px;
                border-radius: 999px;
                border: 1px solid transparent;
                font-size: 12px;
                font-weight: 700;
            }

            .analytics-highlight-chip strong {
                font-weight: 800;
            }

            .analytics-mini-insight {
                margin: 12px 0 10px;
                color: #64748b;
                font-size: 12.5px;
                line-height: 1.65;
                font-weight: 600;
            }

            .chart-placeholder.large,
            body.preview-dark .chart-placeholder.large {
                display: block !important;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                min-height: auto !important;
            }

            .chart-y-axis,
            #chartLabels {
                display: none !important;
            }

            .chart-inner {
                display: block !important;
                width: 100%;
            }

            #chartBars {
                display: grid !important;
                grid-template-columns: repeat(7, minmax(0, 1fr));
                gap: 12px;
                align-items: stretch;
                justify-content: stretch;
                min-height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
            }

            #chartBars::after {
                display: none !important;
            }

            .analytics-bar-group {
                position: relative;
                overflow: hidden;
                min-height: 318px;
                padding: 16px 10px 14px;
                border-radius: 22px;
                background: #ffffff;
                border: 1px solid #e8edf5;
                box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
                transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
            }

            .analytics-bar-group:hover {
                transform: translateY(-3px);
                box-shadow: 0 18px 34px rgba(15, 23, 42, 0.11);
                border-color: rgba(108, 99, 255, 0.26);
            }

            .analytics-bar-group.today {
                background: linear-gradient(180deg, #f5f3ff, #eef2ff);
                border: 2px solid #8b7cff;
            }

            .analytics-today-badge {
                position: absolute;
                top: 12px;
                right: 10px;
                z-index: 2;
                padding: 5px 10px;
                border-radius: 999px;
                background: #ede9fe;
                color: #5b4ef5;
                font-size: 10.5px;
                font-weight: 800;
            }

            .analytics-bar-group-head {
                display: flex;
                justify-content: center;
                margin: 12px 0;
            }

            .analytics-day-total {
                min-width: 48px;
                height: 46px;
                padding: 0 14px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: #f3f0ff;
                color: #5b4ef5;
                font-size: 18px;
                font-weight: 800;
            }

            .analytics-bar-group.today .analytics-day-total {
                background: linear-gradient(135deg, #7c6cff, #5b4ef5);
                color: #ffffff;
            }

            .analytics-bar-group-body {
                display: flex;
                align-items: flex-end;
                justify-content: center;
                gap: 7px;
                min-height: 195px;
            }

            .analytics-single-bar-wrap {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                gap: 6px;
            }

            .analytics-single-bar-value {
                min-height: 14px;
                font-size: 11px;
                font-weight: 800;
                line-height: 1;
            }

            .analytics-single-bar {
                width: 100%;
                min-height: 7px;
                border-radius: 10px 10px 6px 6px;
                transition: all .22s ease;
            }

            .analytics-single-bar-wrap:hover .analytics-single-bar {
                transform: translateY(-3px);
                filter: brightness(1.05);
            }

            .analytics-day-label {
                margin-top: 14px;
                text-align: center;
                color: #64748b;
                font-size: 14px;
                font-weight: 800;
            }

            .analytics-group-empty {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 10px;
                color: #94a3b8;
                font-size: 12px;
                font-weight: 700;
                text-align: center;
            }

            .analytics-group-empty-icon {
                width: 38px;
                height: 38px;
                border-radius: 999px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: #f1f5f9;
                color: #94a3b8;
            }

            .chart-footer-legend {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 14px;
                padding-top: 14px;
                border-top: 1px solid #f1f5f9;
            }

            .chart-footer-legend .chart-legend-item {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-radius: 999px;
                border: 1px solid transparent;
            }

            .chart-footer-legend .cfl-label {
                font-size: 12px;
                font-weight: 700;
            }

            .chart-footer-legend .cfl-dot {
                width: 12px !important;
                height: 12px !important;
                border-radius: 999px;
                flex-shrink: 0;
            }

            .analytics-chart-insight {
                margin-top: 12px;
                padding: 13px 15px;
                border-radius: 16px;
                background: linear-gradient(180deg, #f7f7ff, #f3f7ff);
                border: 1px solid #e2e8ff;
                color: #5b6472;
                font-size: 12.5px;
                line-height: 1.7;
                font-weight: 600;
            }

            .subject-title-wrap {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                min-width: 0;
            }

            .subject-rank-badge {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 3px 9px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 800;
            }

            .rank-top {
                background: #ecfdf5;
                color: #047857;
            }

            .rank-focus {
                background: #fff7ed;
                color: #c2410c;
            }

            .subject-insight-meta {
                margin: 2px 0 2px;
                color: #64748b;
                font-size: 12px;
                line-height: 1.6;
                font-weight: 600;
            }

            .analytics-empty-state {
                min-height: 170px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 10px;
                text-align: center;
                padding: 20px 16px;
                border: 1px dashed #dbe3ee;
                border-radius: 16px;
                background: linear-gradient(180deg, #fbfcfe, #f8fafc);
            }

            .analytics-empty-state i {
                width: 44px;
                height: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: #f1f5f9;
                color: #94a3b8;
                font-size: 18px;
            }

            .analytics-empty-state h4 {
                color: #334155;
                font-size: 14px;
                font-weight: 800;
            }

            .analytics-empty-state p {
                max-width: 320px;
                color: #94a3b8;
                font-size: 12.5px;
                line-height: 1.6;
            }

            .analytics-loading-state {
                grid-column: 1 / -1;
                min-height: 220px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                color: #6c63ff;
                font-weight: 700;
            }

            .analytics-premium-tooltip {
                position: fixed;
                z-index: 999999;
                width: max-content;
                max-width: 280px;
                padding: 12px 13px;
                border-radius: 14px;
                background: rgba(15, 23, 42, 0.96);
                color: #f8fafc;
                box-shadow: 0 18px 44px rgba(0,0,0,0.28);
                pointer-events: none;
                font-family: Poppins, sans-serif;
                font-size: 12px;
                line-height: 1.45;
                backdrop-filter: blur(14px);
            }

            .analytics-premium-tooltip.hidden {
                display: none;
            }

            .apt-title {
                font-size: 12.5px;
                font-weight: 800;
                margin-bottom: 8px;
                color: #ffffff;
            }

            .apt-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                margin: 5px 0;
                color: #cbd5e1;
            }

            .apt-row span {
                display: inline-flex;
                align-items: center;
                gap: 7px;
            }

            .apt-row strong,
            .apt-total {
                color: #ffffff;
                font-weight: 800;
            }

            .apt-total {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255,255,255,0.12);
            }

            body.preview-dark .analytics-summary-note,
            body.dark-theme .analytics-summary-note,
            html.dark .analytics-summary-note {
                color: #94a3b8;
            }

            body.preview-dark .analytics-bar-group,
            body.dark-theme .analytics-bar-group,
            html.dark .analytics-bar-group {
                background: #0f172a;
                border-color: rgba(255,255,255,0.08);
                box-shadow: 0 16px 34px rgba(0,0,0,0.28);
            }

            body.preview-dark .analytics-bar-group.today,
            body.dark-theme .analytics-bar-group.today,
            html.dark .analytics-bar-group.today {
                background: linear-gradient(180deg, rgba(108,99,255,0.20), rgba(15,23,42,0.95));
                border-color: rgba(139,124,255,0.78);
            }

            body.preview-dark .analytics-day-total,
            body.dark-theme .analytics-day-total,
            html.dark .analytics-day-total {
                background: rgba(255,255,255,0.08);
                color: #ffffff;
            }

            body.preview-dark .analytics-day-label,
            body.dark-theme .analytics-day-label,
            html.dark .analytics-day-label {
                color: #e2e8f0;
            }

            body.preview-dark .analytics-group-empty-icon,
            body.dark-theme .analytics-group-empty-icon,
            html.dark .analytics-group-empty-icon {
                background: rgba(255,255,255,0.06);
            }

            body.preview-dark .chart-footer-legend,
            body.dark-theme .chart-footer-legend,
            html.dark .chart-footer-legend {
                border-top-color: rgba(255,255,255,0.08);
            }

            body.preview-dark .analytics-chart-insight,
            body.dark-theme .analytics-chart-insight,
            html.dark .analytics-chart-insight {
                background: linear-gradient(180deg, rgba(108,99,255,0.12), rgba(59,130,246,0.08));
                border-color: rgba(108,99,255,0.22);
                color: #cbd5e1;
            }

            body.preview-dark .analytics-mini-insight,
            body.dark-theme .analytics-mini-insight,
            html.dark .analytics-mini-insight,
            body.preview-dark .subject-insight-meta,
            body.dark-theme .subject-insight-meta,
            html.dark .subject-insight-meta {
                color: #94a3b8;
            }

            body.preview-dark .analytics-empty-state,
            body.dark-theme .analytics-empty-state,
            html.dark .analytics-empty-state {
                background: linear-gradient(180deg, #111827, #0f172a);
                border-color: rgba(255,255,255,0.08);
            }

            body.preview-dark .analytics-empty-state h4,
            body.dark-theme .analytics-empty-state h4,
            html.dark .analytics-empty-state h4 {
                color: #f1f5f9;
            }

            body.preview-dark .rank-top,
            body.dark-theme .rank-top,
            html.dark .rank-top {
                background: rgba(16,185,129,0.14);
                color: #34d399;
            }

            body.preview-dark .rank-focus,
            body.dark-theme .rank-focus,
            html.dark .rank-focus {
                background: rgba(245,158,11,0.14);
                color: #fbbf24;
            }

            @media (max-width: 1050px) {
                #chartBars {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 576px) {
                #chartBars {
                    grid-template-columns: 1fr;
                }

                .analytics-bar-group {
                    min-height: 250px;
                }

                .chart-footer-legend .chart-legend-item,
                .analytics-highlight-chip {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
    }

    async function init() {
        const ready = els.overallStudyProgressValue &&
            els.averageTestScoreValue &&
            els.completedSessionsValue &&
            els.weeklyConsistencyValue &&
            els.chartBars;

        if (!ready) return;

        injectPremiumStyles();
        renderProfileInfo();
        attachProfileDropdown();
        attachThemeObserver();
        showLoadingState();

        if (els.filter) {
            els.filter.addEventListener("change", renderAnalytics);
        }

        if (els.exportBtn) {
            els.exportBtn.addEventListener("click", exportReport);
        }

        try {
            await loadAllData();
        } catch (error) {
            console.error("Analytics loading failed:", error);
        }

        renderAnalytics();
    }

    init();
});