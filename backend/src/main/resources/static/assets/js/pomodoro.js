/**
 * pomodoro.js — EduMind AI
 * Handles: Timer, Study Library, Add Video, Session APIs, Badge Popup
 */

document.addEventListener("DOMContentLoaded", function () {

    const API = "http://localhost:8080";

    // ── Auth Header ──────────────────────────────
    function authHeaders(extra = {}) {
        const token = (localStorage.getItem("token") || "").trim();
        return { "Authorization": `Bearer ${token}`, ...extra };
    }

    // ── Fetch helper ─────────────────────────────
    async function apiFetch(url, options = {}) {
        const res = await fetch(API + url, {
            headers: authHeaders({ "Content-Type": "application/json" }),
            ...options
        });
        const text = await res.text();
        if (!text) return null;
        return JSON.parse(text);
    }

    // ── Toast ────────────────────────────────────
    function showToast(msg, type = "success") {
        let el = document.getElementById("pomToast");
        if (!el) {
            el = document.createElement("div");
            el.id = "pomToast";
            el.style.cssText = `
                position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
                z-index:9999;padding:12px 22px;border-radius:12px;font-size:14px;
                font-family:Poppins,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.2);
                transition:opacity 0.3s;opacity:0;pointer-events:none;font-weight:600;
            `;
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.background = type === "error" ? "#ef4444" : "#10b981";
        el.style.color = "#fff";
        el.style.opacity = "1";
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.style.opacity = "0"; }, 3000);
    }

    // ════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════
    let subjects = [];
    let videos = [];
    let activeSessionId = null;
    let activeVideoId = null;
    let timerInterval = null;
    let totalSeconds = 25 * 60;
    let remainingSeconds = totalSeconds;
    let timerRunning = false;
    let currentMode = "focus"; // focus | short | long
    let currentFilter = "all";
    let currentSubjectFilter = "all";

    // Ring circumference = 2 * PI * 88 = ~553
    const CIRCUMFERENCE = 553;

    // ════════════════════════════════════════════
    // DOM REFS
    // ════════════════════════════════════════════
    const pomSubjectSelect    = document.getElementById("pomSubjectSelect");
    const pomVideoSelect      = document.getElementById("pomVideoSelect");
    const pomSubjectError     = document.getElementById("pomSubjectError");
    const pomTimeDisplay      = document.getElementById("pomTimeDisplay");
    const pomStatusText       = document.getElementById("pomStatusText");
    const pomRingProgress     = document.getElementById("pomRingProgress");
    const pomStartBtn         = document.getElementById("pomStartBtn");
    const pomPauseBtn         = document.getElementById("pomPauseBtn");
    const pomResumeBtn        = document.getElementById("pomResumeBtn");
    const pomCancelBtn        = document.getElementById("pomCancelBtn");
    const pomSessionInfo      = document.getElementById("pomSessionInfo");
    const pomSessionInfoText  = document.getElementById("pomSessionInfoText");

    const statCurrentStreak   = document.getElementById("statCurrentStreak");
    const statTodayFocus      = document.getElementById("statTodayFocus");
    const statVideosToday     = document.getElementById("statVideosToday");
    const statSessionsToday   = document.getElementById("statSessionsToday");
    const statDailyTarget     = document.getElementById("statDailyTarget");
    const pomTargetText       = document.getElementById("pomTargetText");
    const pomTargetFill       = document.getElementById("pomTargetFill");
    const pomTargetPct        = document.getElementById("pomTargetPct");

    const pomVideoList        = document.getElementById("pomVideoList");
    const pomLibraryEmpty     = document.getElementById("pomLibraryEmpty");
    const librarySubjectFilter = document.getElementById("librarySubjectFilter");

    const openAddVideoBtn     = document.getElementById("openAddVideoBtn");
    const addVideoModalOverlay = document.getElementById("addVideoModalOverlay");
    const closeAddVideoModal  = document.getElementById("closeAddVideoModal");
    const cancelAddVideoModal = document.getElementById("cancelAddVideoModal");
    const saveVideoBtn        = document.getElementById("saveVideoBtn");
    const addVideoSubject     = document.getElementById("addVideoSubject");
    const addVideoTitle       = document.getElementById("addVideoTitle");
    const addVideoUrl         = document.getElementById("addVideoUrl");
    const addVideoTag         = document.getElementById("addVideoTag");
    const addVideoDuration    = document.getElementById("addVideoDuration");
    const addVideoSubjectError = document.getElementById("addVideoSubjectError");
    const addVideoTitleError  = document.getElementById("addVideoTitleError");

    const sessionCompleteModal  = document.getElementById("sessionCompleteModal");
    const sessionCompleteMsg    = document.getElementById("sessionCompleteMsg");
    const markVideoCompleteBtn  = document.getElementById("markVideoCompleteBtn");
    const skipMarkCompleteBtn   = document.getElementById("skipMarkCompleteBtn");

    const badgeUnlockPopup    = document.getElementById("badgeUnlockPopup");
    const badgeUnlockName     = document.getElementById("badgeUnlockName");
    const closeBadgePopup     = document.getElementById("closeBadgePopup");

    // ════════════════════════════════════════════
    // TIMER LOGIC
    // ════════════════════════════════════════════

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    function updateRing(remaining, total) {
        const progress = remaining / total;
        const offset = CIRCUMFERENCE * (1 - progress);
        pomRingProgress.style.strokeDashoffset = offset;
    }

    function setTimerDisplay(seconds) {
        pomTimeDisplay.textContent = formatTime(seconds);
        updateRing(seconds, totalSeconds);
    }

    function setMode(minutes, mode) {
        if (timerRunning) return;
        currentMode = mode;
        totalSeconds = minutes * 60;
        remainingSeconds = totalSeconds;
        setTimerDisplay(remainingSeconds);
        pomStatusText.textContent = "Ready";

        // Ring color
        if (mode === "focus") {
            pomRingProgress.classList.remove("break-mode");
        } else {
            pomRingProgress.classList.add("break-mode");
        }
    }

    function startLocalTimer() {
        timerRunning = true;
        pomStatusText.textContent = "Focusing...";

        timerInterval = setInterval(() => {
            if (remainingSeconds <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                pomStatusText.textContent = "Done!";
                setTimerDisplay(0);
                onTimerComplete();
                return;
            }
            remainingSeconds--;
            setTimerDisplay(remainingSeconds);
        }, 1000);
    }

    function pauseLocalTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        pomStatusText.textContent = "Paused";
    }

    function resetTimerUI() {
        clearInterval(timerInterval);
        timerRunning = false;
        remainingSeconds = totalSeconds;
        setTimerDisplay(remainingSeconds);
        pomStatusText.textContent = "Ready";
    }

    async function onTimerComplete() {
        // Auto-complete the session in backend
        if (activeSessionId) {
            try {
                await apiFetch(`/api/study-sessions/${activeSessionId}/complete`,
                    { method: "PUT" });
            } catch (e) {}
        }

        // Show completion modal
        if (activeVideoId) {
            const video = videos.find(v => v.id == activeVideoId);
            sessionCompleteMsg.textContent = video
                ? `Great work on "${video.title}"! Did you complete it?`
                : "Great work! Did you finish the topic?";
            sessionCompleteModal.classList.remove("hidden");
        } else {
            // No video — just refresh stats
            sessionCompleteModal.classList.remove("hidden");
            sessionCompleteMsg.textContent =
                "Great focus session! Keep up the momentum.";
        }

        showControlState("done");
        loadSummary();
    }

    // ════════════════════════════════════════════
    // CONTROL STATE
    // ════════════════════════════════════════════
    function showControlState(state) {
        pomStartBtn.classList.add("hidden");
        pomPauseBtn.classList.add("hidden");
        pomResumeBtn.classList.add("hidden");
        pomCancelBtn.classList.add("hidden");
        pomSessionInfo.classList.add("hidden");

        if (state === "idle") {
            pomStartBtn.classList.remove("hidden");
        } else if (state === "running") {
            pomPauseBtn.classList.remove("hidden");
            pomCancelBtn.classList.remove("hidden");
            pomSessionInfo.classList.remove("hidden");
        } else if (state === "paused") {
            pomResumeBtn.classList.remove("hidden");
            pomCancelBtn.classList.remove("hidden");
            pomSessionInfo.classList.remove("hidden");
            pomSessionInfoText.textContent = "Session paused";
        } else if (state === "done") {
            pomStartBtn.classList.remove("hidden");
        }
    }

    // ════════════════════════════════════════════
    // SESSION API CALLS
    // ════════════════════════════════════════════

    async function startSession() {
        const subjectId = pomSubjectSelect.value;
        if (!subjectId) {
            pomSubjectError.classList.remove("hidden");
            return;
        }
        pomSubjectError.classList.add("hidden");

        const videoId = pomVideoSelect.value || null;
        const focusSeconds = totalSeconds;

        try {
            pomStartBtn.disabled = true;
            pomStartBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            const data = await apiFetch("/api/study-sessions/start", {
                method: "POST",
                body: JSON.stringify({
                    subjectId: Number(subjectId),
                    videoId: videoId ? Number(videoId) : null,
                    focusSeconds: focusSeconds,
                    breakSeconds: 300
                })
            });

            activeSessionId = data.id;
            activeVideoId = videoId ? Number(videoId) : null;

            const subject = subjects.find(s => s.id == subjectId);
            const subjectName = subject ? subject.subjectName : "Subject";

            if (activeVideoId) {
                const video = videos.find(v => v.id == activeVideoId);
                pomSessionInfoText.textContent =
                    `${subjectName} — ${video ? video.title : "Topic"}`;
            } else {
                pomSessionInfoText.textContent = `${subjectName} — Focus session`;
            }

            startLocalTimer();
            showControlState("running");
            showToast("Session started! Stay focused 🎯");

        } catch (e) {
            showToast("Could not start session: " + e.message, "error");
        } finally {
            pomStartBtn.disabled = false;
            pomStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Session';
        }
    }

    async function pauseSession() {
        if (!activeSessionId) return;
        try {
            await apiFetch(`/api/study-sessions/${activeSessionId}/pause`,
                { method: "PUT" });
            pauseLocalTimer();
            showControlState("paused");
        } catch (e) {
            showToast("Could not pause session.", "error");
        }
    }

    async function resumeSession() {
        if (!activeSessionId) return;
        try {
            await apiFetch(`/api/study-sessions/${activeSessionId}/resume`,
                { method: "PUT" });
            startLocalTimer();
            showControlState("running");
            pomSessionInfoText.textContent = pomSessionInfoText.textContent
                .replace("paused", "");
        } catch (e) {
            showToast("Could not resume session.", "error");
        }
    }

    async function cancelSession() {
        if (!activeSessionId) return;
        if (!confirm("Cancel this session? Progress won't be saved.")) return;

        try {
            await apiFetch(`/api/study-sessions/${activeSessionId}/cancel`,
                { method: "PUT" });
            activeSessionId = null;
            activeVideoId = null;
            resetTimerUI();
            showControlState("idle");
            showToast("Session cancelled.");
        } catch (e) {
            showToast("Could not cancel session.", "error");
        }
    }

    // ════════════════════════════════════════════
    // MARK VIDEO COMPLETE
    // ════════════════════════════════════════════

    async function markVideoComplete(videoId) {
        try {
            await apiFetch(`/api/study-videos/${videoId}/complete`,
                { method: "PUT" });

            // Check for new badges
            const badgeData = await apiFetch("/api/badges/check",
                { method: "POST" });

            if (badgeData && badgeData.newlyUnlocked &&
                badgeData.newlyUnlocked.length > 0) {
                showBadgePopup(badgeData.newlyUnlocked[0]);
            }

            showToast("Video marked as completed! 🎉");
            await loadVideos();
            await loadSummary();

        } catch (e) {
            showToast("Could not mark video complete.", "error");
        }
    }

    // ════════════════════════════════════════════
    // BADGE POPUP
    // ════════════════════════════════════════════

    function showBadgePopup(badgeName) {
        badgeUnlockName.textContent = badgeName;
        badgeUnlockPopup.classList.remove("hidden");
        setTimeout(() => {
            badgeUnlockPopup.classList.add("hidden");
        }, 5000);
    }

    closeBadgePopup?.addEventListener("click", () => {
        badgeUnlockPopup.classList.add("hidden");
    });

    // ════════════════════════════════════════════
    // LOAD SUBJECTS
    // ════════════════════════════════════════════

    async function loadSubjects() {
        try {
            const data = await apiFetch("/api/subjects");
            subjects = Array.isArray(data) ? data : [];

            // Fill timer subject select
            pomSubjectSelect.innerHTML =
                '<option value="">-- Select Subject --</option>';
            subjects.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.id;
                opt.textContent = s.subjectName || s.name;
                pomSubjectSelect.appendChild(opt);
            });

            // Fill add video modal subject select
            addVideoSubject.innerHTML =
                '<option value="">-- Select Subject --</option>';
            subjects.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.id;
                opt.textContent = s.subjectName || s.name;
                addVideoSubject.appendChild(opt);
            });

            // Fill library filter
            librarySubjectFilter.innerHTML =
                '<option value="all">All Subjects</option>';
            subjects.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.id;
                opt.textContent = s.subjectName || s.name;
                librarySubjectFilter.appendChild(opt);
            });

        } catch (e) {
            showToast("Could not load subjects.", "error");
        }
    }

    // ════════════════════════════════════════════
    // LOAD VIDEOS FOR TIMER SELECT
    // ════════════════════════════════════════════

    pomSubjectSelect?.addEventListener("change", async function () {
        const subjectId = this.value;
        pomVideoSelect.innerHTML = '<option value="">-- Select Topic --</option>';

        if (!subjectId) return;

        try {
            const data = await apiFetch(
                `/api/study-videos/subject/${subjectId}`);
            const subjectVideos = Array.isArray(data) ? data : [];

            subjectVideos.forEach(v => {
                const opt = document.createElement("option");
                opt.value = v.id;
                opt.textContent = v.title +
                    (v.completed ? " ✓" : "");
                pomVideoSelect.appendChild(opt);
            });
        } catch (e) {}
    });

    // ════════════════════════════════════════════
    // LOAD ALL VIDEOS (Library)
    // ════════════════════════════════════════════

    async function loadVideos() {
        try {
            const data = await apiFetch("/api/study-videos");
            videos = Array.isArray(data) ? data : [];
            renderVideoList();
        } catch (e) {
            showToast("Could not load study library.", "error");
        }
    }

    function renderVideoList() {
        const filtered = videos.filter(v => {
            const subjectMatch = currentSubjectFilter === "all" ||
                String(v.subjectId) === String(currentSubjectFilter);

            const statusMatch = currentFilter === "all" ||
                (currentFilter === "completed" && v.completed) ||
                (currentFilter === "pending" && !v.completed);

            return subjectMatch && statusMatch;
        });

        if (filtered.length === 0) {
            pomVideoList.innerHTML = "";
            pomLibraryEmpty.style.display = "flex";
            pomVideoList.appendChild(pomLibraryEmpty);
            return;
        }

        pomLibraryEmpty.style.display = "none";

        pomVideoList.innerHTML = filtered.map(v => {
            const durationMin = v.durationSeconds
                ? Math.round(v.durationSeconds / 60) + " min"
                : "";

            const statusHtml = v.completed
                ? `<span class="pom-video-status done">
                       <i class="fa-solid fa-check"></i> Done
                   </span>`
                : `<span class="pom-video-status pending">Pending</span>`;

            const actionHtml = v.completed
                ? `<button class="pom-video-btn pom-video-btn-done" disabled>
                       <i class="fa-solid fa-check"></i> Completed
                   </button>`
                : `<button class="pom-video-btn pom-video-btn-start"
                        data-id="${v.id}"
                        data-subject="${v.subjectId}"
                        onclick="window.pomStartFromVideo(${v.id}, ${v.subjectId})">
                        <i class="fa-solid fa-play"></i> Start
                   </button>
                   <button class="pom-video-btn pom-video-btn-complete"
                        data-id="${v.id}"
                        onclick="window.pomCompleteVideo(${v.id})">
                        <i class="fa-solid fa-check"></i> Complete
                   </button>`;

            return `
                <div class="pom-video-item ${v.completed ? "completed" : "pending"}">
                    <div class="pom-video-icon">
                        <i class="fa-solid ${v.completed
                            ? "fa-circle-check"
                            : "fa-play-circle"}"></i>
                    </div>
                    <div class="pom-video-info">
                        <div class="pom-video-title">${escHtml(v.title)}</div>
                        <div class="pom-video-meta">
                            <span class="pom-video-subject">
                                ${escHtml(v.subjectName || "")}
                            </span>
                            ${v.tag
                                ? `<span class="pom-video-tag">
                                       ${escHtml(v.tag)}
                                   </span>`
                                : ""}
                            ${durationMin
                                ? `<span class="pom-video-duration">
                                       <i class="fa-regular fa-clock"></i>
                                       ${durationMin}
                                   </span>`
                                : ""}
                        </div>
                    </div>
                    ${statusHtml}
                    <div class="pom-video-actions">${actionHtml}</div>
                </div>
            `;
        }).join("");
    }

    function escHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // ── Global functions for inline onclick ─────
    window.pomStartFromVideo = function (videoId, subjectId) {
        pomSubjectSelect.value = subjectId;
        pomSubjectSelect.dispatchEvent(new Event("change"));
        setTimeout(() => {
            pomVideoSelect.value = videoId;
        }, 400);
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast("Subject and video selected. Press Start!");
    };

    window.pomCompleteVideo = function (videoId) {
        markVideoComplete(videoId);
    };

    // ════════════════════════════════════════════
    // LOAD DASHBOARD SUMMARY
    // ════════════════════════════════════════════

    async function loadSummary() {
        try {
            const data = await apiFetch("/api/dashboard/study-summary");
            if (!data) return;

            const today = data.today || {};
            const streak = data.streak || {};

            if (statCurrentStreak)
                statCurrentStreak.textContent = streak.currentStreak || 0;
            if (statTodayFocus)
                statTodayFocus.textContent = today.focusMinutes || 0;
            if (statVideosToday)
                statVideosToday.textContent = today.videosCompleted || 0;
            if (statSessionsToday)
                statSessionsToday.textContent = today.sessionsCompleted || 0;

            const target = today.targetVideos || 3;
            const done = today.videosCompleted || 0;
            const pct = today.progressPercent || 0;

            if (statDailyTarget) statDailyTarget.textContent = `of ${target} target`;
            if (pomTargetText)
                pomTargetText.textContent = `${done} / ${target} videos`;
            if (pomTargetFill) pomTargetFill.style.width = `${pct}%`;
            if (pomTargetPct) pomTargetPct.textContent = `${pct}% complete`;

        } catch (e) {
            console.error("Could not load summary:", e);
        }
    }

    // ════════════════════════════════════════════
    // ADD VIDEO MODAL
    // ════════════════════════════════════════════

    openAddVideoBtn?.addEventListener("click", () => {
        addVideoModalOverlay.classList.remove("hidden");
    });

    function closeAddModal() {
        addVideoModalOverlay.classList.add("hidden");
        addVideoTitle.value = "";
        addVideoUrl.value = "";
        addVideoTag.value = "";
        addVideoDuration.value = "";
        addVideoSubject.value = "";
        addVideoSubjectError.classList.add("hidden");
        addVideoTitleError.classList.add("hidden");
    }

    closeAddVideoModal?.addEventListener("click", closeAddModal);
    cancelAddVideoModal?.addEventListener("click", closeAddModal);

    addVideoModalOverlay?.addEventListener("click", function (e) {
        if (e.target === addVideoModalOverlay) closeAddModal();
    });

    saveVideoBtn?.addEventListener("click", async function () {
        const subjectId = addVideoSubject.value;
        const title = addVideoTitle.value.trim();

        let hasError = false;

        if (!subjectId) {
            addVideoSubjectError.classList.remove("hidden");
            hasError = true;
        } else {
            addVideoSubjectError.classList.add("hidden");
        }

        if (!title) {
            addVideoTitleError.classList.remove("hidden");
            hasError = true;
        } else {
            addVideoTitleError.classList.add("hidden");
        }

        if (hasError) return;

        const durationMinutes = parseInt(addVideoDuration.value) || 0;

        try {
            saveVideoBtn.disabled = true;
            saveVideoBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i>';

            await apiFetch("/api/study-videos", {
                method: "POST",
                body: JSON.stringify({
                    subjectId: Number(subjectId),
                    title: title,
                    videoUrl: addVideoUrl.value.trim() || null,
                    tag: addVideoTag.value.trim() || null,
                    durationSeconds: durationMinutes * 60
                })
            });

            showToast("Content added to library!");
            closeAddModal();
            await loadVideos();

        } catch (e) {
            showToast("Could not add content: " + e.message, "error");
        } finally {
            saveVideoBtn.disabled = false;
            saveVideoBtn.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Save';
        }
    });

    // ════════════════════════════════════════════
    // SESSION COMPLETE MODAL ACTIONS
    // ════════════════════════════════════════════

    markVideoCompleteBtn?.addEventListener("click", async function () {
        sessionCompleteModal.classList.add("hidden");

        if (activeVideoId) {
            await markVideoComplete(activeVideoId);
        }

        activeSessionId = null;
        activeVideoId = null;
        resetTimerUI();
        showControlState("idle");
    });

    skipMarkCompleteBtn?.addEventListener("click", function () {
        sessionCompleteModal.classList.add("hidden");
        activeSessionId = null;
        activeVideoId = null;
        resetTimerUI();
        showControlState("idle");
        loadSummary();
    });

    // ════════════════════════════════════════════
    // MODE TABS
    // ════════════════════════════════════════════

    document.querySelectorAll(".pom-mode-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            if (timerRunning) return;
            document.querySelectorAll(".pom-mode-btn")
                .forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            const minutes = parseInt(this.dataset.minutes);
            const mode = this.id === "modeFocus"
                ? "focus"
                : this.id === "modeShortBreak"
                    ? "short"
                    : "long";
            setMode(minutes, mode);
        });
    });

    // ════════════════════════════════════════════
    // MAIN CONTROLS
    // ════════════════════════════════════════════

    pomStartBtn?.addEventListener("click", startSession);
    pomPauseBtn?.addEventListener("click", pauseSession);
    pomResumeBtn?.addEventListener("click", resumeSession);
    pomCancelBtn?.addEventListener("click", cancelSession);

    // ════════════════════════════════════════════
    // FILTER TABS
    // ════════════════════════════════════════════

    document.querySelectorAll(".pom-filter-tab").forEach(tab => {
        tab.addEventListener("click", function () {
            document.querySelectorAll(".pom-filter-tab")
                .forEach(t => t.classList.remove("active"));
            this.classList.add("active");
            currentFilter = this.dataset.filter;
            renderVideoList();
        });
    });

    librarySubjectFilter?.addEventListener("change", function () {
        currentSubjectFilter = this.value;
        renderVideoList();
    });

    // ════════════════════════════════════════════
    // USER PROFILE
    // ════════════════════════════════════════════

    function loadUserProfile() {
        const keys = ["edumind_logged_in_user", "loggedInUser", "user", "currentUser"];
        let user = null;
        for (const k of keys) {
            try {
                const v = localStorage.getItem(k);
                if (v) { user = JSON.parse(v); break; }
            } catch (e) {}
        }

        if (!user) return;
        const nameEl = document.getElementById("pomProfileName");
        if (nameEl) {
            nameEl.textContent =
                (user.fullName || user.name || "Student").split(" ")[0];
        }
    }

    // ════════════════════════════════════════════
    // LOGOUT
    // ════════════════════════════════════════════

    document.getElementById("logoutBtn")?.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "login.html";
    });

    // ════════════════════════════════════════════
    // INIT
    // ════════════════════════════════════════════

    setTimerDisplay(remainingSeconds);
    showControlState("idle");
    loadUserProfile();

    Promise.all([loadSubjects(), loadVideos(), loadSummary()]);

});