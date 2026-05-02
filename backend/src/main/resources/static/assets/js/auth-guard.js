/**
 * EduMind AI — Auth Guard
 * auth-guard.js
 *
 * Purpose:
 *  - Protect private pages
 *  - Validate JWT token
 *  - Auto refresh access token using refreshToken
 *  - Fetch logged-in profile from backend
 *  - Protect admin pages from student users
 *  - Protect student pages from admin users
 *
 * Role rules:
 *  - ADMIN can access only /pages/admin/*
 *  - STUDENT can access normal student pages
 */

(async function () {
    "use strict";

    const PUBLIC_PAGES = [
        "/pages/login.html",
        "/pages/register.html",
        "/pages/forgot-password.html",
        "/pages/reset-password.html",
        "/pages/landing-page.html",
        "/pages/landing.html",
        "/pages/index.html",
        "/index.html",
        "/"
    ];

    const ADMIN_DASHBOARD = "/pages/admin/admin-dashboard.html";
    const STUDENT_DASHBOARD = "/pages/dashboard.html";
    const LOGIN_PAGE = "/pages/login.html";

    const currentPath = window.location.pathname;

    function isPublicPage(path) {
        return PUBLIC_PAGES.some(function (publicPath) {
            return path === publicPath || path.endsWith(publicPath);
        });
    }

    function isAdminPage(path) {
        return path.includes("/pages/admin/");
    }

    function isStudentPage(path) {
        return path.includes("/pages/")
            && !isAdminPage(path)
            && !isPublicPage(path);
    }

    function getToken() {
        return (localStorage.getItem("token") || "").trim();
    }

    function getRefreshToken() {
        return (localStorage.getItem("refreshToken") || "").trim();
    }

    function normalizeRole(roleValue) {
        if (!roleValue) return "";

        return String(roleValue)
            .replace("ROLE_", "")
            .trim()
            .toUpperCase();
    }

    function clearAuthStorage() {
        [
            "token",
            "refreshToken",
            "userId",
            "userEmail",
            "userName",
            "userRole",
            "edumind_logged_in_user",
            "edumind_registered_user",
            "loggedInUser",
            "currentUser",
            "user",
            "authUser",
            "studyPlannerUser",
            "edumind_is_logged_in"
        ].forEach(function (key) {
            localStorage.removeItem(key);
        });
    }

    function redirectToLogin() {
        if (currentPath.endsWith("/pages/login.html")) return;
        window.location.replace(LOGIN_PAGE);
    }

    function redirectByRole(role) {
        const normalizedRole = normalizeRole(role);

        if (normalizedRole === "ADMIN") {
            window.location.replace(ADMIN_DASHBOARD);
            return;
        }

        window.location.replace(STUDENT_DASHBOARD);
    }

    async function tryRefresh() {
        const refreshToken = getRefreshToken();

        if (!refreshToken) return false;

        try {
            const response = await fetch("/api/auth/refresh-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ refreshToken: refreshToken })
            });

            if (!response.ok) return false;

            const data = await response.json();
            const newToken = data.accessToken || data.token || "";

            if (!newToken) return false;

            localStorage.setItem("token", newToken);
            return true;

        } catch (error) {
            console.error("Refresh token error:", error.message);
            return false;
        }
    }

    async function validateToken(token) {
        return fetch("/api/auth/validate", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });
    }

    async function fetchProfile(token) {
        const response = await fetch("/api/auth/profile", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Unable to fetch profile.");
        }

        return await response.json();
    }

    function saveProfileToLocalStorage(profile) {
        if (!profile || typeof profile !== "object") return "";

        const role = normalizeRole(profile.role);

        const user = {
            id: profile.id ?? null,
            name: profile.fullName ?? profile.name ?? "",
            fullName: profile.fullName ?? profile.name ?? "",
            email: profile.email ?? "",
            role: role,
            course: profile.course ?? "",
            college: profile.college ?? "",
            preferredStudyTime: profile.preferredStudyTime ?? "",
            dailyStudyGoal: profile.dailyStudyGoal ?? ""
        };

        localStorage.setItem("edumind_logged_in_user", JSON.stringify(user));
        localStorage.setItem("edumind_is_logged_in", "true");
        localStorage.setItem("userRole", role);

        if (user.id != null) {
            localStorage.setItem("userId", String(user.id));
        }

        if (user.email) {
            localStorage.setItem("userEmail", user.email);
        }

        if (user.name || user.fullName) {
            localStorage.setItem("userName", user.name || user.fullName);
        }

        return role;
    }

    if (isPublicPage(currentPath)) return;

    let token = getToken();

    if (!token) {
        clearAuthStorage();
        redirectToLogin();
        return;
    }

    try {
        let validationResponse = await validateToken(token);

        if (!validationResponse.ok) {
            if (validationResponse.status === 401 || validationResponse.status === 403) {
                const refreshed = await tryRefresh();

                if (!refreshed) {
                    clearAuthStorage();
                    redirectToLogin();
                    return;
                }

                token = getToken();
                validationResponse = await validateToken(token);

                if (!validationResponse.ok) {
                    clearAuthStorage();
                    redirectToLogin();
                    return;
                }
            } else {
                clearAuthStorage();
                redirectToLogin();
                return;
            }
        }

        const profile = await fetchProfile(token);
        const role = saveProfileToLocalStorage(profile);

        if (isAdminPage(currentPath) && role !== "ADMIN") {
            window.location.replace(STUDENT_DASHBOARD);
            return;
        }

        if (isStudentPage(currentPath) && role === "ADMIN") {
            window.location.replace(ADMIN_DASHBOARD);
            return;
        }

    } catch (error) {
        console.error("Auth guard error:", error.message);
        clearAuthStorage();
        redirectToLogin();
    }

})();


/* ─────────────────────────────────────────
   Global Helper 1: getAuthHeader()
   Use this in normal API calls.
───────────────────────────────────────── */

function getAuthHeader() {
    const token = (localStorage.getItem("token") || "").trim();

    return {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
    };
}


/* ─────────────────────────────────────────
   Global Helper 2: fetchWithAuth()
   Use this instead of fetch() in private page JS files.

   Features:
   - Adds JWT automatically
   - Refreshes token on 401
   - Redirects if session expired
───────────────────────────────────────── */

async function fetchWithAuth(url, options = {}) {

    const makeRequest = function (token) {
        return fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
                ...(options.headers || {})
            }
        });
    };

    let token = (localStorage.getItem("token") || "").trim();

    if (!token) {
        window.location.replace("/pages/login.html");
        return null;
    }

    let response = await makeRequest(token);

    if (response.status === 401) {
        const refreshToken = (localStorage.getItem("refreshToken") || "").trim();

        if (!refreshToken) {
            clearAuthDataAndRedirect();
            return null;
        }

        try {
            const refreshResponse = await fetch("/api/auth/refresh-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ refreshToken: refreshToken })
            });

            if (!refreshResponse.ok) {
                clearAuthDataAndRedirect();
                return null;
            }

            const data = await refreshResponse.json();
            const newToken = data.accessToken || data.token || "";

            if (!newToken) {
                clearAuthDataAndRedirect();
                return null;
            }

            localStorage.setItem("token", newToken);
            response = await makeRequest(newToken);

        } catch (error) {
            console.error("fetchWithAuth refresh error:", error.message);
            clearAuthDataAndRedirect();
            return null;
        }
    }

    if (response.status === 403) {
        const role = String(localStorage.getItem("userRole") || "").toUpperCase();

        if (role === "ADMIN") {
            window.location.replace("/pages/admin/admin-dashboard.html");
        } else {
            window.location.replace("/pages/dashboard.html");
        }

        return null;
    }

    return response;
}


function clearAuthDataAndRedirect() {
    [
        "token",
        "refreshToken",
        "userId",
        "userEmail",
        "userName",
        "userRole",
        "edumind_logged_in_user",
        "edumind_is_logged_in"
    ].forEach(function (key) {
        localStorage.removeItem(key);
    });

    window.location.replace("/pages/login.html");
}