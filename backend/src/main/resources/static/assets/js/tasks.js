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

const TASKS_STORAGE_KEY = "edumind_tasks";

let editingTaskId = null;

function openTaskModal() {
    taskModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeTaskModal() {
    taskModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

function setAddMode() {
    editingTaskId = null;
    taskModalTitle.textContent = "Add New Task";
    taskSaveBtn.textContent = "Save Task";
}

function setEditMode() {
    taskModalTitle.textContent = "Edit Task";
    taskSaveBtn.textContent = "Update Task";
}

function generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

function getPriorityClass(priority) {
    const value = priority.toLowerCase();
    if (value === "high") return "high";
    if (value === "medium") return "medium";
    return "low";
}

function getStatusClass(status) {
    const value = status.toLowerCase();

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

function updateTaskCounts() {
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

    totalTasksCount.textContent = String(allTaskCards.length).padStart(2, "0");
    pendingTasksCount.textContent = String(pending).padStart(2, "0");
    completedTasksCount.textContent = String(completed).padStart(2, "0");
    overdueTasksCount.textContent = String(overdue).padStart(2, "0");
}

function createTaskCard(task) {
    const taskCard = document.createElement("div");
    taskCard.className = "task-card";
    taskCard.dataset.taskId = task.id;

    const priorityClass = getPriorityClass(task.priority);
    const statusClass = getStatusClass(task.status);
    const formattedDate = formatDueDate(task.dueDate);

    taskCard.innerHTML = `
        <div class="task-card-top">
            <div class="task-main-info">
                <h3>${task.title}</h3>
                <p>Subject: ${task.subject}</p>
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
            <span class="task-status ${statusClass}">${task.status}</span>
        </div>
    `;

    return taskCard;
}

function renderTasks(tasks) {
    tasksList.innerHTML = "";
    tasks.forEach((task) => {
        const taskCard = createTaskCard(task);
        tasksList.appendChild(taskCard);
    });
    updateTaskCounts();
    applyTaskFilters();
}

function getTasksFromStorage() {
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error("Failed to parse tasks from localStorage:", error);
        return null;
    }
}

function saveTasksToStorage(tasks) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function extractTasksFromDOM() {
    const taskCards = tasksList.querySelectorAll(".task-card");
    const tasks = [];

    taskCards.forEach((taskCard) => {
        const title = taskCard.querySelector(".task-main-info h3")?.textContent.trim() || "";
        const subjectText = taskCard.querySelector(".task-main-info p")?.textContent.trim() || "";
        const subject = subjectText.replace("Subject: ", "").trim();

        const dateEl = taskCard.querySelector(".task-date");
        const dueDate = dateEl?.getAttribute("data-date-value") || "";

        const priorityText = taskCard.querySelector(".task-priority")?.textContent.trim() || "";
        const statusText = taskCard.querySelector(".task-status")?.textContent.trim() || "";

        tasks.push({
            id: generateTaskId(),
            title,
            subject,
            dueDate,
            priority: normalizePriority(priorityText),
            status: normalizeStatus(statusText)
        });
    });

    return tasks;
}

function loadTasks() {
    const storedTasks = getTasksFromStorage();

    if (storedTasks && Array.isArray(storedTasks)) {
        renderTasks(storedTasks);
        return;
    }

    const initialTasks = extractTasksFromDOM();
    saveTasksToStorage(initialTasks);
    renderTasks(initialTasks);
}

function getCurrentTasks() {
    return getTasksFromStorage() || [];
}

function addTask(taskData) {
    const tasks = getCurrentTasks();
    const newTask = {
        id: generateTaskId(),
        ...taskData
    };

    tasks.unshift(newTask);
    saveTasksToStorage(tasks);
    renderTasks(tasks);
}

function updateTask(taskId, updatedData) {
    const tasks = getCurrentTasks().map((task) =>
        task.id === taskId ? { ...task, ...updatedData } : task
    );

    saveTasksToStorage(tasks);
    renderTasks(tasks);
}

function deleteTask(taskId) {
    const tasks = getCurrentTasks().filter((task) => task.id !== taskId);
    saveTasksToStorage(tasks);
    renderTasks(tasks);
}

function resetTaskForm() {
    taskModalForm.reset();
    taskSubjectInput.selectedIndex = 0;
    taskPriorityInput.value = "High";
    taskStatusInput.value = "Pending";
}

function clearModalState() {
    resetTaskForm();
    setAddMode();
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
    const subjectText = taskCard.querySelector(".task-main-info p")?.textContent.trim() || "";
    const subject = subjectText.replace("Subject: ", "").trim();

    const dateEl = taskCard.querySelector(".task-date");
    const dueDateValue = dateEl?.getAttribute("data-date-value") || "";

    const priorityText = taskCard.querySelector(".task-priority")?.textContent.trim() || "";
    const statusText = taskCard.querySelector(".task-status")?.textContent.trim() || "";

    const priority = priorityText.replace(" Priority", "").trim();

    editingTaskId = taskId;
    taskTitleInput.value = title;
    taskSubjectInput.value = subject;
    taskDateInput.value = dueDateValue;
    taskPriorityInput.value = priority;
    taskStatusInput.value = statusText;
    taskDescriptionInput.value = "";
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

    taskModalForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = taskTitleInput.value.trim();
        const subject = taskSubjectInput.value;
        const dueDate = taskDateInput.value;
        const priority = taskPriorityInput.value;
        const status = taskStatusInput.value;

        if (!title) {
            alert("Please enter a task title.");
            return;
        }

        if (subject === "Select subject") {
            alert("Please select a subject.");
            return;
        }

        const taskData = {
            title,
            subject,
            dueDate,
            priority,
            status
        };

        if (editingTaskId) {
            updateTask(editingTaskId, taskData);
        } else {
            addTask(taskData);
        }

        closeTaskModal();
        clearModalState();
    });

    tasksList.addEventListener("click", function (event) {
        const deleteButton = event.target.closest(".task-action-btn.delete");
        const editButton = event.target.closest(".task-action-btn.edit, .task-action-btn:not(.delete)");

        if (deleteButton) {
            const taskCard = deleteButton.closest(".task-card");
            const taskId = taskCard?.dataset.taskId;

            if (!taskId) return;

            const shouldDelete = confirm("Do you want to delete this task?");
            if (!shouldDelete) return;

            deleteTask(taskId);
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

    loadTasks();
}