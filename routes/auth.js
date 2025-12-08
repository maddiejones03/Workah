const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// GET /login
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// POST /login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Invalid email or password' });
        }
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'An error occurred' });
    }
});

// GET /register
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// POST /register
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (email, password, name) VALUES ($1, $2, $3)', [email, hashedPassword, name]);
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('register', { error: 'Email already exists or other error' });
    }
});

// GET /logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;
