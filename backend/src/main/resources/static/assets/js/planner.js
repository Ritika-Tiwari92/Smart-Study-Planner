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
        ? "/api/subjects"
        : "http://localhost:8080/api/subjects";

let editingPlanId = null;
let allPlans = [];

// ─── AUTH HEADER ──────────────────────────────────────────
function getAuthHeaders(extraHeaders = {}) {
    const token = (localStorage.getItem("token") || "").trim();
    return { "Authorization": `Bearer ${token}`, ...extraHeaders };
}

// ─── URL BUILDERS — FIXED: no ?userId= param ─────────────
function buildPlannerApiUrl(planId = "") {
    const path = planId ? `/${planId}` : "";
    return `${PLANNER_API_BASE_URL}${path}`;
}

function buildSubjectsApiUrl() {
    return SUBJECTS_API_BASE_URL;
}

// ─── API RESPONSE HANDLER ─────────────────────────────────
async function handleApiResponse(response) {
    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const errorText = await response.text();
            if (errorText) message = errorText;
        } catch (error) {}
        throw new Error(message);
    }
    if (response.status === 204) return null;
    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json") ? response.json() : response.text();
}

// ─── MODAL ────────────────────────────────────────────────
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
    if (planSaveBtn)    planSaveBtn.textContent    = "Save Plan";
}

function setEditPlanMode() {
    if (planModalTitle) planModalTitle.textContent = "Edit Study Plan";
    if (planSaveBtn)    planSaveBtn.textContent    = "Update Plan";
}

function resetPlanForm() {
    if (!planModalForm) return;
    planModalForm.reset();
    if (planStatusInput)  planStatusInput.value  = "Pending";
    if (planSubjectInput) planSubjectInput.value = "";
}

function clearPlanModalState() {
    resetPlanForm();
    setAddPlanMode();
}

// ─── HELPERS ──────────────────────────────────────────────
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function formatDateToYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getTodayString()    { return formatDateToYMD(new Date()); }
function getTomorrowString() {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return formatDateToYMD(t);
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
    const [hour, minute] = timeValue.slice(0, 5).split(":").map(Number);
    return (hour || 0) * 60 + (minute || 0);
}

function comparePlansAsc(a, b) {
    const dc = (a.date || "").localeCompare(b.date || "");
    if (dc !== 0) return dc;
    const tc = timeToMinutes(a.time) - timeToMinutes(b.time);
    if (tc !== 0) return tc;
    return (a.id || 0) - (b.id || 0);
}

function formatTime(value) {
    if (!value) return "No Time";
    const [hourStr, minute] = value.slice(0, 5).split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
}

function normalizeTimeForBackend(value) {
    if (!value) return "";
    return value.length === 5 ? `${value}:00` : value;
}

function normalizeTimeForInput(value) {
    return value ? value.slice(0, 5) : "";
}

function getSessionStatusClass(status) {
    const v = (status || "").toLowerCase();
    if (v === "done")        return "done";
    if (v === "in progress") return "progress";
    return "pending";
}

function isThisWeek(dateValue) {
    if (!dateValue) return false;
    const target = parseDateOnly(dateValue);
    if (!target) return false;
    const today = new Date();
    const diff  = today.getDay() === 0 ? -6 : 1 - today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return target >= start && target <= end;
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
    if (dateValue === getTodayString())    return "Today";
    if (dateValue === getTomorrowString()) return "Tomorrow";
    const date = parseDateOnly(dateValue);
    return date ? date.toLocaleDateString("en-US", { weekday: "long" }) : dateValue;
}

function getPlanIconClass(subject, title) {
    const text = `${subject || ""} ${title || ""}`.toLowerCase();
    if (text.includes("java") || text.includes("coding")) return "fa-solid fa-laptop-code";
    if (text.includes("dbms") || text.includes("sql"))    return "fa-solid fa-database";
    if (text.includes("network"))                          return "fa-solid fa-globe";
    if (text.includes("operating") || text.includes("os")) return "fa-solid fa-desktop";
    if (text.includes("test") || text.includes("exam"))   return "fa-solid fa-file-lines";
    return "fa-solid fa-book-open";
}

// ─── SUMMARY CARDS ────────────────────────────────────────
function updateSummaryCards(plans) {
    const today              = getTodayString();
    const weeklyPlans        = plans.filter(p => isThisWeek(p.date));
    const todayPlans         = plans.filter(p => p.date === today);
    const completedToday     = todayPlans.filter(p => (p.status || "").toLowerCase() === "done");
    const completedWeekly    = weeklyPlans.filter(p => (p.status || "").toLowerCase() === "done");
    const focusPct           = weeklyPlans.length > 0
        ? Math.round((completedWeekly.length / weeklyPlans.length) * 100) : 0;

    if (weeklyPlansCount)    weeklyPlansCount.textContent    = String(weeklyPlans.length).padStart(2, "0");
    if (todaySessionsCount)  todaySessionsCount.textContent  = String(todayPlans.length).padStart(2, "0");
    if (completedTodayCount) completedTodayCount.textContent = String(completedToday.length).padStart(2, "0");
    if (weeklyFocusRate)     weeklyFocusRate.textContent     = `${focusPct}%`;
}

// ─── RENDER: SESSION LIST ─────────────────────────────────
function createStudySessionItem(plan) {
    const item = document.createElement("div");
    item.className           = "study-session-item";
    item.dataset.planId      = plan.id;
    item.dataset.date        = plan.date        || "";
    item.dataset.subject     = plan.subject     || "";
    item.dataset.status      = plan.status      || "Pending";
    item.dataset.time        = plan.time        || "";
    item.dataset.description = plan.description || "";

    const statusClass   = getSessionStatusClass(plan.status);
    const formattedTime = formatTime(plan.time);
    const descText      = plan.subject
        ? `${escapeHtml(plan.subject)} • ${escapeHtml(plan.description || "No details added")}`
        : escapeHtml(plan.description || "No details added");

    item.innerHTML = `
        <div class="session-time">${formattedTime}</div>
        <div class="session-info">
            <h4>${escapeHtml(plan.title || "Untitled Plan")}</h4>
            <p>${descText}</p>
        </div>
        <span class="session-badge ${statusClass}">${escapeHtml(plan.status || "Pending")}</span>
        <div class="session-actions">
            <button class="session-action-btn edit"   title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="session-action-btn delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    return item;
}

function renderStudySessionList(plans) {
    if (!studySessionList) return;

    if (plannerEmptyState && plannerEmptyState.parentNode === studySessionList) {
        studySessionList.removeChild(plannerEmptyState);
    }

    studySessionList.innerHTML = "";

    if (plans.length === 0) {
        if (plannerEmptyState) {
            plannerEmptyState.classList.remove("hidden");
            studySessionList.appendChild(plannerEmptyState);
        }
        return;
    }

    if (plannerEmptyState) plannerEmptyState.classList.add("hidden");
    plans.forEach(plan => studySessionList.appendChild(createStudySessionItem(plan)));
}

// ─── RENDER: WEEKLY OVERVIEW ──────────────────────────────
function renderWeeklyOverview(plans) {
    if (!weeklyTargetList) return;
    const weeklyPlans = plans.filter(p => isThisWeek(p.date));
    const subjectMap  = {};

    weeklyPlans.forEach(plan => {
        const name = (plan.subject || "General").trim() || "General";
        if (!subjectMap[name]) subjectMap[name] = { subject: name, total: 0, completed: 0 };
        subjectMap[name].total++;
        if ((plan.status || "").toLowerCase() === "done") subjectMap[name].completed++;
    });

    const stats = Object.values(subjectMap).sort((a, b) => b.total - a.total);

    if (!stats.length) {
        weeklyTargetList.innerHTML = `
            <div class="planner-empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <h3>No weekly data</h3>
                <p>Create study plans for this week to see subject progress.</p>
            </div>`;
        return;
    }

    weeklyTargetList.innerHTML = stats.map(item => {
        const pct = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
        return `
            <div class="weekly-target-item">
                <div class="weekly-target-top">
                    <h4>${escapeHtml(item.subject)}</h4>
                    <span>${item.completed} / ${item.total} sessions</span>
                </div>
                <div class="weekly-progress-bar">
                    <div class="weekly-progress-fill" style="width: ${pct}%;"></div>
                </div>
            </div>`;
    }).join("");
}

// ─── RENDER: UPCOMING PLANS ───────────────────────────────
function renderUpcomingPlans(plans) {
    if (!upcomingPlanList) return;
    const upcoming = [...plans].filter(isUpcomingPlan).sort(comparePlansAsc).slice(0, 3);

    if (!upcoming.length) {
        upcomingPlanList.innerHTML = `
            <div class="planner-empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <h3>No upcoming plans</h3>
                <p>Your future study plans will appear here.</p>
            </div>`;
        return;
    }

    upcomingPlanList.innerHTML = upcoming.map(plan => `
        <div class="upcoming-plan-item">
            <div class="upcoming-plan-icon">
                <i class="${getPlanIconClass(plan.subject, plan.title)}"></i>
            </div>
            <div class="upcoming-plan-info">
                <h4>${escapeHtml(plan.title || "Untitled Plan")}</h4>
                <p>${escapeHtml(getRelativeDateLabel(plan.date))} • ${formatTime(plan.time)}</p>
            </div>
        </div>`).join("");
}

// ─── FILTER ───────────────────────────────────────────────
function matchesPlanFilter(plan, filterValue) {
    if (!filterValue || filterValue === "All Plans") return true;
    const status = (plan.status || "").toLowerCase();
    if (filterValue === "Today")     return plan.date === getTodayString();
    if (filterValue === "This Week") return isThisWeek(plan.date);
    if (filterValue === "Completed") return status === "done";
    if (filterValue === "Pending")   return status === "pending";
    return true;
}

function applyPlanFilters() {
    const search      = planSearchInput  ? planSearchInput.value.toLowerCase().trim() : "";
    const filterValue = planFilterSelect ? planFilterSelect.value : "All Plans";
    const today       = getTodayString();

    let filtered = [...allPlans].filter(plan => {
        const matchSearch = [plan.title, plan.subject, plan.description, plan.status]
            .map(v => (v || "").toLowerCase())
            .some(v => v.includes(search));
        return matchSearch && matchesPlanFilter(plan, filterValue);
    }).sort(comparePlansAsc);

    // Default view: aaj ke plans. Aaj koi nahi toh nearest upcoming.
    if (filterValue === "All Plans" && !search) {
        const todayPlans = filtered.filter(p => p.date === today);
        if (todayPlans.length > 0) {
            filtered = todayPlans;
        } else {
            const upcoming = filtered.filter(p => p.date >= today).slice(0, 5);
            filtered = upcoming.length > 0 ? upcoming : filtered.slice(0, 5);
        }
    }

    renderStudySessionList(filtered);
    renderFocusTips(allPlans);
}

// ─── DYNAMIC FOCUS TIPS ───────────────────────────────────
function renderFocusTips(plans) {
    const focusTipListEl = document.querySelector(".focus-tip-list");
    if (!focusTipListEl) return;

    const today        = getTodayString();
    const todayPlans   = plans.filter(p => p.date === today);
    const weeklyPlans  = plans.filter(p => isThisWeek(p.date));
    const pending      = plans.filter(p => (p.status||"").toLowerCase() === "pending");
    const done         = plans.filter(p => (p.status||"").toLowerCase() === "done");
    const subjects     = [...new Set(weeklyPlans.map(p => p.subject).filter(Boolean))];
    const upcoming     = plans.filter(p => p.date > today).sort(comparePlansAsc);

    const tips = [];

    // Aaj ke plans based tip
    if (todayPlans.length > 0) {
        const names = [...new Set(todayPlans.map(p => p.subject).filter(Boolean))];
        tips.push(`Today you have ${todayPlans.length} session(s) planned${names.length ? " — " + names.slice(0,2).join(", ") : ""}. Stay focused!`);
    } else {
        tips.push("No sessions planned for today. Add a study plan to stay on track.");
    }

    // Pending plans
    if (pending.length > 0) {
        tips.push(`You have ${pending.length} pending plan(s). Try to close at least one session today.`);
    }

    // Weekly progress
    if (weeklyPlans.length > 0) {
        const focusPct = Math.round((done.filter(p => isThisWeek(p.date)).length / weeklyPlans.length) * 100);
        tips.push(`Weekly progress: ${focusPct}% complete. ${focusPct >= 50 ? "Great momentum — keep going!" : "Push harder this week!"}`);
    }

    // Subject variety
    if (subjects.length >= 2) {
        tips.push(`You are covering ${subjects.length} subjects this week: ${subjects.slice(0,3).join(", ")}. Alternate tough and easy ones.`);
    }

    // Next upcoming session
    if (upcoming.length > 0) {
        const next = upcoming[0];
        const label = next.date === getTomorrowString() ? "tomorrow" : next.date;
        tips.push(`Next session: "${next.title}" on ${label} at ${formatTime(next.time)}. Be ready!`);
    }

    // Static fallback tip
    tips.push("Keep 10–15 minute breaks between long sessions for better focus.");

    const finalTips = tips.slice(0, 4);

    focusTipListEl.innerHTML = finalTips.map(tip => `
        <div class="focus-tip-item">
            <i class="fa-solid fa-circle-check"></i>
            <span>${escapeHtml(tip)}</span>
        </div>`).join("");
}

// ─── FILL FORM FOR EDIT ───────────────────────────────────
function fillPlanFormForEdit(sessionItem) {
    editingPlanId              = sessionItem.dataset.planId || null;
    planTitleInput.value       = sessionItem.querySelector(".session-info h4")?.textContent.trim() || "";
    planSubjectInput.value     = sessionItem.dataset.subject     || "";
    planTimeInput.value        = normalizeTimeForInput(sessionItem.dataset.time);
    planDateInput.value        = sessionItem.dataset.date        || "";
    planStatusInput.value      = sessionItem.dataset.status      || "Pending";
    planDescriptionInput.value = sessionItem.dataset.description || "";
}

// ─── API CALLS ────────────────────────────────────────────
async function fetchAllPlans() {
    const res  = await fetch(buildPlannerApiUrl(), { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return Array.isArray(data) ? data : [];
}

async function createPlanApi(planData) {
    const res = await fetch(buildPlannerApiUrl(), {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(planData)
    });
    return handleApiResponse(res);
}

async function updatePlanApi(planId, planData) {
    const res = await fetch(buildPlannerApiUrl(planId), {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(planData)
    });
    return handleApiResponse(res);
}

async function deletePlanApi(planId) {
    const res = await fetch(buildPlannerApiUrl(planId), {
        method: "DELETE",
        headers: getAuthHeaders()
    });
    return handleApiResponse(res);
}

async function fetchAllSubjects() {
    const res  = await fetch(buildSubjectsApiUrl(), { headers: getAuthHeaders() });
    const data = await handleApiResponse(res);
    return Array.isArray(data) ? data : [];
}

async function loadSubjectOptions(selectedValue = "") {
    if (!planSubjectInput) return;
    try {
        const subjects = await fetchAllSubjects();
        planSubjectInput.innerHTML = `<option value="">Select Subject</option>`;
        subjects.forEach(s => {
            const name = (s?.name || s?.subjectName || s?.title || "").trim();
            if (!name) return;
            const opt = document.createElement("option");
            opt.value = opt.textContent = name;
            if (name === selectedValue) opt.selected = true;
            planSubjectInput.appendChild(opt);
        });
        if (selectedValue && ![...planSubjectInput.options].some(o => o.value === selectedValue)) {
            const opt = document.createElement("option");
            opt.value = opt.textContent = selectedValue;
            opt.selected = true;
            planSubjectInput.appendChild(opt);
        }
    } catch (err) {
        console.error("Failed to load subjects:", err);
    }
}

// ─── LOAD ─────────────────────────────────────────────────
async function loadPlans() {
    try {
        const plans = await fetchAllPlans();
        allPlans = Array.isArray(plans) ? plans : [];
        updateSummaryCards(allPlans);
        renderWeeklyOverview(allPlans);
        renderUpcomingPlans(allPlans);
        applyPlanFilters();
    } catch (err) {
        console.error("Error loading plans:", err);
        allPlans = [];
        updateSummaryCards([]);
        renderWeeklyOverview([]);
        renderUpcomingPlans([]);
        applyPlanFilters();
    }
}

async function addPlan(data)              { await createPlanApi(data);         await loadPlans(); }
async function updatePlan(id, data)       { await updatePlanApi(id, data);     await loadPlans(); }
async function deletePlan(id)             { await deletePlanApi(id);           await loadPlans(); }

// ─── EVENT LISTENERS ──────────────────────────────────────
if (openPlanModalBtn) {
    openPlanModalBtn.addEventListener("click", async function () {
        clearPlanModalState();
        await loadSubjectOptions();
        openPlanModal();
    });
}

if (closePlanModalBtn)  closePlanModalBtn.addEventListener("click",  () => { closePlanModal(); clearPlanModalState(); });
if (cancelPlanModalBtn) cancelPlanModalBtn.addEventListener("click", () => { closePlanModal(); clearPlanModalState(); });

if (planModalOverlay) {
    planModalOverlay.addEventListener("click", e => {
        if (e.target === planModalOverlay) { closePlanModal(); clearPlanModalState(); }
    });
}

document.addEventListener("keydown", e => {
    if (e.key === "Escape" && planModalOverlay && !planModalOverlay.classList.contains("hidden")) {
        closePlanModal(); clearPlanModalState();
    }
});

if (planModalForm) {
    planModalForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const title       = planTitleInput.value.trim();
        const subject     = planSubjectInput.value.trim();
        const time        = planTimeInput.value;
        const date        = planDateInput.value;
        const status      = planStatusInput.value;
        const description = planDescriptionInput.value.trim();

        if (!title)   { alert("Please enter a plan title.");    return; }
        if (!subject) { alert("Please select a subject.");      return; }
        if (!time)    { alert("Please select a session time."); return; }
        if (!date)    { alert("Please select a plan date.");    return; }

        const planData = {
            title, subject, date, status,
            time: normalizeTimeForBackend(time),
            description: description || "Study session planned for focused learning."
        };

        try {
            if (planSaveBtn) planSaveBtn.disabled = true;
            if (editingPlanId) { await updatePlan(editingPlanId, planData); }
            else               { await addPlan(planData); }
            closePlanModal();
            clearPlanModalState();
        } catch (err) {
            alert(`Failed to save plan: ${err.message}`);
        } finally {
            if (planSaveBtn) planSaveBtn.disabled = false;
        }
    });
}

if (studySessionList) {
    studySessionList.addEventListener("click", async function (e) {
        const deleteBtn = e.target.closest(".session-action-btn.delete");
        const editBtn   = e.target.closest(".session-action-btn.edit");

        if (deleteBtn) {
            const item   = deleteBtn.closest(".study-session-item");
            const planId = item?.dataset.planId;
            if (!planId) return;
            if (!confirm("Do you want to delete this study plan?")) return;
            try { await deletePlan(planId); }
            catch (err) { alert(`Failed to delete: ${err.message}`); }
            return;
        }

        if (editBtn) {
            const item = editBtn.closest(".study-session-item");
            if (!item) return;
            setEditPlanMode();
            await loadSubjectOptions(item.dataset.subject || "");
            fillPlanFormForEdit(item);
            openPlanModal();
        }
    });
}

if (planSearchInput)  planSearchInput.addEventListener("input",  applyPlanFilters);
if (planFilterSelect) planFilterSelect.addEventListener("change", applyPlanFilters);

// ─── INIT ─────────────────────────────────────────────────
loadPlans();
loadSubjectOptions();
setAddPlanMode();