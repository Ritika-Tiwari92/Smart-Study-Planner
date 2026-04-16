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

const PLANS_STORAGE_KEY = "edumind_plans";

let editingPlanId = null;

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
    editingPlanId = null;
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

function generatePlanId() {
    return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    const value = (status || "").toLowerCase();

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

function createStudySessionItem({ id, title, subject, time, date, status, description }) {
    const sessionItem = document.createElement("div");
    sessionItem.className = "study-session-item";
    sessionItem.dataset.planId = id;
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

function renderPlans(plans) {
    studySessionList.innerHTML = "";
    plans.forEach((plan) => {
        const sessionItem = createStudySessionItem(plan);
        studySessionList.appendChild(sessionItem);
    });
    updatePlannerCounts();
    applyPlanFilters();
}

function getPlansFromStorage() {
    const saved = localStorage.getItem(PLANS_STORAGE_KEY);
    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error("Failed to parse plans from localStorage:", error);
        return null;
    }
}

function savePlansToStorage(plans) {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
}

function parseTimeTo24Hour(timeText) {
    if (!timeText) return "";

    const match = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return "";

    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    return `${String(hour).padStart(2, "0")}:${minute}`;
}

function extractPlansFromDOM() {
    const sessionItems = studySessionList.querySelectorAll(".study-session-item");
    const plans = [];

    sessionItems.forEach((sessionItem) => {
        const title = sessionItem.querySelector(".session-info h4")?.textContent.trim() || "";
        const descriptionText = sessionItem.querySelector(".session-info p")?.textContent.trim() || "";
        const timeText = sessionItem.querySelector(".session-time")?.textContent.trim() || "";
        const statusText = sessionItem.querySelector(".session-badge")?.textContent.trim() || "Pending";

        let subject = "";
        let description = descriptionText;

        if (descriptionText.includes("•")) {
            const parts = descriptionText.split("•");
            subject = parts[0]?.trim() || "";
            description = parts.slice(1).join("•").trim() || "";
        }

        plans.push({
            id: generatePlanId(),
            title,
            subject,
            time: parseTimeTo24Hour(timeText),
            date: getTodayString(),
            status: statusText,
            description
        });
    });

    return plans;
}

function loadPlans() {
    const storedPlans = getPlansFromStorage();

    if (storedPlans && Array.isArray(storedPlans)) {
        renderPlans(storedPlans);
        return;
    }

    const initialPlans = extractPlansFromDOM();
    savePlansToStorage(initialPlans);
    renderPlans(initialPlans);
}

function getCurrentPlans() {
    return getPlansFromStorage() || [];
}

function addPlan(planData) {
    const plans = getCurrentPlans();
    const newPlan = {
        id: generatePlanId(),
        ...planData
    };

    plans.unshift(newPlan);
    savePlansToStorage(plans);
    renderPlans(plans);
}

function updatePlan(planId, updatedData) {
    const plans = getCurrentPlans().map((plan) =>
        plan.id === planId ? { ...plan, ...updatedData } : plan
    );

    savePlansToStorage(plans);
    renderPlans(plans);
}

function deletePlan(planId) {
    const plans = getCurrentPlans().filter((plan) => plan.id !== planId);
    savePlansToStorage(plans);
    renderPlans(plans);
}

function matchesPlanFilter(sessionItem, filterValue) {
    if (!filterValue || filterValue === "All Plans") return true;

    const status = (sessionItem.dataset.status || "").toLowerCase();
    const dateValue = sessionItem.dataset.date || "";
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
    editingPlanId = sessionItem.dataset.planId || null;

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

        if (editingPlanId) {
            updatePlan(editingPlanId, planData);
        } else {
            addPlan(planData);
        }

        closePlanModal();
        clearPlanModalState();
    });

    studySessionList.addEventListener("click", function (event) {
        const deleteButton = event.target.closest(".session-action-btn.delete");
        const editButton = event.target.closest(".session-action-btn.edit");

        if (deleteButton) {
            const sessionItem = deleteButton.closest(".study-session-item");
            const planId = sessionItem?.dataset.planId;

            if (!planId) return;

            const shouldDelete = confirm("Do you want to delete this study plan?");
            if (!shouldDelete) return;

            deletePlan(planId);
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

    loadPlans();
    setAddPlanMode();
}