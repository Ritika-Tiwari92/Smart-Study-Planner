document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");

    const fullNameInput = document.getElementById("registerFullName");
    const emailInput = document.getElementById("registerEmail");
    const passwordInput = document.getElementById("registerPassword");
    const confirmPasswordInput = document.getElementById("registerConfirmPassword");
    const courseInput = document.getElementById("registerCourse");
    const collegeInput = document.getElementById("registerCollege");

    if (!registerForm) return;

    async function parseResponse(response) {
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return await response.json();
        }

        return await response.text();
    }

    registerForm.addEventListener("submit", async function (event) {
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
            college: college
        };

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const result = await parseResponse(response);

            if (!response.ok) {
                const errorMessage =
                    typeof result === "string"
                        ? result
                        : result.message || "Registration failed.";

                alert(errorMessage);
                return;
            }

            // Temporary compatibility:
            // current login.js abhi localStorage-based hai,
            // isliye next step me login.js update hone tak ye save rehne do.
            localStorage.setItem(
                "edumind_registered_user",
                JSON.stringify({
                    fullName: fullName,
                    email: email,
                    password: password,
                    course: course,
                    college: college,
                    createdAt: new Date().toISOString()
                })
            );

            alert(result.message || "Account created successfully. Please sign in.");
            window.location.href = "login.html";
        } catch (error) {
            console.error("Registration error:", error);
            alert("Something went wrong while creating the account.");
        }
    });
});