document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById("signin-form");
    const robotCheckbox = document.getElementById("not-a-robot");
    
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Check if robot verification is checked
        if (!robotCheckbox.checked) {
            alert("Please verify that you are not a robot");
            return;
        }

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Basic validation
        if (!email || !password) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const response = await fetch("http://localhost:5001/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Store user session info
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('userName', data.user.name);
                localStorage.setItem('userId', data.user.id);
                
                // Redirect to the IPO registration page
                window.location.href = "RegisterIPOmain.html";
            } else {
                alert(data.message || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            console.error("Error during login:", error);
            alert("Connection error. Please check if the server is running.");
        }
    });

    // Toggle password visibility
    const togglePassword = document.getElementById("toggle-password");
    const passwordInput = document.getElementById("password");

    if (togglePassword) {
        togglePassword.addEventListener("click", function() {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
        });
    }
});
