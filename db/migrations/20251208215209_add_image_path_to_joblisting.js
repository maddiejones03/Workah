exports.up = function (knex) {
    return knex.schema.table('joblisting', function (table) {
        table.string('image_path');
    });
};

exports.down = function (knex) {
    return knex.schema.table('joblisting', function (table) {
        table.dropColumn('image_path');
    });
};