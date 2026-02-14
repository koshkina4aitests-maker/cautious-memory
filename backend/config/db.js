const { Pool } = require("pg");

const pool = new Pool({
  // Оставляем localhost для PostgreSQL: БД размещена локально на том же сервере.
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "portal_db",
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
