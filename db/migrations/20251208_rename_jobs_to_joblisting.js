exports.up = function (knex) {
    return knex.schema.renameTable('jobs', 'joblisting');
};

exports.down = function (knex) {
    return knex.schema.renameTable('joblisting', 'jobs');
};
