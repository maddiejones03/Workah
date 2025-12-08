exports.up = function (knex) {
    // No operation: image_path column added in create_joblisting migration.
    return Promise.resolve();
};

exports.down = function (knex) {
    // No operation.
    return Promise.resolve();
};