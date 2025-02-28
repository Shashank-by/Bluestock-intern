document.getElementById("signup-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const robotCheck = document.getElementById("not-a-robot").checked;

    if (!name || !email || !password || !robotCheck) {
        alert("Please fill in all fields and verify you're not a robot.");
        return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (data.success) {
            alert(`Welcome, ${name}! Your account has been created.`);
            document.getElementById("signup-form").reset();
        } else {
            alert(data.message || "Signup failed. Try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("There was an error submitting the form.");
    }
});

// Toggle password visibility
document.getElementById("toggle-password").addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});