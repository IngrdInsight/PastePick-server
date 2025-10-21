// server.js
import "dotenv/config";
import Fastify from "fastify";
import { db_initialization } from "./src/database/initialization.js";
import { pool } from "./src/database/connection.js";
import { processIngredientsFromImage } from "./src/controllers/new_toothpaste_analyzer.js";

const fastify = Fastify({
	logger: true,
});

fastify.get("/", async (request, reply) => {
	return { hi: "world" };
});

fastify.get("/test", async (request, reply) => {
	const { t } = await processIngredientsFromImage({ imageUrl: "" });
	return { hi: t };
});

const start = async () => {
	try {
		await db_initialization();
		await fastify.listen({ port: 3000 });
		console.log("Server running at http://localhost:3000");
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

const shutdown = async () => {
	await fastify.close();
	await pool.end();
	process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();
