import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "postgres",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "devdb",
	port: process.env.DB_PORT || 5433,
	max: 50,
	idleTimeoutMillis: 15000,
	connectionTimeoutMillis: 2000, // Return an error after 2s if connection could not be established
});

pool.on("error", (err) => {
	console.error("Unexpected PG pool error", err);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
export { pool };
