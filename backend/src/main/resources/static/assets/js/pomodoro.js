/**
 * pomodoro.js — EduMind AI — Enhanced
 * Timer + YouTube + Library + Charts + Recommendations + Best Time
 */

document.addEventListener("DOMContentLoaded", function () {

    const API        = "http://localhost:8080";
    const PAGE_TITLE = "Pomodoro & Study Library | EduMind AI";

    // ── Auth ─────────────────────────────────────
    function authHeaders(extra = {}) {
        const token = (localStorage.getItem("token") || "").trim();
        return { "Authorization": `Bearer ${token}`, ...extra };
    }

    async function apiFetch(url, options = {}) {
        const token = (localStorage.getItem("token") || "").trim();
        if (!token) { window.location.href = "login.html"; return null; }

        const res = await fetch(API + url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        });

        if (res.status === 401) {
            localStorage.clear();
            window.location.href = "login.html";
            return null;
        }

        const text = await res.text();
        if (!text) return null;
        try { return JSON.parse(text); } catch (e) { return null; }
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
                transition:opacity 0.3s;opacity:0;pointer-events:none;
                font-weight:600;min-width:200px;text-align:center;
            `;
            document.body.appendChild(el);
        }
        el.textContent      = msg;
        el.style.background = type === "error" ? "#ef4444" : "#10b981";
        el.style.color      = "#fff";
        el.style.opacity    = "1";
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.style.opacity = "0"; }, 3000);
    }

    // ════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════
    let subjects             = [];
    let videos               = [];
    let activeSessionId      = null;
    let activeVideoId        = null;
    let timerInterval        = null;
    let totalSeconds         = 25 * 60;
    let remainingSeconds     = totalSeconds;
    let timerRunning         = false;
    let currentRound         = 1;
    let completedRounds      = 0;
    let currentFilter        = "all";
    let currentSubjectFilter = "all";
    let currentMode          = "focus";
    let currentDailyTarget   = 3;

    const CIRCUMFERENCE = 553;

    let customFocus = parseInt(localStorage.getItem("pom_focus") || "25");
    let customShort = parseInt(localStorage.getItem("pom_short") || "5");
    let customLong  = parseInt(localStorage.getItem("pom_long")  || "15");

    // ════════════════════════════════════════════
    // DOM REFS
    // ════════════════════════════════════════════
    const pomSubjectSelect   = document.getElementById("pomSubjectSelect");
    const pomVideoSelect     = document.getElementById("pomVideoSelect");
    const pomSubjectError    = document.getElementById("pomSubjectError");
    const pomTimeDisplay     = document.getElementById("pomTimeDisplay");
    const pomStatusText      = document.getElementById("pomStatusText");
    const pomRingProgress    = document.getElementById("pomRingProgress");
    const pomStartBtn        = document.getElementById("pomStartBtn");
    const pomPauseBtn        = document.getElementById("pomPauseBtn");
    const pomResumeBtn       = document.getElementById("pomResumeBtn");
    const pomCancelBtn       = document.getElementById("pomCancelBtn");
    const pomSessionInfo     = document.getElementById("pomSessionInfo");
    const pomSessionInfoText = document.getElementById("pomSessionInfoText");
    const pomRoundsLabel     = document.getElementById("pomRoundsLabel");

    const statCurrentStreak  = document.getElementById("statCurrentStreak");
    const statTodayFocus     = document.getElementById("statTodayFocus");
    const statVideosToday    = document.getElementById("statVideosToday");
    const statSessionsToday  = document.getElementById("statSessionsToday");
    const statDailyTarget    = document.getElementById("statDailyTarget");
    const statTotalHours     = document.getElementById("statTotalHours");
    const statBestTime       = document.getElementById("statBestTime");
    const statBestPeriod     = document.getElementById("statBestPeriod");
    const pomTargetText      = document.getElementById("pomTargetText");
    const pomTargetFill      = document.getElementById("pomTargetFill");
    const pomTargetPct       = document.getElementById("pomTargetPct");

    const pomVideoList         = document.getElementById("pomVideoList");
    const pomLibraryEmpty      = document.getElementById("pomLibraryEmpty");
    const librarySubjectFilter = document.getElementById("librarySubjectFilter");

    const openAddVideoBtn      = document.getElementById("openAddVideoBtn");
    const addVideoModalOverlay = document.getElementById("addVideoModalOverlay");
    const closeAddVideoModal   = document.getElementById("closeAddVideoModal");
    const cancelAddVideoModal  = document.getElementById("cancelAddVideoModal");
    const saveVideoBtn         = document.getElementById("saveVideoBtn");
    const addVideoSubject      = document.getElementById("addVideoSubject");
    const addVideoTitle        = document.getElementById("addVideoTitle");
    const addVideoUrl          = document.getElementById("addVideoUrl");
    const addVideoTag          = document.getElementById("addVideoTag");
    const addVideoDuration     = document.getElementById("addVideoDuration");
    const addVideoSubjectError = document.getElementById("addVideoSubjectError");
    const addVideoTitleError   = document.getElementById("addVideoTitleError");

    const sessionCompleteModal = document.getElementById("sessionCompleteModal");
    const sessionCompleteMsg   = document.getElementById("sessionCompleteMsg");
    const markVideoCompleteBtn = document.getElementById("markVideoCompleteBtn");
    const skipMarkCompleteBtn  = document.getElementById("skipMarkCompleteBtn");

    const badgeUnlockPopup  = document.getElementById("badgeUnlockPopup");
    const badgeUnlockName   = document.getElementById("badgeUnlockName");
    const closeBadgePopup   = document.getElementById("closeBadgePopup");

    const pomYtPlayerWrap   = document.getElementById("pomYtPlayerWrap");
    const pomYtFrame        = document.getElementById("pomYtFrame");
    const pomYtVideoTitle   = document.getElementById("pomYtVideoTitle");
    const pomYtCloseBtn     = document.getElementById("pomYtCloseBtn");
    const pomYtPipBtn       = document.getElementById("pomYtPipBtn");
    const pomYtPauseOverlay = document.getElementById("pomYtPauseOverlay");
    const pomStatsCol       = document.getElementById("pomStatsCol");

    // ════════════════════════════════════════════
    // BROWSER NOTIFICATIONS
    // ════════════════════════════════════════════
    function requestNotificationPermission() {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }

    function sendNotification(title, body) {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        try {
            new Notification(title, {
                body, icon: "../assets/avatar/default-user.png",
                tag: "edumind-pomodoro", renotify: true
            });
        } catch (e) {}
    }

    // ════════════════════════════════════════════
    // DAILY TARGET EDIT
    // ════════════════════════════════════════════
    document.getElementById("pomEditTargetBtn")?.addEventListener("click", function () {
        const current = currentDailyTarget || 3;
        const input   = prompt(`Set your daily video target (1-20):\nCurrent: ${current}`, current);
        if (input === null) return;

        const val = parseInt(input);
        if (isNaN(val) || val < 1 || val > 20) {
            showToast("Please enter a number between 1 and 20.", "error");
            return;
        }

        apiFetch("/api/activity/target", {
            method: "PUT",
            body: JSON.stringify({ target: val })
        }).then(data => {
            if (data) {
                currentDailyTarget = val;
                showToast(`Daily target set to ${val} videos! 🎯`);
                loadSummary();
            }
        }).catch(() => {
            showToast("Could not update target.", "error");
        });
    });

    // ════════════════════════════════════════════
    // CUSTOM TIMER MODAL
    // ════════════════════════════════════════════
    function openCustomTimerModal() {
        const existing = document.getElementById("pomCustomTimerModal");
        if (existing) existing.remove();

        const modal = document.createElement("div");
        modal.id = "pomCustomTimerModal";
        modal.style.cssText = `
            position:fixed;inset:0;background:rgba(17,24,39,0.5);
            backdrop-filter:blur(4px);display:flex;align-items:center;
            justify-content:center;z-index:1100;padding:20px;
        `;
        modal.innerHTML = `
            <div style="background:#fff;border-radius:24px;padding:28px;
                        width:100%;max-width:380px;
                        box-shadow:0 30px 60px rgba(17,24,39,0.18);
                        font-family:Poppins,sans-serif;">
                <div style="display:flex;justify-content:space-between;
                            align-items:center;margin-bottom:20px;">
                    <div>
                        <h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:4px;">
                            ⚙️ Custom Timer
                        </h2>
                        <p style="font-size:13px;color:#9ca3af;">Apne hisaab se time set karo</p>
                    </div>
                    <button id="closeCustomTimer"
                        style="width:34px;height:34px;border:1px solid #e5e7eb;
                               border-radius:10px;background:#f9fafb;cursor:pointer;
                               font-size:16px;display:flex;align-items:center;
                               justify-content:center;">✕</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:14px;">
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <label style="font-size:13px;font-weight:600;color:#374151;">
                            🧠 Focus Time (minutes)
                        </label>
                        <input id="ctFocus" type="number" min="1" max="90" value="${customFocus}"
                            style="border:1px solid #e5e7eb;border-radius:12px;padding:10px 14px;
                                   font-size:14px;outline:none;font-family:Poppins,sans-serif;
                                   background:#f9fafb;width:100%;box-sizing:border-box;">
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <label style="font-size:13px;font-weight:600;color:#374151;">
                            ☕ Short Break (minutes)
                        </label>
                        <input id="ctShort" type="number" min="1" max="30" value="${customShort}"
                            style="border:1px solid #e5e7eb;border-radius:12px;padding:10px 14px;
                                   font-size:14px;outline:none;font-family:Poppins,sans-serif;
                                   background:#f9fafb;width:100%;box-sizing:border-box;">
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <label style="font-size:13px;font-weight:600;color:#374151;">
                            🛋️ Long Break (minutes)
                        </label>
                        <input id="ctLong" type="number" min="1" max="60" value="${customLong}"
                            style="border:1px solid #e5e7eb;border-radius:12px;padding:10px 14px;
                                   font-size:14px;outline:none;font-family:Poppins,sans-serif;
                                   background:#f9fafb;width:100%;box-sizing:border-box;">
                    </div>
                </div>
                <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">
                    <button id="resetCustomTimer"
                        style="background:#f3f4f6;color:#374151;border:none;border-radius:12px;
                               padding:10px 16px;font-size:13px;font-weight:600;
                               font-family:Poppins,sans-serif;cursor:pointer;">Reset</button>
                    <button id="saveCustomTimer"
                        style="background:linear-gradient(135deg,#6c63ff,#8b7cff);color:#fff;
                               border:none;border-radius:12px;padding:10px 20px;font-size:13px;
                               font-weight:600;font-family:Poppins,sans-serif;cursor:pointer;
                               box-shadow:0 6px 16px rgba(108,99,255,0.25);">💾 Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById("closeCustomTimer").onclick = () => modal.remove();
        modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });

        document.getElementById("resetCustomTimer").onclick = () => {
            document.getElementById("ctFocus").value = 25;
            document.getElementById("ctShort").value = 5;
            document.getElementById("ctLong").value  = 15;
        };

        document.getElementById("saveCustomTimer").onclick = () => {
            const f = parseInt(document.getElementById("ctFocus").value) || 25;
            const s = parseInt(document.getElementById("ctShort").value) || 5;
            const l = parseInt(document.getElementById("ctLong").value)  || 15;

            customFocus = Math.min(90, Math.max(1, f));
            customShort = Math.min(30, Math.max(1, s));
            customLong  = Math.min(60, Math.max(1, l));

            localStorage.setItem("pom_focus", customFocus);
            localStorage.setItem("pom_short", customShort);
            localStorage.setItem("pom_long",  customLong);

            updateModeBtnLabels();
            if (!timerRunning) {
                if (currentMode === "focus") setMode(customFocus, "focus");
            }

            modal.remove();
            showToast(`Timer set: Focus ${customFocus}m / Break ${customShort}m ✅`);
        };
    }

    function updateModeBtnLabels() {
        const focusBtn = document.getElementById("modeFocus");
        const shortBtn = document.getElementById("modeShortBreak");
        const longBtn  = document.getElementById("modeLongBreak");
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

    // ════════════════════════════════════════════
    // TAB TITLE
    // ════════════════════════════════════════════
    function updateTabTitle(remaining, mode, isPaused) {
        if (remaining === null) { document.title = PAGE_TITLE; return; }
        const time  = formatTime(remaining);
        const icon  = isPaused ? "⏸" : (mode === "break" ? "☕" : "⏱");
        const label = isPaused ? "Paused" : (mode === "break" ? "Break" : "Study");
        document.title = `${icon} ${time} — ${label} | EduMind`;
    }

    // ════════════════════════════════════════════
    // YOUTUBE
    // ════════════════════════════════════════════
    function getYouTubeEmbedUrl(url) {
        if (!url) return null;
        const match = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );
        if (match) {
            return `https://www.youtube.com/embed/${match[1]}` +
                   `?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3` +
                   `&enablejsapi=1&origin=http://localhost:8080`;
        }
        if (url.includes("youtube.com/embed/")) return url;
        return null;
    }

    function isYouTubeUrl(url) {
        return !!(url && (url.includes("youtube.com") || url.includes("youtu.be")));
    }

    function showYouTubePlayer(videoUrl, videoTitle) {
        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        if (!embedUrl) return;
        if (pomYtFrame)       pomYtFrame.src              = embedUrl;
        if (pomYtVideoTitle)  pomYtVideoTitle.textContent = videoTitle || "Study Video";
        if (pomYtPauseOverlay) pomYtPauseOverlay.classList.add("hidden");
        if (pomStatsCol)      pomStatsCol.classList.add("hidden");
        if (pomYtPlayerWrap)  pomYtPlayerWrap.classList.remove("hidden");
    }

    function hideYouTubePlayer() {
        if (pomYtFrame)        pomYtFrame.src = "";
        if (pomYtPauseOverlay) pomYtPauseOverlay.classList.add("hidden");
        if (pomYtPlayerWrap)   pomYtPlayerWrap.classList.add("hidden");
        if (pomStatsCol)       pomStatsCol.classList.remove("hidden");
    }

    function ytPostMessage(action) {
        if (!pomYtFrame || !pomYtFrame.contentWindow) return;
        try {
            pomYtFrame.contentWindow.postMessage(
                JSON.stringify({ event: "command", func: action, args: [] }), "*"
            );
        } catch (e) {}
    }

    function showPauseOverlay() {
        ytPostMessage("pauseVideo");
        const overlay = document.getElementById("pomYtPauseOverlay");
        const wrap    = document.getElementById("pomYtPlayerWrap");
        if (!overlay || !wrap || wrap.classList.contains("hidden")) return;
        overlay.style.cssText = "display:flex !important;";
        overlay.classList.remove("hidden");
    }

    function hidePauseOverlay() {
        ytPostMessage("playVideo");
        const overlay = document.getElementById("pomYtPauseOverlay");
        if (!overlay) return;
        overlay.style.cssText = "display:none !important;";
        overlay.classList.add("hidden");
    }

    pomYtCloseBtn?.addEventListener("click", hideYouTubePlayer);
    pomYtPipBtn?.addEventListener("click", () => {
        if (pomYtFrame?.src) window.open(pomYtFrame.src, "_blank");
    });
    pomYtPauseOverlay?.addEventListener("click", () => {
        showToast("Click Resume to continue your session ▶️");
    });

    // ════════════════════════════════════════════
    // TIMER
    // ════════════════════════════════════════════
    function formatTime(s) {
        const m   = Math.floor(s / 60).toString().padStart(2, "0");
        const sec = (s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    }

    function updateRing(remaining, total) {
        const offset = CIRCUMFERENCE * (1 - remaining / total);
        pomRingProgress.style.strokeDashoffset = offset;
    }

    function setTimerDisplay(s) {
        pomTimeDisplay.textContent = formatTime(s);
        updateRing(s, totalSeconds);
    }

    function updateRoundDots() {
        for (let i = 1; i <= 4; i++) {
            const dot = document.getElementById(`round${i}`);
            if (!dot) continue;
            dot.classList.remove("active", "done");
            if (i < currentRound) dot.classList.add("done");
            if (i === currentRound) dot.classList.add("active");
        }
        if (pomRoundsLabel) pomRoundsLabel.textContent = `Round ${currentRound} of 4`;
    }

    function setMode(minutes, mode) {
        if (timerRunning) return;
        currentMode      = (mode === "focus") ? "focus" : "break";
        totalSeconds     = minutes * 60;
        remainingSeconds = totalSeconds;
        setTimerDisplay(remainingSeconds);
        pomStatusText.textContent = "Ready";
        pomRingProgress.classList.toggle("break-mode", mode !== "focus");
        updateTabTitle(null, currentMode, false);
    }

    function startLocalTimer() {
        timerRunning = true;
        pomStatusText.textContent = "Focusing...";
        hidePauseOverlay();

        timerInterval = setInterval(() => {
            if (remainingSeconds <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                pomStatusText.textContent = "Done!";
                setTimerDisplay(0);
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
        pomStatusText.textContent = "Paused";
        updateTabTitle(remainingSeconds, currentMode, true);
        showPauseOverlay();
    }

    function resetTimerUI() {
        clearInterval(timerInterval);
        timerRunning     = false;
        remainingSeconds = totalSeconds;
        setTimerDisplay(remainingSeconds);
        pomStatusText.textContent = "Ready";
        updateTabTitle(null, currentMode, false);
        hidePauseOverlay();
    }

    async function onTimerComplete() {
        if (activeSessionId) {
            try {
                await apiFetch(`/api/study-sessions/${activeSessionId}/complete`,
                    { method: "PUT" });
            } catch (e) {}
        }

        completedRounds++;
        currentRound = completedRounds < 4 ? completedRounds + 1 : 1;
        if (completedRounds >= 4) completedRounds = 0;
        updateRoundDots();

        if (activeVideoId) {
            const video = videos.find(v => v.id == activeVideoId);
            sessionCompleteMsg.textContent = video
                ? `Great work on "${video.title}"! Did you complete it?`
                : "Great work! Did you finish the topic?";
        } else {
            sessionCompleteMsg.textContent = "Focus session complete! Keep up the momentum.";
        }

        sessionCompleteModal.classList.remove("hidden");
        showControlState("done");

        sendNotification("🎉 Session Complete! — EduMind AI",
            "Great work! Check if you completed the topic.");

        // Refresh all data
        await Promise.all([loadSummary(), loadWeeklyChart(),
                           loadSubjectChart(), loadRecommendations()]);
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
            pomSessionInfoText.textContent = "Session paused — resume when ready";
        } else if (state === "done") {
            pomStartBtn.classList.remove("hidden");
        }
    }

    // ════════════════════════════════════════════
    // SESSION APIs
    // ════════════════════════════════════════════
    async function startSession() {
        const subjectId = pomSubjectSelect.value;
        if (!subjectId) { pomSubjectError.classList.remove("hidden"); return; }
        pomSubjectError.classList.add("hidden");

        const videoId = pomVideoSelect.value || null;

        try {
            pomStartBtn.disabled  = true;
            pomStartBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Starting...';

            const data = await apiFetch("/api/study-sessions/start", {
                method: "POST",
                body: JSON.stringify({
                    subjectId:    Number(subjectId),
                    videoId:      videoId ? Number(videoId) : null,
                    focusSeconds: totalSeconds,
                    breakSeconds: 300
                })
            });

            if (!data) return;

            activeSessionId = data.id;
            activeVideoId   = videoId ? Number(videoId) : null;

            const subject     = subjects.find(s => s.id == subjectId);
            const subjectName = subject ? (subject.subjectName || subject.name) : "Subject";

            if (activeVideoId) {
                const video = videos.find(v => v.id == activeVideoId);
                pomSessionInfoText.textContent =
                    `${subjectName} — ${video ? video.title : "Topic"}`;
                if (video?.videoUrl && isYouTubeUrl(video.videoUrl)) {
                    showYouTubePlayer(video.videoUrl, video.title);
                }
            } else {
                pomSessionInfoText.textContent = `${subjectName} — Focus session`;
            }

            startLocalTimer();
            showControlState("running");
            showToast("Session started! Stay focused 🎯");

        } catch (e) {
            showToast("Could not start session. Try again.", "error");
        } finally {
            pomStartBtn.disabled  = false;
            pomStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Session';
        }
    }

    async function pauseSession() {
        pauseLocalTimer();
        showControlState("paused");
        if (activeSessionId) {
            try { await apiFetch(`/api/study-sessions/${activeSessionId}/pause`, { method: "PUT" }); }
            catch (e) { console.warn("Pause API:", e.message); }
        }
    }

    async function resumeSession() {
        startLocalTimer();
        showControlState("running");
        if (activeSessionId) {
            try { await apiFetch(`/api/study-sessions/${activeSessionId}/resume`, { method: "PUT" }); }
            catch (e) { console.warn("Resume API:", e.message); }
        }
    }

    async function cancelSession() {
        if (!confirm("Cancel this session? Progress won't be saved.")) return;
        const sessionId = activeSessionId;
        activeSessionId = null;
        activeVideoId   = null;
        resetTimerUI();
        hideYouTubePlayer();
        showControlState("idle");
        showToast("Session cancelled.");
        if (sessionId) {
            try { await apiFetch(`/api/study-sessions/${sessionId}/cancel`, { method: "PUT" }); }
            catch (e) { console.warn("Cancel API:", e.message); }
        }
    }

    // ════════════════════════════════════════════
    // MARK VIDEO COMPLETE
    // ════════════════════════════════════════════
    async function markVideoComplete(videoId) {
        try {
            await apiFetch(`/api/study-videos/${videoId}/complete`, { method: "PUT" });

            const badgeData = await apiFetch("/api/badges/check", { method: "POST" });
            if (badgeData?.newlyUnlocked?.length > 0) {
                showBadgePopup(badgeData.newlyUnlocked[0]);
            }

            showToast("Video marked as completed! 🎉");
            await Promise.all([loadVideos(), loadSummary(),
                               loadSubjectChart(), loadRecommendations()]);
        } catch (e) {
            showToast("Could not mark video complete.", "error");
        }
    }

    // ════════════════════════════════════════════
    // BADGE POPUP
    // ════════════════════════════════════════════
    function showBadgePopup(badgeName) {
        if (badgeUnlockName)  badgeUnlockName.textContent = badgeName;
        if (badgeUnlockPopup) badgeUnlockPopup.classList.remove("hidden");
        setTimeout(() => { badgeUnlockPopup?.classList.add("hidden"); }, 5000);
    }

    closeBadgePopup?.addEventListener("click", () => badgeUnlockPopup.classList.add("hidden"));

    // ════════════════════════════════════════════
    // LOAD SUBJECTS
    // ════════════════════════════════════════════
    async function loadSubjects() {
        try {
            const data = await apiFetch("/api/subjects");
            subjects = Array.isArray(data) ? data : [];

            [pomSubjectSelect, addVideoSubject].forEach(sel => {
                if (!sel) return;
                const firstOpt = sel.options[0].outerHTML;
                sel.innerHTML  = firstOpt;
                subjects.forEach(s => {
                    const opt       = document.createElement("option");
                    opt.value       = s.id;
                    opt.textContent = s.subjectName || s.name;
                    sel.appendChild(opt);
                });
            });

            if (librarySubjectFilter) {
                librarySubjectFilter.innerHTML = '<option value="all">All Subjects</option>';
                subjects.forEach(s => {
                    const opt       = document.createElement("option");
                    opt.value       = s.id;
                    opt.textContent = s.subjectName || s.name;
                    librarySubjectFilter.appendChild(opt);
                });
            }
        } catch (e) {
            showToast("Could not load subjects.", "error");
        }
    }

    pomSubjectSelect?.addEventListener("change", async function () {
        pomVideoSelect.innerHTML = '<option value="">-- Select Topic --</option>';
        if (!this.value) return;
        try {
            const data = await apiFetch(`/api/study-videos/subject/${this.value}`);
            (Array.isArray(data) ? data : []).forEach(v => {
                const opt       = document.createElement("option");
                opt.value       = v.id;
                opt.textContent = v.title + (v.completed ? " ✓" : "");
                pomVideoSelect.appendChild(opt);
            });
        } catch (e) {}
    });

    // ════════════════════════════════════════════
    // LOAD VIDEOS
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

    function escHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function renderVideoList() {
        const filtered = videos.filter(v => {
            const subjectMatch = currentSubjectFilter === "all" ||
                String(v.subjectId) === String(currentSubjectFilter);
            const statusMatch  = currentFilter === "all" ||
                (currentFilter === "completed" && v.completed) ||
                (currentFilter === "pending"   && !v.completed);
            return subjectMatch && statusMatch;
        });

        if (!filtered.length) {
            pomVideoList.innerHTML = "";
            pomLibraryEmpty.style.display = "flex";
            pomVideoList.appendChild(pomLibraryEmpty);
            return;
        }

        pomLibraryEmpty.style.display = "none";
        const hasYt = v => !!(v.videoUrl && isYouTubeUrl(v.videoUrl));

        pomVideoList.innerHTML = filtered.map(v => {
            const durationMin = v.durationSeconds
                ? `${Math.round(v.durationSeconds / 60)} min` : "";

            const titleHtml = v.videoUrl
                ? `<a class="pom-video-link" href="${escHtml(v.videoUrl)}"
                       target="_blank" rel="noopener noreferrer">
                       ${escHtml(v.title)}
                       <i class="fa-solid fa-arrow-up-right-from-square"
                          style="font-size:10px;opacity:0.55;margin-left:3px"></i>
                   </a>`
                : `<span class="pom-video-title">${escHtml(v.title)}</span>`;

            const statusHtml = v.completed
                ? `<span class="pom-video-status done"><i class="fa-solid fa-check"></i> Done</span>`
                : `<span class="pom-video-status pending">Pending</span>`;

            const watchBtn = (hasYt(v) && !v.completed)
                ? `<button class="pom-video-btn pom-video-btn-watch"
                        onclick="window.pomWatchVideo('${escHtml(v.videoUrl)}','${escHtml(v.title)}')">
                        <i class="fa-brands fa-youtube"></i> Watch
                   </button>` : "";

            const actionHtml = v.completed
                ? `<button class="pom-video-btn pom-video-btn-done" disabled>
                       <i class="fa-solid fa-check"></i> Completed
                   </button>`
                : `<button class="pom-video-btn pom-video-btn-start"
                        onclick="window.pomStartFromVideo(${v.id},${v.subjectId})">
                        <i class="fa-solid fa-play"></i> Start
                   </button>
                   ${watchBtn}
                   <button class="pom-video-btn pom-video-btn-complete"
                        onclick="window.pomCompleteVideo(${v.id})">
                        <i class="fa-solid fa-check"></i> Complete
                   </button>`;

            const iconClass = hasYt(v) ? "fa-brands fa-youtube" : "fa-solid fa-circle-play";

            return `
                <div class="pom-video-item ${v.completed ? "completed" : "pending"}">
                    <div class="pom-video-icon ${hasYt(v) ? "yt-icon" : ""}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="pom-video-info">
                        ${titleHtml}
                        <div class="pom-video-meta">
                            <span class="pom-video-subject">${escHtml(v.subjectName || "")}</span>
                            ${v.tag ? `<span class="pom-video-tag">${escHtml(v.tag)}</span>` : ""}
                            ${hasYt(v) ? `<span class="pom-video-yt-badge">
                                <i class="fa-brands fa-youtube"></i> YouTube</span>` : ""}
                            ${durationMin ? `<span class="pom-video-duration">
                                <i class="fa-regular fa-clock"></i> ${durationMin}</span>` : ""}
                        </div>
                    </div>
                    ${statusHtml}
                    <div class="pom-video-actions">${actionHtml}</div>
                </div>`;
        }).join("");
    }

    // ── Global handlers ──────────────────────────
    window.pomStartFromVideo = function (videoId, subjectId) {
        pomSubjectSelect.value = subjectId;
        pomSubjectSelect.dispatchEvent(new Event("change"));
        setTimeout(() => { pomVideoSelect.value = videoId; }, 450);
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast("Subject & video selected. Press Start! 🎯");
    };

    window.pomCompleteVideo = function (videoId) { markVideoComplete(videoId); };

    window.pomWatchVideo = function (url, title) {
        showYouTubePlayer(url, title);
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast("Video opened! Start your timer to track focus. ⏱️");
    };

    // ════════════════════════════════════════════
    // LOAD SUMMARY — real backend data
    // ════════════════════════════════════════════
    async function loadSummary() {
        try {
            const data = await apiFetch("/api/dashboard/study-summary");
            if (!data) return;

            const today  = data.today  || {};
            const streak = data.streak || {};

            if (statCurrentStreak)  statCurrentStreak.textContent  = streak.currentStreak    || 0;
            if (statTodayFocus)     statTodayFocus.textContent     = today.focusMinutes      || 0;
            if (statVideosToday)    statVideosToday.textContent    = today.videosCompleted   || 0;
            if (statSessionsToday)  statSessionsToday.textContent  = today.sessionsCompleted || 0;

            const target = today.targetVideos    || 3;
            const done   = today.videosCompleted || 0;
            const pct    = today.progressPercent || 0;
            currentDailyTarget = target;

            if (statDailyTarget) statDailyTarget.textContent = `of ${target} target`;
            if (pomTargetText)   pomTargetText.textContent   = `${done} / ${target} videos`;
            if (pomTargetFill)   pomTargetFill.style.width   = `${pct}%`;
            if (pomTargetPct)    pomTargetPct.textContent    = `${pct}% complete`;

        } catch (e) { console.warn("Summary load failed:", e.message); }
    }

    // ════════════════════════════════════════════
    // LOAD BEST TIME + TOTAL HOURS
    // ════════════════════════════════════════════
    async function loadBestTime() {
        try {
            const data = await apiFetch("/api/activity/best-time");
            if (!data) return;

            if (statTotalHours) {
                statTotalHours.textContent = data.totalFocusHours || 0;
            }
            if (statBestTime) {
                statBestTime.textContent = data.weeklySessions > 0
                    ? (data.bestTimeLabel || "—")
                    : "—";
            }
            if (statBestPeriod) {
                statBestPeriod.textContent = data.weeklySessions > 0
                    ? (data.bestPeriod || "No data yet")
                    : "No sessions yet";
            }
        } catch (e) { console.warn("Best time load failed:", e.message); }
    }

    // ════════════════════════════════════════════
    // WEEKLY FOCUS CHART — real backend data
    // ════════════════════════════════════════════
    async function loadWeeklyChart() {
        const chartEl = document.getElementById("weeklyFocusChart");
        const badgeEl = document.getElementById("weeklyTotalBadge");
        if (!chartEl) return;

        try {
            const data = await apiFetch("/api/activity/calendar?days=7");
            if (!data || !Array.isArray(data)) {
                chartEl.innerHTML = `<div class="pom-chart-loading">No data yet</div>`;
                return;
            }

            const today = new Date().toISOString().split("T")[0];
            const maxMin = Math.max(...data.map(d => d.focusMinutes || 0), 1);
            const totalMin = data.reduce((sum, d) => sum + (d.focusMinutes || 0), 0);

            if (badgeEl) {
                badgeEl.textContent = totalMin >= 60
                    ? `${(totalMin / 60).toFixed(1)}h`
                    : `${totalMin} min`;
            }

            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

            chartEl.innerHTML = data.map(d => {
                const dateObj  = new Date(d.date + "T00:00:00");
                const dayLabel = days[dateObj.getDay()];
                const isToday  = d.date === today;
                const mins     = d.focusMinutes || 0;
                const barH     = Math.max((mins / maxMin) * 100, mins > 0 ? 6 : 0);
                const tip      = mins > 0 ? `${mins}m focus` : "No activity";

                return `
                    <div class="pom-bar-col ${isToday ? "today-col" : ""}" title="${tip}">
                        <div class="pom-bar-value">${mins > 0 ? mins + "m" : ""}</div>
                        <div class="pom-bar-wrap">
                            <div class="pom-bar ${isToday ? "today-bar" : ""}"
                                 style="height:${barH}%"></div>
                        </div>
                        <div class="pom-bar-label">${isToday ? "Today" : dayLabel}</div>
                    </div>`;
            }).join("");

        } catch (e) {
            chartEl.innerHTML = `<div class="pom-chart-loading">Could not load chart</div>`;
        }
    }

    // ════════════════════════════════════════════
    // SUBJECT PROGRESS CHART — real backend data
    // ════════════════════════════════════════════
    async function loadSubjectChart() {
        const chartEl = document.getElementById("subjectProgressChart");
        if (!chartEl) return;

        try {
            // Videos per subject — count from loaded videos
            const data = await apiFetch("/api/study-videos");
            if (!data || !Array.isArray(data)) {
                chartEl.innerHTML = `<div class="pom-chart-loading">No videos added yet</div>`;
                return;
            }

            // Group by subject
            const subjectMap = {};
            data.forEach(v => {
                const key  = v.subjectId;
                const name = v.subjectName || "Unknown";
                if (!subjectMap[key]) {
                    subjectMap[key] = { name, total: 0, done: 0 };
                }
                subjectMap[key].total++;
                if (v.completed) subjectMap[key].done++;
            });

            const entries = Object.values(subjectMap);

            if (!entries.length) {
                chartEl.innerHTML = `
                    <div class="pom-chart-loading">
                        <i class="fa-solid fa-circle-info"></i>
                        Add videos to see progress
                    </div>`;
                return;
            }

            // Sort by completion
            entries.sort((a, b) => (b.done / b.total) - (a.done / a.total));

            chartEl.innerHTML = entries.map((e, idx) => {
                const pct   = e.total > 0 ? Math.round((e.done / e.total) * 100) : 0;
                const color = pct >= 70 ? "fill-green" : pct >= 30 ? "" : "fill-amber";

                return `
                    <div class="pom-subject-bar-item">
                        <div class="pom-subject-bar-row">
                            <span class="pom-subject-bar-name">${escHtml(e.name)}</span>
                            <span class="pom-subject-bar-count">${e.done}/${e.total}</span>
                        </div>
                        <div class="pom-subject-bar-track">
                            <div class="pom-subject-bar-fill ${color}"
                                 style="width:${pct}%"></div>
                        </div>
                    </div>`;
            }).join("");

        } catch (e) {
            chartEl.innerHTML = `<div class="pom-chart-loading">Could not load chart</div>`;
        }
    }

    // ════════════════════════════════════════════
    // RECOMMENDED VIDEOS — pending videos, smart order
    // ════════════════════════════════════════════
    async function loadRecommendations() {
        const listEl = document.getElementById("pomRecommendList");
        if (!listEl) return;

        try {
            const data = await apiFetch("/api/study-videos");
            if (!data || !Array.isArray(data)) {
                listEl.innerHTML = `<div class="pom-recommend-empty">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    No videos added yet
                </div>`;
                return;
            }

            // Filter pending only
            const pending = data.filter(v => !v.completed);

            if (!pending.length) {
                listEl.innerHTML = `<div class="pom-recommend-empty">
                    <i class="fa-solid fa-trophy"></i>
                    🎉 All videos completed! Add more to continue.
                </div>`;
                return;
            }

            // Smart sort: YouTube first, then by subject
            const sorted = [...pending].sort((a, b) => {
                const aYt = isYouTubeUrl(a.videoUrl) ? 1 : 0;
                const bYt = isYouTubeUrl(b.videoUrl) ? 1 : 0;
                if (bYt !== aYt) return bYt - aYt;
                return (a.subjectName || "").localeCompare(b.subjectName || "");
            });

            // Show top 6 recommendations
            const top6 = sorted.slice(0, 6);
            const hasYt = v => !!(v.videoUrl && isYouTubeUrl(v.videoUrl));

            listEl.innerHTML = top6.map(v => {
                const iconClass = hasYt(v) ? "fa-brands fa-youtube" : "fa-solid fa-circle-play";

                return `
                    <div class="pom-recommend-item">
                        <div class="pom-recommend-top">
                            <div class="pom-recommend-icon ${hasYt(v) ? "yt" : ""}">
                                <i class="${iconClass}"></i>
                            </div>
                            <div class="pom-recommend-info">
                                <div class="pom-recommend-title">${escHtml(v.title)}</div>
                                <div class="pom-recommend-subject">
                                    ${escHtml(v.subjectName || "")}
                                    ${v.tag ? ` • ${escHtml(v.tag)}` : ""}
                                </div>
                            </div>
                        </div>
                        <div class="pom-recommend-actions">
                            <button class="pom-video-btn pom-video-btn-start"
                                onclick="window.pomStartFromVideo(${v.id},${v.subjectId})"
                                style="flex:1;justify-content:center;">
                                <i class="fa-solid fa-play"></i> Start
                            </button>
                            ${hasYt(v) ? `
                            <button class="pom-video-btn pom-video-btn-watch"
                                onclick="window.pomWatchVideo('${escHtml(v.videoUrl)}','${escHtml(v.title)}')">
                                <i class="fa-brands fa-youtube"></i> Watch
                            </button>` : ""}
                        </div>
                    </div>`;
            }).join("");

        } catch (e) {
            listEl.innerHTML = `<div class="pom-recommend-empty">Could not load recommendations</div>`;
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
        if (addVideoTitle)    addVideoTitle.value    = "";
        if (addVideoUrl)      addVideoUrl.value      = "";
        if (addVideoTag)      addVideoTag.value      = "";
        if (addVideoDuration) addVideoDuration.value = "";
        if (addVideoSubject)  addVideoSubject.value  = "";
        addVideoSubjectError?.classList.add("hidden");
        addVideoTitleError?.classList.add("hidden");
    }

    closeAddVideoModal?.addEventListener("click",  closeAddModal);
    cancelAddVideoModal?.addEventListener("click", closeAddModal);
    addVideoModalOverlay?.addEventListener("click", e => {
        if (e.target === addVideoModalOverlay) closeAddModal();
    });

    saveVideoBtn?.addEventListener("click", async function () {
        const subjectId = addVideoSubject?.value;
        const title     = addVideoTitle?.value.trim();
        let hasError    = false;

        if (!subjectId) { addVideoSubjectError?.classList.remove("hidden"); hasError = true; }
        else              addVideoSubjectError?.classList.add("hidden");

        if (!title) { addVideoTitleError?.classList.remove("hidden"); hasError = true; }
        else          addVideoTitleError?.classList.add("hidden");

        if (hasError) return;

        try {
            saveVideoBtn.disabled  = true;
            saveVideoBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            await apiFetch("/api/study-videos", {
                method: "POST",
                body: JSON.stringify({
                    subjectId:       Number(subjectId),
                    title,
                    videoUrl:        addVideoUrl?.value.trim() || null,
                    tag:             addVideoTag?.value.trim() || null,
                    durationSeconds: (parseInt(addVideoDuration?.value) || 0) * 60
                })
            });

            showToast("Content added to library! 📚");
            closeAddModal();
            await Promise.all([loadVideos(), loadSubjectChart(), loadRecommendations()]);

        } catch (e) {
            showToast("Could not add content: " + e.message, "error");
        } finally {
            saveVideoBtn.disabled  = false;
            saveVideoBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save';
        }
    });

    // ════════════════════════════════════════════
    // SESSION COMPLETE MODAL
    // ════════════════════════════════════════════
    markVideoCompleteBtn?.addEventListener("click", async function () {
        sessionCompleteModal.classList.add("hidden");
        if (activeVideoId) await markVideoComplete(activeVideoId);
        activeSessionId = null;
        activeVideoId   = null;
        resetTimerUI();
        hideYouTubePlayer();
        showControlState("idle");
    });

    skipMarkCompleteBtn?.addEventListener("click", function () {
        sessionCompleteModal.classList.add("hidden");
        activeSessionId = null;
        activeVideoId   = null;
        resetTimerUI();
        hideYouTubePlayer();
        showControlState("idle");
        loadSummary();
    });

    // ════════════════════════════════════════════
    // MODE TABS
    // ════════════════════════════════════════════
    function initModeBtns() {
        updateModeBtnLabels();
        totalSeconds     = customFocus * 60;
        remainingSeconds = totalSeconds;
    }

    document.querySelectorAll(".pom-mode-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            if (timerRunning) return;
            if (this.id === "pomCustomTimerBtn") return;
            document.querySelectorAll(".pom-mode-btn")
                .forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            const mins = parseInt(this.dataset.minutes);
            const mode = this.id === "modeFocus" ? "focus"
                : this.id === "modeShortBreak" ? "short" : "long";
            setMode(mins, mode);
        });
    });

    document.getElementById("pomCustomTimerBtn")
        ?.addEventListener("click", openCustomTimerModal);

    // ════════════════════════════════════════════
    // MAIN CONTROLS
    // ════════════════════════════════════════════
    pomStartBtn?.addEventListener("click",  startSession);
    pomPauseBtn?.addEventListener("click",  pauseSession);
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
            try { const v = localStorage.getItem(k); if (v) { user = JSON.parse(v); break; } }
            catch (e) {}
        }
        if (!user) return;
        const el = document.getElementById("pomProfileName");
        if (el) el.textContent = (user.fullName || user.name || "Student").split(" ")[0];
    }

    // ════════════════════════════════════════════
    // LOGOUT
    // ════════════════════════════════════════════
    document.getElementById("logoutBtn")?.addEventListener("click", e => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "login.html";
    });

    // ════════════════════════════════════════════
    // INIT — sab ek saath load karo
    // ════════════════════════════════════════════
    initModeBtns();
    setTimerDisplay(remainingSeconds);
    updateRoundDots();
    showControlState("idle");
    loadUserProfile();
    requestNotificationPermission();

    // Sab parallel load karo
    Promise.all([
        loadSubjects(),
        loadVideos(),
        loadSummary(),
        loadBestTime(),
        loadWeeklyChart(),
        loadSubjectChart(),
        loadRecommendations()
    ]);

    // Auto-refresh every 60 seconds
    setInterval(() => {
        loadSummary();
        loadBestTime();
    }, 60000);

});