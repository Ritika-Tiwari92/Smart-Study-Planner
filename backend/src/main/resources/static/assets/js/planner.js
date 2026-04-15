const openPlanModalBtn = document.getElementById("openPlanModalBtn");
const planModalOverlay = document.getElementById("planModalOverlay");
const closePlanModalBtn = document.getElementById("closePlanModalBtn");
const cancelPlanModalBtn = document.getElementById("cancelPlanModalBtn");

const planModalForm = document.getElementById("planModalForm");
const planModalTitle = document.getElementById("planModalTitle");
const planSaveBtn = document.getElementById("planSaveBtn");

const studySessionList = document.getElementById("studySessionList");
const plannerEmptyState = document.getElementById("plannerEmptyState");
const planSearchInput = document.getElementById("planSearchInput");
const planFilterSelect = document.getElementById("planFilterSelect");

const weeklyPlansCount = document.getElementById("weeklyPlansCount");
const todaySessionsCount = document.getElementById("todaySessionsCount");
const completedTodayCount = document.getElementById("completedTodayCount");
const weeklyFocusRate = document.getElementById("weeklyFocusRate");

const planTitleInput = document.getElementById("planTitle");
const planSubjectInput = document.getElementById("planSubject");
const planTimeInput = document.getElementById("planTime");
const planDateInput = document.getElementById("planDate");
const planStatusInput = document.getElementById("planStatus");
const planDescriptionInput = document.getElementById("planDescription");

let editingPlanItem = null;

function openPlanModal() {
    if (!planModalOverlay) return;
    planModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closePlanModal() {
    if (!planModalOverlay) return;
    planModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

function setAddPlanMode() {
    editingPlanItem = null;
    if (planModalTitle) planModalTitle.textContent = "Create Study Plan";
    if (planSaveBtn) planSaveBtn.textContent = "Save Plan";
}

function setEditPlanMode() {
    if (planModalTitle) planModalTitle.textContent = "Edit Study Plan";
    if (planSaveBtn) planSaveBtn.textContent = "Update Plan";
}

function resetPlanForm() {
    if (!planModalForm) return;
    planModalForm.reset();
    if (planStatusInput) {
        planStatusInput.value = "Pending";
    }
}

function clearPlanModalState() {
    resetPlanForm();
    setAddPlanMode();
}

function formatTime(value) {
    if (!value) return "No Time";

    const [hourStr, minute] = value.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
}

function getSessionStatusClass(status) {
    const value = status.toLowerCase();

    if (value === "done") return "done";
    if (value === "in progress") return "progress";
    return "pending";
}

function getTodayString() {
    return new Date().toISOString().split("T")[0];
}

function isThisWeek(dateValue) {
    if (!dateValue) return false;

    const target = new Date(dateValue);
    const today = new Date();

    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return target >= startOfWeek && target <= endOfWeek;
}

function updatePlannerCounts() {
    if (!studySessionList) return;

    const sessionItems = studySessionList.querySelectorAll(".study-session-item");
    const sessionBadges = studySessionList.querySelectorAll(".session-badge");

    const totalSessions = sessionItems.length;
    let completed = 0;
    let todayCount = 0;

    sessionItems.forEach((item) => {
        const dateValue = item.dataset.date || "";
        if (dateValue === getTodayString()) {
            todayCount++;
        }
    });

    sessionBadges.forEach((badge) => {
        if (badge.classList.contains("done")) {
            completed++;
        }
    });

    const weeklyCount = totalSessions;
    const focusPercent = totalSessions > 0 ? Math.round((completed / totalSessions) * 100) : 0;

    if (weeklyPlansCount) {
        weeklyPlansCount.textContent = String(weeklyCount).padStart(2, "0");
    }

    if (todaySessionsCount) {
        todaySessionsCount.textContent = String(todayCount).padStart(2, "0");
    }

    if (completedTodayCount) {
        completedTodayCount.textContent = String(completed).padStart(2, "0");
    }

    if (weeklyFocusRate) {
        weeklyFocusRate.textContent = `${focusPercent}%`;
    }
}

function createStudySessionItem({ title, subject, time, date, status, description }) {
    const sessionItem = document.createElement("div");
    sessionItem.className = "study-session-item";
    sessionItem.dataset.date = date || "";
    sessionItem.dataset.subject = subject || "";
    sessionItem.dataset.status = status || "Pending";
    sessionItem.dataset.time = time || "";
    sessionItem.dataset.description = description || "";

    const statusClass = getSessionStatusClass(status);
    const formattedTime = formatTime(time);

    sessionItem.innerHTML = `
        <div class="session-time">${formattedTime}</div>
        <div class="session-info">
            <h4>${title}</h4>
            <p>${subject} • ${description}</p>
        </div>
        <span class="session-badge ${statusClass}">${status}</span>
        <div class="session-actions">
            <button class="session-action-btn edit" title="Edit">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="session-action-btn delete" title="Delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;

    return sessionItem;
}

function updateStudySessionItem(sessionItem, { title, subject, time, date, status, description }) {
    const timeEl = sessionItem.querySelector(".session-time");
    const titleEl = sessionItem.querySelector(".session-info h4");
    const descEl = sessionItem.querySelector(".session-info p");
    const badgeEl = sessionItem.querySelector(".session-badge");

    sessionItem.dataset.date = date || "";
    sessionItem.dataset.subject = subject || "";
    sessionItem.dataset.status = status || "Pending";
    sessionItem.dataset.time = time || "";
    sessionItem.dataset.description = description || "";

    if (timeEl) {
        timeEl.textContent = formatTime(time);
    }

    if (titleEl) {
        titleEl.textContent = title;
    }

    if (descEl) {
        descEl.textContent = `${subject} • ${description}`;
    }

    if (badgeEl) {
        badgeEl.className = `session-badge ${getSessionStatusClass(status)}`;
        badgeEl.textContent = status;
    }
}

function extractDateFromSessionItem(sessionItem) {
    return sessionItem.dataset.date || "";
}

function matchesPlanFilter(sessionItem, filterValue) {
    if (!filterValue || filterValue === "All Plans") return true;

    const status = (sessionItem.dataset.status || "").toLowerCase();
    const dateValue = extractDateFromSessionItem(sessionItem);
    const today = getTodayString();

    if (filterValue === "Today") return dateValue === today;
    if (filterValue === "This Week") return isThisWeek(dateValue);
    if (filterValue === "Completed") return status === "done";
    if (filterValue === "Pending") return status === "pending";

    return true;
}

function updatePlannerEmptyState(visibleCount) {
    if (!plannerEmptyState) return;

    if (visibleCount === 0) {
        plannerEmptyState.classList.remove("hidden");
    } else {
        plannerEmptyState.classList.add("hidden");
    }
}

function applyPlanFilters() {
    if (!studySessionList) return;

    const sessionItems = studySessionList.querySelectorAll(".study-session-item");
    const searchText = planSearchInput ? planSearchInput.value.toLowerCase().trim() : "";
    const filterValue = planFilterSelect ? planFilterSelect.value : "All Plans";

    let visibleCount = 0;

    sessionItems.forEach((sessionItem) => {
        const title = sessionItem.querySelector(".session-info h4")?.textContent.toLowerCase() || "";
        const description = sessionItem.querySelector(".session-info p")?.textContent.toLowerCase() || "";

        const matchesSearch = title.includes(searchText) || description.includes(searchText);
        const passesFilter = matchesPlanFilter(sessionItem, filterValue);

        if (matchesSearch && passesFilter) {
            sessionItem.style.display = "";
            visibleCount++;
        } else {
            sessionItem.style.display = "none";
        }
    });

    updatePlannerEmptyState(visibleCount);
}

function fillPlanFormForEdit(sessionItem) {
    editingPlanItem = sessionItem;

    const title = sessionItem.querySelector(".session-info h4")?.textContent.trim() || "";
    const subject = sessionItem.dataset.subject || "";
    const time = sessionItem.dataset.time || "";
    const date = sessionItem.dataset.date || "";
    const status = sessionItem.dataset.status || "Pending";
    const description = sessionItem.dataset.description || "";

    planTitleInput.value = title;
    planSubjectInput.value = subject;
    planTimeInput.value = time;
    planDateInput.value = date;
    planStatusInput.value = status;
    planDescriptionInput.value = description;
}

if (
    openPlanModalBtn &&
    planModalOverlay &&
    closePlanModalBtn &&
    cancelPlanModalBtn &&
    planModalForm &&
    studySessionList
) {
    openPlanModalBtn.addEventListener("click", function () {
        clearPlanModalState();
        openPlanModal();
    });

    closePlanModalBtn.addEventListener("click", function () {
        closePlanModal();
        clearPlanModalState();
    });

    cancelPlanModalBtn.addEventListener("click", function () {
        closePlanModal();
        clearPlanModalState();
    });

    planModalOverlay.addEventListener("click", function (event) {
        if (event.target === planModalOverlay) {
            closePlanModal();
            clearPlanModalState();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !planModalOverlay.classList.contains("hidden")) {
            closePlanModal();
            clearPlanModalState();
        }
    });

    planModalForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = planTitleInput.value.trim();
        const subject = planSubjectInput.value;
        const time = planTimeInput.value;
        const date = planDateInput.value;
        const status = planStatusInput.value;
        const description = planDescriptionInput.value.trim();

        if (!title) {
            alert("Please enter a plan title.");
            return;
        }

        if (!time) {
            alert("Please select a session time.");
            return;
        }

        if (!date) {
            alert("Please select a plan date.");
            return;
        }

        const finalDescription = description || "Study session planned for focused learning.";

        const planData = {
            title,
            subject,
            time,
            date,
            status,
            description: finalDescription
        };

        if (editingPlanItem) {
            updateStudySessionItem(editingPlanItem, planData);
        } else {
            const newSessionItem = createStudySessionItem(planData);
            studySessionList.prepend(newSessionItem);
        }

        updatePlannerCounts();
        closePlanModal();
        clearPlanModalState();
        applyPlanFilters();
    });

    studySessionList.addEventListener("click", function (event) {
        const deleteButton = event.target.closest(".session-action-btn.delete");
        const editButton = event.target.closest(".session-action-btn.edit");

        if (deleteButton) {
            const sessionItem = deleteButton.closest(".study-session-item");
            if (!sessionItem) return;

            const shouldDelete = confirm("Do you want to delete this study plan?");
            if (!shouldDelete) return;

            sessionItem.remove();
            updatePlannerCounts();
            applyPlanFilters();
            return;
        }

        if (editButton) {
            const sessionItem = editButton.closest(".study-session-item");
            if (!sessionItem) return;

            setEditPlanMode();
            fillPlanFormForEdit(sessionItem);
            openPlanModal();
        }
    });

    if (planSearchInput) {
        planSearchInput.addEventListener("input", applyPlanFilters);
    }

    if (planFilterSelect) {
        planFilterSelect.addEventListener("change", applyPlanFilters);
    }

    updatePlannerCounts();
    setAddPlanMode();
    applyPlanFilters();
}