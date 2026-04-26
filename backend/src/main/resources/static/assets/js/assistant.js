// ─── State ───────────────────────────────────────────────────────
let currentSessionId = null;
let chatSessions = [];
let isTyping = false;
let heroHideTimeout = null;

// ─── DOM refs ────────────────────────────────────────────────────
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("assistantMessageInput");
const sendBtn = document.getElementById("sendChatBtn");
const newChatBtn = document.getElementById("newChatBtn");
const sideNewChatBtn = document.getElementById("sideNewChatBtn");
const historyList = document.getElementById("historyList");
const profileName = document.getElementById("assistantProfileName");
const profileRole = document.getElementById("assistantProfileRole");
const introTitle = document.getElementById("assistantIntroTitle");
const profileMenuToggle = document.getElementById("profileMenuToggle");
const profileDropdown = document.getElementById("dashboardProfileDropdown");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
const dashboardLayout = document.getElementById("dashboardLayout");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const assistantHero = document.getElementById("assistantHero");
const assistantSidePanel = document.getElementById("assistantSidePanel");
const chatInputBox = document.getElementById("chatInputBox");

// ─── Init ────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();
    loadChatHistory();
    bindEvents();
    initSidebarState();
    playInitialAnimations();
});

// ─── Startup motion ──────────────────────────────────────────────
function playInitialAnimations() {
    animateIn(assistantHero, {
        y: 18,
        duration: 550,
        delay: 80
    });

    animateIn(chatInputBox, {
        y: 20,
        duration: 500,
        delay: 140
    });

    animateIn(assistantSidePanel, {
        x: 18,
        duration: 520,
        delay: 120
    });

    document.querySelectorAll(".assistant-chip").forEach((chip, index) => {
        animateIn(chip, {
            y: 10,
            duration: 360,
            delay: 140 + index * 50
        });
    });

    document.querySelectorAll(".assistant-help-item").forEach((item, index) => {
        animateIn(item, {
            x: 12,
            duration: 340,
            delay: 180 + index * 45
        });
    });
}

function animateIn(element, {
    x = 0,
    y = 0,
    scale = 1,
    duration = 420,
    delay = 0,
    easing = "cubic-bezier(0.22, 1, 0.36, 1)"
} = {}) {
    if (!element || typeof element.animate !== "function") return;

    element.animate(
        [
            {
                opacity: 0,
                transform: `translate(${x}px, ${y}px) scale(${scale === 1 ? 0.98 : scale})`
            },
            {
                opacity: 1,
                transform: "translate(0, 0) scale(1)"
            }
        ],
        {
            duration,
            delay,
            easing,
            fill: "both"
        }
    );
}

function animateButtonTap(button) {
    if (!button || typeof button.animate !== "function") return;

    button.animate(
        [
            { transform: "scale(1)" },
            { transform: "scale(0.96)" },
            { transform: "scale(1.02)" },
            { transform: "scale(1)" }
        ],
        {
            duration: 220,
            easing: "ease-out"
        }
    );
}

function animateIconSpin(button) {
    const icon = button?.querySelector("i");
    if (!icon || typeof icon.animate !== "function") return;

    icon.animate(
        [
            { transform: "rotate(0deg) scale(1)" },
            { transform: "rotate(180deg) scale(1.08)" },
            { transform: "rotate(360deg) scale(1)" }
        ],
        {
            duration: 480,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)"
        }
    );
}

// ─── Load user profile ───────────────────────────────────────────
function loadUserProfile() {
    const name = localStorage.getItem("userName") || "Student";
    const email = localStorage.getItem("userEmail") || "";

    if (profileName) profileName.textContent = name;
    if (profileRole) profileRole.textContent = email || "Student";
    if (introTitle) introTitle.textContent = `Hello ${name} — I'm Astra, your AI Study Buddy`;
}

// ─── Profile dropdown helpers ────────────────────────────────────
function openProfileDropdown() {
    if (!profileDropdown) return;

    profileDropdown.classList.remove("hidden");
    animateIn(profileDropdown, {
        y: 10,
        duration: 220,
        delay: 0
    });
}

function closeProfileDropdown() {
    if (!profileDropdown) return;
    profileDropdown.classList.add("hidden");
}

function toggleProfileDropdown(event) {
    if (!profileDropdown || !profileMenuToggle) return;

    event.preventDefault();
    event.stopPropagation();

    const isHidden = profileDropdown.classList.contains("hidden");

    if (isHidden) {
        openProfileDropdown();
    } else {
        closeProfileDropdown();
    }
}

// ─── Bind events ─────────────────────────────────────────────────
function bindEvents() {
    // Send
    if (sendBtn) {
        sendBtn.addEventListener("click", () => {
            animateButtonTap(sendBtn);
            handleSend();
        });
    }

    if (messageInput) {
        messageInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                animateButtonTap(sendBtn);
                handleSend();
            }
        });

        messageInput.addEventListener("focus", () => {
            animateIn(chatInputBox, { scale: 0.985, duration: 260, delay: 0 });
        });
    }

    // New chat
    if (newChatBtn) {
        newChatBtn.addEventListener("click", () => {
            animateButtonTap(newChatBtn);
            closeProfileDropdown();
            startNewChat();
        });
    }

    if (sideNewChatBtn) {
        sideNewChatBtn.addEventListener("click", () => {
            animateButtonTap(sideNewChatBtn);
            closeProfileDropdown();
            startNewChat();
        });
    }

    // Chips
    document.querySelectorAll(".assistant-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            animateButtonTap(chip);
            closeProfileDropdown();
            const prompt = chip.getAttribute("data-prompt");
            if (prompt) sendMessage(prompt);
        });
    });

    // Suggested help
    document.querySelectorAll(".assistant-help-item").forEach((item) => {
        item.addEventListener("click", () => {
            animateButtonTap(item);
            closeProfileDropdown();
            const prompt = item.getAttribute("data-prompt");
            if (prompt) sendMessage(prompt);
        });

        item.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                animateButtonTap(item);
                closeProfileDropdown();
                const prompt = item.getAttribute("data-prompt");
                if (prompt) sendMessage(prompt);
            }
        });
    });

    // Profile dropdown
    if (profileMenuToggle && profileDropdown) {
        profileMenuToggle.addEventListener("click", toggleProfileDropdown);

        profileDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        document.addEventListener("click", (e) => {
            const clickedInsideToggle = profileMenuToggle.contains(e.target);
            const clickedInsideDropdown = profileDropdown.contains(e.target);

            if (!clickedInsideToggle && !clickedInsideDropdown) {
                closeProfileDropdown();
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeProfileDropdown();
            }
        });
    }

    // Theme toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            animateButtonTap(themeToggleBtn);
            animateIconSpin(themeToggleBtn);
            closeProfileDropdown();

            document.body.classList.toggle("dark-mode");

            const icon = themeToggleBtn.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-moon");
                icon.classList.toggle("fa-sun");
            }

            localStorage.setItem(
                "edumind_theme",
                document.body.classList.contains("dark-mode") ? "dark" : "light"
            );
        });
    }

    // Sidebar toggle — hamburger
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener("click", () => {
            animateButtonTap(sidebarToggleBtn);
            closeProfileDropdown();
            toggleSidebar();
        });
    }

    // Sidebar overlay click (mobile)
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", () => {
            closeProfileDropdown();
            closeSidebar();
        });
    }
}

// ─── Sidebar logic ────────────────────────────────────────────────
function initSidebarState() {
    const saved = localStorage.getItem("edumind_sidebar_hidden");
    if (saved === "true") {
        dashboardLayout?.classList.add("sidebar-hidden");
    }

    const theme = localStorage.getItem("edumind_theme");
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        const icon = themeToggleBtn?.querySelector("i");
        if (icon) {
            icon.classList.remove("fa-moon");
            icon.classList.add("fa-sun");
        }
    }
}

function toggleSidebar() {
    const isHidden = dashboardLayout?.classList.toggle("sidebar-hidden");
    localStorage.setItem("edumind_sidebar_hidden", isHidden ? "true" : "false");

    if (window.innerWidth <= 900) {
        if (!isHidden) {
            sidebarOverlay?.classList.add("active");
        } else {
            sidebarOverlay?.classList.remove("active");
        }
    }
}

function closeSidebar() {
    dashboardLayout?.classList.add("sidebar-hidden");
    sidebarOverlay?.classList.remove("active");
    localStorage.setItem("edumind_sidebar_hidden", "true");
}

// ─── Hero show/hide ───────────────────────────────────────────────
function hideHero() {
    if (!assistantHero || assistantHero.classList.contains("hidden")) return;

    clearTimeout(heroHideTimeout);

    if (typeof assistantHero.animate === "function") {
        assistantHero.animate(
            [
                { opacity: 1, transform: "translateY(0) scale(1)" },
                { opacity: 0, transform: "translateY(-12px) scale(0.985)" }
            ],
            {
                duration: 240,
                easing: "ease",
                fill: "forwards"
            }
        );
    }

    heroHideTimeout = setTimeout(() => {
        assistantHero.classList.add("hidden");
    }, 220);
}

function showHero() {
    if (!assistantHero) return;

    clearTimeout(heroHideTimeout);
    assistantHero.classList.remove("hidden");

    if (typeof assistantHero.animate === "function") {
        assistantHero.animate(
            [
                { opacity: 0, transform: "translateY(16px) scale(0.985)" },
                { opacity: 1, transform: "translateY(0) scale(1)" }
            ],
            {
                duration: 320,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "both"
            }
        );
    }
}

// ─── Handle send ──────────────────────────────────────────────────
function handleSend() {
    const text = messageInput?.value?.trim();
    if (!text || isTyping) return;

    messageInput.value = "";
    sendMessage(text);
}

// ─── Core send ────────────────────────────────────────────────────
async function sendMessage(text) {
    if (!text || isTyping) return;

    hideHero();
    appendMessage("user", text);
    scrollToBottom();

    const typingId = showTyping();
    setInputDisabled(true);
    isTyping = true;

    try {
        if (!currentSessionId) {
            currentSessionId = await createSession(text);
        }

        const response = await apiFetch("/api/assistant/chat", {
            method: "POST",
            body: JSON.stringify({ message: text, sessionId: currentSessionId })
        });

        await removeTyping(typingId);

        const reply = response?.reply || "Koi response nahi mila. Dobara try karo.";
        appendMessage("assistant", reply);
        updateHistoryTitle(currentSessionId, text);

    } catch (err) {
        await removeTyping(typingId);
        console.error("Assistant error:", err);

        const errMsg = err.message?.includes("401")
            ? "Session expire ho gayi. Please login karke dobara aao."
            : "Kuch gadbad ho gayi. Backend ya internet connection check karo.";

        appendMessage("assistant", `⚠️ ${errMsg}`);
    } finally {
        isTyping = false;
        setInputDisabled(false);
        scrollToBottom();
        messageInput?.focus();
    }
}

// ─── Create session ───────────────────────────────────────────────
async function createSession(firstMessage) {
    try {
        const session = await apiFetch("/api/assistant/session", {
            method: "POST",
            body: JSON.stringify({ firstMessage })
        });

        if (session?.id) {
            addSessionToHistory(session);
            return session.id;
        }
    } catch (err) {
        console.error("Session create error:", err);
    }

    return null;
}

// ─── New chat ─────────────────────────────────────────────────────
function startNewChat() {
    currentSessionId = null;

    if (chatMessages) {
        if (typeof chatMessages.animate === "function") {
            chatMessages.animate(
                [
                    { opacity: 1, transform: "translateY(0)" },
                    { opacity: 0, transform: "translateY(8px)" }
                ],
                {
                    duration: 180,
                    easing: "ease-out"
                }
            );
        }

        setTimeout(() => {
            if (chatMessages) chatMessages.innerHTML = "";
            showHero();
        }, 120);
    } else {
        showHero();
    }

    messageInput?.focus();
    document.querySelectorAll(".history-item").forEach((item) => item.classList.remove("active"));

    if (window.innerWidth <= 900) {
        assistantSidePanel?.classList.remove("open");
        sidebarOverlay?.classList.remove("active");
    }
}

// ─── Load history ─────────────────────────────────────────────────
async function loadChatHistory() {
    try {
        const sessions = await apiFetch("/api/assistant/sessions");
        if (Array.isArray(sessions)) {
            chatSessions = sessions;
            renderHistory(sessions);
        }
    } catch (err) {
        console.error("History load error:", err);
    }
}

function renderHistory(sessions) {
    if (!historyList) return;

    historyList.innerHTML = "";

    if (!sessions.length) {
        historyList.appendChild(createHistoryEmpty());
        return;
    }

    sessions.forEach((session) => addSessionToHistory(session, false));
}

function addSessionToHistory(session, prepend = true) {
    if (!historyList) return;

    const empty = historyList.querySelector(".history-empty");
    if (empty) empty.remove();

    const item = document.createElement("div");
    item.className = "history-item";
    item.dataset.sessionId = session.id;

    const dateStr = session.createdAt
        ? new Date(session.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : "";

    item.innerHTML = `
        <div class="history-item-left">
            <i class="fa-solid fa-comment-dots"></i>
            <span class="history-item-title">${escapeHtml(session.title || "New Chat")}</span>
        </div>
        <span class="history-item-date">${dateStr}</span>
        <button class="history-delete-btn" title="Delete" data-id="${session.id}" type="button">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

    item.addEventListener("click", (e) => {
        if (e.target.closest(".history-delete-btn")) return;
        loadSession(session.id, item);
    });

    const deleteBtn = item.querySelector(".history-delete-btn");
    deleteBtn?.addEventListener("click", async (e) => {
        e.stopPropagation();
        animateButtonTap(deleteBtn);
        await deleteSession(session.id, item);
    });

    if (prepend) {
        historyList.prepend(item);
    } else {
        historyList.appendChild(item);
    }

    animateIn(item, {
        x: 10,
        duration: 280,
        delay: 0
    });
}

async function loadSession(sessionId, itemEl) {
    currentSessionId = sessionId;
    document.querySelectorAll(".history-item").forEach((item) => item.classList.remove("active"));
    itemEl.classList.add("active");

    if (chatMessages) chatMessages.innerHTML = "";
    hideHero();

    try {
        const messages = await apiFetch(`/api/assistant/session/${sessionId}`);

        if (Array.isArray(messages) && messages.length) {
            messages.forEach((msg, index) => {
                appendMessage(
                    msg.sender === "USER" ? "user" : "assistant",
                    msg.content,
                    index * 40
                );
            });
        } else {
            showHero();
        }
    } catch (err) {
        console.error("Load session error:", err);
        appendMessage("assistant", "⚠️ Session load nahi ho payi. Dobara try karo.");
    }

    scrollToBottom();
}

async function deleteSession(sessionId, itemEl) {
    try {
        await apiFetch(`/api/assistant/session/${sessionId}`, { method: "DELETE" });

        if (itemEl && typeof itemEl.animate === "function") {
            itemEl.animate(
                [
                    { opacity: 1, transform: "translateX(0) scale(1)" },
                    { opacity: 0, transform: "translateX(20px) scale(0.96)" }
                ],
                {
                    duration: 220,
                    easing: "ease-in",
                    fill: "forwards"
                }
            );
        }

        setTimeout(() => {
            itemEl?.remove();

            if (currentSessionId === sessionId) startNewChat();
            if (!historyList.querySelector(".history-item")) {
                historyList.appendChild(createHistoryEmpty());
            }
        }, 180);
    } catch (err) {
        console.error("Delete session error:", err);
    }
}

function updateHistoryTitle(sessionId, message) {
    if (!sessionId) return;

    const item = historyList?.querySelector(`[data-session-id="${sessionId}"] .history-item-title`);
    if (item) {
        item.textContent = message.length > 38 ? `${message.substring(0, 38)}...` : message;
    }
}

// ─── Chat helpers ─────────────────────────────────────────────────
function appendMessage(role, text, delay = 0) {
    if (!chatMessages) return;

    const wrapper = document.createElement("div");
    wrapper.className = `chat-message ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);

    if (typeof wrapper.animate === "function") {
        wrapper.animate(
            [
                {
                    opacity: 0,
                    transform: role === "user" ? "translateY(12px) translateX(12px)" : "translateY(12px) translateX(-12px)"
                },
                {
                    opacity: 1,
                    transform: "translateY(0) translateX(0)"
                }
            ],
            {
                duration: 260,
                delay,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "both"
            }
        );
    }

    scrollToBottom();
}

function showTyping() {
    if (!chatMessages) return null;

    const id = `typing-${Date.now()}`;
    const wrapper = document.createElement("div");
    wrapper.className = "chat-message assistant";
    wrapper.id = id;
    wrapper.innerHTML = `
        <div class="chat-bubble typing-bubble">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    `;

    chatMessages.appendChild(wrapper);

    if (typeof wrapper.animate === "function") {
        wrapper.animate(
            [
                { opacity: 0, transform: "translateY(8px)" },
                { opacity: 1, transform: "translateY(0)" }
            ],
            {
                duration: 180,
                easing: "ease-out",
                fill: "both"
            }
        );
    }

    scrollToBottom();
    return id;
}

function removeTyping(id) {
    return new Promise((resolve) => {
        if (!id) {
            resolve();
            return;
        }

        const typingEl = document.getElementById(id);
        if (!typingEl) {
            resolve();
            return;
        }

        if (typeof typingEl.animate === "function") {
            typingEl.animate(
                [
                    { opacity: 1, transform: "translateY(0)" },
                    { opacity: 0, transform: "translateY(-6px)" }
                ],
                {
                    duration: 160,
                    easing: "ease-in",
                    fill: "forwards"
                }
            );
        }

        setTimeout(() => {
            typingEl.remove();
            resolve();
        }, 140);
    });
}

function setInputDisabled(disabled) {
    if (messageInput) messageInput.disabled = disabled;
    if (sendBtn) sendBtn.disabled = disabled;
}

function scrollToBottom() {
    if (!chatMessages) return;

    requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function createHistoryEmpty() {
    const el = document.createElement("div");
    el.className = "history-empty";
    el.id = "historyEmpty";
    el.innerHTML = `<i class="fa-solid fa-comment-slash"></i><p>No chat history yet</p>`;
    return el;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}