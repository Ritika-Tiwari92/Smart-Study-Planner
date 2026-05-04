/* =====================================================
   EduMind AI — Student Theme + Header Profile Controller
   File: backend/src/main/resources/static/assets/js/theme.js

   Works with:
   - body.preview-dark
   - body.dark-mode
   - html[data-theme="light"]
   - html[data-theme="dark"]

   Keeps:
   - profile image sync
   - profile dropdown behavior
   - theme preference in localStorage
   - existing logout links behavior
===================================================== */

(function () {
  "use strict";

  const THEME_STORAGE_KEY = "edumind_theme";
  const DEFAULT_THEME = "light";

  const DEFAULT_PROFILE_IMAGE = "../assets/avatar/default-user.png";
  const LEGACY_PROFILE_PHOTO_STORAGE_KEY = "edumind_profile_photo";

  function normalizeTheme(theme) {
    return theme === "dark" ? "dark" : "light";
  }

  function getSavedTheme() {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME);
  }

  function getCurrentTheme() {
    if (document.body?.classList.contains("preview-dark")) {
      return "dark";
    }

    const htmlTheme = document.documentElement.getAttribute("data-theme");
    return normalizeTheme(htmlTheme || getSavedTheme());
  }

  function updateThemeButtons(theme) {
    const buttons = document.querySelectorAll(
      "#themeToggleBtn, .theme-toggle-btn, [data-theme-toggle]"
    );

    buttons.forEach((button) => {
      let icon = button.querySelector("i");

      if (!icon) {
        icon = document.createElement("i");
        button.appendChild(icon);
      }

      if (theme === "dark") {
        icon.className = "fa-solid fa-sun";
        button.setAttribute("aria-label", "Switch to light mode");
        button.setAttribute("title", "Switch to light mode");
      } else {
        icon.className = "fa-solid fa-moon";
        button.setAttribute("aria-label", "Switch to dark mode");
        button.setAttribute("title", "Switch to dark mode");
      }

      button.setAttribute("data-current-theme", theme);
    });
  }

  function applyTheme(theme, options = {}) {
    const selectedTheme = normalizeTheme(theme);
    const shouldPersist = options.persist !== false;

    document.documentElement.setAttribute("data-theme", selectedTheme);
    document.documentElement.style.colorScheme = selectedTheme;

    if (document.body) {
      document.body.classList.toggle("preview-dark", selectedTheme === "dark");
      document.body.classList.toggle("dark-mode", selectedTheme === "dark");
      document.body.classList.toggle("light-mode", selectedTheme === "light");
    }

    if (shouldPersist) {
      localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
    }

    updateThemeButtons(selectedTheme);

    document.dispatchEvent(
      new CustomEvent("edumind:themeChanged", {
        detail: { theme: selectedTheme }
      })
    );
  }

  function addThemeSpin(button) {
    button.classList.remove("theme-spin");

    void button.offsetWidth;

    button.classList.add("theme-spin");

    window.setTimeout(() => {
      button.classList.remove("theme-spin");
    }, 600);
  }

  function bindThemeToggle() {
    const buttons = document.querySelectorAll(
      "#themeToggleBtn, .theme-toggle-btn, [data-theme-toggle]"
    );

    buttons.forEach((button) => {
      if (button.dataset.themeBound === "true") return;

      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        applyTheme(newTheme, { persist: true });
        addThemeSpin(button);
      });

      button.dataset.themeBound = "true";
    });
  }

  function safeJsonParse(value) {
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch (error) {
      console.error("Failed to parse localStorage JSON:", error);
      return null;
    }
  }

  function getLoggedInUser() {
    return safeJsonParse(localStorage.getItem("edumind_logged_in_user"));
  }

  function getProfilePhotoStorageKey(user = getLoggedInUser()) {
    if (user && user.id) {
      return `edumind_profile_photo_${user.id}`;
    }

    return LEGACY_PROFILE_PHOTO_STORAGE_KEY;
  }

  function getSavedProfilePhoto(user = getLoggedInUser()) {
    const userSpecificKey = getProfilePhotoStorageKey(user);
    const userSpecificPhoto = localStorage.getItem(userSpecificKey);

    if (userSpecificPhoto && userSpecificPhoto.trim() !== "") {
      return userSpecificPhoto;
    }

    const legacyPhoto = localStorage.getItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY);

    if (legacyPhoto && legacyPhoto.trim() !== "") {
      return legacyPhoto;
    }

    return "";
  }

  function applyProfilePhoto() {
    const loggedInUser = getLoggedInUser();
    const savedPhoto = getSavedProfilePhoto(loggedInUser) || DEFAULT_PROFILE_IMAGE;

    const headerImageById = document.getElementById("headerProfileImage");

    if (headerImageById) {
      headerImageById.src = savedPhoto;
      headerImageById.onerror = function () {
        headerImageById.src = DEFAULT_PROFILE_IMAGE;
      };
    }

    const profileMenuToggle = document.getElementById("profileMenuToggle");
    const profileToggleImage = profileMenuToggle?.querySelector("img");

    if (profileToggleImage) {
      profileToggleImage.src = savedPhoto;
      profileToggleImage.onerror = function () {
        profileToggleImage.src = DEFAULT_PROFILE_IMAGE;
      };
    }
  }

  function populateProfileMini() {
    const loggedInUser = getLoggedInUser();
    const profileMenuToggle = document.getElementById("profileMenuToggle");

    if (!loggedInUser || !profileMenuToggle) {
      applyProfilePhoto();
      return;
    }

    const nameElement = profileMenuToggle.querySelector("h4");
    const subtitleElement = profileMenuToggle.querySelector("p");

    if (nameElement) {
      nameElement.textContent =
        loggedInUser.fullName ||
        loggedInUser.name ||
        loggedInUser.username ||
        "Student";
    }

    if (subtitleElement) {
      subtitleElement.textContent =
        loggedInUser.course ||
        loggedInUser.role ||
        "Student";
    }

    applyProfilePhoto();
  }

  function closeProfileDropdown() {
    const dashboardProfileDropdown = document.getElementById(
      "dashboardProfileDropdown"
    );

    dashboardProfileDropdown?.classList.add("hidden");
  }

  function toggleProfileDropdown() {
    const dashboardProfileDropdown = document.getElementById(
      "dashboardProfileDropdown"
    );

    if (!dashboardProfileDropdown) return;

    dashboardProfileDropdown.classList.toggle("hidden");
  }

  function bindProfileDropdown() {
    const profileMenuToggle = document.getElementById("profileMenuToggle");
    const dashboardProfileDropdown = document.getElementById(
      "dashboardProfileDropdown"
    );

    if (!profileMenuToggle || !dashboardProfileDropdown) return;
    if (profileMenuToggle.dataset.profileBound === "true") return;

    profileMenuToggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      toggleProfileDropdown();
    });

    dashboardProfileDropdown.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    document.addEventListener("click", function (event) {
      const clickedInsideToggle = profileMenuToggle.contains(event.target);
      const clickedInsideDropdown = dashboardProfileDropdown.contains(event.target);

      if (!clickedInsideToggle && !clickedInsideDropdown) {
        closeProfileDropdown();
      }
    });

    document.addEventListener("dashboard:closeProfileMenu", function () {
      closeProfileDropdown();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeProfileDropdown();
      }
    });

    profileMenuToggle.dataset.profileBound = "true";
  }

  function bindProfileMenuLinks() {
    const profileMenuLinks = document.querySelectorAll(
      ".dashboard-profile-dropdown .profile-menu-item"
    );

    profileMenuLinks.forEach((link) => {
      if (link.dataset.profileLinkBound === "true") return;

      link.addEventListener("click", function (event) {
        const targetUrl = link.getAttribute("href");

        if (!targetUrl) return;

        event.preventDefault();
        window.location.href = targetUrl;
      });

      link.dataset.profileLinkBound = "true";
    });
  }

  function bindLogoutLinks() {
    const logoutLinks = document.querySelectorAll(
      'a[href="login.html"], .profile-menu-item.logout, #logoutBtn'
    );

    logoutLinks.forEach((link) => {
      if (link.dataset.logoutBound === "true") return;

      link.addEventListener("click", function (event) {
        event.preventDefault();

        localStorage.removeItem("edumind_logged_in_user");
        localStorage.removeItem("edumind_is_logged_in");

        window.location.href = "login.html";
      });

      link.dataset.logoutBound = "true";
    });
  }

  function init() {
    applyTheme(getSavedTheme(), { persist: false });
    bindThemeToggle();
    bindProfileDropdown();
    bindProfileMenuLinks();
    bindLogoutLinks();
    populateProfileMini();
  }

  applyTheme(getSavedTheme(), { persist: false });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.EduMindTheme = {
    applyTheme,
    getCurrentTheme,
    toggleTheme: function () {
      const currentTheme = getCurrentTheme();
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme, { persist: true });
    }
  };
})();