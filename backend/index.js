const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const crypto = require('crypto');

const app = express();
const port = 5001;

// Middleware to parse JSON request body
app.use(bodyParser.json());
app.use(cors());

// MySQL Connection Pool
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'shashank123@', // Replace with your MySQL password
    database: 'bluestock',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise(); // Use promise for async/await support

// Signup Route
app.post('/signup', async (req, res) => {
    console.log("Received data:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        console.log("User inserted with ID:", result.insertId);
        res.status(201).json({ success: true, message: 'User created successfully' });
    } catch (error) {
        console.error("Error inserting data into database:", error);
        res.status(500).json({ success: false, message: 'Error inserting data into database' });
    }
});

// IPO Registration Route
app.post('/registerIpo', async (req, res) => {
    try {
        let {
            company_name, price_band, open_date, close_date, issue_size,
            issue_type, listing_date, status, ipo_price, listing_price,
            listing_gain, listed_date, current_market_price, current_return,
            rhp_link, drhp_link
        } = req.body;

        console.log("Received IPO data:", req.body);

        if (!company_name || !price_band || !issue_size || !issue_type || !status) {
            return res.status(400).json({ success: false, message: 'Missing required IPO fields' });
        }

        const sql = `
            INSERT INTO ipo_info (
                company_name, price_band, open_date, close_date, issue_size,
                issue_type, listing_date, status, ipo_price, listing_price,
                listing_gain, listed_date, current_market_price, current_return, 
                rhp_link, drhp_link
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            company_name, price_band, open_date, close_date, issue_size,
            issue_type, listing_date, status, ipo_price, listing_price,
            listing_gain, listed_date, current_market_price, current_return,
            rhp_link, drhp_link
        ];

        const [result] = await pool.execute(sql, values);
        console.log("IPO registered with ID:", result.insertId);

        res.status(201).json({ success: true, message: 'IPO Registered Successfully', ipoId: result.insertId });
    } catch (error) {
        console.error("Error registering IPO:", error);
        res.status(500).json({ success: false, message: 'Failed to register IPO' });
    }
});

// Fetch All IPOs
app.get('/registerIpo', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM ipo_info');

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No IPOs found' });
        }

        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching IPOs:", error);
        res.status(500).json({ success: false, message: 'Failed to retrieve IPO details' });
    }
});

// Delete IPO by ID
app.delete('/deleteIpo/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.execute('DELETE FROM ipo_info WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "IPO not found" });
        }

        res.json({ success: true, message: "IPO deleted successfully" });
    } catch (error) {
        console.error("Error deleting IPO:", error);
        res.status(500).json({ success: false, message: "Failed to delete IPO" });
    }
});

app.get('/ipo-stats', async (req, res) => {
    try {
        // Count total IPOs
        const [totalResult] = await pool.execute("SELECT COUNT(*) AS total_ipo FROM ipo_info");

        // Count gain IPOs (where listing_gain > 0)
        const [gainResult] = await pool.execute("SELECT COUNT(*) AS gain_ipo FROM ipo_info WHERE listing_gain > 0");

        // Count loss IPOs (where listing_gain < 0)
        const [lossResult] = await pool.execute("SELECT COUNT(*) AS loss_ipo FROM ipo_info WHERE listing_gain < 0");

        res.json({
            success: true,
            total_ipo: totalResult[0].total_ipo,
            gain_ipo: gainResult[0].gain_ipo,
            loss_ipo: lossResult[0].loss_ipo
        });
    } catch (error) {
        console.error('Error fetching IPO stats:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve IPO statistics' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log("Login attempt for email:", email);

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Use the promise-based pool query
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Login successful
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    try {
        // Check if user exists
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate a random reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

        // Store the reset token in the database
        await pool.execute(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
            [resetToken, tokenExpiry, email]
        );

        // In a real application, you would send an email here with a link containing the reset token
        // For demonstration, we'll just return the token in the response
        res.status(200).json({
            success: true,
            message: 'Password reset link has been sent to your email',
            // In production, remove the token from the response
            debug_token: resetToken
        });

    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({ success: false, message: 'Error processing password reset request' });
    }
});

// Reset Password Route
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    try {
        // Find user with the reset token and check if it's still valid
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password and clear the reset token
        await pool.execute(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?',
            [hashedPassword, token]
        );

        res.status(200).json({ success: true, message: 'Password has been reset successfully' });

    } catch (error) {
        console.error('Error in reset password:', error);
        res.status(500).json({ success: false, message: 'Error resetting password' });
    }
});

// Gracefully Close the Connection Pool When the Server Stops
process.on('SIGINT', async () => {
    try {
        await pool.end();
        console.log("MySQL pool closed.");
        process.exit();
    } catch (err) {
        console.error("Error closing MySQL pool:", err);
        process.exit(1);
    }
});

// Start the Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
