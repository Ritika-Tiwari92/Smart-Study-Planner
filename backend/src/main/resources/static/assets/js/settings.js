document.addEventListener("DOMContentLoaded", function () {

     /* =============================================
        ELEMENT REFS
        ============================================= */
     const saveSettingsBtn         = document.getElementById("saveSettingsBtn");
     const settingsFullName        = document.getElementById("settingsFullName");
     const settingsEmail           = document.getElementById("settingsEmail");
     const settingsCourse          = document.getElementById("settingsCourse");
     const settingsCollege         = document.getElementById("settingsCollege");
     const settingsStudyTime       = document.getElementById("settingsStudyTime");
     const settingsStudyGoal       = document.getElementById("settingsStudyGoal");
     const settingsSubjectFocus    = document.getElementById("settingsSubjectFocus");
     const settingsToggles         = document.querySelectorAll(".settings-toggle-item input[type='checkbox']");

     const changePhotoBtn          = document.getElementById("changePhotoBtn");
     const profilePhotoInput       = document.getElementById("profilePhotoInput");
     const settingsProfileImage    = document.getElementById("settingsProfileImage");
     const headerProfileImage      = document.getElementById("headerProfileImage");
     const avatarOverlay           = document.getElementById("avatarOverlay");

     const changePasswordBtn       = document.getElementById("changePasswordBtn");
     const twoFactorBtn            = document.getElementById("twoFactorBtn");
     const deleteAccountBtn        = document.getElementById("deleteAccountBtn");
     const changePasswordForm      = document.getElementById("changePasswordForm");
     const currentPasswordInput    = document.getElementById("currentPassword");
     const newPasswordInput        = document.getElementById("newPassword");
     const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
     const cancelPasswordBtn       = document.getElementById("cancelPasswordBtn");
     const updatePasswordBtn       = document.getElementById("updatePasswordBtn");

     // 2FA modal refs
     const twofaModalOverlay  = document.getElementById("twofaModalOverlay");
     const twofaModalClose    = document.getElementById("twofaModalClose");
     const twofaModalCancel   = document.getElementById("twofaModalCancel");
     const verify2FABtn       = document.getElementById("verify2FABtn");
     const sendOtpBtn         = document.getElementById("sendOtpBtn");
     const secretKeyBox       = document.getElementById("secretKeyBox");
     const otpErrorMsg        = document.getElementById("otpErrorMsg");
     const otpBoxes           = document.querySelectorAll(".otp-box");
     const maskedEmailDisplay = document.getElementById("maskedEmailDisplay");

     // 2FA status elements
     const twofaStatusBanner = document.getElementById("twofaStatusBanner");
     const twofaStatusLabel  = document.getElementById("twofaStatusLabel");
     const twofaBadge        = document.getElementById("twofaBadge");

     const DEFAULT_PROFILE_IMAGE            = "../assets/avatar/default-user.png";
     const LEGACY_PROFILE_PHOTO_STORAGE_KEY = "edumind_profile_photo";

     /* =============================================
        JWT HELPER — reads token from localStorage
        ============================================= */
     function getAccessToken() {
          // localStorage mein 'token' key se save hota hai (confirmed from console)
          const directToken = localStorage.getItem("token");
          if (directToken) return directToken;

          // Fallback: user object ke andar bhi check karo
          const user = getLoggedInUser();
          return user?.accessToken || user?.token || null;
     }

     // Builds headers with JWT — use this for ALL protected API calls
     function authHeaders(extraHeaders = {}) {
          const token = getAccessToken();
          return {
               "Content-Type": "application/json",
               ...(token ? { "Authorization": `Bearer ${token}` } : {}),
               ...extraHeaders
          };
     }

     /* =============================================
        TOAST
        ============================================= */
     function showToast(message, type = "success") {
          const toast  = document.getElementById("toastNotification");
          const msgEl  = document.getElementById("toastMsg");
          const iconEl = document.getElementById("toastIcon");
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
          clearTimeout(window._toastTimer);
          window._toastTimer = setTimeout(() => {
               toast.classList.remove("show");
               toast.classList.add("hide");
               setTimeout(() => { toast.className = "toast-notification"; }, 350);
          }, 3500);
     }

     /* =============================================
        AUTH / STORAGE HELPERS
        ============================================= */
     function getLoggedInUser() {
          try { return JSON.parse(localStorage.getItem("edumind_logged_in_user")); }
          catch { return null; }
     }

     function setLoggedInUser(user) {
          localStorage.setItem("edumind_logged_in_user", JSON.stringify(user));
     }

     function clearAuthStorage() {
          localStorage.removeItem("edumind_logged_in_user");
          localStorage.removeItem("edumind_is_logged_in");
          localStorage.removeItem("edumind_access_token");
     }

     function getProfilePhotoKey(user = getLoggedInUser()) {
          return user?.id ? `edumind_profile_photo_${user.id}` : LEGACY_PROFILE_PHOTO_STORAGE_KEY;
     }

     function getSavedProfilePhoto(user = getLoggedInUser()) {
          return localStorage.getItem(getProfilePhotoKey(user))
               || localStorage.getItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY);
     }

     function saveProfilePhoto(url, user = getLoggedInUser()) {
          localStorage.setItem(getProfilePhotoKey(user), url);
     }

     function applyProfilePhoto(url) {
          const src = url || DEFAULT_PROFILE_IMAGE;
          if (settingsProfileImage) settingsProfileImage.src = src;
          if (headerProfileImage)   headerProfileImage.src   = src;
     }

     function loadSavedProfilePhoto() {
          applyProfilePhoto(getSavedProfilePhoto());
     }

     /* =============================================
        FILL FIELDS FROM USER OBJECT
        ============================================= */
     function fillProfileFields(user) {
          if (!user) return;
          if (settingsFullName)     settingsFullName.value     = user.fullName || "";
          if (settingsEmail)        settingsEmail.value        = user.email    || "";
          if (settingsCourse)       settingsCourse.value       = user.course   || "";
          if (settingsCollege)      settingsCollege.value      = user.college  || "";
     }

     function fillStudyPreferenceFields(user) {
          if (!user) return;
          if (settingsStudyTime)    settingsStudyTime.value    = user.preferredStudyTime     || "Morning";
          if (settingsStudyGoal)    settingsStudyGoal.value    = user.dailyStudyGoal         || "2 Hours";
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
        2FA UI
        ============================================= */
     function updateTwoFactorUI(user) {
          if (!user) return;
          const enabled = Boolean(user.twoFactorEnabled);

          if (twofaStatusBanner) twofaStatusBanner.classList.toggle("enabled", enabled);
          if (twofaStatusLabel)  twofaStatusLabel.textContent = enabled ? "2FA Enabled"   : "2FA Disabled";
          if (twofaBadge)        twofaBadge.textContent       = enabled ? "ON"            : "OFF";

          if (twoFactorBtn) {
               const span = twoFactorBtn.querySelector("span");
               if (span) span.textContent = enabled ? "Disable Two-Factor Auth" : "Enable Two-Factor Auth";
          }
     }

     /* =============================================
        API RESPONSE PARSER
        ============================================= */
     async function parseResponse(res) {
          const ct = res.headers.get("content-type") || "";
          return ct.includes("application/json") ? await res.json() : await res.text();
     }

     /* =============================================
        PHOTO UPLOAD (localStorage — no backend change needed)
        ============================================= */
     function handlePhotoChange(file) {
          if (!file) return;
          if (!file.type.startsWith("image/")) { showToast("Valid image file select karo.", "error"); return; }
          if (file.size > 2 * 1024 * 1024)     { showToast("Image 2MB se choti honi chahiye.", "error"); return; }

          const reader = new FileReader();
          reader.onload = e => {
               const dataUrl = e.target?.result;
               if (!dataUrl) { showToast("Image load nahi hui.", "error"); return; }
               saveProfilePhoto(dataUrl);
               applyProfilePhoto(dataUrl);
               showToast("Profile photo update ho gayi!", "success");
          };
          reader.onerror = () => showToast("Image read nahi hui.", "error");
          reader.readAsDataURL(file);
     }

     /* =============================================
        PASSWORD FORM
        ============================================= */
     function openPasswordForm() {
          if (!changePasswordForm) return;
          changePasswordForm.style.display = "block";
          changePasswordForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
     }

     function closePasswordForm() {
          if (!changePasswordForm) return;
          changePasswordForm.style.display = "none";
          if (currentPasswordInput)    currentPasswordInput.value    = "";
          if (newPasswordInput)        newPasswordInput.value        = "";
          if (confirmNewPasswordInput) confirmNewPasswordInput.value = "";
     }

     /* =============================================
        OTP INPUT SETUP
        ============================================= */
     function setupOTPInputs() {
          otpBoxes.forEach((box, idx) => {
               box.addEventListener("input", () => {
                    box.value = box.value.replace(/[^0-9]/g, "").slice(-1);
                    box.classList.toggle("filled", !!box.value);
                    box.classList.remove("error");
                    if (box.value && idx < otpBoxes.length - 1) otpBoxes[idx + 1].focus();
               });

               box.addEventListener("keydown", e => {
                    if (e.key === "Backspace" && !box.value && idx > 0) {
                         otpBoxes[idx - 1].value = "";
                         otpBoxes[idx - 1].classList.remove("filled");
                         otpBoxes[idx - 1].focus();
                    }
               });

               box.addEventListener("paste", e => {
                    e.preventDefault();
                    const pasted = (e.clipboardData || window.clipboardData)
                         .getData("text").replace(/\D/g, "");
                    [...pasted].forEach((ch, i) => {
                         if (otpBoxes[i]) { otpBoxes[i].value = ch; otpBoxes[i].classList.add("filled"); }
                    });
                    otpBoxes[Math.min(pasted.length, otpBoxes.length - 1)].focus();
               });
          });
     }

     function getOTPValue() { return [...otpBoxes].map(b => b.value).join(""); }

     function clearOTPInputs() {
          otpBoxes.forEach(b => { b.value = ""; b.classList.remove("filled", "error"); });
          if (otpErrorMsg) otpErrorMsg.textContent = "";
     }

     function shakeOTPInputs() {
          otpBoxes.forEach(b => {
               b.classList.add("error");
               setTimeout(() => b.classList.remove("error"), 500);
          });
     }

     /* =============================================
        2FA MODAL OPEN / CLOSE
        ============================================= */
     function open2FAModal() {
          clearOTPInputs();
          if (maskedEmailDisplay) maskedEmailDisplay.textContent = "";
          if (twofaModalOverlay)  twofaModalOverlay.classList.add("open");
     }

     function close2FAModal() {
          if (twofaModalOverlay) twofaModalOverlay.classList.remove("open");
          clearOTPInputs();
     }

     /* =============================================
        ── BACKEND API CALLS ──
        All use JWT via authHeaders()
        Endpoints match AuthController.java exactly
        ============================================= */

     // GET /api/auth/profile — load profile on page open
     async function loadProfileFromBackend() {
          try {
               const res    = await fetch("/api/auth/profile", { headers: authHeaders() });
               const result = await parseResponse(res);

               if (!res.ok) {
                    // Token expired? Try refresh silently
                    if (res.status === 401) { await tryRefreshToken(); return; }
                    console.warn("Profile load failed:", result?.message || result);
                    // Fall back to localStorage data
                    const localUser = getLoggedInUser();
                    if (localUser) {
                         fillProfileFields(localUser);
                         fillStudyPreferenceFields(localUser);
                         fillNotificationToggleFields(localUser);
                         updateHeaderProfileMini(localUser);
                         updateTwoFactorUI(localUser);
                    }
                    return;
               }

               // Merge with local (keep accessToken etc.)
               const localUser = getLoggedInUser() || {};
               const merged    = { ...localUser, ...result };
               setLoggedInUser(merged);
               fillProfileFields(merged);
               fillStudyPreferenceFields(merged);
               fillNotificationToggleFields(merged);
               updateHeaderProfileMini(merged);
               updateTwoFactorUI(merged);
               loadSavedProfilePhoto();

          } catch (err) {
               console.error("Profile load error:", err);
               // Silently use local data
               const localUser = getLoggedInUser();
               if (localUser) {
                    fillProfileFields(localUser);
                    fillStudyPreferenceFields(localUser);
                    fillNotificationToggleFields(localUser);
                    updateHeaderProfileMini(localUser);
                    updateTwoFactorUI(localUser);
                    loadSavedProfilePhoto();
               }
          }
     }

     // PUT /api/auth/profile — save all settings
     async function updateProfileOnBackend() {
          const payload = {
               fullName:                    settingsFullName?.value.trim()     || "",
               email:                       settingsEmail?.value.trim()         || "",
               course:                      settingsCourse?.value.trim()        || "",
               college:                     settingsCollege?.value.trim()       || "",
               preferredStudyTime:          settingsStudyTime?.value            || "Morning",
               dailyStudyGoal:              settingsStudyGoal?.value            || "2 Hours",
               preferredSubjectsFocus:      settingsSubjectFocus?.value.trim()  || "",
               taskRemindersEnabled:        settingsToggles[0]?.checked         ?? true,
               revisionAlertsEnabled:       settingsToggles[1]?.checked         ?? true,
               testNotificationsEnabled:    settingsToggles[2]?.checked         ?? true,
               assistantSuggestionsEnabled: settingsToggles[3]?.checked         ?? false
          };

          if (!payload.fullName || !payload.email || !payload.course || !payload.college) {
               showToast("Saare profile fields bharo.", "error");
               return false;
          }

          try {
               const res    = await fetch("/api/auth/profile", {
                    method:  "PUT",
                    headers: authHeaders(),
                    body:    JSON.stringify(payload)
               });
               const result = await parseResponse(res);

               if (!res.ok) {
                    if (res.status === 401) { showToast("Session expire ho gayi. Dobara login karo.", "error"); return false; }
                    showToast(result?.message || result || "Profile update nahi hua.", "error");
                    return false;
               }

               const localUser = getLoggedInUser() || {};
               const merged    = { ...localUser, ...result };
               setLoggedInUser(merged);
               fillProfileFields(merged);
               fillStudyPreferenceFields(merged);
               fillNotificationToggleFields(merged);
               updateHeaderProfileMini(merged);
               updateTwoFactorUI(merged);
               return true;

          } catch (err) {
               console.error("Profile update error:", err);
               showToast("Network error — profile update nahi hua.", "error");
               return false;
          }
     }

     // PUT /api/auth/change-password — FIXED: no user.id, JWT se email milta hai backend ko
     async function changePasswordOnBackend() {
          const current = currentPasswordInput?.value.trim()       || "";
          const newP    = newPasswordInput?.value.trim()            || "";
          const confirm = confirmNewPasswordInput?.value.trim()     || "";

          if (!current || !newP || !confirm) {
               showToast("Saare password fields bharo.", "error");
               return false;
          }
          // Backend strong password regex se match karo (AuthService.java line 44)
          const strongRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%&*!^()_+=\-]).{8,}$/;
          if (!strongRegex.test(newP)) {
               showToast("Password mein chahiye: 8+ chars, ek uppercase, ek number, ek special char (@#$%&*!^)", "error");
               return false;
          }
          if (newP !== confirm) {
               showToast("New password aur confirm password match nahi kar rahe.", "error");
               return false;
          }

          try {
               const res    = await fetch("/api/auth/change-password", {
                    method:  "PUT",
                    headers: authHeaders(),
                    body:    JSON.stringify({
                         currentPassword:    current,
                         newPassword:        newP,
                         confirmNewPassword: confirm
                    })
               });
               const result = await parseResponse(res);

               if (!res.ok) {
                    if (res.status === 401) { showToast("Session expire ho gayi. Dobara login karo.", "error"); return false; }
                    showToast(result?.message || result || "Password change nahi hua.", "error");
                    return false;
               }

               closePasswordForm();
               showToast(result?.message || "Password successfully change ho gaya!", "success");
               return true;

          } catch (err) {
               console.error("Password change error:", err);
               showToast("Network error — password change nahi hua.", "error");
               return false;
          }
     }

     // POST /api/otp/send — send OTP to user's email
     async function sendOtpToEmail() {
          try {
               const res    = await fetch("/api/otp/send", {
                    method:  "POST",
                    headers: authHeaders()
               });
               const result = await parseResponse(res);

               if (!res.ok) {
                    showToast(result?.message || "OTP send nahi hua.", "error");
                    return false;
               }

               // Show masked email in modal
               if (maskedEmailDisplay && result.maskedEmail) {
                    maskedEmailDisplay.textContent = result.maskedEmail;
               }
               showToast(result?.message || "OTP aapki email pe bheja gaya!", "success");
               return true;

          } catch (err) {
               console.error("OTP send error:", err);
               showToast("OTP send nahi hua. Network check karo.", "error");
               return false;
          }
     }

     // POST /api/otp/verify — verify OTP, backend sets twoFactorEnabled = true
     async function verifyOtpAndEnable2FA() {
          const otp = getOTPValue();
          if (otp.length !== 6) {
               if (otpErrorMsg) otpErrorMsg.textContent = "Pura 6-digit code enter karo.";
               shakeOTPInputs();
               return false;
          }

          try {
               const res    = await fetch("/api/otp/verify", {
                    method:  "POST",
                    headers: authHeaders(),
                    body:    JSON.stringify({ otp })
               });
               const result = await parseResponse(res);

               if (!res.ok) {
                    const msg = result?.message || "Invalid OTP. Dobara try karo.";
                    if (otpErrorMsg) otpErrorMsg.textContent = msg;
                    shakeOTPInputs();
                    return false;
               }

               // Update local user
               const localUser = getLoggedInUser() || {};
               const updated   = { ...localUser, twoFactorEnabled: true };
               setLoggedInUser(updated);
               updateTwoFactorUI(updated);
               close2FAModal();
               showToast("2FA successfully enable ho gayi!", "success");
               return true;

          } catch (err) {
               console.error("OTP verify error:", err);
               if (otpErrorMsg) otpErrorMsg.textContent = "Network error. Dobara try karo.";
               shakeOTPInputs();
               return false;
          }
     }

     // POST /api/otp/disable — disable 2FA
     async function disable2FAOnBackend() {
          try {
               const res    = await fetch("/api/otp/disable", {
                    method:  "POST",
                    headers: authHeaders()
               });
               const result = await parseResponse(res);

               if (!res.ok) {
                    showToast(result?.message || "2FA disable nahi hua.", "error");
                    return false;
               }

               const localUser = getLoggedInUser() || {};
               const updated   = { ...localUser, twoFactorEnabled: false };
               setLoggedInUser(updated);
               updateTwoFactorUI(updated);
               showToast("2FA disable ho gayi.", "success");
               return true;

          } catch (err) {
               console.error("2FA disable error:", err);
               showToast("Network error — 2FA disable nahi hua.", "error");
               return false;
          }
     }

     // DELETE /api/auth/delete-account
     async function deleteAccountOnBackend() {
          const confirmed = window.confirm(
               "Kya aap sure hain? Yeh action undo nahi ho sakta. Account permanently delete ho jayega."
          );
          if (!confirmed) return false;

          try {
               const res    = await fetch("/api/auth/delete-account", {
                    method:  "DELETE",
                    headers: authHeaders()
               });
               const result = await parseResponse(res);

               if (!res.ok) {
                    showToast(result?.message || "Account delete nahi hua.", "error");
                    return false;
               }

               localStorage.removeItem(getProfilePhotoKey());
               localStorage.removeItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY);
               clearAuthStorage();
               alert(result?.message || "Account delete ho gaya.");
               window.location.href = "login.html";
               return true;

          } catch (err) {
               console.error("Delete account error:", err);
               showToast("Network error — account delete nahi hua.", "error");
               return false;
          }
     }

     // Silent token refresh helper
     async function tryRefreshToken() {
          try {
               const localUser    = getLoggedInUser();
               const refreshToken = localUser?.refreshToken || localStorage.getItem("edumind_refresh_token");
               if (!refreshToken) { window.location.href = "login.html"; return; }

               const res = await fetch("/api/auth/refresh-token", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({ refreshToken })
               });

               if (!res.ok) { window.location.href = "login.html"; return; }

               const data = await res.json();
               if (data.accessToken) {
                    const updated = { ...(localUser || {}), accessToken: data.accessToken };
                    setLoggedInUser(updated);
                    localStorage.setItem("edumind_access_token", data.accessToken);
                    // Retry profile load
                    await loadProfileFromBackend();
               }
          } catch {
               window.location.href = "login.html";
          }
     }

     /* =============================================
        EVENT LISTENERS
        ============================================= */

     // Photo upload
     if (changePhotoBtn)  changePhotoBtn.addEventListener("click",  () => profilePhotoInput?.click());
     if (avatarOverlay)   avatarOverlay.addEventListener("click",   () => profilePhotoInput?.click());
     if (profilePhotoInput) {
          profilePhotoInput.addEventListener("change", e => {
               handlePhotoChange(e.target.files?.[0]);
               profilePhotoInput.value = "";
          });
     }

     // Password form
     if (changePasswordBtn) changePasswordBtn.addEventListener("click", openPasswordForm);
     if (cancelPasswordBtn) cancelPasswordBtn.addEventListener("click", closePasswordForm);
     if (updatePasswordBtn) {
          updatePasswordBtn.addEventListener("click", async function () {
               this.disabled = true;
               const span = this.querySelector("span");
               if (span) span.textContent = "Updating…";
               await changePasswordOnBackend();
               if (span) span.textContent = "Update Password";
               this.disabled = false;
          });
     }

     // 2FA button
     if (twoFactorBtn) {
          twoFactorBtn.addEventListener("click", async function () {
               const user    = getLoggedInUser();
               const enabled = Boolean(user?.twoFactorEnabled);

               if (enabled) {
                    // Disable
                    this.disabled = true;
                    await disable2FAOnBackend();
                    this.disabled = false;
               } else {
                    // Open modal
                    open2FAModal();
               }
          });
     }

     // Send OTP button (inside modal)
     if (sendOtpBtn) {
          sendOtpBtn.addEventListener("click", async function () {
               this.disabled = true;
               const span = this.querySelector("span") || this;
               const orig = span.textContent;
               span.textContent = "Sending…";
               await sendOtpToEmail();
               span.textContent = "Resend OTP";
               this.disabled = false;
               // Focus first OTP box
               otpBoxes[0]?.focus();
          });
     }

     // Verify OTP button
     if (verify2FABtn) {
          verify2FABtn.addEventListener("click", async function () {
               this.disabled = true;
               const span = this.querySelector("span");
               if (span) span.textContent = "Verifying…";
               await verifyOtpAndEnable2FA();
               if (span) span.textContent = "Verify & Enable";
               this.disabled = false;
          });
     }

     // Close modal
     if (twofaModalClose)  twofaModalClose.addEventListener("click",  close2FAModal);
     if (twofaModalCancel) twofaModalCancel.addEventListener("click", close2FAModal);
     if (twofaModalOverlay) {
          twofaModalOverlay.addEventListener("click", e => {
               if (e.target === twofaModalOverlay) close2FAModal();
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
               this.disabled = true;
               const icon = this.querySelector("i");
               if (icon) icon.className = "fa-solid fa-spinner fa-spin";

               const ok = await updateProfileOnBackend();
               if (ok) showToast("Saari settings save ho gayi!", "success");

               if (icon) icon.className = "fa-solid fa-floppy-disk";
               this.disabled = false;
          });
     }

     // Keyboard ESC closes modal
     document.addEventListener("keydown", e => {
          if (e.key === "Escape") close2FAModal();
     });

     /* =============================================
        INIT
        ============================================= */
     setupOTPInputs();
     loadSavedProfilePhoto();
     loadProfileFromBackend();

});