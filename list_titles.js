const knex = require('knex')(require('./knexfile').development);

async function listTitles() {
    try {
        const titles = await knex('joblisting').distinct('jobtitle').pluck('jobtitle');
        console.log('Job Titles:', titles);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listTitles();
