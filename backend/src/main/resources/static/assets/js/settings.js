/* =========================================================
   EduMind AI — Settings Module
   Clean backend-safe settings logic with English UI messages
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const saveSettingsBtn = $("saveSettingsBtn");
  const settingsSaveStatus = $("settingsSaveStatus");

  const settingsFullName = $("settingsFullName");
  const settingsEmail = $("settingsEmail");
  const settingsCourse = $("settingsCourse");
  const settingsCollege = $("settingsCollege");
  const settingsStudyTime = $("settingsStudyTime");
  const settingsStudyGoal = $("settingsStudyGoal");
  const settingsSubjectFocus = $("settingsSubjectFocus");
  const settingsToggles = document.querySelectorAll(".settings-toggle-item input[type='checkbox']");

  const changePhotoBtn = $("changePhotoBtn");
  const profilePhotoInput = $("profilePhotoInput");
  const settingsProfileImage = $("settingsProfileImage");
  const headerProfileImage = $("headerProfileImage");
  const avatarOverlay = $("avatarOverlay");

  const changePasswordBtn = $("changePasswordBtn");
  const twoFactorBtn = $("twoFactorBtn");
  const deleteAccountBtn = $("deleteAccountBtn");

  const changePasswordForm = $("changePasswordForm");
  const currentPasswordInput = $("currentPassword");
  const newPasswordInput = $("newPassword");
  const confirmNewPasswordInput = $("confirmNewPassword");
  const cancelPasswordBtn = $("cancelPasswordBtn");
  const updatePasswordBtn = $("updatePasswordBtn");
  const passwordStrengthBar = $("passwordStrengthBar");
  const passwordStrengthText = $("passwordStrengthText");

  const twofaModalOverlay = $("twofaModalOverlay");
  const twofaModalClose = $("twofaModalClose");
  const twofaModalCancel = $("twofaModalCancel");
  const verify2FABtn = $("verify2FABtn");
  const sendOtpBtn = $("sendOtpBtn");
  const otpErrorMsg = $("otpErrorMsg");
  const otpBoxes = document.querySelectorAll(".otp-box");
  const maskedEmailDisplay = $("maskedEmailDisplay");

  const twofaStatusBanner = $("twofaStatusBanner");
  const twofaStatusLabel = $("twofaStatusLabel");
  const twofaBadge = $("twofaBadge");
  const twofaDot = $("twofaDot");

  const profileCompletionValue = $("profileCompletionValue");
  const profileCompletionBar = $("profileCompletionBar");
  const activeAlertsCount = $("activeAlertsCount");
  const securityStatusText = $("securityStatusText");

  const DEFAULT_PROFILE_IMAGE = "../assets/avatar/default-user.png";
  const LEGACY_PROFILE_PHOTO_STORAGE_KEY = "edumind_profile_photo";

  /* =========================================================
     Storage and auth helpers
  ========================================================= */

  function getLoggedInUser() {
    try {
      return JSON.parse(localStorage.getItem("edumind_logged_in_user")) || null;
    } catch {
      return null;
    }
  }

  function setLoggedInUser(user) {
    localStorage.setItem("edumind_logged_in_user", JSON.stringify(user || {}));
  }

  function getAccessToken() {
    return localStorage.getItem("token")
      || localStorage.getItem("edumind_access_token")
      || getLoggedInUser()?.accessToken
      || getLoggedInUser()?.token
      || null;
  }

  function authHeaders(extraHeaders = {}) {
    const token = getAccessToken();

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders
    };
  }

  function clearAuthStorage() {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("edumind_logged_in_user");
    localStorage.removeItem("edumind_is_logged_in");
    localStorage.removeItem("edumind_access_token");
    localStorage.removeItem("edumind_refresh_token");
  }

  async function parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  }

  /* =========================================================
     Toast and status
  ========================================================= */

  function setStatus(message = "All changes saved.") {
    if (settingsSaveStatus) settingsSaveStatus.textContent = message;
  }

  function showToast(message, type = "success") {
    const toast = $("toastNotification");
    const msgEl = $("toastMsg");
    const iconEl = $("toastIcon");

    if (!toast || !msgEl || !iconEl) return;

    msgEl.textContent = message;
    toast.className = "toast-notification";

    if (type === "success") {
      toast.classList.add("success");
      iconEl.className = "toast-icon fa-solid fa-circle-check";
    } else if (type === "error") {
      toast.classList.add("error");
      iconEl.className = "toast-icon fa-solid fa-circle-xmark";
    } else {
      toast.classList.add("info");
      iconEl.className = "toast-icon fa-solid fa-circle-info";
    }

    toast.classList.add("show");

    clearTimeout(window.__settingsToastTimer);
    window.__settingsToastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  }

  /* =========================================================
     Profile photo
  ========================================================= */

  function getProfilePhotoKey(user = getLoggedInUser()) {
    return user?.id ? `edumind_profile_photo_${user.id}` : LEGACY_PROFILE_PHOTO_STORAGE_KEY;
  }

  function getSavedProfilePhoto(user = getLoggedInUser()) {
    return localStorage.getItem(getProfilePhotoKey(user))
      || localStorage.getItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY)
      || DEFAULT_PROFILE_IMAGE;
  }

  function saveProfilePhoto(url, user = getLoggedInUser()) {
    localStorage.setItem(getProfilePhotoKey(user), url);
  }

  function applyProfilePhoto(url) {
    const src = url || getSavedProfilePhoto() || DEFAULT_PROFILE_IMAGE;

    [settingsProfileImage, headerProfileImage].forEach((img) => {
      if (!img) return;

      img.src = src;
      img.onerror = function () {
        img.src = DEFAULT_PROFILE_IMAGE;
      };
    });
  }

  function handlePhotoChange(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Please select an image smaller than 2 MB.", "error");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result;

      if (!dataUrl) {
        showToast("The image could not be loaded.", "error");
        return;
      }

      saveProfilePhoto(dataUrl);
      applyProfilePhoto(dataUrl);
      showToast("Profile photo updated successfully.", "success");
    };

    reader.onerror = () => {
      showToast("The image could not be read.", "error");
    };

    reader.readAsDataURL(file);
  }

  /* =========================================================
     UI sync helpers
  ========================================================= */

  function fieldValue(field) {
    return (field?.value || "").trim();
  }

  function calculateProfileCompletion() {
    const fields = [
      settingsFullName,
      settingsEmail,
      settingsCourse,
      settingsCollege,
      settingsStudyTime,
      settingsStudyGoal,
      settingsSubjectFocus
    ].filter(Boolean);

    const completed = fields.filter((field) => fieldValue(field).length > 0).length;
    const percent = fields.length ? Math.round((completed / fields.length) * 100) : 0;

    if (profileCompletionValue) profileCompletionValue.textContent = `${percent}%`;
    if (profileCompletionBar) profileCompletionBar.style.width = `${percent}%`;

    return percent;
  }

  function updateActiveAlertsCount() {
    const count = Array.from(settingsToggles).filter((toggle) => toggle.checked).length;

    if (activeAlertsCount) {
      activeAlertsCount.textContent = String(count);
    }

    return count;
  }

  function updateSecurityStatus(user = getLoggedInUser()) {
    const enabled = Boolean(user?.twoFactorEnabled);

    if (securityStatusText) {
      securityStatusText.textContent = enabled ? "Strong" : "Basic";
    }
  }

  function refreshOverview(user = getLoggedInUser()) {
    calculateProfileCompletion();
    updateActiveAlertsCount();
    updateSecurityStatus(user);
  }

  function fillProfileFields(user) {
    if (!user) return;

    if (settingsFullName) settingsFullName.value = user.fullName || user.name || "";
    if (settingsEmail) settingsEmail.value = user.email || "";
    if (settingsCourse) settingsCourse.value = user.course || user.program || "";
    if (settingsCollege) settingsCollege.value = user.college || user.institute || "";
  }

  function fillStudyPreferenceFields(user) {
    if (!user) return;

    if (settingsStudyTime) {
      settingsStudyTime.value = user.preferredStudyTime || "Morning";
    }

    if (settingsStudyGoal) {
      settingsStudyGoal.value = user.dailyStudyGoal || "2 Hours";
    }

    if (settingsSubjectFocus) {
      settingsSubjectFocus.value = user.preferredSubjectsFocus || "";
    }
  }

  function fillNotificationToggleFields(user) {
    if (!user || !settingsToggles.length) return;

    if (settingsToggles[0]) {
      settingsToggles[0].checked = user.taskRemindersEnabled !== false;
    }

    if (settingsToggles[1]) {
      settingsToggles[1].checked = user.revisionAlertsEnabled !== false;
    }

    if (settingsToggles[2]) {
      settingsToggles[2].checked = user.testNotificationsEnabled !== false;
    }

    if (settingsToggles[3]) {
      settingsToggles[3].checked = Boolean(user.assistantSuggestionsEnabled);
    }
  }

  function updateHeaderProfileMini(user) {
    const toggle = $("profileMenuToggle");

    if (!toggle || !user) return;

    const nameEl = toggle.querySelector("h4");
    const subEl = toggle.querySelector("p");

    if (nameEl) {
      nameEl.textContent = user.fullName || user.name || "Student";
    }

    if (subEl) {
      subEl.textContent = user.course || user.program || "STUDENT";
    }
  }

  function updateTwoFactorUI(user) {
    const enabled = Boolean(user?.twoFactorEnabled);

    if (twofaStatusBanner) twofaStatusBanner.classList.toggle("enabled", enabled);
    if (twofaDot) twofaDot.classList.toggle("enabled", enabled);

    if (twofaStatusLabel) {
      twofaStatusLabel.textContent = enabled ? "2FA Enabled" : "2FA Disabled";
    }

    if (twofaBadge) {
      twofaBadge.textContent = enabled ? "ON" : "OFF";
    }

    if (twoFactorBtn) {
      const span = twoFactorBtn.querySelector("span");
      if (span) {
        span.innerHTML = `
          <i class="fa-solid fa-shield-halved"></i>
          ${enabled ? "Disable Two-Factor Auth" : "Enable Two-Factor Auth"}
        `;
      }
    }

    updateSecurityStatus({ ...(getLoggedInUser() || {}), twoFactorEnabled: enabled });
  }

  function applyUserToUI(user) {
    fillProfileFields(user);
    fillStudyPreferenceFields(user);
    fillNotificationToggleFields(user);
    updateHeaderProfileMini(user);
    updateTwoFactorUI(user);
    applyProfilePhoto();
    refreshOverview(user);
  }

  function markUnsavedChanges() {
    setStatus("Unsaved changes");
    refreshOverview();
  }

  /* =========================================================
     Backend profile
  ========================================================= */

  async function tryRefreshToken() {
    try {
      const localUser = getLoggedInUser();
      const refreshToken = localUser?.refreshToken || localStorage.getItem("edumind_refresh_token");

      if (!refreshToken) {
        window.location.href = "login.html";
        return;
      }

      const response = await fetch("/api/auth/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        window.location.href = "login.html";
        return;
      }

      const data = await response.json();

      if (data.accessToken) {
        const updatedUser = {
          ...(localUser || {}),
          accessToken: data.accessToken
        };

        setLoggedInUser(updatedUser);
        localStorage.setItem("edumind_access_token", data.accessToken);
        localStorage.setItem("token", data.accessToken);

        await loadProfileFromBackend();
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      window.location.href = "login.html";
    }
  }

  async function loadProfileFromBackend() {
    try {
      const response = await fetch("/api/auth/profile", {
        headers: authHeaders()
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          await tryRefreshToken();
          return;
        }

        console.warn("Profile load failed:", result?.message || result);
        loadProfileFromLocalStorage();
        return;
      }

      const localUser = getLoggedInUser() || {};
      const mergedUser = { ...localUser, ...result };

      setLoggedInUser(mergedUser);
      applyUserToUI(mergedUser);
      setStatus("All changes saved.");
    } catch (error) {
      console.error("Profile load error:", error);
      loadProfileFromLocalStorage();
    }
  }

  function loadProfileFromLocalStorage() {
    const localUser = getLoggedInUser();

    if (localUser) {
      applyUserToUI(localUser);
    } else {
      applyProfilePhoto();
      refreshOverview();
    }

    setStatus("All changes saved.");
  }

  function getProfilePayload() {
    return {
      fullName: fieldValue(settingsFullName),
      email: fieldValue(settingsEmail),
      course: fieldValue(settingsCourse),
      college: fieldValue(settingsCollege),
      preferredStudyTime: settingsStudyTime?.value || "Morning",
      dailyStudyGoal: settingsStudyGoal?.value || "2 Hours",
      preferredSubjectsFocus: fieldValue(settingsSubjectFocus),
      taskRemindersEnabled: settingsToggles[0]?.checked ?? true,
      revisionAlertsEnabled: settingsToggles[1]?.checked ?? true,
      testNotificationsEnabled: settingsToggles[2]?.checked ?? true,
      assistantSuggestionsEnabled: settingsToggles[3]?.checked ?? false
    };
  }

  function validateProfilePayload(payload) {
    if (!payload.fullName) return "Full name is required.";
    if (!payload.email) return "Email address is required.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return "Please enter a valid email address.";
    }

    if (!payload.course) return "Course is required.";
    if (!payload.college) return "College is required.";

    return "";
  }

  async function updateProfileOnBackend() {
    const payload = getProfilePayload();
    const validationError = validateProfilePayload(payload);

    if (validationError) {
      showToast(validationError, "error");
      return false;
    }

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          showToast("Your session has expired. Please log in again.", "error");
          return false;
        }

        showToast(result?.message || result || "Unable to update profile.", "error");
        return false;
      }

      const localUser = getLoggedInUser() || {};
      const mergedUser = { ...localUser, ...result };

      setLoggedInUser(mergedUser);
      applyUserToUI(mergedUser);
      setStatus("All changes saved.");

      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      showToast("Network error. Unable to update profile.", "error");
      return false;
    }
  }

  /* =========================================================
     Password
  ========================================================= */

  function getPasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 15;
    if (/[@#$%&*!^()_+=\-]/.test(password)) score += 20;

    return Math.min(score, 100);
  }

  function updatePasswordStrength(password) {
    const score = getPasswordStrength(password || "");

    if (passwordStrengthBar) {
      passwordStrengthBar.style.width = `${score}%`;

      if (score < 50) {
        passwordStrengthBar.style.background = "#ef4444";
      } else if (score < 80) {
        passwordStrengthBar.style.background = "#f59e0b";
      } else {
        passwordStrengthBar.style.background = "linear-gradient(90deg, #10b981, #22d3ee)";
      }
    }

    if (passwordStrengthText) {
      if (!password) {
        passwordStrengthText.textContent =
          "Use 8+ characters with uppercase, lowercase, number, and special character.";
      } else if (score < 50) {
        passwordStrengthText.textContent = "Password strength: Weak";
      } else if (score < 80) {
        passwordStrengthText.textContent = "Password strength: Medium";
      } else {
        passwordStrengthText.textContent = "Password strength: Strong";
      }
    }
  }

  function openPasswordForm() {
    if (!changePasswordForm) return;

    changePasswordForm.hidden = false;
    changePasswordForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
    currentPasswordInput?.focus();
  }

  function closePasswordForm() {
    if (!changePasswordForm) return;

    changePasswordForm.hidden = true;

    if (currentPasswordInput) currentPasswordInput.value = "";
    if (newPasswordInput) newPasswordInput.value = "";
    if (confirmNewPasswordInput) confirmNewPasswordInput.value = "";

    updatePasswordStrength("");
  }

  async function changePasswordOnBackend() {
    const currentPassword = fieldValue(currentPasswordInput);
    const newPassword = fieldValue(newPasswordInput);
    const confirmPassword = fieldValue(confirmNewPasswordInput);

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill all password fields.", "error");
      return false;
    }

    const strongPasswordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%&*!^()_+=\-]).{8,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      showToast(
        "Password must include 8+ characters, uppercase, lowercase, number, and special character.",
        "error"
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      showToast("New password and confirmation password do not match.", "error");
      return false;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword: confirmPassword
        })
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          showToast("Your session has expired. Please log in again.", "error");
          return false;
        }

        showToast(result?.message || result || "Unable to update password.", "error");
        return false;
      }

      closePasswordForm();
      showToast(result?.message || "Password updated successfully.", "success");
      return true;
    } catch (error) {
      console.error("Password update error:", error);
      showToast("Network error. Unable to update password.", "error");
      return false;
    }
  }

  /* =========================================================
     OTP / 2FA
  ========================================================= */

  function maskEmail(email) {
    if (!email || !email.includes("@")) return "your registered email";

    const [name, domain] = email.split("@");
    const visibleStart = name.slice(0, 2);
    const visibleEnd = name.slice(-1);
    const hidden = "*".repeat(Math.max(name.length - 3, 2));

    return `${visibleStart}${hidden}${visibleEnd}@${domain}`;
  }

  function getOTPValue() {
    return Array.from(otpBoxes).map((box) => box.value).join("");
  }

  function clearOTPInputs() {
    otpBoxes.forEach((box) => {
      box.value = "";
      box.classList.remove("filled", "error");
    });

    if (otpErrorMsg) otpErrorMsg.textContent = "";
  }

  function shakeOTPInputs() {
    otpBoxes.forEach((box) => {
      box.classList.add("error");
      setTimeout(() => box.classList.remove("error"), 500);
    });
  }

  function open2FAModal() {
    clearOTPInputs();

    if (maskedEmailDisplay) {
      const email = fieldValue(settingsEmail) || getLoggedInUser()?.email || "";
      maskedEmailDisplay.textContent = maskEmail(email);
    }

    twofaModalOverlay?.classList.add("open");
  }

  function close2FAModal() {
    twofaModalOverlay?.classList.remove("open");
    clearOTPInputs();
  }

  function setupOTPInputs() {
    otpBoxes.forEach((box, index) => {
      box.addEventListener("input", () => {
        box.value = box.value.replace(/[^0-9]/g, "").slice(-1);
        box.classList.toggle("filled", Boolean(box.value));
        box.classList.remove("error");

        if (box.value && index < otpBoxes.length - 1) {
          otpBoxes[index + 1].focus();
        }
      });

      box.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !box.value && index > 0) {
          otpBoxes[index - 1].value = "";
          otpBoxes[index - 1].classList.remove("filled");
          otpBoxes[index - 1].focus();
        }
      });

      box.addEventListener("paste", (event) => {
        event.preventDefault();

        const pasted = (event.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, otpBoxes.length);

        pasted.split("").forEach((char, pasteIndex) => {
          if (otpBoxes[pasteIndex]) {
            otpBoxes[pasteIndex].value = char;
            otpBoxes[pasteIndex].classList.add("filled");
          }
        });

        otpBoxes[Math.min(pasted.length, otpBoxes.length - 1)]?.focus();
      });
    });
  }

  async function sendOtpToEmail() {
    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: authHeaders()
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        showToast(result?.message || result || "Unable to send OTP.", "error");
        return false;
      }

      if (maskedEmailDisplay) {
        maskedEmailDisplay.textContent =
          result?.maskedEmail || maskEmail(fieldValue(settingsEmail) || getLoggedInUser()?.email || "");
      }

      showToast(result?.message || "OTP has been sent to your email.", "success");
      return true;
    } catch (error) {
      console.error("OTP send error:", error);
      showToast("Network error. Unable to send OTP.", "error");
      return false;
    }
  }

  async function verifyOtpAndEnable2FA() {
    const otp = getOTPValue();

    if (otp.length !== 6) {
      if (otpErrorMsg) otpErrorMsg.textContent = "Please enter the complete 6-digit OTP.";
      shakeOTPInputs();
      return false;
    }

    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ otp })
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        const message = result?.message || result || "Invalid OTP. Please try again.";

        if (otpErrorMsg) otpErrorMsg.textContent = message;
        shakeOTPInputs();
        return false;
      }

      const localUser = getLoggedInUser() || {};
      const updatedUser = { ...localUser, twoFactorEnabled: true };

      setLoggedInUser(updatedUser);
      updateTwoFactorUI(updatedUser);
      refreshOverview(updatedUser);
      close2FAModal();

      showToast("Two-Factor Authentication enabled successfully.", "success");
      return true;
    } catch (error) {
      console.error("OTP verification error:", error);

      if (otpErrorMsg) {
        otpErrorMsg.textContent = "Network error. Please try again.";
      }

      shakeOTPInputs();
      return false;
    }
  }

  async function disable2FAOnBackend() {
    try {
      const response = await fetch("/api/otp/disable", {
        method: "POST",
        headers: authHeaders()
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        showToast(result?.message || result || "Unable to disable 2FA.", "error");
        return false;
      }

      const localUser = getLoggedInUser() || {};
      const updatedUser = { ...localUser, twoFactorEnabled: false };

      setLoggedInUser(updatedUser);
      updateTwoFactorUI(updatedUser);
      refreshOverview(updatedUser);

      showToast("Two-Factor Authentication disabled.", "success");
      return true;
    } catch (error) {
      console.error("2FA disable error:", error);
      showToast("Network error. Unable to disable 2FA.", "error");
      return false;
    }
  }

  /* =========================================================
     Delete account
  ========================================================= */

  async function deleteAccountOnBackend() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return false;

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: authHeaders()
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        showToast(result?.message || result || "Account was not deleted.", "error");
        return false;
      }

      localStorage.removeItem(getProfilePhotoKey());
      localStorage.removeItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY);
      clearAuthStorage();

      alert(result?.message || "Account deleted successfully.");
      window.location.href = "login.html";
      return true;
    } catch (error) {
      console.error("Delete account error:", error);
      showToast("Network error. Account was not deleted.", "error");
      return false;
    }
  }

  /* =========================================================
     Profile dropdown
  ========================================================= */

  function bindProfileDropdown() {
  const toggle = document.getElementById("profileMenuToggle");
  const dropdown = document.getElementById("dashboardProfileDropdown");

  if (!toggle || !dropdown) {
    console.warn("Profile dropdown elements not found.");
    return;
  }

  function openDropdown() {
    dropdown.classList.remove("hidden");
    dropdown.style.display = "flex";
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeDropdown() {
    dropdown.classList.add("hidden");
    dropdown.style.display = "none";
    toggle.setAttribute("aria-expanded", "false");
  }

  function toggleDropdown(event) {
    event.preventDefault();
    event.stopPropagation();

    const isHidden =
      dropdown.classList.contains("hidden") ||
      window.getComputedStyle(dropdown).display === "none";

    if (isHidden) {
      openDropdown();
    } else {
      closeDropdown();
    }
  }

  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("tabindex", "0");

  closeDropdown();

  toggle.addEventListener("click", toggleDropdown);

  toggle.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      toggleDropdown(event);
    }

    if (event.key === "Escape") {
      closeDropdown();
    }
  });

  dropdown.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  document.addEventListener("click", function (event) {
    if (!toggle.contains(event.target) && !dropdown.contains(event.target)) {
      closeDropdown();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeDropdown();
    }
  });
}

  /* =========================================================
     Buttons
  ========================================================= */

  function setButtonLoading(button, isLoading, loadingText, defaultText) {
    if (!button) return;

    button.disabled = isLoading;

    const icon = button.querySelector("i");
    const span = button.querySelector("span");

    if (icon && !icon.dataset.defaultClass) {
      icon.dataset.defaultClass = icon.className;
    }

    if (icon) {
      icon.className = isLoading ? "fa-solid fa-spinner fa-spin" : icon.dataset.defaultClass;
    }

    if (span) {
      span.textContent = isLoading ? loadingText : defaultText;
    }
  }

  /* =========================================================
     Event listeners
  ========================================================= */

  function setupEventListeners() {
    [
      settingsFullName,
      settingsEmail,
      settingsCourse,
      settingsCollege,
      settingsStudyTime,
      settingsStudyGoal,
      settingsSubjectFocus
    ].forEach((field) => {
      field?.addEventListener("input", markUnsavedChanges);
      field?.addEventListener("change", markUnsavedChanges);
    });

    settingsToggles.forEach((toggle) => {
      toggle.addEventListener("change", () => {
        updateActiveAlertsCount();
        setStatus("Unsaved changes");
      });
    });

    changePhotoBtn?.addEventListener("click", () => profilePhotoInput?.click());
    avatarOverlay?.addEventListener("click", () => profilePhotoInput?.click());

    profilePhotoInput?.addEventListener("change", (event) => {
      handlePhotoChange(event.target.files?.[0]);
      profilePhotoInput.value = "";
    });

    changePasswordBtn?.addEventListener("click", openPasswordForm);
    cancelPasswordBtn?.addEventListener("click", closePasswordForm);

    newPasswordInput?.addEventListener("input", () => {
      updatePasswordStrength(newPasswordInput.value);
    });

    updatePasswordBtn?.addEventListener("click", async function () {
      setButtonLoading(this, true, "Updating...", "Update Password");
      await changePasswordOnBackend();
      setButtonLoading(this, false, "Updating...", "Update Password");
    });

    twoFactorBtn?.addEventListener("click", async function () {
      const user = getLoggedInUser();
      const enabled = Boolean(user?.twoFactorEnabled);

      if (enabled) {
        this.disabled = true;
        await disable2FAOnBackend();
        this.disabled = false;
      } else {
        open2FAModal();
      }
    });

    sendOtpBtn?.addEventListener("click", async function () {
      const span = this.querySelector("span") || this;
      const defaultText = span.textContent || "Send OTP";

      this.disabled = true;
      span.textContent = "Sending...";

      const sent = await sendOtpToEmail();

      span.textContent = sent ? "Resend OTP" : defaultText;
      this.disabled = false;

      if (sent) otpBoxes[0]?.focus();
    });

    verify2FABtn?.addEventListener("click", async function () {
      const span = this.querySelector("span");

      this.disabled = true;
      if (span) span.textContent = "Verifying...";

      await verifyOtpAndEnable2FA();

      if (span) span.textContent = "Verify & Enable";
      this.disabled = false;
    });

    twofaModalClose?.addEventListener("click", close2FAModal);
    twofaModalCancel?.addEventListener("click", close2FAModal);

    twofaModalOverlay?.addEventListener("click", (event) => {
      if (event.target === twofaModalOverlay) {
        close2FAModal();
      }
    });

    deleteAccountBtn?.addEventListener("click", async function () {
      this.disabled = true;
      await deleteAccountOnBackend();
      this.disabled = false;
    });

    saveSettingsBtn?.addEventListener("click", async function () {
      setButtonLoading(this, true, "Saving...", "Save Changes");
      setStatus("Saving changes...");

      const saved = await updateProfileOnBackend();

      if (saved) {
        showToast("Settings saved successfully.", "success");
      } else {
        setStatus("Unable to save changes.");
      }

      setButtonLoading(this, false, "Saving...", "Save Changes");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close2FAModal();
      }
    });
  }

  /* =========================================================
     Init
  ========================================================= */

  function init() {
    setupOTPInputs();
    bindProfileDropdown();
    setupEventListeners();

    applyProfilePhoto();
    refreshOverview();
    loadProfileFromBackend();
  }

  init();
});