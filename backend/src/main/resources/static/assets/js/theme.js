document.addEventListener("DOMContentLoaded", function () {
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const themeIcon = themeToggleBtn?.querySelector("i");

    const profileMenuToggle = document.getElementById("profileMenuToggle");
    const dashboardProfileDropdown = document.getElementById("dashboardProfileDropdown");

    function applyTheme(theme) {
        if (theme === "dark") {
            document.body.classList.add("preview-dark");
            if (themeIcon) {
                themeIcon.className = "fa-solid fa-sun";
            }
        } else {
            document.body.classList.remove("preview-dark");
            if (themeIcon) {
                themeIcon.className = "fa-solid fa-moon";
            }
        }
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem("edumind_theme") || "light";
        applyTheme(savedTheme);
    }

    function closeProfileDropdown() {
        dashboardProfileDropdown?.classList.add("hidden");
    }

    function toggleProfileDropdown() {
        if (!dashboardProfileDropdown) return;
        dashboardProfileDropdown.classList.toggle("hidden");
    }

    function getLoggedInUser() {
        const rawUser = localStorage.getItem("edumind_logged_in_user");
        if (!rawUser) return null;

        try {
            return JSON.parse(rawUser);
        } catch (error) {
            console.error("Failed to parse logged in user:", error);
            return null;
        }
    }

    function populateProfileMini() {
        const loggedInUser = getLoggedInUser();
        if (!loggedInUser || !profileMenuToggle) return;

        const nameElement = profileMenuToggle.querySelector("h4");
        const subtitleElement = profileMenuToggle.querySelector("p");
        const imageElement = profileMenuToggle.querySelector("img");

        if (nameElement) {
            nameElement.textContent = loggedInUser.fullName || "Student";
        }

        if (subtitleElement) {
            subtitleElement.textContent = loggedInUser.course || "Student";
        }

        if (imageElement && !imageElement.getAttribute("src")) {
            imageElement.setAttribute("src", "../assets/avatar/default-user.png");
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", function (event) {
            event.stopPropagation();

            const isDark = document.body.classList.contains("preview-dark");
            const newTheme = isDark ? "light" : "dark";

            localStorage.setItem("edumind_theme", newTheme);
            applyTheme(newTheme);
        });
    }

    if (profileMenuToggle && dashboardProfileDropdown) {
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
    }

    const profileMenuLinks = document.querySelectorAll(".dashboard-profile-dropdown .profile-menu-item");

    profileMenuLinks.forEach((link) => {
        link.addEventListener("click", function (event) {
            const targetUrl = link.getAttribute("href");
            if (!targetUrl) return;

            event.preventDefault();
            window.location.href = targetUrl;
        });
    });

    const logoutLinks = document.querySelectorAll('a[href="login.html"], .profile-menu-item.logout');

    logoutLinks.forEach((link) => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            localStorage.removeItem("edumind_logged_in_user");
            localStorage.removeItem("edumind_is_logged_in");

            window.location.href = "login.html";
        });
    });

    populateProfileMini();
    loadTheme();
});