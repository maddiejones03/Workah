const express = require('express');
const session = require('express-session');
const path = require('path');
const knex = require('./db');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secret-key', // In production, use environment variable
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global middleware to pass user to views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes
// Routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const searchRoutes = require('./routes/search');

// Root route – render main page (index.ejs) with job listings
app.get('/', async (req, res) => {
    try {
        const jobs = await knex('joblisting')
            .join('company', 'joblisting.companyid', 'company.companyid')
            .select('joblisting.*', 'company.companyname');
        res.render('index', { jobs, searchParams: {}, isSearch: false });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.use('/', authRoutes);
app.use('/search', searchRoutes); // Handles /search
app.use('/', jobRoutes);

// Landing Page (Search is handled here or in a separate route, but let's put it in jobRoutes or just here)
// Actually, let's keep the landing page route here or in jobRoutes. 
// Since the user wants search, let's make the root route handle the landing page and search.
// But for now, I'll delegate to jobRoutes for the root if it handles the landing page logic.
// Or I can just import the landing page handler.

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});



