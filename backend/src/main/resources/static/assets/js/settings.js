document.addEventListener("DOMContentLoaded", function () {

     /* =============================================
        ELEMENT REFS
        ============================================= */
     const saveSettingsBtn       = document.getElementById("saveSettingsBtn");
     const settingsSaveStatus    = document.getElementById("settingsSaveStatus");

     const settingsFullName      = document.getElementById("settingsFullName");
     const settingsEmail         = document.getElementById("settingsEmail");
     const settingsCourse        = document.getElementById("settingsCourse");
     const settingsCollege       = document.getElementById("settingsCollege");

     const settingsStudyTime     = document.getElementById("settingsStudyTime");
     const settingsStudyGoal     = document.getElementById("settingsStudyGoal");
     const settingsSubjectFocus  = document.getElementById("settingsSubjectFocus");

     const settingsToggles       = document.querySelectorAll(".settings-toggle-item input[type='checkbox']");

     const changePhotoBtn        = document.getElementById("changePhotoBtn");
     const profilePhotoInput     = document.getElementById("profilePhotoInput");
     const settingsProfileImage  = document.getElementById("settingsProfileImage");
     const headerProfileImage    = document.getElementById("headerProfileImage");
     const avatarOverlay         = document.getElementById("avatarOverlay");

     const changePasswordBtn     = document.getElementById("changePasswordBtn");
     const twoFactorBtn          = document.getElementById("twoFactorBtn");
     const deleteAccountBtn      = document.getElementById("deleteAccountBtn");

     const changePasswordForm    = document.getElementById("changePasswordForm");
     const currentPasswordInput  = document.getElementById("currentPassword");
     const newPasswordInput      = document.getElementById("newPassword");
     const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
     const cancelPasswordBtn     = document.getElementById("cancelPasswordBtn");
     const updatePasswordBtn     = document.getElementById("updatePasswordBtn");

     // 2FA modal
     const twofaModalOverlay     = document.getElementById("twofaModalOverlay");
     const twofaModalClose       = document.getElementById("twofaModalClose");
     const twofaModalCancel      = document.getElementById("twofaModalCancel");
     const verify2FABtn          = document.getElementById("verify2FABtn");
     const secretKeyBox          = document.getElementById("secretKeyBox");
     const secretKeyText         = document.getElementById("secretKeyText");
     const otpErrorMsg           = document.getElementById("otpErrorMsg");
     const otpBoxes              = document.querySelectorAll(".otp-box");

     // 2FA status elements
     const twofaStatusBanner     = document.getElementById("twofaStatusBanner");
     const twofaDot              = document.getElementById("twofaDot");
     const twofaStatusLabel      = document.getElementById("twofaStatusLabel");
     const twofaBadge            = document.getElementById("twofaBadge");

     const DEFAULT_PROFILE_IMAGE             = "../assets/avatar/default-user.png";
     const LEGACY_PROFILE_PHOTO_STORAGE_KEY  = "edumind_profile_photo";

     /* =============================================
        TOAST — replaces showSaveStatus for user-facing messages
        ============================================= */
     function showToast(message, type = "success") {
          const toast   = document.getElementById("toastNotification");
          const msgEl   = document.getElementById("toastMsg");
          const iconEl  = document.getElementById("toastIcon");

          if (!toast) return;

          msgEl.textContent = message;
          toast.className   = "toast-notification";

          if (type === "success") {
               toast.classList.add("success");
               iconEl.className = "toast-icon fa-solid fa-circle-check";
          } else if (type === "error") {
               toast.classList.add("error");
               iconEl.className = "toast-icon fa-solid fa-circle-xmark";
          } else {
               iconEl.className = "toast-icon fa-solid fa-circle-info";
          }

          toast.classList.add("show");
          clearTimeout(window._toastHideTimer);

          window._toastHideTimer = setTimeout(() => {
               toast.classList.remove("show");
               toast.classList.add("hide");
               setTimeout(() => toast.className = "toast-notification", 350);
          }, 3000);
     }

     // Kept for backward compat with any internal callers
     function showSaveStatus(message, isSuccess = true) {
          showToast(message, isSuccess ? "success" : "error");
     }

     /* =============================================
        AUTH / STORAGE HELPERS
        ============================================= */
     function getLoggedInUser() {
          const rawUser = localStorage.getItem("edumind_logged_in_user");
          if (!rawUser) return null;
          try { return JSON.parse(rawUser); }
          catch { return null; }
     }

     function setLoggedInUser(user) {
          localStorage.setItem("edumind_logged_in_user", JSON.stringify(user));
     }

     function clearAuthStorage() {
          localStorage.removeItem("edumind_logged_in_user");
          localStorage.removeItem("edumind_is_logged_in");
     }

     function getProfilePhotoStorageKey(user = getLoggedInUser()) {
          return user?.id ? `edumind_profile_photo_${user.id}` : LEGACY_PROFILE_PHOTO_STORAGE_KEY;
     }

     function getSavedProfilePhoto(user = getLoggedInUser()) {
          const key   = getProfilePhotoStorageKey(user);
          return localStorage.getItem(key) || localStorage.getItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY);
     }

     function saveProfilePhoto(photoUrl, user = getLoggedInUser()) {
          localStorage.setItem(getProfilePhotoStorageKey(user), photoUrl);
     }

     function removeSavedProfilePhoto(user = getLoggedInUser()) {
          localStorage.removeItem(getProfilePhotoStorageKey(user));
     }

     function applyProfilePhoto(photoUrl) {
          const final = photoUrl || DEFAULT_PROFILE_IMAGE;
          if (settingsProfileImage) settingsProfileImage.src = final;
          if (headerProfileImage)   headerProfileImage.src   = final;
     }

     function loadSavedProfilePhoto() {
          applyProfilePhoto(getSavedProfilePhoto(getLoggedInUser()));
     }

     /* =============================================
        FILL FIELDS
        ============================================= */
     function fillProfileFields(user) {
          if (!user) return;
          if (settingsFullName) settingsFullName.value = user.fullName || "";
          if (settingsEmail)    settingsEmail.value    = user.email    || "";
          if (settingsCourse)   settingsCourse.value   = user.course   || "";
          if (settingsCollege)  settingsCollege.value  = user.college  || "";
     }

     function fillStudyPreferenceFields(user) {
          if (!user) return;
          if (settingsStudyTime)    settingsStudyTime.value    = user.preferredStudyTime   || "Morning";
          if (settingsStudyGoal)    settingsStudyGoal.value    = user.dailyStudyGoal       || "2 Hours";
          if (settingsSubjectFocus) settingsSubjectFocus.value = user.preferredSubjectsFocus || "";
     }

     function fillNotificationToggleFields(user) {
          if (!user || !settingsToggles.length) return;
          if (settingsToggles[0]) settingsToggles[0].checked = Boolean(user.taskRemindersEnabled);
          if (settingsToggles[1]) settingsToggles[1].checked = Boolean(user.revisionAlertsEnabled);
          if (settingsToggles[2]) settingsToggles[2].checked = Boolean(user.testNotificationsEnabled);
          if (settingsToggles[3]) settingsToggles[3].checked = Boolean(user.assistantSuggestionsEnabled);
     }

     function updateHeaderProfileMini(user) {
          const el = document.getElementById("profileMenuToggle");
          if (!el || !user) return;
          const nameEl = el.querySelector("h4");
          const subEl  = el.querySelector("p");
          if (nameEl) nameEl.textContent = user.fullName || "Student";
          if (subEl)  subEl.textContent  = user.course   || "Student";
     }

     /* =============================================
        2FA UI UPDATE
        ============================================= */
     function updateTwoFactorUI(user) {
          if (!user) return;
          const enabled = Boolean(user.twoFactorEnabled);

          // Banner
          if (twofaStatusBanner) {
               twofaStatusBanner.classList.toggle("enabled", enabled);
          }
          if (twofaStatusLabel) {
               twofaStatusLabel.textContent = enabled ? "2FA Enabled" : "2FA Disabled";
          }
          if (twofaBadge) {
               twofaBadge.textContent = enabled ? "ON" : "OFF";
          }

          // Button text
          if (twoFactorBtn) {
               const span = twoFactorBtn.querySelector("span");
               if (span) span.textContent = enabled ? "Disable Two-Factor Auth" : "Enable Two-Factor Auth";
          }
     }

     /* =============================================
        API HELPER
        ============================================= */
     async function parseResponse(response) {
          const ct = response.headers.get("content-type") || "";
          return ct.includes("application/json") ? await response.json() : await response.text();
     }

     /* =============================================
        PHOTO UPLOAD
        ============================================= */
     function handleProfilePhotoSelection(file) {
          if (!file) return;
          if (!file.type.startsWith("image/")) {
               showToast("Please select a valid image file.", "error");
               return;
          }
          if (file.size > 2 * 1024 * 1024) {
               showToast("Image size should be less than 2 MB.", "error");
               return;
          }

          const reader = new FileReader();
          reader.onload = function (e) {
               const dataUrl = e.target?.result;
               if (!dataUrl) { showToast("Failed to load image.", "error"); return; }
               saveProfilePhoto(dataUrl, getLoggedInUser());
               applyProfilePhoto(dataUrl);
               showToast("Profile photo updated!", "success");
          };
          reader.onerror = () => showToast("Failed to read image.", "error");
          reader.readAsDataURL(file);
     }

     /* =============================================
        PASSWORD FORM
        ============================================= */
     function clearPasswordFields() {
          if (currentPasswordInput)   currentPasswordInput.value   = "";
          if (newPasswordInput)       newPasswordInput.value       = "";
          if (confirmNewPasswordInput) confirmNewPasswordInput.value = "";
     }

     function openChangePasswordForm() {
          if (!changePasswordForm) return;
          changePasswordForm.style.display = "block";
          changePasswordForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
     }

     function closeChangePasswordForm() {
          if (!changePasswordForm) return;
          changePasswordForm.style.display = "none";
          clearPasswordFields();
     }

     /* =============================================
        OTP INPUT LOGIC
        ============================================= */
     function setupOTPInputs() {
          otpBoxes.forEach((box, idx) => {
               // Only allow digits
               box.addEventListener("input", () => {
                    box.value = box.value.replace(/[^0-9]/g, "").slice(-1);
                    if (box.value) {
                         box.classList.add("filled");
                         box.classList.remove("error");
                         if (idx < otpBoxes.length - 1) otpBoxes[idx + 1].focus();
                    } else {
                         box.classList.remove("filled");
                    }
               });

               // Backspace to previous
               box.addEventListener("keydown", (e) => {
                    if (e.key === "Backspace" && !box.value && idx > 0) {
                         otpBoxes[idx - 1].focus();
                         otpBoxes[idx - 1].value = "";
                         otpBoxes[idx - 1].classList.remove("filled");
                    }
               });

               // Handle paste
               box.addEventListener("paste", (e) => {
                    e.preventDefault();
                    const pasted = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
                    [...pasted].forEach((char, i) => {
                         if (otpBoxes[i]) {
                              otpBoxes[i].value = char;
                              otpBoxes[i].classList.add("filled");
                         }
                    });
                    const next = Math.min(pasted.length, otpBoxes.length - 1);
                    otpBoxes[next].focus();
               });
          });
     }

     function getOTPValue() {
          return [...otpBoxes].map(b => b.value).join("");
     }

     function clearOTPInputs() {
          otpBoxes.forEach(b => {
               b.value = "";
               b.classList.remove("filled", "error");
          });
          if (otpErrorMsg) otpErrorMsg.textContent = "";
     }

     function shakeOTPInputs() {
          otpBoxes.forEach(b => {
               b.classList.add("error");
               setTimeout(() => b.classList.remove("error"), 500);
          });
     }

     /* =============================================
        2FA MODAL
        ============================================= */
     function open2FAModal() {
          clearOTPInputs();
          if (twofaModalOverlay) twofaModalOverlay.classList.add("open");
          setTimeout(() => otpBoxes[0]?.focus(), 200);

          // In production: fetch QR + secret from backend then set:
          // fetch(`/api/auth/two-factor/${user.id}/setup`)
          //   .then(r => r.json())
          //   .then(data => {
          //     secretKeyText.textContent = data.secret;
          //     document.getElementById('qrCodeImg').innerHTML = `<img src="${data.qrCodeUrl}" />`;
          //   });
     }

     function close2FAModal() {
          if (twofaModalOverlay) twofaModalOverlay.classList.remove("open");
          clearOTPInputs();
     }

     if (twofaModalClose)  twofaModalClose.addEventListener("click",  close2FAModal);
     if (twofaModalCancel) twofaModalCancel.addEventListener("click", close2FAModal);

     // Close on backdrop click
     if (twofaModalOverlay) {
          twofaModalOverlay.addEventListener("click", function (e) {
               if (e.target === twofaModalOverlay) close2FAModal();
          });
     }

     // Copy secret key
     if (secretKeyBox) {
          secretKeyBox.addEventListener("click", () => {
               navigator.clipboard.writeText(secretKeyText?.textContent || "")
                    .then(() => showToast("Secret key copied to clipboard!", "success"))
                    .catch(() => showToast("Copy failed. Please copy manually.", "error"));
          });
     }

     /* =============================================
        BACKEND CALLS
        ============================================= */
     async function loadProfileFromBackend() {
          const user = getLoggedInUser();
          if (!user?.id) { showToast("Logged-in user not found.", "error"); return; }

          try {
               const res    = await fetch(`/api/auth/profile/${user.id}`);
               const result = await parseResponse(res);

               if (!res.ok) {
                    showToast(typeof result === "string" ? result : result.message || "Failed to load profile.", "error");
                    return;
               }

               const latest = { ...user, ...result };
               setLoggedInUser(latest);
               fillProfileFields(latest);
               fillStudyPreferenceFields(latest);
               fillNotificationToggleFields(latest);
               updateHeaderProfileMini(latest);
               updateTwoFactorUI(latest);
               loadSavedProfilePhoto();
          } catch (err) {
               console.error("Profile load error:", err);
               // Silently fall back to local data on load
               const user = getLoggedInUser();
               if (user) {
                    fillProfileFields(user);
                    fillStudyPreferenceFields(user);
                    fillNotificationToggleFields(user);
                    updateHeaderProfileMini(user);
                    updateTwoFactorUI(user);
                    loadSavedProfilePhoto();
               }
          }
     }

     async function updateProfileOnBackend() {
          const user = getLoggedInUser();
          if (!user?.id) { showToast("Logged-in user not found.", "error"); return false; }

          const payload = {
               fullName:                   settingsFullName?.value.trim()        || "",
               email:                      settingsEmail?.value.trim()            || "",
               course:                     settingsCourse?.value.trim()           || "",
               college:                    settingsCollege?.value.trim()          || "",
               preferredStudyTime:         settingsStudyTime?.value               || "Morning",
               dailyStudyGoal:             settingsStudyGoal?.value               || "2 Hours",
               preferredSubjectsFocus:     settingsSubjectFocus?.value.trim()     || "",
               taskRemindersEnabled:       settingsToggles[0]?.checked            ?? true,
               revisionAlertsEnabled:      settingsToggles[1]?.checked            ?? true,
               testNotificationsEnabled:   settingsToggles[2]?.checked            ?? true,
               assistantSuggestionsEnabled: settingsToggles[3]?.checked           ?? false
          };

          if (!payload.fullName || !payload.email || !payload.course || !payload.college) {
               showToast("Please fill in all profile fields.", "error");
               return false;
          }

          try {
               const res    = await fetch(`/api/auth/profile/${user.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
               });
               const result = await parseResponse(res);

               if (!res.ok) {
                    showToast(typeof result === "string" ? result : result.message || "Failed to update settings.", "error");
                    return false;
               }

               const updated = { ...user, ...result };
               setLoggedInUser(updated);
               fillProfileFields(updated);
               fillStudyPreferenceFields(updated);
               fillNotificationToggleFields(updated);
               updateHeaderProfileMini(updated);
               updateTwoFactorUI(updated);
               loadSavedProfilePhoto();
               return true;
          } catch (err) {
               console.error("Profile update error:", err);
               showToast("Something went wrong while updating settings.", "error");
               return false;
          }
     }

     async function updatePasswordOnBackend() {
          const user = getLoggedInUser();
          if (!user?.id) { showToast("Logged-in user not found.", "error"); return false; }

          const current  = currentPasswordInput?.value.trim()       || "";
          const newP     = newPasswordInput?.value.trim()            || "";
          const confirm  = confirmNewPasswordInput?.value.trim()     || "";

          if (!current || !newP || !confirm) { showToast("Please fill in all password fields.", "error"); return false; }
          if (newP.length < 6)               { showToast("New password must be at least 6 characters.", "error"); return false; }
          if (newP !== confirm)              { showToast("New passwords do not match.", "error"); return false; }

          try {
               const res    = await fetch(`/api/auth/change-password/${user.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentPassword: current, newPassword: newP, confirmNewPassword: confirm })
               });
               const result = await parseResponse(res);

               if (!res.ok) {
                    showToast(typeof result === "string" ? result : result.message || "Failed to update password.", "error");
                    return false;
               }

               closeChangePasswordForm();
               showToast(typeof result === "string" ? result : result.message || "Password updated successfully.", "success");
               return true;
          } catch (err) {
               console.error("Password update error:", err);
               showToast("Something went wrong while updating password.", "error");
               return false;
          }
     }

     async function updateTwoFactorOnBackend() {
          const user = getLoggedInUser();
          if (!user?.id) { showToast("Logged-in user not found.", "error"); return false; }

          const nextStatus = !Boolean(user.twoFactorEnabled);

          try {
               const res    = await fetch(`/api/auth/two-factor/${user.id}?enabled=${nextStatus}`, { method: "PUT" });
               const result = await parseResponse(res);

               if (!res.ok) {
                    showToast(typeof result === "string" ? result : result.message || "Failed to update 2FA.", "error");
                    return false;
               }

               const updated = { ...user, ...result };
               setLoggedInUser(updated);
               updateHeaderProfileMini(updated);
               updateTwoFactorUI(updated);
               showToast(
                    updated.twoFactorEnabled
                         ? "Two-factor authentication enabled successfully."
                         : "Two-factor authentication disabled successfully.",
                    "success"
               );
               return true;
          } catch (err) {
               console.error("2FA update error:", err);
               showToast("Something went wrong while updating 2FA.", "error");
               return false;
          }
     }

     async function verify2FAOnBackend() {
          const user = getLoggedInUser();
          if (!user?.id) { showToast("Logged-in user not found.", "error"); return false; }

          const token = getOTPValue();
          if (token.length !== 6) {
               if (otpErrorMsg) otpErrorMsg.textContent = "Please enter the complete 6-digit code.";
               shakeOTPInputs();
               return false;
          }

          try {
               const res    = await fetch(`/api/auth/two-factor/${user.id}/verify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token })
               });
               const result = await parseResponse(res);

               if (!res.ok) {
                    const msg = typeof result === "string" ? result : result.message || "Invalid code. Please try again.";
                    if (otpErrorMsg) otpErrorMsg.textContent = msg;
                    shakeOTPInputs();
                    return false;
               }

               const updated = { ...user, twoFactorEnabled: true, ...result };
               setLoggedInUser(updated);
               updateTwoFactorUI(updated);
               close2FAModal();
               showToast("Two-factor authentication enabled!", "success");
               return true;
          } catch (err) {
               console.error("2FA verify error:", err);
               if (otpErrorMsg) otpErrorMsg.textContent = "Something went wrong. Please try again.";
               shakeOTPInputs();
               return false;
          }
     }

     async function deleteAccountOnBackend() {
          const user = getLoggedInUser();
          if (!user?.id) { showToast("Logged-in user not found.", "error"); return false; }

          const confirmed = window.confirm("Are you sure you want to delete your account? This cannot be undone.");
          if (!confirmed) return false;

          try {
               const res    = await fetch(`/api/auth/delete-account/${user.id}`, { method: "DELETE" });
               const result = await parseResponse(res);

               if (!res.ok) {
                    showToast(typeof result === "string" ? result : result.message || "Failed to delete account.", "error");
                    return false;
               }

               removeSavedProfilePhoto(user);
               localStorage.removeItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY);
               clearAuthStorage();
               alert(typeof result === "string" ? result : "Account deleted successfully.");
               window.location.href = "login.html";
               return true;
          } catch (err) {
               console.error("Delete account error:", err);
               showToast("Something went wrong while deleting account.", "error");
               return false;
          }
     }

     /* =============================================
        EVENT LISTENERS
        ============================================= */

     // Photo
     if (changePhotoBtn && profilePhotoInput) {
          changePhotoBtn.addEventListener("click", () => profilePhotoInput.click());
          if (avatarOverlay) avatarOverlay.addEventListener("click", () => profilePhotoInput.click());

          profilePhotoInput.addEventListener("change", function (e) {
               handleProfilePhotoSelection(e.target.files?.[0]);
               profilePhotoInput.value = "";
          });
     }

     // Password
     if (changePasswordBtn) {
          changePasswordBtn.addEventListener("click", openChangePasswordForm);
     }
     if (cancelPasswordBtn) {
          cancelPasswordBtn.addEventListener("click", closeChangePasswordForm);
     }
     if (updatePasswordBtn) {
          updatePasswordBtn.addEventListener("click", async function () {
               this.disabled = true;
               await updatePasswordOnBackend();
               this.disabled = false;
          });
     }

     // 2FA button — if already enabled → call disable directly; if disabled → open modal
     if (twoFactorBtn) {
          twoFactorBtn.addEventListener("click", async function () {
               const user    = getLoggedInUser();
               const enabled = Boolean(user?.twoFactorEnabled);

               if (enabled) {
                    // Disable directly (no OTP needed for disable in this flow)
                    this.disabled = true;
                    await updateTwoFactorOnBackend();
                    this.disabled = false;
               } else {
                    open2FAModal();
               }
          });
     }

     // Verify 2FA
     if (verify2FABtn) {
          verify2FABtn.addEventListener("click", async function () {
               this.disabled = true;
               const span = this.querySelector("span");
               if (span) span.textContent = "Verifying…";
               await verify2FAOnBackend();
               if (span) span.textContent = "Verify & Enable";
               this.disabled = false;
          });
     }

     // Delete account
     if (deleteAccountBtn) {
          deleteAccountBtn.addEventListener("click", async function () {
               this.disabled = true;
               await deleteAccountOnBackend();
               this.disabled = false;
          });
     }

     // Save all settings
     if (saveSettingsBtn) {
          saveSettingsBtn.addEventListener("click", async function () {
               const icon = this.querySelector("i");
               if (icon) icon.className = "fa-solid fa-spinner fa-spin";
               this.disabled = true;

               const ok = await updateProfileOnBackend();
               if (ok) showToast("All settings saved successfully!", "success");

               if (icon) icon.className = "fa-solid fa-floppy-disk";
               this.disabled = false;
          });
     }

     // Keyboard: Escape closes modal
     document.addEventListener("keydown", (e) => {
          if (e.key === "Escape") close2FAModal();
     });

     /* =============================================
        INIT
        ============================================= */
     setupOTPInputs();
     loadSavedProfilePhoto();
     loadProfileFromBackend();

});