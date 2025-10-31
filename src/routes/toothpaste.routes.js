import {
	createToothpasteHandler,
	getAllToothpastesHandler,
	getToothpasteByIdHandler,
} from "../controllers/toothpaste.controller.js";

export default async function toothpasteRoutes(fastify, options) {
	fastify.post("/toothpastes/new", createToothpasteHandler);
	fastify.get("/toothpastes", getAllToothpastesHandler);
	fastify.get("/toothpastes/:id", getToothpasteByIdHandler);
}
