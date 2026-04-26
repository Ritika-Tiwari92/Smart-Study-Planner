/**
 * auth-guard.js
 * Runs on protected pages.
 * Verifies token with backend.
 * Public pages like login/register should never be blocked.
 */

(async function () {
    const PUBLIC_PAGES = [
        "/pages/login.html",
        "/pages/register.html",
        "/pages/landing.html",
        "/pages/index.html",
        "/index.html",
        "/"
    ];

    const currentPath = window.location.pathname;

    function isPublicPage(pathname) {
        return PUBLIC_PAGES.some((page) => pathname.endsWith(page) || pathname === page);
    }

    function redirectToLogin() {
        if (currentPath.endsWith("/pages/login.html")) {
            return;
        }
        window.location.href = "/pages/login.html";
    }

    function clearAuthStorage() {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("edumind_logged_in_user");
        localStorage.removeItem("edumind_registered_user");
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("user");
        localStorage.removeItem("authUser");
        localStorage.removeItem("studyPlannerUser");
        localStorage.removeItem("edumind_is_logged_in");
    }

    if (isPublicPage(currentPath)) {
        return;
    }

    const rawToken = localStorage.getItem("token");
    const token = rawToken ? rawToken.trim() : "";

    console.log("Auth Guard Current Path:", currentPath);
    console.log("Auth Guard Token Present:", !!token);
    console.log("Auth Guard Token Preview:", token ? token.substring(0, 25) + "..." : "NO TOKEN");

    if (!token) {
        redirectToLogin();
        return;
    }

    try {
        const response = await fetch("/api/auth/validate", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const responseText = await response.text();
        console.log("Validate Status:", response.status);
        console.log("Validate Response:", responseText);

        if (!response.ok) {
            clearAuthStorage();
            redirectToLogin();
            return;
        }

    } catch (error) {
        console.error("Auth validation failed:", error);
        clearAuthStorage();
        redirectToLogin();
    }
})();

function getAuthHeader() {
    const rawToken = localStorage.getItem("token");
    const token = rawToken ? rawToken.trim() : "";

    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}