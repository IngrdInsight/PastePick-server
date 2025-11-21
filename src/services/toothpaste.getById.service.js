import { query } from "../database/connection.js";

/**
 * Get a single toothpaste by ID with its ingredients
 * @param {string} id - Toothpaste UUID
 * @returns {Promise<Object>} Toothpaste object with ingredients
 */
export async function getToothpasteById(id) {
	try {
		const toothpasteResult = await query(
			`
			SELECT 
				id,
				name,
				brand,
				description,
				image_url,
				overall_score,
				score_updated_at,
				is_whitening,
				for_sensitive_teeth,
				is_fluoride_free,
				is_natural,
				for_kids,
				updated_at
			FROM toothpastes
			WHERE id = $1
		`,
			[id],
		);

		if (toothpasteResult.rows.length === 0) {
			return null;
		}

		const toothpaste = toothpasteResult.rows[0];

		// Get ingredients for this toothpaste
		const ingredientsResult = await query(
			`
			SELECT 
				i.id,
				i.name,
				i.category,
				i.benefits,
				i.risks,
				i.evidence_level,
				i.safety_score,
				i.regulatory_notes,
				i.link_echa,
				i.link_pubchem,
				i.link_cosIng,
				i.sources,
				ti.concentration_percentage
			FROM ingredients i
			INNER JOIN toothpaste_ingredients ti ON i.id = ti.ingredient_id
			WHERE ti.toothpaste_id = $1
			ORDER BY i.safety_score DESC NULLS LAST, i.name ASC
		`,
			[id],
		);

		toothpaste.ingredients = ingredientsResult.rows;

		return toothpaste;
	} catch (error) {
		console.error("Error fetching toothpaste by ID:", error);
		throw error;
	}
}
