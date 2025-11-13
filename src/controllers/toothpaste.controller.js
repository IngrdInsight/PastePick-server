import { getAllToothpastes } from "../services/toothpaste.getAll.service.js";
import { createToothpaste } from "../services/toothpaste.create.service.js";
import { getToothpasteById } from "../services/toothpaste.getById.service.js";

/**
 * Get all toothpastes
 * GET /toothpastes
 */
export async function getAllToothpastesHandler(request, reply) {
	try {
		const toothpastes = await getAllToothpastes();

		return reply.code(200).send({
			success: true,
			amount: toothpastes.length,
			data: toothpastes,
		});
	} catch (error) {
		request.log.error(error);
		return reply.code(500).send({
			success: false,
			error: "Failed to fetch toothpastes",
			message: error.message,
		});
	}
}

/**
 * Get a single toothpaste by ID
 * GET /toothpastes/:id
 */
export async function getToothpasteByIdHandler(request, reply) {
	try {
		const { id } = request.params;

		const toothpaste = await getToothpasteById(id);

		if (!toothpaste) {
			return reply.code(404).send({
				success: false,
				error: "Toothpaste not found",
			});
		}

		return reply.code(200).send({
			success: true,
			data: toothpaste,
		});
	} catch (error) {
		request.log.error(error);
		return reply.code(500).send({
			success: false,
			error: "Failed to fetch toothpaste",
			message: error.message,
		});
	}
}

export async function createToothpasteHandler(request, reply) {
	try {
		const file = await request.body.file;
		if (!file) {
			return reply
				.code(400)
				.send({ success: false, error: "No file uploaded" });
		}
		const name = request.body.name?.value;
		const brand = request.body.brand?.value;
		const ingredientsRaw = request.body.ingredients?.value;
		const ingredientsArray = JSON.parse(ingredientsRaw);

		const mimetype = file.mimetype;
		const buffer = await file.toBuffer();
		console.log(ingredientsArray);

		await createToothpaste({
			name: name,
			brand: brand,
			ingredients_raw: ingredientsArray,
			image: buffer,
			image_mimetype: mimetype,
		});

		return reply.code(200).send({
			success: true,
		});
	} catch (error) {
		request.log.error(error);
		return reply.code(500).send({
			success: false,
			error: "Failed to create",
			message: error.message,
		});
	}
}
