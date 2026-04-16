document.addEventListener("DOMContentLoaded", function () {
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const themeIcon = themeToggleBtn?.querySelector("i");

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

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", function () {
            const isDark = document.body.classList.contains("preview-dark");
            const newTheme = isDark ? "light" : "dark";

            localStorage.setItem("edumind_theme", newTheme);
            applyTheme(newTheme);
        });
    }

    loadTheme();
});