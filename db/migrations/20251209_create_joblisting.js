exports.up = function (knex) {
    // No operation: joblisting table already exists.
    return Promise.resolve();
};

exports.down = function (knex) {
    // No operation.
    return Promise.resolve();
};
