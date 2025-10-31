// server.js
import "dotenv/config";
import Fastify from "fastify";
import { db_initialization } from "./src/database/initialization.js";
import { pool } from "./src/database/connection.js";
import toothpasteRoutes from "./src/routes/toothpaste.routes.js";
import fastifyMultipart from "@fastify/multipart";
import cors from "@fastify/cors";

const fastify = Fastify({
	logger: true,
});

await fastify.register(cors, {
	origin: "*",
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
});

fastify.register(fastifyMultipart, { attachFieldsToBody: true });
fastify.register(toothpasteRoutes, { prefix: "/api/v1" });

const start = async () => {
	try {
		await db_initialization();
		console.log("\n✅ Database setup complete!");
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
