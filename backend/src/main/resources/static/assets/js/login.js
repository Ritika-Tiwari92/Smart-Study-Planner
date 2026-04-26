/**
 * EduMind AI — Login JS (Final Version)
 * login.js
 *
 * New features:
 *  - Stores refreshToken in localStorage on login
 *  - Handles 423 Locked (account locked error)
 *  - Handles 401 Unauthorized (wrong credentials)
 *  - All inline errors — no alert() used
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

    if (!loginForm) return;

    /* ── Error helpers ── */
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
        if (errEl) { errEl.textContent = ""; errEl.style.display = "none"; }
    }

    /* ── Validation ── */
    function validateEmail() {
        const value = emailInput.value.trim();
        if (!value) { showError(emailInput, emailError, "This field is required."); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            showError(emailInput, emailError, "Please enter a valid email address.");
            return false;
        }
        clearError(emailInput, emailError);
        return true;
    }

    function validatePassword() {
        const value = passwordInput.value;
        if (!value) { showError(passwordInput, passwordError, "This field is required."); return false; }
        if (value.length < 8) {
            showError(passwordInput, passwordError, "Password must be at least 8 characters.");
            return false;
        }
        clearError(passwordInput, passwordError);
        return true;
    }

    /* ── Real-time validation ── */
    emailInput.addEventListener("input", function () {
        if (this.value.trim()) validateEmail(); else resetField(emailInput, emailError);
    });
    emailInput.addEventListener("blur", validateEmail);

    passwordInput.addEventListener("input", function () {
        if (this.value) validatePassword(); else resetField(passwordInput, passwordError);
    });
    passwordInput.addEventListener("blur", validatePassword);

    /* ── Eye toggle ── */
    if (eyeBtn) {
        eyeBtn.addEventListener("click", function () {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            eyeIcon.classList.toggle("fa-eye",       !isPassword);
            eyeIcon.classList.toggle("fa-eye-slash",  isPassword);
            this.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
            passwordInput.focus();
        });
    }

    /* ── Loading state ── */
    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.innerHTML = isLoading
            ? '<span class="btn-spinner" aria-hidden="true"></span> Signing in...'
            : "Sign In";
    }

    /* ── Backend error handler ── */
    function handleBackendError(status, errorData) {
        const errors = Array.isArray(errorData) ? errorData : [errorData];

        errors.forEach(function (err) {
            const field   = err.field   || "general";
            const message = err.message || "Something went wrong.";

            // 423 = account locked → show under email
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

    /* ── Auth data helpers ── */
    async function parseResponse(response) {
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("application/json")) return await response.json();
        return await response.text();
    }

    function getTokenFromResponse(result) {
        if (!result || typeof result !== "object") return "";
        return result.token || result.jwt || result.accessToken || result.access_token || "";
    }

    function getUserObjectFromResponse(result, email) {
        if (result && typeof result === "object") {
            if (result.user && typeof result.user === "object") return result.user;
            return {
                id:    result.userId ?? result.id ?? null,
                name:  result.name   ?? result.userName ?? "",
                email: result.email  ?? email ?? ""
            };
        }
        return { id: null, name: "", email: email || "" };
    }

    function clearOldAuthData() {
        ["token", "refreshToken", "userId", "userEmail", "userName",
         "edumind_logged_in_user", "edumind_registered_user",
         "loggedInUser", "currentUser", "user", "authUser",
         "studyPlannerUser", "edumind_is_logged_in"
        ].forEach(k => localStorage.removeItem(k));
    }

    /* ── Form submit ── */
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!validateEmail() | !validatePassword()) return;

        const email    = emailInput.value.trim();
        const password = passwordInput.value;

        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const result = await parseResponse(response);

            if (!response.ok) {
                if (result && typeof result === "object") {
                    handleBackendError(response.status, result);
                } else {
                    showError(emailInput, emailError,
                        typeof result === "string" ? result : "Invalid email or password.");
                }
                return;
            }

            const token = getTokenFromResponse(result);
            if (!token) {
                showError(passwordInput, passwordError,
                    "Login successful but session token not received.");
                return;
            }

            const user = getUserObjectFromResponse(result, email);
            clearOldAuthData();

            // Store access token + refresh token
            localStorage.setItem("token", token);
            localStorage.setItem("edumind_is_logged_in", "true");
            localStorage.setItem("edumind_logged_in_user", JSON.stringify(user));

            // Store refresh token if returned by backend
            if (result.refreshToken) {
                localStorage.setItem("refreshToken", result.refreshToken);
            }

            if (user.id != null) localStorage.setItem("userId", String(user.id));
            if (user.email)      localStorage.setItem("userEmail", user.email);
            if (user.name)       localStorage.setItem("userName", user.name);

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Login error:", error.message);
            showError(emailInput, emailError,
                "Something went wrong. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    });
});


/* ══════════════════════════════════════════════════════
   AUTO REFRESH HELPER — use this in OTHER pages (not here)
   Call this before any authenticated API request.

   Usage in any page JS:
     const token = await getValidToken();
     if (!token) return; // user will be redirected to login

   Paste this function in a shared auth-helper.js file.
══════════════════════════════════════════════════════ */
window.getValidToken = async function () {
    const token        = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    // Try a lightweight token validation call
    try {
        const response = await fetch("/api/auth/validate", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (response.ok) return token; // token still valid

        // Token expired (401) → try refresh
        if (response.status === 401 && refreshToken) {
            const refreshResponse = await fetch("/api/auth/refresh-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: refreshToken })
            });

            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                // Save new access token
                localStorage.setItem("token", data.accessToken);
                return data.accessToken;
            }
        }

        // Refresh failed → force login
        localStorage.clear();
        window.location.href = "login.html";
        return null;

    } catch (err) {
        console.error("Token validation error:", err.message);
        return token; // Network error — return existing token and let API handle it
    }
};