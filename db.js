const { Client } = require("pg");

const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "postgres",
    ssl: process.env.DB_HOST !== "localhost"
        ? { rejectUnauthorized: false }
        : false // no SSL in local dev
});

client.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch(err => console.error("DB connection error:", err));

module.exports = client;
