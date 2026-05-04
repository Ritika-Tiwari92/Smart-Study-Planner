/* =========================================================
   EduMind AI — Student Sidebar JS
   File: backend/src/main/resources/static/assets/js/sidebar.js

   Purpose:
   - Upgrade existing student sidebar into premium Admin-like sidebar
   - Preserve existing links, IDs, API logic, auth logic, and CRUD logic
   - Add animated EduMind AI polygon/neural logo
   - Add section labels
   - Add profile card from localStorage
   - Handle collapsed desktop sidebar
   - Handle mobile sidebar overlay
   ========================================================= */

(function () {
  "use strict";

  const SIDEBAR_STATE_KEY = "edumind_sidebar";
  const COLLAPSED_CLASS = "sidebar-collapsed";
  const OPEN_CLASS = "sidebar-open";
  const HOVERED_CLASS = "sidebar-hovered";

  const NAV_GROUPS = [
    {
      label: "MAIN",
      pages: ["dashboard.html"]
    },
    {
      label: "CONTENT",
      pages: [
        "planner.html",
        "subjects.html",
        "tasks.html",
        "revision.html",
        "revisions.html",
        "tests.html",
        "pomodoro.html",
        "assistant.html"
      ]
    },
    {
      label: "INSIGHTS",
      pages: ["analytics.html", "settings.html"]
    }
  ];

  const PAGE_LABEL_OVERRIDES = {
    "revision.html": "Revisions",
    "revisions.html": "Revisions",
    "pomodoro.html": "Study Timer"
  };

  const PAGE_ICON_OVERRIDES = {
    "dashboard.html": "fa-solid fa-table-cells-large",
    "planner.html": "fa-regular fa-calendar",
    "subjects.html": "fa-solid fa-book-open",
    "tasks.html": "fa-regular fa-square-check",
    "revision.html": "fa-solid fa-arrows-rotate",
    "revisions.html": "fa-solid fa-arrows-rotate",
    "tests.html": "fa-regular fa-file-lines",
    "pomodoro.html": "fa-regular fa-clock",
    "assistant.html": "fa-solid fa-robot",
    "analytics.html": "fa-solid fa-chart-line",
    "settings.html": "fa-solid fa-gear"
  };

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function isMobile() {
    return window.innerWidth <= 900;
  }

  function getSidebar() {
    return qs(".sidebar");
  }

  function getSidebarTop() {
    return qs(".sidebar .sidebar-top");
  }

  function getSidebarNav() {
    return qs(".sidebar .sidebar-nav");
  }

  function getSidebarBottom() {
    return qs(".sidebar .sidebar-bottom");
  }

  function getPageNameFromHref(href) {
    if (!href) return "";

    try {
      const cleanHref = href.split("?")[0].split("#")[0];
      const parts = cleanHref.split("/");
      return parts[parts.length - 1].toLowerCase();
    } catch (error) {
      return href.toLowerCase();
    }
  }

  function getCurrentPageName() {
    const path = window.location.pathname || "";
    const parts = path.split("/");
    return (parts[parts.length - 1] || "").toLowerCase();
  }

  function getLogoSvg() {
    return `
      <span class="brand-mark" aria-hidden="true">
        <svg class="edumind-network-logo" viewBox="0 0 64 64" role="img" focusable="false">
          <polygon class="network-ring" points="32,5 55,18 55,46 32,59 9,46 9,18"></polygon>

          <line class="network-line" x1="20" y1="21" x2="32" y2="13"></line>
          <line class="network-line" x1="32" y1="13" x2="45" y2="24"></line>
          <line class="network-line" x1="45" y1="24" x2="42" y2="43"></line>
          <line class="network-line" x1="42" y1="43" x2="23" y2="45"></line>
          <line class="network-line" x1="23" y1="45" x2="20" y2="21"></line>
          <line class="network-line" x1="20" y1="21" x2="42" y2="43"></line>
          <line class="network-line" x1="45" y1="24" x2="23" y2="45"></line>

          <circle class="network-node" cx="20" cy="21" r="3.3"></circle>
          <circle class="network-node" cx="32" cy="13" r="3.3"></circle>
          <circle class="network-node" cx="45" cy="24" r="3.3"></circle>
          <circle class="network-node" cx="42" cy="43" r="3.3"></circle>
          <circle class="network-node" cx="23" cy="45" r="3.3"></circle>
          <circle class="network-core" cx="32" cy="32" r="4.2"></circle>
        </svg>
      </span>
    `;
  }

  function upgradeBrand() {
    const sidebarTop = getSidebarTop();

    if (!sidebarTop) {
      console.warn("EduMind Sidebar: .sidebar-top not found.");
      return;
    }

    let logo = qs(".sidebar-logo", sidebarTop);

    if (!logo) {
      logo = document.createElement("h2");
      logo.className = "sidebar-logo";
      sidebarTop.prepend(logo);
    }

    logo.classList.add("student-brand");
    logo.innerHTML = `
      ${getLogoSvg()}
      <span class="brand-copy">
        <span class="brand-title">EduMind AI</span>
        <span class="brand-subtitle">Student Panel</span>
      </span>
    `;
  }

  function injectDesktopHamburger() {
    const sidebarTop = getSidebarTop();

    if (!sidebarTop) {
      console.warn("EduMind Sidebar: .sidebar-top not found. Hamburger not injected.");
      return;
    }

    let btn = document.getElementById("hamburgerBtn");

    if (!btn) {
      btn = document.createElement("button");
      btn.id = "hamburgerBtn";
      btn.className = "hamburger-btn";
      btn.type = "button";
      btn.setAttribute("aria-label", "Toggle sidebar");
      btn.setAttribute("title", "Toggle sidebar");
      btn.innerHTML = `
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      `;
    }

    if (!sidebarTop.contains(btn)) {
      sidebarTop.appendChild(btn);
    }
  }

  function injectMobileTrigger() {
    let mobileBtn = document.getElementById("mobileSidebarBtn");

    if (mobileBtn) return;

    mobileBtn = document.createElement("button");
    mobileBtn.id = "mobileSidebarBtn";
    mobileBtn.className = "sidebar-mobile-trigger";
    mobileBtn.type = "button";
    mobileBtn.setAttribute("aria-label", "Open sidebar");
    mobileBtn.setAttribute("title", "Open sidebar");
    mobileBtn.innerHTML = `
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    `;

    document.body.appendChild(mobileBtn);
  }

  function injectOverlay() {
    if (document.getElementById("sidebarOverlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.id = "sidebarOverlay";
    overlay.setAttribute("aria-hidden", "true");

    document.body.appendChild(overlay);
  }

  function normalizeNavItem(item) {
    const href = item.getAttribute("href") || "";
    const pageName = getPageNameFromHref(href);

    item.classList.add("nav-item");

    const icon = qs("i", item);
    const span = qs("span", item);

    if (icon && PAGE_ICON_OVERRIDES[pageName]) {
      icon.className = PAGE_ICON_OVERRIDES[pageName];
    }

    if (span && PAGE_LABEL_OVERRIDES[pageName]) {
      span.textContent = PAGE_LABEL_OVERRIDES[pageName];
    }

    const labelText = span ? span.textContent.trim() : item.textContent.trim();
    if (labelText) {
      item.dataset.tooltip = labelText;
      item.setAttribute("aria-label", labelText);
    }

    return item;
  }

  function enhanceNavSections() {
    const nav = getSidebarNav();

    if (!nav) {
      console.warn("EduMind Sidebar: .sidebar-nav not found.");
      return;
    }

    const existingItems = qsa(".nav-item", nav);

    if (!existingItems.length) {
      console.warn("EduMind Sidebar: No .nav-item found inside .sidebar-nav.");
      return;
    }

    const itemMap = new Map();

    existingItems.forEach((item) => {
      const pageName = getPageNameFromHref(item.getAttribute("href"));
      if (pageName) {
        itemMap.set(pageName, normalizeNavItem(item));
      }
    });

    const fragment = document.createDocumentFragment();
    const usedItems = new Set();

    NAV_GROUPS.forEach((group) => {
      const availableItems = group.pages
        .map((page) => itemMap.get(page))
        .filter(Boolean);

      if (!availableItems.length) return;

      const label = document.createElement("div");
      label.className = "nav-section-label";
      label.textContent = group.label;
      fragment.appendChild(label);

      availableItems.forEach((item) => {
        usedItems.add(item);
        fragment.appendChild(item);
      });
    });

    existingItems.forEach((item) => {
      if (!usedItems.has(item)) {
        if (!fragment.querySelector?.(".nav-section-label[data-extra='true']")) {
          const label = document.createElement("div");
          label.className = "nav-section-label";
          label.dataset.extra = "true";
          label.textContent = "MORE";
          fragment.appendChild(label);
        }
        fragment.appendChild(item);
      }
    });

    nav.replaceChildren(fragment);
    markActiveNavItem();
  }

  function markActiveNavItem() {
    const currentPage = getCurrentPageName();
    const navItems = qsa(".sidebar .nav-item");

    if (!navItems.length) return;

    let matched = false;

    navItems.forEach((item) => {
      const pageName = getPageNameFromHref(item.getAttribute("href"));
      const isRevisionMatch =
        (currentPage === "revision.html" || currentPage === "revisions.html") &&
        (pageName === "revision.html" || pageName === "revisions.html");

      const isActive = pageName === currentPage || isRevisionMatch;

      item.classList.toggle("active", isActive);

      if (isActive) {
        item.setAttribute("aria-current", "page");
        matched = true;
      } else {
        item.removeAttribute("aria-current");
      }
    });

    if (!matched) {
      const existingActive = qs(".sidebar .nav-item.active");
      if (existingActive) {
        existingActive.setAttribute("aria-current", "page");
      }
    }
  }

  function safeJsonParse(value) {
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function getStoredStudent() {
    const possibleKeys = [
      "edumind_logged_in_user",
      "loggedInUser",
      "user",
      "student",
      "currentUser"
    ];

    for (const key of possibleKeys) {
      const parsed = safeJsonParse(localStorage.getItem(key));
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }

    return null;
  }

  function getStudentName(student) {
    if (!student) return "Student";

    return (
      student.name ||
      student.fullName ||
      student.username ||
      student.studentName ||
      student.firstName ||
      (student.email ? student.email.split("@")[0] : "") ||
      "Student"
    );
  }

  function getStudentRole(student) {
    if (!student) return "Student";

    return (
      student.course ||
      student.program ||
      student.role ||
      student.userRole ||
      "Student"
    );
  }

  function getInitials(name) {
    if (!name) return "S";

    const cleanName = String(name).trim();
    if (!cleanName) return "S";

    const parts = cleanName.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }

  function enhanceProfileCard() {
    let bottom = getSidebarBottom();

    if (!bottom) {
      const sidebar = getSidebar();
      if (!sidebar) return;

      bottom = document.createElement("div");
      bottom.className = "sidebar-bottom";
      sidebar.appendChild(bottom);
    }

    let logoutBtn = qs("#logoutBtn", bottom) || qs(".logout-btn", bottom);

    if (!logoutBtn) {
      logoutBtn = document.createElement("a");
      logoutBtn.href = "login.html";
      logoutBtn.id = "logoutBtn";
      logoutBtn.className = "logout-btn";
      logoutBtn.innerHTML = `
        <i class="fa-solid fa-right-from-bracket"></i>
        <span>Logout</span>
      `;
      bottom.appendChild(logoutBtn);
    } else {
      logoutBtn.classList.add("logout-btn");
      logoutBtn.dataset.tooltip = "Logout";

      if (!qs("i", logoutBtn)) {
        logoutBtn.insertAdjacentHTML("afterbegin", `<i class="fa-solid fa-right-from-bracket"></i>`);
      }

      if (!qs("span", logoutBtn)) {
        const text = logoutBtn.textContent.trim() || "Logout";
        logoutBtn.innerHTML = `
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>${text}</span>
        `;
      }
    }

    const student = getStoredStudent();
    const name = getStudentName(student);
    const role = getStudentRole(student);
    const initials = getInitials(name);

    let profileCard = qs(".student-profile-card", bottom);

    if (!profileCard) {
      profileCard = document.createElement("div");
      profileCard.className = "student-profile-card";
      profileCard.setAttribute("aria-label", "Student profile");
      bottom.insertBefore(profileCard, logoutBtn);
    }

    profileCard.innerHTML = "";

    const avatar = document.createElement("div");
    avatar.className = "profile-avatar";
    avatar.textContent = initials;

    const info = document.createElement("div");
    info.className = "profile-info";

    const profileName = document.createElement("div");
    profileName.className = "profile-name";
    profileName.textContent = name;

    const profileRole = document.createElement("div");
    profileRole.className = "profile-role";
    profileRole.textContent = String(role).toLowerCase() === "student" ? "Student" : role;

    info.appendChild(profileName);
    info.appendChild(profileRole);

    profileCard.appendChild(avatar);
    profileCard.appendChild(info);
  }

  function addTooltips() {
    qsa(".sidebar .nav-item, .sidebar .logout-btn").forEach((item) => {
      const span = qs("span", item);
      const label = span ? span.textContent.trim() : item.textContent.trim();

      if (label) {
        item.dataset.tooltip = label;
      }
    });
  }

  function openSidebar() {
    document.body.classList.add(OPEN_CLASS);
    const mobileBtn = document.getElementById("mobileSidebarBtn");
    if (mobileBtn) mobileBtn.setAttribute("aria-label", "Close sidebar");
  }

  function closeSidebar() {
    document.body.classList.remove(OPEN_CLASS);
    const mobileBtn = document.getElementById("mobileSidebarBtn");
    if (mobileBtn) mobileBtn.setAttribute("aria-label", "Open sidebar");
  }

  function collapseSidebar() {
    document.body.classList.add(COLLAPSED_CLASS);
    localStorage.setItem(SIDEBAR_STATE_KEY, "collapsed");
  }

  function expandSidebar() {
    document.body.classList.remove(COLLAPSED_CLASS);
    document.body.classList.remove(HOVERED_CLASS);
    localStorage.setItem(SIDEBAR_STATE_KEY, "expanded");
  }

  function handleToggle() {
    if (isMobile()) {
      if (document.body.classList.contains(OPEN_CLASS)) {
        closeSidebar();
      } else {
        openSidebar();
      }
      return;
    }

    if (document.body.classList.contains(COLLAPSED_CLASS)) {
      expandSidebar();
    } else {
      collapseSidebar();
    }
  }

  function restoreState() {
    if (isMobile()) {
      document.body.classList.remove(COLLAPSED_CLASS);
      document.body.classList.remove(HOVERED_CLASS);
      return;
    }

    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);

    if (savedState === "collapsed") {
      document.body.classList.add(COLLAPSED_CLASS);
    } else {
      document.body.classList.remove(COLLAPSED_CLASS);
    }
  }

  function bindSidebarHover() {
    const sidebar = getSidebar();

    if (!sidebar || sidebar.dataset.hoverBound === "true") return;

    sidebar.addEventListener("mouseenter", () => {
      if (!isMobile() && document.body.classList.contains(COLLAPSED_CLASS)) {
        document.body.classList.add(HOVERED_CLASS);
      }
    });

    sidebar.addEventListener("mouseleave", () => {
      if (!isMobile()) {
        document.body.classList.remove(HOVERED_CLASS);
      }
    });

    sidebar.dataset.hoverBound = "true";
  }

  function bindEvents() {
    const desktopBtn = document.getElementById("hamburgerBtn");
    const mobileBtn = document.getElementById("mobileSidebarBtn");
    const overlay = document.getElementById("sidebarOverlay");

    if (desktopBtn && desktopBtn.dataset.bound !== "true") {
      desktopBtn.addEventListener("click", handleToggle);
      desktopBtn.dataset.bound = "true";
    }

    if (mobileBtn && mobileBtn.dataset.bound !== "true") {
      mobileBtn.addEventListener("click", handleToggle);
      mobileBtn.dataset.bound = "true";
    }

    if (overlay && overlay.dataset.bound !== "true") {
      overlay.addEventListener("click", closeSidebar);
      overlay.dataset.bound = "true";
    }

    qsa(".sidebar .nav-item").forEach((item) => {
      if (item.dataset.mobileCloseBound === "true") return;

      item.addEventListener("click", () => {
        if (isMobile()) closeSidebar();
      });

      item.dataset.mobileCloseBound = "true";
    });

    if (document.body.dataset.sidebarEscBound !== "true") {
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeSidebar();
        }
      });

      document.body.dataset.sidebarEscBound = "true";
    }

    if (window.__edumindSidebarResizeBound !== true) {
      window.addEventListener("resize", () => {
        if (!isMobile()) {
          closeSidebar();
          restoreState();
        } else {
          document.body.classList.remove(COLLAPSED_CLASS);
          document.body.classList.remove(HOVERED_CLASS);
        }
      });

      window.__edumindSidebarResizeBound = true;
    }
  }

  function init() {
    const sidebar = getSidebar();

    if (!sidebar) {
      console.warn("EduMind Sidebar: .sidebar not found on this page.");
      return;
    }

    upgradeBrand();
    injectDesktopHamburger();
    injectMobileTrigger();
    injectOverlay();
    enhanceNavSections();
    enhanceProfileCard();
    addTooltips();
    restoreState();
    bindEvents();
    bindSidebarHover();
    markActiveNavItem();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();