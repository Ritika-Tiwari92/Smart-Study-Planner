/**
 * EduMind AI — Login JS
 * login.js
 *
 * Cleaned + Fixed:
 *  - Student/Admin tab selection respected
 *  - Student login uses /api/auth/login
 *  - Admin login uses /api/admin/auth/login
 *  - Admin token keys stored for admin pages
 *  - Admin no longer redirects back to admin-login.html
 *  - Password eye button fixed
 *  - Duplicate inline eye listener conflict handled
 *  - JWT-compatible localStorage session handling
 */

document.addEventListener("DOMContentLoaded", function () {

    const loginForm     = document.getElementById("loginForm");
    const emailInput    = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const submitBtn     = document.getElementById("loginSubmitBtn");
    const eyeBtn        = document.getElementById("loginPasswordEye");
    const eyeIcon       = document.getElementById("loginPasswordEyeIcon");
    const emailError    = document.getElementById("loginEmailError");
    const passwordError = document.getElementById("loginPasswordError");

    const STUDENT_DASHBOARD_URL = "/pages/dashboard.html";
    const ADMIN_DASHBOARD_URL   = "/pages/admin/admin-dashboard.html";

    const STUDENT_LOGIN_API = "/api/auth/login";
    const ADMIN_LOGIN_API   = "/api/admin/auth/login";

    if (!loginForm) return;

    /* ─────────────────────────────────────────
       Selected role from login.html tab
    ───────────────────────────────────────── */

    function getSelectedRole() {
        const selected = (window.__selectedRole || "student").toString().toLowerCase();
        return selected === "admin" ? "admin" : "student";
    }

    function getSubmitLabel() {
        return getSelectedRole() === "admin"
            ? "Sign In to Admin Panel"
            : "Sign In";
    }

    /* ─────────────────────────────────────────
       Error helpers
    ───────────────────────────────────────── */

    function showError(input, errEl, msg) {
        if (!input || !errEl) return;

        input.classList.remove("input-valid");
        input.classList.add("input-error");

        errEl.textContent = msg;
        errEl.style.display = "block";
    }

    function clearError(input, errEl) {
        if (!input || !errEl) return;

        input.classList.remove("input-error");
        input.classList.add("input-valid");

        errEl.textContent = "";
        errEl.style.display = "none";
    }

    function resetField(input, errEl) {
        if (!input) return;

        input.classList.remove("input-error", "input-valid");

        if (errEl) {
            errEl.textContent = "";
            errEl.style.display = "none";
        }
    }

    function showGeneralError(msg) {
        showError(emailInput, emailError, msg || "Something went wrong.");
    }

    /* ─────────────────────────────────────────
       Validation
    ───────────────────────────────────────── */

    function validateEmail() {
        const value = emailInput.value.trim();

        if (!value) {
            showError(emailInput, emailError, "This field is required.");
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            showError(emailInput, emailError, "Please enter a valid email address.");
            return false;
        }

        clearError(emailInput, emailError);
        return true;
    }

    function validatePassword() {
        const value = passwordInput.value;

        if (!value) {
            showError(passwordInput, passwordError, "This field is required.");
            return false;
        }

        if (value.length < 8) {
            showError(passwordInput, passwordError, "Password must be at least 8 characters.");
            return false;
        }

        clearError(passwordInput, passwordError);
        return true;
    }

    /* ─────────────────────────────────────────
       Real-time validation
    ───────────────────────────────────────── */

    emailInput.addEventListener("input", function () {
        if (this.value.trim()) {
            validateEmail();
        } else {
            resetField(emailInput, emailError);
        }
    });

    emailInput.addEventListener("blur", validateEmail);

    passwordInput.addEventListener("input", function () {
        if (this.value) {
            validatePassword();
        } else {
            resetField(passwordInput, passwordError);
        }
    });

    passwordInput.addEventListener("blur", validatePassword);

    /* ─────────────────────────────────────────
       Password eye toggle — FINAL CLEAN FIX

       Reason:
       login.html also had an inline password-eye listener.
       Capture phase + stopImmediatePropagation prevents double toggle.
    ───────────────────────────────────────── */

    if (eyeBtn && passwordInput) {
        eyeBtn.setAttribute("type", "button");

        document.addEventListener("click", function (event) {
            const clickedEyeBtn = event.target.closest("#loginPasswordEye");

            if (!clickedEyeBtn) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const isHidden = passwordInput.type === "password";

            passwordInput.type = isHidden ? "text" : "password";

            if (eyeIcon) {
                eyeIcon.className = isHidden
                    ? "fa-solid fa-eye-slash"
                    : "fa-solid fa-eye";
            }

            clickedEyeBtn.setAttribute(
                "aria-label",
                isHidden ? "Hide password" : "Show password"
            );
        }, true);
    }

    /* ─────────────────────────────────────────
       Loading state
    ───────────────────────────────────────── */

    function setLoading(isLoading) {
        if (!submitBtn) return;

        submitBtn.disabled = isLoading;
        submitBtn.innerHTML = isLoading
            ? '<span class="btn-spinner" aria-hidden="true"></span> Signing in...'
            : getSubmitLabel();
    }

    /* ─────────────────────────────────────────
       Backend response helpers
    ───────────────────────────────────────── */

    async function parseResponse(response) {
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return await response.json();
        }

        return await response.text();
    }

    function handleBackendError(status, errorData) {
        if (typeof errorData === "string") {
            showGeneralError(errorData || "Invalid email or password.");
            return;
        }

        if (errorData && typeof errorData === "object" && errorData.message) {
            showGeneralError(errorData.message);
            return;
        }

        const errors = Array.isArray(errorData) ? errorData : [errorData];

        errors.forEach(function (err) {
            const field = err?.field || "general";
            const message = err?.message || "Invalid email or password.";

            if (status === 423) {
                showError(emailInput, emailError, message);
                return;
            }

            if (field === "email" || field === "general") {
                showError(emailInput, emailError, message);
            } else if (field === "password") {
                showError(passwordInput, passwordError, message);
            } else {
                showError(emailInput, emailError, message);
            }
        });
    }

    function getTokenFromResponse(result) {
        if (!result || typeof result !== "object") return "";

        return result.token
            || result.jwt
            || result.accessToken
            || result.access_token
            || "";
    }

    function normalizeRole(roleValue) {
        if (!roleValue) return "STUDENT";

        return String(roleValue)
            .replace("ROLE_", "")
            .trim()
            .toUpperCase();
    }

    function getUserObjectFromResponse(result, email, selectedRole) {
        if (result && typeof result === "object") {

            if (result.user && typeof result.user === "object") {
                const nestedRole = normalizeRole(result.user.role || result.role || selectedRole);

                return {
                    ...result.user,
                    id: result.user.id ?? result.user.userId ?? result.id ?? result.userId ?? null,
                    name: result.user.name ?? result.user.fullName ?? result.fullName ?? result.adminName ?? "",
                    fullName: result.user.fullName ?? result.fullName ?? result.user.name ?? result.adminName ?? "",
                    email: result.user.email ?? result.email ?? result.adminEmail ?? email ?? "",
                    role: nestedRole
                };
            }

            return {
                id: result.userId ?? result.id ?? result.adminId ?? null,
                name: result.name ?? result.userName ?? result.fullName ?? result.adminName ?? "",
                fullName: result.fullName ?? result.name ?? result.userName ?? result.adminName ?? "",
                email: result.email ?? result.adminEmail ?? email ?? "",
                role: normalizeRole(result.role || selectedRole)
            };
        }

        return {
            id: null,
            name: "",
            fullName: "",
            email: email || "",
            role: selectedRole === "admin" ? "ADMIN" : "STUDENT"
        };
    }

    function clearOldAuthData() {
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
            "edumind_is_logged_in",

            "adminToken",
            "adminRole",
            "adminName",
            "adminEmail"
        ].forEach(function (key) {
            localStorage.removeItem(key);
        });
    }

    function storeStudentSession(token, refreshToken, user, role) {
        localStorage.setItem("token", token);
        localStorage.setItem("edumind_is_logged_in", "true");
        localStorage.setItem("edumind_logged_in_user", JSON.stringify(user));
        localStorage.setItem("userRole", role);

        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }

        if (user.id != null) {
            localStorage.setItem("userId", String(user.id));
        }

        if (user.email) {
            localStorage.setItem("userEmail", user.email);
        }

        if (user.name || user.fullName) {
            localStorage.setItem("userName", user.name || user.fullName);
        }
    }

    function storeAdminSession(token, refreshToken, user, role) {
        localStorage.setItem("token", token);
        localStorage.setItem("edumind_is_logged_in", "true");
        localStorage.setItem("edumind_logged_in_user", JSON.stringify(user));
        localStorage.setItem("userRole", role);

        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminRole", "ADMIN");
        localStorage.setItem("adminName", user.name || user.fullName || "Admin");
        localStorage.setItem("adminEmail", user.email || "");

        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }

        if (user.id != null) {
            localStorage.setItem("userId", String(user.id));
        }

        if (user.email) {
            localStorage.setItem("userEmail", user.email);
        }

        if (user.name || user.fullName) {
            localStorage.setItem("userName", user.name || user.fullName);
        }
    }

    function redirectByRole(role) {
        const normalizedRole = normalizeRole(role);

        if (normalizedRole === "ADMIN") {
            window.location.href = ADMIN_DASHBOARD_URL;
            return;
        }

        window.location.href = STUDENT_DASHBOARD_URL;
    }

    /* ─────────────────────────────────────────
       Form submit
    ───────────────────────────────────────── */

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isPasswordValid) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const selectedRole = getSelectedRole();

        const loginEndpoint = selectedRole === "admin"
            ? ADMIN_LOGIN_API
            : STUDENT_LOGIN_API;

        setLoading(true);

        try {
            const response = await fetch(loginEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const result = await parseResponse(response);

            if (!response.ok || (result && typeof result === "object" && result.success === false)) {
                handleBackendError(response.status, result);
                return;
            }

            const token = getTokenFromResponse(result);

            if (!token) {
                showError(
                    passwordInput,
                    passwordError,
                    "Login successful but session token not received."
                );
                return;
            }

            const user = getUserObjectFromResponse(result, email, selectedRole);
            const role = normalizeRole(user.role);

            if (selectedRole === "admin" && role !== "ADMIN") {
                showGeneralError("Please use an admin account to sign in from the Admin tab.");
                return;
            }

            if (selectedRole === "student" && role === "ADMIN") {
                showGeneralError("This is an admin account. Please select the Admin tab to continue.");
                return;
            }

            clearOldAuthData();

            if (role === "ADMIN") {
                storeAdminSession(
                    token,
                    result.refreshToken || result.refresh_token || "",
                    user,
                    role
                );
            } else {
                storeStudentSession(
                    token,
                    result.refreshToken || result.refresh_token || "",
                    user,
                    role
                );
            }

            redirectByRole(role);

        } catch (error) {
            console.error("Login error:", error.message);

            showError(
                emailInput,
                emailError,
                "Something went wrong. Please check your connection and try again."
            );

        } finally {
            setLoading(false);
        }
    });
});


/* ══════════════════════════════════════════════════════
   AUTO REFRESH HELPER
   Use this before authenticated API requests if needed.

   Example:
     const token = await getValidToken();
     if (!token) return;
══════════════════════════════════════════════════════ */

window.getValidToken = async function () {
    const userRole = localStorage.getItem("userRole");

    const token = userRole === "ADMIN"
        ? (localStorage.getItem("adminToken") || localStorage.getItem("token"))
        : localStorage.getItem("token");

    const refreshToken = localStorage.getItem("refreshToken");

    if (!token) {
        window.location.href = "/pages/login.html";
        return null;
    }

    try {
        const response = await fetch("/api/auth/validate", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (response.ok) return token;

        if (response.status === 401 && refreshToken) {
            const refreshResponse = await fetch("/api/auth/refresh-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ refreshToken: refreshToken })
            });

            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                const newToken = data.accessToken || data.token || "";

                if (newToken) {
                    localStorage.setItem("token", newToken);

                    if (userRole === "ADMIN") {
                        localStorage.setItem("adminToken", newToken);
                    }

                    return newToken;
                }
            }
        }

        localStorage.clear();
        window.location.href = "/pages/login.html";
        return null;

    } catch (err) {
        console.error("Token validation error:", err.message);
        return token;
    }
};