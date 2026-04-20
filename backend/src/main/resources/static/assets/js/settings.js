document.addEventListener("DOMContentLoaded", function () {
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    const settingsSaveStatus = document.getElementById("settingsSaveStatus");

    const settingsFullName = document.getElementById("settingsFullName");
    const settingsEmail = document.getElementById("settingsEmail");
    const settingsCourse = document.getElementById("settingsCourse");
    const settingsCollege = document.getElementById("settingsCollege");

    const settingsStudyTime = document.getElementById("settingsStudyTime");
    const settingsStudyGoal = document.getElementById("settingsStudyGoal");
    const settingsSubjectFocus = document.getElementById("settingsSubjectFocus");

    const settingsToggles = document.querySelectorAll(".settings-toggle-item input[type='checkbox']");

    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const twoFactorBtn = document.getElementById("twoFactorBtn");
    const twoFactorStatusText = document.getElementById("twoFactorStatusText");

    const changePasswordForm = document.getElementById("changePasswordForm");
    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
    const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
    const updatePasswordBtn = document.getElementById("updatePasswordBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    function showSaveStatus(message, isSuccess = true) {
        if (!settingsSaveStatus) return;

        settingsSaveStatus.textContent = message;
        settingsSaveStatus.style.color = isSuccess ? "#16a34a" : "#dc2626";

        setTimeout(() => {
            if (settingsSaveStatus.textContent === message) {
                settingsSaveStatus.textContent = "";
            }
        }, 2500);
    }

    function getLoggedInUser() {
        const rawUser = localStorage.getItem("edumind_logged_in_user");
        if (!rawUser) return null;

        try {
            return JSON.parse(rawUser);
        } catch (error) {
            console.error("Failed to parse logged in user:", error);
            return null;
        }
    }

    function setLoggedInUser(user) {
        localStorage.setItem("edumind_logged_in_user", JSON.stringify(user));
    }

    function clearAuthStorage() {
        localStorage.removeItem("edumind_logged_in_user");
        localStorage.removeItem("edumind_is_logged_in");
    }

    function fillProfileFields(user) {
        if (!user) return;

        if (settingsFullName) settingsFullName.value = user.fullName || "";
        if (settingsEmail) settingsEmail.value = user.email || "";
        if (settingsCourse) settingsCourse.value = user.course || "";
        if (settingsCollege) settingsCollege.value = user.college || "";
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
        if (!user || settingsToggles.length === 0) return;

        if (settingsToggles[0]) {
            settingsToggles[0].checked = Boolean(user.taskRemindersEnabled);
        }

        if (settingsToggles[1]) {
            settingsToggles[1].checked = Boolean(user.revisionAlertsEnabled);
        }

        if (settingsToggles[2]) {
            settingsToggles[2].checked = Boolean(user.testNotificationsEnabled);
        }

        if (settingsToggles[3]) {
            settingsToggles[3].checked = Boolean(user.assistantSuggestionsEnabled);
        }
    }

    function updateHeaderProfileMini(user) {
        const profileMenuToggle = document.getElementById("profileMenuToggle");
        if (!profileMenuToggle || !user) return;

        const nameElement = profileMenuToggle.querySelector("h4");
        const subtitleElement = profileMenuToggle.querySelector("p");

        if (nameElement) {
            nameElement.textContent = user.fullName || "Student";
        }

        if (subtitleElement) {
            subtitleElement.textContent = user.course || "Student";
        }
    }

    function updateTwoFactorUI(user) {
        if (!user) return;

        const enabled = Boolean(user.twoFactorEnabled);

        if (twoFactorBtn) {
            const textElement = twoFactorBtn.querySelector("span");
            if (textElement) {
                textElement.textContent = enabled
                    ? "Disable Two-Factor Auth"
                    : "Enable Two-Factor Auth";
            }
        }

        if (twoFactorStatusText) {
            twoFactorStatusText.textContent = enabled
                ? "Two-factor authentication status: Enabled"
                : "Two-factor authentication status: Disabled";

            twoFactorStatusText.style.color = enabled ? "#16a34a" : "#64748b";
        }
    }

    async function parseResponse(response) {
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return await response.json();
        }

        return await response.text();
    }

    function clearPasswordFields() {
        if (currentPasswordInput) currentPasswordInput.value = "";
        if (newPasswordInput) newPasswordInput.value = "";
        if (confirmNewPasswordInput) confirmNewPasswordInput.value = "";
    }

    function openChangePasswordForm() {
        if (!changePasswordForm) return;
        changePasswordForm.style.display = "block";
    }

    function closeChangePasswordForm() {
        if (!changePasswordForm) return;
        changePasswordForm.style.display = "none";
        clearPasswordFields();
    }

    async function loadProfileFromBackend() {
        const loggedInUser = getLoggedInUser();

        if (!loggedInUser || !loggedInUser.id) {
            showSaveStatus("Logged-in user not found.", false);
            return;
        }

        try {
            const response = await fetch(`/api/auth/profile/${loggedInUser.id}`);
            const result = await parseResponse(response);

            if (!response.ok) {
                const errorMessage =
                    typeof result === "string"
                        ? result
                        : result.message || "Failed to load profile.";

                showSaveStatus(errorMessage, false);
                return;
            }

            const latestUser = {
                ...loggedInUser,
                ...result
            };

            setLoggedInUser(latestUser);
            fillProfileFields(latestUser);
            fillStudyPreferenceFields(latestUser);
            fillNotificationToggleFields(latestUser);
            updateHeaderProfileMini(latestUser);
            updateTwoFactorUI(latestUser);
        } catch (error) {
            console.error("Profile load error:", error);
            showSaveStatus("Something went wrong while loading profile.", false);
        }
    }

    async function updateProfileOnBackend() {
        const loggedInUser = getLoggedInUser();

        if (!loggedInUser || !loggedInUser.id) {
            showSaveStatus("Logged-in user not found.", false);
            return false;
        }

        const payload = {
            fullName: settingsFullName ? settingsFullName.value.trim() : "",
            email: settingsEmail ? settingsEmail.value.trim() : "",
            course: settingsCourse ? settingsCourse.value.trim() : "",
            college: settingsCollege ? settingsCollege.value.trim() : "",

            preferredStudyTime: settingsStudyTime ? settingsStudyTime.value : "Morning",
            dailyStudyGoal: settingsStudyGoal ? settingsStudyGoal.value : "2 Hours",
            preferredSubjectsFocus: settingsSubjectFocus ? settingsSubjectFocus.value.trim() : "",

            taskRemindersEnabled: settingsToggles[0] ? settingsToggles[0].checked : true,
            revisionAlertsEnabled: settingsToggles[1] ? settingsToggles[1].checked : true,
            testNotificationsEnabled: settingsToggles[2] ? settingsToggles[2].checked : true,
            assistantSuggestionsEnabled: settingsToggles[3] ? settingsToggles[3].checked : false
        };

        if (!payload.fullName || !payload.email || !payload.course || !payload.college) {
            showSaveStatus("Please fill in all profile fields.", false);
            return false;
        }

        try {
            const response = await fetch(`/api/auth/profile/${loggedInUser.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await parseResponse(response);

            if (!response.ok) {
                const errorMessage =
                    typeof result === "string"
                        ? result
                        : result.message || "Failed to update settings.";

                showSaveStatus(errorMessage, false);
                return false;
            }

            const updatedUser = {
                ...loggedInUser,
                ...result
            };

            setLoggedInUser(updatedUser);
            fillProfileFields(updatedUser);
            fillStudyPreferenceFields(updatedUser);
            fillNotificationToggleFields(updatedUser);
            updateHeaderProfileMini(updatedUser);
            updateTwoFactorUI(updatedUser);

            return true;
        } catch (error) {
            console.error("Profile update error:", error);
            showSaveStatus("Something went wrong while updating settings.", false);
            return false;
        }
    }

    async function updatePasswordOnBackend() {
        const loggedInUser = getLoggedInUser();

        if (!loggedInUser || !loggedInUser.id) {
            showSaveStatus("Logged-in user not found.", false);
            return false;
        }

        const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : "";
        const newPassword = newPasswordInput ? newPasswordInput.value.trim() : "";
        const confirmNewPassword = confirmNewPasswordInput ? confirmNewPasswordInput.value.trim() : "";

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showSaveStatus("Please fill in all password fields.", false);
            return false;
        }

        if (newPassword.length < 6) {
            showSaveStatus("New password must be at least 6 characters long.", false);
            return false;
        }

        if (newPassword !== confirmNewPassword) {
            showSaveStatus("New password and confirm password do not match.", false);
            return false;
        }

        try {
            const response = await fetch(`/api/auth/change-password/${loggedInUser.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    confirmNewPassword: confirmNewPassword
                })
            });

            const result = await parseResponse(response);

            if (!response.ok) {
                const errorMessage =
                    typeof result === "string"
                        ? result
                        : result.message || "Failed to update password.";

                showSaveStatus(errorMessage, false);
                return false;
            }

            const successMessage =
                typeof result === "string"
                    ? result
                    : result.message || "Password updated successfully.";

            closeChangePasswordForm();
            showSaveStatus(successMessage, true);
            return true;
        } catch (error) {
            console.error("Password update error:", error);
            showSaveStatus("Something went wrong while updating password.", false);
            return false;
        }
    }

    async function updateTwoFactorOnBackend() {
        const loggedInUser = getLoggedInUser();

        if (!loggedInUser || !loggedInUser.id) {
            showSaveStatus("Logged-in user not found.", false);
            return false;
        }

        const currentStatus = Boolean(loggedInUser.twoFactorEnabled);
        const nextStatus = !currentStatus;

        try {
            const response = await fetch(`/api/auth/two-factor/${loggedInUser.id}?enabled=${nextStatus}`, {
                method: "PUT"
            });

            const result = await parseResponse(response);

            if (!response.ok) {
                const errorMessage =
                    typeof result === "string"
                        ? result
                        : result.message || "Failed to update two-factor authentication.";

                showSaveStatus(errorMessage, false);
                return false;
            }

            const updatedUser = {
                ...loggedInUser,
                ...result
            };

            setLoggedInUser(updatedUser);
            updateHeaderProfileMini(updatedUser);
            updateTwoFactorUI(updatedUser);

            showSaveStatus(
                updatedUser.twoFactorEnabled
                    ? "Two-factor authentication enabled successfully."
                    : "Two-factor authentication disabled successfully.",
                true
            );

            return true;
        } catch (error) {
            console.error("Two-factor update error:", error);
            showSaveStatus("Something went wrong while updating two-factor authentication.", false);
            return false;
        }
    }

    async function deleteAccountOnBackend() {
        const loggedInUser = getLoggedInUser();

        if (!loggedInUser || !loggedInUser.id) {
            showSaveStatus("Logged-in user not found.", false);
            return false;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );

        if (!confirmed) {
            return false;
        }

        try {
            const response = await fetch(`/api/auth/delete-account/${loggedInUser.id}`, {
                method: "DELETE"
            });

            const result = await parseResponse(response);

            if (!response.ok) {
                const errorMessage =
                    typeof result === "string"
                        ? result
                        : result.message || "Failed to delete account.";

                showSaveStatus(errorMessage, false);
                return false;
            }

            clearAuthStorage();
            alert(typeof result === "string" ? result : "Account deleted successfully.");
            window.location.href = "login.html";
            return true;
        } catch (error) {
            console.error("Delete account error:", error);
            showSaveStatus("Something went wrong while deleting account.", false);
            return false;
        }
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener("click", function () {
            openChangePasswordForm();
        });
    }

    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener("click", function () {
            closeChangePasswordForm();
        });
    }

    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener("click", async function () {
            updatePasswordBtn.disabled = true;
            await updatePasswordOnBackend();
            updatePasswordBtn.disabled = false;
        });
    }

    if (twoFactorBtn) {
        twoFactorBtn.addEventListener("click", async function () {
            twoFactorBtn.disabled = true;
            await updateTwoFactorOnBackend();
            twoFactorBtn.disabled = false;
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", async function () {
            deleteAccountBtn.disabled = true;
            await deleteAccountOnBackend();
            deleteAccountBtn.disabled = false;
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", async function () {
            saveSettingsBtn.disabled = true;

            const profileUpdated = await updateProfileOnBackend();

            if (!profileUpdated) {
                saveSettingsBtn.disabled = false;
                return;
            }

            showSaveStatus("Settings saved successfully.");
            saveSettingsBtn.disabled = false;
        });
    }

    loadProfileFromBackend();
});