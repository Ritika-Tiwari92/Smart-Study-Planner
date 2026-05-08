/* =========================================================
   EduMind AI — Student Notifications
   Click-based notification dropdown + unread badge
   English-only UI text
   ========================================================= */

(function () {
  "use strict";

  const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalhost && window.location.port !== "8080") {
      return "http://localhost:8080";
    }

    return window.location.origin;
  })();

  let notifications = [];
  let isDropdownOpen = false;
  let initialized = false;

  document.addEventListener("DOMContentLoaded", () => {
    initNotificationUI();
  });

  function getToken() {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("jwtToken") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("jwtToken") ||
      sessionStorage.getItem("accessToken") ||
      ""
    ).trim();
  }

  async function apiFetch(url, options = {}) {
    const token = getToken();

    if (!token) {
      throw new Error("Login token was not found.");
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`;

      throw new Error(message);
    }

    return data;
  }

  function initNotificationUI() {
    if (initialized) return;

    const bellButton = findBellButton();

    if (!bellButton) {
      console.warn("Notification bell button was not found.");
      return;
    }

    initialized = true;

    bellButton.classList.add("edumind-notification-bell");
    bellButton.setAttribute("type", "button");
    bellButton.setAttribute("aria-label", "Open notifications");
    bellButton.setAttribute("data-notification-ready", "true");

    removeOldDropdowns();
    ensureBadge(bellButton);
    ensureDropdown();
    injectNotificationStyles();

    bellButton.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        toggleDropdown();
      },
      true,
    );

    document.addEventListener("click", (event) => {
      const dropdown = document.getElementById("studentNotificationDropdown");
      const currentBell = findBellButton();

      if (!dropdown || !currentBell) return;

      const clickedBell = currentBell.contains(event.target);
      const clickedDropdown = dropdown.contains(event.target);

      if (!clickedBell && !clickedDropdown) {
        closeDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    });

    document.addEventListener("click", async (event) => {
      const markAllBtn = event.target.closest(".mark-all-notifications-btn");

      if (markAllBtn) {
        event.preventDefault();
        event.stopPropagation();
        await markAllAsRead();
        return;
      }

      const notificationItem = event.target.closest(
        ".student-notification-item",
      );

      if (notificationItem) {
        event.preventDefault();
        event.stopPropagation();

        const notificationId = notificationItem.dataset.id;
        const redirectUrl = notificationItem.dataset.redirectUrl;

        await markAsRead(notificationId);

        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      }
    });

    loadUnreadCount();
    loadNotifications();

    setInterval(() => {
      loadUnreadCount();
    }, 60000);
  }

  function findBellButton() {
    return (
      document.getElementById("notificationToggleBtn") ||
      document.getElementById("notificationBtn") ||
      document.getElementById("notificationBell") ||
      document.getElementById("dashboardNotificationBtn") ||
      document.querySelector("[data-notification-toggle]") ||
      document.querySelector(".notification-btn") ||
      document.querySelector(".notification-bell")
    );
  }

  function removeOldDropdowns() {
    const oldDropdowns = document.querySelectorAll(
      ".dashboard-notification-dropdown, .notification-dropdown, .notification-menu",
    );

    oldDropdowns.forEach((dropdown) => {
      dropdown.remove();
    });
  }

  function ensureBadge(bellButton) {
    let badge = bellButton.querySelector(".notification-count-badge");

    if (!badge) {
      badge = document.createElement("span");
      badge.className = "notification-count-badge hidden";
      badge.textContent = "0";
      bellButton.appendChild(badge);
    }

    const oldBadge = document.getElementById("notifBadgeDot");

    if (oldBadge && oldBadge !== badge) {
      oldBadge.remove();
    }
  }

  function ensureDropdown() {
    let dropdown = document.getElementById("studentNotificationDropdown");

    if (dropdown) {
      return dropdown;
    }

    dropdown = document.createElement("div");
    dropdown.id = "studentNotificationDropdown";
    dropdown.className = "student-notification-dropdown hidden";

    dropdown.innerHTML = `
            <div class="student-notification-head">
                <div>
                    <h3>Notifications</h3>
                    <p>Latest study reminders and updates</p>
                </div>

                <button class="mark-all-notifications-btn" type="button">
                    Mark all read
                </button>
            </div>

            <div class="student-notification-list" id="studentNotificationList">
                <div class="student-notification-empty">
                    <i class="fa-regular fa-bell"></i>
                    <p>No notifications yet.</p>
                </div>
            </div>
        `;

    document.body.appendChild(dropdown);

    return dropdown;
  }

  async function loadUnreadCount() {
    const bellButton = findBellButton();

    if (!bellButton) return;

    try {
      const data = await apiFetch("/api/notifications/my/unread-count");
      const unreadCount = Number(data?.unreadCount || 0);
      updateBadge(unreadCount);
    } catch (error) {
      console.error("Notification unread count failed:", error);
    }
  }

  async function loadNotifications() {
    try {
      const data = await apiFetch("/api/notifications/my");
      notifications = Array.isArray(data?.notifications)
        ? data.notifications
        : [];
      renderNotifications();
    } catch (error) {
      console.error("Notifications load failed:", error);
      renderErrorState(error.message);
    }
  }

  function updateBadge(count) {
    const bellButton = findBellButton();

    if (!bellButton) return;

    let badge = bellButton.querySelector(".notification-count-badge");

    if (!badge) {
      badge = document.createElement("span");
      badge.className = "notification-count-badge hidden";
      bellButton.appendChild(badge);
    }

    badge.textContent = count > 99 ? "99+" : String(count);
    badge.classList.toggle("hidden", count <= 0);
    bellButton.classList.toggle("has-unread", count > 0);
  }

  function toggleDropdown() {
    if (isDropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function openDropdown() {
    const dropdown = ensureDropdown();
    const bellButton = findBellButton();

    if (!dropdown || !bellButton) return;

    positionDropdown(dropdown, bellButton);

    dropdown.classList.remove("hidden");
    dropdown.classList.add("open");
    isDropdownOpen = true;

    loadNotifications();
    loadUnreadCount();
  }

  function closeDropdown() {
    const dropdown = document.getElementById("studentNotificationDropdown");

    if (!dropdown) return;

    dropdown.classList.add("hidden");
    dropdown.classList.remove("open");
    isDropdownOpen = false;
  }

  function positionDropdown(dropdown, bellButton) {
    const rect = bellButton.getBoundingClientRect();
    const dropdownWidth = 370;
    const viewportGap = 16;

    let right = window.innerWidth - rect.right;
    right = Math.max(viewportGap, right);

    dropdown.style.top = `${rect.bottom + 14}px`;
    dropdown.style.right = `${right}px`;
    dropdown.style.width = `${Math.min(dropdownWidth, window.innerWidth - 24)}px`;
  }

  function renderNotifications() {
    const list = document.getElementById("studentNotificationList");

    if (!list) return;

    if (!notifications.length) {
      list.innerHTML = `
                <div class="student-notification-empty">
                    <i class="fa-regular fa-bell"></i>
                    <p>No notifications yet.</p>
                </div>
            `;
      return;
    }

    list.innerHTML = notifications
      .map((item) => {
        const isUnread = item.read === false || item.read === null;
        const icon = getTypeIcon(item.type);
        const priorityClass = getPriorityClass(item.priority);
        const createdAt = formatDateTime(item.createdAt);

        return `
                    <div
                        class="student-notification-item ${isUnread ? "unread" : ""} ${priorityClass}"
                        data-id="${escapeHtml(item.id)}"
                        data-redirect-url="${escapeHtml(item.redirectUrl || "")}">
                        <div class="student-notification-icon">
                            <i class="fa-solid ${icon}"></i>
                        </div>

                        <div class="student-notification-content">
                            <div class="student-notification-title-row">
                                <h4>${escapeHtml(item.title || "Notification")}</h4>
                                ${isUnread ? `<span class="unread-dot"></span>` : ""}
                            </div>

                            <p>${escapeHtml(item.message || "")}</p>

                            <div class="student-notification-meta">
                                <span>${escapeHtml(item.type || "SYSTEM")}</span>
                                <span>${createdAt}</span>
                            </div>
                        </div>
                    </div>
                `;
      })
      .join("");
  }

  function renderErrorState(message) {
    const list = document.getElementById("studentNotificationList");

    if (!list) return;

    list.innerHTML = `
            <div class="student-notification-empty error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>${escapeHtml(message || "Notifications could not be loaded.")}</p>
            </div>
        `;
  }

  async function markAsRead(notificationId) {
    if (!notificationId) return;

    try {
      await apiFetch(
        `/api/notifications/my/${encodeURIComponent(notificationId)}/read`,
        {
          method: "PUT",
        },
      );

      notifications = notifications.map((item) => {
        if (String(item.id) === String(notificationId)) {
          return {
            ...item,
            read: true,
          };
        }

        return item;
      });

      renderNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error("Mark notification as read failed:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await apiFetch("/api/notifications/my/read-all", {
        method: "PUT",
      });

      notifications = notifications.map((item) => ({
        ...item,
        read: true,
      }));

      renderNotifications();
      updateBadge(0);
    } catch (error) {
      console.error("Mark all notifications as read failed:", error);
    }
  }

  function getTypeIcon(type) {
    const value = String(type || "").toUpperCase();

    if (value === "TASK") return "fa-list-check";
    if (value === "TEST") return "fa-file-pen";
    if (value === "REVISION") return "fa-rotate";
    if (value === "POMODORO") return "fa-clock";
    if (value === "SECURITY") return "fa-shield-halved";
    if (value === "ADMIN_ACTIVITY") return "fa-user-gear";

    return "fa-bell";
  }

  function getPriorityClass(priority) {
    const value = String(priority || "").toUpperCase();

    if (value === "HIGH") return "priority-high";
    if (value === "LOW") return "priority-low";

    return "priority-medium";
  }

  function formatDateTime(value) {
    if (!value) return "Just now";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Just now";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectNotificationStyles() {
    if (document.getElementById("studentNotificationStyles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "studentNotificationStyles";
    style.textContent = `
            .edumind-notification-bell {
                position: relative !important;
            }

            .notification-count-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                min-width: 18px;
                height: 18px;
                padding: 0 5px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: #ef4444;
                color: #ffffff;
                font-size: 10px;
                font-weight: 800;
                line-height: 1;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
                z-index: 5;
            }

            .notification-count-badge.hidden {
                display: none !important;
            }

            .edumind-notification-bell.has-unread {
                box-shadow:
                    0 0 0 1px rgba(34, 211, 238, 0.2),
                    0 0 22px rgba(34, 211, 238, 0.16);
            }

            .dashboard-notification-dropdown,
            .notification-dropdown,
            .notification-menu {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }

            .student-notification-dropdown {
                position: fixed;
                z-index: 999999;
                border-radius: 22px;
                border: 1px solid rgba(34, 211, 238, 0.18);
                background:
                    radial-gradient(circle at top right, rgba(34, 211, 238, 0.12), transparent 34%),
                    rgba(8, 17, 31, 0.96);
                backdrop-filter: blur(18px);
                box-shadow:
                    0 24px 60px rgba(8, 17, 31, 0.34),
                    0 0 28px rgba(34, 211, 238, 0.12);
                overflow: hidden;
                animation: notificationDropdownIn 0.2s ease;
            }

            .student-notification-dropdown.hidden {
                display: none !important;
            }

            .student-notification-dropdown.open {
                display: block !important;
            }

            .student-notification-head {
                padding: 18px;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
                border-bottom: 1px solid rgba(148, 163, 184, 0.14);
            }

            .student-notification-head h3 {
                margin: 0;
                color: #f8fafc;
                font-size: 17px;
                font-weight: 850;
            }

            .student-notification-head p {
                margin: 4px 0 0;
                color: #94a3b8;
                font-size: 12px;
                font-weight: 600;
            }

            .mark-all-notifications-btn {
                border: 1px solid rgba(34, 211, 238, 0.24);
                background: rgba(34, 211, 238, 0.08);
                color: #67e8f9;
                border-radius: 999px;
                padding: 8px 11px;
                font-size: 11px;
                font-weight: 800;
                cursor: pointer;
                white-space: nowrap;
            }

            .mark-all-notifications-btn:hover {
                background: rgba(34, 211, 238, 0.16);
            }

            .student-notification-list {
                max-height: 410px;
                overflow-y: auto;
                padding: 10px;
            }

            .student-notification-item {
                display: flex;
                gap: 12px;
                padding: 13px;
                border-radius: 16px;
                border: 1px solid rgba(148, 163, 184, 0.12);
                background: rgba(15, 23, 42, 0.68);
                cursor: pointer;
                transition: 0.2s ease;
                margin-bottom: 8px;
            }

            .student-notification-item:hover {
                transform: translateY(-2px);
                border-color: rgba(34, 211, 238, 0.28);
                background: rgba(34, 211, 238, 0.08);
            }

            .student-notification-item.unread {
                border-color: rgba(34, 211, 238, 0.32);
                background:
                    radial-gradient(circle at top right, rgba(34, 211, 238, 0.12), transparent 34%),
                    rgba(15, 23, 42, 0.82);
            }

            .student-notification-icon {
                width: 38px;
                height: 38px;
                border-radius: 14px;
                display: grid;
                place-items: center;
                background: rgba(34, 211, 238, 0.12);
                color: #22d3ee;
                flex: 0 0 auto;
            }

            .student-notification-content {
                flex: 1;
                min-width: 0;
            }

            .student-notification-title-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            .student-notification-title-row h4 {
                margin: 0;
                color: #f8fafc;
                font-size: 13px;
                font-weight: 850;
                line-height: 1.4;
            }

            .student-notification-content p {
                margin: 6px 0 8px;
                color: #cbd5e1;
                font-size: 12px;
                font-weight: 600;
                line-height: 1.55;
            }

            .student-notification-meta {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                color: #94a3b8;
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
            }

            .unread-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #22d3ee;
                box-shadow: 0 0 12px rgba(34, 211, 238, 0.7);
                flex: 0 0 auto;
            }

            .student-notification-empty {
                min-height: 170px;
                display: grid;
                place-items: center;
                gap: 8px;
                color: #94a3b8;
                text-align: center;
                font-size: 13px;
                font-weight: 700;
            }

            .student-notification-empty i {
                font-size: 26px;
                color: #22d3ee;
            }

            .student-notification-empty.error i {
                color: #f87171;
            }

            @keyframes notificationDropdownIn {
                from {
                    opacity: 0;
                    transform: translateY(-8px) scale(0.98);
                }

                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            body.light-mode .student-notification-dropdown,
            body:not(.preview-dark):not(.dark-mode) .student-notification-dropdown {
                background:
                    radial-gradient(circle at top right, rgba(6, 182, 212, 0.1), transparent 34%),
                    rgba(255, 255, 255, 0.98);
                border-color: rgba(6, 182, 212, 0.18);
            }

            body.light-mode .student-notification-head h3,
            body:not(.preview-dark):not(.dark-mode) .student-notification-head h3,
            body.light-mode .student-notification-title-row h4,
            body:not(.preview-dark):not(.dark-mode) .student-notification-title-row h4 {
                color: #0f172a;
            }

            body.light-mode .student-notification-content p,
            body:not(.preview-dark):not(.dark-mode) .student-notification-content p {
                color: #475569;
            }

            body.light-mode .student-notification-item,
            body:not(.preview-dark):not(.dark-mode) .student-notification-item {
                background: rgba(248, 250, 252, 0.88);
                border-color: rgba(15, 23, 42, 0.08);
            }

            @media (max-width: 560px) {
                .student-notification-dropdown {
                    left: 12px !important;
                    right: 12px !important;
                    width: auto !important;
                }
            }
        `;

    document.head.appendChild(style);
  }
})();
