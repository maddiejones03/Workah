const knex = require('knex')(require('./knexfile').development);

async function checkCompany() {
    try {
        const managers = await knex('manageruser').select('*');
        for (const m of managers) {
            console.log(`Manager: ${m.email}, CompanyID: ${m.companyid}`);
            const company = await knex('company').where({ companyid: m.companyid }).first();
            console.log(`  -> Company: ${company ? company.companyname : 'NOT FOUND'}`);
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await knex.destroy();
    }
}

checkCompany();
