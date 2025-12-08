const knex = require('knex')(require('./knexfile').development);

async function debugUsers() {
    try {
        console.log("--- Teen Users ---");
        const teens = await knex('teenuser').select('email', 'password');
        teens.forEach(t => {
            console.log(`Email: ${t.email}, Password (first 10 chars): ${t.password.substring(0, 10)}...`);
        });

        console.log("\n--- Manager Users ---");
        const managers = await knex('manageruser').select('email', 'password');
        managers.forEach(m => {
            console.log(`Email: ${m.email}, Password (first 10 chars): ${m.password.substring(0, 10)}...`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await knex.destroy();
    }
}

debugUsers();
