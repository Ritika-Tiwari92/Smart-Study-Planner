document.addEventListener("DOMContentLoaded", function () {
    const dashboardSearchInput = document.getElementById("dashboardSearchInput");
    const dashboardSearchResults = document.getElementById("dashboardSearchResults");
    const dashboardSearchBox = document.getElementById("dashboardSearchBox");

    const notificationToggleBtn = document.getElementById("notificationToggleBtn");
    const dashboardNotificationDropdown = document.getElementById("dashboardNotificationDropdown");

    function closeDashboardDropdowns() {
        dashboardSearchResults?.classList.add("hidden");
        dashboardNotificationDropdown?.classList.add("hidden");
    }

    if (dashboardSearchInput && dashboardSearchResults && dashboardSearchBox) {
        dashboardSearchInput.addEventListener("input", function () {
            const value = dashboardSearchInput.value.trim();

            dashboardNotificationDropdown?.classList.add("hidden");

            if (value.length > 0) {
                dashboardSearchResults.classList.remove("hidden");
            } else {
                dashboardSearchResults.classList.add("hidden");
            }
        });

        dashboardSearchInput.addEventListener("focus", function () {
            dashboardNotificationDropdown?.classList.add("hidden");

            if (dashboardSearchInput.value.trim().length > 0) {
                dashboardSearchResults.classList.remove("hidden");
            }
        });
    }

    if (notificationToggleBtn && dashboardNotificationDropdown) {
    function showNotificationDropdown() {
        closeDashboardDropdowns();
        document.dispatchEvent(new CustomEvent("dashboard:closeProfileMenu"));
        dashboardNotificationDropdown.classList.remove("hidden");
    }

    function hideNotificationDropdown() {
        dashboardNotificationDropdown.classList.add("hidden");
    }

    notificationToggleBtn.addEventListener("mouseenter", function () {
        showNotificationDropdown();
    });

    notificationToggleBtn.addEventListener("mouseleave", function () {
        setTimeout(() => {
            const isHoveringButton = notificationToggleBtn.matches(":hover");
            const isHoveringDropdown = dashboardNotificationDropdown.matches(":hover");

            if (!isHoveringButton && !isHoveringDropdown) {
                hideNotificationDropdown();
            }
        }, 80);
    });

    dashboardNotificationDropdown.addEventListener("mouseenter", function () {
        dashboardNotificationDropdown.classList.remove("hidden");
    });

    dashboardNotificationDropdown.addEventListener("mouseleave", function () {
        hideNotificationDropdown();
    });
}


    if (dashboardSearchBox) {
        dashboardSearchBox.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }

    if (dashboardNotificationDropdown) {
        dashboardNotificationDropdown.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }

    document.addEventListener("click", function () {
        closeDashboardDropdowns();
    });
    document.addEventListener("dashboard:closeOtherDropdowns", function () {
    closeDashboardDropdowns();
});

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeDashboardDropdowns();
        }
    });
});