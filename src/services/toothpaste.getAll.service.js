import { query } from "../database/connection.js";

/**
 * Get all toothpastes with their basic information
 * @returns {Promise<Array>} Array of toothpaste objects
 */
export async function getAllToothpastes() {
	try {
		const result = await query(`
			SELECT 
				id,
				name,
				brand,
				description,
				image_url,
				overall_score,
				is_whitening,
				for_sensitive_teeth,
				is_fluoride_free,
				is_natural,
				for_kids,
				updated_at
			FROM toothpastes
			ORDER BY overall_score DESC NULLS LAST, name ASC
		`);

		return result.rows;
	} catch (error) {
		console.error("Error fetching all toothpastes:", error);
		throw error;
	}
}
