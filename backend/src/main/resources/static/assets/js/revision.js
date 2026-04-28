const openRevisionModalBtn   = document.getElementById("openRevisionModalBtn");
const revisionModalOverlay   = document.getElementById("revisionModalOverlay");
const closeRevisionModalBtn  = document.getElementById("closeRevisionModalBtn");
const cancelRevisionModalBtn = document.getElementById("cancelRevisionModalBtn");
const revisionModalForm      = document.getElementById("revisionModalForm");
const revisionModalTitle     = document.getElementById("revisionModalTitle");
const revisionSaveBtn        = document.getElementById("revisionSaveBtn");

const revisionTopicList    = document.getElementById("revisionTopicList");
const revisionEmptyState   = document.getElementById("revisionEmptyState");
const revisionSearchInput  = document.getElementById("revisionSearchInput");
const revisionFilterSelect = document.getElementById("revisionFilterSelect");

const totalRevisionCount          = document.getElementById("totalRevisionCount");
const revisionDueTodayCount       = document.getElementById("revisionDueTodayCount");
const revisionCompletedTodayCount = document.getElementById("revisionCompletedTodayCount");
const revisionProgressCount       = document.getElementById("revisionProgressCount");

const revisionScheduleList        = document.getElementById("revisionScheduleList");
const revisionScheduleEmptyState  = document.getElementById("revisionScheduleEmptyState");
const weakAreaList                = document.getElementById("weakAreaList");
const weakAreaEmptyState          = document.getElementById("weakAreaEmptyState");
const revisionTipList             = document.getElementById("revisionTipList");
const revisionTipEmptyState       = document.getElementById("revisionTipEmptyState");

const revisionTopicTitleInput  = document.getElementById("revisionTopicTitle");
const revisionSubjectInput     = document.getElementById("revisionSubject");
const revisionPriorityInput    = document.getElementById("revisionPriority");
const revisionDateInput        = document.getElementById("revisionDate");
const revisionStatusInput      = document.getElementById("revisionStatus");
const revisionDescriptionInput = document.getElementById("revisionDescription");

// ─── API URLs ────────────────────────────────────────────
const REVISION_API_URL = window.location.port === "8080"
    ? "/api/revisions"
    : "http://localhost:8080/api/revisions";

const SUBJECTS_API_URL = window.location.port === "8080"
    ? "/api/subjects"
    : "http://localhost:8080/api/subjects";

let editingRevisionId  = null;
let allRevisionTopics  = [];
let allSubjects        = [];

// ─── AUTH HEADER ─────────────────────────────────────────
function getToken() {
    return (localStorage.getItem("token") || "").trim();
}

function authHeader() {
    return { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" };
}

// ─── GET USER ID ─────────────────────────────────────────
function getCurrentUserId() {
    // 1. Direct userId
    const uid = localStorage.getItem("userId");
    if (uid) return Number(uid);

    // 2. edumind_logged_in_user object
    try {
        const raw = localStorage.getItem("edumind_logged_in_user");
        if (raw) {
            const u = JSON.parse(raw);
            if (u && u.id) return Number(u.id);
        }
    } catch (e) {}

    // 3. JWT payload
    const token = getToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const id = payload.userId || payload.id;
            if (id && !isNaN(Number(id))) return Number(id);
        } catch (e) {}
    }

    throw new Error("User ID not found. Please login again.");
}

// ─── URL BUILDERS ────────────────────────────────────────
function buildRevisionApiUrl(revisionId = "") {
    const path = revisionId ? `/${revisionId}` : "";
    return `${REVISION_API_URL}${path}`;
}

function buildSubjectsApiUrl() {
    return SUBJECTS_API_URL; // JWT se user milega — userId nahi chahiye
}

// ─── API REQUEST HELPER ──────────────────────────────────
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        headers: authHeader(),
        ...options
    });

    if (!response.ok) {
        let msg = `Request failed (${response.status})`;
        try { const t = await response.text(); if (t) msg = t; } catch(e) {}
        throw new Error(msg);
    }

    if (response.status === 204) return null;
    const ct = response.headers.get("content-type") || "";
    return ct.includes("application/json") ? response.json() : response.text();
}

// ─── MODAL OPEN / CLOSE ──────────────────────────────────
function openRevisionModal() {
    if (!revisionModalOverlay) return;
    revisionModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeRevisionModal() {
    if (!revisionModalOverlay) return;
    revisionModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

function setAddRevisionMode() {
    editingRevisionId = null;
    if (revisionModalTitle) revisionModalTitle.textContent = "Add Revision Topic";
    if (revisionSaveBtn)    revisionSaveBtn.textContent    = "Save Revision";
}

function setEditRevisionMode() {
    if (revisionModalTitle) revisionModalTitle.textContent = "Edit Revision Topic";
    if (revisionSaveBtn)    revisionSaveBtn.textContent    = "Update Revision";
}

function resetRevisionForm() {
    if (!revisionModalForm) return;
    revisionModalForm.reset();
    if (revisionPriorityInput) revisionPriorityInput.value = "Weak Topic";
    if (revisionStatusInput)   revisionStatusInput.value   = "Pending";
}

function clearRevisionModalState() {
    resetRevisionForm();
    setAddRevisionMode();
}

// ─── DATE HELPERS ────────────────────────────────────────
function getTodayString()    { return new Date().toISOString().split("T")[0]; }
function getTomorrowString() {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return t.toISOString().split("T")[0];
}

function formatDateLabel(dateString) {
    if (!dateString) return "No Date";
    if (dateString === getTodayString())    return "Today";
    if (dateString === getTomorrowString()) return "Tomorrow";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// ─── TOPIC HELPERS ───────────────────────────────────────
function normalizeRevisionTopic(topic) {
    return {
        id:          topic?.id ?? null,
        title:       String(topic?.title       || "").trim(),
        subject:     String(topic?.subject     || "").trim(),
        priority:    String(topic?.priority    || "Pending").trim(),
        date:        String(topic?.date || topic?.revisionDate || "").trim(),
        status:      String(topic?.status      || "Pending").trim(),
        description: String(topic?.description || "").trim()
    };
}

function convertToRequestBody(topic) {
    const n = normalizeRevisionTopic(topic);
    return {
        title:        n.title,
        subject:      n.subject,
        priority:     n.priority,
        revisionDate: n.date,
        status:       n.status,
        description:  n.description
    };
}

function isCompletedTopic(topic) {
    const s = (topic?.status   || "").toLowerCase();
    const p = (topic?.priority || "").toLowerCase();
    return s === "completed" || p === "completed";
}

function isWeakTopic(topic) {
    const s = (topic?.status   || "").toLowerCase();
    const p = (topic?.priority || "").toLowerCase();
    return s === "weak topic" || p === "weak topic";
}

function isPendingTopic(topic) { return !isCompletedTopic(topic) && !isWeakTopic(topic); }

function getEffectiveBadgeText(topic) {
    if (isCompletedTopic(topic)) return "Completed";
    if (isWeakTopic(topic))      return "Weak Topic";
    return "Pending";
}

function getRevisionBadgeClass(topic) {
    if (isCompletedTopic(topic)) return "done";
    if (isWeakTopic(topic))      return "weak";
    return "pending";
}

// ─── EMPTY STATE ─────────────────────────────────────────
function resetDynamicContainer(container, emptyState) {
    if (!container) return;
    container.innerHTML = "";
    if (emptyState) { emptyState.classList.add("hidden"); container.appendChild(emptyState); }
}

function showEmptyState(emptyState, shouldShow) {
    if (!emptyState) return;
    emptyState.classList.toggle("hidden", !shouldShow);
}

// ─── COUNTS ──────────────────────────────────────────────
function updateRevisionCounts(topics = allRevisionTopics) {
    const today          = getTodayString();
    const total          = topics.length;
    const dueToday       = topics.filter(t => t.date === today).length;
    const completedToday = topics.filter(t => t.date === today && isCompletedTopic(t)).length;
    const totalCompleted = topics.filter(t => isCompletedTopic(t)).length;
    const progress       = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

    if (totalRevisionCount)          totalRevisionCount.textContent          = String(total).padStart(2,"0");
    if (revisionDueTodayCount)       revisionDueTodayCount.textContent       = String(dueToday).padStart(2,"0");
    if (revisionCompletedTodayCount) revisionCompletedTodayCount.textContent = String(completedToday).padStart(2,"0");
    if (revisionProgressCount)       revisionProgressCount.textContent       = `${progress}%`;
}

// ─── RENDER: TOPIC LIST ──────────────────────────────────
function createRevisionTopicItem(topicData) {
    const topic    = normalizeRevisionTopic(topicData);
    const item     = document.createElement("div");
    item.className = "revision-topic-item";
    item.dataset.revisionId  = topic.id;
    item.dataset.date        = topic.date;
    item.dataset.subject     = topic.subject;
    item.dataset.priority    = topic.priority;
    item.dataset.status      = topic.status;
    item.dataset.description = topic.description;

    let subText = `Subject: ${topic.subject || "No Subject"}`;
    if (topic.description) subText += ` • ${topic.description}`;
    if (topic.date)        subText += ` • Revision date: ${topic.date}`;

    item.innerHTML = `
        <div class="revision-topic-info">
            <h4>${topic.title || "Untitled Topic"}</h4>
            <p>${subText}</p>
        </div>
        <span class="revision-topic-badge ${getRevisionBadgeClass(topic)}">${getEffectiveBadgeText(topic)}</span>
        <div class="revision-topic-actions">
            <button class="revision-topic-action-btn edit"   title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="revision-topic-action-btn delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    return item;
}

function renderRevisionTopics(topics) {
    if (!revisionTopicList) return;
    resetDynamicContainer(revisionTopicList, revisionEmptyState);
    topics.forEach(t => {
        const item = createRevisionTopicItem(t);
        revisionEmptyState
            ? revisionTopicList.insertBefore(item, revisionEmptyState)
            : revisionTopicList.appendChild(item);
    });
    applyRevisionFilters();
    updateRevisionCounts(allRevisionTopics);
}

// ─── RENDER: SCHEDULE ────────────────────────────────────
function renderRevisionSchedule(topics = allRevisionTopics) {
    if (!revisionScheduleList) return;
    resetDynamicContainer(revisionScheduleList, revisionScheduleEmptyState);
    const scheduled = [...topics]
        .filter(t => t.date && !isCompletedTopic(t))
        .sort((a,b) => (a.date||"").localeCompare(b.date||""))
        .slice(0, 5);
    scheduled.forEach(t => {
        const item = document.createElement("div");
        item.className = "revision-schedule-item";
        item.innerHTML = `
            <div class="revision-schedule-time">${formatDateLabel(t.date)}</div>
            <div class="revision-schedule-info">
                <h4>${t.title || "Untitled Topic"}</h4>
                <p>${[t.subject, t.description || getEffectiveBadgeText(t)].filter(Boolean).join(" • ")}</p>
            </div>`;
        revisionScheduleEmptyState
            ? revisionScheduleList.insertBefore(item, revisionScheduleEmptyState)
            : revisionScheduleList.appendChild(item);
    });
    showEmptyState(revisionScheduleEmptyState, scheduled.length === 0);
}

// ─── RENDER: WEAK AREAS ──────────────────────────────────
function renderWeakAreas(topics = allRevisionTopics) {
    if (!weakAreaList) return;
    resetDynamicContainer(weakAreaList, weakAreaEmptyState);
    const weak = topics.filter(t => isWeakTopic(t)).slice(0, 6);
    weak.forEach(t => {
        const item = document.createElement("div");
        item.className = "weak-area-item";
        item.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>
            <span>${t.title || "Untitled"}${t.subject ? ` • ${t.subject}` : ""}</span>`;
        weakAreaEmptyState
            ? weakAreaList.insertBefore(item, weakAreaEmptyState)
            : weakAreaList.appendChild(item);
    });
    showEmptyState(weakAreaEmptyState, weak.length === 0);
}

// ─── RENDER: TIPS ────────────────────────────────────────
function generateDynamicRevisionTips(topics = allRevisionTopics) {
    const tips         = [];
    const total        = topics.length;
    const weak         = topics.filter(isWeakTopic);
    const dueToday     = topics.filter(t => t.date === getTodayString());
    const completed    = topics.filter(isCompletedTopic);
    const pending      = topics.filter(isPendingTopic);
    const subjects     = [...new Set(topics.map(t=>t.subject).filter(Boolean))];

    if (weak.length > 0)    tips.push(`You have ${weak.length} weak topic(s). Revise them first while your focus is highest.`);
    if (dueToday.length > 0) tips.push(`You have ${dueToday.length} revision topic(s) due today.`);
    if (pending.length > 0) tips.push(`${pending.length} pending topic(s). Try closing at least one per session.`);
    if (completed.length > 0 && total > 0) tips.push(`Revision progress: ${Math.round(completed.length/total*100)}%. Keep going!`);
    if (subjects.length >= 2) tips.push(`You are revising ${subjects.length} subjects. Alternate tough and easy ones.`);
    if (total >= 5) tips.push("Break long revision into 25–30 minute sessions for better recall.");
    if (tips.length === 0) tips.push("Add revision topics with dates and status to get personalized tips.");
    return tips.slice(0, 4);
}

function renderRevisionTips(topics = allRevisionTopics) {
    if (!revisionTipList) return;
    resetDynamicContainer(revisionTipList, revisionTipEmptyState);
    const tips = generateDynamicRevisionTips(topics);
    tips.forEach(text => {
        const item = document.createElement("div");
        item.className = "revision-tip-item";
        item.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>${text}</span>`;
        revisionTipEmptyState
            ? revisionTipList.insertBefore(item, revisionTipEmptyState)
            : revisionTipList.appendChild(item);
    });
    showEmptyState(revisionTipEmptyState, tips.length === 0);
}

function renderAllRealtimeSections(topics = allRevisionTopics) {
    renderRevisionTopics(topics);
    renderRevisionSchedule(topics);
    renderWeakAreas(topics);
    renderRevisionTips(topics);
    updateRevisionCounts(topics);
}

// ─── API CALLS ───────────────────────────────────────────
async function fetchAllRevisionTopics() {
    const data = await apiRequest(buildRevisionApiUrl(), { method: "GET" });
    return Array.isArray(data) ? data.map(normalizeRevisionTopic) : [];
}

async function createRevisionTopicApi(topicData) {
    const res = await apiRequest(buildRevisionApiUrl(), {
        method: "POST",
        body: JSON.stringify(convertToRequestBody(topicData))
    });
    return normalizeRevisionTopic(res);
}

async function updateRevisionTopicApi(topicId, topicData) {
    const res = await apiRequest(buildRevisionApiUrl(topicId), {
        method: "PUT",
        body: JSON.stringify(convertToRequestBody(topicData))
    });
    return normalizeRevisionTopic(res);
}

async function deleteRevisionTopicApi(topicId) {
    await apiRequest(buildRevisionApiUrl(topicId), { method: "DELETE" });
}

// ─── SUBJECTS DROPDOWN ───────────────────────────────────
function extractSubjectName(subject) {
    if (typeof subject === "string" && subject.trim()) return subject.trim();
    const keys = ["name","subjectName","title","subject","subjectTitle"];
    for (const k of keys) {
        const v = subject?.[k];
        if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
}

function populateSubjectDropdown(subjects, selectedValue = "") {
    if (!revisionSubjectInput) return;
    const current  = selectedValue || revisionSubjectInput.value || "";
    const names    = [...new Set((subjects||[]).map(extractSubjectName).filter(Boolean))];

    revisionSubjectInput.innerHTML = "";
    const placeholder       = document.createElement("option");
    placeholder.value       = "";
    placeholder.textContent = "Select Subject";
    revisionSubjectInput.appendChild(placeholder);

    names.forEach(name => {
        const opt       = document.createElement("option");
        opt.value       = name;
        opt.textContent = name;
        revisionSubjectInput.appendChild(opt);
    });

    if (current && !names.includes(current)) {
        const custom       = document.createElement("option");
        custom.value       = current;
        custom.textContent = current;
        revisionSubjectInput.appendChild(custom);
    }

    revisionSubjectInput.value = current || "";
}

async function loadRevisionSubjects(selectedValue = "") {
    try {
        const data  = await apiRequest(buildSubjectsApiUrl(), { method: "GET" });
        allSubjects = Array.isArray(data) ? data : [];
        populateSubjectDropdown(allSubjects, selectedValue);
    } catch (error) {
        console.error("Failed to load subjects:", error);
        populateSubjectDropdown([], selectedValue);
        // Silent fail — don't block with alert
    }
}

// ─── FILTER ──────────────────────────────────────────────
function matchesRevisionFilter(topicItem, filterValue) {
    if (!filterValue || filterValue === "All Topics") return true;
    const topic = {
        date:     topicItem.dataset.date     || "",
        status:   topicItem.dataset.status   || "",
        priority: topicItem.dataset.priority || ""
    };
    if (filterValue === "Due Today")    return topic.date === getTodayString();
    if (filterValue === "Completed")    return isCompletedTopic(topic);
    if (filterValue === "Pending")      return isPendingTopic(topic);
    if (filterValue === "Weak Topics")  return isWeakTopic(topic);
    return true;
}

function applyRevisionFilters() {
    if (!revisionTopicList) return;
    const items       = revisionTopicList.querySelectorAll(".revision-topic-item");
    const search      = revisionSearchInput  ? revisionSearchInput.value.toLowerCase().trim()  : "";
    const filterValue = revisionFilterSelect ? revisionFilterSelect.value : "All Topics";
    let visible = 0;
    items.forEach(item => {
        const title = item.querySelector(".revision-topic-info h4")?.textContent.toLowerCase() || "";
        const desc  = item.querySelector(".revision-topic-info p")?.textContent.toLowerCase()  || "";
        const show  = (title.includes(search) || desc.includes(search)) && matchesRevisionFilter(item, filterValue);
        item.style.display = show ? "" : "none";
        if (show) visible++;
    });
    showEmptyState(revisionEmptyState, visible === 0);
}

// ─── FILL FORM FOR EDIT ──────────────────────────────────
function fillRevisionFormForEdit(topicItem) {
    editingRevisionId              = topicItem.dataset.revisionId || null;
    revisionTopicTitleInput.value  = topicItem.querySelector(".revision-topic-info h4")?.textContent.trim() || "";
    revisionPriorityInput.value    = topicItem.dataset.priority    || "Weak Topic";
    revisionDateInput.value        = topicItem.dataset.date        || "";
    revisionStatusInput.value      = topicItem.dataset.status      || "Pending";
    revisionDescriptionInput.value = topicItem.dataset.description || "";
    populateSubjectDropdown(allSubjects, topicItem.dataset.subject || "");
}

// ─── LOAD ────────────────────────────────────────────────
async function loadRevisionTopics() {
    try {
        allRevisionTopics = await fetchAllRevisionTopics();
        renderAllRealtimeSections(allRevisionTopics);
    } catch (error) {
        console.error("Failed to load revision topics:", error);
        allRevisionTopics = [];
        renderAllRealtimeSections([]);
        // Silent fail — empty state dikhega
    }
}

// ─── EVENT LISTENERS ─────────────────────────────────────
if (openRevisionModalBtn) {
    openRevisionModalBtn.addEventListener("click", async function () {
        clearRevisionModalState();
        await loadRevisionSubjects();
        openRevisionModal();
    });
}

if (closeRevisionModalBtn) {
    closeRevisionModalBtn.addEventListener("click", function () {
        closeRevisionModal();
        clearRevisionModalState();
    });
}

if (cancelRevisionModalBtn) {
    cancelRevisionModalBtn.addEventListener("click", function () {
        closeRevisionModal();
        clearRevisionModalState();
    });
}

if (revisionModalOverlay) {
    revisionModalOverlay.addEventListener("click", function (e) {
        if (e.target === revisionModalOverlay) {
            closeRevisionModal();
            clearRevisionModalState();
        }
    });
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && revisionModalOverlay &&
        !revisionModalOverlay.classList.contains("hidden")) {
        closeRevisionModal();
        clearRevisionModalState();
    }
});

if (revisionModalForm) {
    revisionModalForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const title       = revisionTopicTitleInput.value.trim();
        const subject     = revisionSubjectInput.value;
        const priority    = revisionPriorityInput.value;
        const date        = revisionDateInput.value;
        const status      = revisionStatusInput.value;
        const description = revisionDescriptionInput.value.trim();

        if (!title)   { alert("Please enter a revision topic title."); return; }
        if (!subject) { alert("Please select a subject.");              return; }
        if (!date)    { alert("Please select a revision date.");        return; }

        const revisionData = normalizeRevisionTopic({
            title, subject, priority, date, status,
            description: description || "Scheduled revision topic for better retention."
        });

        try {
            if (revisionSaveBtn) revisionSaveBtn.disabled = true;
            if (editingRevisionId) { await updateRevisionTopicApi(editingRevisionId, revisionData); }
            else                   { await createRevisionTopicApi(revisionData); }
            await loadRevisionTopics();
            closeRevisionModal();
            clearRevisionModalState();
        } catch (error) {
            alert(`Failed to save revision topic: ${error.message}`);
        } finally {
            if (revisionSaveBtn) revisionSaveBtn.disabled = false;
        }
    });
}

if (revisionTopicList) {
    revisionTopicList.addEventListener("click", async function (e) {
        const deleteBtn = e.target.closest(".revision-topic-action-btn.delete");
        const editBtn   = e.target.closest(".revision-topic-action-btn.edit");

        if (deleteBtn) {
            const item   = deleteBtn.closest(".revision-topic-item");
            const topicId = item?.dataset.revisionId;
            if (!topicId) return;
            if (!confirm("Do you want to delete this revision topic?")) return;
            try {
                await deleteRevisionTopicApi(topicId);
                await loadRevisionTopics();
            } catch (error) {
                alert(`Failed to delete: ${error.message}`);
            }
            return;
        }

        if (editBtn) {
            const item = editBtn.closest(".revision-topic-item");
            if (!item) return;
            setEditRevisionMode();
            await loadRevisionSubjects(item.dataset.subject || "");
            fillRevisionFormForEdit(item);
            openRevisionModal();
        }
    });
}

// ─── Search & Filter — outside blocks ────────────────────
if (revisionSearchInput)  revisionSearchInput.addEventListener("input",  applyRevisionFilters);
if (revisionFilterSelect) revisionFilterSelect.addEventListener("change", applyRevisionFilters);

// ─── INIT ────────────────────────────────────────────────
Promise.all([loadRevisionSubjects(), loadRevisionTopics()])
    .catch(err => console.error("Initial load failed:", err));

setAddRevisionMode();