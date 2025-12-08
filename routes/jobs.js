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

// GET / - Landing Page with Search
router.get('/', async (req, res) => {
    const { search, location, age } = req.query;
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
        query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }
    if (location) {
        query += ` AND location ILIKE $${paramIndex}`;
        params.push(`%${location}%`);
        paramIndex++;
    }
    // Simple age filter logic
    if (age) {
        query += ` AND age_range ILIKE $${paramIndex}`;
        params.push(`%${age}%`);
        paramIndex++;
    }

    try {
        const result = await db.query(query, params);
        res.render('index', { jobs: result.rows, searchParams: req.query });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /dashboard - Manage Jobs
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM jobs WHERE created_by = $1', [req.session.user.id]);
        res.render('dashboard', { jobs: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /jobs/add
router.get('/jobs/add', isAuthenticated, (req, res) => {
    res.render('job_form', { job: null, action: '/jobs/add' });
});

// POST /jobs/add
router.post('/jobs/add', isAuthenticated, upload.single('image'), async (req, res) => {
    const { title, description, location, pay, age_range } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        await db.query(
            'INSERT INTO jobs (title, description, location, pay, age_range, image_path, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [title, description, location, pay, age_range, image_path, req.session.user.id]
        );
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /jobs/edit/:id
router.get('/jobs/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM jobs WHERE id = $1 AND created_by = $2', [req.params.id, req.session.user.id]);
        const job = result.rows[0];

        if (!job) {
            return res.status(404).send('Job not found or unauthorized');
        }
        res.render('job_form', { job, action: `/jobs/edit/${job.id}` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /jobs/edit/:id
router.post('/jobs/edit/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    const { title, description, location, pay, age_range } = req.body;
    let query = 'UPDATE jobs SET title = $1, description = $2, location = $3, pay = $4, age_range = $5';
    const params = [title, description, location, pay, age_range];
    let paramIndex = 6;

    if (req.file) {
        query += `, image_path = $${paramIndex}`;
        params.push(`/uploads/${req.file.filename}`);
        paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} AND created_by = $${paramIndex + 1}`;
    params.push(req.params.id, req.session.user.id);

    try {
        await db.query(query, params);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /jobs/delete/:id
router.post('/jobs/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await db.query('DELETE FROM jobs WHERE id = $1 AND created_by = $2', [req.params.id, req.session.user.id]);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
