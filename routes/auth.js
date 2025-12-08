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
        // Check Teen User
        const teenResult = await db.query('SELECT * FROM teenuser WHERE email = $1', [email]);
        const teen = teenResult.rows[0];

        if (teen && teen.password === password) {
            req.session.user = { id: teen.userid, email: teen.email, name: teen.firstname, role: 'teen' };
            return res.redirect('/'); // Teens go to landing page to search
        }

        // Check Manager User
        const managerResult = await db.query('SELECT * FROM manageruser WHERE email = $1', [email]);
        const manager = managerResult.rows[0];

        if (manager && manager.password === password) {
            req.session.user = { id: manager.managerid, email: manager.email, name: manager.firstname, role: 'manager', companyid: manager.companyid };
            return res.redirect('/dashboard'); // Managers go to dashboard
        }

        res.render('login', { error: 'Invalid email or password' });
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
    const { email, password, firstname, lastname, role, companyname, address, city, state, zipcode, dateofbirth } = req.body;

    try {
        // Plain text password storage
        if (role === 'teen') {
            await db.query(`
                INSERT INTO teenuser (email, password, firstname, lastname, dateofbirth, address, city, state, zipcode)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [email, password, firstname, lastname, dateofbirth || '2008-01-01', address || 'N/A', city || 'N/A', state || 'N/A', zipcode || '00000']);
            res.redirect('/login');
        } else if (role === 'manager') {
            // Create Company first (simplified: create new company for every manager for now)
            const companyResult = await db.query(`
                INSERT INTO company (companyname, industry, location, contactemail, phonenumber)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING companyid
            `, [companyname || 'My Company', 'General', 'N/A', email, '000-000-0000']);

            const companyId = companyResult.rows[0].companyid;

            await db.query(`
                INSERT INTO manageruser (email, password, firstname, lastname, companyid)
                VALUES ($1, $2, $3, $4, $5)
            `, [email, password, firstname, lastname, companyId]);

            res.redirect('/login');
        } else {
            res.render('register', { error: 'Invalid role selected' });
        }
    } catch (err) {
        console.error(err);
        res.render('register', { error: 'Registration failed. Email might be taken.' });
    }
});

// GET /logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;
