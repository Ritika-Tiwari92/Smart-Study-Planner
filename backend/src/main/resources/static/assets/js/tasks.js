const openTaskModalBtn   = document.getElementById("openTaskModalBtn");
const taskModalOverlay   = document.getElementById("taskModalOverlay");
const closeTaskModalBtn  = document.getElementById("closeTaskModalBtn");
const cancelTaskModalBtn = document.getElementById("cancelTaskModalBtn");
const taskModalForm      = document.getElementById("taskModalForm");
const taskModalTitle     = document.getElementById("taskModalTitle");
const taskSaveBtn        = document.getElementById("taskSaveBtn");

const tasksList          = document.getElementById("tasksList");
const tasksEmptyState    = document.getElementById("tasksEmptyState");
const taskSearchInput    = document.getElementById("taskSearchInput");
const taskFilterSelect   = document.getElementById("taskFilterSelect");

const totalTasksCount     = document.getElementById("totalTasksCount");
const pendingTasksCount   = document.getElementById("pendingTasksCount");
const completedTasksCount = document.getElementById("completedTasksCount");
const overdueTasksCount   = document.getElementById("overdueTasksCount");

const taskTitleInput       = document.getElementById("taskTitle");
const taskSubjectInput     = document.getElementById("taskSubject");
const taskDateInput        = document.getElementById("taskDate");
const taskPriorityInput    = document.getElementById("taskPriority");
const taskStatusInput      = document.getElementById("taskStatus");
const taskDescriptionInput = document.getElementById("taskDescription");

// ─── API URLs ────────────────────────────────────────────
const TASKS_API_BASE    = "http://localhost:8080/tasks";
const SUBJECTS_API_BASE = "http://localhost:8080/api/subjects";

let editingTaskId = null;

// ─── AUTH HEADER ─────────────────────────────────────────
function getAuthHeaders(extraHeaders = {}) {
    const token = (localStorage.getItem("token") || "").trim();
    return { "Authorization": `Bearer ${token}`, ...extraHeaders };
}

// ─── GET USER ID ─────────────────────────────────────────
function getCurrentUserId() {
    // 1. Direct userId
    const userId = localStorage.getItem("userId");
    if (userId) return Number(userId);

    // 2. edumind_logged_in_user object
    try {
        const raw = localStorage.getItem("edumind_logged_in_user");
        if (raw) {
            const user = JSON.parse(raw);
            if (user && user.id) return Number(user.id);
        }
    } catch (e) {}

    // 3. JWT payload
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const id = payload.userId || payload.id;
            if (id && !isNaN(Number(id))) return Number(id);
        } catch (e) {}
    }

    throw new Error("User ID not found. Please login again.");
}

// ─── API URL BUILDERS ────────────────────────────────────
function buildTasksApiUrl(taskId = "") {
    const userId = getCurrentUserId();
    const path   = taskId ? `/${taskId}` : "";
    return `${TASKS_API_BASE}${path}?userId=${encodeURIComponent(userId)}`;
}

function buildSubjectsApiUrl() {
    return SUBJECTS_API_BASE;
}

// ─── MODAL OPEN / CLOSE ──────────────────────────────────
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
    if (taskSaveBtn)    taskSaveBtn.textContent    = "Save Task";
}

function setEditMode() {
    if (taskModalTitle) taskModalTitle.textContent = "Edit Task";
    if (taskSaveBtn)    taskSaveBtn.textContent    = "Update Task";
}

function resetTaskForm() {
    if (!taskModalForm) return;
    taskModalForm.reset();
    if (taskPriorityInput) taskPriorityInput.value = "High";
    if (taskStatusInput)   taskStatusInput.value   = "Pending";
    if (taskSubjectInput)  taskSubjectInput.value   = "";
}

function clearModalState() {
    resetTaskForm();
    setAddMode();
}

// ─── DATE HELPERS ────────────────────────────────────────
function formatDueDate(dateValue) {
    if (!dateValue) return "No date";
    const sel   = new Date(dateValue);
    const today = new Date();
    sel.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diff = (sel - today) / 86400000;
    if (diff === 0)  return "Today";
    if (diff === 1)  return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return sel.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function isPastDate(dateValue) {
    if (!dateValue) return false;
    const sel   = new Date(dateValue);
    const today = new Date();
    sel.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return sel < today;
}

// ─── STATUS / PRIORITY HELPERS ───────────────────────────
function getPriorityClass(priority) {
    const v = (priority || "").toLowerCase();
    if (v === "high")   return "high";
    if (v === "medium") return "medium";
    return "low";
}

function getStatusClass(status) {
    const v = (status || "").toLowerCase();
    if (v === "pending")     return "pending";
    if (v === "completed")   return "done";
    if (v === "in progress") return "progress";
    if (v === "overdue")     return "overdue";
    return "pending";
}

function normalizePriority(text) {
    const v = (text || "").toLowerCase().replace(" priority", "").trim();
    if (v === "high")   return "High";
    if (v === "medium") return "Medium";
    return "Low";
}

function normalizeStatus(text) {
    const v = (text || "").toLowerCase().trim();
    if (v === "pending")     return "Pending";
    if (v === "completed")   return "Completed";
    if (v === "in progress") return "In Progress";
    if (v === "overdue")     return "Overdue";
    return "Pending";
}

function getDisplayStatus(rawStatus, dueDate) {
    const normalized = normalizeStatus(rawStatus);
    if (normalized === "Completed")   return "Completed";
    if (normalized === "Overdue")     return "Overdue";
    if (dueDate && isPastDate(dueDate)) return "Overdue";
    if (normalized === "In Progress") return "In Progress";
    return "Pending";
}

function getSubjectName(subject) {
    if (!subject || typeof subject !== "object") return "";
    return subject.name || subject.subjectName || "";
}

// ─── DATA MAPPING ────────────────────────────────────────
function mapBackendTaskToFrontend(task) {
    const subject      = task.subject || {};
    const rawStatus    = normalizeStatus(task.status || "Pending");
    const displayStatus = getDisplayStatus(rawStatus, task.dueDate);
    return {
        id:          task.id,
        title:       task.title       || "",
        description: task.description || "",
        dueDate:     task.dueDate     || "",
        priority:    normalizePriority(task.priority || "High"),
        status:      rawStatus,
        displayStatus,
        subjectId:   subject.id       || "",
        subjectName: getSubjectName(subject)
    };
}

function buildTaskPayload(taskData) {
    return {
        title:       taskData.title,
        description: taskData.description,
        dueDate:     taskData.dueDate,
        priority:    normalizePriority(taskData.priority),
        status:      normalizeStatus(taskData.status),
        subjectId:   Number(taskData.subjectId)
    };
}

// ─── SUBJECT DROPDOWN ────────────────────────────────────
function createSubjectOption(subject) {
    const option       = document.createElement("option");
    option.value       = String(subject.id);
    option.textContent = subject.name || subject.subjectName || "Unnamed Subject";
    return option;
}

function populateSubjectDropdown(subjects) {
    if (!taskSubjectInput) return;
    taskSubjectInput.innerHTML = "";
    const placeholder       = document.createElement("option");
    placeholder.value       = "";
    placeholder.textContent = "Select subject";
    taskSubjectInput.appendChild(placeholder);
    subjects.forEach(s => taskSubjectInput.appendChild(createSubjectOption(s)));
}

// ─── API RESPONSE HANDLER ────────────────────────────────
async function handleApiResponse(response) {
    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const text = await response.text();
            if (text) message = text;
        } catch (e) {}
        throw new Error(message);
    }
    if (response.status === 204) return null;
    const ct = response.headers.get("content-type") || "";
    return ct.includes("application/json") ? response.json() : response.text();
}

// ─── API CALLS — only one copy each, all with auth headers ─
async function fetchSubjectsFromApi() {
    const res  = await fetch(buildSubjectsApiUrl(), { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return Array.isArray(data) ? data : [];
}

async function fetchTasksFromApi() {
    const res  = await fetch(buildTasksApiUrl(), { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return Array.isArray(data) ? data.map(mapBackendTaskToFrontend) : [];
}

async function createTaskInApi(taskData) {
    const res = await fetch(buildTasksApiUrl(), {
        method:  "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body:    JSON.stringify(buildTaskPayload(taskData))
    });
    return handleApiResponse(res);
}

async function updateTaskInApi(taskId, taskData) {
    const res = await fetch(buildTasksApiUrl(taskId), {
        method:  "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body:    JSON.stringify(buildTaskPayload(taskData))
    });
    return handleApiResponse(res);
}

async function deleteTaskFromApi(taskId) {
    const res = await fetch(buildTasksApiUrl(taskId), {
        method:  "DELETE",
        headers: getAuthHeaders()
    });
    return handleApiResponse(res);
}

// ─── RENDER ──────────────────────────────────────────────
function updateTaskCounts() {
    if (!tasksList) return;
    const cards    = tasksList.querySelectorAll(".task-card");
    const statuses = tasksList.querySelectorAll(".task-status");
    let pending = 0, completed = 0, overdue = 0;
    statuses.forEach(s => {
        if (s.classList.contains("pending"))  pending++;
        if (s.classList.contains("done"))     completed++;
        if (s.classList.contains("overdue"))  overdue++;
    });
    if (totalTasksCount)     totalTasksCount.textContent     = String(cards.length).padStart(2, "0");
    if (pendingTasksCount)   pendingTasksCount.textContent   = String(pending).padStart(2, "0");
    if (completedTasksCount) completedTasksCount.textContent = String(completed).padStart(2, "0");
    if (overdueTasksCount)   overdueTasksCount.textContent   = String(overdue).padStart(2, "0");
}

function createTaskCard(task) {
    const card = document.createElement("div");
    card.className         = "task-card";
    card.dataset.taskId    = task.id;
    card.dataset.subjectId = String(task.subjectId || "");
    card.dataset.description = task.description || "";
    card.dataset.rawStatus = task.status || "Pending";

    const priorityClass = getPriorityClass(task.priority);
    const statusClass   = getStatusClass(task.displayStatus);
    const formattedDate = formatDueDate(task.dueDate);

    card.innerHTML = `
        <div class="task-card-top">
            <div class="task-main-info">
                <h3>${task.title}</h3>
                <p>Subject: ${task.subjectName || "No Subject"}</p>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="task-action-btn delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
        <div class="task-card-meta">
            <span class="task-date" data-date-value="${task.dueDate || ""}">
                <i class="fa-regular fa-calendar"></i> Due: ${formattedDate}
            </span>
            <span class="task-priority ${priorityClass}">${task.priority} Priority</span>
            <span class="task-status ${statusClass}">${task.displayStatus}</span>
        </div>`;
    return card;
}

function renderTasks(tasks) {
    if (!tasksList) return;
    tasksList.innerHTML = "";
    tasks.forEach(t => tasksList.appendChild(createTaskCard(t)));
    updateTaskCounts();
    applyTaskFilters();
}

function updateEmptyState(count) {
    if (!tasksEmptyState) return;
    tasksEmptyState.classList.toggle("hidden", count > 0);
}

function matchesFilter(card, filterValue) {
    if (!filterValue || filterValue === "All Tasks") return true;
    const statusText   = card.querySelector(".task-status")?.textContent.trim().toLowerCase()   || "";
    const priorityText = card.querySelector(".task-priority")?.textContent.trim().toLowerCase() || "";
    if (filterValue === "Pending")       return statusText   === "pending";
    if (filterValue === "Completed")     return statusText   === "completed";
    if (filterValue === "High Priority") return priorityText === "high priority";
    if (filterValue === "Overdue")       return statusText   === "overdue";
    return true;
}

function applyTaskFilters() {
    if (!tasksList) return;
    const cards       = tasksList.querySelectorAll(".task-card");
    const search      = taskSearchInput  ? taskSearchInput.value.toLowerCase().trim() : "";
    const filterValue = taskFilterSelect ? taskFilterSelect.value : "All Tasks";
    let visible = 0;
    cards.forEach(card => {
        const title   = card.querySelector(".task-main-info h3")?.textContent.toLowerCase() || "";
        const subject = card.querySelector(".task-main-info p")?.textContent.toLowerCase()  || "";
        const show    = (title.includes(search) || subject.includes(search)) && matchesFilter(card, filterValue);
        card.style.display = show ? "" : "none";
        if (show) visible++;
    });
    updateEmptyState(visible);
}

function fillFormForEdit(card) {
    editingTaskId              = card.dataset.taskId    || "";
    taskTitleInput.value       = card.querySelector(".task-main-info h3")?.textContent.trim() || "";
    taskSubjectInput.value     = card.dataset.subjectId || "";
    taskDateInput.value        = card.querySelector(".task-date")?.getAttribute("data-date-value") || "";
    taskPriorityInput.value    = (card.querySelector(".task-priority")?.textContent.trim() || "").replace(" Priority", "").trim();
    taskStatusInput.value      = card.dataset.rawStatus || "Pending";
    taskDescriptionInput.value = card.dataset.description || "";
}

// ─── LOAD FUNCTIONS ──────────────────────────────────────
async function loadSubjectsForTaskForm() {
    try {
        const subjects = await fetchSubjectsFromApi();
        populateSubjectDropdown(subjects);
    } catch (error) {
        console.error("Failed to load subjects:", error);
        populateSubjectDropdown([]);
        // Silent fail — don't block the page with alert
    }
}

async function loadTasks() {
    try {
        const tasks = await fetchTasksFromApi();
        renderTasks(tasks);
        updateEmptyState(tasks.length);
    } catch (error) {
        console.error("Failed to load tasks:", error);
        if (tasksList) tasksList.innerHTML = "";
        updateTaskCounts();
        updateEmptyState(0);
        // Silent fail — show empty state instead of annoying alert
    }
}

async function addTask(taskData)              { await createTaskInApi(taskData);         await loadTasks(); }
async function updateTask(taskId, updatedData){ await updateTaskInApi(taskId, updatedData); await loadTasks(); }
async function deleteTask(taskId)             { await deleteTaskFromApi(taskId);          await loadTasks(); }

async function initializeTaskPage() {
    await loadSubjectsForTaskForm();
    await loadTasks();
    setAddMode();
}

// ─── EVENT LISTENERS ─────────────────────────────────────
if (openTaskModalBtn) {
    openTaskModalBtn.addEventListener("click", function () {
        clearModalState();
        openTaskModal();
    });
}

if (closeTaskModalBtn) {
    closeTaskModalBtn.addEventListener("click", function () {
        closeTaskModal();
        clearModalState();
    });
}

if (cancelTaskModalBtn) {
    cancelTaskModalBtn.addEventListener("click", function () {
        closeTaskModal();
        clearModalState();
    });
}

if (taskModalOverlay) {
    taskModalOverlay.addEventListener("click", function (e) {
        if (e.target === taskModalOverlay) {
            closeTaskModal();
            clearModalState();
        }
    });
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && taskModalOverlay && !taskModalOverlay.classList.contains("hidden")) {
        closeTaskModal();
        clearModalState();
    }
});

if (taskModalForm) {
    taskModalForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const title       = taskTitleInput.value.trim();
        const subjectId   = taskSubjectInput.value;
        const dueDate     = taskDateInput.value;
        const priority    = taskPriorityInput.value;
        const status      = taskStatusInput.value;
        const description = taskDescriptionInput.value.trim();

        if (!title)       { alert("Please enter a task title.");     return; }
        if (!subjectId)   { alert("Please select a subject.");        return; }
        if (!dueDate)     { alert("Please select a due date.");       return; }
        if (!description) { alert("Please enter task description.");  return; }

        const taskData = { title, subjectId, dueDate, priority, status, description };
        try {
            if (taskSaveBtn) taskSaveBtn.disabled = true;
            if (editingTaskId) { await updateTask(editingTaskId, taskData); }
            else               { await addTask(taskData); }
            closeTaskModal();
            clearModalState();
        } catch (error) {
            alert(`Failed to save task: ${error.message}`);
        } finally {
            if (taskSaveBtn) taskSaveBtn.disabled = false;
        }
    });
}

if (tasksList) {
    tasksList.addEventListener("click", async function (e) {
        const deleteBtn = e.target.closest(".task-action-btn.delete");
        const editBtn   = e.target.closest(".task-action-btn.edit");

        if (deleteBtn) {
            const card   = deleteBtn.closest(".task-card");
            const taskId = card?.dataset.taskId;
            if (!taskId) return;
            if (!confirm("Do you want to delete this task?")) return;
            try { await deleteTask(taskId); }
            catch (error) { alert(`Failed to delete task: ${error.message}`); }
            return;
        }

        if (editBtn) {
            const card = editBtn.closest(".task-card");
            if (!card) return;
            setEditMode();
            fillFormForEdit(card);
            openTaskModal();
        }
    });
}

// ─── Search & Filter — outside tasksList block ───────────
if (taskSearchInput)  taskSearchInput.addEventListener("input",  applyTaskFilters);
if (taskFilterSelect) taskFilterSelect.addEventListener("change", applyTaskFilters);

// ─── INIT ────────────────────────────────────────────────
initializeTaskPage();