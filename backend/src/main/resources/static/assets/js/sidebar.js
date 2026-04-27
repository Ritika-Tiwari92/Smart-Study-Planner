/* =============================================
   SIDEBAR.JS — Single hamburger, top-left only
   Include after theme.js in every dashboard page
   ============================================= */

(function () {

  // ─── Create single hamburger button ──────────────────────
  function injectHamburger() {
  const sidebarTop = document.querySelector(".sidebar .sidebar-top");

  if (!sidebarTop) {
    console.warn("Sidebar top not found. Hamburger not injected.");
    return;
  }

  let btn = document.getElementById("hamburgerBtn");

  if (!btn) {
    btn = document.createElement("button");
    btn.id = "hamburgerBtn";
    btn.className = "hamburger-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle Sidebar");
    btn.innerHTML = `
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    `;
  }

  sidebarTop.appendChild(btn);
}

  // ─── Create overlay ───────────────────────────────────────
  function injectOverlay() {
    if (document.getElementById("sidebarOverlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.id = "sidebarOverlay";
    document.body.appendChild(overlay);
  }

  // ─── Add tooltips to nav items (collapsed desktop) ───────
  function addTooltips() {
    document.querySelectorAll(".sidebar .nav-item").forEach(item => {
      const span = item.querySelector("span");
      if (span && !item.dataset.tooltip) {
        item.dataset.tooltip = span.textContent.trim();
      }
    });
  }

  // ─── State helpers ────────────────────────────────────────
  function isMobile() {
    return window.innerWidth <= 900;
  }

  function openSidebar() {
    document.body.classList.add("sidebar-open");
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
  }

  function collapseSidebar() {
    document.body.classList.add("sidebar-collapsed");
    localStorage.setItem("edumind_sidebar", "collapsed");
  }

  function expandSidebar() {
    document.body.classList.remove("sidebar-collapsed");
    localStorage.setItem("edumind_sidebar", "expanded");
  }

  function handleToggle() {
    if (isMobile()) {
      document.body.classList.contains("sidebar-open")
        ? closeSidebar()
        : openSidebar();
    } else {
      document.body.classList.contains("sidebar-collapsed")
        ? expandSidebar()
        : collapseSidebar();
    }
  }

  // ─── Restore saved state ──────────────────────────────────
  function restoreState() {
    if (isMobile()) return;
    if (localStorage.getItem("edumind_sidebar") === "collapsed") {
      document.body.classList.add("sidebar-collapsed");
    }
  }


  function bindSidebarHover() {
  const sidebar = document.querySelector(".sidebar");

  if (!sidebar) return;

  sidebar.addEventListener("mouseenter", () => {
    if (!isMobile() && document.body.classList.contains("sidebar-collapsed")) {
      document.body.classList.add("sidebar-hovered");
    }
  });

  sidebar.addEventListener("mouseleave", () => {
    if (!isMobile()) {
      document.body.classList.remove("sidebar-hovered");
    }
  });
}
  // ─── Bind events ─────────────────────────────────────────
  function bindEvents() {
    // Hamburger click
    document.getElementById("hamburgerBtn")
      ?.addEventListener("click", handleToggle);

    // Overlay click — close on mobile
    document.getElementById("sidebarOverlay")
      ?.addEventListener("click", closeSidebar);

    // Nav item click on mobile — auto close
    document.querySelectorAll(".sidebar .nav-item").forEach(item => {
      item.addEventListener("click", () => {
        if (isMobile()) closeSidebar();
      });
    });

    // ESC key
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeSidebar();
    });

    // Resize — clean up classes
    window.addEventListener("resize", () => {
      if (!isMobile()) {
        document.body.classList.remove("sidebar-open");
      } else {
        document.body.classList.remove("sidebar-collapsed");
      }
    });
  }

  // ─── INIT ────────────────────────────────────────────────
  function init() {
    injectHamburger();
    injectOverlay();
    addTooltips();
    restoreState();
    bindEvents();
    bindSidebarHover();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();