import { getClient } from "../../database/connection.js";
import { Mistral } from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey });
/**
 * Generate embeddings for ingredients
 * @param {string[]} ingredients - Array of ingredient names
 * @returns {Promise<Array>} Array of embeddings
 */
export async function generateEmbeddings(ingredients) {
	const embeddingResponse = await client.embeddings.create({
		model: "mistral-embed",
		inputs: ingredients,
	});

	return embeddingResponse.data;
}

/**
 * Find similar ingredient in database using vector similarity
 * @param {number[]} embedding - Ingredient embedding vector
 * @param {number} threshold - Similarity threshold (default 0.15)
 * @returns {Promise<Object|null>} Matching ingredient or null
 */
export async function findSimilarIngredient(embedding, threshold = 0.15) {
	const dbClient = await getClient();

	try {
		const result = await dbClient.query(
			`SELECT id, name, category, safety_score, benefits, risks, 
                    content_embedding <-> $1::vector AS distance
             FROM ingredients 
             WHERE content_embedding IS NOT NULL
             ORDER BY content_embedding <-> $1::vector 
             LIMIT 1`,
			[JSON.stringify(embedding)],
		);

		if (result.rows.length > 0 && result.rows[0].distance < threshold) {
			return result.rows[0];
		}

		return null;
	} finally {
		dbClient.release();
	}
}

/**
 * Insert new ingredient into database
 * @param {string} name - Ingredient name
 * @param {number[]} embedding - Ingredient embedding vector
 * @returns {Promise<Object>} Inserted ingredient
 */
export async function insertIngredient(name, embedding) {
	const dbClient = await getClient();

	try {
		const result = await dbClient.query(
			`INSERT INTO ingredients (name, content_embedding, created_at, updated_at)
             VALUES ($1, $2::vector, NOW(), NOW())
             RETURNING id, name, category, safety_score, benefits, risks`,
			[name, JSON.stringify(embedding)],
		);

		return result.rows[0];
	} finally {
		dbClient.release();
	}
}
