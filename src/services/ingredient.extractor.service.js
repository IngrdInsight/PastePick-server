import {
	findSimilarIngredient,
	generateEmbeddings,
	insertIngredient,
} from "ai/embedding.service.js";

/**
 * Process ingredients from text: embed, lookup, and insert if needed
 * @param {string[]} ingredientsText - Array of ingredient names
 * @returns {Promise<Array>} Array of processed ingredients with database info
 */
export async function processIngredientsFromText(ingredientsText) {
	const embeddings = await generateEmbeddings(ingredientsText);
	const processedIngredients = [];

	for (let i = 0; i < ingredientsText.length; i++) {
		const ingredientName = ingredientsText[i];
		const embedding = embeddings[i];

		console.log(`Processing ingredient: ${ingredientName}`);

		const existingIngredient = await findSimilarIngredient(embedding);

		let ingredientData;

		if (existingIngredient) {
			console.log(
				`Found existing: ${existingIngredient.name} (distance: ${existingIngredient.distance})`,
			);
			ingredientData = {
				id: existingIngredient.id,
				name: existingIngredient.name,
				alternative_names: existingIngredient.alternative_names,
				category: existingIngredient.category,
				safety_score: existingIngredient.safety_score,
				benefits: existingIngredient.benefits,
				risks: existingIngredient.risks,
				regulatory_notes: existingIngredient.regulatory_notes,
				evidence_level: existingIngredient.evidence_level,
				original_name: ingredientName,
			};
		} else {
			console.log(`  + Adding new ingredient: ${ingredientName}`);
			const newIngredient = await insertIngredient(ingredientName, embedding);
			ingredientData = {
				id: newIngredient.id,
				name: newIngredient.name,
				category: null,
				safety_score: null,
				benefits: null,
				risks: null,
				original_name: ingredientName,
				note: "not found in the database",
			};
		}

		processedIngredients.push(ingredientData);
	}

	return processedIngredients;
}
