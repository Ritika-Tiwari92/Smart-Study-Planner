/**
 * EduMind AI — Register Page JS
 * register.js
 *
 * Updated to handle structured backend error responses:
 * { "field": "email", "message": "Email already registered." }
 * [{ "field": "password", "message": "..." }, ...]
 */

document.addEventListener("DOMContentLoaded", function () {

    const registerForm           = document.getElementById("registerForm");
    const fullNameInput          = document.getElementById("registerFullName");
    const emailInput             = document.getElementById("registerEmail");
    const passwordInput          = document.getElementById("registerPassword");
    const confirmPasswordInput   = document.getElementById("registerConfirmPassword");
    const courseInput            = document.getElementById("registerCourse");
    const collegeInput           = document.getElementById("registerCollege");
    const submitBtn              = document.getElementById("registerSubmitBtn");

    const fullNameError          = document.getElementById("registerFullNameError");
    const emailError             = document.getElementById("registerEmailError");
    const passwordError          = document.getElementById("registerPasswordError");
    const confirmPasswordError   = document.getElementById("registerConfirmPasswordError");
    const courseError            = document.getElementById("registerCourseError");
    const collegeError           = document.getElementById("registerCollegeError");

    const passwordEye            = document.getElementById("registerPasswordEye");
    const passwordEyeIcon        = document.getElementById("registerPasswordEyeIcon");
    const confirmPasswordEye     = document.getElementById("registerConfirmPasswordEye");
    const confirmPasswordEyeIcon = document.getElementById("registerConfirmPasswordEyeIcon");

    const strengthFill           = document.getElementById("passwordStrengthFill");
    const strengthLabel          = document.getElementById("passwordStrengthLabel");

    const ruleLength  = document.getElementById("rule-length");
    const ruleUpper   = document.getElementById("rule-upper");
    const ruleLower   = document.getElementById("rule-lower");
    const ruleNumber  = document.getElementById("rule-number");
    const ruleSpecial = document.getElementById("rule-special");

    if (!registerForm) return;

    // Hide strength and rules by default on page load
    document.getElementById("passwordRules").style.display = "none";
    document.getElementById("passwordStrengthContainer").style.display = "none";


    /* ══════════════════════════════════════
       HELPERS
    ══════════════════════════════════════ */

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

    /* ══════════════════════════════════════
       VALIDATION RULES
    ══════════════════════════════════════ */

    function validateFullName() {
        const value = fullNameInput.value.trim();
        if (!value) { showError(fullNameInput, fullNameError, "This field is required."); return false; }
        if (!/^[A-Za-z\u00C0-\u024F ]+$/.test(value)) {
            showError(fullNameInput, fullNameError, "Name can contain only letters and spaces.");
            return false;
        }
        if (value.length < 2) {
            showError(fullNameInput, fullNameError, "Name must be at least 2 characters.");
            return false;
        }
        clearError(fullNameInput, fullNameError);
        return true;
    }

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

    function checkPasswordRules(value) {
        return {
            length:  value.length >= 8,
            upper:   /[A-Z]/.test(value),
            lower:   /[a-z]/.test(value),
            number:  /[0-9]/.test(value),
            special: /[@#$%&*!^()_+=\-]/.test(value)
        };
    }

    function validatePassword() {
        const value = passwordInput.value;
        if (!value) {
            showError(passwordInput, passwordError, "This field is required.");
            updatePasswordUI("", 0);
            return false;
        }
        const rules  = checkPasswordRules(value);
        const passed = Object.values(rules).filter(Boolean).length;
        updateRuleChecklist(rules);
        updatePasswordUI(value, passed);
        if (!Object.values(rules).every(Boolean)) {
            showError(passwordInput, passwordError,
                "Password must contain uppercase, lowercase, number, and special character.");
            return false;
        }
        clearError(passwordInput, passwordError);
        return true;
    }

    function validateConfirmPassword() {
        const value = confirmPasswordInput.value;
        if (!value) { showError(confirmPasswordInput, confirmPasswordError, "This field is required."); return false; }
        if (value !== passwordInput.value) {
            showError(confirmPasswordInput, confirmPasswordError, "Passwords do not match.");
            return false;
        }
        clearError(confirmPasswordInput, confirmPasswordError);
        return true;
    }

    function validateCourse() {
        const value = courseInput.value.trim();
        if (!value) { showError(courseInput, courseError, "This field is required."); return false; }
        clearError(courseInput, courseError);
        return true;
    }

    function validateCollege() {
        const value = collegeInput.value.trim();
        if (!value) { showError(collegeInput, collegeError, "This field is required."); return false; }
        clearError(collegeInput, collegeError);
        return true;
    }

    /* ══════════════════════════════════════
       PASSWORD STRENGTH UI
    ══════════════════════════════════════ */

    function updatePasswordUI(value, passed) {
        if (!strengthFill || !strengthLabel) return;
        strengthFill.classList.remove("strength-weak", "strength-medium", "strength-strong");
        strengthLabel.classList.remove("strength-weak", "strength-medium", "strength-strong");
        if (!value) { strengthFill.style.width = "0%"; strengthLabel.textContent = ""; return; }
        if (passed <= 2) {
            strengthFill.classList.add("strength-weak");
            strengthLabel.classList.add("strength-weak");
            strengthLabel.textContent = "Weak";
        } else if (passed <= 4) {
            strengthFill.classList.add("strength-medium");
            strengthLabel.classList.add("strength-medium");
            strengthLabel.textContent = "Medium";
        } else {
            strengthFill.classList.add("strength-strong");
            strengthLabel.classList.add("strength-strong");
            strengthLabel.textContent = "Strong";
        }
    }

    function updateRuleChecklist(rules) {
        const map = {
            length: ruleLength, upper: ruleUpper,
            lower: ruleLower, number: ruleNumber, special: ruleSpecial
        };
        Object.entries(map).forEach(([key, el]) => {
            if (!el) return;
            rules[key] ? el.classList.add("rule-pass") : el.classList.remove("rule-pass");
        });
    }

    /* ══════════════════════════════════════
       EYE TOGGLES
    ══════════════════════════════════════ */

    if (passwordEye) {
        passwordEye.addEventListener("click", function () {
            const isHidden = passwordInput.type === "password";
            passwordInput.type = isHidden ? "text" : "password";
            passwordEyeIcon.classList.toggle("fa-eye",       !isHidden);
            passwordEyeIcon.classList.toggle("fa-eye-slash",  isHidden);
            this.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
            passwordInput.focus();
        });
    }

    if (confirmPasswordEye) {
        confirmPasswordEye.addEventListener("click", function () {
            const isHidden = confirmPasswordInput.type === "password";
            confirmPasswordInput.type = isHidden ? "text" : "password";
            confirmPasswordEyeIcon.classList.toggle("fa-eye",       !isHidden);
            confirmPasswordEyeIcon.classList.toggle("fa-eye-slash",  isHidden);
            this.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
            confirmPasswordInput.focus();
        });
    }

    /* ══════════════════════════════════════
       REAL-TIME VALIDATION LISTENERS
    ══════════════════════════════════════ */

    fullNameInput.addEventListener("input", function () {
        if (this.value.trim()) validateFullName(); else resetField(fullNameInput, fullNameError);
    });
    fullNameInput.addEventListener("blur", validateFullName);

    emailInput.addEventListener("input", function () {
        if (this.value.trim()) validateEmail(); else resetField(emailInput, emailError);
    });
    emailInput.addEventListener("blur", validateEmail);

    passwordInput.addEventListener("input", function () {
        if (this.value) {
            // Show strength + rules when user starts typing
            document.getElementById("passwordRules").style.display = "flex";
            document.getElementById("passwordStrengthContainer").style.display = "block";
            validatePassword();
            if (confirmPasswordInput.value) validateConfirmPassword();
        } else {
            // Hide when field is cleared
            document.getElementById("passwordRules").style.display = "none";
            document.getElementById("passwordStrengthContainer").style.display = "none";
            resetField(passwordInput, passwordError);
            updatePasswordUI("", 0);
            updateRuleChecklist({ length: false, upper: false, lower: false, number: false, special: false });
        }
    });
    passwordInput.addEventListener("blur", validatePassword);

    confirmPasswordInput.addEventListener("input", function () {
        if (this.value) validateConfirmPassword(); else resetField(confirmPasswordInput, confirmPasswordError);
    });
    confirmPasswordInput.addEventListener("blur", validateConfirmPassword);

    courseInput.addEventListener("input", function () {
        if (this.value.trim()) validateCourse(); else resetField(courseInput, courseError);
    });
    courseInput.addEventListener("blur", validateCourse);

    collegeInput.addEventListener("input", function () {
        if (this.value.trim()) validateCollege(); else resetField(collegeInput, collegeError);
    });
    collegeInput.addEventListener("blur", validateCollege);

    /* ══════════════════════════════════════
       LOADING STATE
    ══════════════════════════════════════ */

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.innerHTML = isLoading
            ? '<span class="btn-spinner" aria-hidden="true"></span> Creating account...'
            : "Create Account";
    }

    /* ══════════════════════════════════════
       BACKEND ERROR HANDLER
       Handles both single { field, message }
       and array [{ field, message }, ...]
    ══════════════════════════════════════ */

    function handleBackendError(errorData) {
        const errors = Array.isArray(errorData) ? errorData : [errorData];

        // Map of field name → { input, errorEl }
        const fieldMap = {
            fullName:  { input: fullNameInput,        errEl: fullNameError },
            email:     { input: emailInput,           errEl: emailError },
            password:  { input: passwordInput,        errEl: passwordError },
            course:    { input: courseInput,          errEl: courseError },
            college:   { input: collegeInput,         errEl: collegeError },
            general:   { input: emailInput,           errEl: emailError }
        };

        errors.forEach(function (err) {
            const field   = err.field   || "general";
            const message = err.message || "Something went wrong.";
            const target  = fieldMap[field] || fieldMap["general"];
            showError(target.input, target.errEl, message);
        });
    }

    /* ══════════════════════════════════════
       RESPONSE HELPER
    ══════════════════════════════════════ */

    async function parseResponse(response) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) return await response.json();
        return await response.text();
    }

    /* ══════════════════════════════════════
       FORM SUBMIT
    ══════════════════════════════════════ */

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Validate all fields
        const valid = [
            validateFullName(),
            validateEmail(),
            validatePassword(),
            validateConfirmPassword(),
            validateCourse(),
            validateCollege()
        ];
        if (valid.includes(false)) return;

        const fullName = fullNameInput.value.trim();
        const email    = emailInput.value.trim();
        const password = passwordInput.value; // do NOT trim passwords
        const course   = courseInput.value.trim();
        const college  = collegeInput.value.trim();

        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, password, course, college })
            });

            const result = await parseResponse(response);

            if (!response.ok) {
                // 409 Conflict = duplicate email
                if (response.status === 409) {
                    showError(emailInput, emailError,
                        "Email already registered. Please login.");
                    return;
                }

                // Handle structured error response from GlobalExceptionHandler
                if (result && typeof result === "object") {
                    handleBackendError(result);
                } else {
                    showError(emailInput, emailError,
                        typeof result === "string" ? result : "Registration failed.");
                }
                return;
            }

            // Success — save minimal info, redirect to login
            localStorage.setItem(
                "edumind_registered_user",
                JSON.stringify({
                    fullName, email,
                    // password intentionally NOT saved
                    course, college,
                    createdAt: new Date().toISOString()
                })
            );

            window.location.href = "login.html";

        } catch (error) {
            console.error("Registration error:", error.message);
            showError(emailInput, emailError,
                "Something went wrong. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    });
});