document.addEventListener("DOMContentLoaded", function () {
    const currentPath = window.location.pathname.toLowerCase();
    const isLoggedIn = localStorage.getItem("edumind_is_logged_in") === "true";
    const loggedInUser = localStorage.getItem("edumind_logged_in_user");

    const publicPages = ["login.html", "register.html"];
    const isPublicPage = publicPages.some((page) => currentPath.includes(page));

    if (!isLoggedIn || !loggedInUser) {
        if (!isPublicPage) {
            window.location.href = "login.html";
        }
        return;
    }

    if (isLoggedIn && loggedInUser && isPublicPage) {
        window.location.href = "dashboard.html";
    }
});