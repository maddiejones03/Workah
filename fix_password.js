const knex = require('knex')(require('./knexfile').development);
const bcrypt = require('bcrypt');

async function fixPassword() {
    try {
        const email = 'maddiejones@gmail.com';
        const newPassword = 'admin'; // The plain text password they likely intended
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await knex('manageruser')
            .where({ email })
            .update({ password: hashedPassword });

        console.log(`Updated password for ${email} to hashed version of '${newPassword}'`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await knex.destroy();
    }
}

fixPassword();
