// ─── User Setup ───────────────────────────────────────────
const user = JSON.parse(localStorage.getItem("edumind_logged_in_user"));
const userId = user ? user.id : null;
const userName = user ? user.fullName : "Student";
const firstName = userName.split(" ")[0];

// ─── State ────────────────────────────────────────────────
let currentSessionId = null;

// ─── DOM Elements ─────────────────────────────────────────
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("assistantMessageInput");
const sendBtn = document.getElementById("sendChatBtn");
const newChatBtn = document.getElementById("newChatBtn");
const newChatSmallBtn = document.getElementById("newChatSmallBtn");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const profileName = document.getElementById("assistantProfileName");
const profileRole = document.getElementById("assistantProfileRole");
const profileImage = document.getElementById("assistantProfileImage");
const introTitle = document.getElementById("assistantIntroTitle");
const chips = document.querySelectorAll(".assistant-chip");
const helpItems = document.querySelectorAll(".assistant-help-item");

// ─── Personalize UI ───────────────────────────────────────
if (profileName) profileName.textContent = firstName;
if (profileRole && user) profileRole.textContent = user.course || "Student";
if (introTitle) introTitle.textContent = `Hello ${firstName}, I'm Astra — your AI Study Buddy`;

// Profile photo sync
if (profileImage && user) {
    const savedPhoto = localStorage.getItem(`edumind_profile_photo_${user.id}`);
    if (savedPhoto) profileImage.src = savedPhoto;
}

// ─── Profile Dropdown ─────────────────────────────────────
const profileToggle = document.getElementById("profileMenuToggle");
const profileDropdown = document.getElementById("dashboardProfileDropdown");

if (profileToggle && profileDropdown) {
    profileToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle("hidden");
    });
    document.addEventListener("click", () => {
        profileDropdown.classList.add("hidden");
    });
}

// ─── Format Date ──────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── Add Message to Chat ──────────────────────────────────
function addMessage(text, sender) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("chat-message", sender);

    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");
    bubble.innerText = text;

    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ─── Typing Indicator ─────────────────────────────────────
function showTyping() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("chat-message", "assistant");
    wrapper.id = "typing-indicator";

    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble", "typing-bubble");
    bubble.innerHTML = `
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
    `;

    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) indicator.remove();
}

// ─── Loading State ────────────────────────────────────────
function setLoading(isLoading) {
    sendBtn.disabled = isLoading;
    chatInput.disabled = isLoading;
    sendBtn.innerHTML = isLoading
        ? `<i class="fa-solid fa-spinner fa-spin"></i>`
        : `<i class="fa-solid fa-paper-plane"></i>`;
}

// ─── Welcome Message ──────────────────────────────────────
function showWelcome() {
    chatMessages.innerHTML = "";
    currentSessionId = null;
    updateActiveHistory(null);
    addMessage(
        `Hi ${firstName}! 👋 I'm Astra, your AI study buddy.\n\nI can help you with:\n• Study plans & schedules\n• Topic explanations\n• Revision & mock questions\n• Coding doubts\n• Notes summarization\n\nWhat would you like to do today?`,
        "assistant"
    );
}

// ─── Create New Session ───────────────────────────────────
async function createSession(firstMessage) {
    try {
        const response = await fetch("http://localhost:8080/api/assistant/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId, firstMessage: firstMessage })
        });
        const data = await response.json();
        currentSessionId = data.id;
        await loadHistory();
        updateActiveHistory(currentSessionId);
        return data.id;
    } catch (error) {
        console.error("Session create error:", error);
        return null;
    }
}

// ─── Send Message ─────────────────────────────────────────
async function sendMessage(text) {
    const message = text !== undefined ? text : chatInput.value.trim();
    if (!message) return;

    chatInput.value = "";
    addMessage(message, "user");
    showTyping();
    setLoading(true);

    // Create session on first message
    if (!currentSessionId) {
        await createSession(message);
    }

    try {
        const response = await fetch("http://localhost:8080/api/assistant/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                userId: userId,
                sessionId: currentSessionId
            })
        });

        if (!response.ok) throw new Error("Server error: " + response.status);

        const data = await response.json();
        removeTyping();
        addMessage(data.reply, "assistant");

    } catch (error) {
        removeTyping();
        addMessage("⚠️ Something went wrong. Please check your connection and try again.", "assistant");
        console.error("Assistant error:", error);
    } finally {
        setLoading(false);
        chatInput.focus();
    }
}

// ─── Load History ─────────────────────────────────────────
async function loadHistory() {
    if (!userId) return;

    try {
        const response = await fetch(`http://localhost:8080/api/assistant/sessions/${userId}`);
        const sessions = await response.json();

        // Clear existing items except empty state
        const existingItems = historyList.querySelectorAll(".history-item");
        existingItems.forEach(item => item.remove());

        if (sessions.length === 0) {
            historyEmpty.style.display = "flex";
            return;
        }

        historyEmpty.style.display = "none";

        sessions.forEach(session => {
            const item = document.createElement("div");
            item.classList.add("history-item");
            item.setAttribute("data-id", session.id);
            if (session.id === currentSessionId) item.classList.add("active");

            item.innerHTML = `
                <div class="history-item-left">
                    <i class="fa-solid fa-message"></i>
                    <span class="history-item-title">${session.title}</span>
                </div>
                <span class="history-item-date">${formatDate(session.createdAt)}</span>
                <button class="history-delete-btn" data-id="${session.id}" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            // Load session on click
            item.addEventListener("click", (e) => {
                if (!e.target.closest(".history-delete-btn")) {
                    loadSession(session.id);
                }
            });

            // Delete session
            item.querySelector(".history-delete-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                deleteSession(session.id, item);
            });

            historyList.appendChild(item);
        });

    } catch (error) {
        console.error("Load history error:", error);
    }
}

// ─── Load Session Messages ────────────────────────────────
async function loadSession(sessionId) {
    try {
        const response = await fetch(`http://localhost:8080/api/assistant/session/${sessionId}`);
        const messages = await response.json();

        chatMessages.innerHTML = "";
        currentSessionId = sessionId;
        updateActiveHistory(sessionId);

        if (messages.length === 0) {
            addMessage("This conversation is empty.", "assistant");
            return;
        }

        messages.forEach(msg => {
            addMessage(msg.content, msg.sender === "USER" ? "user" : "assistant");
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.focus();

    } catch (error) {
        console.error("Load session error:", error);
    }
}

// ─── Delete Session ───────────────────────────────────────
async function deleteSession(sessionId, itemEl) {
    try {
        await fetch(`http://localhost:8080/api/assistant/session/${sessionId}`, {
            method: "DELETE"
        });

        itemEl.remove();

        // If deleted session was active — show welcome
        if (currentSessionId === sessionId) {
            showWelcome();
        }

        // Check if history is empty
        const remaining = historyList.querySelectorAll(".history-item");
        if (remaining.length === 0) {
            historyEmpty.style.display = "flex";
        }

    } catch (error) {
        console.error("Delete session error:", error);
    }
}

// ─── Update Active History Item ───────────────────────────
function updateActiveHistory(sessionId) {
    const allItems = historyList.querySelectorAll(".history-item");
    allItems.forEach(item => {
        item.classList.toggle("active", parseInt(item.getAttribute("data-id")) === sessionId);
    });
}

// ─── Event Listeners ──────────────────────────────────────
sendBtn.addEventListener("click", () => sendMessage());

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

chips.forEach(chip => {
    chip.addEventListener("click", () => {
        const prompt = chip.getAttribute("data-prompt") || chip.textContent.trim();
        sendMessage(prompt);
    });
});

helpItems.forEach(item => {
    item.addEventListener("click", () => {
        const prompt = item.getAttribute("data-prompt") || item.querySelector("span").textContent.trim();
        sendMessage(prompt);
    });

    item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const prompt = item.getAttribute("data-prompt") || item.querySelector("span").textContent.trim();
            sendMessage(prompt);
        }
    });
});

newChatBtn.addEventListener("click", () => {
    showWelcome();
    chatInput.focus();
});

newChatSmallBtn.addEventListener("click", () => {
    showWelcome();
    chatInput.focus();
});

// ─── Init ─────────────────────────────────────────────────
showWelcome();
loadHistory();