/**
 * Finds CAS numbers and generates reference links.
 * - Reads raw ingredients (JSON)
 * - Uses Gemini to find CAS numbers if missing
 * - Generates PubChem, ECHA, and CosIng links (raw, needs manual checking)
 * - Writes enriched data to a new JSON file
 */

import { readFile, writeFile } from "fs/promises";
import { GoogleGenAI } from "@google/genai";

const INPUT_FILE = "raw_ingr_no_links.json";
const OUTPUT_FILE = "raw_ingr_with_links.json";
const DELAY_MS = 5000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Extract CAS number via Gemini
async function extractCASNumber(ingredientName, genAI) {
	const prompt = `You are a chemical information assistant. Given the ingredient name "${ingredientName}", provide the CAS number (format: XX-XX-X or XXX-XX-X or XXXX-XX-X). If you cannot find it or are unsure, respond with "NOT_FOUND". 
    Do not include any explanation, just the CAS number or NOT_FOUND.`;

	try {
		const response = await genAI.models.generateContent({
			model: "gemini-2.5-flash",
			contents: [{ text: prompt }],
		});

		const responseText = response.text.trim();
		const casPattern = /^\d{2,7}-\d{2}-\d$/;
		if (casPattern.test(responseText)) {
			return responseText;
		}

		return null;
	} catch (error) {
		console.error(`Error extracting CAS for ${ingredientName}:`, error.message);
		return null;
	}
}

// Generate links for known CAS
function generateLinks(casNumber) {
	if (!casNumber) {
		return {
			link_echa: null,
			link_pubchem: null,
			link_cosIng: null,
		};
	}

	// For ECHA, we need to convert CAS to substance ID format
	// The link format is: https://chem.echa.europa.eu/[SUBSTANCE_ID]/overview?searchText=[CAS]
	const echaLink = `https://chem.echa.europa.eu/substance-search?searchText=${casNumber}`;
	const pubchemLink = `https://pubchem.ncbi.nlm.nih.gov/compound/${casNumber}`;
	const cosIngLink = `https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.results&search=${casNumber}`;

	return {
		link_echa: echaLink,
		link_pubchem: pubchemLink,
		link_cosIng: cosIngLink,
	};
}

// Main process
async function processIngredients() {
	console.log("Starting ingredient processing...");
	const genAI = new GoogleGenAI({});

	// Read input file
	let ingredients;
	try {
		const fileContent = await readFile(INPUT_FILE, "utf-8");
		ingredients = JSON.parse(fileContent);
		console.log(`Loaded ${ingredients.length} ingredients`);
	} catch (error) {
		console.error("Error reading input file:", error.message);
		return;
	}

	const processedIngredients = [];

	for (let i = 0; i < ingredients.length; i++) {
		const ingredient = ingredients[i];
		console.log(
			`\nProcessing ${i + 1}/${ingredients.length}: ${ingredient.name}`,
		);

		let casNumber = ingredient.cas_number;

		// If CAS number is missing, try to extract it using Gemini
		if (!casNumber) {
			console.log(`  Extracting CAS number for ${ingredient.name}...`);
			casNumber = await extractCASNumber(ingredient.name, genAI);

			if (casNumber) {
				console.log(`  Found CAS: ${casNumber}`);
			} else {
				console.log(`  Could not find CAS number`);
			}

			await delay(DELAY_MS);
		} else {
			console.log(`  Using existing CAS: ${casNumber}`);
		}

		// Generate links
		const links = generateLinks(casNumber);

		// Create updated ingredient object
		const updatedIngredient = {
			name: ingredient.name,
			cas_number: casNumber,
			link_echa: links.link_echa,
			link_pubchem: links.link_pubchem,
			link_cosIng: links.link_cosIng,
		};

		processedIngredients.push(updatedIngredient);

		if ((i + 1) % 10 === 0) {
			await writeFile(
				OUTPUT_FILE,
				JSON.stringify(processedIngredients, null, 2),
				"utf-8",
			);
			console.log(`  Progress saved (${i + 1}/${ingredients.length})`);
		}
	}

	// Save final results
	await writeFile(
		OUTPUT_FILE,
		JSON.stringify(processedIngredients, null, 2),
		"utf-8",
	);
	console.log(`\nProcessing complete! Results saved to ${OUTPUT_FILE}`);
}

processIngredients().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
