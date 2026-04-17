document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");

    const fullNameInput = document.getElementById("registerFullName");
    const emailInput = document.getElementById("registerEmail");
    const passwordInput = document.getElementById("registerPassword");
    const confirmPasswordInput = document.getElementById("registerConfirmPassword");
    const courseInput = document.getElementById("registerCourse");
    const collegeInput = document.getElementById("registerCollege");

    if (!registerForm) return;

    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const course = courseInput.value.trim();
        const college = collegeInput.value.trim();

        if (!fullName || !email || !password || !confirmPassword || !course || !college) {
            alert("Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Password and Confirm Password do not match.");
            return;
        }

        const userData = {
            fullName: fullName,
            email: email,
            password: password,
            course: course,
            college: college,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem("edumind_registered_user", JSON.stringify(userData));

        alert("Account created successfully. Please sign in.");
        window.location.href = "login.html";
    });
});