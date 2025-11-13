import { getClient, query } from "../../database/connection.js";
import Fuse from "fuse.js";

let fuzzyIngredientCache = null;
let fuzzyToothpasteCache = null;

export function resetFuzzyCache() {
	fuzzyIngredientCache = null;
	fuzzyToothpasteCache = null;
	console.log("Fuzzy search cache reset");
}

export async function fuzzyFindSimilarIngredient(ingredient, threshold = 0.45) {
	const dbClient = await getClient();

	console.log("Finding similar ingredients...");
	try {
		const result = await dbClient.query(
			"SELECT id, name, alternative_names, category, safety_score, benefits, risks, evidence_level, regulatory_notes FROM ingredients",
		);
		const ingredients = result.rows;

		if (!fuzzyIngredientCache) {
			fuzzyIngredientCache = new Fuse(ingredients, {
				keys: ["name", "alternative_names"],
				includeScore: true,
				threshold: threshold,
				minMatchCharLength: 2,
			});
		}

		const response = fuzzyIngredientCache.search(ingredient.toLowerCase());
		if (response.length === 0) {
			console.log("No similar ingredient found");
			return null;
		}

		if (response[0].score <= threshold) {
			console.log("Below threschold");
			return response[0].item;
		}
		console.log("Other case");
		return null;
	} catch (err) {
		console.error("Error finding similar ingredients:", err);
		throw err;
	} finally {
		dbClient.release();
	}
}

export async function fuzzyFindSimilarToothpaste(toothpaste, threshold = 0.35) {
	const dbClient = await getClient();

	console.log("Finding similar toothpastes...");
	try {
		const result = await query("SELECT id, name FROM toothpastes");
		const toothpastes = result.rows;

		if (!fuzzyToothpasteCache) {
			fuzzyToothpasteCache = new Fuse(toothpastes, {
				keys: ["name"],
				includeScore: true,
				threshold: threshold,
				minMatchCharLength: 2,
			});
		}

		const response = fuzzyToothpasteCache.search(toothpaste.toLowerCase());
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
			`INSERT INTO ingredients (name, created_at, updated_at)
             VALUES ($1, NOW(), NOW())
             RETURNING id, name`,
			[name],
		);

		return result.rows[0];
	} finally {
		dbClient.release();
	}
}
