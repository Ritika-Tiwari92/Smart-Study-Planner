/**
 * pomodoro.js — EduMind AI
 * Student Pomodoro Timer + Study Library
 * Connected with new backend:
 * POST /api/pomodoro/start
 * PUT  /api/pomodoro/{id}/complete
 * GET  /api/pomodoro/my
 */

document.addEventListener("DOMContentLoaded", function () {
  const API = "http://localhost:8080";
  const PAGE_TITLE = "Pomodoro & Study Library | EduMind AI";
  const YOUTUBE_ANALYZE_API = "/api/youtube/analyze";
  const POMODORO_AI_SUGGEST_API = "/api/ai/pomodoro/suggest";

  let subjects = [];
  let videos = [];
  let linkedTasks = [];
  let linkedRevisions = [];
  let linkedPlans = [];
  let activeSessionId = null;
  let activeVideoId = null;
  let timerInterval = null;
  let totalSeconds = 25 * 60;
  let remainingSeconds = totalSeconds;
  let timerRunning = false;
  let sessionStartedAtMs = null;
  let currentRound = 1;
  let completedRounds = 0;
  let currentFilter = "all";
  let currentSubjectFilter = "all";
  let currentMode = "focus";
  let currentDailyTarget = 3;
  let latestYoutubeAnalysis = null;

  const CIRCUMFERENCE = 553;

  let customFocus = parseInt(localStorage.getItem("pom_focus") || "25", 10);
  let customShort = parseInt(localStorage.getItem("pom_short") || "5", 10);
  let customLong = parseInt(localStorage.getItem("pom_long") || "15", 10);

  const pomSubjectSelect = document.getElementById("pomSubjectSelect");
  const pomVideoSelect = document.getElementById("pomVideoSelect");
  const pomTaskSelect = document.getElementById("pomTaskSelect");
  const pomRevisionSelect = document.getElementById("pomRevisionSelect");
  const pomPlanSelect = document.getElementById("pomPlanSelect");
  const pomSubjectError = document.getElementById("pomSubjectError");

  const pomTimeDisplay = document.getElementById("pomTimeDisplay");
  const pomStatusText = document.getElementById("pomStatusText");
  const pomRingProgress = document.getElementById("pomRingProgress");
  const pomStartBtn = document.getElementById("pomStartBtn");
  const pomPauseBtn = document.getElementById("pomPauseBtn");
  const pomResumeBtn = document.getElementById("pomResumeBtn");
  const pomCancelBtn = document.getElementById("pomCancelBtn");
  const pomSessionInfo = document.getElementById("pomSessionInfo");
  const pomSessionInfoText = document.getElementById("pomSessionInfoText");
  const pomAiSuggestBtn = document.getElementById("pomAiSuggestBtn");
  const pomAiResult = document.getElementById("pomAiResult");

  const pomHistoryList = document.getElementById("pomHistoryList");
  const pomHistoryTotalMinutes = document.getElementById(
    "pomHistoryTotalMinutes",
  );
  const pomHistoryCompleted = document.getElementById("pomHistoryCompleted");
  const pomHistoryStreak = document.getElementById("pomHistoryStreak");
  const pomRoundsLabel = document.getElementById("pomRoundsLabel");

  const statCurrentStreak = document.getElementById("statCurrentStreak");
  const statTodayFocus = document.getElementById("statTodayFocus");
  const statVideosToday = document.getElementById("statVideosToday");
  const statSessionsToday = document.getElementById("statSessionsToday");
  const statDailyTarget = document.getElementById("statDailyTarget");
  const statTotalHours = document.getElementById("statTotalHours");
  const statBestTime = document.getElementById("statBestTime");
  const statBestPeriod = document.getElementById("statBestPeriod");
  const pomTargetText = document.getElementById("pomTargetText");
  const pomTargetFill = document.getElementById("pomTargetFill");
  const pomTargetPct = document.getElementById("pomTargetPct");

  const pomVideoList = document.getElementById("pomVideoList");
  const pomLibraryEmpty = document.getElementById("pomLibraryEmpty");
  const librarySubjectFilter = document.getElementById("librarySubjectFilter");

  const openAddVideoBtn = document.getElementById("openAddVideoBtn");
  const addVideoModalOverlay = document.getElementById("addVideoModalOverlay");
  const closeAddVideoModal = document.getElementById("closeAddVideoModal");
  const cancelAddVideoModal = document.getElementById("cancelAddVideoModal");
  const saveVideoBtn = document.getElementById("saveVideoBtn");
  const addVideoSubject = document.getElementById("addVideoSubject");
  const addVideoTitle = document.getElementById("addVideoTitle");
  const addVideoUrl = document.getElementById("addVideoUrl");
  const addVideoTag = document.getElementById("addVideoTag");
  const addVideoDuration = document.getElementById("addVideoDuration");
  const analyzeYoutubeBtn = document.getElementById("analyzeYoutubeBtn");
  const youtubeAnalyzeResult = document.getElementById("youtubeAnalyzeResult");
  const addVideoSubjectError = document.getElementById("addVideoSubjectError");
  const addVideoTitleError = document.getElementById("addVideoTitleError");

  const sessionCompleteModal = document.getElementById("sessionCompleteModal");
  const sessionCompleteMsg = document.getElementById("sessionCompleteMsg");
  const markVideoCompleteBtn = document.getElementById("markVideoCompleteBtn");
  const skipMarkCompleteBtn = document.getElementById("skipMarkCompleteBtn");

  const badgeUnlockPopup = document.getElementById("badgeUnlockPopup");
  const badgeUnlockName = document.getElementById("badgeUnlockName");
  const closeBadgePopup = document.getElementById("closeBadgePopup");

  const pomYtPlayerWrap = document.getElementById("pomYtPlayerWrap");
  const pomYtFrame = document.getElementById("pomYtFrame");
  const pomYtVideoTitle = document.getElementById("pomYtVideoTitle");
  const pomYtCloseBtn = document.getElementById("pomYtCloseBtn");
  const pomYtPipBtn = document.getElementById("pomYtPipBtn");
  const pomYtPauseOverlay = document.getElementById("pomYtPauseOverlay");
  const pomStatsCol = document.getElementById("pomStatsCol");

  function getToken() {
    return (localStorage.getItem("token") || "").trim();
  }

  function getLoggedInUser() {
    const keys = [
      "edumind_logged_in_user",
      "loggedInUser",
      "user",
      "currentUser",
    ];

    for (const key of keys) {
      try {
        const value = localStorage.getItem(key);
        if (value) return JSON.parse(value);
      } catch (e) {}
    }

    return {};
  }

  function getStudentName() {
    const user = getLoggedInUser();
    return user.fullName || user.name || user.username || "Student";
  }

  function getStudentEmail() {
    const user = getLoggedInUser();
    return user.email || "";
  }

  function setupProfile() {
    const nameEl = document.getElementById("pomProfileName");
    const avatarEl = document.getElementById("pomProfileAvatar");

    const user = getLoggedInUser();

    const name = user.fullName || user.name || user.username || "Student";

    if (nameEl) {
      nameEl.textContent = name;
    }

    const savedPhoto =
      localStorage.getItem("edumind_profile_photo") ||
      localStorage.getItem("profilePhoto") ||
      user.profilePhoto ||
      user.photoUrl ||
      user.avatarUrl ||
      "";

    if (avatarEl && savedPhoto) {
      avatarEl.src = savedPhoto;
    }
  }

  async function apiFetch(url, options = {}) {
    const token = getToken();

    if (!token) {
      window.location.href = "login.html";
      return null;
    }

    const response = await fetch(API + url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      window.location.href = "login.html";
      return null;
    }

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text };
      }
    }

    if (!response.ok) {
      throw new Error(data?.message || `Request failed: ${response.status}`);
    }

    return data;
  }

  function showToast(message, type = "success") {
    let toast = document.getElementById("pomToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "pomToast";
      toast.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                padding: 12px 22px;
                border-radius: 12px;
                font-size: 14px;
                font-family: Poppins, sans-serif;
                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                transition: opacity 0.3s;
                opacity: 0;
                pointer-events: none;
                font-weight: 600;
                min-width: 220px;
                text-align: center;
            `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.background =
      type === "error" ? "#ef4444" : type === "info" ? "#2563eb" : "#10b981";
    toast.style.color = "#fff";
    toast.style.opacity = "1";

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = "0";
    }, 3000);
  }

  function escHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function unwrapArray(data, key = "sessions") {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data[key])) return data[key];
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.content)) return data.content;
    return [];
  }

  function unwrapSessionId(data) {
    return data?.id || data?.session?.id || data?.data?.id || null;
  }

  function formatTime(total) {
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (total % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function updateTabTitle(remaining, mode, paused) {
    if (remaining === null) {
      document.title = PAGE_TITLE;
      return;
    }

    const icon = paused ? "⏸" : mode === "break" ? "☕" : "⏱";
    const label = paused ? "Paused" : mode === "break" ? "Break" : "Study";
    document.title = `${icon} ${formatTime(remaining)} — ${label} | EduMind`;
  }

  function updateRing(remaining, total) {
    if (!pomRingProgress) return;

    const safeTotal = total <= 0 ? 1 : total;
    const offset = CIRCUMFERENCE * (1 - remaining / safeTotal);
    pomRingProgress.style.strokeDasharray = CIRCUMFERENCE;
    pomRingProgress.style.strokeDashoffset = offset;
  }

  function setTimerDisplay(seconds) {
    if (pomTimeDisplay) pomTimeDisplay.textContent = formatTime(seconds);
    updateRing(seconds, totalSeconds);
  }

  function updateRoundDots() {
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById(`round${i}`);
      if (!dot) continue;

      dot.classList.remove("active", "done");

      if (i < currentRound) dot.classList.add("done");
      if (i === currentRound) dot.classList.add("active");
    }

    if (pomRoundsLabel) {
      pomRoundsLabel.textContent = `Round ${currentRound} of 4`;
    }
  }

  function currentSessionType() {
    if (currentMode === "focus") return "POMODORO";

    const plannedMinutes = Math.max(1, Math.round(totalSeconds / 60));
    return plannedMinutes >= customLong ? "LONG_BREAK" : "SHORT_BREAK";
  }

  function getSelectedSubjectName(subjectId) {
    const subject = subjects.find(
      (item) => String(item.id) === String(subjectId),
    );
    return subject
      ? subject.subjectName || subject.name || "Subject"
      : "Subject";
  }

  function getSelectedVideoTitle(videoId) {
    if (!videoId) return "Focus session";

    const video = videos.find((item) => String(item.id) === String(videoId));
    return video ? video.title || "Study topic" : "Study topic";
  }

  function getPomodoroVideoById(videoId) {
    if (!videoId) return null;

    return (
      videos.find((video) => {
        return String(video.id) === String(videoId);
      }) || null
    );
  }

  function getVideoDurationMinutes(video) {
    if (!video) return 0;

    const durationMinutes =
      video.durationMinutes ||
      video.duration ||
      video.plannedDurationMinutes ||
      0;

    if (durationMinutes && Number(durationMinutes) > 0) {
      return Math.max(1, Math.round(Number(durationMinutes)));
    }

    const durationSeconds =
      video.durationSeconds || video.durationInSeconds || 0;

    if (durationSeconds && Number(durationSeconds) > 0) {
      return Math.max(1, Math.ceil(Number(durationSeconds) / 60));
    }

    return 0;
  }

  function applySelectedVideoDuration(videoId) {
    if (!videoId) return;

    if (timerRunning) {
      showToast(
        "Stop or cancel the current session before changing video duration.",
        "info",
      );
      return;
    }

    const video = getPomodoroVideoById(videoId);

    if (!video) {
      console.warn("Selected video not found in videos array:", videoId);
      return;
    }

    const minutes = getVideoDurationMinutes(video);

    if (!minutes) {
      showToast(
        "No duration found for this video. You can use custom timer.",
        "info",
      );
      return;
    }

    activeVideoId = videoId;

    setMode(minutes, "focus");

    document.querySelectorAll(".pom-mode-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    if (pomStatusText) {
      pomStatusText.textContent = `Ready • ${minutes} min video`;
    }

    showToast(
      `Timer auto-set to ${minutes} minutes from selected video.`,
      "success",
    );
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

  function renderPomodoroAiSuggestion(suggestion) {
    if (!pomAiResult || !suggestion) return;

    const checklist = normalizeAiList(suggestion.preSessionChecklist);
    const tips = normalizeAiList(suggestion.duringSessionTips);

    pomAiResult.classList.remove("hidden");

    pomAiResult.innerHTML = `
        <h5>
            <i class="fa-solid fa-brain"></i>
            ${escHtml(suggestion.focusTitle || "AI Focus Plan")}
        </h5>

        <p>
            <strong>Mode:</strong> ${escHtml(suggestion.focusMode || "Deep Focus")}
            • <strong>Duration:</strong> ${escHtml(suggestion.recommendedDuration || Math.round(totalSeconds / 60))} min
        </p>

        <p>${escHtml(suggestion.reason || "AI created a focus plan using your selected study context.")}</p>

        <p>
            <strong>Before starting:</strong>
        </p>
        ${
          checklist.length
            ? `<ul>${checklist.map((item) => `<li>${escHtml(item)}</li>`).join("")}</ul>`
            : `<p>No checklist generated.</p>`
        }

        <p>
            <strong>During session:</strong>
        </p>
        ${
          tips.length
            ? `<ul>${tips.map((item) => `<li>${escHtml(item)}</li>`).join("")}</ul>`
            : `<p>No session tips generated.</p>`
        }

        <p>
            <strong>After session:</strong>
            ${escHtml(suggestion.afterSessionAction || "Write a short summary of what you studied.")}
        </p>

        <p>
            <strong>Burnout:</strong>
            ${escHtml(suggestion.burnoutWarning || "Take a small break after this focus session.")}
        </p>

        <p>
            <strong>Productivity impact:</strong>
            ${escHtml(suggestion.productivityScoreImpact || "This session can improve your focus consistency.")}
        </p>
    `;
  }

  function getSelectedVideoText() {
    const videoId = pomVideoSelect?.value || "";

    if (!videoId) return "";

    const video = getPomodoroVideoById(videoId);

    if (video?.title) {
      return video.title;
    }

    return getSelectedOptionText(pomVideoSelect);
  }

  function getSessionStatusClass(status) {
    const value = String(status || "")
      .trim()
      .toLowerCase();

    if (value.includes("completed")) return "completed";
    if (value.includes("interrupted")) return "interrupted";
    if (value.includes("cancelled")) return "cancelled";
    if (value.includes("active")) return "active";

    return "active";
  }

  function getSessionStatusIcon(status) {
    const value = String(status || "")
      .trim()
      .toUpperCase();

    if (value === "COMPLETED") return "fa-solid fa-circle-check";
    if (value === "INTERRUPTED" || value === "CANCELLED")
      return "fa-solid fa-triangle-exclamation";
    if (value === "ACTIVE") return "fa-solid fa-circle-play";

    return "fa-solid fa-clock";
  }

  function getSessionTitle(session) {
    return (
      session.topic ||
      session.videoTitle ||
      session.linkedSubjectName ||
      session.subjectName ||
      "Focus Session"
    );
  }

  function getSessionSubject(session) {
    return (
      session.linkedSubjectName ||
      session.subjectName ||
      session.subject ||
      "General"
    );
  }

  function getSessionMinutes(session) {
    return Number(
      session.focusMinutes ||
        session.actualDurationMinutes ||
        session.actualMinutes ||
        0,
    );
  }

  function getSessionDateValue(session) {
    return (
      session.sessionDate ||
      session.startedAt ||
      session.startTime ||
      session.createdAt ||
      ""
    );
  }

  function formatSessionDate(value) {
    if (!value) return "No date";

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10);
      }

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return String(value).slice(0, 10);
    }
  }

  function calculateFocusStreak(sessions) {
    const completedDates = new Set();

    sessions.forEach((session) => {
      const status = String(session.status || "").toUpperCase();

      if (status !== "COMPLETED") return;

      const dateValue = getSessionDateValue(session);

      if (!dateValue) return;

      const date = new Date(dateValue);

      if (!Number.isNaN(date.getTime())) {
        completedDates.add(date.toISOString().slice(0, 10));
      } else {
        completedDates.add(String(dateValue).slice(0, 10));
      }
    });

    let streak = 0;
    const cursor = new Date();

    while (true) {
      const key = cursor.toISOString().slice(0, 10);

      if (!completedDates.has(key)) {
        break;
      }

      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  function renderFocusHistory(sessions) {
    if (!pomHistoryList) return;

    const safeSessions = Array.isArray(sessions) ? sessions : [];

    const completedSessions = safeSessions.filter((session) => {
      return String(session.status || "").toUpperCase() === "COMPLETED";
    });

    const totalMinutes = completedSessions.reduce((sum, session) => {
      return sum + getSessionMinutes(session);
    }, 0);

    if (pomHistoryTotalMinutes) {
      pomHistoryTotalMinutes.textContent = totalMinutes;
    }

    if (pomHistoryCompleted) {
      pomHistoryCompleted.textContent = completedSessions.length;
    }

    if (pomHistoryStreak) {
      pomHistoryStreak.textContent = calculateFocusStreak(safeSessions);
    }

    const recentSessions = safeSessions.slice(0, 8);

    if (!recentSessions.length) {
      pomHistoryList.innerHTML = `
            <div class="pom-history-empty">
                <i class="fa-regular fa-clock"></i>
                <p>No focus history yet. Start a session to build your streak.</p>
            </div>
        `;
      return;
    }

    pomHistoryList.innerHTML = recentSessions
      .map((session) => {
        const status = String(session.status || "ACTIVE").toUpperCase();
        const statusClass = getSessionStatusClass(status);
        const icon = getSessionStatusIcon(status);
        const title = getSessionTitle(session);
        const subject = getSessionSubject(session);
        const minutes = getSessionMinutes(session);
        const dateText = formatSessionDate(getSessionDateValue(session));

        const linkParts = [
          session.linkedTaskId ? `Task #${session.linkedTaskId}` : "",
          session.linkedRevisionId
            ? `Revision #${session.linkedRevisionId}`
            : "",
          session.linkedPlanId ? `Planner #${session.linkedPlanId}` : "",
        ].filter(Boolean);

        const linkText = linkParts.length ? ` • ${linkParts.join(" • ")}` : "";

        return `
            <div class="pom-history-item">
                <div class="pom-history-icon">
                    <i class="${icon}"></i>
                </div>

                <div class="pom-history-info">
                    <h4>${escHtml(title)}</h4>
                    <p>
                        ${escHtml(subject)}
                        • ${escHtml(minutes)} min
                        • ${escHtml(dateText)}
                        ${escHtml(linkText)}
                    </p>
                </div>

                <span class="pom-history-badge ${statusClass}">
                    ${escHtml(status)}
                </span>
            </div>
        `;
      })
      .join("");
  }

  async function loadFocusHistory() {
    try {
      const data = await apiFetch("/api/pomodoro/my");
      const sessions = unwrapArray(data, "sessions");

      renderFocusHistory(sessions);
    } catch (error) {
      console.warn("Focus history load failed:", error.message);

      if (pomHistoryList) {
        pomHistoryList.innerHTML = `
                <div class="pom-history-empty">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <p>Could not load focus history right now.</p>
                </div>
            `;
      }
    }
  }

  function buildPomodoroAiPayload() {
    return {
      subjectName: getSelectedSubjectLabel() || "General",
      selectedTask: getSelectedOptionText(pomTaskSelect),
      selectedRevision: getSelectedOptionText(pomRevisionSelect),
      selectedPlan: getSelectedOptionText(pomPlanSelect),
      videoTitle: getSelectedVideoText(),
      plannedDurationMinutes: Math.max(1, Math.round(totalSeconds / 60)),
      totalFocusMinutes: Number(
        statTodayFocus?.textContent?.replace(/\D/g, "") || 0,
      ),
      completedSessions: Number(
        statSessionsToday?.textContent?.replace(/\D/g, "") || 0,
      ),
      interruptedSessions: 0,
      notes: "Pomodoro AI suggestion requested from Study Timer page.",
    };
  }

  async function getPomodoroAiSuggestion() {
    if (!pomAiSuggestBtn) return;

    const oldContent = pomAiSuggestBtn.innerHTML;

    pomAiSuggestBtn.disabled = true;
    pomAiSuggestBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Thinking...
    `;

    try {
      const payload = buildPomodoroAiPayload();

      const suggestion = await apiFetch(POMODORO_AI_SUGGEST_API, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      renderPomodoroAiSuggestion(suggestion);
      showToast("AI focus plan generated.", "success");
    } catch (error) {
      console.error("Pomodoro AI suggestion failed:", error);
      showToast(error.message || "Unable to generate AI focus plan.", "error");
    } finally {
      pomAiSuggestBtn.disabled = false;
      pomAiSuggestBtn.innerHTML = oldContent;
    }
  }

  function toNullableLong(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numberValue = Number(value);

    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
  }

  function getSelectedOptionText(select) {
    if (!select || !select.value) {
      return "";
    }

    const selectedOption = select.options[select.selectedIndex];

    return selectedOption ? selectedOption.textContent.trim() : "";
  }

  function getActualFocusMinutes() {
    if (!sessionStartedAtMs) {
      return Math.max(1, Math.round(totalSeconds / 60));
    }

    const elapsedMs = Date.now() - sessionStartedAtMs;
    const elapsedMinutes = Math.round(elapsedMs / 60000);

    return Math.max(1, elapsedMinutes);
  }

  function setMode(minutes, mode) {
    if (timerRunning) return;

    currentMode = mode === "focus" ? "focus" : "break";
    totalSeconds = minutes * 60;
    remainingSeconds = totalSeconds;

    setTimerDisplay(remainingSeconds);

    if (pomStatusText) pomStatusText.textContent = "Ready";
    if (pomRingProgress)
      pomRingProgress.classList.toggle("break-mode", mode !== "focus");

    updateTabTitle(null, currentMode, false);
  }

  function startLocalTimer() {
    timerRunning = true;

    if (pomStatusText) {
      pomStatusText.textContent =
        currentMode === "focus" ? "Focusing..." : "Break running...";
    }

    hidePauseOverlay();

    timerInterval = setInterval(() => {
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        remainingSeconds = 0;
        setTimerDisplay(0);

        if (pomStatusText) pomStatusText.textContent = "Done!";

        updateTabTitle(null, currentMode, false);
        onTimerComplete();
        return;
      }

      remainingSeconds--;
      setTimerDisplay(remainingSeconds);
      updateTabTitle(remainingSeconds, currentMode, false);
    }, 1000);
  }

  function pauseLocalTimer() {
    clearInterval(timerInterval);
    timerRunning = false;

    if (pomStatusText) pomStatusText.textContent = "Paused";

    updateTabTitle(remainingSeconds, currentMode, true);
    showPauseOverlay();
  }

  function resetTimerUI() {
    clearInterval(timerInterval);
    timerRunning = false;
    sessionStartedAtMs = null;
    remainingSeconds = totalSeconds;

    setTimerDisplay(remainingSeconds);

    if (pomStatusText) pomStatusText.textContent = "Ready";

    updateTabTitle(null, currentMode, false);
    hidePauseOverlay();
  }

  function showControlState(state) {
    pomStartBtn?.classList.add("hidden");
    pomPauseBtn?.classList.add("hidden");
    pomResumeBtn?.classList.add("hidden");
    pomCancelBtn?.classList.add("hidden");
    pomSessionInfo?.classList.add("hidden");

    if (state === "idle") {
      pomStartBtn?.classList.remove("hidden");
    }

    if (state === "running") {
      pomPauseBtn?.classList.remove("hidden");
      pomCancelBtn?.classList.remove("hidden");
      pomSessionInfo?.classList.remove("hidden");
    }

    if (state === "paused") {
      pomResumeBtn?.classList.remove("hidden");
      pomCancelBtn?.classList.remove("hidden");
      pomSessionInfo?.classList.remove("hidden");

      if (pomSessionInfoText) {
        pomSessionInfoText.textContent = "Session paused — resume when ready";
      }
    }

    if (state === "done") {
      pomStartBtn?.classList.remove("hidden");
    }
  }

  function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  function sendNotification(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted")
      return;

    try {
      new Notification(title, {
        body,
        icon: "../assets/avatar/default-user.png",
        tag: "edumind-pomodoro",
        renotify: true,
      });
    } catch (e) {}
  }

  function getYouTubeEmbedUrl(url) {
    if (!url) return null;

    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );

    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&origin=http://localhost:8080`;
    }

    if (url.includes("youtube.com/embed/")) return url;

    return null;
  }

  function isYouTubeUrl(url) {
    return !!(url && (url.includes("youtube.com") || url.includes("youtu.be")));
  }

  function renderYouTubeAnalysisResult(analysis) {
    if (!youtubeAnalyzeResult || !analysis) return;

    const sessionPlan = Array.isArray(analysis.sessionPlan)
      ? analysis.sessionPlan
      : [];

    youtubeAnalyzeResult.classList.remove("hidden");

    youtubeAnalyzeResult.innerHTML = `
        <h4>
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            AI Video Duration Analysis
        </h4>

        <p>
            <strong>${escHtml(analysis.title || "YouTube Video")}</strong>
        </p>

        <p>
            Duration detected:
            <strong>${escHtml(analysis.durationMinutes || 0)} minutes</strong>
            • Recommended:
            <strong>${escHtml(analysis.recommendedMode || "Focus Session")}</strong>
        </p>

        <p>${escHtml(analysis.recommendationMessage || "Timer duration has been auto-set from this video.")}</p>

        ${
          sessionPlan.length
            ? `
                    <ul class="pom-youtube-plan">
                        ${sessionPlan.map((item) => `<li>${escHtml(item)}</li>`).join("")}
                    </ul>
                  `
            : ""
        }
    `;
  }

  async function analyzeYoutubeVideoFromModal() {
    const videoUrl = (addVideoUrl?.value || "").trim();

    if (!videoUrl) {
      showToast("Please paste a YouTube video link first.", "error");
      return;
    }

    if (!isYouTubeUrl(videoUrl)) {
      showToast("Please enter a valid YouTube link.", "error");
      return;
    }

    if (!analyzeYoutubeBtn) return;

    const oldContent = analyzeYoutubeBtn.innerHTML;

    analyzeYoutubeBtn.disabled = true;
    analyzeYoutubeBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Analyzing video...
    `;

    try {
      const analysis = await apiFetch(YOUTUBE_ANALYZE_API, {
        method: "POST",
        body: JSON.stringify({
          videoUrl: videoUrl,
        }),
      });

      latestYoutubeAnalysis = analysis;

      if (addVideoTitle && analysis.title && !addVideoTitle.value.trim()) {
        addVideoTitle.value = analysis.title;
      }

      if (addVideoDuration && analysis.durationMinutes) {
        addVideoDuration.value = analysis.durationMinutes;
      }

      renderYouTubeAnalysisResult(analysis);

      showToast("Video analyzed and duration auto-set.", "success");
    } catch (error) {
      console.error("YouTube analyze failed:", error);
      showToast(error.message || "Unable to analyze YouTube video.", "error");
    } finally {
      analyzeYoutubeBtn.disabled = false;
      analyzeYoutubeBtn.innerHTML = oldContent;
    }
  }

  function showYouTubePlayer(videoUrl, videoTitle) {
    const embedUrl = getYouTubeEmbedUrl(videoUrl);

    if (!embedUrl) return;

    if (pomYtFrame) pomYtFrame.src = embedUrl;
    if (pomYtVideoTitle)
      pomYtVideoTitle.textContent = videoTitle || "Study Video";
    if (pomYtPauseOverlay) pomYtPauseOverlay.classList.add("hidden");
    if (pomStatsCol) pomStatsCol.classList.add("hidden");
    if (pomYtPlayerWrap) pomYtPlayerWrap.classList.remove("hidden");
  }

  function findPomodoroVideoById(videoId) {
    if (!videoId) return null;

    return videos.find((video) => {
      return String(video.id) === String(videoId);
    });
  }

  function openPomodoroVideoPlayer(video) {
    if (!video) {
      showToast("Video details not found. Please refresh the page.", "error");
      return;
    }

    const videoUrl = video.videoUrl || video.url || "";

    if (!videoUrl || !isYouTubeUrl(videoUrl)) {
      showToast("No valid YouTube link found for this content.", "error");
      return;
    }

    showYouTubePlayer(videoUrl, video.title || "Study Video");

    const playerWrap = document.getElementById("pomYtPlayerWrap");
    const topRow = document.getElementById("pomTopRow");

    if (playerWrap && !playerWrap.classList.contains("hidden")) {
      playerWrap.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else if (topRow) {
      topRow.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    showToast("Video opened. Start timer to track focus.", "info");
  }

  function hideYouTubePlayer() {
    if (pomYtFrame) pomYtFrame.src = "";
    if (pomYtPauseOverlay) pomYtPauseOverlay.classList.add("hidden");
    if (pomYtPlayerWrap) pomYtPlayerWrap.classList.add("hidden");
    if (pomStatsCol) pomStatsCol.classList.remove("hidden");
  }

  function ytPostMessage(action) {
    if (!pomYtFrame || !pomYtFrame.contentWindow) return;

    try {
      pomYtFrame.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: action, args: [] }),
        "*",
      );
    } catch (e) {}
  }

  function showPauseOverlay() {
    ytPostMessage("pauseVideo");

    if (
      !pomYtPauseOverlay ||
      !pomYtPlayerWrap ||
      pomYtPlayerWrap.classList.contains("hidden")
    ) {
      return;
    }

    pomYtPauseOverlay.style.cssText = "display:flex !important;";
    pomYtPauseOverlay.classList.remove("hidden");
  }

  function hidePauseOverlay() {
    ytPostMessage("playVideo");

    if (!pomYtPauseOverlay) return;

    pomYtPauseOverlay.style.cssText = "display:none !important;";
    pomYtPauseOverlay.classList.add("hidden");
  }

  pomYtCloseBtn?.addEventListener("click", hideYouTubePlayer);

  pomYtPipBtn?.addEventListener("click", () => {
    if (pomYtFrame?.src) window.open(pomYtFrame.src, "_blank");
  });

  pomYtPauseOverlay?.addEventListener("click", () => {
    showToast("Click Resume to continue your session ▶️", "info");
  });

  async function startSession() {
    const subjectId = pomSubjectSelect?.value || "";

    if (!subjectId) {
      pomSubjectError?.classList.remove("hidden");
      showToast("Please select a subject first.", "error");
      return;
    }

    pomSubjectError?.classList.add("hidden");

    const videoId = pomVideoSelect?.value || null;
    const subjectName = getSelectedSubjectName(subjectId);
    const topic = getSelectedVideoTitle(videoId);
    const plannedMinutes = Math.max(1, Math.round(totalSeconds / 60));

    const linkedTaskId = toNullableLong(pomTaskSelect?.value);
    const linkedRevisionId = toNullableLong(pomRevisionSelect?.value);
    const linkedPlanId = toNullableLong(pomPlanSelect?.value);

    const linkedTaskText = getSelectedOptionText(pomTaskSelect);
    const linkedRevisionText = getSelectedOptionText(pomRevisionSelect);
    const linkedPlanText = getSelectedOptionText(pomPlanSelect);

    const linkNotes = [
      linkedTaskText ? `Task: ${linkedTaskText}` : "",
      linkedRevisionText ? `Revision: ${linkedRevisionText}` : "",
      linkedPlanText ? `Planner: ${linkedPlanText}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      if (pomStartBtn) {
        pomStartBtn.disabled = true;
        pomStartBtn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> Starting...';
      }

      const body = {
        studentName: getStudentName(),
        studentEmail: getStudentEmail(),
        subjectId: Number(subjectId),
        subjectName: subjectName,
        linkedSubjectName: subjectName,
        topic: topic,
        sessionType: currentSessionType(),
        status: "ACTIVE",
        plannedMinutes: plannedMinutes,
        plannedDurationMinutes: plannedMinutes,
        breakMinutes: customShort,
        linkedTaskId: linkedTaskId,
        linkedRevisionId: linkedRevisionId,
        linkedPlanId: linkedPlanId,
        cycleNumber: currentRound,
        notes: [
          videoId
            ? `Started with study video/topic id ${videoId}`
            : "Started from student Pomodoro page",
          linkNotes,
        ]
          .filter(Boolean)
          .join(" | "),
      };

      const data = await apiFetch("/api/pomodoro/start", {
        method: "POST",
        body: JSON.stringify(body),
      });

      activeSessionId = unwrapSessionId(data);
      activeVideoId = videoId ? Number(videoId) : null;
      sessionStartedAtMs = Date.now();

      if (!activeSessionId) {
        throw new Error("Session id not received from backend.");
      }

      if (pomSessionInfoText) {
        pomSessionInfoText.textContent = `${subjectName} — ${topic}`;
      }

      if (activeVideoId) {
        const video = videos.find(
          (item) => String(item.id) === String(activeVideoId),
        );

        if (video?.videoUrl && isYouTubeUrl(video.videoUrl)) {
          showYouTubePlayer(video.videoUrl, video.title);
        }
      }

      startLocalTimer();
      showControlState("running");
      showToast("Pomodoro session started! Stay focused 🎯");
    } catch (error) {
      console.error("Pomodoro start failed:", error);
      showToast(
        error.message || "Could not start session. Try again.",
        "error",
      );
    } finally {
      if (pomStartBtn) {
        pomStartBtn.disabled = false;
        pomStartBtn.innerHTML =
          '<i class="fa-solid fa-play"></i> Start Session';
      }
    }
  }

  async function completeActivePomodoroSession(
    customNotes = "Completed from student Pomodoro page",
  ) {
    if (!activeSessionId) return null;

    const actualMinutes =
      currentMode === "focus"
        ? Math.max(1, Math.round(totalSeconds / 60))
        : getActualFocusMinutes();

    const body = {
      focusMinutes: actualMinutes,
      actualDurationMinutes: actualMinutes,
      notes: customNotes,
    };

    return apiFetch(`/api/pomodoro/${activeSessionId}/complete`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async function onTimerComplete() {
    try {
      if (activeSessionId) {
        await completeActivePomodoroSession(
          "Timer completed successfully from student Pomodoro page.",
        );
      }
    } catch (error) {
      console.warn("Pomodoro complete API failed:", error.message);
      showToast("Timer completed, but backend update failed.", "error");
    }

    completedRounds++;
    currentRound = completedRounds < 4 ? completedRounds + 1 : 1;

    if (completedRounds >= 4) {
      completedRounds = 0;
    }

    updateRoundDots();

    if (activeVideoId) {
      const video = videos.find(
        (item) => String(item.id) === String(activeVideoId),
      );
      if (sessionCompleteMsg) {
        sessionCompleteMsg.textContent = video
          ? `Great work on "${video.title}"! Did you complete it?`
          : "Great work! Did you finish the topic?";
      }
    } else if (sessionCompleteMsg) {
      sessionCompleteMsg.textContent =
        "Focus session complete! Keep up the momentum.";
    }

    sessionCompleteModal?.classList.remove("hidden");

    showControlState("done");
    sendNotification(
      "🎉 Session Complete! — EduMind AI",
      "Great work! Check if you completed the topic.",
    );

    await refreshPomodoroData();
    await loadFocusHistory();
  }

  function pauseSession() {
    pauseLocalTimer();
    showControlState("paused");
    showToast("Session paused.", "info");
  }

  function resumeSession() {
    startLocalTimer();
    showControlState("running");
    showToast("Session resumed.");
  }

  async function cancelSession() {
    if (!confirm("Cancel this session? Current active timer will stop."))
      return;

    const sessionId = activeSessionId;
    const actualMinutes = getActualFocusMinutes();

    activeSessionId = null;
    activeVideoId = null;

    resetTimerUI();
    hideYouTubePlayer();
    showControlState("idle");

    showToast("Session cancelled.", "info");

    if (sessionId) {
      try {
        await apiFetch(`/api/pomodoro/${sessionId}/interrupt`, {
          method: "PUT",
          body: JSON.stringify({
            focusMinutes: Math.max(0, actualMinutes),
            actualDurationMinutes: Math.max(0, actualMinutes),
            status: "INTERRUPTED",
            notes: "Session was cancelled/interrupted by student.",
          }),
        });

        await refreshPomodoroData();
      } catch (error) {
        console.warn("Cancel save failed:", error.message);
        showToast("Session cancelled, but backend update failed.", "error");
      }
    }
  }

  pomStartBtn?.addEventListener("click", startSession);
  pomPauseBtn?.addEventListener("click", pauseSession);
  pomResumeBtn?.addEventListener("click", resumeSession);
  pomCancelBtn?.addEventListener("click", cancelSession);

  function sessionDateText(session) {
    const raw =
      session.sessionDate ||
      session.startedAt ||
      session.startTime ||
      session.createdAt;

    if (!raw) return null;

    const date = new Date(String(raw).includes("T") ? raw : `${raw}T00:00:00`);

    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString().split("T")[0];
  }

  function sessionStartDate(session) {
    const raw =
      session.startedAt ||
      session.startTime ||
      session.createdAt ||
      session.sessionDate;

    if (!raw) return null;

    const date = new Date(String(raw).includes("T") ? raw : `${raw}T00:00:00`);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function sessionMinutes(session) {
    const value =
      session.focusMinutes ??
      session.actualDurationMinutes ??
      session.actualMinutes ??
      0;
    const minutes = Number(value);

    return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
  }

  function isCompletedSession(session) {
    return String(session.status || "").toUpperCase() === "COMPLETED";
  }

  async function loadMyPomodoroSessions() {
    try {
      const data = await apiFetch("/api/pomodoro/my");
      return unwrapArray(data, "sessions");
    } catch (error) {
      console.warn("GET /api/pomodoro/my failed:", error.message);
      return [];
    }
  }

  function calculateStreakFromSessions(sessions) {
    const activeDates = new Set(
      sessions
        .filter((item) => isCompletedSession(item) && sessionMinutes(item) > 0)
        .map(sessionDateText)
        .filter(Boolean),
    );

    let streak = 0;
    const cursor = new Date();

    while (true) {
      const key = cursor.toISOString().split("T")[0];

      if (!activeDates.has(key)) break;

      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  function bestStudyTimeFromSessions(sessions) {
    const buckets = {
      Morning: { count: 0, minutes: 0, label: "6 AM - 12 PM" },
      Afternoon: { count: 0, minutes: 0, label: "12 PM - 5 PM" },
      Evening: { count: 0, minutes: 0, label: "5 PM - 9 PM" },
      Night: { count: 0, minutes: 0, label: "9 PM - 6 AM" },
    };

    sessions.forEach((session) => {
      if (!isCompletedSession(session)) return;

      const date = sessionStartDate(session);
      if (!date) return;

      const hour = date.getHours();
      const minutes = sessionMinutes(session);
      let key = "Night";

      if (hour >= 6 && hour < 12) key = "Morning";
      else if (hour >= 12 && hour < 17) key = "Afternoon";
      else if (hour >= 17 && hour < 21) key = "Evening";

      buckets[key].count += 1;
      buckets[key].minutes += minutes;
    });

    return Object.entries(buckets).sort(
      (a, b) => b[1].minutes - a[1].minutes,
    )[0];
  }

  async function loadSummary() {
    const sessions = await loadMyPomodoroSessions();
    const todayKey = new Date().toISOString().split("T")[0];

    const completedSessions = sessions.filter(isCompletedSession);
    const todaySessions = completedSessions.filter(
      (item) => sessionDateText(item) === todayKey,
    );

    const todayFocusMinutes = todaySessions.reduce(
      (sum, item) => sum + sessionMinutes(item),
      0,
    );
    const totalFocusMinutes = completedSessions.reduce(
      (sum, item) => sum + sessionMinutes(item),
      0,
    );
    const totalHours = Math.round((totalFocusMinutes / 60) * 10) / 10;
    const streak = calculateStreakFromSessions(sessions);

    if (statCurrentStreak) statCurrentStreak.textContent = streak;
    if (statTodayFocus) statTodayFocus.textContent = todayFocusMinutes;
    if (statSessionsToday) statSessionsToday.textContent = todaySessions.length;
    if (statTotalHours) statTotalHours.textContent = totalHours;

    try {
      const oldSummary = await apiFetch("/api/dashboard/study-summary");
      const today = oldSummary?.today || {};

      const videosToday = today.videosCompleted || 0;
      const target = today.targetVideos || currentDailyTarget || 3;
      const pct = target
        ? Math.min(100, Math.round((videosToday / target) * 100))
        : 0;

      currentDailyTarget = target;

      if (statVideosToday) statVideosToday.textContent = videosToday;
      if (statDailyTarget) statDailyTarget.textContent = `of ${target} target`;
      if (pomTargetText)
        pomTargetText.textContent = `${videosToday} / ${target} videos`;
      if (pomTargetFill) pomTargetFill.style.width = `${pct}%`;
      if (pomTargetPct) pomTargetPct.textContent = `${pct}% complete`;
    } catch (error) {
      const doneVideosToday = videos.filter((item) => item.completed).length;
      const target = currentDailyTarget || 3;
      const pct = target
        ? Math.min(100, Math.round((doneVideosToday / target) * 100))
        : 0;

      if (statVideosToday) statVideosToday.textContent = doneVideosToday;
      if (statDailyTarget) statDailyTarget.textContent = `of ${target} target`;
      if (pomTargetText)
        pomTargetText.textContent = `${doneVideosToday} / ${target} videos`;
      if (pomTargetFill) pomTargetFill.style.width = `${pct}%`;
      if (pomTargetPct) pomTargetPct.textContent = `${pct}% complete`;
    }
  }

  async function loadBestTime() {
    const sessions = await loadMyPomodoroSessions();
    const best = bestStudyTimeFromSessions(sessions);

    const bestKey = best ? best[0] : "—";
    const bestData = best ? best[1] : null;

    if (statBestTime) {
      statBestTime.textContent =
        bestData && bestData.minutes > 0 ? bestKey : "—";
    }

    if (statBestPeriod) {
      statBestPeriod.textContent =
        bestData && bestData.minutes > 0
          ? `${bestData.label} • ${bestData.minutes} min`
          : "No sessions yet";
    }
  }

  async function loadWeeklyChart() {
    const chartEl = document.getElementById("weeklyFocusChart");
    const badgeEl = document.getElementById("weeklyTotalBadge");

    if (!chartEl) return;

    const sessions = await loadMyPomodoroSessions();

    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const key = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString("en-IN", { weekday: "short" });

      days.push({ key, label, minutes: 0 });
    }

    sessions.filter(isCompletedSession).forEach((session) => {
      const key = sessionDateText(session);
      const match = days.find((day) => day.key === key);

      if (match) {
        match.minutes += sessionMinutes(session);
      }
    });

    const maxMinutes = Math.max(...days.map((day) => day.minutes), 1);
    const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0);
    const todayKey = today.toISOString().split("T")[0];

    if (badgeEl) {
      badgeEl.textContent =
        totalMinutes >= 60
          ? `${(totalMinutes / 60).toFixed(1)}h`
          : `${totalMinutes} min`;
    }

    chartEl.innerHTML = days
      .map((day) => {
        const isToday = day.key === todayKey;
        const barHeight = Math.max(
          (day.minutes / maxMinutes) * 100,
          day.minutes > 0 ? 6 : 0,
        );

        return `
                <div class="pom-bar-col ${isToday ? "today-col" : ""}" title="${day.minutes}m focus">
                    <div class="pom-bar-value">${day.minutes > 0 ? day.minutes + "m" : ""}</div>
                    <div class="pom-bar-wrap">
                        <div class="pom-bar ${isToday ? "today-bar" : ""}" style="height:${barHeight}%"></div>
                    </div>
                    <div class="pom-bar-label">${isToday ? "Today" : day.label}</div>
                </div>
            `;
      })
      .join("");
  }

  async function refreshPomodoroData() {
    await Promise.all([
      loadSummary(),
      loadBestTime(),
      loadWeeklyChart(),
      loadSubjectChart(),
      loadRecommendations(),
    ]);
  }

  async function loadSubjects() {
    try {
      const data = await apiFetch("/api/subjects");
      subjects = Array.isArray(data) ? data : unwrapArray(data, "subjects");

      [pomSubjectSelect, addVideoSubject].forEach((select) => {
        if (!select) return;

        const firstOption =
          select.options[0]?.outerHTML ||
          '<option value="">-- Select Subject --</option>';
        select.innerHTML = firstOption;

        subjects.forEach((subject) => {
          const option = document.createElement("option");
          option.value = subject.id;
          option.textContent = subject.subjectName || subject.name || "Subject";
          select.appendChild(option);
        });
      });

      if (librarySubjectFilter) {
        librarySubjectFilter.innerHTML =
          '<option value="all">All Subjects</option>';

        subjects.forEach((subject) => {
          const option = document.createElement("option");
          option.value = subject.id;
          option.textContent = subject.subjectName || subject.name || "Subject";
          librarySubjectFilter.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Subjects load failed:", error);
      showToast("Could not load subjects.", "error");
    }
  }

  function clearLinkedSelect(select, placeholderText) {
    if (!select) return;

    select.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholderText;
    select.appendChild(option);
  }

  function getSelectedSubjectLabel() {
    const subjectId = pomSubjectSelect?.value || "";

    if (!subjectId) return "";

    return getSelectedSubjectName(subjectId);
  }

  function sameSubjectName(a, b) {
    if (!a || !b) return false;

    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  }

  function getTaskSubjectName(task) {
    return (
      task?.subject?.name ||
      task?.subject?.subjectName ||
      task?.subjectName ||
      task?.linkedSubjectName ||
      task?.subject ||
      ""
    );
  }

  function getTaskSubjectId(task) {
    return (
      task?.subject?.id || task?.subjectId || task?.linkedSubjectId || null
    );
  }

  function getPlanSubjectName(plan) {
    return plan?.subject || plan?.subjectName || plan?.linkedSubjectName || "";
  }

  function getRevisionSubjectName(revision) {
    return (
      revision?.subject ||
      revision?.subjectName ||
      revision?.linkedSubjectName ||
      ""
    );
  }

  function addOption(select, value, label) {
    if (!select || value === null || value === undefined || value === "")
      return;

    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  async function loadLinkedTasks(subjectId = "") {
    clearLinkedSelect(pomTaskSelect, "-- Select Task --");

    if (!pomTaskSelect) return;

    try {
      const data = await apiFetch("/api/tasks");
      linkedTasks = Array.isArray(data) ? data : unwrapArray(data, "tasks");

      const selectedSubjectName = getSelectedSubjectLabel();

      const filteredTasks = linkedTasks.filter((task) => {
        if (!subjectId) return true;

        const taskSubjectId = getTaskSubjectId(task);
        const taskSubjectName = getTaskSubjectName(task);

        return (
          String(taskSubjectId || "") === String(subjectId) ||
          sameSubjectName(taskSubjectName, selectedSubjectName)
        );
      });

      filteredTasks.forEach((task) => {
        const title = task.title || "Untitled Task";
        const status = task.status ? ` • ${task.status}` : "";
        const priority = task.priority ? ` • ${task.priority}` : "";
        const dueDate = task.dueDate ? ` • Due ${task.dueDate}` : "";

        addOption(
          pomTaskSelect,
          task.id,
          `${title}${status}${priority}${dueDate}`,
        );
      });
    } catch (error) {
      console.warn("Linked tasks load failed:", error.message);
    }
  }

  async function loadLinkedRevisions(subjectId = "") {
    clearLinkedSelect(pomRevisionSelect, "-- Select Revision --");

    if (!pomRevisionSelect) return;

    try {
      const data = await apiFetch("/api/revisions");
      linkedRevisions = Array.isArray(data)
        ? data
        : unwrapArray(data, "revisions");

      const selectedSubjectName = getSelectedSubjectLabel();

      const filteredRevisions = linkedRevisions.filter((revision) => {
        if (!subjectId) return true;

        return sameSubjectName(
          getRevisionSubjectName(revision),
          selectedSubjectName,
        );
      });

      filteredRevisions.forEach((revision) => {
        const title = revision.title || "Untitled Revision";
        const status = revision.status ? ` • ${revision.status}` : "";
        const priority = revision.priority ? ` • ${revision.priority}` : "";
        const date = revision.revisionDate || revision.date;
        const dateText = date ? ` • ${date}` : "";

        addOption(
          pomRevisionSelect,
          revision.id,
          `${title}${status}${priority}${dateText}`,
        );
      });
    } catch (error) {
      console.warn("Linked revisions load failed:", error.message);
    }
  }

  async function loadLinkedPlans(subjectId = "") {
    clearLinkedSelect(pomPlanSelect, "-- Select Planner Session --");

    if (!pomPlanSelect) return;

    try {
      const data = await apiFetch("/api/plans");
      linkedPlans = Array.isArray(data) ? data : unwrapArray(data, "plans");

      const selectedSubjectName = getSelectedSubjectLabel();

      const filteredPlans = linkedPlans.filter((plan) => {
        if (!subjectId) return true;

        return sameSubjectName(getPlanSubjectName(plan), selectedSubjectName);
      });

      filteredPlans.forEach((plan) => {
        const title = plan.title || plan.topic || "Untitled Plan";
        const subject = getPlanSubjectName(plan);
        const date = plan.date ? ` • ${plan.date}` : "";
        const time = plan.time ? ` • ${plan.time}` : "";
        const subjectText = subject ? ` • ${subject}` : "";

        addOption(
          pomPlanSelect,
          plan.id,
          `${title}${subjectText}${date}${time}`,
        );
      });
    } catch (error) {
      console.warn("Linked planner sessions load failed:", error.message);
    }
  }

  async function loadPomodoroLinkingOptions(subjectId = "") {
    await Promise.all([
      loadLinkedTasks(subjectId),
      loadLinkedRevisions(subjectId),
      loadLinkedPlans(subjectId),
    ]);
  }

  pomSubjectSelect?.addEventListener("change", async function () {
    const subjectId = this.value || "";

    pomSubjectError?.classList.add("hidden");

    await Promise.all([
      populateTopicVideoSelect(subjectId),
      loadPomodoroLinkingOptions(subjectId),
    ]);
  });

  async function loadVideos() {
    try {
      const data = await apiFetch("/api/study-videos");
      videos = Array.isArray(data) ? data : unwrapArray(data, "videos");
      renderVideoList();
    } catch (error) {
      console.error("Study library load failed:", error);
      showToast("Could not load study library.", "error");
    }
  }

  function getVideoSubjectId(video) {
    return (
      video?.subjectId || video?.subject?.id || video?.linkedSubjectId || ""
    );
  }

  function getVideoSubjectName(video) {
    return (
      video?.subjectName ||
      video?.subject?.name ||
      video?.subject?.subjectName ||
      video?.linkedSubjectName ||
      ""
    );
  }

  function addVideoOptionToSelect(video) {
    if (!pomVideoSelect || !video?.id) return;

    const durationText = video.durationMinutes
      ? ` • ${video.durationMinutes}m`
      : video.durationSeconds
        ? ` • ${Math.round(video.durationSeconds / 60)}m`
        : "";

    const completedText = video.completed ? " ✓" : "";

    const option = document.createElement("option");
    option.value = video.id;
    option.textContent = `${video.title || "Untitled Topic"}${durationText}${completedText}`;

    pomVideoSelect.appendChild(option);
  }

  async function populateTopicVideoSelect(subjectId = "") {
    if (!pomVideoSelect) return;

    pomVideoSelect.innerHTML = '<option value="">-- Select Topic --</option>';

    if (!subjectId) return;

    const selectedSubjectName = getSelectedSubjectName(subjectId);

    let filteredVideos = videos.filter((video) => {
      const videoSubjectId = getVideoSubjectId(video);
      const videoSubjectName = getVideoSubjectName(video);

      return (
        String(videoSubjectId || "") === String(subjectId) ||
        sameSubjectName(videoSubjectName, selectedSubjectName)
      );
    });

    if (!filteredVideos.length) {
      try {
        const data = await apiFetch(`/api/study-videos/subject/${subjectId}`);
        filteredVideos = Array.isArray(data)
          ? data
          : unwrapArray(data, "videos");
      } catch (error) {
        console.warn("Topic/video subject endpoint failed:", error.message);
      }
    }

    if (!filteredVideos.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No topic/video found for this subject";
      option.disabled = true;
      pomVideoSelect.appendChild(option);
      return;
    }

    filteredVideos.forEach(addVideoOptionToSelect);
  }

  function renderVideoList() {
    if (!pomVideoList) return;

    const filtered = videos.filter((video) => {
      const subjectMatch =
        currentSubjectFilter === "all" ||
        String(video.subjectId) === String(currentSubjectFilter);

      const statusMatch =
        currentFilter === "all" ||
        (currentFilter === "completed" && video.completed) ||
        (currentFilter === "pending" && !video.completed);

      return subjectMatch && statusMatch;
    });

    if (!filtered.length) {
      pomVideoList.innerHTML = "";

      if (pomLibraryEmpty) {
        pomLibraryEmpty.style.display = "flex";
        pomVideoList.appendChild(pomLibraryEmpty);
      }

      return;
    }

    if (pomLibraryEmpty) pomLibraryEmpty.style.display = "none";

    pomVideoList.innerHTML = filtered
      .map((video) => {
        const hasYoutube = isYouTubeUrl(video.videoUrl);
        const durationMin = video.durationSeconds
          ? `${Math.round(video.durationSeconds / 60)} min`
          : "";

        const titleHtml = video.videoUrl
          ? `
                    <a class="pom-video-link" href="${escHtml(video.videoUrl)}" target="_blank" rel="noopener noreferrer">
                        ${escHtml(video.title)}
                        <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;opacity:0.55;margin-left:3px"></i>
                    </a>
                `
          : `<span class="pom-video-title">${escHtml(video.title)}</span>`;

        const statusHtml = video.completed
          ? `<span class="pom-video-status done"><i class="fa-solid fa-check"></i> Done</span>`
          : `<span class="pom-video-status pending">Pending</span>`;

        const watchButton =
          hasYoutube && !video.completed
            ? `
        <button type="button"
            class="pom-video-btn pom-video-btn-watch"
            data-video-id="${Number(video.id)}">
            <i class="fa-brands fa-youtube"></i> Watch
        </button>
    `
            : "";

        const actionHtml = video.completed
          ? `
                    <button class="pom-video-btn pom-video-btn-done" disabled>
                        <i class="fa-solid fa-check"></i> Completed
                    </button>
                `
          : `
                    <button class="pom-video-btn pom-video-btn-start"
                        onclick="window.pomStartFromVideo(${Number(video.id)}, ${Number(video.subjectId)})">
                        <i class="fa-solid fa-play"></i> Start
                    </button>
                    ${watchButton}
                    <button class="pom-video-btn pom-video-btn-complete"
                        onclick="window.pomCompleteVideo(${Number(video.id)})">
                        <i class="fa-solid fa-check"></i> Complete
                    </button>
                `;

        return `
                <div class="pom-video-item ${video.completed ? "completed" : "pending"}">
                    <div class="pom-video-icon ${hasYoutube ? "yt-icon" : ""}">
                        <i class="${hasYoutube ? "fa-brands fa-youtube" : "fa-solid fa-circle-play"}"></i>
                    </div>

                    <div class="pom-video-info">
                        ${titleHtml}
                        <div class="pom-video-meta">
                            <span class="pom-video-subject">${escHtml(video.subjectName || "")}</span>
                            ${video.tag ? `<span class="pom-video-tag">${escHtml(video.tag)}</span>` : ""}
                            ${hasYoutube ? `<span class="pom-video-yt-badge"><i class="fa-brands fa-youtube"></i> YouTube</span>` : ""}
                            ${durationMin ? `<span class="pom-video-duration"><i class="fa-regular fa-clock"></i> ${durationMin}</span>` : ""}
                        </div>
                    </div>

                    ${statusHtml}

                    <div class="pom-video-actions">
                        ${actionHtml}
                    </div>
                </div>
            `;
      })
      .join("");
  }

  window.pomStartFromVideo = function (videoId, subjectId) {
    if (!pomSubjectSelect || !pomVideoSelect) return;

    pomSubjectSelect.value = subjectId;
    pomSubjectSelect.dispatchEvent(new Event("change"));

    setTimeout(() => {
      pomVideoSelect.value = videoId;
      applySelectedVideoDuration(videoId);
    }, 450);

    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Subject and topic selected. Press Start! 🎯");
  };

  window.pomCompleteVideo = function (videoId) {
    markVideoComplete(videoId);
  };

  window.pomWatchVideo = function (url, title) {
    showYouTubePlayer(url, title);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Video opened! Start timer to track focus. ⏱️", "info");
  };

  async function markVideoComplete(videoId) {
    try {
      await apiFetch(`/api/study-videos/${videoId}/complete`, {
        method: "PUT",
      });

      try {
        const badgeData = await apiFetch("/api/badges/check", {
          method: "POST",
        });

        if (badgeData?.newlyUnlocked?.length > 0) {
          showBadgePopup(badgeData.newlyUnlocked[0]);
        }
      } catch (e) {}

      showToast("Video marked as completed! 🎉");

      await Promise.all([
        loadVideos(),
        loadSummary(),
        loadSubjectChart(),
        loadRecommendations(),
      ]);
    } catch (error) {
      console.error("Video complete failed:", error);
      showToast("Could not mark video complete.", "error");
    }
  }

  function showBadgePopup(badgeName) {
    if (badgeUnlockName) badgeUnlockName.textContent = badgeName;
    if (badgeUnlockPopup) badgeUnlockPopup.classList.remove("hidden");

    setTimeout(() => {
      badgeUnlockPopup?.classList.add("hidden");
    }, 5000);
  }

  closeBadgePopup?.addEventListener("click", () => {
    badgeUnlockPopup?.classList.add("hidden");
  });

  async function loadSubjectChart() {
    const chartEl = document.getElementById("subjectProgressChart");

    if (!chartEl) return;

    try {
      const data = await apiFetch("/api/study-videos");
      const list = Array.isArray(data) ? data : unwrapArray(data, "videos");

      if (!list.length) {
        chartEl.innerHTML = `
                    <div class="pom-chart-loading">
                        <i class="fa-solid fa-circle-info"></i>
                        Add videos to see progress
                    </div>
                `;
        return;
      }

      const subjectMap = {};

      list.forEach((video) => {
        const key = video.subjectId || video.subjectName || "unknown";
        const name = video.subjectName || "Unknown";

        if (!subjectMap[key]) {
          subjectMap[key] = { name, total: 0, done: 0 };
        }

        subjectMap[key].total++;

        if (video.completed) {
          subjectMap[key].done++;
        }
      });

      const entries = Object.values(subjectMap).sort(
        (a, b) => b.done / Math.max(1, b.total) - a.done / Math.max(1, a.total),
      );

      chartEl.innerHTML = entries
        .map((item) => {
          const pct =
            item.total > 0 ? Math.round((item.done / item.total) * 100) : 0;
          const color =
            pct >= 70 ? "fill-green" : pct >= 30 ? "" : "fill-amber";

          return `
                    <div class="pom-subject-bar-item">
                        <div class="pom-subject-bar-row">
                            <span class="pom-subject-bar-name">${escHtml(item.name)}</span>
                            <span class="pom-subject-bar-count">${item.done}/${item.total}</span>
                        </div>
                        <div class="pom-subject-bar-track">
                            <div class="pom-subject-bar-fill ${color}" style="width:${pct}%"></div>
                        </div>
                    </div>
                `;
        })
        .join("");
    } catch (error) {
      chartEl.innerHTML = `<div class="pom-chart-loading">Could not load chart</div>`;
    }
  }

  async function loadRecommendations() {
    const listEl = document.getElementById("pomRecommendList");

    if (!listEl) return;

    try {
      const data = await apiFetch("/api/study-videos");
      const list = Array.isArray(data) ? data : unwrapArray(data, "videos");

      // Important: keep global videos array updated
      // Common Watch handler isi videos array se video find karta hai.
      videos = list;

      const pending = list.filter((video) => !video.completed);

      if (!pending.length) {
        listEl.innerHTML = `
                <div class="pom-recommend-empty">
                    <i class="fa-solid fa-trophy"></i>
                    🎉 All videos completed! Add more to continue.
                </div>
            `;
        return;
      }

      const sorted = [...pending].sort((a, b) => {
        const aYt = isYouTubeUrl(a.videoUrl) ? 1 : 0;
        const bYt = isYouTubeUrl(b.videoUrl) ? 1 : 0;

        if (bYt !== aYt) return bYt - aYt;

        return String(a.subjectName || "").localeCompare(
          String(b.subjectName || ""),
        );
      });

      const top = sorted.slice(0, 6);

      listEl.innerHTML = top
        .map((video) => {
          const hasYoutube = isYouTubeUrl(video.videoUrl);
          const safeVideoId = Number(video.id || 0);
          const safeSubjectId = Number(video.subjectId || 0);

          return `
                <div class="pom-recommend-item" data-video-id="${safeVideoId}">
                    <div class="pom-recommend-top">
                        <div class="pom-recommend-icon ${hasYoutube ? "yt" : ""}">
                            <i class="${hasYoutube ? "fa-brands fa-youtube" : "fa-solid fa-circle-play"}"></i>
                        </div>

                        <div class="pom-recommend-info">
                            <div class="pom-recommend-title">
                                ${escHtml(video.title || "Untitled Video")}
                            </div>

                            <div class="pom-recommend-subject">
                                ${escHtml(video.subjectName || "")}
                                ${video.tag ? ` • ${escHtml(video.tag)}` : ""}
                            </div>
                        </div>
                    </div>

                    <div class="pom-recommend-actions">
                        <button type="button"
                            class="pom-video-btn pom-video-btn-start"
                            data-video-id="${safeVideoId}"
                            data-subject-id="${safeSubjectId}"
                            style="flex:1;justify-content:center;">
                            <i class="fa-solid fa-play"></i> Start
                        </button>

                        ${
                          hasYoutube
                            ? `
                                    <button type="button"
                                        class="pom-video-btn pom-video-btn-watch"
                                        data-video-id="${safeVideoId}">
                                        <i class="fa-brands fa-youtube"></i> Watch
                                    </button>
                                  `
                            : ""
                        }
                    </div>
                </div>
            `;
        })
        .join("");
    } catch (error) {
      console.error("Recommendations load failed:", error);

      listEl.innerHTML = `
            <div class="pom-recommend-empty">
                <i class="fa-solid fa-circle-exclamation"></i>
                Could not load recommendations.
            </div>
        `;
    }
  }

  openAddVideoBtn?.addEventListener("click", () => {
    addVideoModalOverlay?.classList.remove("hidden");
  });

  function closeAddModal() {
    addVideoModalOverlay?.classList.add("hidden");

    if (addVideoTitle) addVideoTitle.value = "";
    if (addVideoUrl) addVideoUrl.value = "";
    if (addVideoTag) addVideoTag.value = "";
    if (addVideoDuration) addVideoDuration.value = "";
    if (addVideoSubject) addVideoSubject.value = "";

    addVideoSubjectError?.classList.add("hidden");
    addVideoTitleError?.classList.add("hidden");
  }

  closeAddVideoModal?.addEventListener("click", closeAddModal);
  cancelAddVideoModal?.addEventListener("click", closeAddModal);

  addVideoModalOverlay?.addEventListener("click", (event) => {
    if (event.target === addVideoModalOverlay) {
      closeAddModal();
    }
  });

  analyzeYoutubeBtn?.addEventListener("click", analyzeYoutubeVideoFromModal);

  saveVideoBtn?.addEventListener("click", async function () {
    const subjectId = addVideoSubject?.value || "";
    const title = addVideoTitle?.value.trim() || "";
    let hasError = false;

    if (!subjectId) {
      addVideoSubjectError?.classList.remove("hidden");
      hasError = true;
    } else {
      addVideoSubjectError?.classList.add("hidden");
    }

    if (!title) {
      addVideoTitleError?.classList.remove("hidden");
      hasError = true;
    } else {
      addVideoTitleError?.classList.add("hidden");
    }

    if (hasError) return;

    try {
      saveVideoBtn.disabled = true;
      saveVideoBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

      await apiFetch("/api/study-videos", {
        method: "POST",
        body: JSON.stringify({
          subjectId: Number(subjectId),
          title: title,
          videoUrl: addVideoUrl?.value.trim() || null,
          tag: addVideoTag?.value.trim() || null,
          durationSeconds:
            (parseInt(addVideoDuration?.value || "0", 10) || 0) * 60,
        }),
      });

      showToast("Content added to library! 📚");
      closeAddModal();

      await Promise.all([
        loadVideos(),
        loadSubjectChart(),
        loadRecommendations(),
      ]);
    } catch (error) {
      showToast("Could not add content: " + error.message, "error");
    } finally {
      saveVideoBtn.disabled = false;
      saveVideoBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save';
    }
  });

  markVideoCompleteBtn?.addEventListener("click", async function () {
    sessionCompleteModal?.classList.add("hidden");

    if (activeVideoId) {
      await markVideoComplete(activeVideoId);
    }

    activeSessionId = null;
    activeVideoId = null;

    resetTimerUI();
    hideYouTubePlayer();
    showControlState("idle");
  });

  skipMarkCompleteBtn?.addEventListener("click", function () {
    sessionCompleteModal?.classList.add("hidden");

    activeSessionId = null;
    activeVideoId = null;

    resetTimerUI();
    hideYouTubePlayer();
    showControlState("idle");
    loadSummary();
  });

  function openCustomTimerModal() {
    const existing = document.getElementById("pomCustomTimerModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "pomCustomTimerModal";
    modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(17,24,39,0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1100;
            padding: 20px;
        `;

    modal.innerHTML = `
            <div style="background:#fff;border-radius:24px;padding:28px;width:100%;max-width:380px;box-shadow:0 30px 60px rgba(17,24,39,0.18);font-family:Poppins,sans-serif;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <div>
                        <h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:4px;">⚙️ Custom Timer</h2>
                        <p style="font-size:13px;color:#9ca3af;">Apne hisaab se time set karo</p>
                    </div>
                    <button id="closeCustomTimer" style="width:34px;height:34px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">✕</button>
                </div>

                <div style="display:flex;flex-direction:column;gap:14px;">
                    <label style="font-size:13px;font-weight:600;color:#374151;">🧠 Focus Time (minutes)</label>
                    <input id="ctFocus" type="number" min="1" max="90" value="${customFocus}" style="border:1px solid #e5e7eb;border-radius:12px;padding:10px 14px;font-size:14px;outline:none;font-family:Poppins,sans-serif;background:#f9fafb;width:100%;box-sizing:border-box;">

                    <label style="font-size:13px;font-weight:600;color:#374151;">☕ Short Break (minutes)</label>
                    <input id="ctShort" type="number" min="1" max="30" value="${customShort}" style="border:1px solid #e5e7eb;border-radius:12px;padding:10px 14px;font-size:14px;outline:none;font-family:Poppins,sans-serif;background:#f9fafb;width:100%;box-sizing:border-box;">

                    <label style="font-size:13px;font-weight:600;color:#374151;">🛋️ Long Break (minutes)</label>
                    <input id="ctLong" type="number" min="1" max="60" value="${customLong}" style="border:1px solid #e5e7eb;border-radius:12px;padding:10px 14px;font-size:14px;outline:none;font-family:Poppins,sans-serif;background:#f9fafb;width:100%;box-sizing:border-box;">
                </div>

                <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">
                    <button id="resetCustomTimer" style="background:#f3f4f6;color:#374151;border:none;border-radius:12px;padding:10px 16px;font-size:13px;font-weight:600;font-family:Poppins,sans-serif;cursor:pointer;">Reset</button>
                    <button id="saveCustomTimer" style="background:linear-gradient(135deg,#6c63ff,#8b7cff);color:#fff;border:none;border-radius:12px;padding:10px 20px;font-size:13px;font-weight:600;font-family:Poppins,sans-serif;cursor:pointer;box-shadow:0 6px 16px rgba(108,99,255,0.25);">💾 Save</button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    document.getElementById("closeCustomTimer").onclick = () => modal.remove();

    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.remove();
    });

    document.getElementById("resetCustomTimer").onclick = () => {
      document.getElementById("ctFocus").value = 25;
      document.getElementById("ctShort").value = 5;
      document.getElementById("ctLong").value = 15;
    };

    document.getElementById("saveCustomTimer").onclick = () => {
      const focus = parseInt(
        document.getElementById("ctFocus").value || "25",
        10,
      );
      const shortBreak = parseInt(
        document.getElementById("ctShort").value || "5",
        10,
      );
      const longBreak = parseInt(
        document.getElementById("ctLong").value || "15",
        10,
      );

      customFocus = Math.min(90, Math.max(1, focus));
      customShort = Math.min(30, Math.max(1, shortBreak));
      customLong = Math.min(60, Math.max(1, longBreak));

      localStorage.setItem("pom_focus", customFocus);
      localStorage.setItem("pom_short", customShort);
      localStorage.setItem("pom_long", customLong);

      updateModeBtnLabels();

      if (!timerRunning && currentMode === "focus") {
        setMode(customFocus, "focus");
      }

      modal.remove();
      showToast(`Timer set: Focus ${customFocus}m / Break ${customShort}m ✅`);
    };
  }

  function updateModeBtnLabels() {
    const focusBtn = document.getElementById("modeFocus");
    const shortBtn = document.getElementById("modeShortBreak");
    const longBtn = document.getElementById("modeLongBreak");

    if (focusBtn) {
      focusBtn.dataset.minutes = customFocus;
      focusBtn.innerHTML = `<i class="fa-solid fa-brain"></i> Focus ${customFocus}m`;
    }

    if (shortBtn) {
      shortBtn.dataset.minutes = customShort;
      shortBtn.innerHTML = `<i class="fa-solid fa-mug-hot"></i> Break ${customShort}m`;
    }

    if (longBtn) {
      longBtn.dataset.minutes = customLong;
      longBtn.innerHTML = `<i class="fa-solid fa-couch"></i> Long ${customLong}m`;
    }
  }

  function initModeButtons() {
    updateModeBtnLabels();

    totalSeconds = customFocus * 60;
    remainingSeconds = totalSeconds;

    document.querySelectorAll(".pom-mode-btn").forEach((button) => {
      button.addEventListener("click", function () {
        if (timerRunning) return;
        if (this.id === "pomCustomTimerBtn") return;

        document.querySelectorAll(".pom-mode-btn").forEach((item) => {
          item.classList.remove("active");
        });

        this.classList.add("active");

        const minutes = parseInt(this.dataset.minutes || "25", 10);
        const mode = this.id === "modeFocus" ? "focus" : "break";

        setMode(minutes, mode);
      });
    });

    document
      .getElementById("pomCustomTimerBtn")
      ?.addEventListener("click", openCustomTimerModal);
  }

  document.querySelectorAll(".pom-filter-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".pom-filter-tab").forEach((item) => {
        item.classList.remove("active");
      });

      this.classList.add("active");
      currentFilter = this.dataset.filter || "all";
      renderVideoList();
    });
  });

  librarySubjectFilter?.addEventListener("change", function () {
    currentSubjectFilter = this.value;
    renderVideoList();
  });

  document
    .getElementById("pomEditTargetBtn")
    ?.addEventListener("click", function () {
      const current = currentDailyTarget || 3;
      const input = prompt(
        `Set your daily video target (1-20):\nCurrent: ${current}`,
        current,
      );

      if (input === null) return;

      const value = parseInt(input, 10);

      if (Number.isNaN(value) || value < 1 || value > 20) {
        showToast("Please enter a number between 1 and 20.", "error");
        return;
      }

      apiFetch("/api/activity/target", {
        method: "PUT",
        body: JSON.stringify({ target: value }),
      })
        .then(() => {
          currentDailyTarget = value;
          showToast(`Daily target set to ${value} videos! 🎯`);
          loadSummary();
        })
        .catch(() => {
          currentDailyTarget = value;
          showToast("Target updated locally.");
          loadSummary();
        });
    });

  function loadUserProfile() {
    const user = getLoggedInUser();
    const name = user.fullName || user.name || "Student";
    const el = document.getElementById("pomProfileName");

    if (el) {
      el.textContent = name.split(" ")[0];
    }
  }

  document.getElementById("logoutBtn")?.addEventListener("click", (event) => {
    event.preventDefault();
    localStorage.clear();
    window.location.href = "login.html";
  });

  async function init() {
    setupProfile();
    requestNotificationPermission();

    setMode(customFocus, "focus");
    updateRoundDots();
    showControlState("idle");

    await Promise.all([loadSubjects(), loadVideos()]);

    await loadPomodoroLinkingOptions(pomSubjectSelect?.value || "");
    await populateTopicVideoSelect(pomSubjectSelect?.value || "");

    await refreshPomodoroData();
    await loadFocusHistory();

    setInterval(() => {
      loadSummary();
      loadBestTime();
    }, 60000);
  }

  /* ============================================================
   FAILSAFE: Save Content + Watch Button handlers
   ============================================================ */

  function getVideoIdFromButton(button) {
    if (!button) return null;

    return (
      button.dataset.videoId ||
      button.dataset.id ||
      button.getAttribute("data-video-id") ||
      button.getAttribute("data-id") ||
      button.closest("[data-video-id]")?.dataset.videoId ||
      button.closest(".pom-video-item")?.dataset.videoId ||
      null
    );
  }

  function findVideoById(videoId) {
    if (!videoId) return null;

    return videos.find((video) => {
      return String(video.id) === String(videoId);
    });
  }

  function resetAddContentModalFields() {
    if (addVideoTitle) addVideoTitle.value = "";
    if (addVideoUrl) addVideoUrl.value = "";
    if (addVideoTag) addVideoTag.value = "";
    if (addVideoDuration) addVideoDuration.value = "";
    if (addVideoSubject) addVideoSubject.value = "";

    addVideoSubjectError?.classList.add("hidden");
    addVideoTitleError?.classList.add("hidden");

    const analysisBox = document.getElementById("youtubeAnalyzeResult");
    if (analysisBox) {
      analysisBox.classList.add("hidden");
      analysisBox.innerHTML = "";
    }
  }

  async function saveStudyContentFromModal(event) {
    event?.preventDefault();
    event?.stopPropagation();

    const subjectId = addVideoSubject?.value || "";
    const title = addVideoTitle?.value.trim() || "";
    const videoUrl = addVideoUrl?.value.trim() || "";
    const tag = addVideoTag?.value.trim() || "";
    const durationMinutes = parseInt(addVideoDuration?.value || "0", 10) || 0;

    let hasError = false;

    if (!subjectId) {
      addVideoSubjectError?.classList.remove("hidden");
      hasError = true;
    } else {
      addVideoSubjectError?.classList.add("hidden");
    }

    if (!title) {
      addVideoTitleError?.classList.remove("hidden");
      hasError = true;
    } else {
      addVideoTitleError?.classList.add("hidden");
    }

    if (videoUrl && !isYouTubeUrl(videoUrl)) {
      showToast("Please enter a valid YouTube URL.", "error");
      hasError = true;
    }

    if (hasError) return;

    if (saveVideoBtn) {
      saveVideoBtn.disabled = true;
      saveVideoBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
    }

    try {
      await apiFetch("/api/study-videos", {
        method: "POST",
        body: JSON.stringify({
          subjectId: Number(subjectId),
          title: title,
          videoUrl: videoUrl || null,
          tag: tag || null,
          durationSeconds: durationMinutes > 0 ? durationMinutes * 60 : 0,
          aiRecommendedMode: latestYoutubeAnalysis?.recommendedMode || null,
          aiRecommendationMessage:
            latestYoutubeAnalysis?.recommendationMessage || null,
          aiSessionPlan: Array.isArray(latestYoutubeAnalysis?.sessionPlan)
            ? latestYoutubeAnalysis.sessionPlan.join(" | ")
            : null,
        }),
      });

      showToast("Content added to library successfully.", "success");

      addVideoModalOverlay?.classList.add("hidden");
      resetAddContentModalFields();
      latestYoutubeAnalysis = null;

      await loadVideos();

      if (typeof loadSubjectChart === "function") {
        await loadSubjectChart();
      }

      if (typeof loadRecommendations === "function") {
        await loadRecommendations();
      }

      if (pomSubjectSelect?.value) {
        await populateTopicVideoSelect(pomSubjectSelect.value);
      }
    } catch (error) {
      console.error("Save content failed:", error);
      showToast(error.message || "Could not save content.", "error");
    } finally {
      if (saveVideoBtn) {
        saveVideoBtn.disabled = false;
        saveVideoBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save`;
      }
    }
  }

  function watchStudyVideoFromButton(button) {
    const videoId = getVideoIdFromButton(button);
    const video = findVideoById(videoId);

    if (!video) {
      showToast("Video details not found. Please refresh the page.", "error");
      return;
    }

    if (!video.videoUrl || !isYouTubeUrl(video.videoUrl)) {
      showToast("No valid YouTube link found for this content.", "error");
      return;
    }

    showYouTubePlayer(video.videoUrl, video.title || "Study Video");

    const player = document.getElementById("pomYtPlayerWrap");
    if (player) {
      player.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  /* Remove old duplicate click issue by using safe direct handlers */
  saveVideoBtn?.addEventListener("click", saveStudyContentFromModal);

  pomVideoList?.addEventListener("click", function (event) {
    document.addEventListener("click", function (event) {
      const watchBtn = event.target.closest(".pom-video-btn-watch");
      const startBtn = event.target.closest(".pom-video-btn-start");

      if (watchBtn) {
        event.preventDefault();
        event.stopPropagation();

        const videoId = watchBtn.dataset.videoId || "";
        const video = findPomodoroVideoById(videoId);

        openPomodoroVideoPlayer(video);
        return;
      }

      if (startBtn) {
        event.preventDefault();
        event.stopPropagation();

        const videoId = startBtn.dataset.videoId || "";
        const subjectId = startBtn.dataset.subjectId || "";

        if (subjectId && pomSubjectSelect) {
          pomSubjectSelect.value = subjectId;
        }

        if (videoId && pomVideoSelect) {
          populateTopicVideoSelect(subjectId).then(() => {
            pomVideoSelect.value = videoId;
          });
        }

        const timerCard = document.querySelector(".pom-timer-card");
        timerCard?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        showToast("Video selected. Click Start Session to begin.", "info");
      }
    });
  });

  pomVideoSelect?.addEventListener("change", function () {
    applySelectedVideoDuration(this.value || "");
  });

  pomAiSuggestBtn?.addEventListener("click", getPomodoroAiSuggestion);

  init();
});
