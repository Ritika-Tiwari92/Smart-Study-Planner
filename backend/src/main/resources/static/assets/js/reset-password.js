/**
 * EduMind AI — Reset Password JS
 * reset-password.js
 *
 * Step 3: User sets new password after OTP verification.
 * Reads email from sessionStorage set by forgot-password.js.
 */

document.addEventListener("DOMContentLoaded", function () {

    /* ── Security check: must come from OTP verify step ── */
    const resetEmail   = sessionStorage.getItem("resetEmail");
    const otpVerified  = sessionStorage.getItem("otpVerified");

    if (!resetEmail || otpVerified !== "true") {
        // Not verified — redirect to forgot password
        window.location.href = "forgot-password.html";
        return;
    }

    /* ── Element References ── */
    const form                   = document.getElementById("resetPasswordForm");
    const newPasswordInput       = document.getElementById("newPassword");
    const confirmPasswordInput   = document.getElementById("confirmNewPassword");
    const newPasswordError       = document.getElementById("newPasswordError");
    const confirmPasswordError   = document.getElementById("confirmNewPasswordError");
    const submitBtn              = document.getElementById("resetPasswordBtn");
    const eyeBtn                 = document.getElementById("newPasswordEye");
    const eyeIcon                = document.getElementById("newPasswordEyeIcon");
    const confirmEyeBtn          = document.getElementById("confirmNewPasswordEye");
    const confirmEyeIcon         = document.getElementById("confirmNewPasswordEyeIcon");
    const strengthFill           = document.getElementById("resetStrengthFill");
    const strengthLabel          = document.getElementById("resetStrengthLabel");
    const strengthContainer      = document.getElementById("resetStrengthContainer");
    const rulesContainer         = document.getElementById("resetPasswordRules");

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

    /* ══════════════════════════════════════
       PASSWORD RULES
    ══════════════════════════════════════ */

    function checkRules(value) {
        return {
            length:  value.length >= 8,
            upper:   /[A-Z]/.test(value),
            lower:   /[a-z]/.test(value),
            number:  /[0-9]/.test(value),
            special: /[@#$%&*!^()_+=\-]/.test(value)
        };
    }

    function updateRuleChecklist(rules) {
        const map = {
            length:  document.getElementById("reset-rule-length"),
            upper:   document.getElementById("reset-rule-upper"),
            lower:   document.getElementById("reset-rule-lower"),
            number:  document.getElementById("reset-rule-number"),
            special: document.getElementById("reset-rule-special")
        };
        Object.entries(map).forEach(([key, el]) => {
            if (!el) return;
            rules[key]
                ? el.classList.add("rule-pass")
                : el.classList.remove("rule-pass");
        });
    }

    function updateStrengthBar(value, passed) {
        if (!strengthFill || !strengthLabel) return;
        strengthFill.classList.remove("strength-weak", "strength-medium", "strength-strong");
        strengthLabel.classList.remove("strength-weak", "strength-medium", "strength-strong");

        if (!value) {
            strengthFill.style.width = "0%";
            strengthLabel.textContent = "";
            return;
        }

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

    function validateNewPassword() {
        const value = newPasswordInput.value;

        if (!value) {
            showError(newPasswordInput, newPasswordError, "This field is required.");
            updateStrengthBar("", 0);
            return false;
        }

        const rules  = checkRules(value);
        const passed = Object.values(rules).filter(Boolean).length;
        updateRuleChecklist(rules);
        updateStrengthBar(value, passed);

        if (!Object.values(rules).every(Boolean)) {
            showError(newPasswordInput, newPasswordError,
                "Password must contain uppercase, lowercase, number, and special character.");
            return false;
        }

        clearError(newPasswordInput, newPasswordError);
        return true;
    }

    function validateConfirmPassword() {
        const value = confirmPasswordInput.value;

        if (!value) {
            showError(confirmPasswordInput, confirmPasswordError,
                "This field is required.");
            return false;
        }

        if (value !== newPasswordInput.value) {
            showError(confirmPasswordInput, confirmPasswordError,
                "Passwords do not match.");
            return false;
        }

        clearError(confirmPasswordInput, confirmPasswordError);
        return true;
    }

    /* ══════════════════════════════════════
       REAL-TIME VALIDATION
    ══════════════════════════════════════ */

    newPasswordInput.addEventListener("input", function () {
        if (this.value) {
            strengthContainer.style.display = "block";
            rulesContainer.style.display    = "flex";
            validateNewPassword();
            if (confirmPasswordInput.value) validateConfirmPassword();
        } else {
            strengthContainer.style.display = "none";
            rulesContainer.style.display    = "none";
            newPasswordInput.classList.remove("input-valid", "input-error");
            newPasswordError.textContent = "";
            newPasswordError.style.display = "none";
            updateStrengthBar("", 0);
            updateRuleChecklist({ length:false, upper:false, lower:false, number:false, special:false });
        }
    });

    newPasswordInput.addEventListener("blur", validateNewPassword);

    confirmPasswordInput.addEventListener("input", function () {
        if (this.value) validateConfirmPassword();
        else {
            confirmPasswordInput.classList.remove("input-valid", "input-error");
            confirmPasswordError.textContent = "";
            confirmPasswordError.style.display = "none";
        }
    });

    confirmPasswordInput.addEventListener("blur", validateConfirmPassword);

    /* ══════════════════════════════════════
       EYE TOGGLES
    ══════════════════════════════════════ */

    if (eyeBtn) {
        eyeBtn.addEventListener("click", function () {
            const isHidden = newPasswordInput.type === "password";
            newPasswordInput.type = isHidden ? "text" : "password";
            eyeIcon.classList.toggle("fa-eye",       !isHidden);
            eyeIcon.classList.toggle("fa-eye-slash",  isHidden);
            newPasswordInput.focus();
        });
    }

    if (confirmEyeBtn) {
        confirmEyeBtn.addEventListener("click", function () {
            const isHidden = confirmPasswordInput.type === "password";
            confirmPasswordInput.type = isHidden ? "text" : "password";
            confirmEyeIcon.classList.toggle("fa-eye",       !isHidden);
            confirmEyeIcon.classList.toggle("fa-eye-slash",  isHidden);
            confirmPasswordInput.focus();
        });
    }

    /* ══════════════════════════════════════
       LOADING STATE
    ══════════════════════════════════════ */

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.innerHTML = isLoading
            ? '<span class="btn-spinner" aria-hidden="true"></span> Resetting Password...'
            : "Reset Password";
    }

    /* ══════════════════════════════════════
       FORM SUBMIT
    ══════════════════════════════════════ */

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const isPassValid    = validateNewPassword();
        const isConfirmValid = validateConfirmPassword();
        if (!isPassValid || !isConfirmValid) return;

        const newPassword     = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        setLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: resetEmail,
                    newPassword,
                    confirmPassword
                })
            });

            const result = await response.json();

            if (!response.ok) {
                const msg   = result.message || "Something went wrong.";
                const field = result.field   || "general";
                if (field === "newPassword") {
                    showError(newPasswordInput, newPasswordError, msg);
                } else {
                    showError(newPasswordInput, newPasswordError, msg);
                }
                return;
            }

            // Clear session data
            sessionStorage.removeItem("resetEmail");
            sessionStorage.removeItem("otpVerified");

            // Show success and redirect to login
            showSuccessAndRedirect();

        } catch (error) {
            showError(newPasswordInput, newPasswordError,
                "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    });

    /* ══════════════════════════════════════
       SUCCESS — Show message then redirect
    ══════════════════════════════════════ */

    function showSuccessAndRedirect() {
        form.innerHTML = `
            <div style="text-align:center;padding:20px 0;">
                <div style="width:72px;height:72px;background:var(--success-bg);
                            border-radius:50%;display:flex;align-items:center;
                            justify-content:center;margin:0 auto 20px;
                            border:2px solid var(--success);">
                    <i class="fa-solid fa-check" style="font-size:32px;
                        color:var(--success);"></i>
                </div>
                <h3 style="color:var(--text-primary);font-size:1.25rem;
                            margin-bottom:10px;">Password Reset Successful!</h3>
                <p style="color:var(--text-muted);font-size:0.875rem;
                           margin-bottom:24px;line-height:1.6;">
                    Your password has been updated successfully.<br>
                    Redirecting to login page...
                </p>
                <div class="auth-strength-bar" style="height:4px;">
                    <div id="redirectBar" class="auth-strength-fill strength-strong"
                         style="width:0%;transition:width 3s linear;">
                    </div>
                </div>
            </div>
        `;

        // Animate redirect bar
        setTimeout(() => {
            const bar = document.getElementById("redirectBar");
            if (bar) bar.style.width = "100%";
        }, 100);

        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = "login.html";
        }, 3000);
    }
});