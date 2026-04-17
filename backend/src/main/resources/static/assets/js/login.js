document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    if (!loginForm) return;

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        const savedUser = localStorage.getItem("edumind_registered_user");

        if (!savedUser) {
            alert("No account found. Please create an account first.");
            window.location.href = "register.html";
            return;
        }

        const parsedUser = JSON.parse(savedUser);

        if (email === parsedUser.email && password === parsedUser.password) {
            localStorage.setItem("edumind_logged_in_user", JSON.stringify(parsedUser));
            localStorage.setItem("edumind_is_logged_in", "true");

            alert("Login successful.");
            window.location.href = "dashboard.html";
        } else {
            alert("Invalid email or password.");
        }
    });
});