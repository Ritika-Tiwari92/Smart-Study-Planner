document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    if (!loginForm) return;

    async function parseResponse(response) {
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return await response.json();
        }

        return await response.text();
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const result = await parseResponse(response);

            if (!response.ok) {
                const errorMessage =
                    typeof result === "string"
                        ? result
                        : result.message || "Invalid email or password.";

                alert(errorMessage);
                return;
            }

            localStorage.setItem("edumind_logged_in_user", JSON.stringify(result));
            localStorage.setItem("edumind_is_logged_in", "true");

            alert(result.message || "Login successful.");
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong while signing in.");
        }
    });
});