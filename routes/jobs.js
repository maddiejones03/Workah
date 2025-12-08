const express = require('express');
const router = express.Router();
const knex = require('knex')(require('../knexfile').development);
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
    let query = knex('jobs').select('*');

    if (search) {
        query = query.where('title', 'like', `%${search}%`)
            .orWhere('description', 'like', `%${search}%`);
    }
    if (location) {
        query = query.andWhere('location', 'like', `%${location}%`);
    }
    // Simple age filter logic (can be improved)
    if (age) {
        query = query.andWhere('age_range', 'like', `%${age}%`);
    }

    try {
        const jobs = await query;
        res.render('index', { jobs, searchParams: req.query });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /dashboard - Manage Jobs
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        // Users can only see their own jobs? Or all jobs? 
        // Requirement: "security to do something (i.e. edit records, add records, see some type of data, etc.)"
        // Let's say they can see all but only edit their own, or just see their own in dashboard.
        // For simplicity, let's show all jobs created by the user.
        const jobs = await knex('jobs').where({ created_by: req.session.user.id });
        res.render('dashboard', { jobs });
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
        await knex('jobs').insert({
            title,
            description,
            location,
            pay,
            age_range,
            image_path,
            created_by: req.session.user.id
        });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /jobs/edit/:id
router.get('/jobs/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const job = await knex('jobs').where({ id: req.params.id, created_by: req.session.user.id }).first();
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
    const updates = {
        title,
        description,
        location,
        pay,
        age_range
    };
    if (req.file) {
        updates.image_path = `/uploads/${req.file.filename}`;
    }

    try {
        await knex('jobs').where({ id: req.params.id, created_by: req.session.user.id }).update(updates);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /jobs/delete/:id
router.post('/jobs/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await knex('jobs').where({ id: req.params.id, created_by: req.session.user.id }).del();
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
