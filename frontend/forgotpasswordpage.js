document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgot-password-form');
    const API_URL = 'http://localhost:5001'; // Update this URL according to your backend

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const emailInput = form.querySelector('input[name="email"]');
        const email = emailInput.value.trim();

        try {
            const response = await fetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                alert('Password reset instructions have been sent to your email!');
                // Optionally redirect to login page
                window.location.href = 'login.html';
            } else {
                // Show error message
                alert(data.message || 'An error occurred while processing your request.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing your request. Please try again later.');
        }
    });
});