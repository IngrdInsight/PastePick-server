import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
	host: process.env.PG_HOST || "localhost",
	user: process.env.PG_USER || "postgres",
	password: process.env.PG_PASSWORD || "",
	database: process.env.PG_DATABASE || "devdb",
	port: process.env.PG_PORT || 5433,
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
