const openPlanModalBtn = document.getElementById("openPlanModalBtn");
const planModalOverlay = document.getElementById("planModalOverlay");
const closePlanModalBtn = document.getElementById("closePlanModalBtn");
const cancelPlanModalBtn = document.getElementById("cancelPlanModalBtn");

const planModalForm = document.getElementById("planModalForm");
const planModalTitle = document.getElementById("planModalTitle");
const planSaveBtn = document.getElementById("planSaveBtn");

const studySessionList = document.getElementById("studySessionList");
const plannerEmptyState = document.getElementById("plannerEmptyState");
const weeklyTargetList = document.getElementById("weeklyTargetList");
const upcomingPlanList = document.getElementById("upcomingPlanList");

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

const PLANNER_API_BASE_URL =
    window.location.port === "8080"
        ? "/api/plans"
        : "http://localhost:8080/api/plans";

const SUBJECTS_API_BASE_URL =
    window.location.port === "8080"
        ? "/subjects"
        : "http://localhost:8080/subjects";

let editingPlanId = null;
let allPlans = [];

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

function buildPlannerApiUrl(planId = "") {
    const userId = getCurrentUserId();
    const normalizedPath = planId ? `/${planId}` : "";
    return `${PLANNER_API_BASE_URL}${normalizedPath}?userId=${encodeURIComponent(userId)}`;
}

function buildSubjectsApiUrl() {
    const userId = getCurrentUserId();
    return `${SUBJECTS_API_BASE_URL}?userId=${encodeURIComponent(userId)}`;
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

    if (planSubjectInput) {
        planSubjectInput.value = "";
    }
}

function clearPlanModalState() {
    resetPlanForm();
    setAddPlanMode();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
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

function getTomorrowString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateToYMD(tomorrow);
}

function parseDateOnly(dateValue) {
    if (!dateValue) return null;
    return new Date(`${dateValue}T00:00:00`);
}

function getCurrentMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(timeValue) {
    if (!timeValue) return 0;
    const normalized = timeValue.slice(0, 5);
    const [hour, minute] = normalized.split(":").map(Number);
    return (hour || 0) * 60 + (minute || 0);
}

function comparePlansAsc(a, b) {
    const dateCompare = (a.date || "").localeCompare(b.date || "");
    if (dateCompare !== 0) return dateCompare;

    const timeCompare = timeToMinutes(a.time) - timeToMinutes(b.time);
    if (timeCompare !== 0) return timeCompare;

    return (a.id || 0) - (b.id || 0);
}

function formatTime(value) {
    if (!value) return "No Time";

    const normalized = value.slice(0, 5);
    const [hourStr, minute] = normalized.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
}

function normalizeTimeForBackend(value) {
    if (!value) return "";
    if (value.length === 5) {
        return `${value}:00`;
    }
    return value;
}

function normalizeTimeForInput(value) {
    if (!value) return "";
    return value.slice(0, 5);
}

function getSessionStatusClass(status) {
    const value = (status || "").toLowerCase();

    if (value === "done") return "done";
    if (value === "in progress") return "progress";
    return "pending";
}

function isThisWeek(dateValue) {
    if (!dateValue) return false;

    const target = parseDateOnly(dateValue);
    if (!target) return false;

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

function isUpcomingPlan(plan) {
    if (!plan?.date) return false;

    const today = getTodayString();

    if (plan.date > today) return true;
    if (plan.date < today) return false;

    return timeToMinutes(plan.time) >= getCurrentMinutes();
}

function getRelativeDateLabel(dateValue) {
    if (!dateValue) return "Scheduled";

    if (dateValue === getTodayString()) return "Today";
    if (dateValue === getTomorrowString()) return "Tomorrow";

    const date = parseDateOnly(dateValue);
    if (!date) return dateValue;

    return date.toLocaleDateString("en-US", { weekday: "long" });
}

function getPlanIconClass(subject, title) {
    const text = `${subject || ""} ${title || ""}`.toLowerCase();

    if (text.includes("java") || text.includes("coding") || text.includes("code")) {
        return "fa-solid fa-laptop-code";
    }

    if (text.includes("dbms") || text.includes("sql") || text.includes("database")) {
        return "fa-solid fa-database";
    }

    if (text.includes("network")) {
        return "fa-solid fa-globe";
    }

    if (text.includes("operating") || text.includes("os") || text.includes("system")) {
        return "fa-solid fa-desktop";
    }

    if (text.includes("test") || text.includes("exam")) {
        return "fa-solid fa-file-lines";
    }

    return "fa-solid fa-book-open";
}

function updateSummaryCards(plans) {
    const today = getTodayString();
    const weeklyPlans = plans.filter((plan) => isThisWeek(plan.date));
    const todayPlans = plans.filter((plan) => plan.date === today);
    const completedTodayPlans = todayPlans.filter(
        (plan) => (plan.status || "").toLowerCase() === "done"
    );
    const completedWeeklyPlans = weeklyPlans.filter(
        (plan) => (plan.status || "").toLowerCase() === "done"
    );

    const focusPercent =
        weeklyPlans.length > 0
            ? Math.round((completedWeeklyPlans.length / weeklyPlans.length) * 100)
            : 0;

    if (weeklyPlansCount) {
        weeklyPlansCount.textContent = String(weeklyPlans.length).padStart(2, "0");
    }

    if (todaySessionsCount) {
        todaySessionsCount.textContent = String(todayPlans.length).padStart(2, "0");
    }

    if (completedTodayCount) {
        completedTodayCount.textContent = String(completedTodayPlans.length).padStart(2, "0");
    }

    if (weeklyFocusRate) {
        weeklyFocusRate.textContent = `${focusPercent}%`;
    }
}

function createStudySessionItem(plan) {
    const sessionItem = document.createElement("div");
    sessionItem.className = "study-session-item";
    sessionItem.dataset.planId = plan.id;
    sessionItem.dataset.date = plan.date || "";
    sessionItem.dataset.subject = plan.subject || "";
    sessionItem.dataset.status = plan.status || "Pending";
    sessionItem.dataset.time = plan.time || "";
    sessionItem.dataset.description = plan.description || "";

    const statusClass = getSessionStatusClass(plan.status);
    const formattedTime = formatTime(plan.time);
    const descriptionText = plan.subject
        ? `${escapeHtml(plan.subject)} • ${escapeHtml(plan.description || "No details added")}`
        : escapeHtml(plan.description || "No details added");

    sessionItem.innerHTML = `
        <div class="session-time">${formattedTime}</div>
        <div class="session-info">
            <h4>${escapeHtml(plan.title || "Untitled Plan")}</h4>
            <p>${descriptionText}</p>
        </div>
        <span class="session-badge ${statusClass}">${escapeHtml(plan.status || "Pending")}</span>
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

function renderStudySessionList(plans) {
    if (!studySessionList) return;

    studySessionList.innerHTML = "";

    plans.forEach((plan) => {
        const sessionItem = createStudySessionItem(plan);
        studySessionList.appendChild(sessionItem);
    });

    if (plannerEmptyState) {
        plannerEmptyState.classList.toggle("hidden", plans.length > 0);
        studySessionList.appendChild(plannerEmptyState);
    }
}

function renderWeeklyOverview(plans) {
    if (!weeklyTargetList) return;

    const weeklyPlans = plans.filter((plan) => isThisWeek(plan.date));
    const subjectMap = {};

    weeklyPlans.forEach((plan) => {
        const subjectName = (plan.subject || "General").trim() || "General";
        const normalizedStatus = (plan.status || "").toLowerCase();

        if (!subjectMap[subjectName]) {
            subjectMap[subjectName] = {
                subject: subjectName,
                total: 0,
                completed: 0
            };
        }

        subjectMap[subjectName].total += 1;

        if (normalizedStatus === "done") {
            subjectMap[subjectName].completed += 1;
        }
    });

    const subjectStats = Object.values(subjectMap).sort((a, b) => b.total - a.total);

    if (subjectStats.length === 0) {
        weeklyTargetList.innerHTML = `
            <div class="planner-empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <h3>No weekly data</h3>
                <p>Create study plans for this week to see subject progress.</p>
            </div>
        `;
        return;
    }

    weeklyTargetList.innerHTML = subjectStats
        .map((item) => {
            const percent = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;

            return `
                <div class="weekly-target-item">
                    <div class="weekly-target-top">
                        <h4>${escapeHtml(item.subject)}</h4>
                        <span>${item.completed} / ${item.total} sessions</span>
                    </div>
                    <div class="weekly-progress-bar">
                        <div class="weekly-progress-fill" style="width: ${percent}%;"></div>
                    </div>
                </div>
            `;
        })
        .join("");
}

function createUpcomingPlanItem(plan) {
    const iconClass = getPlanIconClass(plan.subject, plan.title);
    const relativeDate = getRelativeDateLabel(plan.date);
    const formattedTime = formatTime(plan.time);

    return `
        <div class="upcoming-plan-item">
            <div class="upcoming-plan-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="upcoming-plan-info">
                <h4>${escapeHtml(plan.title || "Untitled Plan")}</h4>
                <p>${escapeHtml(relativeDate)} • ${formattedTime}</p>
            </div>
        </div>
    `;
}

function renderUpcomingPlans(plans) {
    if (!upcomingPlanList) return;

    const upcomingPlans = [...plans]
        .filter((plan) => isUpcomingPlan(plan))
        .sort(comparePlansAsc)
        .slice(0, 3);

    if (upcomingPlans.length === 0) {
        upcomingPlanList.innerHTML = `
            <div class="planner-empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <h3>No upcoming plans</h3>
                <p>Your future study plans will appear here.</p>
            </div>
        `;
        return;
    }

    upcomingPlanList.innerHTML = upcomingPlans
        .map((plan) => createUpcomingPlanItem(plan))
        .join("");
}

function matchesPlanFilter(plan, filterValue) {
    if (!filterValue || filterValue === "All Plans") return true;

    const status = (plan.status || "").toLowerCase();
    const dateValue = plan.date || "";
    const today = getTodayString();

    if (filterValue === "Today") return dateValue === today;
    if (filterValue === "This Week") return isThisWeek(dateValue);
    if (filterValue === "Completed") return status === "done";
    if (filterValue === "Pending") return status === "pending";

    return true;
}

function applyPlanFilters() {
    const searchText = planSearchInput ? planSearchInput.value.toLowerCase().trim() : "";
    const filterValue = planFilterSelect ? planFilterSelect.value : "All Plans";

    const filteredPlans = [...allPlans]
        .filter((plan) => {
            const title = (plan.title || "").toLowerCase();
            const subject = (plan.subject || "").toLowerCase();
            const description = (plan.description || "").toLowerCase();
            const status = (plan.status || "").toLowerCase();

            const matchesSearch =
                title.includes(searchText) ||
                subject.includes(searchText) ||
                description.includes(searchText) ||
                status.includes(searchText);

            const passesFilter = matchesPlanFilter(plan, filterValue);

            return matchesSearch && passesFilter;
        })
        .sort(comparePlansAsc);

    renderStudySessionList(filteredPlans);
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
    planTimeInput.value = normalizeTimeForInput(time);
    planDateInput.value = date;
    planStatusInput.value = status;
    planDescriptionInput.value = description;
}

async function fetchAllPlans() {
    const response = await fetch(buildPlannerApiUrl());
    const data = await handleApiResponse(response);
    return Array.isArray(data) ? data : [];
}

async function createPlanApi(planData) {
    const response = await fetch(buildPlannerApiUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(planData)
    });

    return handleApiResponse(response);
}

async function updatePlanApi(planId, planData) {
    const response = await fetch(buildPlannerApiUrl(planId), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(planData)
    });

    return handleApiResponse(response);
}

async function deletePlanApi(planId) {
    const response = await fetch(buildPlannerApiUrl(planId), {
        method: "DELETE"
    });

    return handleApiResponse(response);
}

async function fetchAllSubjects() {
    const response = await fetch(buildSubjectsApiUrl());
    const data = await handleApiResponse(response);
    return Array.isArray(data) ? data : [];
}

function getSubjectDisplayName(subject) {
    return (
        subject?.name ||
        subject?.subjectName ||
        subject?.title ||
        ""
    ).trim();
}

async function loadSubjectOptions(selectedValue = "") {
    if (!planSubjectInput) return;

    try {
        const subjects = await fetchAllSubjects();

        planSubjectInput.innerHTML = `<option value="">Select Subject</option>`;

        subjects.forEach((subject) => {
            const subjectName = getSubjectDisplayName(subject);
            if (!subjectName) return;

            const option = document.createElement("option");
            option.value = subjectName;
            option.textContent = subjectName;

            if (subjectName === selectedValue) {
                option.selected = true;
            }

            planSubjectInput.appendChild(option);
        });

        if (
            selectedValue &&
            !Array.from(planSubjectInput.options).some(
                (option) => option.value === selectedValue
            )
        ) {
            const fallbackOption = document.createElement("option");
            fallbackOption.value = selectedValue;
            fallbackOption.textContent = selectedValue;
            fallbackOption.selected = true;
            planSubjectInput.appendChild(fallbackOption);
        }
    } catch (error) {
        console.error("Error loading subjects:", error);
        alert(`Failed to load subjects: ${error.message}`);
    }
}

async function loadPlans() {
    try {
        const plans = await fetchAllPlans();
        allPlans = Array.isArray(plans) ? plans : [];

        updateSummaryCards(allPlans);
        renderWeeklyOverview(allPlans);
        renderUpcomingPlans(allPlans);
        applyPlanFilters();
    } catch (error) {
        console.error("Error loading plans:", error);
        allPlans = [];
        updateSummaryCards(allPlans);
        renderWeeklyOverview(allPlans);
        renderUpcomingPlans(allPlans);
        applyPlanFilters();
        alert(`Failed to load plans: ${error.message}`);
    }
}

async function addPlan(planData) {
    await createPlanApi(planData);
    await loadPlans();
}

async function updatePlan(planId, updatedData) {
    await updatePlanApi(planId, updatedData);
    await loadPlans();
}

async function deletePlan(planId) {
    await deletePlanApi(planId);
    await loadPlans();
}

if (
    openPlanModalBtn &&
    planModalOverlay &&
    closePlanModalBtn &&
    cancelPlanModalBtn &&
    planModalForm &&
    studySessionList
) {
    openPlanModalBtn.addEventListener("click", async function () {
        clearPlanModalState();
        await loadSubjectOptions();
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

    planModalForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const title = planTitleInput.value.trim();
        const subject = planSubjectInput.value.trim();
        const time = planTimeInput.value;
        const date = planDateInput.value;
        const status = planStatusInput.value;
        const description = planDescriptionInput.value.trim();

        if (!title) {
            alert("Please enter a plan title.");
            return;
        }

        if (!subject) {
            alert("Please select a subject.");
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
            time: normalizeTimeForBackend(time),
            date,
            status,
            description: finalDescription
        };

        try {
            if (planSaveBtn) {
                planSaveBtn.disabled = true;
            }

            if (editingPlanId) {
                await updatePlan(editingPlanId, planData);
            } else {
                await addPlan(planData);
            }

            closePlanModal();
            clearPlanModalState();
        } catch (error) {
            console.error("Error saving plan:", error);
            alert(`Failed to save plan: ${error.message}`);
        } finally {
            if (planSaveBtn) {
                planSaveBtn.disabled = false;
            }
        }
    });

    studySessionList.addEventListener("click", async function (event) {
        const deleteButton = event.target.closest(".session-action-btn.delete");
        const editButton = event.target.closest(".session-action-btn.edit");

        if (deleteButton) {
            const sessionItem = deleteButton.closest(".study-session-item");
            const planId = sessionItem?.dataset.planId;

            if (!planId) return;

            const shouldDelete = confirm("Do you want to delete this study plan?");
            if (!shouldDelete) return;

            try {
                await deletePlan(planId);
            } catch (error) {
                console.error("Error deleting plan:", error);
                alert(`Failed to delete plan: ${error.message}`);
            }

            return;
        }

        if (editButton) {
            const sessionItem = editButton.closest(".study-session-item");
            if (!sessionItem) return;

            setEditPlanMode();

            const selectedSubject = sessionItem.dataset.subject || "";
            await loadSubjectOptions(selectedSubject);

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
    loadSubjectOptions();
    setAddPlanMode();
}