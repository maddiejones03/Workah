const express = require('express');
const router = express.Router();
const knex = require('../db');

// GET / - Search Page (and Landing Page)
router.get('/', async (req, res) => {
    const { search, location } = req.query;
    let query = knex('joblisting')
        .join('company', 'joblisting.companyid', 'company.companyid')
        .select('joblisting.*', 'company.companyname');

    if (search) {
        query = query.where(builder => {
            builder.where('jobtitle', 'ilike', `%${search}%`)
                .orWhere('jobdescription', 'ilike', `%${search}%`);
        });
    }
    if (location) {
        query = query.andWhere('joblisting.location', 'ilike', `%${location}%`);
    }

    try {
        const jobs = await query;
        console.log(`Search performed. Term: ${search}, Location: ${location}, Results: ${jobs.length}`);
        res.render('index', { jobs, searchParams: req.query, isSearch: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
