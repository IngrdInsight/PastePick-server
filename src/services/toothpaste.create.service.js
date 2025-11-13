import { getClient, query } from "../database/connection.js";
import { processIngredientsFromText } from "./ingredient.extractor.service.js";
import {
	fuzzyFindSimilarToothpaste,
	generateEmbeddings,
	resetFuzzyCache,
} from "./ai/embedding.service.js";
import { analyzeToothpaste } from "./ai/analyzer.service.js";
import { uploadImageToAllas } from "./image.service.js";

/**
 * Get a single toothpaste by ID with its ingredients
 * @param {string} id - Toothpaste UUID
 * @returns {Promise<Object>} Toothpaste object with ingredients
 */

export async function createToothpaste({
	name,
	brand,
	ingredients_raw,
	image,
	image_mimetype,
}) {
	const dbClient = await getClient();

	try {
		// 1. Check if similar toothpaste exists by name embedding
		const existing_toothpaste = await fuzzyFindSimilarToothpaste(name);

		if (existing_toothpaste) {
			await dbClient.query("ROLLBACK");
			throw new Error(
				`Similar toothpaste already exists: ${existing_toothpaste}`,
			);
		}

		// 2. Process ingredients from text (extract and match/create in DB)
		const ingredients = await processIngredientsFromText(ingredients_raw);

		// 3. Upload and process image to get URL
		const image_data = await uploadImageToAllas(image, image_mimetype);

		// 4. Analyze toothpaste
		const analysis = await analyzeToothpaste({
			name,
			brand,
			ingredients,
			image: image_data.url,
		});

		// 5. Insert toothpaste into database
		const toothpasteResult = await dbClient.query(
			`
            INSERT INTO toothpastes (name, brand, image_url, image_embedding, overall_score, score_updated_at,
            						is_whitening, for_sensitive_teeth,
                                     is_fluoride_free, is_natural, for_kids)
            VALUES ($1, $2, $3, $4::vector, $5, NOW(), $6, $7, $8, $9, $10)
            RETURNING *
        `,
			[
				name,
				brand,
				image_data.url,
				`[${image_data.embedding.join(",")}]`,
				analysis.overall_score,
				analysis.is_whitening,
				analysis.for_sensitive_teeth,
				analysis.is_fluoride_free,
				analysis.is_natural,
				analysis.for_kids,
			],
		);

		const toothpasteId = toothpasteResult.rows[0].id;

		// 6. Insert toothpaste-ingredient relationships
		for (const ingredient of ingredients) {
			await dbClient.query(
				`
                INSERT INTO toothpaste_ingredients (toothpaste_id, ingredient_id, concentration_percentage)
                VALUES ($1, $2, $3)
                ON CONFLICT (toothpaste_id, ingredient_id) DO NOTHING
            `,
				[
					toothpasteId,
					ingredient.id,
					ingredient.concentration_percentage || null,
				],
			);
		}

		await dbClient.query("COMMIT");
		resetFuzzyCache();
	} catch (error) {
		console.log(error);
	}
}
