const openTaskModalBtn = document.getElementById("openTaskModalBtn");
const taskModalOverlay = document.getElementById("taskModalOverlay");
const closeTaskModalBtn = document.getElementById("closeTaskModalBtn");
const cancelTaskModalBtn = document.getElementById("cancelTaskModalBtn");
const taskModalForm = document.getElementById("taskModalForm");
const taskModalTitle = document.getElementById("taskModalTitle");
const taskSaveBtn = document.getElementById("taskSaveBtn");

const tasksList = document.getElementById("tasksList");
const tasksEmptyState = document.getElementById("tasksEmptyState");
const taskSearchInput = document.getElementById("taskSearchInput");
const taskFilterSelect = document.getElementById("taskFilterSelect");

const totalTasksCount = document.getElementById("totalTasksCount");
const pendingTasksCount = document.getElementById("pendingTasksCount");
const completedTasksCount = document.getElementById("completedTasksCount");
const overdueTasksCount = document.getElementById("overdueTasksCount");

const taskTitleInput = document.getElementById("taskTitle");
const taskSubjectInput = document.getElementById("taskSubject");
const taskDateInput = document.getElementById("taskDate");
const taskPriorityInput = document.getElementById("taskPriority");
const taskStatusInput = document.getElementById("taskStatus");
const taskDescriptionInput = document.getElementById("taskDescription");

const smartFocusTitle = document.getElementById("smartFocusTitle");
const smartFocusDescription = document.getElementById("smartFocusDescription");
const smartFocusList = document.getElementById("smartFocusList");
const subjectLoadList = document.getElementById("subjectLoadList");
const productivityTipList = document.getElementById("productivityTipList");

const API_ORIGIN =
  window.location.port === "8080" ? "" : "http://localhost:8080";
const TASKS_API_BASE = `${API_ORIGIN}/api/tasks`;
const SUBJECTS_API_BASE = `${API_ORIGIN}/api/subjects`;
const PLANNER_API_BASE = `${API_ORIGIN}/api/plans`;
const TASK_AI_API_BASE = `${API_ORIGIN}/api/ai/tasks/analyze`;

let editingTaskId = null;
let allTasks = [];
let allSubjects = [];

// ─── AUTH HEADER ──────────────────────────────────────────
function getAuthToken() {
  return (localStorage.getItem("token") || "").trim();
}

function redirectToLoginIfNeeded() {
  if (!getAuthToken()) {
    localStorage.clear();
    window.location.href = "login.html";
    return true;
  }

  return false;
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getAuthToken();
  return { Authorization: `Bearer ${token}`, ...extraHeaders };
}

// ─── API URL BUILDERS ─────────────────────────────────────
function buildTasksApiUrl(taskId = "") {
  const path = taskId ? `/${taskId}` : "";
  return `${TASKS_API_BASE}${path}`;
}

function buildSubjectsApiUrl() {
  return SUBJECTS_API_BASE;
}

function buildPlannerApiUrl() {
  return PLANNER_API_BASE;
}

// ─── API RESPONSE HANDLER ─────────────────────────────────
async function handleApiResponse(response) {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        message = data.message || data.error || JSON.stringify(data);
      } else {
        const text = await response.text();
        if (text) message = text;
      }
    } catch (_) {
      // Keep default message.
    }

    throw new Error(message);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json")
    ? response.json()
    : response.text();
}

// ─── MODAL OPEN / CLOSE ───────────────────────────────────
function openTaskModal() {
  if (!taskModalOverlay) return;

  taskModalOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeTaskModal() {
  if (!taskModalOverlay) return;

  taskModalOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

function setAddMode() {
  editingTaskId = null;

  if (taskModalTitle) taskModalTitle.textContent = "Add New Task";
  restoreTaskSaveButton();
}

function setEditMode() {
  if (taskModalTitle) taskModalTitle.textContent = "Edit Task";
  restoreTaskSaveButton();
}

function restoreTaskSaveButton() {
  if (!taskSaveBtn) return;

  taskSaveBtn.textContent = editingTaskId ? "Update Task" : "Save Task";
}

function resetTaskForm() {
  if (!taskModalForm) return;

  taskModalForm.reset();

  if (taskPriorityInput) taskPriorityInput.value = "High";
  if (taskStatusInput) taskStatusInput.value = "Pending";
  if (taskSubjectInput) taskSubjectInput.value = "";
}

function clearModalState() {
  resetTaskForm();
  setAddMode();
}

// ─── BASIC HELPERS ────────────────────────────────────────
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function parseDateOnly(dateValue) {
  if (!dateValue) return null;

  return new Date(`${dateValue}T00:00:00`);
}

function getDateDiffDays(dateValue) {
  const date = parseDateOnly(dateValue);
  if (!date) return 9999;

  const today = parseDateOnly(getTodayString());

  return Math.round((date - today) / 86400000);
}

function isCompleted(status) {
  return normalizeStatus(status) === "Completed";
}

function isOverdue(task) {
  return !isCompleted(task.status) && getDateDiffDays(task.dueDate) < 0;
}

function isDueToday(task) {
  return !isCompleted(task.status) && getDateDiffDays(task.dueDate) === 0;
}

function isUpcoming(task) {
  return !isCompleted(task.status) && getDateDiffDays(task.dueDate) > 0;
}

function formatDueDate(dateValue) {
  if (!dateValue) return "No date";

  const diff = getDateDiffDays(dateValue);

  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";

  const date = parseDateOnly(dateValue);
  return date
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    : dateValue;
}

function getTimelineLabel(task) {
  if (isCompleted(task.status)) return "Completed";
  if (!task.dueDate) return "No due date";

  const diff = getDateDiffDays(task.dueDate);

  if (diff < 0)
    return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? "s" : ""}`;
  if (diff === 0) return "Due Today";
  if (diff === 1) return "Due Tomorrow";
  if (diff <= 7) return `Due in ${diff} days`;

  return "Upcoming";
}

function getSubjectName(subject) {
  if (!subject || typeof subject !== "object") return "";
  return subject.name || subject.subjectName || "";
}

// ─── STATUS / PRIORITY HELPERS ────────────────────────────
function getPriorityClass(priority) {
  const value = (priority || "").toLowerCase();

  if (value === "high") return "high";
  if (value === "medium") return "medium";

  return "low";
}

function getStatusClass(status) {
  const value = (status || "").toLowerCase();

  if (value === "pending") return "pending";
  if (value === "completed") return "done";
  if (value === "in progress") return "progress";
  if (value === "overdue") return "overdue";

  return "pending";
}

function normalizePriority(text) {
  const value = (text || "").toLowerCase().replace(" priority", "").trim();

  if (value === "high") return "High";
  if (value === "medium") return "Medium";

  return "Low";
}

function normalizeStatus(text) {
  const value = (text || "").toLowerCase().trim();

  if (value === "pending") return "Pending";
  if (value === "completed") return "Completed";
  if (value === "in progress") return "In Progress";
  if (value === "overdue") return "Overdue";

  return "Pending";
}

function getDisplayStatus(rawStatus, dueDate) {
  const normalized = normalizeStatus(rawStatus);

  if (normalized === "Completed") return "Completed";
  if (normalized === "Overdue") return "Overdue";

  if (dueDate && getDateDiffDays(dueDate) < 0) return "Overdue";
  if (normalized === "In Progress") return "In Progress";

  return "Pending";
}

// ─── SMART PRODUCTIVITY HELPERS ───────────────────────────
function getTaskScore(task) {
  if (isCompleted(task.status)) return 0;

  const priority = normalizePriority(task.priority);
  const diff = getDateDiffDays(task.dueDate);

  let score = 0;

  if (priority === "High") score += 40;
  if (priority === "Medium") score += 25;
  if (priority === "Low") score += 12;

  if (diff < 0) score += 45;
  else if (diff === 0) score += 35;
  else if (diff === 1) score += 25;
  else if (diff <= 3) score += 18;
  else if (diff <= 7) score += 10;

  if (normalizeStatus(task.status) === "In Progress") score += 8;

  return Math.min(100, score);
}

function getTaskHealth(task) {
  if (isCompleted(task.status)) {
    return { label: "Done", className: "done", icon: "fa-circle-check" };
  }

  const score = getTaskScore(task);

  if (isOverdue(task)) {
    return {
      label: "Critical",
      className: "critical",
      icon: "fa-triangle-exclamation",
    };
  }

  if (score >= 70) {
    return { label: "Urgent", className: "urgent", icon: "fa-fire" };
  }

  if (score >= 40) {
    return { label: "Focus", className: "focus", icon: "fa-bolt" };
  }

  return { label: "Safe", className: "safe", icon: "fa-shield-heart" };
}

function getPomodoroSuggestion(task) {
  if (isCompleted(task.status)) {
    return {
      sessions: 0,
      label: "No focus session needed",
      detail: "This task is already completed.",
    };
  }

  const priority = normalizePriority(task.priority);
  const diff = getDateDiffDays(task.dueDate);

  let sessions = 1;

  if (priority === "High") sessions = 3;
  if (priority === "Medium") sessions = 2;
  if (priority === "Low") sessions = 1;

  if (diff < 0 || diff === 0) sessions += 1;
  if (normalizeStatus(task.status) === "In Progress")
    sessions = Math.max(1, sessions - 1);

  sessions = Math.min(4, sessions);

  return {
    sessions,
    label: `${sessions} Pomodoro session${sessions > 1 ? "s" : ""}`,
    detail: `${sessions} × 25 min focus blocks recommended.`,
  };
}

function getPlannerTimeForTask(task) {
  const priority = normalizePriority(task.priority);

  if (priority === "High") return "18:00:00";
  if (priority === "Medium") return "19:00:00";

  return "20:00:00";
}

function getPlannerDateForTask(task) {
  if (!task.dueDate) return getTodayString();

  return isOverdue(task) ? getTodayString() : task.dueDate;
}

// ─── DATA MAPPING ─────────────────────────────────────────
function mapBackendTaskToFrontend(task) {
  const subject = task.subject || {};
  const rawStatus = normalizeStatus(task.status || "Pending");
  const displayStatus = getDisplayStatus(rawStatus, task.dueDate);

  return {
    id: task.id,
    title: task.title || "",
    description: task.description || "",
    dueDate: task.dueDate || "",
    priority: normalizePriority(task.priority || "High"),
    status: rawStatus,
    displayStatus,
    subjectId: subject.id || "",
    subjectName: getSubjectName(subject),
  };
}

function buildTaskPayload(taskData) {
  return {
    title: taskData.title,
    description: taskData.description,
    dueDate: taskData.dueDate,
    priority: normalizePriority(taskData.priority),
    status: normalizeStatus(taskData.status),
    subjectId: Number(taskData.subjectId),
  };
}

// ─── SUBJECT DROPDOWN ─────────────────────────────────────
function createSubjectOption(subject) {
  const option = document.createElement("option");

  option.value = String(subject.id);
  option.textContent = subject.name || subject.subjectName || "Unnamed Subject";

  return option;
}

function populateSubjectDropdown(subjects) {
  if (!taskSubjectInput) return;

  taskSubjectInput.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select subject";

  taskSubjectInput.appendChild(placeholder);

  subjects.forEach((subject) => {
    taskSubjectInput.appendChild(createSubjectOption(subject));
  });
}

// ─── API CALLS ────────────────────────────────────────────
async function fetchSubjectsFromApi() {
  const response = await fetch(buildSubjectsApiUrl(), {
    headers: getAuthHeaders(),
  });

  const data = await handleApiResponse(response);

  return Array.isArray(data) ? data : [];
}

async function fetchTasksFromApi() {
  const response = await fetch(buildTasksApiUrl(), {
    headers: getAuthHeaders(),
  });

  const data = await handleApiResponse(response);

  return Array.isArray(data) ? data.map(mapBackendTaskToFrontend) : [];
}

async function createTaskInApi(taskData) {
  const response = await fetch(buildTasksApiUrl(), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(buildTaskPayload(taskData)),
  });

  return handleApiResponse(response);
}

async function updateTaskInApi(taskId, taskData) {
  const response = await fetch(buildTasksApiUrl(taskId), {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(buildTaskPayload(taskData)),
  });

  return handleApiResponse(response);
}

async function deleteTaskFromApi(taskId) {
  const response = await fetch(buildTasksApiUrl(taskId), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response);
}

async function fetchPlannerItems() {
  const response = await fetch(buildPlannerApiUrl(), {
    headers: getAuthHeaders(),
  });

  const data = await handleApiResponse(response);

  return Array.isArray(data) ? data : [];
}

async function createPlannerItemFromTask(task) {
  const plannerDate = getPlannerDateForTask(task);
  const plannerTime = getPlannerTimeForTask(task);

  const existingPlans = await fetchPlannerItems();

  const plannerTitle = `Study: ${task.title}`;

  const duplicate = existingPlans.some((plan) => {
    return (
      String(plan.title || "").toLowerCase() === plannerTitle.toLowerCase() &&
      String(plan.subject || "").toLowerCase() ===
        String(task.subjectName || "").toLowerCase() &&
      plan.date === plannerDate
    );
  });

  if (duplicate) {
    return { duplicate: true };
  }

  const pomodoro = getPomodoroSuggestion(task);

  const payload = {
    title: plannerTitle,
    subject: task.subjectName || "General",
    date: plannerDate,
    time: plannerTime,
    status: "PENDING",
    description: [
      `Created from Tasks module`,
      `Task: ${task.title}`,
      `Priority: ${task.priority}`,
      `Recommended Focus: ${pomodoro.label}`,
      task.description ? `Notes: ${task.description}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  const response = await fetch(buildPlannerApiUrl(), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  const created = await handleApiResponse(response);

  return { duplicate: false, created };
}
async function analyzeTaskWithAi(task) {
  const payload = {
    title: task.title || "",
    description: task.description || "",
    subjectName: task.subjectName || "General",
    dueDate: task.dueDate || "",
    priority: task.priority || "Medium",
    status: task.status || "Pending",
  };

  const response = await fetch(TASK_AI_API_BASE, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}
function normalizeAiBreakdownList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}
function renderTaskAiPanel(card, analysis) {
  if (!card) return;

  const panel = card.querySelector(".task-ai-panel");
  if (!panel) return;

  const breakdown = normalizeAiBreakdownList(analysis.breakdown);

  panel.classList.remove("hidden");

  panel.innerHTML = `
        <div class="task-ai-panel-header">
            <div>
                <span class="task-ai-kicker">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    AI Task Coach
                </span>
                <h4>Personalized task suggestions</h4>
            </div>

            <button type="button" class="task-ai-close-btn" title="Close AI analysis">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="task-ai-metrics">
            <div class="task-ai-metric">
                <span>Suggested Priority</span>
                <strong>${escapeHtml(analysis.suggestedPriority || "Medium")}</strong>
            </div>

            <div class="task-ai-metric">
                <span>AI Score</span>
                <strong>${escapeHtml(analysis.smartScore ?? "—")}</strong>
            </div>

            <div class="task-ai-metric">
                <span>Focus Sessions</span>
                <strong>${escapeHtml(analysis.pomodoroSessions ?? "—")}</strong>
            </div>

            <div class="task-ai-metric">
                <span>Health</span>
                <strong>${escapeHtml(analysis.healthLabel || "Focus")}</strong>
            </div>
        </div>

        <div class="task-ai-grid">
            <div class="task-ai-box">
                <h5><i class="fa-solid fa-lightbulb"></i> Study Tip</h5>
                <p>${escapeHtml(analysis.studyTip || "No study tip generated.")}</p>
            </div>

            <div class="task-ai-box">
                <h5><i class="fa-solid fa-calendar-check"></i> Planner Suggestion</h5>
                <p>${escapeHtml(analysis.plannerSuggestion || "No planner suggestion generated.")}</p>
            </div>

            <div class="task-ai-box">
                <h5><i class="fa-solid fa-clock-rotate-left"></i> Reschedule Suggestion</h5>
                <p>${escapeHtml(analysis.rescheduleSuggestion || "No reschedule suggestion generated.")}</p>
            </div>

            <div class="task-ai-box">
                <h5><i class="fa-solid fa-circle-info"></i> AI Reason</h5>
                <p>${escapeHtml(analysis.reason || "AI analyzed this task using title, subject, priority, status, and due date.")}</p>
            </div>
        </div>

        <div class="task-ai-breakdown">
            <h5><i class="fa-solid fa-list-check"></i> Smart Task Breakdown</h5>

            ${
              breakdown.length
                ? `<ol>${breakdown.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
                : `<p>No breakdown generated.</p>`
            }
        </div>
    `;
}
// ─── SUMMARY + SMART PANELS ───────────────────────────────
function updateTaskCounts(tasks = allTasks) {
  let pending = 0;
  let completed = 0;
  let overdue = 0;

  tasks.forEach((task) => {
    if (task.displayStatus === "Completed") completed++;
    else if (task.displayStatus === "Overdue") overdue++;
    else pending++;
  });

  if (totalTasksCount)
    totalTasksCount.textContent = String(tasks.length).padStart(2, "0");
  if (pendingTasksCount)
    pendingTasksCount.textContent = String(pending).padStart(2, "0");
  if (completedTasksCount)
    completedTasksCount.textContent = String(completed).padStart(2, "0");
  if (overdueTasksCount)
    overdueTasksCount.textContent = String(overdue).padStart(2, "0");
}

function renderSmartFocus(tasks = allTasks) {
  if (!smartFocusTitle || !smartFocusDescription || !smartFocusList) return;

  const activeTasks = tasks
    .filter((task) => task.displayStatus !== "Completed")
    .sort((a, b) => getTaskScore(b) - getTaskScore(a))
    .slice(0, 3);

  if (!activeTasks.length) {
    smartFocusTitle.textContent = "All clear for now";
    smartFocusDescription.textContent =
      "You have no pending tasks. Use this time for revision or practice.";
    smartFocusList.innerHTML = `
            <div class="smart-empty-line">
                <i class="fa-solid fa-circle-check"></i>
                Great job. Add a new task when you are ready.
            </div>
        `;
    return;
  }

  const first = activeTasks[0];

  smartFocusTitle.textContent = `Start with: ${first.title}`;
  smartFocusDescription.textContent = `${getTimelineLabel(first)} • ${first.priority} priority • ${getPomodoroSuggestion(first).label}`;

  smartFocusList.innerHTML = activeTasks
    .map((task) => {
      const health = getTaskHealth(task);
      const pomodoro = getPomodoroSuggestion(task);

      return `
            <div class="smart-focus-item">
                <span class="smart-focus-rank ${health.className}">
                    <i class="fa-solid ${health.icon}"></i>
                </span>
                <div>
                    <strong>${escapeHtml(task.title)}</strong>
                    <small>${escapeHtml(task.subjectName || "No Subject")} • ${escapeHtml(getTimelineLabel(task))} • ${escapeHtml(pomodoro.label)}</small>
                </div>
            </div>
        `;
    })
    .join("");
}

function renderSubjectLoad(tasks = allTasks) {
  if (!subjectLoadList) return;

  const activeTasks = tasks.filter(
    (task) => task.displayStatus !== "Completed",
  );
  const subjectMap = {};

  activeTasks.forEach((task) => {
    const subject = task.subjectName || "General";

    if (!subjectMap[subject]) {
      subjectMap[subject] = {
        subject,
        total: 0,
        high: 0,
      };
    }

    subjectMap[subject].total++;

    if (task.priority === "High") {
      subjectMap[subject].high++;
    }
  });

  const rows = Object.values(subjectMap).sort((a, b) => b.total - a.total);

  if (!rows.length) {
    subjectLoadList.innerHTML = `
            <p class="smart-muted-text">No pending task load right now.</p>
        `;
    return;
  }

  const max = Math.max(...rows.map((row) => row.total), 1);

  subjectLoadList.innerHTML = rows
    .slice(0, 5)
    .map((row) => {
      const percent = Math.round((row.total / max) * 100);

      return `
            <div class="subject-load-item">
                <div class="subject-load-top">
                    <strong>${escapeHtml(row.subject)}</strong>
                    <span>${row.total} pending${row.high ? ` • ${row.high} high` : ""}</span>
                </div>
                <div class="subject-load-bar">
                    <div class="subject-load-fill" style="width:${percent}%"></div>
                </div>
            </div>
        `;
    })
    .join("");
}

function renderProductivityTips(tasks = allTasks) {
  if (!productivityTipList) return;

  const activeTasks = tasks.filter(
    (task) => task.displayStatus !== "Completed",
  );
  const overdueCount = activeTasks.filter(
    (task) => task.displayStatus === "Overdue",
  ).length;
  const dueTodayCount = activeTasks.filter(isDueToday).length;
  const highCount = activeTasks.filter(
    (task) => task.priority === "High",
  ).length;

  const totalPomodoro = activeTasks.reduce((sum, task) => {
    return sum + getPomodoroSuggestion(task).sessions;
  }, 0);

  const tips = [];

  if (overdueCount > 0) {
    tips.push({
      icon: "fa-triangle-exclamation",
      text: `${overdueCount} overdue task(s) need immediate attention.`,
    });
  }

  if (dueTodayCount > 0) {
    tips.push({
      icon: "fa-calendar-day",
      text: `${dueTodayCount} task(s) are due today. Complete high-priority ones first.`,
    });
  }

  if (highCount > 0) {
    tips.push({
      icon: "fa-fire",
      text: `${highCount} high-priority task(s) are active. Avoid multitasking.`,
    });
  }

  if (activeTasks.length > 0) {
    tips.push({
      icon: "fa-stopwatch",
      text: `${totalPomodoro} Pomodoro session(s) recommended for current active tasks.`,
    });
  }

  if (!tips.length) {
    tips.push({
      icon: "fa-circle-check",
      text: "No urgent task pressure right now. Use this time for revision.",
    });
  }

  productivityTipList.innerHTML = tips
    .slice(0, 4)
    .map((tip) => {
      return `
            <div class="productivity-tip-item">
                <i class="fa-solid ${tip.icon}"></i>
                <span>${escapeHtml(tip.text)}</span>
            </div>
        `;
    })
    .join("");
}

function renderSmartPanels(tasks = allTasks) {
  renderSmartFocus(tasks);
  renderSubjectLoad(tasks);
  renderProductivityTips(tasks);
}

// ─── RENDER TASK CARDS ────────────────────────────────────
function createTaskCard(task) {
  const card = document.createElement("div");

  const priorityClass = getPriorityClass(task.priority);
  const statusClass = getStatusClass(task.displayStatus);
  const formattedDate = formatDueDate(task.dueDate);
  const timelineLabel = getTimelineLabel(task);
  const health = getTaskHealth(task);
  const pomodoro = getPomodoroSuggestion(task);
  const taskScore = getTaskScore(task);

  card.className = `task-card task-health-${health.className}`;
  card.dataset.taskId = task.id;
  card.dataset.subjectId = String(task.subjectId || "");
  card.dataset.description = task.description || "";
  card.dataset.rawStatus = task.status || "Pending";
  card.dataset.dueDate = task.dueDate || "";
  card.dataset.priority = task.priority || "";
  card.dataset.displayStatus = task.displayStatus || "";
  card.dataset.subjectName = task.subjectName || "";

  card.innerHTML = `
        <div class="task-card-top">
            <div class="task-main-info">
                <div class="task-title-row">
                    <h3>${escapeHtml(task.title)}</h3>
                    <span class="task-health-badge ${health.className}">
                        <i class="fa-solid ${health.icon}"></i>
                        ${health.label}
                    </span>
                </div>
                <p>Subject: ${escapeHtml(task.subjectName || "No Subject")}</p>
            </div>

            <div class="task-actions">
                  <button class="task-action-btn ai" title="Analyze with AI">
                   <i class="fa-solid fa-wand-magic-sparkles"></i>
                 </button>

                <button class="task-action-btn planner" title="Add to Planner">
                    <i class="fa-solid fa-calendar-plus"></i>
                </button>
                <button class="task-action-btn edit" title="Edit">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="task-action-btn delete" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>

        <p class="task-description">${escapeHtml(task.description || "No description added.")}</p>

        <div class="task-card-meta">
            <span class="task-date" data-date-value="${escapeHtml(task.dueDate || "")}">
                <i class="fa-regular fa-calendar"></i>
                Due: ${escapeHtml(formattedDate)}
            </span>

            <span class="task-priority ${priorityClass}">
                ${escapeHtml(task.priority)} Priority
            </span>

            <span class="task-status ${statusClass}">
                ${escapeHtml(task.displayStatus)}
            </span>

            <span class="task-timeline-pill ${health.className}">
                <i class="fa-solid ${health.icon}"></i>
                ${escapeHtml(timelineLabel)}
            </span>
        </div>

        <div class="task-productivity-row">
           <div class="task-score-box">
                 <span>Smart Score</span>
                  <strong>${taskScore}</strong>
            </div>

            <div class="task-pomodoro-box">
                  <span>${escapeHtml(pomodoro.label)}</span>
                   <small>${escapeHtml(pomodoro.detail)}</small>
            </div>
    </div>

<div class="task-ai-panel hidden"></div>
    `;

  return card;
}

function renderTasks(tasks) {
  if (!tasksList) return;

  tasksList.innerHTML = "";

  tasks.forEach((task) => {
    tasksList.appendChild(createTaskCard(task));
  });

  updateTaskCounts(allTasks);
  renderSmartPanels(allTasks);
  applyTaskFilters();
}

function updateEmptyState(count) {
  if (!tasksEmptyState) return;

  tasksEmptyState.classList.toggle("hidden", count > 0);
}

function matchesFilter(task, filterValue) {
  if (!filterValue || filterValue === "All Tasks") return true;

  if (filterValue === "Pending")
    return (
      task.displayStatus === "Pending" || task.displayStatus === "In Progress"
    );
  if (filterValue === "Completed") return task.displayStatus === "Completed";
  if (filterValue === "High Priority") return task.priority === "High";
  if (filterValue === "Due Today") return isDueToday(task);
  if (filterValue === "Upcoming") return isUpcoming(task);
  if (filterValue === "Overdue") return task.displayStatus === "Overdue";

  return true;
}

function applyTaskFilters() {
  if (!tasksList) return;

  const cards = tasksList.querySelectorAll(".task-card");
  const search = taskSearchInput
    ? taskSearchInput.value.toLowerCase().trim()
    : "";
  const filterValue = taskFilterSelect ? taskFilterSelect.value : "All Tasks";

  let visible = 0;

  cards.forEach((card) => {
    const task = allTasks.find(
      (item) => String(item.id) === String(card.dataset.taskId),
    );

    if (!task) {
      card.style.display = "none";
      return;
    }

    const matchSearch = [
      task.title,
      task.subjectName,
      task.description,
      task.priority,
      task.displayStatus,
    ]
      .map((value) => (value || "").toLowerCase())
      .some((value) => value.includes(search));

    const show = matchSearch && matchesFilter(task, filterValue);

    card.style.display = show ? "" : "none";

    if (show) visible++;
  });

  updateEmptyState(visible);
}

function fillFormForEdit(card) {
  editingTaskId = card.dataset.taskId || "";

  if (taskTitleInput) {
    taskTitleInput.value =
      card.querySelector(".task-main-info h3")?.textContent.trim() || "";
  }

  if (taskSubjectInput) {
    taskSubjectInput.value = card.dataset.subjectId || "";
  }

  if (taskDateInput) {
    taskDateInput.value = card.dataset.dueDate || "";
  }

  if (taskPriorityInput) {
    taskPriorityInput.value = card.dataset.priority || "High";
  }

  if (taskStatusInput) {
    taskStatusInput.value = card.dataset.rawStatus || "Pending";
  }

  if (taskDescriptionInput) {
    taskDescriptionInput.value = card.dataset.description || "";
  }
}

// ─── TOAST ────────────────────────────────────────────────
function showToast(message, type = "success") {
  let toast = document.getElementById("edumindToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "edumindToast";

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "28px",
      right: "28px",
      zIndex: "9999",
      padding: "14px 22px",
      borderRadius: "14px",
      fontSize: "14px",
      fontFamily: "Poppins, sans-serif",
      fontWeight: "700",
      boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
      transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      opacity: "0",
      transform: "translateY(12px)",
      pointerEvents: "none",
      maxWidth: "420px",
      lineHeight: "1.5",
    });

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  toast.style.background =
    type === "error"
      ? "linear-gradient(135deg, #ef4444, #dc2626)"
      : "linear-gradient(135deg, #14b8a6, #06b6d4)";

  toast.style.color = "#fff";
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  clearTimeout(toast._timeout);

  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
  }, 4000);
}

// ─── LOAD FUNCTIONS ───────────────────────────────────────
async function loadSubjectsForTaskForm() {
  try {
    allSubjects = await fetchSubjectsFromApi();
    populateSubjectDropdown(allSubjects);
  } catch (error) {
    console.error("Failed to load subjects:", error);
    populateSubjectDropdown([]);
  }
}

async function loadTasks() {
  try {
    allTasks = await fetchTasksFromApi();
    renderTasks(allTasks);
    updateEmptyState(allTasks.length);
    localStorage.setItem("edumind_tasks_updated", Date.now().toString());
  } catch (error) {
    console.error("Failed to load tasks:", error);

    allTasks = [];

    if (tasksList) tasksList.innerHTML = "";

    updateTaskCounts([]);
    renderSmartPanels([]);
    updateEmptyState(0);

    showToast("Failed to load tasks. Please refresh the page.", "error");
  }
}

async function addTask(taskData) {
  await createTaskInApi(taskData);
  await loadTasks();
}

async function updateTask(taskId, updatedData) {
  await updateTaskInApi(taskId, updatedData);
  await loadTasks();
}

async function deleteTask(taskId) {
  await deleteTaskFromApi(taskId);
  await loadTasks();
}

async function initializeTaskPage() {
  if (redirectToLoginIfNeeded()) return;

  await loadSubjectsForTaskForm();
  await loadTasks();

  setAddMode();
}

// ─── VALIDATION ───────────────────────────────────────────
function validateTaskForm() {
  const title = taskTitleInput?.value.trim() || "";
  const subjectId = taskSubjectInput?.value || "";
  const dueDate = taskDateInput?.value || "";
  const description = taskDescriptionInput?.value.trim() || "";

  if (!title) {
    showToast("Please enter a task title.", "error");
    return false;
  }

  if (!subjectId) {
    showToast("Please select a subject.", "error");
    return false;
  }

  if (!dueDate) {
    showToast("Please select a due date.", "error");
    return false;
  }

  if (!description) {
    showToast("Please enter task description.", "error");
    return false;
  }

  return true;
}

// ─── EVENT LISTENERS ──────────────────────────────────────
openTaskModalBtn?.addEventListener("click", function () {
  clearModalState();
  openTaskModal();
});

closeTaskModalBtn?.addEventListener("click", function () {
  closeTaskModal();
  clearModalState();
});

cancelTaskModalBtn?.addEventListener("click", function () {
  closeTaskModal();
  clearModalState();
});

taskModalOverlay?.addEventListener("click", function (event) {
  if (event.target === taskModalOverlay) {
    closeTaskModal();
    clearModalState();
  }
});

document.addEventListener("keydown", function (event) {
  if (
    event.key === "Escape" &&
    taskModalOverlay &&
    !taskModalOverlay.classList.contains("hidden")
  ) {
    closeTaskModal();
    clearModalState();
  }
});

taskModalForm?.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!validateTaskForm()) return;

  const taskData = {
    title: taskTitleInput.value.trim(),
    subjectId: taskSubjectInput.value,
    dueDate: taskDateInput.value,
    priority: taskPriorityInput.value,
    status: taskStatusInput.value,
    description: taskDescriptionInput.value.trim(),
  };

  try {
    if (taskSaveBtn) {
      taskSaveBtn.disabled = true;
      taskSaveBtn.textContent = editingTaskId ? "Updating..." : "Saving...";
    }

    if (editingTaskId) {
      await updateTask(editingTaskId, taskData);
      showToast("Task updated successfully.", "success");
    } else {
      await addTask(taskData);
      showToast("Task added successfully.", "success");
    }

    closeTaskModal();
    clearModalState();
  } catch (error) {
    console.error("Task save failed:", error);
    showToast(`Failed to save task: ${error.message}`, "error");
  } finally {
    if (taskSaveBtn) {
      taskSaveBtn.disabled = false;
      restoreTaskSaveButton();
    }
  }
});

tasksList?.addEventListener("click", async function (event) {
  const deleteBtn = event.target.closest(".task-action-btn.delete");
  const editBtn = event.target.closest(".task-action-btn.edit");
  const plannerBtn = event.target.closest(".task-action-btn.planner");
  const aiBtn = event.target.closest(".task-action-btn.ai");
  const aiCloseBtn = event.target.closest(".task-ai-close-btn");

  if (aiCloseBtn) {
    const card = aiCloseBtn.closest(".task-card");
    const panel = card?.querySelector(".task-ai-panel");

    if (panel) {
      panel.classList.add("hidden");
      panel.innerHTML = "";
    }

    return;
  }

  if (aiBtn) {
    const card = aiBtn.closest(".task-card");
    const taskId = card?.dataset.taskId;
    const task = allTasks.find((item) => String(item.id) === String(taskId));

    if (!task) {
      showToast("Task details not found.", "error");
      return;
    }

    aiBtn.disabled = true;
    aiBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
      const analysis = await analyzeTaskWithAi(task);
      renderTaskAiPanel(card, analysis);
      showToast("AI task analysis generated successfully.", "success");
    } catch (error) {
      console.error("AI task analysis failed:", error);
      showToast(`AI analysis failed: ${error.message}`, "error");
    } finally {
      aiBtn.disabled = false;
      aiBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i>`;
    }

    return;
  }

  if (deleteBtn) {
    const card = deleteBtn.closest(".task-card");
    const taskId = card?.dataset.taskId;

    if (!taskId) return;

    const confirmed = confirm("Do you want to delete this task?");

    if (!confirmed) return;

    try {
      await deleteTask(taskId);
      showToast("Task deleted successfully.", "success");
    } catch (error) {
      console.error("Task delete failed:", error);
      showToast(`Failed to delete task: ${error.message}`, "error");
    }

    return;
  }

  if (editBtn) {
    const card = editBtn.closest(".task-card");

    if (!card) return;

    setEditMode();
    fillFormForEdit(card);
    openTaskModal();

    return;
  }

  if (plannerBtn) {
    const card = plannerBtn.closest(".task-card");
    const taskId = card?.dataset.taskId;
    const task = allTasks.find((item) => String(item.id) === String(taskId));

    if (!task) {
      showToast("Task details not found.", "error");
      return;
    }

    if (isCompleted(task.status)) {
      showToast("Completed tasks do not need a new planner session.", "error");
      return;
    }

    plannerBtn.disabled = true;
    plannerBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
      const result = await createPlannerItemFromTask(task);

      if (result.duplicate) {
        showToast("This task is already added to Planner.", "success");
      } else {
        localStorage.setItem("edumind_planner_updated", Date.now().toString());
        showToast("Task added to Planner successfully.", "success");
      }
    } catch (error) {
      console.error("Add to Planner failed:", error);
      showToast(`Failed to add task to Planner: ${error.message}`, "error");
    } finally {
      plannerBtn.disabled = false;
      plannerBtn.innerHTML = `<i class="fa-solid fa-calendar-plus"></i>`;
    }
  }
});

taskSearchInput?.addEventListener("input", applyTaskFilters);
taskFilterSelect?.addEventListener("change", applyTaskFilters);

document
  .getElementById("logoutBtn")
  ?.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.clear();
    window.location.href = "login.html";
  });

document
  .getElementById("profileLogoutBtn")
  ?.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.clear();
    window.location.href = "login.html";
  });

// ─── INIT ─────────────────────────────────────────────────
initializeTaskPage();
