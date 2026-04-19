document.addEventListener("DOMContentLoaded", function () {
    const currentPath = window.location.pathname.toLowerCase();

    const publicPages = ["login.html", "register.html"];
    const isPublicPage = publicPages.some((page) => currentPath.includes(page));

    const isLoggedIn = localStorage.getItem("edumind_is_logged_in") === "true";
    const loggedInUserRaw = localStorage.getItem("edumind_logged_in_user");

    function clearAuthAndRedirect() {
        localStorage.removeItem("edumind_logged_in_user");
        localStorage.removeItem("edumind_is_logged_in");

        if (!isPublicPage) {
            window.location.href = "login.html";
        }
    }

    function getParsedLoggedInUser() {
        if (!loggedInUserRaw) return null;

        try {
            const parsedUser = JSON.parse(loggedInUserRaw);

            if (!parsedUser || !parsedUser.email) {
                return null;
            }

            return parsedUser;
        } catch (error) {
            console.error("Invalid logged in user data:", error);
            return null;
        }
    }

    const loggedInUser = getParsedLoggedInUser();

    if (!isLoggedIn || !loggedInUser) {
        clearAuthAndRedirect();
        return;
    }

    if (isLoggedIn && loggedInUser && isPublicPage) {
        window.location.href = "dashboard.html";
    }
});