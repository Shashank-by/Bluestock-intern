document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reset-password-form');
    const API_URL = 'http://localhost:5001';

    // Get the reset token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        alert('Invalid reset link. Please request a new password reset.');
        window.location.href = 'forgotpasswordpage.html';
        return;
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const newPassword = form.querySelector('input[name="newPassword"]').value;
        const confirmPassword = form.querySelector('input[name="confirmPassword"]').value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Password has been reset successfully!');
                window.location.href = 'login.html';
            } else {
                alert(data.message || 'An error occurred while resetting your password.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while resetting your password. Please try again later.');
        }
    });
}); 