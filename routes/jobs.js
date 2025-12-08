const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Multer Setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Middleware to check if user is a manager (for creating/editing jobs)
const isManager = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'manager') {
        next();
    } else {
        res.status(403).send('Access Denied: Managers only');
    }
};

// GET / - Landing Page with Search
router.get('/', async (req, res) => {
    const { search, location, age } = req.query;
    let query = `
        SELECT joblisting.*, company.companyname 
        FROM joblisting 
        JOIN company ON joblisting.companyid = company.companyid 
        WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
        query += ` AND (joblisting.jobtitle ILIKE $${paramIndex} OR joblisting.jobdescription ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }
    if (location) {
        query += ` AND joblisting.location ILIKE $${paramIndex}`;
        params.push(`%${location}%`);
        paramIndex++;
    }
    // Simple age filter logic (can be improved)
    // if (age) { ... }

    try {
        const result = await db.query(query, params); // Using db.query for raw SQL queries
        res.render('index', { jobs: result.rows, searchParams: req.query });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /dashboard - Manage Jobs
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role === 'manager') {
            // Managers see their company's jobs
            const result = await db.query('SELECT * FROM joblisting WHERE companyid = $1', [req.session.user.companyid]); // Using db.query
            res.render('dashboard', { jobs: result.rows, isManager: true });
        } else {
            // Teens see... maybe applications? Or just search?
            // For now, redirect teens to landing page or show empty dashboard
            res.render('dashboard', { jobs: [], isManager: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /jobs/add
router.get('/jobs/add', isAuthenticated, isManager, (req, res) => {
    res.render('job_form', { job: null, action: '/jobs/add' });
});

// POST /jobs/add
router.post('/jobs/add', isAuthenticated, isManager, upload.single('image'), async (req, res) => {
    const { title, description, location, pay, hours } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        await db.query(`
            INSERT INTO joblisting (jobtitle, jobdescription, location, hourlypay, hoursperweek, dateposted, companyid, image_path)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [title, description, location, pay, hours || 0, new Date(), req.session.user.companyid, image_path]); // Using db.query
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /jobs/edit/:id
router.get('/jobs/edit/:id', isAuthenticated, isManager, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM joblisting WHERE jobid = $1 AND companyid = $2', [req.params.id, req.session.user.companyid]); // Using db.query
        const job = result.rows[0];

        if (!job) {
            return res.status(404).send('Job not found or unauthorized');
        }
        // Map DB columns to form fields expected by view
        const mappedJob = {
            id: job.jobid,
            title: job.jobtitle,
            description: job.jobdescription,
            location: job.location,
            pay: job.hourlypay,
            hours: job.hoursperweek,
            image_path: job.image_path
        };
        res.render('job_form', { job: mappedJob, action: `/jobs/edit/${job.jobid}` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /jobs/edit/:id
router.post('/jobs/edit/:id', isAuthenticated, isManager, upload.single('image'), async (req, res) => {
    const { title, description, location, pay, hours } = req.body;
    let query = 'UPDATE joblisting SET jobtitle = $1, jobdescription = $2, location = $3, hourlypay = $4, hoursperweek = $5';
    const params = [title, description, location, pay, hours];
    let paramIndex = 6;

    if (req.file) {
        query += `, image_path = $${paramIndex}`;
        params.push(`/uploads/${req.file.filename}`);
        paramIndex++;
    }

    query += ` WHERE jobid = $${paramIndex} AND companyid = $${paramIndex + 1}`;
    params.push(req.params.id, req.session.user.companyid);

    try {
        await db.query(query, params); // Using db.query
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /jobs/delete/:id
router.post('/jobs/delete/:id', isAuthenticated, isManager, async (req, res) => {
    try {
        await db.query('DELETE FROM joblisting WHERE jobid = $1 AND companyid = $2', [req.params.id, req.session.user.companyid]);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
