const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const settingsSaveStatus = document.getElementById("settingsSaveStatus");

const lightModeOption = document.getElementById("lightModeOption");
const darkModeOption = document.getElementById("darkModeOption");

const appearanceOptions = document.querySelectorAll(".appearance-option");
const settingsToggles = document.querySelectorAll(".settings-toggle-item input[type='checkbox']");

function clearAppearanceActiveState() {
    appearanceOptions.forEach((option) => option.classList.remove("active"));
}

function setAppearanceMode(mode) {
    clearAppearanceActiveState();

    if (mode === "dark") {
        darkModeOption?.classList.add("active");
        localStorage.setItem("edumind_settings_theme", "dark");
        document.body.classList.add("preview-dark");
    } else {
        lightModeOption?.classList.add("active");
        localStorage.setItem("edumind_settings_theme", "light");
        document.body.classList.remove("preview-dark");
    }
}

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

function saveToggleStates() {
    const toggleStates = [];

    settingsToggles.forEach((toggle, index) => {
        toggleStates.push({
            index,
            checked: toggle.checked
        });
    });

    localStorage.setItem("edumind_settings_toggles", JSON.stringify(toggleStates));
}

function loadToggleStates() {
    const saved = localStorage.getItem("edumind_settings_toggles");
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);

        parsed.forEach((item) => {
            if (settingsToggles[item.index]) {
                settingsToggles[item.index].checked = item.checked;
            }
        });
    } catch (error) {
        console.error("Failed to load toggle states:", error);
    }
}

function loadSavedAppearance() {
    const savedTheme = localStorage.getItem("edumind_settings_theme") || "light";
    setAppearanceMode(savedTheme);
}

if (lightModeOption && darkModeOption) {
    lightModeOption.addEventListener("click", function () {
        setAppearanceMode("light");
    });

    darkModeOption.addEventListener("click", function () {
        setAppearanceMode("dark");
    });
}

if (settingsToggles.length > 0) {
    settingsToggles.forEach((toggle) => {
        toggle.addEventListener("change", function () {
            saveToggleStates();
        });
    });
}

if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", function () {
        saveToggleStates();
        showSaveStatus("Settings saved successfully.");
    });
}

loadSavedAppearance();
loadToggleStates();