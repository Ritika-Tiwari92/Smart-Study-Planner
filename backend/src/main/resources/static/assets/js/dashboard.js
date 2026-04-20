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

    const totalSubjectsCount = document.getElementById("totalSubjectsCount");
    const pendingTasksCount = document.getElementById("pendingTasksCount");
    const completedTasksCount = document.getElementById("completedTasksCount");
    const studyProgressCount = document.getElementById("studyProgressCount");

    const subjectProgressList = document.getElementById("subjectProgressList");
    const upcomingScheduleList = document.getElementById("upcomingScheduleList");
    const todayTasksList = document.getElementById("todayTasksList");
    const weeklyOverviewChartBars = document.getElementById("weeklyOverviewChartBars");

    const ENDPOINTS = {
        subjects: "/subjects",
        tasks: "/tasks",
        plans: "/api/plans",
        revisions: "/api/revisions",
        tests: "/api/tests"
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
            if (value !== undefined && value !== null && value !== "") {
                return value;
            }
        }

        return fallback;
    }

    function getArrayFromResponse(response) {
        if (Array.isArray(response)) return response;
        if (!response || typeof response !== "object") return [];

        const possibleKeys = [
            "data",
            "content",
            "items",
            "results",
            "list",
            "subjects",
            "tasks",
            "plans",
            "revisions",
            "tests"
        ];

        for (const key of possibleKeys) {
            if (Array.isArray(response[key])) {
                return response[key];
            }
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
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    function getStoredUser() {
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
    function getUserDisplayName(user) {
    const fullName = getFirstAvailableValue(user, [
        "fullName",
        "name",
        "displayName",
        "username"
    ], "Student");

    return fullName || "Student";
}

    function getUserFirstName(user) {
        const name = getUserDisplayName(user);
        return name.split(" ")[0] || "Student";
    }

    function getUserRole(user) {
    const role = getFirstAvailableValue(user, ["role", "userRole"], "");
    if (role) return role;

    const course = getFirstAvailableValue(user, ["course"], "");
    if (course) return course;

    return "Student";
}

    function getUserAvatar(user) {
    const userId = user && user.id ? user.id : null;

    if (userId) {
        const userSpecificPhoto = localStorage.getItem(`edumind_profile_photo_${userId}`);
        if (userSpecificPhoto && userSpecificPhoto.trim() !== "") {
            return userSpecificPhoto;
        }
    }

    const legacyPhoto = localStorage.getItem("edumind_profile_photo");
    if (legacyPhoto && legacyPhoto.trim() !== "") {
        return legacyPhoto;
    }

    return getFirstAvailableValue(user, [
        "profilePhoto",
        "profileImage",
        "avatar",
        "imageUrl",
        "photoUrl"
    ], "../assets/avatar/default-user.png");
}

    function renderUserInfo() {
        const user = state.user || getStoredUser();
        const firstName = getUserFirstName(user);
        const fullName = getUserDisplayName(user);
        const role = getUserRole(user);
        const avatar = getUserAvatar(user);

        if (dashboardGreetingTitle) {
            dashboardGreetingTitle.textContent = `Hello, ${firstName} 👋`;
        }

        if (dashboardGreetingSubtitle) {
            dashboardGreetingSubtitle.textContent = "Let’s make today productive and well planned.";
        }

        if (dashboardProfileName) {
            dashboardProfileName.textContent = fullName;
        }

        if (dashboardProfileRole) {
            dashboardProfileRole.textContent = role;
        }

        if (dashboardProfileAvatar) {
            dashboardProfileAvatar.src = avatar || "../assets/avatar/default-user.png";
            dashboardProfileAvatar.alt = fullName;
            dashboardProfileAvatar.onerror = function () {
                dashboardProfileAvatar.src = "../assets/avatar/default-user.png";
            };
        }
    }

    async function fetchJson(url) {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`${url} failed with status ${response.status}`);
        }

        return response.json();
    }

    async function fetchArray(url, label) {
        try {
            const response = await fetchJson(url);
            return getArrayFromResponse(response);
        } catch (error) {
            console.error(`Failed to load ${label}:`, error);
            return [];
        }
    }

    function isValidDate(date) {
        return date instanceof Date && !Number.isNaN(date.getTime());
    }

    function parseDateValue(value) {
        if (!value) return null;

        if (value instanceof Date) {
            return isValidDate(value) ? value : null;
        }

        if (typeof value === "number") {
            const date = new Date(value);
            return isValidDate(date) ? date : null;
        }

        if (typeof value !== "string") return null;

        const trimmed = value.trim();
        if (!trimmed) return null;

        let date = null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            date = new Date(`${trimmed}T00:00:00`);
        } else {
            date = new Date(trimmed);
        }

        return isValidDate(date) ? date : null;
    }

    function parseItemDate(item) {
        if (!item || typeof item !== "object") return null;

        const directDate = getFirstAvailableValue(item, [
            "date",
            "dueDate",
            "planDate",
            "studyDate",
            "revisionDate",
            "testDate",
            "scheduledDate",
            "scheduleDate",
            "examDate",
            "startDate",
            "createdAt",
            "updatedAt"
        ], null);

        const directDateParsed = parseDateValue(directDate);
        if (directDateParsed) return directDateParsed;

        const dateTime = getFirstAvailableValue(item, [
            "dateTime",
            "startDateTime",
            "scheduledAt",
            "start"
        ], null);

        return parseDateValue(dateTime);
    }

    function getTimeText(item) {
        const startTime = getFirstAvailableValue(item, [
            "startTime",
            "fromTime",
            "time"
        ], "");

        const endTime = getFirstAvailableValue(item, [
            "endTime",
            "toTime"
        ], "");

        if (startTime && endTime) {
            return `${startTime} to ${endTime}`;
        }

        if (startTime) {
            return startTime;
        }

        return "";
    }

    function getRelativeDayLabel(date) {
        if (!isValidDate(date)) return "No date";

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const diffMs = targetDay - startOfToday;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";
        if (diffDays === -1) return "Yesterday";

        return targetDay.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short"
        });
    }

    function formatChartDayLabel(date) {
        return date.toLocaleDateString("en-US", { weekday: "short" });
    }

    function isSameDay(dateA, dateB) {
        return (
            isValidDate(dateA) &&
            isValidDate(dateB) &&
            dateA.getFullYear() === dateB.getFullYear() &&
            dateA.getMonth() === dateB.getMonth() &&
            dateA.getDate() === dateB.getDate()
        );
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

    function isTaskCompleted(task) {
        const status = normalizeText(getFirstAvailableValue(task, ["status"], ""));
        return status === "completed" || status === "done";
    }

    function isTaskInProgress(task) {
        const status = normalizeText(getFirstAvailableValue(task, ["status"], ""));
        return status === "in progress" || status === "progress";
    }

    function getTaskBadgeInfo(task) {
        if (isTaskCompleted(task)) {
            return { label: "Done", className: "done" };
        }

        if (isTaskInProgress(task)) {
            return { label: "In Progress", className: "progress" };
        }

        return { label: "Pending", className: "pending" };
    }

    function getTaskTitle(task) {
        return getFirstAvailableValue(task, [
            "title",
            "taskTitle",
            "name"
        ], "Untitled Task");
    }

    function getTaskPriority(task) {
        return getFirstAvailableValue(task, ["priority"], "Normal");
    }

    function getSubjectId(subject) {
        return getFirstAvailableValue(subject, ["id", "subjectId"], "");
    }

    function getSubjectName(subject) {
        return getFirstAvailableValue(subject, [
            "name",
            "subjectName",
            "title"
        ], "Untitled Subject");
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

        if (task.subject && typeof task.subject === "object") {
            return getSubjectName(task.subject);
        }

        return "";
    }

    function tasksForSubject(subject) {
        const subjectId = String(getSubjectId(subject));
        const subjectName = normalizeText(getSubjectName(subject));

        return state.tasks.filter((task) => {
            const taskSubjectId = String(getTaskSubjectId(task));
            const taskSubjectName = normalizeText(getTaskSubjectName(task));

            return (
                (subjectId && taskSubjectId && subjectId === taskSubjectId) ||
                (subjectName && taskSubjectName && subjectName === taskSubjectName)
            );
        });
    }

    function computeSubjectProgress(subject) {
        const explicitProgress = safeNumber(
            getFirstAvailableValue(subject, [
                "progress",
                "completionPercentage",
                "coverage",
                "studyProgress"
            ], null),
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

    function renderStats() {
        const subjects = state.subjects;
        const tasks = state.tasks;

        const pendingTasks = tasks.filter((task) => !isTaskCompleted(task)).length;
        const completedTasks = tasks.filter(isTaskCompleted).length;
        const totalTasks = tasks.length;

        const studyProgress = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        if (totalSubjectsCount) {
            totalSubjectsCount.textContent = String(subjects.length).padStart(2, "0");
        }

        if (pendingTasksCount) {
            pendingTasksCount.textContent = String(pendingTasks).padStart(2, "0");
        }

        if (completedTasksCount) {
            completedTasksCount.textContent = String(completedTasks).padStart(2, "0");
        }

        if (studyProgressCount) {
            studyProgressCount.textContent = `${studyProgress}%`;
        }
    }

    function renderSubjectProgress() {
        if (!subjectProgressList) return;

        if (!state.subjects.length) {
            subjectProgressList.innerHTML = `
                <div class="subject-progress-item">
                    <div class="subject-row">
                        <span>No subjects available</span>
                        <span>0%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%;"></div>
                    </div>
                </div>
            `;
            return;
        }

        const subjectItems = state.subjects.slice(0, 4).map((subject) => {
            const name = getSubjectName(subject);
            const progress = computeSubjectProgress(subject);

            return `
                <div class="subject-progress-item">
                    <div class="subject-row">
                        <span>${escapeHtml(name)}</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%;"></div>
                    </div>
                </div>
            `;
        }).join("");

        subjectProgressList.innerHTML = subjectItems;
    }

    function buildCombinedUpcomingItems() {
        const items = [];

        state.plans.forEach((plan) => {
            const date = parseItemDate(plan);
            if (!isFutureOrToday(date)) return;

            items.push({
                type: "Planner",
                title: getFirstAvailableValue(plan, ["title", "planTitle", "name", "topic"], "Study Plan"),
                subtitle: formatUpcomingSubtitle(plan, date),
                icon: "fa-calendar-days",
                timestamp: date.getTime()
            });
        });

        state.revisions.forEach((revision) => {
            const date = parseItemDate(revision);
            if (!isFutureOrToday(date)) return;

            items.push({
                type: "Revision",
                title: getFirstAvailableValue(revision, ["title", "topic", "name"], "Revision Session"),
                subtitle: formatUpcomingSubtitle(revision, date),
                icon: "fa-book-open",
                timestamp: date.getTime()
            });
        });

        state.tests.forEach((test) => {
            const date = parseItemDate(test);
            if (!isFutureOrToday(date)) return;

            items.push({
                type: "Test",
                title: getFirstAvailableValue(test, ["title", "testName", "name", "subjectName"], "Upcoming Test"),
                subtitle: formatUpcomingSubtitle(test, date),
                icon: "fa-file-lines",
                timestamp: date.getTime()
            });
        });

        state.tasks.forEach((task) => {
            const date = parseItemDate(task);
            if (!isFutureOrToday(date) || isTaskCompleted(task)) return;

            items.push({
                type: "Task",
                title: getTaskTitle(task),
                subtitle: formatUpcomingSubtitle(task, date),
                icon: "fa-list-check",
                timestamp: date.getTime()
            });
        });

        items.sort((a, b) => a.timestamp - b.timestamp);
        return items.slice(0, 4);
    }

    function formatUpcomingSubtitle(item, date) {
        const dayLabel = getRelativeDayLabel(date);
        const timeText = getTimeText(item);
        const subjectName = getFirstAvailableValue(item, ["subjectName"], "");

        let subtitle = dayLabel;

        if (timeText) {
            subtitle += ` • ${timeText}`;
        }

        if (subjectName) {
            subtitle += ` • ${subjectName}`;
        }

        return subtitle;
    }

    function renderUpcomingSchedule() {
        if (!upcomingScheduleList) return;

        const upcomingItems = buildCombinedUpcomingItems();

        if (!upcomingItems.length) {
            upcomingScheduleList.innerHTML = `
                <div class="upcoming-item">
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

        upcomingScheduleList.innerHTML = upcomingItems.map((item) => `
            <div class="upcoming-item">
                <div class="upcoming-icon">
                    <i class="fa-solid ${item.icon}"></i>
                </div>
                <div class="upcoming-info">
                    <h4>${escapeHtml(item.title)}</h4>
                    <p>${escapeHtml(item.subtitle)}</p>
                </div>
            </div>
        `).join("");
    }

    function renderTodayTasks() {
        if (!todayTasksList) return;

        const today = new Date();

        let todaysTasks = state.tasks.filter((task) => {
            const taskDate = parseItemDate(task);
            return taskDate && isSameDay(taskDate, today);
        });

        if (!todaysTasks.length) {
            todaysTasks = state.tasks
                .filter((task) => !isTaskCompleted(task))
                .slice(0, 3);
        } else {
            todaysTasks = todaysTasks.slice(0, 3);
        }

        if (!todaysTasks.length) {
            todayTasksList.innerHTML = `
                <div class="task-item">
                    <div class="task-info">
                        <h4>No tasks for today</h4>
                        <p>You are all caught up for now.</p>
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

            let subtitle = dueDate && isSameDay(dueDate, new Date())
                ? "Due today"
                : getRelativeDayLabel(dueDate);

            if (priority) {
                subtitle += ` • ${priority} Priority`;
            }

            if (subjectName) {
                subtitle += ` • ${subjectName}`;
            }

            return `
                <div class="task-item">
                    <div class="task-info">
                        <h4>${escapeHtml(getTaskTitle(task))}</h4>
                        <p>${escapeHtml(subtitle)}</p>
                    </div>
                    <span class="task-badge ${badge.className}">${badge.label}</span>
                </div>
            `;
        }).join("");
    }

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
            count: 0
        }));

        const allItems = [
            ...state.tasks,
            ...state.plans,
            ...state.revisions,
            ...state.tests
        ];

        allItems.forEach((item) => {
            const itemDate = parseItemDate(item);
            if (!itemDate) return;

            const match = counts.find((entry) => isSameDay(entry.date, itemDate));
            if (match) {
                match.count += 1;
            }
        });

        return counts;
    }

    function renderWeeklyOverviewChart() {
        if (!weeklyOverviewChartBars) return;

        const counts = buildWeeklyActivityCounts();
        const maxCount = Math.max(...counts.map((item) => item.count), 0);

        weeklyOverviewChartBars.innerHTML = counts.map((item) => {
            const height = maxCount > 0
                ? Math.max(12, Math.round((item.count / maxCount) * 100))
                : 12;

            return `
                <div class="chart-bar-group">
                    <div class="chart-bar" style="height: ${height}%;" title="${item.count} activities"></div>
                    <span>${escapeHtml(item.label)}</span>
                </div>
            `;
        }).join("");
    }

    function buildSearchItems() {
        const items = [];

        state.subjects.forEach((subject) => {
            items.push({
                type: "Subject",
                title: getSubjectName(subject),
                icon: "fa-book",
                href: "subjects.html"
            });
        });

        state.tasks.forEach((task) => {
            items.push({
                type: "Task",
                title: getTaskTitle(task),
                icon: "fa-list-check",
                href: "tasks.html"
            });
        });

        state.plans.forEach((plan) => {
            items.push({
                type: "Planner",
                title: getFirstAvailableValue(plan, ["title", "planTitle", "name", "topic"], "Study Plan"),
                icon: "fa-calendar-days",
                href: "planner.html"
            });
        });

        state.revisions.forEach((revision) => {
            items.push({
                type: "Revision",
                title: getFirstAvailableValue(revision, ["title", "topic", "name"], "Revision"),
                icon: "fa-rotate",
                href: "revision.html"
            });
        });

        state.tests.forEach((test) => {
            items.push({
                type: "Test",
                title: getFirstAvailableValue(test, ["title", "testName", "name"], "Test"),
                icon: "fa-file-lines",
                href: "tests.html"
            });
        });

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
                    <div>
                        <h4>No results found</h4>
                        <p>Try another keyword</p>
                    </div>
                </div>
            `;
            dashboardSearchResults.classList.remove("hidden");
            return;
        }

        dashboardSearchResults.innerHTML = filteredItems.map((item) => `
            <div class="search-result-item" data-href="${item.href}">
                <i class="fa-solid ${item.icon}"></i>
                <div>
                    <h4>${escapeHtml(item.title)}</h4>
                    <p>${escapeHtml(item.type)}</p>
                </div>
            </div>
        `).join("");

        dashboardSearchResults.classList.remove("hidden");
    }

    function buildNotifications() {
        const notifications = [];

        const today = new Date();

        const todayPendingTasks = state.tasks
            .filter((task) => {
                const date = parseItemDate(task);
                return date && isSameDay(date, today) && !isTaskCompleted(task);
            })
            .slice(0, 2);

        todayPendingTasks.forEach((task) => {
            notifications.push({
                title: "Task Reminder",
                message: `${getTaskTitle(task)} is due today.`
            });
        });

        const upcomingRevision = state.revisions.find((revision) => {
            const date = parseItemDate(revision);
            return date && isWithinNextDays(date, 3);
        });

        if (upcomingRevision) {
            notifications.push({
                title: "Revision Alert",
                message: `${getFirstAvailableValue(upcomingRevision, ["title", "topic", "name"], "Revision session")} is coming up soon.`
            });
        }

        const upcomingTest = state.tests.find((test) => {
            const date = parseItemDate(test);
            return date && isWithinNextDays(date, 7);
        });

        if (upcomingTest) {
            notifications.push({
                title: "Upcoming Test",
                message: `${getFirstAvailableValue(upcomingTest, ["title", "testName", "name"], "Test")} is scheduled soon.`
            });
        }

        const upcomingPlan = state.plans.find((plan) => {
            const date = parseItemDate(plan);
            return date && isWithinNextDays(date, 2);
        });

        if (upcomingPlan) {
            notifications.push({
                title: "Study Plan",
                message: `${getFirstAvailableValue(upcomingPlan, ["title", "planTitle", "name", "topic"], "Your study plan")} is lined up next.`
            });
        }

        return notifications.slice(0, 4);
    }

    function renderNotifications() {
        if (!dashboardNotificationDropdown) return;

        const notifications = buildNotifications();

        if (!notifications.length) {
            dashboardNotificationDropdown.innerHTML = `
                <div class="notification-item">
                    <h4>No new alerts</h4>
                    <p>You are all caught up for now.</p>
                </div>
            `;
            return;
        }

        dashboardNotificationDropdown.innerHTML = notifications.map((item) => `
            <div class="notification-item">
                <h4>${escapeHtml(item.title)}</h4>
                <p>${escapeHtml(item.message)}</p>
            </div>
        `).join("");
    }

    function attachSearchEvents() {
        if (dashboardSearchInput && dashboardSearchResults && dashboardSearchBox) {
            dashboardSearchInput.addEventListener("input", function () {
                const value = dashboardSearchInput.value.trim();

                dashboardNotificationDropdown?.classList.add("hidden");
                renderSearchResults(value);
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
                if (href) {
                    window.location.href = href;
                }
            });
        }
    }

    function attachNotificationEvents() {
        if (notificationToggleBtn && dashboardNotificationDropdown) {
            function showNotificationDropdown() {
                closeDashboardDropdowns();
                document.dispatchEvent(new CustomEvent("dashboard:closeProfileMenu"));
                dashboardNotificationDropdown.classList.remove("hidden");
            }

            function hideNotificationDropdown() {
                dashboardNotificationDropdown.classList.add("hidden");
            }

            notificationToggleBtn.addEventListener("mouseenter", function () {
                showNotificationDropdown();
            });

            notificationToggleBtn.addEventListener("mouseleave", function () {
                setTimeout(() => {
                    const isHoveringButton = notificationToggleBtn.matches(":hover");
                    const isHoveringDropdown = dashboardNotificationDropdown.matches(":hover");

                    if (!isHoveringButton && !isHoveringDropdown) {
                        hideNotificationDropdown();
                    }
                }, 80);
            });

            dashboardNotificationDropdown.addEventListener("mouseenter", function () {
                dashboardNotificationDropdown.classList.remove("hidden");
            });

            dashboardNotificationDropdown.addEventListener("mouseleave", function () {
                hideNotificationDropdown();
            });
        }
    }

    function attachSharedDropdownEvents() {
        if (dashboardSearchBox) {
            dashboardSearchBox.addEventListener("click", function (event) {
                event.stopPropagation();
            });
        }

        if (dashboardNotificationDropdown) {
            dashboardNotificationDropdown.addEventListener("click", function (event) {
                event.stopPropagation();
            });
        }

        document.addEventListener("click", function () {
            closeDashboardDropdowns();
        });

        document.addEventListener("dashboard:closeOtherDropdowns", function () {
            closeDashboardDropdowns();
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeDashboardDropdowns();
            }
        });
    }

    async function loadDashboardData() {
        renderUserInfo();

        const [subjects, tasks, plans, revisions, tests] = await Promise.all([
            fetchArray(ENDPOINTS.subjects, "subjects"),
            fetchArray(ENDPOINTS.tasks, "tasks"),
            fetchArray(ENDPOINTS.plans, "plans"),
            fetchArray(ENDPOINTS.revisions, "revisions"),
            fetchArray(ENDPOINTS.tests, "tests")
        ]);

        state.user = getStoredUser();
        state.subjects = subjects;
        state.tasks = tasks;
        state.plans = plans;
        state.revisions = revisions;
        state.tests = tests;

        renderUserInfo();
        renderStats();
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
});