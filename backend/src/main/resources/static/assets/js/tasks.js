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

const TASKS_API_BASE = "http://localhost:8080/tasks";
const SUBJECTS_API_BASE = "http://localhost:8080/subjects";

let editingTaskId = null;

function getStoredUserObject() {
    const rawValue = localStorage.getItem("edumind_logged_in_user");

    if (!rawValue) {
        return null;
    }

    try {
        return JSON.parse(rawValue);
    } catch (error) {
        console.error("Failed to parse edumind_logged_in_user:", error);
        return null;
    }
}

function getCurrentUserId() {
    const user = getStoredUserObject();

    if (user && user.id != null && user.id !== "") {
        return Number(user.id);
    }

    throw new Error("Logged-in user id not found in localStorage.");
}

function buildTasksApiUrl(taskId = "") {
    const userId = getCurrentUserId();
    const normalizedPath = taskId ? `/${taskId}` : "";
    return `${TASKS_API_BASE}${normalizedPath}?userId=${encodeURIComponent(userId)}`;
}

function buildSubjectsApiUrl() {
    const userId = getCurrentUserId();
    return `${SUBJECTS_API_BASE}?userId=${encodeURIComponent(userId)}`;
}

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

    if (taskModalTitle) {
        taskModalTitle.textContent = "Add New Task";
    }

    if (taskSaveBtn) {
        taskSaveBtn.textContent = "Save Task";
    }
}

function setEditMode() {
    if (taskModalTitle) {
        taskModalTitle.textContent = "Edit Task";
    }

    if (taskSaveBtn) {
        taskSaveBtn.textContent = "Update Task";
    }
}

function resetTaskForm() {
    if (!taskModalForm) return;

    taskModalForm.reset();

    if (taskPriorityInput) {
        taskPriorityInput.value = "High";
    }

    if (taskStatusInput) {
        taskStatusInput.value = "Pending";
    }

    if (taskSubjectInput) {
        taskSubjectInput.value = "";
    }
}

function clearModalState() {
    resetTaskForm();
    setAddMode();
}

function formatDueDate(dateValue) {
    if (!dateValue) return "No date";

    const selectedDate = new Date(dateValue);
    const today = new Date();

    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = selectedDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";

    return selectedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short"
    });
}

function isPastDate(dateValue) {
    if (!dateValue) return false;

    const selectedDate = new Date(dateValue);
    const today = new Date();

    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return selectedDate.getTime() < today.getTime();
}

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

    if (normalized === "Completed") {
        return "Completed";
    }

    if (normalized === "Overdue") {
        return "Overdue";
    }

    if (dueDate && isPastDate(dueDate)) {
        return "Overdue";
    }

    if (normalized === "In Progress") {
        return "In Progress";
    }

    return "Pending";
}

function getSubjectName(subject) {
    if (!subject || typeof subject !== "object") return "";
    return subject.name || subject.subjectName || "";
}

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
        subjectName: getSubjectName(subject)
    };
}

function buildTaskPayload(taskData) {
    return {
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: normalizePriority(taskData.priority),
        status: normalizeStatus(taskData.status),
        subjectId: Number(taskData.subjectId)
    };
}

function createSubjectOption(subject) {
    const option = document.createElement("option");
    option.value = String(subject.id);
    option.textContent = subject.name || subject.subjectName || "Unnamed Subject";
    return option;
}

function populateSubjectDropdown(subjects) {
    if (!taskSubjectInput) return;

    taskSubjectInput.innerHTML = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select subject";
    taskSubjectInput.appendChild(placeholderOption);

    subjects.forEach((subject) => {
        taskSubjectInput.appendChild(createSubjectOption(subject));
    });
}

async function handleApiResponse(response) {
    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
            const errorText = await response.text();
            if (errorText) {
                message = errorText;
            }
        } catch (error) {
            console.error("Failed to read error response:", error);
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response.text();
}

async function fetchSubjectsFromApi() {
    const response = await fetch(buildSubjectsApiUrl());
    const data = await handleApiResponse(response);

    if (!Array.isArray(data)) {
        return [];
    }

    return data;
}

async function fetchTasksFromApi() {
    const response = await fetch(buildTasksApiUrl());
    const data = await handleApiResponse(response);

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map(mapBackendTaskToFrontend);
}

async function createTaskInApi(taskData) {
    const response = await fetch(buildTasksApiUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildTaskPayload(taskData))
    });

    return handleApiResponse(response);
}

async function updateTaskInApi(taskId, taskData) {
    const response = await fetch(buildTasksApiUrl(taskId), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildTaskPayload(taskData))
    });

    return handleApiResponse(response);
}

async function deleteTaskFromApi(taskId) {
    const response = await fetch(buildTasksApiUrl(taskId), {
        method: "DELETE"
    });

    return handleApiResponse(response);
}

function updateTaskCounts() {
    if (!tasksList) return;

    const allTaskCards = tasksList.querySelectorAll(".task-card");
    const allStatuses = tasksList.querySelectorAll(".task-status");

    let pending = 0;
    let completed = 0;
    let overdue = 0;

    allStatuses.forEach((statusBadge) => {
        if (statusBadge.classList.contains("pending")) pending++;
        if (statusBadge.classList.contains("done")) completed++;
        if (statusBadge.classList.contains("overdue")) overdue++;
    });

    if (totalTasksCount) {
        totalTasksCount.textContent = String(allTaskCards.length).padStart(2, "0");
    }

    if (pendingTasksCount) {
        pendingTasksCount.textContent = String(pending).padStart(2, "0");
    }

    if (completedTasksCount) {
        completedTasksCount.textContent = String(completed).padStart(2, "0");
    }

    if (overdueTasksCount) {
        overdueTasksCount.textContent = String(overdue).padStart(2, "0");
    }
}

function createTaskCard(task) {
    const taskCard = document.createElement("div");
    taskCard.className = "task-card";
    taskCard.dataset.taskId = task.id;
    taskCard.dataset.subjectId = String(task.subjectId || "");
    taskCard.dataset.description = task.description || "";
    taskCard.dataset.rawStatus = task.status || "Pending";

    const priorityClass = getPriorityClass(task.priority);
    const statusClass = getStatusClass(task.displayStatus);
    const formattedDate = formatDueDate(task.dueDate);

    taskCard.innerHTML = `
        <div class="task-card-top">
            <div class="task-main-info">
                <h3>${task.title}</h3>
                <p>Subject: ${task.subjectName || "No Subject"}</p>
            </div>

            <div class="task-actions">
                <button class="task-action-btn edit" title="Edit">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="task-action-btn delete" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>

        <div class="task-card-meta">
            <span class="task-date" data-date-value="${task.dueDate || ""}">
                <i class="fa-regular fa-calendar"></i> Due: ${formattedDate}
            </span>
            <span class="task-priority ${priorityClass}">${task.priority} Priority</span>
            <span class="task-status ${statusClass}">${task.displayStatus}</span>
        </div>
    `;

    return taskCard;
}

function renderTasks(tasks) {
    if (!tasksList) return;

    tasksList.innerHTML = "";

    tasks.forEach((task) => {
        const taskCard = createTaskCard(task);
        tasksList.appendChild(taskCard);
    });

    updateTaskCounts();
    applyTaskFilters();
}

async function loadSubjectsForTaskForm() {
    try {
        const subjects = await fetchSubjectsFromApi();
        populateSubjectDropdown(subjects);
    } catch (error) {
        console.error("Failed to load subjects for task form:", error);
        populateSubjectDropdown([]);
        alert(`Failed to load subjects for task form: ${error.message}`);
    }
}

async function loadTasks() {
    try {
        const tasks = await fetchTasksFromApi();
        renderTasks(tasks);
        updateEmptyState(tasks.length);
    } catch (error) {
        console.error("Failed to load tasks:", error);

        if (tasksList) {
            tasksList.innerHTML = "";
        }

        updateTaskCounts();
        updateEmptyState(0);
        alert(`Failed to load tasks from backend: ${error.message}`);
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

function matchesFilter(taskCard, filterValue) {
    if (!filterValue || filterValue === "All Tasks") return true;

    const statusBadge = taskCard.querySelector(".task-status");
    const priorityBadge = taskCard.querySelector(".task-priority");

    const statusText = statusBadge?.textContent.trim().toLowerCase() || "";
    const priorityText = priorityBadge?.textContent.trim().toLowerCase() || "";

    if (filterValue === "Pending") return statusText === "pending";
    if (filterValue === "Completed") return statusText === "completed";
    if (filterValue === "High Priority") return priorityText === "high priority";
    if (filterValue === "Overdue") return statusText === "overdue";

    return true;
}

function updateEmptyState(visibleCount) {
    if (!tasksEmptyState) return;

    if (visibleCount === 0) {
        tasksEmptyState.classList.remove("hidden");
    } else {
        tasksEmptyState.classList.add("hidden");
    }
}

function applyTaskFilters() {
    if (!tasksList) return;

    const allTaskCards = tasksList.querySelectorAll(".task-card");
    const searchText = taskSearchInput ? taskSearchInput.value.toLowerCase().trim() : "";
    const filterValue = taskFilterSelect ? taskFilterSelect.value : "All Tasks";

    let visibleCount = 0;

    allTaskCards.forEach((taskCard) => {
        const title = taskCard.querySelector(".task-main-info h3")?.textContent.toLowerCase() || "";
        const subject = taskCard.querySelector(".task-main-info p")?.textContent.toLowerCase() || "";

        const matchesSearch = title.includes(searchText) || subject.includes(searchText);
        const passesFilter = matchesFilter(taskCard, filterValue);

        if (matchesSearch && passesFilter) {
            taskCard.style.display = "";
            visibleCount++;
        } else {
            taskCard.style.display = "none";
        }
    });

    updateEmptyState(visibleCount);
}

function fillFormForEdit(taskCard) {
    const taskId = taskCard.dataset.taskId || "";
    const title = taskCard.querySelector(".task-main-info h3")?.textContent.trim() || "";
    const dueDateValue = taskCard.querySelector(".task-date")?.getAttribute("data-date-value") || "";
    const priorityText = taskCard.querySelector(".task-priority")?.textContent.trim() || "";
    const rawStatus = taskCard.dataset.rawStatus || "Pending";
    const description = taskCard.dataset.description || "";
    const subjectId = taskCard.dataset.subjectId || "";

    editingTaskId = taskId;
    taskTitleInput.value = title;
    taskSubjectInput.value = subjectId;
    taskDateInput.value = dueDateValue;
    taskPriorityInput.value = priorityText.replace(" Priority", "").trim();
    taskStatusInput.value = rawStatus;
    taskDescriptionInput.value = description;
}

async function initializeTaskPage() {
    await loadSubjectsForTaskForm();
    await loadTasks();
    setAddMode();
}

if (
    openTaskModalBtn &&
    taskModalOverlay &&
    closeTaskModalBtn &&
    cancelTaskModalBtn &&
    taskModalForm &&
    tasksList
) {
    openTaskModalBtn.addEventListener("click", function () {
        clearModalState();
        openTaskModal();
    });

    closeTaskModalBtn.addEventListener("click", function () {
        closeTaskModal();
        clearModalState();
    });

    cancelTaskModalBtn.addEventListener("click", function () {
        closeTaskModal();
        clearModalState();
    });

    taskModalOverlay.addEventListener("click", function (event) {
        if (event.target === taskModalOverlay) {
            closeTaskModal();
            clearModalState();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !taskModalOverlay.classList.contains("hidden")) {
            closeTaskModal();
            clearModalState();
        }
    });

    taskModalForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const title = taskTitleInput.value.trim();
        const subjectId = taskSubjectInput.value;
        const dueDate = taskDateInput.value;
        const priority = taskPriorityInput.value;
        const status = taskStatusInput.value;
        const description = taskDescriptionInput.value.trim();

        if (!title) {
            alert("Please enter a task title.");
            return;
        }

        if (!subjectId) {
            alert("Please select a subject.");
            return;
        }

        if (!dueDate) {
            alert("Please select a due date.");
            return;
        }

        if (!description) {
            alert("Please enter task description.");
            return;
        }

        const taskData = {
            title,
            subjectId,
            dueDate,
            priority,
            status,
            description
        };

        try {
            if (editingTaskId) {
                await updateTask(editingTaskId, taskData);
            } else {
                await addTask(taskData);
            }

            closeTaskModal();
            clearModalState();
        } catch (error) {
            console.error("Failed to save task:", error);
            alert(`Failed to save task: ${error.message}`);
        }
    });

    tasksList.addEventListener("click", async function (event) {
        const deleteButton = event.target.closest(".task-action-btn.delete");
        const editButton = event.target.closest(".task-action-btn.edit, .task-action-btn:not(.delete)");

        if (deleteButton) {
            const taskCard = deleteButton.closest(".task-card");
            const taskId = taskCard?.dataset.taskId;

            if (!taskId) return;

            const shouldDelete = confirm("Do you want to delete this task?");
            if (!shouldDelete) return;

            try {
                await deleteTask(taskId);
            } catch (error) {
                console.error("Failed to delete task:", error);
                alert(`Failed to delete task: ${error.message}`);
            }

            return;
        }

        if (editButton) {
            const taskCard = editButton.closest(".task-card");
            if (!taskCard) return;

            setEditMode();
            fillFormForEdit(taskCard);
            openTaskModal();
        }
    });

    if (taskSearchInput) {
        taskSearchInput.addEventListener("input", applyTaskFilters);
    }

    if (taskFilterSelect) {
        taskFilterSelect.addEventListener("change", applyTaskFilters);
    }

    initializeTaskPage();
}