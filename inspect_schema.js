const knex = require('knex')(require('./knexfile').development);

async function inspect() {
    try {
        const tables = ['joblisting', 'manageruser', 'teenuser', 'company', 'category'];
        for (const table of tables) {
            console.log(`\n--- Schema for ${table} ---`);
            const columnInfo = await knex(table).columnInfo();
            console.log(columnInfo);
        }
    } catch (err) {
        console.error("Error inspecting schema:", err);
    } finally {
        await knex.destroy();
    }
}

inspect();
