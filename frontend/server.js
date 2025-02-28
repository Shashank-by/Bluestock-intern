const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MySQL Connection Pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'shashank123@',  // Update with your actual password
    database: 'bluestock',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Check MySQL Connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    } else {
        console.log("Connected to MySQL Database.");
        connection.release();
    }
});

// Signup Route
app.post('/signup', async (req, res) => {
    console.log("Received signup request:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user data into MySQL
        pool.getConnection((err, connection) => {
            if (err) {
                console.error("Database connection error:", err);
                return res.status(500).json({ success: false, message: 'Database connection error' });
            }

            const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
            
            connection.query(query, [name, email, hashedPassword], (err, result) => {
                connection.release();

                if (err) {
                    console.error("Error inserting data:", err);
                    return res.status(500).json({ success: false, message: 'Error inserting data into database' });
                }

                console.log("User inserted:", result.insertId);
                res.status(200).json({ success: true, message: 'User created successfully' });
            });
        });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// IPO Registration Route
app.post('/register-ipo', (req, res) => {
    console.log("Received IPO registration request:", req.body);

    const { company_name, price_band, open_date, close_date, issue_size, issue_type, listing_date, ipo_price, listing_price, listing_gain } = req.body;

    if (!company_name || !price_band || !open_date || !close_date || !issue_size || !issue_type || !listing_date || !ipo_price || !listing_price || !listing_gain) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Insert IPO data into MySQL
    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json({ success: false, message: 'Database connection error' });
        }

        const query = `
            INSERT INTO ipo_details 
            (company_name, price_band, open_date, close_date, issue_size, issue_type, listing_date, ipo_price, listing_price, listing_gain) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        connection.query(query, [company_name, price_band, open_date, close_date, issue_size, issue_type, listing_date, ipo_price, listing_price, listing_gain], (err, result) => {
            connection.release();

            if (err) {
                console.error("Error inserting IPO data:", err);
                return res.status(500).json({ success: false, message: 'Error inserting IPO data into database' });
            }

            console.log("IPO inserted:", result.insertId);
            res.status(200).json({ success: true, message: 'IPO registered successfully' });
        });
    });
});

// Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    console.log("Received login request:", email, password); // Debugging

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json({ success: false, message: 'Database connection error' });
        }

        const query = 'SELECT * FROM users WHERE email = ?';
        connection.query(query, [email], async (err, results) => {
            connection.release();
            console.log("Query result:", results); // Debugging

            if (err || results.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            console.log("Password match:", isMatch); // Debugging

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            res.status(200).json({ success: true, message: 'Login successful' });
        });
    });
});
// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
