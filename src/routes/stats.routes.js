import {getGeneralStats} from "../controllers/toothpaste.controller.js";

export default async function statsRoutes(fastify, options) {
    fastify.get("/stats", getGeneralStats);
}
