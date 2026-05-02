/* ═══════════════════════════════════════════════
   EduMind AI — Admin Sidebar JS
   File: admin-sidebar.js

   Cleaned + Fixed:
   - Sidebar HTML injects correctly
   - Old admin-users.html link auto-fixed to admin-students.html
   - Active nav works for both admin-users/admin-students alias
   - Admin info loads from localStorage
   - Student count badge uses adminToken OR token
   - Logout clears all admin/common auth keys
   - Toast message shown on important errors/actions
═══════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ─────────────────────────────────────────────
     1. Load sidebar HTML into placeholder
  ───────────────────────────────────────────── */

  const placeholder = document.getElementById("sidebar-placeholder");

  if (!placeholder) {
    console.warn("[EduMind Sidebar] #sidebar-placeholder not found.");
    return;
  }

  const scriptEl =
    document.currentScript ||
    (function () {
      const scripts = document.querySelectorAll('script[src*="admin-sidebar"]');
      return scripts[scripts.length - 1];
    })();

  const scriptSrc = scriptEl ? scriptEl.getAttribute("src") : "admin-sidebar.js";
  const basePath = scriptSrc.replace("admin-sidebar.js", "");
  const sidebarURL = basePath + "admin-sidebar.html";

  fetch(sidebarURL)
    .then(function (res) {
      if (!res.ok) {
        throw new Error("Sidebar fetch failed: " + res.status);
      }

      return res.text();
    })
    .then(function (html) {
      placeholder.innerHTML = html;

      fixOldStudentLinks();
      initSidebar();
    })
    .catch(function (err) {
      console.error("[EduMind Sidebar]", err);
      showSidebarToast("error", "Sidebar could not be loaded. Please check admin-sidebar.html.");
    });

  /* ─────────────────────────────────────────────
     2. Init — runs after HTML is injected
  ───────────────────────────────────────────── */

  function initSidebar() {
    const sidebar = document.getElementById("emSidebar");
    const overlay = document.getElementById("emOverlay");
    const collapseBtn = document.getElementById("emCollapseBtn");
    const hamburger = document.getElementById("emHamburger");
    const logoutBtn = document.getElementById("emLogoutBtn");

    if (!sidebar) {
      console.warn("[EduMind Sidebar] #emSidebar not found inside admin-sidebar.html.");
      showSidebarToast("error", "Sidebar markup is missing. Please check admin-sidebar.html.");
      return;
    }

    document.body.classList.add("em-has-sidebar");

    const savedCollapsed = localStorage.getItem("emSbCollapsed") === "true";

    if (savedCollapsed && window.innerWidth > 768) {
      sidebar.classList.add("em-collapsed");
      document.body.classList.add("em-sb-collapsed");
    }

    setActiveNav();
    setAdminInfo();
    addTooltips();
    loadStudentCount();

    if (collapseBtn) {
      collapseBtn.addEventListener("click", toggleCollapse);
    }

    if (hamburger) {
      hamburger.addEventListener("click", openMobile);
    }

    if (overlay) {
      overlay.addEventListener("click", closeMobile);
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMobile();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 768) {
        closeMobile();
      }
    });
  }

  /* ─────────────────────────────────────────────
     3. Fix old Students link
     If sidebar HTML still has admin-users.html,
     convert it to admin-students.html automatically.
  ───────────────────────────────────────────── */

  function fixOldStudentLinks() {
    const studentSelectors = [
      'a[href="admin-users.html"]',
      'a[href="./admin-users.html"]',
      'a[href="/pages/admin/admin-users.html"]'
    ];

    studentSelectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (link) {
        link.setAttribute("href", "admin-students.html");

        if (link.getAttribute("data-page") === "admin-users") {
          link.setAttribute("data-page", "admin-students");
        }
      });
    });

    document.querySelectorAll(".em-nav-item[data-page='admin-users']").forEach(function (item) {
      item.setAttribute("data-page", "admin-students");
      item.setAttribute("href", "admin-students.html");
    });
  }

  /* ─────────────────────────────────────────────
     4. Active nav detection
  ───────────────────────────────────────────── */

  function getCurrentPageKey() {
    const currentPage = window.location.pathname
      .split("/")
      .pop()
      .replace(".html", "");

    if (currentPage === "admin-users") {
      return "admin-students";
    }

    return currentPage;
  }

  function setActiveNav() {
    const currentPage = getCurrentPageKey();
    const navItems = document.querySelectorAll(".em-nav-item[data-page]");

    navItems.forEach(function (item) {
      const itemPage = item.getAttribute("data-page") === "admin-users"
        ? "admin-students"
        : item.getAttribute("data-page");

      item.classList.remove("em-active");

      if (itemPage === currentPage) {
        item.classList.add("em-active");
      }
    });
  }

  /* ─────────────────────────────────────────────
     5. Tooltips for collapsed mode
  ───────────────────────────────────────────── */

  function addTooltips() {
    const navItems = document.querySelectorAll(".em-nav-item");

    navItems.forEach(function (item) {
      const textEl = item.querySelector(".em-nav-text");

      if (textEl && !item.getAttribute("data-tooltip")) {
        item.setAttribute("data-tooltip", textEl.textContent.trim());
      }
    });
  }

  /* ─────────────────────────────────────────────
     6. Desktop collapse toggle
  ───────────────────────────────────────────── */

  function toggleCollapse() {
    const sidebar = document.getElementById("emSidebar");

    if (!sidebar) {
      showSidebarToast("error", "Sidebar not found.");
      return;
    }

    const isCollapsed = sidebar.classList.toggle("em-collapsed");

    document.body.classList.toggle("em-sb-collapsed", isCollapsed);
    localStorage.setItem("emSbCollapsed", String(isCollapsed));
  }

  /* ─────────────────────────────────────────────
     7. Mobile open / close
  ───────────────────────────────────────────── */

  function openMobile() {
    const sidebar = document.getElementById("emSidebar");
    const overlay = document.getElementById("emOverlay");
    const hamburger = document.getElementById("emHamburger");

    if (sidebar) {
      sidebar.classList.add("em-mobile-open");
    }

    if (overlay) {
      overlay.classList.add("em-show");
    }

    if (hamburger) {
      hamburger.classList.add("em-open");
    }

    document.body.style.overflow = "hidden";
  }

  function closeMobile() {
    const sidebar = document.getElementById("emSidebar");
    const overlay = document.getElementById("emOverlay");
    const hamburger = document.getElementById("emHamburger");

    if (sidebar) {
      sidebar.classList.remove("em-mobile-open");
    }

    if (overlay) {
      overlay.classList.remove("em-show");
    }

    if (hamburger) {
      hamburger.classList.remove("em-open");
    }

    document.body.style.overflow = "";
  }

  window.emOpenSidebar = openMobile;
  window.emCloseSidebar = closeMobile;

  /* ─────────────────────────────────────────────
     8. Admin info from localStorage
  ───────────────────────────────────────────── */

  function setAdminInfo() {
    const name =
      localStorage.getItem("adminName") ||
      localStorage.getItem("userName") ||
      "Admin";

    const nameEl = document.getElementById("emAdminName");
    const avatarEl = document.getElementById("emAvatar");

    if (nameEl) {
      nameEl.textContent = name;
    }

    if (avatarEl) {
      avatarEl.textContent = name.charAt(0).toUpperCase();
    }
  }

  /* ─────────────────────────────────────────────
     9. Student count badge
  ───────────────────────────────────────────── */

  function getAdminToken() {
    return localStorage.getItem("adminToken") || localStorage.getItem("token");
  }

  function loadStudentCount() {
    const badgeEl = document.getElementById("sbStudentCount");

    if (!badgeEl) return;

    const token = getAdminToken();

    if (!token) {
      badgeEl.textContent = "–";
      return;
    }

    const API_BASE = window.EM_API_BASE || "http://localhost:8080";

    fetch(API_BASE + "/api/admin/dashboard-summary", {
      headers: {
        Authorization: "Bearer " + token
      }
    })
      .then(function (res) {
        if (res.status === 401 || res.status === 403) {
          badgeEl.textContent = "!";
          return null;
        }

        return res.json();
      })
      .then(function (data) {
        if (!data) return;

        if (data.totalStudents !== undefined) {
          badgeEl.textContent = data.totalStudents;
        } else {
          badgeEl.textContent = "0";
        }
      })
      .catch(function () {
        badgeEl.textContent = "–";
      });
  }

  /* ─────────────────────────────────────────────
     10. Logout
  ───────────────────────────────────────────── */

  function handleLogout() {
    if (!confirm("Logout from admin panel?")) return;

    clearAdminSession();
    showSidebarToast("success", "Logged out successfully.");

    setTimeout(function () {
      window.location.href = "admin-login.html";
    }, 600);
  }

  function clearAdminSession() {
    [
      "adminToken",
      "adminRole",
      "adminName",
      "adminEmail",
      "token",
      "refreshToken",
      "userRole",
      "userId",
      "userEmail",
      "userName",
      "edumind_logged_in_user",
      "edumind_is_logged_in"
    ].forEach(function (key) {
      localStorage.removeItem(key);
    });
  }

  /* ─────────────────────────────────────────────
     11. Toast helper
  ───────────────────────────────────────────── */

  function showSidebarToast(type, message) {
    const oldToast = document.querySelector(".em-sidebar-toast");

    if (oldToast) {
      oldToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = "em-sidebar-toast " + type;

    const iconClass = type === "success"
      ? "fa-circle-check"
      : type === "info"
        ? "fa-circle-info"
        : "fa-circle-xmark";

    toast.innerHTML = `
      <i class="fas ${iconClass}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    document.body.appendChild(toast);
    injectToastStyle();

    setTimeout(function () {
      toast.remove();
    }, 3200);
  }

  function injectToastStyle() {
    if (document.getElementById("emSidebarToastStyle")) return;

    const style = document.createElement("style");
    style.id = "emSidebarToastStyle";

    style.textContent = `
      .em-sidebar-toast {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 9px;
        max-width: 360px;
        padding: 12px 16px;
        border-radius: 12px;
        font-family: "Poppins", sans-serif;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
        animation: emSidebarToastIn 0.25s ease;
      }

      .em-sidebar-toast.success {
        background: #065f46;
        border: 1px solid rgba(52, 211, 153, 0.32);
        color: #6ee7b7;
      }

      .em-sidebar-toast.error {
        background: #7f1d1d;
        border: 1px solid rgba(248, 113, 113, 0.32);
        color: #fca5a5;
      }

      .em-sidebar-toast.info {
        background: #164e63;
        border: 1px solid rgba(34, 211, 238, 0.32);
        color: #67e8f9;
      }

      @keyframes emSidebarToastIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }

        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();