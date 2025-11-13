import { extractIngredients } from "../services/ai/ocr.service.js";
import {
	fuzzyFindSimilarIngredient,
	insertIngredient,
} from "../services/ai/embedding.service.js";

/**
 * Process ingredients from image: extract, embed, lookup, and insert if needed
 * @returns {Promise<Array>} Array of processed ingredients with database info
 */
export async function processIngredientsFromImage(options) {
	/*const ingredients = await extractIngredients(options);
    const embeddings = [];
    const processedIngredients = [];

    for (let i = 0; i < ingredients.length; i++) {
        const ingredientName = ingredients[i];
        const embedding = embeddings[i].embedding;

        console.log(`Processing ingredient: ${ingredientName}`);

        // Step 3a: Look up similar ingredient in database
        const existingIngredient = await fuzzyFindSimilarIngredient(embedding);

        let ingredientData;

        if (existingIngredient) {
            // Found similar ingredient
            console.log(`  ✓ Found existing: ${existingIngredient.name} (distance: ${existingIngredient.distance})`);
            ingredientData = {
                id: existingIngredient.id,
                name: existingIngredient.name,
                category: existingIngredient.category,
                safety_score: existingIngredient.safety_score,
                benefits: existingIngredient.benefits,
                risks: existingIngredient.risks,
                matched: true,
                original_name: ingredientName
            };
        } else {
            // Step 3b: Insert new ingredient if not found
            console.log(`  + Adding new ingredient: ${ingredientName}`);
            const newIngredient = await insertIngredient(ingredientName, embedding);

            ingredientData = {
                id: newIngredient.id,
                name: newIngredient.name,
                category: newIngredient.category,
                safety_score: newIngredient.safety_score,
                benefits: newIngredient.benefits,
                risks: newIngredient.risks,
                matched: false,
                original_name: ingredientName
            };
        }

        processedIngredients.push(ingredientData);
    }

    return processedIngredients;

     */
}
