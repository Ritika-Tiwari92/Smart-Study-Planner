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
const API_BASE_URL =
    window.location.port === "8080"
        ? ""
        : "http://localhost:8080";

const SUBJECTS_API_URL = `${API_BASE_URL}/subjects`;
const TASKS_API_URL = `${API_BASE_URL}/tasks`;
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

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function parseDateOnly(dateValue) {
    if (!dateValue) return null;

    const normalized = String(dateValue).slice(0, 10);
    const parsed = new Date(`${normalized}T00:00:00`);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateToYMD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getTodayString() {
    return formatDateToYMD(new Date());
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

    if (rangeValue === "Overall") {
        return true;
    }

    if (rangeValue === "This Week") {
        return isDateInCurrentWeek(dateValue);
    }

    if (rangeValue === "This Month") {
        return (
            parsed.getFullYear() === today.getFullYear() &&
            parsed.getMonth() === today.getMonth()
        );
    }

    if (rangeValue === "Last 30 Days") {
        const start = new Date();
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return parsed >= start && parsed <= today;
    }

    return true;
}

function getSelectedRange() {
    return analyticsFilterSelect
        ? analyticsFilterSelect.value
        : "This Week";
}


function safePercent(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

function average(numbers) {
    const validNumbers = numbers.filter((item) => Number.isFinite(item));
    if (validNumbers.length === 0) return 0;

    const total = validNumbers.reduce((sum, current) => sum + current, 0);
    return Math.round(total / validNumbers.length);
}

function normalizeSubjectName(subject) {
    if (typeof subject === "string") {
        return subject.trim();
    }

    if (!subject || typeof subject !== "object") {
        return "";
    }

    return String(
        subject.name ??
        subject.subjectName ??
        subject.title ??
        subject.subject ??
        ""
    ).trim();
}

function normalizeTaskStatus(text) {
    const value = String(text || "").toLowerCase().trim();

    if (value === "completed") return "Completed";
    if (value === "in progress") return "In Progress";
    if (value === "overdue") return "Overdue";
    return "Pending";
}

function isPastDate(dateValue) {
    const parsed = parseDateOnly(dateValue);
    if (!parsed) return false;

    const today = parseDateOnly(getTodayString());
    return parsed < today;
}

function getTaskDisplayStatus(rawStatus, dueDate) {
    const normalized = normalizeTaskStatus(rawStatus);

    if (normalized === "Completed") return "Completed";
    if (normalized === "Overdue") return "Overdue";
    if (dueDate && isPastDate(dueDate)) return "Overdue";
    if (normalized === "In Progress") return "In Progress";

    return "Pending";
}

function normalizeTestType(typeText) {
    const value = String(typeText || "").trim().toLowerCase();

    if (value === "upcoming") return "Upcoming";
    if (value === "this week") return "This Week";
    if (value === "mock test" || value === "mock tests") return "Mock Test";
    if (value === "completed") return "Completed";

    return "Upcoming";
}

function normalizePlanStatus(statusText) {
    const value = String(statusText || "").toLowerCase().trim();

    if (value === "done") return "Done";
    if (value === "in progress") return "In Progress";
    return "Pending";
}

function normalizeRevisionTopic(topic) {
    return {
        id: topic?.id ?? null,
        title: String(topic?.title || "").trim(),
        subject: String(topic?.subject || "").trim(),
        priority: String(topic?.priority || "").trim(),
        date: String(topic?.date || topic?.revisionDate || "").trim(),
        status: String(topic?.status || "").trim(),
        description: String(topic?.description || "").trim()
    };
}

function isCompletedRevision(topic) {
    const status = String(topic?.status || "").toLowerCase();
    const priority = String(topic?.priority || "").toLowerCase();

    return status === "completed" || priority === "completed";
}

function isWeakRevision(topic) {
    const status = String(topic?.status || "").toLowerCase();
    const priority = String(topic?.priority || "").toLowerCase();

    return status === "weak topic" || priority === "weak topic";
}

function normalizeTask(task) {
    const subjectName =
        normalizeSubjectName(task?.subject) ||
        String(task?.subjectName || "").trim();

    const dueDate = String(task?.dueDate || "").trim();
    const rawStatus = normalizeTaskStatus(task?.status || task?.displayStatus || "Pending");
    const displayStatus = getTaskDisplayStatus(rawStatus, dueDate);

    return {
        id: task?.id ?? null,
        title: String(task?.title || "").trim(),
        description: String(task?.description || "").trim(),
        dueDate,
        status: rawStatus,
        displayStatus,
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
        subject: String(test?.subject || "").trim(),
        date: String(test?.date || test?.testDate || "").trim(),
        type: normalizeTestType(test?.type || test?.testType || ""),
        duration: String(test?.duration || "").trim(),
        description: String(test?.description || "").trim(),
        score: Number.isFinite(numericScore) ? numericScore : null,
        focusArea: String(test?.focusArea || "").trim(),
        testTip: String(test?.testTip || "").trim()
    };
}

function normalizePlan(plan) {
    return {
        id: plan?.id ?? null,
        title: String(plan?.title || "").trim(),
        subject: String(plan?.subject || "").trim(),
        time: String(plan?.time || "").trim(),
        date: String(plan?.date || "").trim(),
        status: normalizePlanStatus(plan?.status || "Pending"),
        description: String(plan?.description || "").trim()
    };
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Request failed for ${url} with status ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }

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

    const [subjectsResult, tasksResult, revisionsResult, testsResult, plansResult] = results;

    analyticsStore.subjects =
        subjectsResult.status === "fulfilled" && Array.isArray(subjectsResult.value)
            ? subjectsResult.value.map(normalizeSubjectName).filter(Boolean)
            : [];

    analyticsStore.tasks =
        tasksResult.status === "fulfilled" && Array.isArray(tasksResult.value)
            ? tasksResult.value.map(normalizeTask)
            : [];

    analyticsStore.revisions =
        revisionsResult.status === "fulfilled" && Array.isArray(revisionsResult.value)
            ? revisionsResult.value.map(normalizeRevisionTopic)
            : [];

    analyticsStore.tests =
        testsResult.status === "fulfilled" && Array.isArray(testsResult.value)
            ? testsResult.value.map(normalizeTest)
            : [];

    analyticsStore.plans =
        plansResult.status === "fulfilled" && Array.isArray(plansResult.value)
            ? plansResult.value.map(normalizePlan)
            : [];

    results.forEach((result, index) => {
        if (result.status === "rejected") {
            const labels = ["subjects", "tasks", "revisions", "tests", "plans"];
            console.warn(`Analytics load warning: ${labels[index]} data load nahi hua.`, result.reason);
        }
    });
}

function filterTasks(tasks, rangeValue) {
    return tasks.filter((task) =>
        isDateInSelectedRange(task.dueDate, rangeValue)
    );
}

function filterRevisions(revisions, rangeValue) {
    return revisions.filter((revision) =>
        isDateInSelectedRange(revision.date, rangeValue)
    );
}
function filterTests(tests, rangeValue) {
    return tests.filter((test) =>
        isDateInSelectedRange(test.date, rangeValue)
    );
}
function filterPlans(plans, rangeValue) {
    return plans.filter((plan) =>
        isDateInSelectedRange(plan.date, rangeValue)
    );
}
function getFilteredAnalyticsData() {
    const rangeValue = getSelectedRange();

    return {
        rangeValue,
        subjects: analyticsStore.subjects,
        tasks: filterTasks(analyticsStore.tasks, rangeValue),
        revisions: filterRevisions(analyticsStore.revisions, rangeValue),
        tests: filterTests(analyticsStore.tests, rangeValue),
        plans: filterPlans(analyticsStore.plans, rangeValue)
    };
}

function calculateTaskMetrics(tasks) {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.displayStatus === "Completed").length;
    const pending = tasks.filter((task) => task.displayStatus === "Pending").length;
    const overdue = tasks.filter((task) => task.displayStatus === "Overdue").length;

    return {
        total,
        completed,
        pending,
        overdue,
        completionPercent: total > 0 ? safePercent((completed / total) * 100) : 0
    };
}

function calculateRevisionMetrics(revisions) {
    const total = revisions.length;
    const completed = revisions.filter((revision) => isCompletedRevision(revision)).length;
    const weak = revisions.filter((revision) => isWeakRevision(revision)).length;

    return {
        total,
        completed,
        weak,
        completionPercent: total > 0 ? safePercent((completed / total) * 100) : 0
    };
}

function calculateTestMetrics(tests) {
    const completedTestsWithScore = tests.filter(
        (test) => test.type === "Completed" && Number.isFinite(test.score)
    );

    const averageScore = completedTestsWithScore.length > 0
        ? safePercent(
            completedTestsWithScore.reduce((sum, test) => sum + Number(test.score), 0) /
            completedTestsWithScore.length
        )
        : 0;

    const upcomingCount = tests.filter(
        (test) => test.type === "Upcoming" || test.type === "This Week" || test.type === "Mock Test"
    ).length;

    return {
        completedCount: completedTestsWithScore.length,
        averageScore,
        upcomingCount
    };
}

function calculatePlanMetrics(plans) {
    const total = plans.length;
    const done = plans.filter((plan) => plan.status === "Done").length;
    const inProgress = plans.filter((plan) => plan.status === "In Progress").length;
    const currentWeekPlans = plans.filter((plan) => isDateInCurrentWeek(plan.date));
    const currentWeekDone = currentWeekPlans.filter((plan) => plan.status === "Done").length;

    return {
        total,
        done,
        inProgress,
        completionPercent: total > 0 ? safePercent((done / total) * 100) : 0,
        weeklyFocusPercent: currentWeekPlans.length > 0
            ? safePercent((currentWeekDone / currentWeekPlans.length) * 100)
            : 0
    };
}

function calculateOverallStudyProgress(taskMetrics, revisionMetrics, testMetrics, planMetrics) {
    const componentScores = [];

    if (taskMetrics.total > 0) {
        componentScores.push(taskMetrics.completionPercent);
    }

    if (revisionMetrics.total > 0) {
        componentScores.push(revisionMetrics.completionPercent);
    }

    if (testMetrics.completedCount > 0) {
        componentScores.push(testMetrics.averageScore);
    }

    if (planMetrics.total > 0) {
        componentScores.push(planMetrics.completionPercent);
    }

    return componentScores.length > 0 ? average(componentScores) : 0;
}

function calculateWeeklyConsistency(filteredData) {
    const activeDays = new Set();

    filteredData.tasks.forEach((task) => {
        if (isDateInCurrentWeek(task.dueDate)) {
            activeDays.add(task.dueDate);
        }
    });

    filteredData.revisions.forEach((revision) => {
        if (isDateInCurrentWeek(revision.date)) {
            activeDays.add(revision.date);
        }
    });

    filteredData.tests.forEach((test) => {
        if (isDateInCurrentWeek(test.date)) {
            activeDays.add(test.date);
        }
    });

    filteredData.plans.forEach((plan) => {
        if (isDateInCurrentWeek(plan.date)) {
            activeDays.add(plan.date);
        }
    });

    return Math.min(activeDays.size, 7);
}

function updateSummaryCards(metrics) {
    if (overallStudyProgressValue) {
        overallStudyProgressValue.textContent = `${metrics.overallStudyProgress}%`;
    }

    if (averageTestScoreValue) {
        averageTestScoreValue.textContent = `${metrics.averageTestScore}%`;
    }

    if (completedSessionsValue) {
        completedSessionsValue.textContent = String(metrics.completedSessions);
    }

    if (weeklyConsistencyValue) {
        weeklyConsistencyValue.textContent = `${metrics.weeklyConsistency} Days`;
    }
}

function updateScoreOverview(metrics) {
    if (mockTestsValue) {
        mockTestsValue.textContent = `${metrics.averageTestScore}%`;
    }

    if (revisionAccuracyValue) {
        revisionAccuracyValue.textContent = `${metrics.revisionCompletion}%`;
    }

    if (taskCompletionValue) {
        taskCompletionValue.textContent = `${metrics.taskCompletion}%`;
    }

    if (focusEfficiencyValue) {
        focusEfficiencyValue.textContent = `${metrics.focusEfficiency}%`;
    }
}

function buildCurrentWeekTrend(filteredData) {
    const { start } = getWeekRange();
    const days = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);

        const ymd = formatDateToYMD(date);
        const label = date.toLocaleDateString("en-US", { weekday: "short" });

        const completedPlans = filteredData.plans.filter(
            (plan) => plan.date === ymd && plan.status === "Done"
        ).length;

        const completedRevisions = filteredData.revisions.filter(
            (revision) => revision.date === ymd && isCompletedRevision(revision)
        ).length;

        const completedTasks = filteredData.tasks.filter(
            (task) => task.dueDate === ymd && task.displayStatus === "Completed"
        ).length;

        const completedTests = filteredData.tests.filter(
            (test) => test.date === ymd && test.type === "Completed"
        ).length;

        const rawScore =
            (completedPlans * 2) +
            (completedRevisions * 2) +
            (completedTasks * 1.5) +
            (completedTests * 2.5);

        days.push({
            label,
            value: rawScore
        });
    }

    const maxValue = Math.max(...days.map((day) => day.value), 0);

    return days.map((day) => ({
        label: day.label,
        height: maxValue > 0 ? Math.max(12, Math.round((day.value / maxValue) * 100)) : 12
    }));
}

function renderTrendChart(filteredData) {
    if (!chartBarsContainer || !chartLabelsContainer) return;

    const trend = buildCurrentWeekTrend(filteredData);
    const hasRealTrend = trend.some((day) => day.height > 12);

    chartBarsContainer.innerHTML = trend
        .map((day) => {
            const finalHeight = hasRealTrend ? day.height : 6;
            return `<div class="chart-bar" style="height: ${finalHeight}%;"></div>`;
        })
        .join("");

    chartLabelsContainer.innerHTML = trend
        .map((day) => `<span>${escapeHtml(day.label)}</span>`)
        .join("");
}

function getAllSubjectNames(filteredData) {
    const combined = new Set();

    analyticsStore.subjects.forEach((subject) => {
        if (subject) combined.add(subject);
    });

    filteredData.tasks.forEach((task) => {
        if (task.subjectName) combined.add(task.subjectName);
    });

    filteredData.revisions.forEach((revision) => {
        if (revision.subject) combined.add(revision.subject);
    });

    filteredData.tests.forEach((test) => {
        if (test.subject) combined.add(test.subject);
    });

    filteredData.plans.forEach((plan) => {
        if (plan.subject) combined.add(plan.subject);
    });

    return [...combined];
}

function buildSubjectInsights(filteredData) {
    const subjectNames = getAllSubjectNames(filteredData);

    const subjectStats = subjectNames.map((subjectName) => {
        const subjectTasks = filteredData.tasks.filter((task) => task.subjectName === subjectName);
        const subjectRevisions = filteredData.revisions.filter((revision) => revision.subject === subjectName);
        const subjectTests = filteredData.tests.filter((test) => test.subject === subjectName);
        const subjectPlans = filteredData.plans.filter((plan) => plan.subject === subjectName);

        const taskScore = subjectTasks.length > 0
            ? safePercent(
                (subjectTasks.filter((task) => task.displayStatus === "Completed").length / subjectTasks.length) * 100
            )
            : null;

        const revisionScore = subjectRevisions.length > 0
            ? safePercent(
                (subjectRevisions.filter((revision) => isCompletedRevision(revision)).length / subjectRevisions.length) * 100
            )
            : null;

        const completedTestScores = subjectTests
            .filter((test) => test.type === "Completed" && Number.isFinite(test.score))
            .map((test) => Number(test.score));

        const testScore = completedTestScores.length > 0
            ? safePercent(
                completedTestScores.reduce((sum, score) => sum + score, 0) / completedTestScores.length
            )
            : null;

        const planScore = subjectPlans.length > 0
            ? safePercent(
                (subjectPlans.filter((plan) => plan.status === "Done").length / subjectPlans.length) * 100
            )
            : null;

        const finalScore = average(
            [taskScore, revisionScore, testScore, planScore].filter((score) => Number.isFinite(score))
        );

        const activityCount =
            subjectTasks.length +
            subjectRevisions.length +
            subjectTests.length +
            subjectPlans.length;

        const weakRevisionCount = subjectRevisions.filter((revision) => isWeakRevision(revision)).length;

        return {
            subjectName,
            finalScore,
            activityCount,
            weakRevisionCount,
            taskCount: subjectTasks.length,
            revisionCount: subjectRevisions.length,
            testCount: subjectTests.length,
            planCount: subjectPlans.length
        };
    });

    return subjectStats
        .filter((item) => item.activityCount > 0)
        .sort((a, b) => {
            if (b.finalScore !== a.finalScore) {
                return b.finalScore - a.finalScore;
            }
            return b.activityCount - a.activityCount;
        });
}

function renderSubjectInsights(subjectInsights) {
    if (!subjectInsightList) return;

    if (subjectInsights.length === 0) {
        subjectInsightList.innerHTML = `
            <div class="subject-insight-item">
                <div class="subject-insight-top">
                    <h4>No subject data</h4>
                    <span>0%</span>
                </div>
                <div class="subject-progress-bar">
                    <div class="subject-progress-fill" style="width: 0%;"></div>
                </div>
            </div>
        `;
        return;
    }

    subjectInsightList.innerHTML = subjectInsights
        .slice(0, 4)
        .map((item) => `
            <div class="subject-insight-item">
                <div class="subject-insight-top">
                    <h4>${escapeHtml(item.subjectName)}</h4>
                    <span>${item.finalScore}%</span>
                </div>
                <div class="subject-progress-bar">
                    <div class="subject-progress-fill" style="width: ${item.finalScore}%;"></div>
                </div>
            </div>
        `)
        .join("");
}

function generateRecommendations(filteredData, metrics, subjectInsights) {
    const recommendations = [];

    const overdueTasks = filteredData.tasks.filter((task) => task.displayStatus === "Overdue").length;
    const weakRevisions = filteredData.revisions.filter((revision) => isWeakRevision(revision)).length;
    const upcomingTests = filteredData.tests.filter(
        (test) => test.type === "Upcoming" || test.type === "This Week" || test.type === "Mock Test"
    ).length;

    const weakestSubject = [...subjectInsights]
        .sort((a, b) => a.finalScore - b.finalScore)[0];

    const strongestSubject = [...subjectInsights]
        .sort((a, b) => b.finalScore - a.finalScore)[0];

    if (overdueTasks > 0) {
        recommendations.push(`You have ${overdueTasks} overdue task(s). Clear overdue work first to reduce study backlog.`);
    }

    if (weakRevisions > 0) {
        recommendations.push(`You have ${weakRevisions} weak revision topic(s). Revise weak areas before starting new topics.`);
    }

    if (metrics.averageTestScore > 0 && metrics.averageTestScore < 70) {
        recommendations.push("Your average test score is below 70%. Add one extra mock test and revise mistakes before the next exam.");
    }

    if (weakestSubject && weakestSubject.finalScore < 65) {
        recommendations.push(`Focus more on ${weakestSubject.subjectName}. Its current combined performance is the lowest.`);
    }

    if (metrics.focusEfficiency > 0 && metrics.focusEfficiency < 60) {
        recommendations.push("Your focus efficiency is low this week. Try shorter study sessions with fixed breaks.");
    }

    if (upcomingTests > 0) {
        recommendations.push(`You have ${upcomingTests} upcoming/mock test item(s). Plan revision before test dates for better scores.`);
    }

    if (strongestSubject && strongestSubject.finalScore >= 80) {
        recommendations.push(`Maintain your current ${strongestSubject.subjectName} momentum. It is one of your strongest subjects right now.`);
    }

    if (recommendations.length === 0) {
        recommendations.push("Add more study activity in tasks, planner, revision, and tests to unlock smarter analytics insights.");
    }

    return [...new Set(recommendations)].slice(0, 4);
}

function renderRecommendations(recommendations, filteredData) {
    if (!recommendationList) return;

    if (!hasAnyAnalyticsData(filteredData)) {
        recommendationList.innerHTML = `
            <div class="recommendation-item">
                <i class="fa-solid fa-lightbulb"></i>
                <span>Add tasks, plans, revisions, or tests to see smart recommendations here.</span>
            </div>
        `;
        return;
    }

    recommendationList.innerHTML = recommendations
        .map((text) => `
            <div class="recommendation-item">
                <i class="fa-solid fa-lightbulb"></i>
                <span>${escapeHtml(text)}</span>
            </div>
        `)
        .join("");
}
function hasAnyAnalyticsData(filteredData) {
    return (
        filteredData.tasks.length > 0 ||
        filteredData.revisions.length > 0 ||
        filteredData.tests.length > 0 ||
        filteredData.plans.length > 0
    );
}

function getRangeFileLabel(rangeValue) {
    return String(rangeValue || "overall")
        .toLowerCase()
        .replaceAll(" ", "-");
}

function buildMetrics(filteredData) {
    const taskMetrics = calculateTaskMetrics(filteredData.tasks);
    const revisionMetrics = calculateRevisionMetrics(filteredData.revisions);
    const testMetrics = calculateTestMetrics(filteredData.tests);
    const planMetrics = calculatePlanMetrics(filteredData.plans);

    return {
        overallStudyProgress: calculateOverallStudyProgress(
            taskMetrics,
            revisionMetrics,
            testMetrics,
            planMetrics
        ),
        averageTestScore: testMetrics.averageScore,
        completedSessions: planMetrics.done,
        weeklyConsistency: calculateWeeklyConsistency(filteredData),
        taskCompletion: taskMetrics.completionPercent,
        revisionCompletion: revisionMetrics.completionPercent,
        focusEfficiency: planMetrics.weeklyFocusPercent,
        extra: {
            taskMetrics,
            revisionMetrics,
            testMetrics,
            planMetrics
        }
    };
}

function renderAnalytics() {
    const filteredData = getFilteredAnalyticsData();
    const metrics = buildMetrics(filteredData);
    const subjectInsights = buildSubjectInsights(filteredData);
    const recommendations = generateRecommendations(filteredData, metrics, subjectInsights);

    updateSummaryCards(metrics);
    updateScoreOverview(metrics);
    renderTrendChart(filteredData);
    renderSubjectInsights(subjectInsights);
renderRecommendations(recommendations, filteredData);
}

function buildExportText() {
    const filteredData = getFilteredAnalyticsData();
    const metrics = buildMetrics(filteredData);
    const subjectInsights = buildSubjectInsights(filteredData);
    const recommendations = generateRecommendations(filteredData, metrics, subjectInsights);

    const lines = [
        "EduMind AI - Analytics Report",
        "----------------------------------------",
        `Range: ${getSelectedRange()}`,
        `Generated On: ${new Date().toLocaleString()}`,
        "",
        "Summary",
        `Overall Study Progress: ${metrics.overallStudyProgress}%`,
        `Average Test Score: ${metrics.averageTestScore}%`,
        `Completed Sessions: ${metrics.completedSessions}`,
        `Weekly Consistency: ${metrics.weeklyConsistency} Days`,
        "",
        "Score Overview",
        `Mock Tests: ${metrics.averageTestScore}%`,
        `Revision Accuracy: ${metrics.revisionCompletion}%`,
        `Task Completion: ${metrics.taskCompletion}%`,
        `Focus Efficiency: ${metrics.focusEfficiency}%`,
        "",
        "Subject Insights"
    ];

    if (subjectInsights.length === 0) {
        lines.push("No subject analytics data available.");
    } else {
        subjectInsights.slice(0, 6).forEach((item, index) => {
            lines.push(`${index + 1}. ${item.subjectName} - ${item.finalScore}%`);
        });
    }

    lines.push("");
    lines.push("Recommendations");

    recommendations.forEach((text, index) => {
        lines.push(`${index + 1}. ${text}`);
    });

    lines.push("");
    lines.push("Raw Counts");
    lines.push(`Tasks: ${filteredData.tasks.length}`);
    lines.push(`Revisions: ${filteredData.revisions.length}`);
    lines.push(`Tests: ${filteredData.tests.length}`);
    lines.push(`Plans: ${filteredData.plans.length}`);

    return lines.join("\n");
}

function exportAnalyticsReport() {
    const reportText = buildExportText();
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);

    const rangeLabel = getRangeFileLabel(getSelectedRange());
    const dateLabel = formatDateToYMD(new Date());

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `analytics-report-${rangeLabel}-${dateLabel}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(downloadUrl);
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
    if (!pageReady) {
        return;
    }

    if (analyticsSearchInput) {
        analyticsSearchInput.addEventListener("input", renderAnalytics);
    }

    if (analyticsFilterSelect) {
        analyticsFilterSelect.addEventListener("change", renderAnalytics);
    }

    if (exportReportBtn) {
        exportReportBtn.addEventListener("click", exportAnalyticsReport);
    }
    if (analyticsSearchInput) {
    analyticsSearchInput.addEventListener("input", renderAnalytics);
}

    try {
        await loadAllAnalyticsData();
        renderAnalytics();
    } catch (error) {
        console.error("Analytics initialization failed:", error);
        renderAnalytics();
        alert("Analytics data load nahi ho pa raha. Backend connection check karo.");
    }
}

initializeAnalyticsPage();