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
    delay: 80,
  });

  animateIn(chatInputBox, {
    y: 20,
    duration: 500,
    delay: 140,
  });

  animateIn(assistantSidePanel, {
    x: 18,
    duration: 520,
    delay: 120,
  });

  document.querySelectorAll(".assistant-chip").forEach((chip, index) => {
    animateIn(chip, {
      y: 10,
      duration: 360,
      delay: 140 + index * 50,
    });
  });

  document.querySelectorAll(".assistant-help-item").forEach((item, index) => {
    animateIn(item, {
      x: 12,
      duration: 340,
      delay: 180 + index * 45,
    });
  });
}

function animateIn(
  element,
  {
    x = 0,
    y = 0,
    scale = 1,
    duration = 420,
    delay = 0,
    easing = "cubic-bezier(0.22, 1, 0.36, 1)",
  } = {},
) {
  if (!element || typeof element.animate !== "function") return;

  element.animate(
    [
      {
        opacity: 0,
        transform: `translate(${x}px, ${y}px) scale(${scale === 1 ? 0.98 : scale})`,
      },
      {
        opacity: 1,
        transform: "translate(0, 0) scale(1)",
      },
    ],
    {
      duration,
      delay,
      easing,
      fill: "both",
    },
  );
}

function animateButtonTap(button) {
  if (!button || typeof button.animate !== "function") return;

  button.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(0.96)" },
      { transform: "scale(1.02)" },
      { transform: "scale(1)" },
    ],
    {
      duration: 220,
      easing: "ease-out",
    },
  );
}

function animateIconSpin(button) {
  const icon = button?.querySelector("i");
  if (!icon || typeof icon.animate !== "function") return;

  icon.animate(
    [
      { transform: "rotate(0deg) scale(1)" },
      { transform: "rotate(180deg) scale(1.08)" },
      { transform: "rotate(360deg) scale(1)" },
    ],
    {
      duration: 480,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  );
}

// ─── User profile ────────────────────────────────────────────────
function loadUserProfile() {
  const storedUser = getStoredUser();
  const name =
    storedUser?.name ||
    storedUser?.fullName ||
    storedUser?.username ||
    localStorage.getItem("userName") ||
    "Student";

  const email = storedUser?.email || localStorage.getItem("userEmail") || "";

  if (profileName) profileName.textContent = name;
  if (profileRole) profileRole.textContent = email || "Student";
  if (introTitle)
    introTitle.textContent = `Hello ${name} — I'm Astra, your AI Study Buddy`;
}

function getStoredUser() {
  const possibleKeys = [
    "edumind_logged_in_user",
    "loggedInUser",
    "currentUser",
    "user",
  ];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (error) {
      // Ignore invalid localStorage data.
    }
  }

  return null;
}

// ─── Profile dropdown ────────────────────────────────────────────
function openProfileDropdown() {
  if (!profileDropdown) return;

  profileDropdown.classList.remove("hidden");
  animateIn(profileDropdown, {
    y: 10,
    duration: 220,
    delay: 0,
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

// ─── Events ──────────────────────────────────────────────────────
function bindEvents() {
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      animateButtonTap(sendBtn);
      handleSend();
    });
  }

  if (messageInput) {
    messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        animateButtonTap(sendBtn);
        handleSend();
      }
    });

    messageInput.addEventListener("focus", () => {
      animateIn(chatInputBox, {
        scale: 0.985,
        duration: 260,
        delay: 0,
      });
    });
  }

  if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
      animateButtonTap(newChatBtn);
      closeProfileDropdown();
      startNewChat();
    });
  }

  document.querySelectorAll(".assistant-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      animateButtonTap(chip);
      closeProfileDropdown();

      const prompt = chip.getAttribute("data-prompt");
      if (prompt) sendMessage(prompt);
    });
  });

  document.querySelectorAll(".assistant-help-item").forEach((item) => {
    item.addEventListener("click", () => {
      animateButtonTap(item);
      closeProfileDropdown();

      const prompt = item.getAttribute("data-prompt");
      if (prompt) sendMessage(prompt);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        animateButtonTap(item);
        closeProfileDropdown();

        const prompt = item.getAttribute("data-prompt");
        if (prompt) sendMessage(prompt);
      }
    });
  });

  if (profileMenuToggle && profileDropdown) {
    profileMenuToggle.addEventListener("click", toggleProfileDropdown);

    profileDropdown.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
      const clickedInsideToggle = profileMenuToggle.contains(event.target);
      const clickedInsideDropdown = profileDropdown.contains(event.target);

      if (!clickedInsideToggle && !clickedInsideDropdown) {
        closeProfileDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeProfileDropdown();
      }
    });
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      animateButtonTap(themeToggleBtn);
      animateIconSpin(themeToggleBtn);
      closeProfileDropdown();
      syncThemeIcon();
    });
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      animateButtonTap(sidebarToggleBtn);
      closeProfileDropdown();
      toggleSidebar();
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", () => {
      closeProfileDropdown();
      closeSidebar();
    });
  }
}

// ─── Theme / sidebar ─────────────────────────────────────────────
function initSidebarState() {
  const savedSidebar = localStorage.getItem("edumind_sidebar_hidden");

  if (savedSidebar === "true") {
    dashboardLayout?.classList.add("sidebar-hidden");
  }

  const savedTheme = localStorage.getItem("edumind_theme") || "dark";
  const isDark = savedTheme === "dark";

  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light",
  );
  document.body.classList.toggle("preview-dark", isDark);
  document.body.classList.toggle("dark-mode", isDark);
  document.body.classList.toggle("light-mode", !isDark);

  syncThemeIcon();
}

function syncThemeIcon() {
  const isDark =
    document.body.classList.contains("preview-dark") ||
    document.body.classList.contains("dark-mode") ||
    document.documentElement.getAttribute("data-theme") === "dark";

  const icon = themeToggleBtn?.querySelector("i");

  if (icon) {
    icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  if (themeToggleBtn) {
    themeToggleBtn.title = isDark
      ? "Switch to light mode"
      : "Switch to dark mode";
    themeToggleBtn.setAttribute("aria-label", themeToggleBtn.title);
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

// ─── Hero ────────────────────────────────────────────────────────
function hideHero() {
  if (!assistantHero || assistantHero.classList.contains("hidden")) return;

  clearTimeout(heroHideTimeout);

  if (typeof assistantHero.animate === "function") {
    assistantHero.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(-12px) scale(0.985)" },
      ],
      {
        duration: 240,
        easing: "ease",
        fill: "forwards",
      },
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
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 320,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      },
    );
  }
}

// ─── Send message ────────────────────────────────────────────────
function handleSend() {
  const text = messageInput?.value?.trim();

  if (!text || isTyping) {
    return;
  }

  messageInput.value = "";
  sendMessage(text);
}

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
      body: JSON.stringify({
        message: text,
        sessionId: currentSessionId,
      }),
    });

    await removeTyping(typingId);

    const reply =
      response?.reply || "No response was received. Please try again.";
    appendMessage("assistant", reply);
    updateHistoryTitle(currentSessionId, text);
  } catch (error) {
    await removeTyping(typingId);
    console.error("Assistant error:", error);

    const errorMessage = getAssistantErrorMessage(error);
    appendMessage("assistant", `⚠️ ${errorMessage}`);
    showAssistantToast(errorMessage, "error");
  } finally {
    isTyping = false;
    setInputDisabled(false);
    scrollToBottom();
    messageInput?.focus();
  }
}

function getAssistantErrorMessage(error) {
  const message = String(error?.message || "").toLowerCase();

  if (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("unauthorized")
  ) {
    return "Your session has expired. Please log in again.";
  }

  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Network connection failed. Please check your internet connection.";
  }

  return "Something went wrong. Please check the backend server and try again.";
}

// ─── Session creation ────────────────────────────────────────────
async function createSession(firstMessage) {
  try {
    const session = await apiFetch("/api/assistant/session", {
      method: "POST",
      body: JSON.stringify({ firstMessage }),
    });

    if (session?.id) {
      addSessionToHistory(session);
      return session.id;
    }
  } catch (error) {
    console.error("Session create error:", error);
    showAssistantToast(
      "Chat session could not be created. The message will still be sent.",
      "warning",
    );
  }

  return null;
}

// ─── New chat ────────────────────────────────────────────────────
function startNewChat() {
  currentSessionId = null;

  if (chatMessages) {
    if (typeof chatMessages.animate === "function") {
      chatMessages.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(8px)" },
        ],
        {
          duration: 180,
          easing: "ease-out",
        },
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
  document
    .querySelectorAll(".history-item")
    .forEach((item) => item.classList.remove("active"));

  if (window.innerWidth <= 900) {
    assistantSidePanel?.classList.remove("open");
    sidebarOverlay?.classList.remove("active");
  }
}

// ─── History ─────────────────────────────────────────────────────
async function loadChatHistory() {
  try {
    const sessions = await apiFetch("/api/assistant/sessions");

    if (Array.isArray(sessions)) {
      chatSessions = sessions;
      renderHistory(sessions);
    }
  } catch (error) {
    console.error("History load error:", error);
    showAssistantToast("Chat history could not be loaded.", "warning");
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

  const dateText = session.createdAt
    ? new Date(session.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "";

  item.innerHTML = `
        <div class="history-item-left">
            <i class="fa-solid fa-comment-dots"></i>
            <span class="history-item-title">${escapeHtml(session.title || "New Chat")}</span>
        </div>
        <span class="history-item-date">${escapeHtml(dateText)}</span>
        <button class="history-delete-btn" title="Delete" data-id="${escapeHtml(session.id)}" type="button">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

  item.addEventListener("click", (event) => {
    if (event.target.closest(".history-delete-btn")) return;
    loadSession(session.id, item);
  });

  const deleteBtn = item.querySelector(".history-delete-btn");

  deleteBtn?.addEventListener("click", async (event) => {
    event.stopPropagation();
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
    delay: 0,
  });
}

async function loadSession(sessionId, itemEl) {
  currentSessionId = sessionId;

  document.querySelectorAll(".history-item").forEach((item) => {
    item.classList.remove("active");
  });

  itemEl?.classList.add("active");

  if (chatMessages) {
    chatMessages.innerHTML = "";
  }

  hideHero();

  try {
    const messages = await apiFetch(`/api/assistant/session/${sessionId}`);

    if (Array.isArray(messages) && messages.length) {
      messages.forEach((message, index) => {
        appendMessage(
          message.sender === "USER" ? "user" : "assistant",
          message.content,
          index * 40,
        );
      });
    } else {
      showHero();
    }
  } catch (error) {
    console.error("Load session error:", error);
    appendMessage(
      "assistant",
      "⚠️ Session could not be loaded. Please try again.",
    );
    showAssistantToast(
      "Session could not be loaded. Please try again.",
      "error",
    );
  }

  scrollToBottom();
}

async function deleteSession(sessionId, itemEl) {
  try {
    await apiFetch(`/api/assistant/session/${sessionId}`, {
      method: "DELETE",
    });

    if (itemEl && typeof itemEl.animate === "function") {
      itemEl.animate(
        [
          { opacity: 1, transform: "translateX(0) scale(1)" },
          { opacity: 0, transform: "translateX(20px) scale(0.96)" },
        ],
        {
          duration: 220,
          easing: "ease-in",
          fill: "forwards",
        },
      );
    }

    setTimeout(() => {
      itemEl?.remove();

      if (currentSessionId === sessionId) {
        startNewChat();
      }

      if (!historyList?.querySelector(".history-item")) {
        historyList?.appendChild(createHistoryEmpty());
      }
    }, 180);

    showAssistantToast("Chat deleted successfully.", "success");
  } catch (error) {
    console.error("Delete session error:", error);
    showAssistantToast("Chat could not be deleted. Please try again.", "error");
  }
}

function updateHistoryTitle(sessionId, message) {
  if (!sessionId) return;

  const item = historyList?.querySelector(
    `[data-session-id="${sessionId}"] .history-item-title`,
  );

  if (item) {
    item.textContent =
      message.length > 38 ? `${message.substring(0, 38)}...` : message;
  }
}

// ─── Chat UI helpers ─────────────────────────────────────────────
function appendMessage(role, text, delay = 0) {
  if (!chatMessages) return;

  const wrapper = document.createElement("div");
  wrapper.className = `chat-message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = text || "";

  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);

  if (typeof wrapper.animate === "function") {
    wrapper.animate(
      [
        {
          opacity: 0,
          transform:
            role === "user"
              ? "translateY(12px) translateX(12px)"
              : "translateY(12px) translateX(-12px)",
        },
        {
          opacity: 1,
          transform: "translateY(0) translateX(0)",
        },
      ],
      {
        duration: 260,
        delay,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      },
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
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 180,
        easing: "ease-out",
        fill: "both",
      },
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
          { opacity: 0, transform: "translateY(-6px)" },
        ],
        {
          duration: 160,
          easing: "ease-in",
          fill: "forwards",
        },
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
  const element = document.createElement("div");

  element.className = "history-empty";
  element.id = "historyEmpty";
  element.innerHTML = `
        <i class="fa-solid fa-comment-slash"></i>
        <p>No chat history yet</p>
    `;

  return element;
}

// ─── Toast ───────────────────────────────────────────────────────
function showAssistantToast(message, type = "info") {
  const oldToast = document.querySelector(".assistant-toast");

  if (oldToast) {
    oldToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `assistant-toast ${type}`;

  const iconClass =
    type === "success"
      ? "fa-circle-check"
      : type === "error"
        ? "fa-triangle-exclamation"
        : type === "warning"
          ? "fa-circle-exclamation"
          : "fa-circle-info";

  toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${escapeHtml(message)}</span>
    `;

  document.body.appendChild(toast);
  injectAssistantToastStyle();

  setTimeout(() => {
    toast.remove();
  }, 3600);
}

function injectAssistantToastStyle() {
  if (document.getElementById("assistantToastStyle")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "assistantToastStyle";
  style.textContent = `
        .assistant-toast {
            position: fixed;
            top: 22px;
            right: 22px;
            z-index: 999999;
            min-width: 280px;
            max-width: 430px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 16px;
            border-radius: 16px;
            font-family: "Poppins", sans-serif;
            font-size: 13px;
            font-weight: 750;
            line-height: 1.55;
            color: #ffffff;
            box-shadow:
                0 22px 52px rgba(8, 17, 31, 0.24),
                0 0 24px rgba(6, 182, 212, 0.12);
            animation: assistantToastIn 0.25s ease;
        }

        .assistant-toast.info {
            background: linear-gradient(135deg, #0891b2, #0f766e);
            border: 1px solid rgba(103, 232, 249, 0.28);
        }

        .assistant-toast.success {
            background: linear-gradient(135deg, #059669, #10b981);
            border: 1px solid rgba(110, 231, 183, 0.32);
        }

        .assistant-toast.warning {
            background: linear-gradient(135deg, #b45309, #f59e0b);
            border: 1px solid rgba(253, 230, 138, 0.32);
        }

        .assistant-toast.error {
            background: linear-gradient(135deg, #991b1b, #dc2626);
            border: 1px solid rgba(252, 165, 165, 0.32);
        }

        .assistant-toast i {
            flex-shrink: 0;
            font-size: 16px;
        }

        @keyframes assistantToastIn {
            from {
                opacity: 0;
                transform: translateY(-10px) scale(0.98);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @media (max-width: 560px) {
            .assistant-toast {
                left: 14px;
                right: 14px;
                top: 16px;
                min-width: auto;
                max-width: none;
            }
        }
    `;

  document.head.appendChild(style);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(text ?? "")));
  return div.innerHTML;
}

/* ============================================================
   Assistant Mobile Drawer Behavior
   Keeps suggestions/history clickable and closes drawer after use
   ============================================================ */
(function () {
  const body = document.body;
  const mobileToggle = document.getElementById("mobileToggle");
  const overlay = document.getElementById("sidebarOverlay");
  const sidePanel = document.querySelector(".side-panel");
  const newChatBtn = document.getElementById("newChatBtn");

  function closeAssistantTools() {
    body.classList.remove("sidebar-open");

    if (mobileToggle) {
      mobileToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      mobileToggle.setAttribute("aria-label", "Open Astra tools");
      mobileToggle.setAttribute("title", "Open Astra tools");
    }
  }

  function syncToolsButtonLabel() {
    if (!mobileToggle) return;

    const isOpen = body.classList.contains("sidebar-open");

    mobileToggle.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';

    mobileToggle.setAttribute(
      "aria-label",
      isOpen ? "Close Astra tools" : "Open Astra tools",
    );

    mobileToggle.setAttribute(
      "title",
      isOpen ? "Close Astra tools" : "Open Astra tools",
    );
  }

  mobileToggle?.addEventListener("click", function () {
    setTimeout(syncToolsButtonLabel, 0);
  });

  overlay?.addEventListener("click", closeAssistantTools);

  sidePanel?.addEventListener("click", function (event) {
    const clickedTool = event.target.closest("[data-prompt]");
    const clickedHistory = event.target.closest(".history-item");

    if (clickedTool || clickedHistory) {
      setTimeout(closeAssistantTools, 120);
    }
  });

  newChatBtn?.addEventListener("click", closeAssistantTools);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAssistantTools();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) {
      closeAssistantTools();
    }
  });

  syncToolsButtonLabel();
})();
