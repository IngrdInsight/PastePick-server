import fs from "fs";
import { getClient } from "./connection.js";

// Category mapping from JSON format to DB
const CATEGORY_MAPPING = {
	"Flavoring Agent": "flavoring",
	Preservative: "preservative",
	Abrasive: "abrasive",
	"Whitening Agent": "whitening",
	"Fluoride Compound": "fluoride",
	Humectant: "humectant",
	Surfactant: "surfactant",
	Binder: "binder",
	"Thickening Agent": "binder",
	"Binding Agent": "binder",
};

// Evidence level mapping
const EVIDENCE_MAPPING = {
	High: "high",
	Moderate: "moderate",
	Low: "low",
	Limited: "limited",
};

export async function loadIngredients(jsonFilePath) {
	const client = await getClient();

	try {
		console.log("Loading ingredients from JSON...");

		// Read JSON file
		const fileContent = fs.readFileSync(jsonFilePath, "utf8");
		const ingredients = JSON.parse(fileContent);

		if (!Array.isArray(ingredients)) {
			throw new Error("JSON file must contain an array of ingredients");
		}

		console.log(`Found ${ingredients.length} ingredients to load`);

		let successCount = 0;
		let errorCount = 0;
		const errors = [];

		for (const ingredient of ingredients) {
			try {
				const category = ingredient.category || null;

				// Map evidence level to lowercase
				const evidenceLevel = ingredient.evidence_level
					? EVIDENCE_MAPPING[ingredient.evidence_level] || null
					: null;

				// Parse alternative names (handle both string and array)
				let alternativeNames = [];
				if (ingredient.alternative_names) {
					if (Array.isArray(ingredient.alternative_names)) {
						alternativeNames = ingredient.alternative_names;
					} else if (typeof ingredient.alternative_names === "string") {
						alternativeNames = ingredient.alternative_names
							.split(",")
							.map((name) => name.trim())
							.filter((name) => name.length > 0);
					}
				}

				// Insert ingredient
				await client.query(
					`INSERT INTO ingredients (
						name, 
						alternative_names, 
						category, 
						benefits, 
						risks, 
						evidence_level,
						labeling_echa,
						safety_score, 
						regulatory_notes,
						link_echa,
						link_cosing,
						link_pubchem,
						link_other
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
					ON CONFLICT (name) DO UPDATE SET
						alternative_names = EXCLUDED.alternative_names,
						category = EXCLUDED.category,
						benefits = EXCLUDED.benefits,
						risks = EXCLUDED.risks,
						evidence_level = EXCLUDED.evidence_level,
						labeling_echa = EXCLUDED.labeling_echa,
						safety_score = EXCLUDED.safety_score,
						regulatory_notes = EXCLUDED.regulatory_notes,
						link_echa = EXCLUDED.link_echa,
						link_cosing = EXCLUDED.link_cosing,
						link_pubchem = EXCLUDED.link_pubchem,
						link_other = EXCLUDED.link_other,
						updated_at = NOW()`,
					[
						ingredient.name,
						alternativeNames,
						category,
						ingredient.benefits || null,
						ingredient.risks || null,
						evidenceLevel,
						ingredient.labeling_echa || null,
						ingredient.safety_score || null,
						ingredient.regulatory_notes || null,
						ingredient.link_echa || null,
						ingredient.link_cosIng || null,
						ingredient.link_pubchem || null,
						ingredient.link_other || null,
					],
				);

				successCount++;

				if (successCount % 10 === 0) {
					console.log(
						`✓ Loaded ${successCount}/${ingredients.length} ingredients...`,
					);
				}
			} catch (error) {
				errorCount++;
				errors.push({
					ingredient: ingredient.name,
					error: error.message,
				});
				console.error(
					`✗ Error loading ingredient "${ingredient.name}": ${error.message}`,
				);
			}
		}

		console.log("\n" + "=".repeat(100));
		console.log(`Ingredient loading completed!`);
		console.log(`✓ Successfully loaded: ${successCount}`);
		console.log(`✗ Errors: ${errorCount}`);

		if (errors.length > 0) {
			console.log("\nErrors details:");
			errors.forEach((err) => {
				console.log(`  - ${err.ingredient}: ${err.error}`);
			});
		}
		console.log("=".repeat(100) + "\n");

		return { successCount, errorCount, errors };
	} catch (error) {
		console.error("Error loading ingredients:", error);
		throw error;
	} finally {
		client.release();
	}
}
