import { getClient, query } from "../database/connection.js";
import { processIngredientsFromText } from "./ai/ingredient.extractor.service.js";
import { generateEmbeddings } from "./ai/embedding.service.js";
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
	const client = await getClient();

	try {
		console.log("gotten values", name, brand, ingredients_raw, image_mimetype);

		// 1. Check if similar toothpaste exists by name embedding
		const nameEmbedding = await generateEmbeddings([name]);
		const similarCheck = await client.query(
			`
            SELECT id,
                   name,
                   brand,
                   1 - (name_embedding <=> $1::vector) AS similarity
            FROM toothpastes
            WHERE 1 - (name_embedding <=> $1::vector) > 0.9
            ORDER BY similarity DESC
            LIMIT 1
        `,
			[JSON.stringify(nameEmbedding[0])],
		);

		if (similarCheck.rows.length > 0) {
			await client.query("ROLLBACK");
			throw new Error(
				`Similar toothpaste already exists: ${similarCheck.rows[0].name} by ${similarCheck.rows[0].brand}`,
			);
		}

		// 2. Process ingredients from text (extract and match/create in DB)
		const ingredients = await processIngredientsFromText(ingredients_raw);

		// 3. Upload and process image to get URL
		const imageUrl = await uploadImageToAllas(image, image_mimetype);

		// 4. Analyze toothpaste
		const analysis = await analyzeToothpaste({
			name,
			brand,
			ingredients,
			imageUrl,
		});

		// 5. Insert toothpaste into database
		const toothpasteResult = await client.query(
			`
            INSERT INTO toothpastes (name, brand, image_url, overall_score, score_updated_at,
                                     name_embedding, is_whitening, for_sensitive_teeth,
                                     is_fluoride_free, is_natural, for_kids)
            VALUES ($1, $2, $3, $4, NOW(), $5::vector, $6, $7, $8, $9, $10)
            RETURNING *
        `,
			[
				name,
				brand,
				imageUrl,
				analysis.overall_score,
				JSON.stringify(nameEmbedding[0].embedding),
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
			await client.query(
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

		await client.query("COMMIT");
	} catch (error) {
		console.log(error);
	}
}
