const openRevisionModalBtn = document.getElementById("openRevisionModalBtn");
const revisionModalOverlay = document.getElementById("revisionModalOverlay");
const closeRevisionModalBtn = document.getElementById("closeRevisionModalBtn");
const cancelRevisionModalBtn = document.getElementById(
  "cancelRevisionModalBtn",
);
const revisionModalForm = document.getElementById("revisionModalForm");
const revisionModalTitle = document.getElementById("revisionModalTitle");
const revisionSaveBtn = document.getElementById("revisionSaveBtn");

const revisionTopicList = document.getElementById("revisionTopicList");
const revisionEmptyState = document.getElementById("revisionEmptyState");
const revisionSearchInput = document.getElementById("revisionSearchInput");
const revisionFilterSelect = document.getElementById("revisionFilterSelect");

const totalRevisionCount = document.getElementById("totalRevisionCount");
const revisionDueTodayCount = document.getElementById("revisionDueTodayCount");
const revisionCompletedTodayCount = document.getElementById(
  "revisionCompletedTodayCount",
);
const revisionProgressCount = document.getElementById("revisionProgressCount");

const revisionScheduleList = document.getElementById("revisionScheduleList");
const revisionScheduleEmptyState = document.getElementById(
  "revisionScheduleEmptyState",
);
const weakAreaList = document.getElementById("weakAreaList");
const weakAreaEmptyState = document.getElementById("weakAreaEmptyState");
const revisionTipList = document.getElementById("revisionTipList");
const revisionTipEmptyState = document.getElementById("revisionTipEmptyState");

const revisionSmartFocusTitle = document.getElementById(
  "revisionSmartFocusTitle",
);
const revisionSmartFocusDescription = document.getElementById(
  "revisionSmartFocusDescription",
);
const revisionSmartFocusList = document.getElementById(
  "revisionSmartFocusList",
);
const revisionSpacedList = document.getElementById("revisionSpacedList");

const revisionTopicTitleInput = document.getElementById("revisionTopicTitle");
const revisionSubjectInput = document.getElementById("revisionSubject");
const revisionPriorityInput = document.getElementById("revisionPriority");
const revisionDateInput = document.getElementById("revisionDate");
const revisionStatusInput = document.getElementById("revisionStatus");
const revisionDescriptionInput = document.getElementById("revisionDescription");

const API_ORIGIN =
  window.location.port === "8080" ? "" : "http://localhost:8080";

const REVISION_API_URL = `${API_ORIGIN}/api/revisions`;
const SUBJECTS_API_URL = `${API_ORIGIN}/api/subjects`;
const PLANNER_API_URL = `${API_ORIGIN}/api/plans`;
const REVISION_AI_API_URL = `${API_ORIGIN}/api/ai/revisions/analyze`;

let editingRevisionId = null;
let allRevisionTopics = [];
let allSubjects = [];

/* ============================================================
   AUTH
   ============================================================ */

function getToken() {
  return (localStorage.getItem("token") || "").trim();
}

function redirectToLoginIfNeeded() {
  if (!getToken()) {
    localStorage.clear();
    window.location.href = "login.html";
    return true;
  }

  return false;
}

function authHeader(extraHeaders = {}) {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
}

/* ============================================================
   URL BUILDERS
   ============================================================ */

function buildRevisionApiUrl(revisionId = "") {
  const path = revisionId ? `/${revisionId}` : "";
  return `${REVISION_API_URL}${path}`;
}

function buildSubjectsApiUrl() {
  return SUBJECTS_API_URL;
}

function buildPlannerApiUrl() {
  return PLANNER_API_URL;
}

/* ============================================================
   API HELPER
   ============================================================ */

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeader(),
      ...(options.headers || {}),
    },
  });

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

/* ============================================================
   BASIC HELPERS
   ============================================================ */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getTomorrowString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

function getDateDiffDays(dateValue) {
  if (!dateValue) return 9999;

  const target = new Date(`${dateValue}T00:00:00`);
  const today = new Date(`${getTodayString()}T00:00:00`);

  return Math.round((target - today) / 86400000);
}

function formatDateLabel(dateString) {
  if (!dateString) return "No Date";
  if (dateString === getTodayString()) return "Today";
  if (dateString === getTomorrowString()) return "Tomorrow";

  const date = new Date(`${dateString}T00:00:00`);

  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

/* ============================================================
   MODAL
   ============================================================ */

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

  if (revisionModalTitle) {
    revisionModalTitle.textContent = "Add Revision Topic";
  }

  if (revisionSaveBtn) {
    revisionSaveBtn.textContent = "Save Revision";
  }
}

function setEditRevisionMode() {
  if (revisionModalTitle) {
    revisionModalTitle.textContent = "Edit Revision Topic";
  }

  if (revisionSaveBtn) {
    revisionSaveBtn.textContent = "Update Revision";
  }
}

function resetRevisionForm() {
  if (!revisionModalForm) return;

  revisionModalForm.reset();

  if (revisionPriorityInput) revisionPriorityInput.value = "Medium";
  if (revisionStatusInput) revisionStatusInput.value = "Pending";
}

function clearRevisionModalState() {
  resetRevisionForm();
  setAddRevisionMode();
}

/* ============================================================
   REVISION DATA HELPERS
   ============================================================ */

function normalizeRevisionTopic(topic) {
  return {
    id: topic?.id ?? null,
    title: String(topic?.title || "").trim(),
    subject: String(topic?.subject || "").trim(),
    priority: String(topic?.priority || "Medium").trim(),
    date: String(topic?.date || topic?.revisionDate || "").trim(),
    status: String(topic?.status || "Pending").trim(),
    description: String(topic?.description || "").trim(),
  };
}

function convertToRequestBody(topic) {
  const normalized = normalizeRevisionTopic(topic);

  return {
    title: normalized.title,
    subject: normalized.subject,
    priority: normalized.priority,
    revisionDate: normalized.date,
    status: normalized.status,
    description: normalized.description,
  };
}

function isCompletedTopic(topic) {
  const status = String(topic?.status || "").toLowerCase();
  return status === "completed";
}

function isWeakTopic(topic) {
  const status = String(topic?.status || "").toLowerCase();
  return status === "weak topic";
}

function isPendingTopic(topic) {
  return !isCompletedTopic(topic) && !isWeakTopic(topic);
}

function isDueTodayRevision(topic) {
  return topic.date === getTodayString() && !isCompletedTopic(topic);
}

function isOverdueRevision(topic) {
  return getDateDiffDays(topic.date) < 0 && !isCompletedTopic(topic);
}

function getEffectiveBadgeText(topic) {
  if (isCompletedTopic(topic)) return "Completed";
  if (isWeakTopic(topic)) return "Weak Topic";
  return "Pending";
}

function getRevisionBadgeClass(topic) {
  if (isCompletedTopic(topic)) return "done";
  if (isWeakTopic(topic)) return "weak";
  return "pending";
}

function getRevisionSmartScore(topic) {
  if (isCompletedTopic(topic)) return 0;

  let score = 0;
  const priority = String(topic.priority || "").toLowerCase();
  const diff = getDateDiffDays(topic.date);

  if (isWeakTopic(topic)) score += 45;
  if (priority === "high") score += 35;
  if (priority === "medium") score += 22;
  if (priority === "low") score += 10;

  if (diff < 0) score += 40;
  else if (diff === 0) score += 32;
  else if (diff === 1) score += 22;
  else if (diff <= 3) score += 14;
  else if (diff <= 7) score += 8;

  return Math.min(100, score);
}

function getRevisionHealth(topic) {
  if (isCompletedTopic(topic)) {
    return {
      label: "Done",
      className: "done",
      icon: "fa-circle-check",
    };
  }

  if (isOverdueRevision(topic)) {
    return {
      label: "Overdue",
      className: "critical",
      icon: "fa-triangle-exclamation",
    };
  }

  if (isWeakTopic(topic)) {
    return {
      label: "Weak Area",
      className: "weak",
      icon: "fa-fire",
    };
  }

  const score = getRevisionSmartScore(topic);

  if (score >= 70) {
    return {
      label: "High Focus",
      className: "focus",
      icon: "fa-bolt",
    };
  }

  return {
    label: "Stable",
    className: "stable",
    icon: "fa-shield-heart",
  };
}

function getRevisionPomodoroSuggestion(topic) {
  if (isCompletedTopic(topic)) {
    return "No focus session needed";
  }

  if (isWeakTopic(topic) || isOverdueRevision(topic)) {
    return "3 Pomodoro sessions";
  }

  if (String(topic.priority || "").toLowerCase() === "high") {
    return "2 Pomodoro sessions";
  }

  return "1 Pomodoro session";
}

/* ============================================================
   PLANNER HELPERS
   ============================================================ */

function getRevisionPlannerTime(topic) {
  if (isWeakTopic(topic)) return "18:00:00";

  const priority = String(topic.priority || "").toLowerCase();

  if (priority === "high") return "18:30:00";
  if (priority === "medium") return "19:00:00";

  return "20:00:00";
}

function getRevisionPlannerDate(topic) {
  if (!topic.date) return getTodayString();

  const diff = getDateDiffDays(topic.date);

  return diff < 0 ? getTodayString() : topic.date;
}

/* ============================================================
   EMPTY STATE HELPERS
   ============================================================ */

function resetDynamicContainer(container, emptyState) {
  if (!container) return;

  container.innerHTML = "";

  if (emptyState) {
    emptyState.classList.add("hidden");
    container.appendChild(emptyState);
  }
}

function showEmptyState(emptyState, shouldShow) {
  if (!emptyState) return;

  emptyState.classList.toggle("hidden", !shouldShow);
}

/* ============================================================
   COUNTS
   ============================================================ */

function updateRevisionCounts(topics = allRevisionTopics) {
  const today = getTodayString();
  const total = topics.length;
  const dueToday = topics.filter(
    (topic) => topic.date === today && !isCompletedTopic(topic),
  ).length;
  const completedToday = topics.filter(
    (topic) => topic.date === today && isCompletedTopic(topic),
  ).length;
  const totalCompleted = topics.filter(isCompletedTopic).length;
  const progress = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

  if (totalRevisionCount) {
    totalRevisionCount.textContent = String(total).padStart(2, "0");
  }

  if (revisionDueTodayCount) {
    revisionDueTodayCount.textContent = String(dueToday).padStart(2, "0");
  }

  if (revisionCompletedTodayCount) {
    revisionCompletedTodayCount.textContent = String(completedToday).padStart(
      2,
      "0",
    );
  }

  if (revisionProgressCount) {
    revisionProgressCount.textContent = `${progress}%`;
  }
}

/* ============================================================
   SMART REVISION PANELS
   ============================================================ */

function renderSmartRevisionFocus(topics = allRevisionTopics) {
  if (
    !revisionSmartFocusTitle ||
    !revisionSmartFocusDescription ||
    !revisionSmartFocusList
  ) {
    return;
  }

  const activeTopics = topics
    .filter((topic) => !isCompletedTopic(topic))
    .sort((a, b) => getRevisionSmartScore(b) - getRevisionSmartScore(a))
    .slice(0, 3);

  if (!activeTopics.length) {
    revisionSmartFocusTitle.textContent = "All revision topics are clear";
    revisionSmartFocusDescription.textContent =
      "You have no pending revision pressure right now.";

    revisionSmartFocusList.innerHTML = `
            <div class="revision-smart-item">
                <span class="revision-smart-rank done">
                    <i class="fa-solid fa-circle-check"></i>
                </span>
                <div>
                    <strong>Great progress</strong>
                    <small>Add new revision topics when you are ready.</small>
                </div>
            </div>
        `;

    return;
  }

  const firstTopic = activeTopics[0];
  const firstHealth = getRevisionHealth(firstTopic);

  revisionSmartFocusTitle.textContent = `Revise first: ${firstTopic.title || "Untitled Topic"}`;
  revisionSmartFocusDescription.textContent = `${firstTopic.subject || "General"} • ${firstHealth.label} • ${getRevisionPomodoroSuggestion(firstTopic)}`;

  revisionSmartFocusList.innerHTML = activeTopics
    .map((topic) => {
      const health = getRevisionHealth(topic);

      return `
            <div class="revision-smart-item">
                <span class="revision-smart-rank ${health.className}">
                    <i class="fa-solid ${health.icon}"></i>
                </span>

                <div>
                    <strong>${escapeHtml(topic.title || "Untitled Topic")}</strong>
                    <small>
                        ${escapeHtml(topic.subject || "No Subject")} •
                        ${escapeHtml(health.label)} •
                        Score ${getRevisionSmartScore(topic)} •
                        ${escapeHtml(getRevisionPomodoroSuggestion(topic))}
                    </small>
                </div>
            </div>
        `;
    })
    .join("");
}

function renderSpacedRevisionSuggestions(topics = allRevisionTopics) {
  if (!revisionSpacedList) return;

  const activeTopics = topics
    .filter((topic) => !isCompletedTopic(topic))
    .sort((a, b) => getDateDiffDays(a.date) - getDateDiffDays(b.date))
    .slice(0, 4);

  if (!activeTopics.length) {
    revisionSpacedList.innerHTML = `
            <p class="revision-muted-text">
                No pending topics for spaced revision.
            </p>
        `;

    return;
  }

  revisionSpacedList.innerHTML = activeTopics
    .map((topic) => {
      const diff = getDateDiffDays(topic.date);

      let suggestion = "Review with short notes today.";

      if (diff < 0) {
        suggestion = "Revise today because this topic is overdue.";
      } else if (diff === 0) {
        suggestion = "Do active recall today and mark weak points.";
      } else if (diff === 1) {
        suggestion = "Prepare quick notes today, revise tomorrow.";
      } else if (diff <= 3) {
        suggestion = "Schedule a short revision before the due date.";
      }

      return `
            <div class="revision-spaced-item">
                <div>
                    <strong>${escapeHtml(topic.title || "Untitled Topic")}</strong>
                    <small>${escapeHtml(topic.subject || "No Subject")} • ${escapeHtml(formatDateLabel(topic.date))}</small>
                </div>
                <span>${escapeHtml(suggestion)}</span>
            </div>
        `;
    })
    .join("");
}

function renderSmartRevisionPanels(topics = allRevisionTopics) {
  renderSmartRevisionFocus(topics);
  renderSpacedRevisionSuggestions(topics);
}

/* ============================================================
   RENDER REVISION TOPICS
   ============================================================ */

function createRevisionTopicItem(topicData) {
  const topic = normalizeRevisionTopic(topicData);
  const item = document.createElement("div");

  item.className = "revision-topic-item";
  item.dataset.revisionId = topic.id;
  item.dataset.date = topic.date;
  item.dataset.subject = topic.subject;
  item.dataset.priority = topic.priority;
  item.dataset.status = topic.status;
  item.dataset.description = topic.description;

  let subText = `Subject: ${topic.subject || "No Subject"}`;

  if (topic.description) {
    subText += ` • ${topic.description}`;
  }

  if (topic.date) {
    subText += ` • Revision date: ${topic.date}`;
  }

  item.innerHTML = `
        <div class="revision-topic-info">
            <h4>${escapeHtml(topic.title || "Untitled Topic")}</h4>
            <p>${escapeHtml(subText)}</p>
        </div>

        <span class="revision-topic-badge ${getRevisionBadgeClass(topic)}">
            ${escapeHtml(getEffectiveBadgeText(topic))}
        </span>

        <div class="revision-topic-actions">
            <button class="revision-topic-action-btn ai" title="Analyze with AI">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
            </button>

            <button class="revision-topic-action-btn planner" title="Add to Planner">
                <i class="fa-solid fa-calendar-plus"></i>
            </button>

            <button class="revision-topic-action-btn edit" title="Edit">
                <i class="fa-solid fa-pen"></i>
            </button>

            <button class="revision-topic-action-btn delete" title="Delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>

        <div class="revision-ai-panel hidden"></div>
    `;

  return item;
}

function renderRevisionTopics(topics) {
  if (!revisionTopicList) return;

  resetDynamicContainer(revisionTopicList, revisionEmptyState);

  topics.forEach((topic) => {
    const item = createRevisionTopicItem(topic);

    if (revisionEmptyState) {
      revisionTopicList.insertBefore(item, revisionEmptyState);
    } else {
      revisionTopicList.appendChild(item);
    }
  });

  applyRevisionFilters();
}

/* ============================================================
   RENDER SCHEDULE / WEAK AREAS / TIPS
   ============================================================ */

function renderRevisionSchedule(topics = allRevisionTopics) {
  if (!revisionScheduleList) return;

  resetDynamicContainer(revisionScheduleList, revisionScheduleEmptyState);

  const scheduledTopics = [...topics]
    .filter((topic) => topic.date && !isCompletedTopic(topic))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .slice(0, 5);

  scheduledTopics.forEach((topic) => {
    const item = document.createElement("div");

    item.className = "revision-schedule-item";
    item.innerHTML = `
            <div class="revision-schedule-time">
                ${escapeHtml(formatDateLabel(topic.date))}
            </div>

            <div class="revision-schedule-info">
                <h4>${escapeHtml(topic.title || "Untitled Topic")}</h4>
                <p>${escapeHtml([topic.subject, topic.description || getEffectiveBadgeText(topic)].filter(Boolean).join(" • "))}</p>
            </div>
        `;

    if (revisionScheduleEmptyState) {
      revisionScheduleList.insertBefore(item, revisionScheduleEmptyState);
    } else {
      revisionScheduleList.appendChild(item);
    }
  });

  showEmptyState(revisionScheduleEmptyState, scheduledTopics.length === 0);
}

function renderWeakAreas(topics = allRevisionTopics) {
  if (!weakAreaList) return;

  resetDynamicContainer(weakAreaList, weakAreaEmptyState);

  const weakTopics = topics.filter(isWeakTopic).slice(0, 6);

  weakTopics.forEach((topic) => {
    const item = document.createElement("div");

    item.className = "weak-area-item";
    item.innerHTML = `
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>${escapeHtml(topic.title || "Untitled Topic")}${topic.subject ? ` • ${escapeHtml(topic.subject)}` : ""}</span>
        `;

    if (weakAreaEmptyState) {
      weakAreaList.insertBefore(item, weakAreaEmptyState);
    } else {
      weakAreaList.appendChild(item);
    }
  });

  showEmptyState(weakAreaEmptyState, weakTopics.length === 0);
}

function generateDynamicRevisionTips(topics = allRevisionTopics) {
  const tips = [];
  const total = topics.length;
  const weak = topics.filter(isWeakTopic);
  const dueToday = topics.filter(isDueTodayRevision);
  const completed = topics.filter(isCompletedTopic);
  const pending = topics.filter(isPendingTopic);
  const subjects = [
    ...new Set(topics.map((topic) => topic.subject).filter(Boolean)),
  ];

  if (weak.length > 0) {
    tips.push(
      `You have ${weak.length} weak topic(s). Revise them first while your focus is highest.`,
    );
  }

  if (dueToday.length > 0) {
    tips.push(
      `You have ${dueToday.length} revision topic(s) due today. Use active recall before reading notes.`,
    );
  }

  if (pending.length > 0) {
    tips.push(
      `${pending.length} pending topic(s). Try completing at least one focused revision session today.`,
    );
  }

  if (completed.length > 0 && total > 0) {
    tips.push(
      `Revision progress is ${Math.round((completed.length / total) * 100)}%. Keep your review cycle consistent.`,
    );
  }

  if (subjects.length >= 2) {
    tips.push(
      `You are revising ${subjects.length} subjects. Alternate difficult and easy topics for better retention.`,
    );
  }

  if (total >= 5) {
    tips.push(
      "Break long revision into 25–30 minute sessions to improve recall.",
    );
  }

  if (!tips.length) {
    tips.push(
      "Add revision topics with dates and status to get personalized revision tips.",
    );
  }

  return tips.slice(0, 4);
}

function renderRevisionTips(topics = allRevisionTopics) {
  if (!revisionTipList) return;

  resetDynamicContainer(revisionTipList, revisionTipEmptyState);

  const tips = generateDynamicRevisionTips(topics);

  tips.forEach((text) => {
    const item = document.createElement("div");

    item.className = "revision-tip-item";
    item.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            <span>${escapeHtml(text)}</span>
        `;

    if (revisionTipEmptyState) {
      revisionTipList.insertBefore(item, revisionTipEmptyState);
    } else {
      revisionTipList.appendChild(item);
    }
  });

  showEmptyState(revisionTipEmptyState, tips.length === 0);
}

function renderAllRealtimeSections(topics = allRevisionTopics) {
  renderRevisionTopics(topics);
  renderRevisionSchedule(topics);
  renderWeakAreas(topics);
  renderRevisionTips(topics);
  renderSmartRevisionPanels(topics);
  updateRevisionCounts(topics);
}

/* ============================================================
   API CALLS
   ============================================================ */

async function fetchAllRevisionTopics() {
  const data = await apiRequest(buildRevisionApiUrl(), {
    method: "GET",
  });

  return Array.isArray(data) ? data.map(normalizeRevisionTopic) : [];
}

async function createRevisionTopicApi(topicData) {
  const response = await apiRequest(buildRevisionApiUrl(), {
    method: "POST",
    body: JSON.stringify(convertToRequestBody(topicData)),
  });

  return normalizeRevisionTopic(response);
}

async function updateRevisionTopicApi(topicId, topicData) {
  const response = await apiRequest(buildRevisionApiUrl(topicId), {
    method: "PUT",
    body: JSON.stringify(convertToRequestBody(topicData)),
  });

  return normalizeRevisionTopic(response);
}

async function deleteRevisionTopicApi(topicId) {
  await apiRequest(buildRevisionApiUrl(topicId), {
    method: "DELETE",
  });
}

async function fetchPlannerItems() {
  const data = await apiRequest(buildPlannerApiUrl(), {
    method: "GET",
  });

  return Array.isArray(data) ? data : [];
}

async function createPlannerItemFromRevision(topic) {
  const plannerDate = getRevisionPlannerDate(topic);
  const plannerTime = getRevisionPlannerTime(topic);
  const plannerTitle = `Revise: ${topic.title || "Untitled Topic"}`;

  const existingPlans = await fetchPlannerItems();

  const duplicate = existingPlans.some((plan) => {
    return (
      String(plan.title || "").toLowerCase() === plannerTitle.toLowerCase() &&
      String(plan.subject || "").toLowerCase() ===
        String(topic.subject || "").toLowerCase() &&
      plan.date === plannerDate
    );
  });

  if (duplicate) {
    return {
      duplicate: true,
    };
  }

  const payload = {
    title: plannerTitle,
    subject: topic.subject || "General",
    date: plannerDate,
    time: plannerTime,
    status: "Pending",
    description: [
      "Created from Revision module",
      `Revision Topic: ${topic.title || "Untitled Topic"}`,
      `Priority: ${topic.priority || "Medium"}`,
      `Status: ${topic.status || "Pending"}`,
      `Focus Suggestion: ${getRevisionPomodoroSuggestion(topic)}`,
      topic.description ? `Notes: ${topic.description}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  const created = await apiRequest(buildPlannerApiUrl(), {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    duplicate: false,
    created,
  };
}

async function analyzeRevisionWithAi(topic) {
  const payload = {
    title: topic.title || "",
    subject: topic.subject || "General",
    priority: topic.priority || "Medium",
    revisionDate: topic.date || "",
    status: topic.status || "Pending",
    description: topic.description || "",
  };

  const response = await apiRequest(REVISION_AI_API_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response;
}

function normalizeAiList(value) {
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

function renderRevisionAiPanel(card, analysis) {
  if (!card) return;

  const panel = card.querySelector(".revision-ai-panel");
  if (!panel) return;

  const revisionPlan = normalizeAiList(analysis.revisionPlan);
  const quickQuestions = normalizeAiList(analysis.quickTestQuestions);

  panel.classList.remove("hidden");

  panel.innerHTML = `
        <div class="revision-ai-panel-header">
            <div>
                <span class="revision-ai-kicker">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    AI Revision Coach
                </span>
                <h4>Personalized revision strategy</h4>
            </div>

            <button type="button" class="revision-ai-close-btn" title="Close AI analysis">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="revision-ai-metrics">
            <div class="revision-ai-metric">
                <span>Priority</span>
                <strong>${escapeHtml(analysis.revisionPriority || "Medium")}</strong>
            </div>

            <div class="revision-ai-metric">
                <span>Score</span>
                <strong>${escapeHtml(analysis.revisionScore ?? "—")}</strong>
            </div>

            <div class="revision-ai-metric">
                <span>Method</span>
                <strong>${escapeHtml(analysis.recommendedMethod || "Active Recall")}</strong>
            </div>

            <div class="revision-ai-metric">
                <span>Focus</span>
                <strong>${escapeHtml(analysis.focusSessions ?? "—")}</strong>
            </div>
        </div>

        <div class="revision-ai-grid">
            <div class="revision-ai-box">
                <h5><i class="fa-solid fa-lightbulb"></i> Memory Tip</h5>
                <p>${escapeHtml(analysis.memoryTip || "No memory tip generated.")}</p>
            </div>

            <div class="revision-ai-box">
                <h5><i class="fa-solid fa-repeat"></i> Next Review</h5>
                <p>${escapeHtml(analysis.nextReviewSuggestion || "No next review suggestion generated.")}</p>
            </div>

            <div class="revision-ai-box revision-ai-wide">
                <h5><i class="fa-solid fa-circle-info"></i> AI Reason</h5>
                <p>${escapeHtml(analysis.reason || "AI analyzed this revision topic using subject, date, status, and priority.")}</p>
            </div>
        </div>

        <div class="revision-ai-list-box">
            <h5><i class="fa-solid fa-list-check"></i> Revision Plan</h5>
            ${
              revisionPlan.length
                ? `<ol>${revisionPlan.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
                : `<p>No revision plan generated.</p>`
            }
        </div>

        <div class="revision-ai-list-box">
            <h5><i class="fa-solid fa-question-circle"></i> Quick Self-Test Questions</h5>
            ${
              quickQuestions.length
                ? `<ol>${quickQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
                : `<p>No self-test questions generated.</p>`
            }
        </div>
    `;
}

/* ============================================================
   SUBJECT DROPDOWN
   ============================================================ */

function extractSubjectName(subject) {
  if (typeof subject === "string" && subject.trim()) {
    return subject.trim();
  }

  const keys = ["name", "subjectName", "title", "subject", "subjectTitle"];

  for (const key of keys) {
    const value = subject?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function populateSubjectDropdown(subjects, selectedValue = "") {
  if (!revisionSubjectInput) return;

  const currentValue = selectedValue || revisionSubjectInput.value || "";
  const names = [
    ...new Set((subjects || []).map(extractSubjectName).filter(Boolean)),
  ];

  revisionSubjectInput.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select Subject";
  revisionSubjectInput.appendChild(placeholder);

  names.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    revisionSubjectInput.appendChild(option);
  });

  if (currentValue && !names.includes(currentValue)) {
    const customOption = document.createElement("option");
    customOption.value = currentValue;
    customOption.textContent = currentValue;
    revisionSubjectInput.appendChild(customOption);
  }

  revisionSubjectInput.value = currentValue || "";
}

async function loadRevisionSubjects(selectedValue = "") {
  try {
    const data = await apiRequest(buildSubjectsApiUrl(), {
      method: "GET",
    });

    allSubjects = Array.isArray(data) ? data : [];
    populateSubjectDropdown(allSubjects, selectedValue);
  } catch (error) {
    console.error("Failed to load subjects:", error);
    populateSubjectDropdown([], selectedValue);
    showToast("Failed to load subjects.", "error");
  }
}

/* ============================================================
   FILTER
   ============================================================ */

function matchesRevisionFilter(topicItem, filterValue) {
  if (!filterValue || filterValue === "All Topics") return true;

  const topic = {
    date: topicItem.dataset.date || "",
    status: topicItem.dataset.status || "",
    priority: topicItem.dataset.priority || "",
  };

  if (filterValue === "Due Today") return topic.date === getTodayString();
  if (filterValue === "Completed") return isCompletedTopic(topic);
  if (filterValue === "Pending") return isPendingTopic(topic);
  if (filterValue === "Weak Topics") return isWeakTopic(topic);

  return true;
}

function applyRevisionFilters() {
  if (!revisionTopicList) return;

  const items = revisionTopicList.querySelectorAll(".revision-topic-item");
  const search = revisionSearchInput
    ? revisionSearchInput.value.toLowerCase().trim()
    : "";
  const filterValue = revisionFilterSelect
    ? revisionFilterSelect.value
    : "All Topics";

  let visible = 0;

  items.forEach((item) => {
    const title =
      item
        .querySelector(".revision-topic-info h4")
        ?.textContent.toLowerCase() || "";
    const description =
      item.querySelector(".revision-topic-info p")?.textContent.toLowerCase() ||
      "";

    const show =
      (title.includes(search) || description.includes(search)) &&
      matchesRevisionFilter(item, filterValue);

    item.style.display = show ? "" : "none";

    if (show) visible++;
  });

  showEmptyState(revisionEmptyState, visible === 0);
}

/* ============================================================
   FORM EDIT
   ============================================================ */

function fillRevisionFormForEdit(topicItem) {
  editingRevisionId = topicItem.dataset.revisionId || null;

  if (revisionTopicTitleInput) {
    revisionTopicTitleInput.value =
      topicItem.querySelector(".revision-topic-info h4")?.textContent.trim() ||
      "";
  }

  if (revisionPriorityInput) {
    revisionPriorityInput.value = topicItem.dataset.priority || "Medium";
  }

  if (revisionDateInput) {
    revisionDateInput.value = topicItem.dataset.date || "";
  }

  if (revisionStatusInput) {
    revisionStatusInput.value = topicItem.dataset.status || "Pending";
  }

  if (revisionDescriptionInput) {
    revisionDescriptionInput.value = topicItem.dataset.description || "";
  }

  populateSubjectDropdown(allSubjects, topicItem.dataset.subject || "");
}

/* ============================================================
   TOAST
   ============================================================ */

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

  toast.style.color = "#ffffff";
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  clearTimeout(toast._timeout);

  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
  }, 4000);
}

/* ============================================================
   LOAD
   ============================================================ */

async function loadRevisionTopics() {
  try {
    allRevisionTopics = await fetchAllRevisionTopics();
    renderAllRealtimeSections(allRevisionTopics);
    localStorage.setItem("edumind_revisions_updated", Date.now().toString());
  } catch (error) {
    console.error("Failed to load revision topics:", error);

    allRevisionTopics = [];
    renderAllRealtimeSections([]);

    showToast("Failed to load revision topics.", "error");
  }
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

openRevisionModalBtn?.addEventListener("click", async function () {
  clearRevisionModalState();
  await loadRevisionSubjects();
  openRevisionModal();
});

closeRevisionModalBtn?.addEventListener("click", function () {
  closeRevisionModal();
  clearRevisionModalState();
});

cancelRevisionModalBtn?.addEventListener("click", function () {
  closeRevisionModal();
  clearRevisionModalState();
});

revisionModalOverlay?.addEventListener("click", function (event) {
  if (event.target === revisionModalOverlay) {
    closeRevisionModal();
    clearRevisionModalState();
  }
});

document.addEventListener("keydown", function (event) {
  if (
    event.key === "Escape" &&
    revisionModalOverlay &&
    !revisionModalOverlay.classList.contains("hidden")
  ) {
    closeRevisionModal();
    clearRevisionModalState();
  }
});

revisionModalForm?.addEventListener("submit", async function (event) {
  event.preventDefault();

  const title = revisionTopicTitleInput?.value.trim() || "";
  const subject = revisionSubjectInput?.value || "";
  const priority = revisionPriorityInput?.value || "Medium";
  const date = revisionDateInput?.value || "";
  const status = revisionStatusInput?.value || "Pending";
  const description = revisionDescriptionInput?.value.trim() || "";

  if (!title) {
    showToast("Please enter a revision topic title.", "error");
    return;
  }

  if (!subject) {
    showToast("Please select a subject.", "error");
    return;
  }

  if (!date) {
    showToast("Please select a revision date.", "error");
    return;
  }

  const revisionData = normalizeRevisionTopic({
    title,
    subject,
    priority,
    date,
    status,
    description:
      description || "Scheduled revision topic for better retention.",
  });

  try {
    if (revisionSaveBtn) {
      revisionSaveBtn.disabled = true;
      revisionSaveBtn.textContent = editingRevisionId
        ? "Updating..."
        : "Saving...";
    }

    if (editingRevisionId) {
      await updateRevisionTopicApi(editingRevisionId, revisionData);
      showToast("Revision topic updated successfully.", "success");
    } else {
      await createRevisionTopicApi(revisionData);
      showToast("Revision topic added successfully.", "success");
    }

    await loadRevisionTopics();

    closeRevisionModal();
    clearRevisionModalState();
  } catch (error) {
    console.error("Save revision failed:", error);
    showToast(`Failed to save revision topic: ${error.message}`, "error");
  } finally {
    if (revisionSaveBtn) {
      revisionSaveBtn.disabled = false;
      revisionSaveBtn.textContent = editingRevisionId
        ? "Update Revision"
        : "Save Revision";
    }
  }
});

revisionTopicList?.addEventListener("click", async function (event) {
  const deleteBtn = event.target.closest(".revision-topic-action-btn.delete");
  const editBtn = event.target.closest(".revision-topic-action-btn.edit");
  const plannerBtn = event.target.closest(".revision-topic-action-btn.planner");
  const aiBtn = event.target.closest(".revision-topic-action-btn.ai");
  const aiCloseBtn = event.target.closest(".revision-ai-close-btn");

  if (aiCloseBtn) {
    const card = aiCloseBtn.closest(".revision-topic-item");
    const panel = card?.querySelector(".revision-ai-panel");

    if (panel) {
      panel.classList.add("hidden");
      panel.innerHTML = "";
    }

    return;
  }

  if (aiBtn) {
    const card = aiBtn.closest(".revision-topic-item");
    const topicId = card?.dataset.revisionId;

    const topic = allRevisionTopics.find((revision) => {
      return String(revision.id) === String(topicId);
    });

    if (!topic) {
      showToast("Revision topic details not found.", "error");
      return;
    }

    aiBtn.disabled = true;
    aiBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
      const analysis = await analyzeRevisionWithAi(topic);
      renderRevisionAiPanel(card, analysis);
      showToast("AI revision strategy generated successfully.", "success");
    } catch (error) {
      console.error("AI revision analysis failed:", error);
      showToast(`AI revision analysis failed: ${error.message}`, "error");
    } finally {
      aiBtn.disabled = false;
      aiBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i>`;
    }

    return;
  }

  if (plannerBtn) {
    const item = plannerBtn.closest(".revision-topic-item");
    const topicId = item?.dataset.revisionId;

    const topic = allRevisionTopics.find((revision) => {
      return String(revision.id) === String(topicId);
    });

    if (!topic) {
      showToast("Revision topic details not found.", "error");
      return;
    }

    if (isCompletedTopic(topic)) {
      showToast(
        "Completed revision topics do not need a new planner session.",
        "error",
      );
      return;
    }

    plannerBtn.disabled = true;
    plannerBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
      const result = await createPlannerItemFromRevision(topic);

      if (result.duplicate) {
        showToast(
          "This revision topic is already added to Planner.",
          "success",
        );
      } else {
        localStorage.setItem("edumind_planner_updated", Date.now().toString());
        showToast("Revision topic added to Planner successfully.", "success");
      }
    } catch (error) {
      console.error("Add revision to planner failed:", error);
      showToast(`Failed to add revision to Planner: ${error.message}`, "error");
    } finally {
      plannerBtn.disabled = false;
      plannerBtn.innerHTML = `<i class="fa-solid fa-calendar-plus"></i>`;
    }

    return;
  }

  if (deleteBtn) {
    const item = deleteBtn.closest(".revision-topic-item");
    const topicId = item?.dataset.revisionId;

    if (!topicId) return;

    const confirmed = confirm("Do you want to delete this revision topic?");

    if (!confirmed) return;

    try {
      await deleteRevisionTopicApi(topicId);
      await loadRevisionTopics();
      showToast("Revision topic deleted successfully.", "success");
    } catch (error) {
      console.error("Delete revision failed:", error);
      showToast(`Failed to delete revision topic: ${error.message}`, "error");
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

revisionSearchInput?.addEventListener("input", applyRevisionFilters);
revisionFilterSelect?.addEventListener("change", applyRevisionFilters);

document
  .querySelector(".logout-btn")
  ?.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.clear();
    window.location.href = "login.html";
  });

document
  .querySelector(".profile-menu-item.logout")
  ?.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.clear();
    window.location.href = "login.html";
  });

/* ============================================================
   INIT
   ============================================================ */

async function initializeRevisionPage() {
  if (redirectToLoginIfNeeded()) return;

  setAddRevisionMode();

  await Promise.all([loadRevisionSubjects(), loadRevisionTopics()]);
}

initializeRevisionPage().catch((error) => {
  console.error("Revision page initialization failed:", error);
  showToast("Failed to initialize Revision page.", "error");
});
