import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Extract ingredients from an image using OCR
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string[]>} Array of ingredient strings
 */
async function extractIngredients(imagePath) {
	const genAI = new GoogleGenAI({});
	const base64ImageFile = fs.readFileSync(imagePath, {
		encoding: "base64",
	});

	const prompt = `Analyze this image and extract ONLY the ingredients list.
    Return a comma-separated list of ingredients with no additional text, formatting, or markdown.
    Remove brand names, descriptions, instructions, and any non-ingredient text.
    Just return the ingredient names separated by commas (in one line).`;

	const contents = [
		{
			inlineData: {
				mimeType: "image/png",
				data: base64ImageFile,
			},
		},
		{ text: prompt },
	];

	const response = await genAI.models.generateContent({
		model: "gemini-2.5-flash",
		contents: contents,
	});

	const ingredientsText = response.text;
	return parseIngredients(ingredientsText);
}

function parseIngredients(ingredientsText) {
	return ingredientsText
		.split(",")
		.map((ingredient) => ingredient.trim())
		.filter((ingredient) => ingredient.length > 0);
}

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process all images in the images folder
 */
async function processAllImages() {
	const imagesFolder = "src/parsers/images";
	const outputFile = "raw_duplicate_ingredients.txt";

	// Get all PNG files
	const files = fs
		.readdirSync(imagesFolder)
		.filter((file) => file.endsWith(".png"))
		.sort((a, b) => {
			const numA = parseInt(a.replace(".png", ""));
			const numB = parseInt(b.replace(".png", ""));
			return numA - numB;
		});

	console.log(`Found ${files.length} images to process`);

	// Clear the output file
	fs.writeFileSync(outputFile, "");

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const imagePath = path.join(imagesFolder, file);

		console.log(`Processing ${file} (${i + 1}/${files.length})...`);

		try {
			const ingredients = await extractIngredients(imagePath);
			const ingredientsLine = ingredients.join(", ");

			// Append to file
			fs.appendFileSync(outputFile, ingredientsLine + "\n");
			console.log(`✓ ${file}: ${ingredients.length} ingredients found`);
		} catch (error) {
			console.error(`✗ Error processing ${file}:`, error.message);
			fs.appendFileSync(outputFile, `ERROR: ${file}\n`);
		}

		// Delay between requests
		if (i < files.length - 1) {
			const delayTime = 1000 + Math.random() * 1000;
			console.log(`Waiting ${(delayTime / 1000).toFixed(2)}s...`);
			await delay(delayTime);
		}
	}

	console.log(`\n✓ All done! Results saved to ${outputFile}`);
}

processAllImages().catch(console.error);
