import {query} from "../database/connection.js";

export async function getGeneralStatsHandler() {
    try {
        const result = await query(`
            SELECT
                    (SELECT COUNT(id) FROM toothpastes) AS total_toothpastes,
                    (SELECT COUNT(id) FROM ingredients) AS total_ingredients;
			
		`);
        return result.rows[0];
    } catch (error) {
        console.error("Error fetching all toothpastes:", error);
        throw error;
    }
}
