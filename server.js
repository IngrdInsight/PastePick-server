import "dotenv/config";
import Fastify from "fastify";
import { pool } from "./src/database/connection.js";
import toothpasteRoutes from "./src/routes/toothpaste.routes.js";
import statsRoutes from "./src/routes/stats.routes.js";
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
fastify.register(statsRoutes, { prefix: "/api/v1" });
fastify.get("/health", async () => ({ status: "ok" }));

const start = async () => {
	try {
		await fastify.listen({ port: 3001, host: "0.0.0.0" });
		console.log("Server running at http://localhost:3001");
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
