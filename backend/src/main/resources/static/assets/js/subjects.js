/**
 * subjects.js — EduMind AI
 * ------------------------------------------------------------
 * Student Subjects Module
 *
 * Features:
 * 1. Subject CRUD with secured backend APIs
 * 2. Syllabus upload through backend
 * 3. Backend AI syllabus analysis
 * 4. Saved AI analysis fetch after refresh
 * 5. Backend weekly planner creation
 * 6. English-only toast/status messages
 *
 * Important:
 * - No frontend Groq API key
 * - No browser-side AI call
 * - No frontend planner loop
 * - Backend handles PDF/DOCX/TXT extraction + AI + DB save
 */

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------
const SUBJECTS_API = "/api/subjects";
const SYLLABUS_API = "/api/syllabus";

// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------
let editingSubjectId = null;
let selectedSyllabusFile = null;

let currentAiTopics = [];
let currentAiSubjectId = null;
let currentAiSubjectName = "";
let currentAiResult = null;

// ------------------------------------------------------------
// DOM REFS
// ------------------------------------------------------------
const openSubjectModalBtn = document.getElementById("openSubjectModalBtn");
const subjectModalOverlay = document.getElementById("subjectModalOverlay");
const closeSubjectModalBtn = document.getElementById("closeSubjectModalBtn");
const cancelSubjectModalBtn = document.getElementById("cancelSubjectModalBtn");
const subjectModalForm = document.getElementById("subjectModalForm");
const subjectModalTitle = document.getElementById("subjectModalTitle");
const subjectSaveBtn = document.getElementById("subjectSaveBtn");

const subjectsGrid = document.getElementById("subjectsGrid");
const subjectsEmptyState = document.getElementById("subjectsEmptyState");
const subjectSearchInput = document.getElementById("subjectSearchInput");
const subjectFilterSelect = document.getElementById("subjectFilterSelect");

const totalSubjectsCount = document.getElementById("totalSubjectsCount");
const completedSubjectsCount = document.getElementById("completedSubjectsCount");
const inProgressSubjectsCount = document.getElementById("inProgressSubjectsCount");
const averageProgressCount = document.getElementById("averageProgressCount");

const subjectNameInput = document.getElementById("subjectName");
const subjectCodeInput = document.getElementById("subjectCode");
const subjectChaptersInput = document.getElementById("subjectChapters");
const subjectProgressInput = document.getElementById("subjectProgress");
const subjectIconInput = document.getElementById("subjectIcon");
const subjectDescriptionInput = document.getElementById("subjectDescription");

const syllabusUploadToggle = document.getElementById("syllabusUploadToggle");
const syllabusUploadArea = document.getElementById("syllabusUploadArea");
const syllabusDropzone = document.getElementById("syllabusDropzone");
const syllabusFileInput = document.getElementById("syllabusFileInput");
const syllabusFilePreview = document.getElementById("syllabusFilePreview");
const syllabusFileName = document.getElementById("syllabusFileName");
const syllabusFileSize = document.getElementById("syllabusFileSize");
const syllabusRemoveBtn = document.getElementById("syllabusRemoveBtn");
const syllabusFileError = document.getElementById("syllabusFileError");
const syllabusChaptersPreview = document.getElementById("syllabusChaptersPreview");

const aiAnalysisStatus = document.getElementById("aiAnalysisStatus");
const aiStatusTitle = document.getElementById("aiStatusTitle");
const aiStatusDesc = document.getElementById("aiStatusDesc");
const aiStatusBar = document.getElementById("aiStatusBar");

const aiSyllabusPanel = document.getElementById("aiSyllabusPanel");
const aiPanelSubjectName = document.getElementById("aiPanelSubjectName");
const aiCreatePlanBtn = document.getElementById("aiCreatePlanBtn");
const aiPanelCloseBtn = document.getElementById("aiPanelCloseBtn");

const aiTopicCount = document.getElementById("aiTopicCount");
const aiTotalHours = document.getElementById("aiTotalHours");
const aiWeeksNeeded = document.getElementById("aiWeeksNeeded");
const aiOverallDifficulty = document.getElementById("aiOverallDifficulty");
const aiTopicsGrid = document.getElementById("aiTopicsGrid");
const aiWeeksList = document.getElementById("aiWeeksList");

// ------------------------------------------------------------
// AUTH + API HELPERS
// ------------------------------------------------------------
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

async function authFetch(url, options = {}) {
  if (redirectToLoginIfNeeded()) {
    throw new Error("Login required.");
  }

  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  return response;
}

async function handleApiResponse(response) {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;

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
      // Keep fallback message
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json")
    ? response.json()
    : response.text();
}

// ------------------------------------------------------------
// STATUS BAR
// ------------------------------------------------------------
function setAiStatus(title, desc, progress) {
  if (!aiAnalysisStatus) return;

  aiAnalysisStatus.classList.remove("hidden");

  if (aiStatusTitle) aiStatusTitle.textContent = title;
  if (aiStatusDesc) aiStatusDesc.textContent = desc;
  if (aiStatusBar) aiStatusBar.style.width = `${progress}%`;
}

function hideAiStatus() {
  if (aiAnalysisStatus) {
    aiAnalysisStatus.classList.add("hidden");
  }

  if (aiStatusBar) {
    aiStatusBar.style.width = "0%";
  }
}

// ------------------------------------------------------------
// SUBJECT API
// ------------------------------------------------------------
async function fetchSubjectsFromApi() {
  const response = await authFetch(SUBJECTS_API);
  const data = await handleApiResponse(response);

  return Array.isArray(data) ? data.map(mapBackendSubject) : [];
}

async function createSubjectInApi(data) {
  const response = await authFetch(SUBJECTS_API, {
    method: "POST",
    body: JSON.stringify(buildPayload(data))
  });

  return handleApiResponse(response);
}

async function updateSubjectInApi(id, data) {
  const response = await authFetch(`${SUBJECTS_API}/${id}`, {
    method: "PUT",
    body: JSON.stringify(buildPayload(data))
  });

  return handleApiResponse(response);
}

async function deleteSubjectFromApi(id) {
  const response = await authFetch(`${SUBJECTS_API}/${id}`, {
    method: "DELETE"
  });

  return handleApiResponse(response);
}

// ------------------------------------------------------------
// SYLLABUS BACKEND AI API
// ------------------------------------------------------------
async function analyzeSyllabusForSubject(subjectId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await authFetch(`${SYLLABUS_API}/analyze/${subjectId}`, {
    method: "POST",
    body: formData
  });

  return handleApiResponse(response);
}

async function fetchSyllabusAnalysis(subjectId) {
  const response = await authFetch(`${SYLLABUS_API}/subject/${subjectId}`);
  return handleApiResponse(response);
}

async function createWeeklyPlanFromAnalysis(subjectId) {
  const response = await authFetch(`${SYLLABUS_API}/subject/${subjectId}/create-weekly-plan`, {
    method: "POST"
  });

  return handleApiResponse(response);
}

// ------------------------------------------------------------
// DATA MAPPING
// ------------------------------------------------------------
function mapBackendSubject(subject) {
  return {
    id: subject.id,
    name: subject.subjectName || subject.name || "",
    code: subject.code || "",
    chapters: Number(subject.chapters) || 0,
    progress: getSafeProgress(subject.progress),
    iconClass: subject.iconClass || "fa-book",
    description: subject.description || "",
    difficultyLevel: subject.difficultyLevel || "",
    hasSyllabus: Boolean(subject.hasSyllabus || subject.syllabusFile)
  };
}

function buildPayload(data) {
  return {
    name: data.name,
    code: data.code || "",
    chapters: Number(data.chapters) || 0,
    progress: getSafeProgress(data.progress),
    iconClass: data.iconClass || "fa-code",
    description: data.description || `Subject: ${data.name}`,
    difficultyLevel: data.difficultyLevel || ""
  };
}

function getSafeProgress(progress) {
  const value = Number(progress);
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
}

function getSubjectStatus(progress) {
  if (progress >= 100) return "completed";
  if (progress > 0) return "in-progress";
  return "pending";
}

function getProgressClass(progress) {
  if (progress >= 75) return "progress--high";
  if (progress >= 40) return "progress--mid";
  return "progress--low";
}

function capitalize(text) {
  if (!text) return "";
  return String(text).charAt(0).toUpperCase() + String(text).slice(1);
}

function formatNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isNaN(number) ? fallback : number;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ------------------------------------------------------------
// SUBJECT CARDS
// ------------------------------------------------------------
function createSubjectCard(subject) {
  const {
    id,
    name,
    chapters,
    progress,
    iconClass,
    description,
    code,
    hasSyllabus
  } = subject;

  const safeProgress = getSafeProgress(progress);
  const status = getSubjectStatus(safeProgress);

  const statusLabels = {
    completed: "Completed",
    "in-progress": "In Progress",
    pending: "Pending"
  };

  const statusIcons = {
    completed: "fa-circle-check",
    "in-progress": "fa-spinner",
    pending: "fa-clock"
  };

  const card = document.createElement("div");
  card.className = "subject-card";

  card.dataset.subjectId = id;
  card.dataset.progress = String(safeProgress);
  card.dataset.status = status;
  card.dataset.icon = iconClass;
  card.dataset.code = code || "";
  card.dataset.chapters = String(chapters);
  card.dataset.description = description || "";
  card.dataset.hasSyllabus = hasSyllabus ? "true" : "false";
  card.dataset.name = name || "";

  card.innerHTML = `
    <div class="subject-card-glow"></div>

    <div class="subject-card-top">
      <div class="subject-icon">
        <i class="fa-solid ${escapeHtml(iconClass)}"></i>
      </div>

      <div class="subject-card-top-right">
        <span class="subject-status-badge subject-status--${status}">
          <i class="fa-solid ${statusIcons[status]}"></i>
          ${statusLabels[status]}
        </span>

        <div class="subject-actions">
          ${
            hasSyllabus
              ? `
                <button class="subject-action-btn ai-view" title="View AI Analysis" data-id="${id}" data-name="${escapeHtml(name)}">
                  <i class="fa-solid fa-brain"></i>
                </button>
              `
              : ""
          }

          <button class="subject-action-btn edit" title="Edit Subject">
            <i class="fa-solid fa-pen"></i>
          </button>

          <button class="subject-action-btn delete" title="Delete Subject">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <h3>${escapeHtml(name)}</h3>

    ${code ? `<span class="subject-code-tag">${escapeHtml(code)}</span>` : ""}

    <p class="subject-desc">${escapeHtml(description || "No description added.")}</p>

    <div class="subject-meta">
      <span>
        <i class="fa-solid fa-layer-group"></i>
        ${chapters} Chapters
      </span>

      ${
        hasSyllabus
          ? `
            <span class="syllabus-badge">
              <i class="fa-solid fa-brain"></i>
              AI Ready
            </span>
          `
          : ""
      }
    </div>

    <div class="subject-progress-section">
      <div class="subject-progress-info">
        <span>Progress</span>
        <span class="subject-progress-pct">${safeProgress}%</span>
      </div>

      <div class="subject-progress-bar">
        <div class="subject-progress-fill ${getProgressClass(safeProgress)}" style="width:${safeProgress}%"></div>
      </div>
    </div>
  `;

  return card;
}

function renderSubjects(subjects) {
  if (!subjectsGrid) return;

  subjectsGrid.innerHTML = "";

  subjects.forEach((subject) => {
    subjectsGrid.appendChild(createSubjectCard(subject));
  });

  updateSubjectCounts();
  applySubjectFilters();
}

async function loadSubjects() {
  try {
    const subjects = await fetchSubjectsFromApi();

    renderSubjects(subjects);
    updateSubjectsEmptyState(subjects.length);

    localStorage.setItem("edumind_subjects_updated", Date.now().toString());
  } catch (error) {
    console.error("Failed to load subjects:", error);

    if (subjectsGrid) subjectsGrid.innerHTML = "";

    updateSubjectCounts();
    updateSubjectsEmptyState(0);
    showToast("Failed to load subjects. Please refresh the page.", "error");
  }
}

// ------------------------------------------------------------
// COUNTS + FILTERS
// ------------------------------------------------------------
function updateSubjectCounts() {
  if (!subjectsGrid) return;

  const cards = subjectsGrid.querySelectorAll(".subject-card");

  let total = cards.length;
  let completed = 0;
  let inProgress = 0;
  let totalProgress = 0;

  cards.forEach((card) => {
    const progress = Number(card.dataset.progress || 0);

    totalProgress += progress;

    if (progress >= 100) {
      completed++;
    } else {
      inProgress++;
    }
  });

  const average = total > 0 ? Math.round(totalProgress / total) : 0;

  if (totalSubjectsCount) totalSubjectsCount.textContent = String(total).padStart(2, "0");
  if (completedSubjectsCount) completedSubjectsCount.textContent = String(completed).padStart(2, "0");
  if (inProgressSubjectsCount) inProgressSubjectsCount.textContent = String(inProgress).padStart(2, "0");
  if (averageProgressCount) averageProgressCount.textContent = `${average}%`;
}

function applySubjectFilters() {
  if (!subjectsGrid) return;

  const cards = subjectsGrid.querySelectorAll(".subject-card");
  const search = subjectSearchInput?.value.toLowerCase().trim() || "";
  const filter = subjectFilterSelect?.value || "All Subjects";

  let visible = 0;

  cards.forEach((card) => {
    const title = card.dataset.name.toLowerCase();
    const description = card.dataset.description.toLowerCase();
    const code = card.dataset.code.toLowerCase();
    const status = card.dataset.status || "";

    const matchesSearch =
      title.includes(search) ||
      description.includes(search) ||
      code.includes(search);

    let matchesFilter = true;

    if (filter === "Completed") matchesFilter = status === "completed";
    if (filter === "In Progress") matchesFilter = status === "in-progress";
    if (filter === "Pending") matchesFilter = status === "pending";

    const shouldShow = matchesSearch && matchesFilter;

    card.style.display = shouldShow ? "" : "none";

    if (shouldShow) visible++;
  });

  updateSubjectsEmptyState(visible);
}

function updateSubjectsEmptyState(count) {
  subjectsEmptyState?.classList.toggle("hidden", count > 0);
}

// ------------------------------------------------------------
// AI PANEL RENDER
// ------------------------------------------------------------
function normalizeAiResult(result) {
  const topics = Array.isArray(result?.topics) ? result.topics : [];

  return {
    ...result,
    topics: topics.map((topic, index) => ({
      id: topic.id ?? null,
      topicNumber: topic.topicNumber ?? index + 1,
      topicName: topic.topicName || topic.topicTitle || `Topic ${index + 1}`,
      description: topic.description || topic.topicDescription || "",
      difficulty: String(topic.difficulty || "medium").toLowerCase(),
      estimatedHours: formatNumber(topic.estimatedHours, 2),
      recommendedWeek: formatNumber(topic.recommendedWeek, 1),
      plannerCreated: Boolean(topic.plannerCreated)
    }))
  };
}

function renderAiPanel(result, subjectId, subjectName) {
  const normalized = normalizeAiResult(result);

  currentAiResult = normalized;
  currentAiTopics = normalized.topics;
  currentAiSubjectId = subjectId;
  currentAiSubjectName = subjectName || normalized.subjectName || "";

  if (aiPanelSubjectName) {
    aiPanelSubjectName.textContent = `${currentAiSubjectName} — AI Weekly Study Plan`;
  }

  if (aiTopicCount) aiTopicCount.textContent = currentAiTopics.length;
  if (aiTotalHours) aiTotalHours.textContent = `${formatNumber(normalized.totalHours, 0)}h`;
  if (aiWeeksNeeded) aiWeeksNeeded.textContent = formatNumber(normalized.weeksNeeded, 0);
  if (aiOverallDifficulty) aiOverallDifficulty.textContent = capitalize(normalized.overallDifficulty || "medium");

  renderAiTopics("all");
  renderWeeklyPlan(normalized.weeklyPlan, normalized.weeksNeeded);

  updateCreatePlanButton(Boolean(normalized.plannerCreated));

  if (aiSyllabusPanel) {
    aiSyllabusPanel.classList.remove("hidden");
    aiSyllabusPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    if (normalized.studyTips) {
      aiSyllabusPanel.dataset.tips = normalized.studyTips;
    }
  }
}

function renderAiTopics(filter = "all") {
  if (!aiTopicsGrid) return;

  aiTopicsGrid.innerHTML = "";

  const filteredTopics =
    filter === "all"
      ? currentAiTopics
      : currentAiTopics.filter((topic) => topic.difficulty === filter);

  if (!filteredTopics.length) {
    aiTopicsGrid.innerHTML = `
      <div class="ai-no-topics">
        No topics found in this category.
      </div>
    `;
    return;
  }

  filteredTopics.forEach((topic, index) => {
    const difficulty = topic.difficulty || "medium";

    const difficultyIcons = {
      easy: "fa-leaf",
      medium: "fa-bolt",
      hard: "fa-fire"
    };

    const weekColor = getWeekColor(topic.recommendedWeek);

    const card = document.createElement("div");
    card.className = `ai-topic-card ai-topic-card--${difficulty}`;
    card.style.animationDelay = `${index * 0.06}s`;

    card.innerHTML = `
      <div class="ai-topic-top">
        <span class="ai-topic-num">${topic.topicNumber}</span>

        <span class="ai-difficulty-badge ai-diff-${difficulty}">
          <i class="fa-solid ${difficultyIcons[difficulty] || "fa-bolt"}"></i>
          ${capitalize(difficulty)}
        </span>
      </div>

      <h4 class="ai-topic-name">${escapeHtml(topic.topicName)}</h4>

      <p class="ai-topic-desc">${escapeHtml(topic.description || "Study this topic from your uploaded syllabus.")}</p>

      <div class="ai-topic-footer">
        <span class="ai-topic-hours">
          <i class="fa-regular fa-clock"></i>
          ${topic.estimatedHours}h
        </span>

        <span
          class="ai-topic-week"
          style="background:${weekColor}20;color:${weekColor};border:1px solid ${weekColor}40"
        >
          Week ${topic.recommendedWeek}
        </span>
      </div>
    `;

    aiTopicsGrid.appendChild(card);
  });
}

function renderWeeklyPlan(weeklyPlan, weeksNeeded) {
  if (!aiWeeksList) return;

  aiWeeksList.innerHTML = "";

  let weeks = Array.isArray(weeklyPlan) ? weeklyPlan : [];

  if (!weeks.length) {
    weeks = buildWeeklyPlanFromTopics(currentAiTopics, weeksNeeded || 1);
  }

  weeks.forEach((week) => {
    const topics = Array.isArray(week.topics) ? week.topics : [];
    const hours = formatNumber(week.hours, 0);

    const weekElement = document.createElement("div");
    weekElement.className = "ai-week-item";

    weekElement.innerHTML = `
      <div class="ai-week-header">
        <div class="ai-week-badge">Week ${week.week}</div>
        <span class="ai-week-hours">${hours}h</span>
      </div>

      <div class="ai-week-topics">
        ${
          topics.length
            ? topics
                .map((topic) => {
                  const name = topic.topicName || topic.topicTitle || "Topic";
                  const diff = String(topic.difficulty || "medium").toLowerCase();

                  return `
                    <span class="ai-week-topic-chip ai-diff-chip-${diff}">
                      ${escapeHtml(name)}
                    </span>
                  `;
                })
                .join("")
            : `<span class="ai-week-empty">Rest / Buffer week</span>`
        }
      </div>
    `;

    aiWeeksList.appendChild(weekElement);
  });
}

function buildWeeklyPlanFromTopics(topics, weeksNeeded) {
  const totalWeeks = Math.max(1, Number(weeksNeeded) || 1);
  const weeks = [];

  for (let week = 1; week <= totalWeeks; week++) {
    const weekTopics = topics.filter((topic) => Number(topic.recommendedWeek || 1) === week);

    const hours = weekTopics.reduce((sum, topic) => {
      return sum + formatNumber(topic.estimatedHours, 0);
    }, 0);

    weeks.push({
      week,
      hours,
      topics: weekTopics
    });
  }

  return weeks;
}

function getWeekColor(week) {
  const colors = [
    "#14b8a6",
    "#06b6d4",
    "#8b5cf6",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ec4899",
    "#f97316"
  ];

  const index = Math.max(0, (Number(week) || 1) - 1);
  return colors[index % colors.length];
}

function updateCreatePlanButton(plannerCreated) {
  if (!aiCreatePlanBtn) return;

  aiCreatePlanBtn.disabled = false;

  if (plannerCreated) {
    aiCreatePlanBtn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> Plan Already Created`;
    aiCreatePlanBtn.classList.add("is-created");
  } else {
    aiCreatePlanBtn.innerHTML = `<i class="fa-solid fa-calendar-plus"></i> Push to Planner`;
    aiCreatePlanBtn.classList.remove("is-created");
  }
}

// ------------------------------------------------------------
// AI BACKEND FLOWS
// ------------------------------------------------------------
async function processSyllabusWithBackendAI(file, subjectId, subjectName) {
  try {
    setAiStatus("Uploading syllabus...", "Sending your file securely to the backend.", 20);

    await new Promise((resolve) => setTimeout(resolve, 250));

    setAiStatus("Analyzing syllabus...", "AI is extracting topics, difficulty, hours, and weekly plan.", 55);

    const result = await analyzeSyllabusForSubject(subjectId, file);

    setAiStatus("Preparing study plan...", "Rendering your AI-generated weekly plan.", 90);

    await new Promise((resolve) => setTimeout(resolve, 350));

    hideAiStatus();

    renderAiPanel(result, subjectId, result.subjectName || subjectName);

    showToast("AI syllabus analysis completed successfully.", "success");

    return result;
  } catch (error) {
    console.error("AI syllabus analysis failed:", error);

    hideAiStatus();

    showToast(`AI analysis failed: ${error.message}`, "error");

    throw error;
  }
}

async function openSavedAiAnalysis(subjectId, subjectName) {
  if (!subjectId) return;

  try {
    setAiStatus("Loading AI analysis...", "Fetching saved syllabus plan from backend.", 35);

    const result = await fetchSyllabusAnalysis(subjectId);

    hideAiStatus();

    renderAiPanel(result, subjectId, result.subjectName || subjectName);

    showToast("Saved AI analysis loaded.", "success");
  } catch (error) {
    console.error("Saved AI analysis fetch failed:", error);

    hideAiStatus();

    showToast("No saved AI analysis found. Edit the subject and upload a syllabus first.", "error");
  }
}

async function pushTopicsToPlanner() {
  if (!currentAiSubjectId) {
    showToast("No AI analysis selected.", "error");
    return;
  }

  if (!currentAiTopics.length) {
    showToast("No AI topics available to push.", "error");
    return;
  }

  if (!aiCreatePlanBtn) return;

  const alreadyCreated = aiCreatePlanBtn.classList.contains("is-created");

  if (alreadyCreated) {
    showToast("This weekly plan is already added to Planner.", "success");
    return;
  }

  aiCreatePlanBtn.disabled = true;
  aiCreatePlanBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating plan...`;

  try {
    const result = await createWeeklyPlanFromAnalysis(currentAiSubjectId);

    const createdCount = Number(result.createdCount || 0);
    const duplicateCount = Number(result.duplicateCount || 0);

    updateCreatePlanButton(true);

    if (currentAiResult) {
      currentAiResult.plannerCreated = true;
    }

    currentAiTopics = currentAiTopics.map((topic) => ({
      ...topic,
      plannerCreated: true
    }));

    localStorage.setItem("edumind_planner_updated", Date.now().toString());

    if (createdCount > 0) {
      showToast(`${createdCount} study sessions added to Planner.`, "success");
    } else if (duplicateCount > 0) {
      showToast("Planner entries already exist for this syllabus.", "success");
    } else {
      showToast("Weekly plan processed successfully.", "success");
    }
  } catch (error) {
    console.error("Planner creation failed:", error);

    updateCreatePlanButton(false);

    showToast(`Failed to create planner entries: ${error.message}`, "error");
  }
}

// ------------------------------------------------------------
// MODAL OPEN / CLOSE
// ------------------------------------------------------------
function openSubjectModal() {
  if (!subjectModalOverlay) return;

  subjectModalOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeSubjectModal() {
  if (!subjectModalOverlay) return;

  subjectModalOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

function setAddMode() {
  editingSubjectId = null;

  if (subjectModalTitle) {
    subjectModalTitle.textContent = "Add New Subject";
  }

  restoreSubjectSaveButton();
}

function setEditMode() {
  if (subjectModalTitle) {
    subjectModalTitle.textContent = "Edit Subject";
  }

  restoreSubjectSaveButton();
}

function restoreSubjectSaveButton() {
  if (!subjectSaveBtn) return;

  if (editingSubjectId) {
    subjectSaveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Update Subject`;
  } else {
    subjectSaveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Subject`;
  }
}

function resetSubjectForm() {
  subjectModalForm?.reset();

  if (subjectIconInput) subjectIconInput.value = "fa-code";
  if (subjectProgressInput) subjectProgressInput.value = "0";

  selectedSyllabusFile = null;

  resetSyllabusUploadUI();
  hideFieldErrors();
}

function clearSubjectModalState() {
  resetSubjectForm();
  setAddMode();
}

// ------------------------------------------------------------
// SYLLABUS UPLOAD UI
// ------------------------------------------------------------
function resetSyllabusUploadUI() {
  selectedSyllabusFile = null;

  if (syllabusFileInput) syllabusFileInput.value = "";
  if (syllabusFilePreview) syllabusFilePreview.classList.add("hidden");
  if (syllabusDropzone) syllabusDropzone.classList.remove("hidden");
  if (syllabusFileError) syllabusFileError.classList.add("hidden");
  if (syllabusChaptersPreview) syllabusChaptersPreview.classList.add("hidden");
  if (syllabusUploadToggle) syllabusUploadToggle.checked = false;
  if (syllabusUploadArea) syllabusUploadArea.classList.add("hidden");

  hideAiStatus();
}

function handleSyllabusFileSelected(file) {
  const allowedTypes = ["pdf", "docx", "txt"];
  const extension = file.name.split(".").pop().toLowerCase();

  if (!allowedTypes.includes(extension)) {
    showSyllabusError("Invalid file type. Please upload PDF, DOCX, or TXT.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showSyllabusError("File is too large. Maximum allowed size is 10 MB.");
    return;
  }

  selectedSyllabusFile = file;

  if (syllabusFileName) syllabusFileName.textContent = file.name;
  if (syllabusFileSize) syllabusFileSize.textContent = formatFileSize(file.size);
  if (syllabusFilePreview) syllabusFilePreview.classList.remove("hidden");
  if (syllabusDropzone) syllabusDropzone.classList.add("hidden");
  if (syllabusFileError) syllabusFileError.classList.add("hidden");
}

function showSyllabusError(message) {
  if (!syllabusFileError) return;

  syllabusFileError.textContent = message;
  syllabusFileError.classList.remove("hidden");
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------
function showFieldError(id, message) {
  const element = document.getElementById(id);

  if (!element) return;

  element.textContent = message;
  element.classList.remove("hidden");
}

function hideFieldErrors() {
  document.querySelectorAll(".field-error").forEach((element) => {
    element.classList.add("hidden");
  });
}

function validateSubjectForm() {
  hideFieldErrors();

  const name = subjectNameInput?.value.trim() || "";
  const chapters = subjectChaptersInput?.value.trim() || "";

  let hasError = false;

  if (!name) {
    showFieldError("subjectNameError", "Subject name is required.");
    hasError = true;
  }

  if (!chapters) {
    showFieldError("subjectChaptersError", "Please enter total chapters.");
    hasError = true;
  }

  if (Number(chapters) < 0) {
    showFieldError("subjectChaptersError", "Chapters cannot be negative.");
    hasError = true;
  }

  if (syllabusUploadToggle?.checked && !selectedSyllabusFile) {
    showSyllabusError("Please select a syllabus file or turn off syllabus upload.");
    hasError = true;
  }

  return !hasError;
}

// ------------------------------------------------------------
// EDIT FORM FILL
// ------------------------------------------------------------
function fillSubjectFormForEdit(card) {
  if (!card) return;

  editingSubjectId = card.dataset.subjectId || null;

  if (subjectNameInput) {
    subjectNameInput.value = card.dataset.name || card.querySelector("h3")?.textContent.trim() || "";
  }

  if (subjectCodeInput) {
    subjectCodeInput.value = card.dataset.code || "";
  }

  if (subjectChaptersInput) {
    subjectChaptersInput.value = card.dataset.chapters || "";
  }

  if (subjectProgressInput) {
    subjectProgressInput.value = card.dataset.progress || "0";
  }

  if (subjectIconInput) {
    subjectIconInput.value = card.dataset.icon || "fa-code";
  }

  if (subjectDescriptionInput) {
    subjectDescriptionInput.value = card.dataset.description || "";
  }

  if (card.dataset.hasSyllabus === "true") {
    if (syllabusUploadToggle) syllabusUploadToggle.checked = false;
    if (syllabusUploadArea) syllabusUploadArea.classList.add("hidden");
  }
}

// ------------------------------------------------------------
// TOAST
// ------------------------------------------------------------
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
      fontWeight: "600",
      boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
      transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      opacity: "0",
      transform: "translateY(12px)",
      pointerEvents: "none",
      maxWidth: "420px",
      lineHeight: "1.5"
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

// ------------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------------
openSubjectModalBtn?.addEventListener("click", () => {
  clearSubjectModalState();
  openSubjectModal();
});

closeSubjectModalBtn?.addEventListener("click", () => {
  closeSubjectModal();
  clearSubjectModalState();
});

cancelSubjectModalBtn?.addEventListener("click", () => {
  closeSubjectModal();
  clearSubjectModalState();
});

subjectModalOverlay?.addEventListener("click", (event) => {
  if (event.target === subjectModalOverlay) {
    closeSubjectModal();
    clearSubjectModalState();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    subjectModalOverlay &&
    !subjectModalOverlay.classList.contains("hidden")
  ) {
    closeSubjectModal();
    clearSubjectModalState();
  }
});

syllabusUploadToggle?.addEventListener("change", function () {
  if (syllabusUploadArea) {
    syllabusUploadArea.classList.toggle("hidden", !this.checked);
  }

  if (!this.checked) {
    resetSyllabusUploadUI();
  }
});

syllabusFileInput?.addEventListener("change", function () {
  const file = this.files?.[0];

  if (file) {
    handleSyllabusFileSelected(file);
  }
});

syllabusRemoveBtn?.addEventListener("click", () => {
  resetSyllabusUploadUI();

  if (syllabusUploadToggle) syllabusUploadToggle.checked = true;
  if (syllabusUploadArea) syllabusUploadArea.classList.remove("hidden");
});

syllabusDropzone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  syllabusDropzone.classList.add("dragover");
});

syllabusDropzone?.addEventListener("dragleave", () => {
  syllabusDropzone.classList.remove("dragover");
});

syllabusDropzone?.addEventListener("drop", (event) => {
  event.preventDefault();

  syllabusDropzone.classList.remove("dragover");

  const file = event.dataTransfer.files?.[0];

  if (file) {
    handleSyllabusFileSelected(file);
  }
});

aiPanelCloseBtn?.addEventListener("click", () => {
  aiSyllabusPanel?.classList.add("hidden");

  currentAiTopics = [];
  currentAiSubjectId = null;
  currentAiSubjectName = "";
  currentAiResult = null;
});

aiCreatePlanBtn?.addEventListener("click", pushTopicsToPlanner);

document.querySelectorAll(".ai-tab").forEach((tab) => {
  tab.addEventListener("click", function () {
    document.querySelectorAll(".ai-tab").forEach((item) => {
      item.classList.remove("active");
    });

    this.classList.add("active");

    renderAiTopics(this.dataset.filter || "all");
  });
});

subjectSearchInput?.addEventListener("input", applySubjectFilters);
subjectFilterSelect?.addEventListener("change", applySubjectFilters);

// ------------------------------------------------------------
// FORM SUBMIT
// ------------------------------------------------------------
subjectModalForm?.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!validateSubjectForm()) {
    return;
  }

  const subjectData = {
    name: subjectNameInput?.value.trim() || "",
    code: subjectCodeInput?.value.trim() || "",
    chapters: subjectChaptersInput?.value.trim() || "0",
    progress: getSafeProgress(subjectProgressInput?.value || 0),
    iconClass: subjectIconInput?.value.trim() || "fa-code",
    description: subjectDescriptionInput?.value.trim() || "",
    difficultyLevel: ""
  };

  if (!subjectSaveBtn) return;

  const wasEditing = Boolean(editingSubjectId);

  subjectSaveBtn.disabled = true;
  subjectSaveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  try {
    let savedSubject;

    if (editingSubjectId) {
      savedSubject = await updateSubjectInApi(editingSubjectId, subjectData);
    } else {
      savedSubject = await createSubjectInApi(subjectData);
    }

    const subjectId = savedSubject?.id || editingSubjectId;
    const subjectName = savedSubject?.name || savedSubject?.subjectName || subjectData.name;

    if (syllabusUploadToggle?.checked && selectedSyllabusFile) {
      subjectSaveBtn.innerHTML = `<i class="fa-solid fa-brain fa-spin"></i> Analyzing...`;

      closeSubjectModal();

      await processSyllabusWithBackendAI(selectedSyllabusFile, subjectId, subjectName);

      clearSubjectModalState();
      await loadSubjects();

      return;
    }

    showToast(wasEditing ? "Subject updated successfully." : "Subject added successfully.", "success");

    closeSubjectModal();
    clearSubjectModalState();

    await loadSubjects();
  } catch (error) {
    console.error("Subject save failed:", error);

    showToast(`Failed to save subject: ${error.message}`, "error");
  } finally {
    subjectSaveBtn.disabled = false;
    restoreSubjectSaveButton();
  }
});

// ------------------------------------------------------------
// CARD ACTIONS
// ------------------------------------------------------------
subjectsGrid?.addEventListener("click", async function (event) {
  const deleteButton = event.target.closest(".subject-action-btn.delete");
  const editButton = event.target.closest(".subject-action-btn.edit");
  const aiButton = event.target.closest(".subject-action-btn.ai-view");

  if (deleteButton) {
    const card = deleteButton.closest(".subject-card");
    const subjectId = card?.dataset.subjectId;

    if (!subjectId) return;

    const confirmed = confirm("Delete this subject? This action cannot be undone.");

    if (!confirmed) return;

    try {
      await deleteSubjectFromApi(subjectId);

      showToast("Subject deleted successfully.", "success");

      if (currentAiSubjectId === subjectId) {
        aiSyllabusPanel?.classList.add("hidden");
      }

      await loadSubjects();
    } catch (error) {
      console.error("Delete failed:", error);

      showToast(`Failed to delete subject: ${error.message}`, "error");
    }

    return;
  }

  if (editButton) {
    const card = editButton.closest(".subject-card");

    if (!card) return;

    resetSubjectForm();
    setEditMode();
    fillSubjectFormForEdit(card);
    openSubjectModal();

    return;
  }

  if (aiButton) {
    const subjectId = aiButton.dataset.id;
    const subjectName = aiButton.dataset.name;

    await openSavedAiAnalysis(subjectId, subjectName);
  }
});

// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------
document.getElementById("logoutBtn")?.addEventListener("click", (event) => {
  event.preventDefault();

  localStorage.clear();
  window.location.href = "login.html";
});

document.getElementById("profileLogoutBtn")?.addEventListener("click", (event) => {
  event.preventDefault();

  localStorage.clear();
  window.location.href = "login.html";
});

// ------------------------------------------------------------
// INIT
// ------------------------------------------------------------
function initSubjectsPage() {
  if (redirectToLoginIfNeeded()) return;

  setAddMode();
  loadSubjects();
}

initSubjectsPage();