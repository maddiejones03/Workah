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
        const teen = await knex('teenuser').where({ email }).first();
        if (teen && teen.password === password) {
            req.session.user = { id: teen.userid, email: teen.email, name: teen.firstname, role: 'teen' };
            return res.redirect('/'); // Teens go to landing page to search
        }

        // Check Manager User
        const manager = await knex('manageruser').where({ email }).first();
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
            await knex('teenuser').insert({
                email,
                password: password, // Store plain text
                firstname,
                lastname,
                dateofbirth: dateofbirth || '2008-01-01', // Default or required
                address: address || 'N/A',
                city: city || 'N/A',
                state: state || 'N/A',
                zipcode: zipcode || '00000'
            });
            res.redirect('/login');
        } else if (role === 'manager') {
            // Create Company first (simplified: create new company for every manager for now)
            const [company] = await knex('company').insert({
                companyname: companyname || 'My Company',
                industry: 'General',
                location: 'N/A',
                contactemail: email,
                phonenumber: '000-000-0000'
            }).returning('companyid');

            await knex('manageruser').insert({
                email,
                password: password, // Store plain text
                firstname,
                lastname,
                companyid: company.companyid
            });
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
