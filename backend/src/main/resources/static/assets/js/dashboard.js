document.addEventListener("DOMContentLoaded", function () {
    const dashboardSearchInput = document.getElementById("dashboardSearchInput");
    const dashboardSearchResults = document.getElementById("dashboardSearchResults");
    const dashboardSearchBox = document.getElementById("dashboardSearchBox");

    const notificationToggleBtn = document.getElementById("notificationToggleBtn");
    const dashboardNotificationDropdown = document.getElementById("dashboardNotificationDropdown");

    const dashboardGreetingTitle = document.getElementById("dashboardGreetingTitle");
    const dashboardGreetingSubtitle = document.getElementById("dashboardGreetingSubtitle");
    const dashboardProfileName = document.getElementById("dashboardProfileName");
    const dashboardProfileRole = document.getElementById("dashboardProfileRole");
    const dashboardProfileAvatar = document.getElementById("dashboardProfileAvatar");

    const welcomeInsightPrimary = document.getElementById("welcomeInsightPrimary");
    const welcomeInsightSecondary = document.getElementById("welcomeInsightSecondary");
    const welcomeInsightTertiary = document.getElementById("welcomeInsightTertiary");
    const welcomeBannerSubtitle = document.getElementById("welcomeBannerSubtitle");

    const totalSubjectsCount = document.getElementById("totalSubjectsCount");
    const pendingTasksCount = document.getElementById("pendingTasksCount");
    const completedTasksCount = document.getElementById("completedTasksCount");
    const studyProgressCount = document.getElementById("studyProgressCount");

    const totalSubjectsHint = document.getElementById("totalSubjectsHint");
    const pendingTasksHint = document.getElementById("pendingTasksHint");
    const completedTasksHint = document.getElementById("completedTasksHint");
    const studyProgressHint = document.getElementById("studyProgressHint");

    const subjectProgressList = document.getElementById("subjectProgressList");
    const upcomingScheduleList = document.getElementById("upcomingScheduleList");
    const todayTasksList = document.getElementById("todayTasksList");
    const weeklyOverviewChartBars = document.getElementById("weeklyOverviewChartBars");

    const API_BASE_URL =
        window.location.port === "8080"
            ? ""
            : "http://localhost:8080";

    const ENDPOINTS = {
    subjects: `${API_BASE_URL}/api/subjects`,  // ✅ same as subjects.js
    tasks: `${API_BASE_URL}/api/tasks`,
    plans: `${API_BASE_URL}/api/plans`,
    revisions: `${API_BASE_URL}/api/revisions`,
    tests: `${API_BASE_URL}/api/tests`
};

    const state = {
        user: null,
        subjects: [],
        tasks: [],
        plans: [],
        revisions: [],
        tests: [],
        searchItems: []
    };

    // ─── Utilities ───────────────────────────────────────────────────────────

    function closeDashboardDropdowns() {
        dashboardSearchResults?.classList.add("hidden");
        dashboardNotificationDropdown?.classList.add("hidden");
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getFirstAvailableValue(obj, keys, fallback = "") {
        if (!obj || typeof obj !== "object") return fallback;
        for (const key of keys) {
            const value = obj[key];
            if (value !== undefined && value !== null && value !== "") return value;
        }
        return fallback;
    }

    function getArrayFromResponse(response) {
        if (Array.isArray(response)) return response;
        if (!response || typeof response !== "object") return [];
        const possibleKeys = ["data", "content", "items", "results", "list", "subjects", "tasks", "plans", "revisions", "tests"];
        for (const key of possibleKeys) {
            if (Array.isArray(response[key])) return response[key];
        }
        return [];
    }

    function safeNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function normalizeText(value) {
        return String(value ?? "").trim().toLowerCase();
    }

    function parseStoredJson(value) {
        try { return JSON.parse(value); } catch { return null; }
    }

    function getStoredUser() {
        const possibleKeys = ["edumind_logged_in_user", "edumind_registered_user", "loggedInUser", "currentUser", "user", "authUser", "studyPlannerUser"];
        for (const key of possibleKeys) {
            const rawValue = localStorage.getItem(key);
            if (!rawValue) continue;
            const parsed = parseStoredJson(rawValue);
            if (parsed && typeof parsed === "object") return parsed;
        }
        return null;
    }

    function getCurrentUserId() {
        const user = state.user || getStoredUser();
        if (user && user.id != null && user.id !== "") return Number(user.id);
        throw new Error("Logged-in user id not found in localStorage.");
    }

    function buildEndpointUrl(baseUrl) {
    return baseUrl; // JWT token se hi user identify hoga
}

    function getUserDisplayName(user) {
        return getFirstAvailableValue(user, ["fullName", "name", "displayName", "username"], "Student") || "Student";
    }

    function getUserFirstName(user) {
        return getUserDisplayName(user).split(" ")[0] || "Student";
    }

    function getUserRole(user) {
        const role = getFirstAvailableValue(user, ["role", "userRole"], "");
        if (role) return role;
        return getFirstAvailableValue(user, ["course"], "Student") || "Student";
    }

    function getUserAvatar(user) {
        const userId = user && user.id ? user.id : null;
        if (userId) {
            const userSpecificPhoto = localStorage.getItem(`edumind_profile_photo_${userId}`);
            if (userSpecificPhoto && userSpecificPhoto.trim() !== "") return userSpecificPhoto;
        }
        const legacyPhoto = localStorage.getItem("edumind_profile_photo");
        if (legacyPhoto && legacyPhoto.trim() !== "") return legacyPhoto;
        return getFirstAvailableValue(user, ["profilePhoto", "profileImage", "avatar", "imageUrl", "photoUrl"], "../assets/avatar/default-user.png");
    }

    function renderChipText(element, iconClass, text) {
        if (!element) return;
        element.innerHTML = `
            <i class="fa-solid ${iconClass}"></i>
            <span>${escapeHtml(text)}</span>
        `;
    }

    // ─── User Info ───────────────────────────────────────────────────────────

    function renderUserInfo() {
        const user = state.user || getStoredUser();
        const firstName = getUserFirstName(user);
        const fullName = getUserDisplayName(user);
        const role = getUserRole(user);
        const avatar = getUserAvatar(user);

        if (dashboardGreetingTitle) dashboardGreetingTitle.textContent = `Hello, ${firstName} 👋`;
        if (dashboardGreetingSubtitle) dashboardGreetingSubtitle.textContent = "Let's make today productive and well planned.";
        if (dashboardProfileName) dashboardProfileName.textContent = fullName;
        if (dashboardProfileRole) dashboardProfileRole.textContent = role;

        if (dashboardProfileAvatar) {
            dashboardProfileAvatar.src = avatar || "../assets/avatar/default-user.png";
            dashboardProfileAvatar.alt = fullName;
            dashboardProfileAvatar.onerror = function () {
                dashboardProfileAvatar.src = "../assets/avatar/default-user.png";
            };
        }

        const dropdownAvatar = document.getElementById("dashboardProfileAvatarDropdown");
        const dropdownName = document.getElementById("dashboardProfileNameDropdown");
        const dropdownRole = document.getElementById("dashboardProfileRoleDropdown");

        if (dropdownAvatar) {
            dropdownAvatar.src = avatar || "../assets/avatar/default-user.png";
            dropdownAvatar.onerror = function () {
                dropdownAvatar.src = "../assets/avatar/default-user.png";
            };
        }
        if (dropdownName) dropdownName.textContent = fullName;
        if (dropdownRole) dropdownRole.textContent = role;
    }

    // ─── Fetch ───────────────────────────────────────────────────────────────

    async function fetchJson(url) {
    const token = (localStorage.getItem("token") || "").trim();

    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    let responseText = "";
    try {
        responseText = await response.text();
    } catch (error) {
        responseText = "";
    }

    if (!response.ok) {
        throw new Error(responseText || `${url} failed with status ${response.status}`);
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

    async function fetchArray(baseUrl, label) {
    try {
        const response = await fetchJson(baseUrl); // buildEndpointUrl hatao
        return getArrayFromResponse(response);
    } catch (error) {
        console.error(`Failed to load ${label}:`, error);
        return [];
    }
}

    // ─── Date Helpers ─────────────────────────────────────────────────────────

    function isValidDate(date) {
        return date instanceof Date && !Number.isNaN(date.getTime());
    }

    function parseDateValue(value) {
        if (!value) return null;
        if (value instanceof Date) return isValidDate(value) ? value : null;
        if (typeof value === "number") {
            const d = new Date(value);
            return isValidDate(d) ? d : null;
        }
        if (typeof value !== "string") return null;

        const trimmed = value.trim();
        if (!trimmed) return null;

        const date = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
            ? new Date(`${trimmed}T00:00:00`)
            : new Date(trimmed);

        return isValidDate(date) ? date : null;
    }

    function parseItemDate(item) {
        if (!item || typeof item !== "object") return null;

        const directDate = getFirstAvailableValue(
            item,
            ["date", "dueDate", "planDate", "studyDate", "revisionDate", "testDate", "scheduledDate", "scheduleDate", "examDate", "startDate", "createdAt", "updatedAt"],
            null
        );
        const directDateParsed = parseDateValue(directDate);
        if (directDateParsed) return directDateParsed;

        const dateTime = getFirstAvailableValue(item, ["dateTime", "startDateTime", "scheduledAt", "start"], null);
        return parseDateValue(dateTime);
    }

    function getTimeText(item) {
        const startTime = getFirstAvailableValue(item, ["startTime", "fromTime", "time"], "");
        const endTime = getFirstAvailableValue(item, ["endTime", "toTime"], "");
        if (startTime && endTime) return `${startTime} – ${endTime}`;
        if (startTime) return startTime;
        return "";
    }

    function getRelativeDayLabel(date) {
        if (!isValidDate(date)) return "No date";

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.round((targetDay - startOfToday) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";
        if (diffDays === -1) return "Yesterday";

        return targetDay.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }

    function formatChartDayLabel(date) {
        return date.toLocaleDateString("en-US", { weekday: "short" });
    }

    function isSameDay(dateA, dateB) {
        return isValidDate(dateA) && isValidDate(dateB) &&
            dateA.getFullYear() === dateB.getFullYear() &&
            dateA.getMonth() === dateB.getMonth() &&
            dateA.getDate() === dateB.getDate();
    }

    function isFutureOrToday(date) {
        if (!isValidDate(date)) return false;
        const today = new Date();
        const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return targetDay >= currentDay;
    }

    function isWithinNextDays(date, days) {
        if (!isValidDate(date)) return false;
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = new Date(start);
        end.setDate(start.getDate() + days);
        const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return target >= start && target <= end;
    }

    function isWithinLastDays(date, days) {
        if (!isValidDate(date)) return false;
        const today = new Date();
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const start = new Date(end);
        start.setDate(end.getDate() - days);
        const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return target >= start && target <= end;
    }

    // ─── Task Helpers ─────────────────────────────────────────────────────────

    function isTaskCompleted(task) {
        const status = normalizeText(getFirstAvailableValue(task, ["status"], ""));
        return status === "completed" || status === "done";
    }

    function isTaskInProgress(task) {
        const status = normalizeText(getFirstAvailableValue(task, ["status"], ""));
        return status === "in progress" || status === "progress";
    }

    function getTaskBadgeInfo(task) {
        if (isTaskCompleted(task)) return { label: "Done", className: "done" };
        if (isTaskInProgress(task)) return { label: "In Progress", className: "progress" };
        return { label: "Pending", className: "pending" };
    }

    function getTaskTitle(task) {
        return getFirstAvailableValue(task, ["title", "taskTitle", "name"], "Untitled Task");
    }

    function getTaskPriority(task) {
        return getFirstAvailableValue(task, ["priority"], "Normal");
    }

    function getSubjectId(subject) {
        return getFirstAvailableValue(subject, ["id", "subjectId"], "");
    }

    function getSubjectName(subject) {
        return getFirstAvailableValue(subject, ["name", "subjectName", "title"], "Untitled Subject");
    }

    function getTaskSubjectId(task) {
        const directId = getFirstAvailableValue(task, ["subjectId"], "");
        if (directId) return directId;
        if (task.subject && typeof task.subject === "object") {
            return getFirstAvailableValue(task.subject, ["id", "subjectId"], "");
        }
        return "";
    }

    function getTaskSubjectName(task) {
        const directName = getFirstAvailableValue(task, ["subjectName"], "");
        if (directName) return directName;
        if (task.subject && typeof task.subject === "object") return getSubjectName(task.subject);
        return "";
    }

    function tasksForSubject(subject) {
        const subjectId = String(getSubjectId(subject));
        const subjectName = normalizeText(getSubjectName(subject));

        return state.tasks.filter((task) => {
            const taskSubjectId = String(getTaskSubjectId(task));
            const taskSubjectName = normalizeText(getTaskSubjectName(task));

            return (subjectId && taskSubjectId && subjectId === taskSubjectId) ||
                   (subjectName && taskSubjectName && subjectName === taskSubjectName);
        });
    }

    function computeSubjectProgress(subject) {
        const explicitProgress = safeNumber(
            getFirstAvailableValue(subject, ["progress", "completionPercentage", "coverage", "studyProgress"], null),
            NaN
        );

        if (Number.isFinite(explicitProgress)) {
            return clamp(Math.round(explicitProgress), 0, 100);
        }

        const relatedTasks = tasksForSubject(subject);
        if (!relatedTasks.length) return 0;

        const completedCount = relatedTasks.filter(isTaskCompleted).length;
        return clamp(Math.round((completedCount / relatedTasks.length) * 100), 0, 100);
    }

    function getProgressStatusLabel(progress) {
        if (progress >= 75) return "Excellent momentum";
        if (progress >= 50) return "Steady progress";
        if (progress >= 25) return "Building consistency";
        return "Needs stronger focus";
    }

    // ─── Welcome Banner Insights ─────────────────────────────────────────────

    function renderWelcomeBannerInsights() {
        const today = new Date();

        const pendingToday = state.tasks.filter((task) => {
            const date = parseItemDate(task);
            return date && isSameDay(date, today) && !isTaskCompleted(task);
        });

        const upcomingRevision = state.revisions.find((item) => {
            const d = parseItemDate(item);
            return d && isWithinNextDays(d, 2);
        });

        const upcomingTest = state.tests.find((item) => {
            const d = parseItemDate(item);
            return d && isWithinNextDays(d, 3);
        });

        const incompleteTasks = state.tasks.filter((task) => !isTaskCompleted(task));
        const strongestSubject = state.subjects.length
            ? state.subjects
                .map((subject) => ({
                    name: getSubjectName(subject),
                    progress: computeSubjectProgress(subject)
                }))
                .sort((a, b) => b.progress - a.progress)[0]
            : null;

        const subtitleText = pendingToday.length > 0
            ? `You have ${pendingToday.length} task${pendingToday.length > 1 ? "s" : ""} to handle today.`
            : incompleteTasks.length > 0
                ? `You are doing well — focus on your next pending study actions.`
                : `You are all caught up. Use today to revise and strengthen weak areas.`;

        if (welcomeBannerSubtitle) {
            welcomeBannerSubtitle.textContent = subtitleText;
        }

        if (pendingToday.length > 0) {
            renderChipText(
                welcomeInsightPrimary,
                "fa-list-check",
                `${pendingToday.length} task${pendingToday.length > 1 ? "s" : ""} pending today`
            );
        } else {
            renderChipText(
                welcomeInsightPrimary,
                "fa-circle-check",
                "No pending tasks due today"
            );
        }

        if (strongestSubject && strongestSubject.progress > 0) {
            renderChipText(
                welcomeInsightSecondary,
                "fa-trophy",
                `Strongest subject: ${strongestSubject.name} at ${strongestSubject.progress}%`
            );
        } else {
            renderChipText(
                welcomeInsightSecondary,
                "fa-book-open",
                "Start building subject progress with your first completed task"
            );
        }

        if (upcomingTest) {
            const testName = getFirstAvailableValue(upcomingTest, ["title", "testName", "name", "subjectName"], "Upcoming test");
            renderChipText(
                welcomeInsightTertiary,
                "fa-file-lines",
                `${testName} is ${getRelativeDayLabel(parseItemDate(upcomingTest)).toLowerCase()}`
            );
        } else if (upcomingRevision) {
            const revisionName = getFirstAvailableValue(upcomingRevision, ["title", "topic", "name"], "Revision session");
            renderChipText(
                welcomeInsightTertiary,
                "fa-rotate",
                `${revisionName} is coming up ${getRelativeDayLabel(parseItemDate(upcomingRevision)).toLowerCase()}`
            );
        } else {
            renderChipText(
                welcomeInsightTertiary,
                "fa-bolt",
                "No urgent test or revision alert right now"
            );
        }
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    function renderStats() {
        const tasks = state.tasks;
        const pendingTasks = tasks.filter((t) => !isTaskCompleted(t));
        const completedTasks = tasks.filter(isTaskCompleted);
        const totalTasks = tasks.length;
        const studyProgress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

        const today = new Date();
        const pendingToday = pendingTasks.filter((task) => {
            const d = parseItemDate(task);
            return d && isSameDay(d, today);
        }).length;

        const upcomingPending = pendingTasks.filter((task) => {
            const d = parseItemDate(task);
            return d && isWithinNextDays(d, 3);
        }).length;

        const recentlyCompleted = completedTasks.filter((task) => {
            const d = parseItemDate(task);
            return d && isWithinLastDays(d, 7);
        }).length;

        const subjectsWithProgress = state.subjects.map((subject) => ({
            name: getSubjectName(subject),
            progress: computeSubjectProgress(subject)
        })).sort((a, b) => b.progress - a.progress);

        const strongestSubject = subjectsWithProgress[0];

        if (totalSubjectsCount) totalSubjectsCount.textContent = String(state.subjects.length).padStart(2, "0");
        if (pendingTasksCount) pendingTasksCount.textContent = String(pendingTasks.length).padStart(2, "0");
        if (completedTasksCount) completedTasksCount.textContent = String(completedTasks.length).padStart(2, "0");
        if (studyProgressCount) studyProgressCount.textContent = `${studyProgress}%`;

        if (totalSubjectsHint) {
            totalSubjectsHint.textContent = state.subjects.length === 0
                ? "Start by adding your first study subject."
                : strongestSubject && strongestSubject.progress > 0
                    ? `Top subject: ${strongestSubject.name} at ${strongestSubject.progress}%`
                    : `${state.subjects.length} subject${state.subjects.length > 1 ? "s" : ""} ready to track`;
        }

        if (pendingTasksHint) {
            pendingTasksHint.textContent = pendingTasks.length === 0
                ? "All clear — no pending tasks right now."
                : pendingToday > 0
                    ? `${pendingToday} due today${upcomingPending > pendingToday ? ` · ${upcomingPending} due soon` : ""}`
                    : `${upcomingPending > 0 ? `${upcomingPending} due soon` : "Plan your next completion push"}`;
        }

        if (completedTasksHint) {
            completedTasksHint.textContent = completedTasks.length === 0
                ? "No completed tasks yet — start with one win."
                : recentlyCompleted > 0
                    ? `${recentlyCompleted} completed in the recent study window`
                    : `${completedTasks.length} completed overall`;
        }

        if (studyProgressHint) {
            studyProgressHint.textContent = totalTasks === 0
                ? "Add tasks to unlock progress tracking."
                : `${getProgressStatusLabel(studyProgress)} · ${completedTasks.length}/${totalTasks} tasks done`;
        }
    }

    // ─── Smart Insights Strip ─────────────────────────────────────────────────

    function renderSmartInsights() {
        const insightsContainer = document.getElementById("smartInsightsStrip");
        if (!insightsContainer) return;

        const insights = buildInsights();

        if (!insights.length) {
            insightsContainer.innerHTML = "";
            return;
        }

        insightsContainer.innerHTML = insights.map((insight) => `
            <div class="insight-chip insight-${insight.type}">
                <div class="insight-chip-icon">
                    <i class="fa-solid ${insight.icon}"></i>
                </div>
                <div class="insight-chip-body">
                    <span class="insight-chip-label">${escapeHtml(insight.label)}</span>
                    <span class="insight-chip-value">${escapeHtml(insight.value)}</span>
                </div>
            </div>
        `).join("");
    }

    function buildInsights() {
        const insights = [];
        const today = new Date();

        if (state.subjects.length > 0) {
            const subjectsWithProgress = state.subjects.map((s) => ({
                name: getSubjectName(s),
                progress: computeSubjectProgress(s)
            }));

            const strongest = subjectsWithProgress.reduce((a, b) => a.progress >= b.progress ? a : b);
            const weakest = subjectsWithProgress.reduce((a, b) => a.progress <= b.progress ? a : b);

            if (strongest.progress > 0) {
                insights.push({
                    type: "strong",
                    icon: "fa-trophy",
                    label: "Strongest Subject",
                    value: `${strongest.name} — ${strongest.progress}%`
                });
            }

            if (weakest.name !== strongest.name || subjectsWithProgress.length === 1) {
                insights.push({
                    type: "weak",
                    icon: "fa-triangle-exclamation",
                    label: "Needs Attention",
                    value: `${weakest.name} — ${weakest.progress}%`
                });
            }
        }

        const todayPending = state.tasks.filter((t) => {
            const d = parseItemDate(t);
            return d && isSameDay(d, today) && !isTaskCompleted(t);
        }).length;

        if (todayPending > 0) {
            insights.push({
                type: "pending",
                icon: "fa-hourglass-half",
                label: "Due Today",
                value: `${todayPending} task${todayPending > 1 ? "s" : ""} pending`
            });
        }

        const nearTest = state.tests.find((t) => {
            const d = parseItemDate(t);
            return d && isWithinNextDays(d, 3);
        });

        if (nearTest) {
            const testName = getFirstAvailableValue(nearTest, ["title", "testName", "name", "subjectName"], "Test");
            const testDate = parseItemDate(nearTest);
            const dayLabel = getRelativeDayLabel(testDate);

            insights.push({
                type: "test",
                icon: "fa-file-lines",
                label: "Upcoming Test",
                value: `${testName} — ${dayLabel}`
            });
        }

        const nearRevision = state.revisions.find((r) => {
            const d = parseItemDate(r);
            return d && isWithinNextDays(d, 2);
        });

        if (nearRevision) {
            const revName = getFirstAvailableValue(nearRevision, ["title", "topic", "name"], "Revision");
            insights.push({
                type: "revision",
                icon: "fa-rotate",
                label: "Revision Due",
                value: `${revName} coming up`
            });
        }

        return insights.slice(0, 4);
    }

    // ─── Subject Progress ─────────────────────────────────────────────────────

    function renderSubjectProgress() {
        if (!subjectProgressList) return;

        if (!state.subjects.length) {
            subjectProgressList.innerHTML = `
                <div class="subject-progress-item">
                    <div class="subject-row">
                        <span>No subjects added yet</span>
                        <span class="progress-pct pct-low">0%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%;"></div>
                    </div>
                </div>
            `;
            return;
        }

        const subjectsWithProgress = state.subjects.map((subject) => ({
            subject,
            name: getSubjectName(subject),
            progress: computeSubjectProgress(subject)
        }));

        const sorted = [...subjectsWithProgress].sort((a, b) => b.progress - a.progress);
        const topProgress = sorted[0]?.progress ?? 0;
        const lowProgress = sorted[sorted.length - 1]?.progress ?? 0;

        const items = subjectsWithProgress.slice(0, 5).map(({ name, progress }) => {
            const pctClass = progress >= 70 ? "pct-high" : progress >= 45 ? "pct-mid" : "pct-low";
            const isStrongest = progress === topProgress && topProgress > 0 && subjectsWithProgress.length > 1;
            const isWeakest = progress === lowProgress && subjectsWithProgress.length > 1 && progress < topProgress;

            let badgeHtml = "";
            if (isStrongest) {
                badgeHtml = `<span class="subject-highlight-badge badge-strong"><i class="fa-solid fa-trophy"></i> Top</span>`;
            } else if (isWeakest) {
                badgeHtml = `<span class="subject-highlight-badge badge-weak"><i class="fa-solid fa-arrow-trend-up"></i> Focus</span>`;
            }

            return `
                <div class="subject-progress-item ${isStrongest ? "item-strongest" : ""} ${isWeakest ? "item-weakest" : ""}">
                    <div class="subject-row">
                        <span class="subject-name-text">${escapeHtml(name)}</span>
                        <div class="subject-row-right">
                            ${badgeHtml}
                            <span class="progress-pct ${pctClass}">${progress}%</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${isStrongest ? "fill-strong" : ""} ${isWeakest ? "fill-weak" : ""}" style="width: ${progress}%;"></div>
                    </div>
                </div>
            `;
        }).join("");

        subjectProgressList.innerHTML = items;
    }

    // ─── Upcoming Schedule ────────────────────────────────────────────────────

    function getDayBadgeClass(date) {
        const label = getRelativeDayLabel(date);
        if (label === "Today") return "today-badge";
        if (label === "Tomorrow") return "tomorrow-badge";
        return "later-badge";
    }

    function getItemTypeBadge(type) {
        const map = {
            "Planner": { cls: "type-planner", icon: "fa-calendar-days" },
            "Revision": { cls: "type-revision", icon: "fa-rotate" },
            "Test": { cls: "type-test", icon: "fa-file-lines" },
            "Task": { cls: "type-task", icon: "fa-list-check" }
        };
        return map[type] || { cls: "type-planner", icon: "fa-calendar-days" };
    }

    function buildCombinedUpcomingItems() {
        const items = [];

        state.plans.forEach((plan) => {
            const date = parseItemDate(plan);
            if (!isFutureOrToday(date)) return;
            items.push({
                type: "Planner",
                title: getFirstAvailableValue(plan, ["title", "planTitle", "name", "topic"], "Study Plan"),
                date,
                item: plan,
                timestamp: date.getTime()
            });
        });

        state.revisions.forEach((revision) => {
            const date = parseItemDate(revision);
            if (!isFutureOrToday(date)) return;
            items.push({
                type: "Revision",
                title: getFirstAvailableValue(revision, ["title", "topic", "name"], "Revision Session"),
                date,
                item: revision,
                timestamp: date.getTime()
            });
        });

        state.tests.forEach((test) => {
            const date = parseItemDate(test);
            if (!isFutureOrToday(date)) return;
            items.push({
                type: "Test",
                title: getFirstAvailableValue(test, ["title", "testName", "name", "subjectName"], "Upcoming Test"),
                date,
                item: test,
                timestamp: date.getTime()
            });
        });

        state.tasks.forEach((task) => {
            const date = parseItemDate(task);
            if (!isFutureOrToday(date) || isTaskCompleted(task)) return;
            items.push({
                type: "Task",
                title: getTaskTitle(task),
                date,
                item: { ...task, subjectName: getTaskSubjectName(task) },
                timestamp: date.getTime()
            });
        });

        items.sort((a, b) => a.timestamp - b.timestamp);
        return items.slice(0, 5);
    }

    function renderUpcomingSchedule() {
        if (!upcomingScheduleList) return;

        const upcomingItems = buildCombinedUpcomingItems();

        if (!upcomingItems.length) {
            upcomingScheduleList.innerHTML = `
                <div class="upcoming-item upcoming-empty">
                    <div class="upcoming-icon">
                        <i class="fa-solid fa-calendar-check"></i>
                    </div>
                    <div class="upcoming-info">
                        <h4>No upcoming schedule</h4>
                        <p>Your next plans will appear here.</p>
                    </div>
                </div>
            `;
            return;
        }

        upcomingScheduleList.innerHTML = upcomingItems.map(({ type, title, date, item }) => {
            const dayBadgeClass = getDayBadgeClass(date);
            const dayLabel = getRelativeDayLabel(date);
            const timeText = getTimeText(item);
            const typeBadge = getItemTypeBadge(type);

            return `
                <div class="upcoming-item">
                    <div class="upcoming-icon upcoming-icon-${typeBadge.cls}">
                        <i class="fa-solid ${typeBadge.icon}"></i>
                    </div>
                    <div class="upcoming-info">
                        <h4>${escapeHtml(title)}</h4>
                        <p>
                            <span class="day-badge ${dayBadgeClass}">${escapeHtml(dayLabel)}</span>
                            ${timeText ? `<span class="upcoming-time">${escapeHtml(timeText)}</span>` : ""}
                            <span class="upcoming-type-badge">${escapeHtml(type)}</span>
                        </p>
                    </div>
                </div>
            `;
        }).join("");
    }

    // ─── Today's Tasks ────────────────────────────────────────────────────────

    function renderTodayTasks() {
        if (!todayTasksList) return;

        const today = new Date();
        let todaysTasks = state.tasks.filter((task) => {
            const taskDate = parseItemDate(task);
            return taskDate && isSameDay(taskDate, today);
        });

        if (!todaysTasks.length) {
            todaysTasks = state.tasks.filter((task) => !isTaskCompleted(task)).slice(0, 3);
        } else {
            todaysTasks = todaysTasks.slice(0, 3);
        }

        if (!todaysTasks.length) {
            todayTasksList.innerHTML = `
                <div class="task-item">
                    <div class="task-info">
                        <h4>No tasks for today</h4>
                        <p>You are all caught up for now. 🎉</p>
                    </div>
                    <span class="task-badge done">Clear</span>
                </div>
            `;
            return;
        }

        todayTasksList.innerHTML = todaysTasks.map((task) => {
            const badge = getTaskBadgeInfo(task);
            const dueDate = parseItemDate(task);
            const priority = getTaskPriority(task);
            const subjectName = getTaskSubjectName(task);

            const priorityLower = normalizeText(priority);
            const priorityClass = badge.className === "done"
                ? "priority-done"
                : priorityLower.includes("high")
                    ? "priority-high"
                    : badge.className === "progress"
                        ? "priority-normal"
                        : "priority-low";

            let subtitle = dueDate && isSameDay(dueDate, new Date()) ? "Due today" : getRelativeDayLabel(dueDate);
            if (priority) subtitle += ` • ${priority} Priority`;
            if (subjectName) subtitle += ` • ${subjectName}`;

            return `
                <div class="task-item ${priorityClass}">
                    <div class="task-info">
                        <h4>${escapeHtml(getTaskTitle(task))}</h4>
                        <p>${escapeHtml(subtitle)}</p>
                    </div>
                    <span class="task-badge ${badge.className}">${badge.label}</span>
                </div>
            `;
        }).join("");
    }

    // ─── Weekly Activity Tracker ─────────────────────────────────────────────

    function buildWeeklyActivityCounts() {
        const today = new Date();
        const days = [];

        for (let i = 6; i >= 0; i--) {
            const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            day.setDate(day.getDate() - i);
            days.push(day);
        }

        const counts = days.map((day) => ({
            date: day,
            label: formatChartDayLabel(day),
            count: 0,
            breakdown: { tasks: 0, plans: 0, revisions: 0, tests: 0 }
        }));

        state.tasks.forEach((item) => {
            const d = parseItemDate(item);
            if (!d) return;
            const match = counts.find((entry) => isSameDay(entry.date, d));
            if (match) {
                match.count += 1;
                match.breakdown.tasks += 1;
            }
        });

        state.plans.forEach((item) => {
            const d = parseItemDate(item);
            if (!d) return;
            const match = counts.find((entry) => isSameDay(entry.date, d));
            if (match) {
                match.count += 1;
                match.breakdown.plans += 1;
            }
        });

        state.revisions.forEach((item) => {
            const d = parseItemDate(item);
            if (!d) return;
            const match = counts.find((entry) => isSameDay(entry.date, d));
            if (match) {
                match.count += 1;
                match.breakdown.revisions += 1;
            }
        });

        state.tests.forEach((item) => {
            const d = parseItemDate(item);
            if (!d) return;
            const match = counts.find((entry) => isSameDay(entry.date, d));
            if (match) {
                match.count += 1;
                match.breakdown.tests += 1;
            }
        });

        return counts;
    }

    function getWeeklyActivityCategories(item) {
        return [
            {
                key: "tasks",
                label: "Tasks",
                className: "task",
                count: item.breakdown.tasks
            },
            {
                key: "plans",
                label: "Planner",
                className: "plan",
                count: item.breakdown.plans
            },
            {
                key: "revisions",
                label: "Revision",
                className: "revision",
                count: item.breakdown.revisions
            },
            {
                key: "tests",
                label: "Tests",
                className: "test",
                count: item.breakdown.tests
            }
        ].filter((entry) => entry.count > 0);
    }

    function getDominantWeeklyActivityType(counts) {
        const totals = counts.reduce((acc, item) => {
            acc.tasks += item.breakdown.tasks;
            acc.plans += item.breakdown.plans;
            acc.revisions += item.breakdown.revisions;
            acc.tests += item.breakdown.tests;
            return acc;
        }, {
            tasks: 0,
            plans: 0,
            revisions: 0,
            tests: 0
        });

        const labelMap = {
            tasks: "Tasks",
            plans: "Planner",
            revisions: "Revision",
            tests: "Tests"
        };

        const topEntry = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
        if (!topEntry || topEntry[1] <= 0) return "No focus yet";
        return labelMap[topEntry[0]] || "Mixed";
    }

    function buildWeeklyActivityTooltip(item) {
        const categories = getWeeklyActivityCategories(item);

        if (!categories.length) {
            return `${item.label}: No study activity recorded`;
        }

        const breakdownText = categories
            .map((entry) => `${entry.count} ${entry.label}`)
            .join(", ");

        return `${item.label}: ${item.count} activit${item.count > 1 ? "ies" : "y"} — ${breakdownText}`;
    }

    function renderChartSummaryPills(counts) {
        const overviewCard = document.querySelector(".overview-chart-card");
        const chartHeader = overviewCard?.querySelector(".chart-header");
        if (!overviewCard || !chartHeader) return;

        let pillsContainer = document.getElementById("chartSummaryPills");

        if (!pillsContainer) {
            pillsContainer = document.createElement("div");
            pillsContainer.id = "chartSummaryPills";
            pillsContainer.className = "chart-summary-pills";
            chartHeader.insertAdjacentElement("afterend", pillsContainer);
        }

        const totalWeek = counts.reduce((sum, item) => sum + item.count, 0);
        const activeDays = counts.filter((item) => item.count > 0).length;
        const busiestDay = counts.reduce((best, current) => current.count > best.count ? current : best, counts[0]);
        const dominantType = getDominantWeeklyActivityType(counts);

        pillsContainer.innerHTML = `
            <span class="chart-summary-pill">
                <span>Total</span>
                <strong>${totalWeek}</strong>
            </span>
            <span class="chart-summary-pill">
                <span>Active Days</span>
                <strong>${activeDays}</strong>
            </span>
            <span class="chart-summary-pill">
                <span>Best Day</span>
                <strong>${busiestDay && busiestDay.count > 0 ? escapeHtml(busiestDay.label) : "—"}</strong>
            </span>
            <span class="chart-summary-pill">
                <span>Focus</span>
                <strong>${escapeHtml(dominantType)}</strong>
            </span>
        `;
    }

    function renderWeeklyOverviewChart() {
        if (!weeklyOverviewChartBars) return;

        const counts = buildWeeklyActivityCounts();
        const today = new Date();

        renderChartSummaryPills(counts);

        weeklyOverviewChartBars.innerHTML = counts.map((item) => {
            const isToday = isSameDay(item.date, today);
            const isEmpty = item.count === 0;
            const categories = getWeeklyActivityCategories(item);
            const tooltipText = buildWeeklyActivityTooltip(item);

            const cardClasses = [
                "activity-day-card",
                isToday ? "activity-day-card--today" : "",
                isEmpty ? "activity-day-card--empty" : ""
            ].filter(Boolean).join(" ");

            const markerHtml = categories.length
                ? `
                    <div class="activity-marker-list">
                        ${categories.map((entry) => `
                            <div class="activity-marker-item" title="${escapeHtml(`${entry.label}: ${entry.count}`)}">
                                <div class="activity-marker-left">
                                    <span class="activity-marker-dot ${entry.className}"></span>
                                    <span class="activity-marker-label">${escapeHtml(entry.label)}</span>
                                </div>
                                <span class="activity-marker-count ${entry.className}">${entry.count}</span>
                            </div>
                        `).join("")}
                    </div>
                `
                : `
                    <div class="activity-empty-text">
                        <i class="fa-regular fa-bell-slash"></i>
                        <span>No study activity</span>
                    </div>
                `;

            return `
                <div class="${cardClasses}" title="${escapeHtml(tooltipText)}">
                    <div class="activity-day-top">
                        <span class="activity-day-count">${item.count}</span>
                    </div>

                    <div class="activity-day-body">
                        ${markerHtml}
                    </div>

                    <div class="activity-day-footer">
                        <span class="chart-day-label">${escapeHtml(item.label)}</span>
                    </div>
                </div>
            `;
        }).join("");

        renderChartInsight(counts, today);
    }

    function renderChartInsight(counts, today) {
        const insightEl = document.getElementById("chartInsightLine");
        if (!insightEl) return;

        const totalWeek = counts.reduce((sum, item) => sum + item.count, 0);
        const activeDays = counts.filter((item) => item.count > 0).length;
        const todayData = counts.find((item) => isSameDay(item.date, today));
        const todayCount = todayData ? todayData.count : 0;
        const busiestDay = counts.reduce((best, current) => current.count > best.count ? current : best, counts[0]);
        const dominantType = getDominantWeeklyActivityType(counts);

        if (totalWeek === 0) {
            insightEl.textContent = "No study activity recorded in the last 7 days. Add one task, planner item, revision, or test to start building consistency.";
            return;
        }

        let insightText = `Strong weekly snapshot: ${totalWeek} activit${totalWeek > 1 ? "ies" : "y"} across ${activeDays} active day${activeDays > 1 ? "s" : ""}.`;

        if (busiestDay && busiestDay.count > 0) {
            insightText += ` ${busiestDay.label} led the week with ${busiestDay.count} activit${busiestDay.count > 1 ? "ies" : "y"}.`;
        }

        insightText += ` Your main focus was ${dominantType.toLowerCase()}.`;

        if (todayCount > 0) {
            insightText += ` Today already looks productive with ${todayCount} tracked activit${todayCount > 1 ? "ies" : "y"}.`;
        } else {
            insightText += ` No activity is tracked for today yet.`;
        }

        insightEl.textContent = insightText;
    }

    // ─── Search ───────────────────────────────────────────────────────────────

    function buildSearchItems() {
        const items = [];
        state.subjects.forEach((s) => items.push({ type: "Subject", title: getSubjectName(s), icon: "fa-book", href: "subjects.html" }));
        state.tasks.forEach((t) => items.push({ type: "Task", title: getTaskTitle(t), icon: "fa-list-check", href: "tasks.html" }));
        state.plans.forEach((p) => items.push({ type: "Planner", title: getFirstAvailableValue(p, ["title", "planTitle", "name", "topic"], "Study Plan"), icon: "fa-calendar-days", href: "planner.html" }));
        state.revisions.forEach((r) => items.push({ type: "Revision", title: getFirstAvailableValue(r, ["title", "topic", "name"], "Revision"), icon: "fa-rotate", href: "revision.html" }));
        state.tests.forEach((t) => items.push({ type: "Test", title: getFirstAvailableValue(t, ["title", "testName", "name"], "Test"), icon: "fa-file-lines", href: "tests.html" }));
        state.searchItems = items;
    }

    function renderSearchResults(query) {
        if (!dashboardSearchResults) return;
        const searchText = normalizeText(query);
        if (!searchText) {
            dashboardSearchResults.classList.add("hidden");
            return;
        }

        const filteredItems = state.searchItems
            .filter((item) => normalizeText(item.title).includes(searchText))
            .slice(0, 6);

        if (!filteredItems.length) {
            dashboardSearchResults.innerHTML = `
                <div class="search-result-item">
                    <i class="fa-solid fa-circle-info"></i>
                    <div><h4>No results found</h4><p>Try another keyword</p></div>
                </div>
            `;
            dashboardSearchResults.classList.remove("hidden");
            return;
        }

        dashboardSearchResults.innerHTML = filteredItems.map((item) => `
            <div class="search-result-item" data-href="${item.href}">
                <i class="fa-solid ${item.icon}"></i>
                <div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.type)}</p></div>
            </div>
        `).join("");

        dashboardSearchResults.classList.remove("hidden");
    }

    // ─── Notifications ────────────────────────────────────────────────────────

    function buildNotifications() {
        const notifications = [];
        const today = new Date();

        const todayPendingTasks = state.tasks.filter((task) => {
            const date = parseItemDate(task);
            return date && isSameDay(date, today) && !isTaskCompleted(task);
        }).slice(0, 2);

        todayPendingTasks.forEach((task) => {
            notifications.push({
                type: "task",
                icon: "fa-list-check",
                iconClass: "notif-task",
                title: "Task Due Today",
                message: `${getTaskTitle(task)} needs to be completed today.`
            });
        });

        const upcomingRevision = state.revisions.find((r) => {
            const date = parseItemDate(r);
            return date && isWithinNextDays(date, 3);
        });

        if (upcomingRevision) {
            const revName = getFirstAvailableValue(upcomingRevision, ["title", "topic", "name"], "Revision session");
            const revDate = parseItemDate(upcomingRevision);
            notifications.push({
                type: "revision",
                icon: "fa-rotate",
                iconClass: "notif-revision",
                title: "Revision Coming Up",
                message: `${revName} is scheduled ${getRelativeDayLabel(revDate).toLowerCase()}.`
            });
        }

        const upcomingTest = state.tests.find((t) => {
            const date = parseItemDate(t);
            return date && isWithinNextDays(date, 7);
        });

        if (upcomingTest) {
            const testName = getFirstAvailableValue(upcomingTest, ["title", "testName", "name", "subjectName"], "Test");
            const testDate = parseItemDate(upcomingTest);
            notifications.push({
                type: "test",
                icon: "fa-file-lines",
                iconClass: "notif-test",
                title: "Test Approaching",
                message: `${testName} is ${getRelativeDayLabel(testDate).toLowerCase()}. Prepare well!`
            });
        }

        const upcomingPlan = state.plans.find((p) => {
            const date = parseItemDate(p);
            return date && isWithinNextDays(date, 2);
        });

        if (upcomingPlan) {
            const planName = getFirstAvailableValue(upcomingPlan, ["title", "planTitle", "name", "topic"], "Your study plan");
            notifications.push({
                type: "plan",
                icon: "fa-calendar-days",
                iconClass: "notif-plan",
                title: "Study Plan Reminder",
                message: `${planName} is lined up soon. Stay on track!`
            });
        }

        return notifications.slice(0, 4);
    }

    function renderNotifications() {
        if (!dashboardNotificationDropdown) return;

        const notifications = buildNotifications();
        const notifBadge = document.getElementById("notifBadgeDot");

        if (!notifications.length) {
            if (notifBadge) notifBadge.classList.add("hidden");
            dashboardNotificationDropdown.innerHTML = `
                <div class="dropdown-header"><span>Notifications</span></div>
                <div class="notif-empty-state">
                    <i class="fa-solid fa-bell-slash"></i>
                    <p>All caught up! No new alerts.</p>
                </div>
            `;
            return;
        }

        if (notifBadge) notifBadge.classList.remove("hidden");

        dashboardNotificationDropdown.innerHTML = `
            <div class="dropdown-header"><span>Notifications</span><span class="notif-count-badge">${notifications.length}</span></div>
            ${notifications.map((item) => `
                <div class="notification-item">
                    <div class="notif-icon-wrap ${item.iconClass}">
                        <i class="fa-solid ${item.icon}"></i>
                    </div>
                    <div>
                        <h4>${escapeHtml(item.title)}</h4>
                        <p>${escapeHtml(item.message)}</p>
                    </div>
                </div>
            `).join("")}
        `;
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    function attachSearchEvents() {
        if (dashboardSearchInput && dashboardSearchResults && dashboardSearchBox) {
            dashboardSearchInput.addEventListener("input", function () {
                dashboardNotificationDropdown?.classList.add("hidden");
                renderSearchResults(dashboardSearchInput.value.trim());
            });

            dashboardSearchInput.addEventListener("focus", function () {
                dashboardNotificationDropdown?.classList.add("hidden");
                if (dashboardSearchInput.value.trim().length > 0) {
                    renderSearchResults(dashboardSearchInput.value.trim());
                }
            });

            dashboardSearchResults.addEventListener("click", function (event) {
                event.stopPropagation();
                const item = event.target.closest(".search-result-item");
                if (!item) return;
                const href = item.getAttribute("data-href");
                if (href) window.location.href = href;
            });
        }
    }

    function attachNotificationEvents() {
        if (notificationToggleBtn && dashboardNotificationDropdown) {
            notificationToggleBtn.addEventListener("mouseenter", function () {
                closeDashboardDropdowns();
                document.dispatchEvent(new CustomEvent("dashboard:closeProfileMenu"));
                dashboardNotificationDropdown.classList.remove("hidden");
            });

            notificationToggleBtn.addEventListener("mouseleave", function () {
                setTimeout(() => {
                    if (!notificationToggleBtn.matches(":hover") && !dashboardNotificationDropdown.matches(":hover")) {
                        dashboardNotificationDropdown.classList.add("hidden");
                    }
                }, 80);
            });

            dashboardNotificationDropdown.addEventListener("mouseenter", function () {
                dashboardNotificationDropdown.classList.remove("hidden");
            });

            dashboardNotificationDropdown.addEventListener("mouseleave", function () {
                dashboardNotificationDropdown.classList.add("hidden");
            });
        }
    }

    function attachSharedDropdownEvents() {
        dashboardSearchBox?.addEventListener("click", (e) => e.stopPropagation());
        dashboardNotificationDropdown?.addEventListener("click", (e) => e.stopPropagation());
        document.addEventListener("click", closeDashboardDropdowns);
        document.addEventListener("dashboard:closeOtherDropdowns", closeDashboardDropdowns);
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeDashboardDropdowns();
        });
    }

    // ─── Load All ─────────────────────────────────────────────────────────────

    async function loadDashboardData() {
        state.user = getStoredUser();
        renderUserInfo();

        const [subjects, tasks, plans, revisions, tests] = await Promise.all([
            fetchArray(ENDPOINTS.subjects, "subjects"),
            fetchArray(ENDPOINTS.tasks, "tasks"),
            fetchArray(ENDPOINTS.plans, "plans"),
            fetchArray(ENDPOINTS.revisions, "revisions"),
            fetchArray(ENDPOINTS.tests, "tests")
        ]);

        state.subjects = subjects;
        state.tasks = tasks;
        state.plans = plans;
        state.revisions = revisions;
        state.tests = tests;

        renderUserInfo();
        renderWelcomeBannerInsights();
        renderStats();
        renderSmartInsights();
        renderSubjectProgress();
        renderUpcomingSchedule();
        renderTodayTasks();
        renderWeeklyOverviewChart();
        renderNotifications();
        buildSearchItems();

        if (dashboardSearchInput?.value?.trim()) {
            renderSearchResults(dashboardSearchInput.value.trim());
        }
    }

    attachSearchEvents();
    attachNotificationEvents();
    attachSharedDropdownEvents();
    loadDashboardData();

    // ════════════════════════════════════════════
    // STUDY ENGINE — Dashboard Integration
    // ════════════════════════════════════════════

    async function loadStudySummary() {
        try {
            const token = (localStorage.getItem("token") || "").trim();
            if (!token) return;

            const response = await fetch(
                "http://localhost:8080/api/dashboard/study-summary", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            });

            if (!response.ok) return;
            const data = await response.json();
            if (!data) return;

            renderStudyStats(data);
            renderDailyTarget(data.today);
            renderCalendar(data.calendar);
            renderBadges(data.badges);
            renderWeeklyAnalytics(data.weekly);

        } catch (e) {
            console.warn("Study summary not loaded:", e.message);
        }
    }

    function renderStudyStats(data) {
        const today   = data.today   || {};
        const streak  = data.streak  || {};
        const badges  = data.badges  || {};

        const dsStreak   = document.getElementById("dsStreakValue");
        const dsFocus    = document.getElementById("dsFocusValue");
        const dsVideos   = document.getElementById("dsVideosValue");
        const dsSessions = document.getElementById("dsSessionsValue");
        const dsBadges   = document.getElementById("dsBadgesValue");
        const dsBadgesSub = document.getElementById("dsBadgesSub");
        const dsTargetSub = document.getElementById("dsTargetSub");

        if (dsStreak)   dsStreak.textContent   = streak.currentStreak || 0;
        if (dsFocus)    dsFocus.textContent     = today.focusMinutes  || 0;
        if (dsVideos)   dsVideos.textContent    = today.videosCompleted || 0;
        if (dsSessions) dsSessions.textContent  = today.sessionsCompleted || 0;

        if (dsBadges) {
            dsBadges.textContent = badges.unlockedBadges || 0;
        }
        if (dsBadgesSub) {
            dsBadgesSub.textContent =
                `of ${badges.totalBadges || 7} total`;
        }
        if (dsTargetSub) {
            dsTargetSub.textContent =
                `of ${today.targetVideos || 3} target`;
        }
    }

    function renderDailyTarget(today) {
        if (!today) return;

        const fill   = document.getElementById("dsTargetFill");
        const pct    = document.getElementById("dsTargetPct");
        const label  = document.getElementById("dsTargetLabel");
        const status = document.getElementById("dsTargetStatus");

        const done   = today.videosCompleted || 0;
        const target = today.targetVideos    || 3;
        const pctVal = today.progressPercent || 0;

        if (fill)   fill.style.width  = `${pctVal}%`;
        if (pct)    pct.textContent   = `${pctVal}%`;
        if (label)  label.textContent =
            `${done} of ${target} videos completed today`;

        if (status) {
            if (pctVal >= 100) {
                status.textContent   = "🎯 Target Reached!";
                status.style.background = "#ecfdf5";
                status.style.color      = "#047857";
            } else if (pctVal >= 50) {
                status.textContent   = "⚡ Halfway there";
                status.style.background = "#fffbeb";
                status.style.color      = "#d97706";
            } else {
                status.textContent   = "📚 Keep going";
                status.style.background = "#f5f3ff";
                status.style.color      = "#6c63ff";
            }
        }
    }

    function renderCalendar(calendarData) {
        const grid = document.getElementById("dsCalendarGrid");
        if (!grid || !calendarData) return;

        const today = new Date().toISOString().split("T")[0];

        grid.innerHTML = calendarData.map(day => {
            const level = getActivityLevel(day.focusMinutes, day.sessionsCompleted);
            const isToday = day.date === today;

            const tip = day.active
                ? `${day.date}: ${day.focusMinutes}m focus · ` +
                  `${day.videosCompleted} videos · ` +
                  `${day.sessionsCompleted} sessions`
                : `${day.date}: No activity`;

            return `<div
                class="ds-cal-box ds-level-${level} ${isToday ? "today-box" : ""}"
                data-tip="${escapeHtml(tip)}"
                title="${escapeHtml(tip)}">
            </div>`;
        }).join("");
    }

    function getActivityLevel(focusMinutes, sessions) {
        const score = (focusMinutes || 0) + (sessions || 0) * 5;
        if (score === 0)  return 0;
        if (score < 10)   return 1;
        if (score < 30)   return 2;
        if (score < 60)   return 3;
        return 4;
    }

    function renderBadges(badgesData) {
        const grid = document.getElementById("dsBadgesGrid");
        if (!grid || !badgesData) return;

        const list = badgesData.badges || [];
        if (!list.length) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;
                            color:#9ca3af;font-size:13px;padding:16px 0;">
                    No badges yet. Start studying!
                </div>`;
            return;
        }

        grid.innerHTML = list.map(badge => `
            <div class="ds-badge-item ${badge.unlocked ? "unlocked" : "locked"}"
                 title="${escapeHtml(badge.description)}">
                <div class="ds-badge-icon-wrap">
                    <i class="fa-solid ${escapeHtml(badge.icon || "fa-trophy")}"></i>
                </div>
                <div class="ds-badge-info">
                    <div class="ds-badge-name">${escapeHtml(badge.name)}</div>
                    <div class="ds-badge-desc">${escapeHtml(badge.description)}</div>
                    ${badge.unlocked
                        ? `<span class="ds-badge-unlocked-tag">✓ Unlocked</span>`
                        : ""}
                </div>
            </div>
        `).join("");
    }

    function renderWeeklyAnalytics(weekly) {
        if (!weekly) return;

        const focusEl    = document.getElementById("dsWeeklyFocus");
        const videosEl   = document.getElementById("dsWeeklyVideos");
        const sessionsEl = document.getElementById("dsWeeklySessions");
        const daysEl     = document.getElementById("dsWeeklyActiveDays");
        const bestEl     = document.getElementById("dsWeeklyBestDay");

        const mins = weekly.totalFocusMinutes || 0;
        const display = mins >= 60
            ? `${Math.floor(mins/60)}h ${mins%60}m`
            : `${mins} min`;

        if (focusEl)    focusEl.textContent    = display;
        if (videosEl)   videosEl.textContent   = weekly.videosWatched    || 0;
        if (sessionsEl) sessionsEl.textContent = weekly.sessionsCompleted || 0;
        if (daysEl)     daysEl.textContent     = weekly.activeDays        || 0;
        if (bestEl)     bestEl.textContent     = weekly.bestDay           || "—";
    }

    // Call study summary after all other data loads
    loadStudySummary();
});