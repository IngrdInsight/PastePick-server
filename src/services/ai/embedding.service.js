import { getClient } from "../../database/connection.js";
import { GoogleGenAI } from "@google/genai";
import Fuse from "fuse.js";

const apiKey = process.env.MISTRAL_API_KEY;
const ai = new GoogleGenAI({});

/**
 * Generate embeddings for ingredients
 * @param {string[]} ingredients - Array of ingredient names
 * @returns {Promise<Array>} Array of embeddings
 */

export async function generateEmbeddings(ingredients) {
	const response = await ai.models.embedContent({
		model: "gemini-embedding-001",
		contents: ingredients,
		outputDimensionality: 3072,
		taskType: "SEMANTIC_SIMILARITY",
	});

	const embeddings = response.embeddings.map((e) => e.values); // list of lists
	return embeddings;
}

/**
 * Find similar ingredient in database using vector similarity
 * @param {number[]} embedding - Ingredient embedding vector
 * @param {number} threshold - Similarity threshold (default 0.15)
 * @returns {Promise<Object|null>} Matching ingredient or null
 */
export async function findSimilarIngredient(embedding, threshold = 0.7) {
	const dbClient = await getClient();

	try {
		const result = await dbClient.query(
			`SELECT id, name, alternative_names, category, safety_score, benefits, risks, evidence_level, regulatory_notes,
					LEAST(
						name_embedding <-> $1::vector,
						alternative_name_embedding <-> $1::vector
					) AS distance
			 FROM ingredients
			 WHERE name_embedding IS NOT NULL
			 ORDER BY LEAST(
						  name_embedding <-> $1::vector,
						  alternative_name_embedding <-> $1::vector
					  )
			 LIMIT 1`,
			[JSON.stringify(embedding)],
		);

		if (result.rows.length > 0 && result.rows[0].distance < threshold) {
			console.log(
				`Found similar ingredient: ${result.rows[0].name} ${result.rows[0].distance}`,
			);
			return result.rows[0];
		}
		console.log("No similar ingredient found");
		return null;
	} finally {
		dbClient.release();
	}
}
let fuse = null;
export async function fuzzyFindSimilarIngredient(ingredient, threshold = 0.35) {
	const dbClient = await getClient();

	console.log("Finding similar ingredients...");
	try {
		const result = await dbClient.query(
			"SELECT id, name, alternative_names, category, safety_score, benefits, risks, evidence_level, regulatory_notes FROM ingredients",
		);
		const ingredients = result.rows;

		if (!fuse) {
			fuse = new Fuse(ingredients, {
				keys: ["name", "alternative_names"],
				includeScore: true,
				threshold: threshold,
				minMatchCharLength: 2,
			});
		}

		const response = fuse.search(ingredient);
		if (response.length === 0) {
			return null;
		}

		if (response[0].score <= threshold) {
			return response[0].item;
		}

		return null;
	} catch (err) {
		console.error("Error finding similar ingredients:", err);
		throw err;
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
			`INSERT INTO ingredients (name, name_embedding, created_at, updated_at)
             VALUES ($1, $2::vector, NOW(), NOW())
             RETURNING id, name`,
			[name, JSON.stringify(embedding)],
		);

		return result.rows[0];
	} finally {
		dbClient.release();
	}
}

export async function updateIngredientEmbeddings(batchSize = 50) {
	const dbClient = await getClient();

	try {
		// Fetch all ingredients
		let offset = 0;
		while (true) {
			const { rows: ingredients } = await dbClient.query(
				`SELECT id, name, alternative_names FROM ingredients
                 ORDER BY id
                 LIMIT $1 OFFSET $2`,
				[batchSize, offset],
			);

			if (ingredients.length === 0) break; // no more rows

			// Prepare arrays for embeddings
			const names = ingredients.map((ing) => ing.name);
			const altNames = ingredients.map((ing) => {
				if (!ing.alternative_names || ing.alternative_names.length === 0) {
					return ing.name; // fallback to main name
				}
				return ing.alternative_names.join(" | ");
			});

			// Generate embeddings
			console.log(
				`Generating name embeddings for batch starting at offset ${offset}...`,
			);
			const nameEmbeddings = await generateEmbeddings(names);

			console.log(
				`Generating alternative name embeddings for batch starting at offset ${offset}...`,
			);
			const altEmbeddings = await generateEmbeddings(altNames);

			// Update DB with embeddings
			for (let i = 0; i < ingredients.length; i++) {
				const ing = ingredients[i];
				await dbClient.query(
					`UPDATE ingredients
                     SET name_embedding = $1::vector,
                         alternative_name_embedding = $2::vector,
                         updated_at = NOW()
                     WHERE id = $3`,
					[
						JSON.stringify(nameEmbeddings[i]),
						JSON.stringify(altEmbeddings[i]),
						ing.id,
					],
				);
				console.log(`✓ Updated embeddings for ingredient: ${ing.name}`);
			}

			offset += batchSize;
			await new Promise((resolve) => setTimeout(resolve, 70000));
		}

		console.log("All ingredient embeddings updated successfully!");
	} catch (err) {
		console.error("Error updating ingredient embeddings:", err);
		throw err;
	} finally {
		dbClient.release();
	}
}
