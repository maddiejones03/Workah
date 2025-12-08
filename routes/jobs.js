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
    let query = knex('joblisting')
        .join('company', 'joblisting.companyid', 'company.companyid')
        .select('joblisting.*', 'company.companyname');

    if (search) {
        query = query.where('jobtitle', 'ilike', `%${search}%`)
            .orWhere('jobdescription', 'ilike', `%${search}%`);
    }
    if (location) {
        query = query.andWhere('joblisting.location', 'ilike', `%${location}%`);
    }
    // Age filter might not map directly anymore unless we add age_range to joblisting or infer it.
    // For now, ignoring age filter or we can add it to schema later.

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
        if (req.session.user.role === 'manager') {
            // Managers see their company's jobs
            const jobs = await knex('joblisting').where({ companyid: req.session.user.companyid });
            res.render('dashboard', { jobs, isManager: true });
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
        await knex('joblisting').insert({
            jobtitle: title,
            jobdescription: description,
            location,
            hourlypay: pay,
            hoursperweek: hours || 0,
            dateposted: new Date(),
            companyid: req.session.user.companyid,
            image_path
        });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /jobs/edit/:id
router.get('/jobs/edit/:id', isAuthenticated, isManager, async (req, res) => {
    try {
        const job = await knex('joblisting').where({ jobid: req.params.id, companyid: req.session.user.companyid }).first();
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
    const updates = {
        jobtitle: title,
        jobdescription: description,
        location,
        hourlypay: pay,
        hoursperweek: hours
    };
    if (req.file) {
        updates.image_path = `/uploads/${req.file.filename}`;
    }

    try {
        await knex('joblisting').where({ jobid: req.params.id, companyid: req.session.user.companyid }).update(updates);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /jobs/delete/:id
router.post('/jobs/delete/:id', isAuthenticated, isManager, async (req, res) => {
    try {
        await knex('joblisting').where({ jobid: req.params.id, companyid: req.session.user.companyid }).del();
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
