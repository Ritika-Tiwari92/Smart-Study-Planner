/**
 * EduMind AI — Forgot Password JS
 * forgot-password.js
 *
 * Step 1: User enters email → OTP sent
 * Step 2: User enters 6-digit OTP → verified
 * Step 3: Redirect to reset-password.html
 */

document.addEventListener("DOMContentLoaded", function () {

    /* ── Element References ── */
    const stepEmail      = document.getElementById("stepEmail");
    const stepOtp        = document.getElementById("stepOtp");
    const forgotForm     = document.getElementById("forgotPasswordForm");
    const verifyOtpForm  = document.getElementById("verifyOtpForm");
    const forgotEmail    = document.getElementById("forgotEmail");
    const forgotEmailErr = document.getElementById("forgotEmailError");
    const sendOtpBtn     = document.getElementById("sendOtpBtn");
    const verifyOtpBtn   = document.getElementById("verifyOtpBtn");
    const otpError       = document.getElementById("otpError");
    const otpSubtitle    = document.getElementById("otpSubtitle");
    const resendLink     = document.getElementById("resendOtpLink");
    const backToEmail    = document.getElementById("backToEmailLink");
    const timerCount     = document.getElementById("timerCount");

    // OTP input boxes
    const otpBoxes = [
        document.getElementById("otp1"),
        document.getElementById("otp2"),
        document.getElementById("otp3"),
        document.getElementById("otp4"),
        document.getElementById("otp5"),
        document.getElementById("otp6")
    ];

    // Store email for use in OTP step
    let currentEmail = "";
    let timerInterval = null;

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

    function setLoading(btn, isLoading, loadingText, defaultText) {
        btn.disabled = isLoading;
        btn.innerHTML = isLoading
            ? `<span class="btn-spinner" aria-hidden="true"></span> ${loadingText}`
            : defaultText;
    }

    /* ══════════════════════════════════════
       OTP TIMER — 10 minutes countdown
    ══════════════════════════════════════ */

    function startTimer(minutes) {
        clearInterval(timerInterval);
        let totalSeconds = minutes * 60;

        timerInterval = setInterval(function () {
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            timerCount.textContent =
                String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");

            if (totalSeconds <= 0) {
                clearInterval(timerInterval);
                timerCount.textContent = "00:00";
                timerCount.style.color = "var(--error)";
                // Show OTP expired message
                showOtpBoxError("OTP has expired. Please request a new one.");
            }

            totalSeconds--;
        }, 1000);
    }

    function showOtpBoxError(msg) {
        otpError.textContent = msg;
        otpError.style.display = "block";
        otpBoxes.forEach(b => {
            b.classList.add("input-error");
            b.classList.remove("input-valid");
        });
    }

    function clearOtpError() {
        otpError.textContent = "";
        otpError.style.display = "none";
        otpBoxes.forEach(b => {
            b.classList.remove("input-error");
        });
    }

    /* ══════════════════════════════════════
       OTP BOX — Auto focus next box
    ══════════════════════════════════════ */

    otpBoxes.forEach(function (box, index) {
        // Only allow numbers
        box.addEventListener("keypress", function (e) {
            if (!/[0-9]/.test(e.key)) e.preventDefault();
        });

        box.addEventListener("input", function () {
            // Remove non-numeric
            this.value = this.value.replace(/[^0-9]/g, "");

            clearOtpError();

            // Move to next box
            if (this.value && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
        });

        box.addEventListener("keydown", function (e) {
            // Move back on backspace
            if (e.key === "Backspace" && !this.value && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });

        // Paste handling — paste full OTP
        box.addEventListener("paste", function (e) {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
            if (pasted.length === 6) {
                otpBoxes.forEach((b, i) => {
                    b.value = pasted[i] || "";
                });
                otpBoxes[5].focus();
            }
        });
    });

    /* ══════════════════════════════════════
       STEP 1 — Send OTP
    ══════════════════════════════════════ */

    forgotForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = forgotEmail.value.trim();

        // Validate email
        if (!email) {
            showError(forgotEmail, forgotEmailErr, "This field is required.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError(forgotEmail, forgotEmailErr, "Please enter a valid email address.");
            return;
        }
        clearError(forgotEmail, forgotEmailErr);

        setLoading(sendOtpBtn, true, "Sending OTP...", "Send OTP");

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            // Always show OTP step (security — don't reveal if email exists)
            currentEmail = email;

            // Update subtitle with masked email
            const masked = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
            otpSubtitle.textContent =
                `Enter the 6-digit OTP sent to ${masked}`;

            // Switch to OTP step
            stepEmail.style.display = "none";
            stepOtp.style.display = "block";

            // Start 10 minute timer
            startTimer(10);

            // Focus first OTP box
            otpBoxes[0].focus();

        } catch (error) {
            showError(forgotEmail, forgotEmailErr,
                "Something went wrong. Please try again.");
        } finally {
            setLoading(sendOtpBtn, false, "", "Send OTP");
        }
    });

    /* ══════════════════════════════════════
       STEP 2 — Verify OTP
    ══════════════════════════════════════ */

    verifyOtpForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Get OTP from boxes
        const otp = otpBoxes.map(b => b.value).join("");

        if (otp.length < 6) {
            showOtpBoxError("Please enter the complete 6-digit OTP.");
            return;
        }

        clearOtpError();
        setLoading(verifyOtpBtn, true, "Verifying...", "Verify OTP");

        try {
            const response = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: currentEmail, otp })
            });

            const result = await response.json();

            if (!response.ok) {
                showOtpBoxError(result.message || "Invalid OTP. Please try again.");
                return;
            }

            // OTP verified — stop timer
            clearInterval(timerInterval);

            // Save email to sessionStorage for reset-password page
            // (sessionStorage is safe — cleared when browser closes)
            sessionStorage.setItem("resetEmail", currentEmail);
            sessionStorage.setItem("otpVerified", "true");

            // Redirect to reset password page
            window.location.href = "reset-password.html";

        } catch (error) {
            showOtpBoxError("Something went wrong. Please try again.");
        } finally {
            setLoading(verifyOtpBtn, false, "", "Verify OTP");
        }
    });

    /* ══════════════════════════════════════
       RESEND OTP
    ══════════════════════════════════════ */

    resendLink.addEventListener("click", async function (e) {
        e.preventDefault();

        if (!currentEmail) return;

        this.style.opacity = "0.5";
        this.style.pointerEvents = "none";

        try {
            await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: currentEmail })
            });

            // Clear OTP boxes
            otpBoxes.forEach(b => { b.value = ""; b.classList.remove("input-error"); });
            clearOtpError();

            // Restart timer
            timerCount.style.color = "";
            startTimer(10);

            otpBoxes[0].focus();

        } catch (error) {
            showOtpBoxError("Failed to resend OTP. Please try again.");
        } finally {
            setTimeout(() => {
                this.style.opacity = "";
                this.style.pointerEvents = "";
            }, 30000); // Allow resend after 30 seconds
        }
    });

    /* ══════════════════════════════════════
       BACK TO EMAIL
    ══════════════════════════════════════ */

    backToEmail.addEventListener("click", function (e) {
        e.preventDefault();
        clearInterval(timerInterval);
        stepOtp.style.display = "none";
        stepEmail.style.display = "block";
        otpBoxes.forEach(b => { b.value = ""; });
        clearOtpError();
        forgotEmail.focus();
    });

    /* ══════════════════════════════════════
       EMAIL REAL-TIME VALIDATION
    ══════════════════════════════════════ */

    forgotEmail.addEventListener("input", function () {
        if (this.value.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value.trim())) {
                showError(forgotEmail, forgotEmailErr,
                    "Please enter a valid email address.");
            } else {
                clearError(forgotEmail, forgotEmailErr);
            }
        } else {
            forgotEmail.classList.remove("input-valid", "input-error");
            forgotEmailErr.textContent = "";
            forgotEmailErr.style.display = "none";
        }
    });
});