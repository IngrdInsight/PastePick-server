import * as fs from "node:fs";
import { readFile, writeFile } from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import puppeteer from "puppeteer";

/**
 * Extract unique elements from a comma-separated file
 * @param {string} inputPath - Path to the input file
 * @param {string} outputPath - Path to the output file
 * @returns {Promise<void>}
 */
async function extractUniqueElements(inputPath, outputPath) {
	try {
		const content = fs.readFileSync(inputPath, "utf-8");

		const lines = content.split("\n");
		const allElements = [];

		lines.forEach((line) => {
			const elements = line
				.split(",")
				.map((item) => item.trim().toLowerCase())
				.filter((item) => item.length > 0);
			allElements.push(...elements);
		});

		const uniqueElements = [...new Set(allElements)];
		const output = uniqueElements.join("\n");
		fs.writeFileSync(outputPath, output, "utf-8");

		console.log(`Found ${uniqueElements.length} unique elements`);
		console.log(`Output written to ${outputPath}`);
	} catch (error) {
		console.error("Error processing file:", error.message);
		throw error;
	}
}

/**
 * Fetches content from a URL
 */
async function fetchWebContent(url) {
	let browser;
	try {
		browser = await puppeteer.launch({
			browser: "firefox",
			headless: true,
		});
		const page = await browser.newPage();
		await page.goto(url, {
			waitUntil: "networkidle0",
			timeout: 7500,
		});
		await page.waitForSelector("body", { timeout: 5000 });

		const html = await page.content();
		return html;
	} catch (error) {
		console.error(`Error fetching ${url}:`, error.message);
		return null;
	} finally {
		if (browser) {
			await browser.close();
		}
	}
}

/**
 * Scrapes data from provided links
 */
async function scrapeIngredientData(links) {
	const scrapedData = {};

	for (const [source, url] of Object.entries(links)) {
		if (url) {
			console.log(`Fetching data from ${source}: ${url}`);
			const content = await fetchWebContent(url);
			if (content) {
				scrapedData[source] = {
					url: url,
					content: content.substring(0, 50000),
				};
			}
		}
	}

	return scrapedData;
}

/**
 * Searches for ingredient data if links not provided
 */
async function findIngredientLinks(ingredientName) {
	const searchUrls = {
		pubchem: `https://pubchem.ncbi.nlm.nih.gov/compound/${encodeURIComponent(ingredientName)}`,
		cosIng: `https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.results&search=${encodeURIComponent(ingredientName)}`,
		echa: `https://echa.europa.eu/search-for-chemicals?search_box=${encodeURIComponent(ingredientName)}`,
	};

	console.log(
		`No links provided. Attempting to find data for: ${ingredientName}`,
	);
	return searchUrls;
}

/**
 * system prompt for Gemini
 */
function generateSystemPrompt() {
	return `You are an expert chemicals ingredient analyst. Analyze the provided web data about an ingredient and return a structured JSON response.
    Your analysis should include:
        1. Extract the ingredient name
        2. Determine the category (e.g., "Preservative", "Surfactant", "Humectant", "Antioxidant", etc.)
        3. List key benefits for cosmetic use
        4. List potential risks or concerns
        5. Extract ECHA labeling information (H-codes, EUH-codes)
        6. Calculate a safety score from 1-10 where:
            - 10 = Excellent safety profile, minimal concerns
        - 7-9 = Good safety, minor concerns
        - 4-6 = Moderate concerns, use with caution
        - 1-3 = Significant safety concerns
        7. Extract any regulatory notes or usage restrictions
        8. Preserve the source links

        Base your safety score on:
            - Hazard classifications (H-codes)
            - Regulatory restrictions
            - Known allergenic potential
            - Usage concentration limits
            - Overall risk-benefit profile

Return ONLY valid JSON in this exact format (no markdown, no extra text):
    {
  "name": "ingredient name",
  "category": "category type",
  "benefits": "key benefits for cosmetic use",
  "risks": "potential risks or concerns",
  "labeling_echa": "H-codes and EUH-codes",
  "safety_score": "number from 1-10",
  "regulatory_notes": "any restrictions or required labeling",
  "link_echa": "url or empty string",
  "link_cosIng": "url or empty string",
  "link_pubchem": "url or empty string",
  "link_other": "url or empty string"
    }`;
}

/**
 * Analyze ingredient data
 */
async function analyzeWithGemini(apiKey, scrapedData, ingredientName) {
	const genAI = new GoogleGenAI({});

	// Prepare the raw data text
	let rawDataText = `Ingredient Name: ${ingredientName}\n\n`;
	rawDataText += `Scraped Data:\n`;

	for (const [source, data] of Object.entries(scrapedData)) {
		rawDataText += `\n--- ${source.toUpperCase()} ---\n`;
		rawDataText += `URL: ${data.url}\n`;
		rawDataText += `Content Preview:\n${data.content}\n`;
	}

	if (Object.keys(scrapedData).length === 0) {
		rawDataText += `\nNo web data available. Please use your knowledge about "${ingredientName}" to provide the analysis. Mark this as (own knowledge) in the name field.`;
	}

	console.log("\n=== RAW DATA SENT TO GEMINI ===");
	console.log(rawDataText);
	console.log("=== END RAW DATA ===\n");

	const systemPrompt = generateSystemPrompt();

	const contents = [
		{ text: systemPrompt },
		{ text: rawDataText },
		{ text: "Analyze the above data and return the JSON response:" },
	];

	try {
		const response = await genAI.models.generateContent({
			model: "gemini-2.5-flash",
			contents: contents,
		});

		const responseText = response.text;

		console.log("\n=== GEMINI OUTPUT ===");
		console.log(responseText);
		console.log("=== END GEMINI OUTPUT ===\n");

		return responseText;
	} catch (error) {
		console.error("Error calling Gemini API:", error);
		throw error;
	}
}

/**
 * Parses the Gemini response and cleans the JSON
 */
function parseGeminiResponse(responseText) {
	// Remove markdown code
	let cleanedText = responseText.trim();
	cleanedText = cleanedText.replace(/```json\n?/g, "");
	cleanedText = cleanedText.replace(/```\n?/g, "");
	cleanedText = cleanedText.trim();

	try {
		const parsed = JSON.parse(cleanedText);
		return parsed;
	} catch (error) {
		console.error("Error parsing JSON response:", error);
		console.error("Response text:", cleanedText);
		throw new Error("Failed to parse Gemini response as JSON");
	}
}

/**
 * JSON file operations
 */
async function saveToFile(
	ingredientData,
	filename = "processed_ingredients.json",
) {
	try {
		let existingData = [];

		// Try to read existing file
		try {
			const fileContent = await readFile(filename, "utf-8");
			existingData = JSON.parse(fileContent);
		} catch (error) {
			// File doesn't exist or is empty, start fresh
			console.log("Creating new processed_ingredients.json file");
		}

		// Add new ingredient
		existingData.push(ingredientData);

		// Write back to file
		await writeFile(filename, JSON.stringify(existingData, null, 2), "utf-8");
		console.log(`\n✓ Data saved to ${filename}`);
	} catch (error) {
		console.error("Error saving to file:", error);
		throw error;
	}
}

/**
 * Main function to process ingredient data
 *
 * @param {string} ingredientName - Name of the ingredient
 * @param {Object} links - Object with links: { echa: 'url', cosIng: 'url', pubchem: 'url', other: 'url' }
 * @param {string} apiKey - Google Gemini API key
 */
async function processIngredient(ingredientName, links = {}, apiKey) {
	console.log(`\n${"=".repeat(60)}`);
	console.log(`Processing ingredient: ${ingredientName}`);
	console.log("=".repeat(60));

	try {
		// Scrape data from provided links
		let scrapedData = {};

		if (links.echa || links.cosIng || links.pubchem || links.other) {
			scrapedData = await scrapeIngredientData(links);
		} else {
			// Try to find links automatically
			console.log("No links provided. Searching for ingredient data...");
			const foundLinks = await findIngredientLinks(ingredientName);
			scrapedData = await scrapeIngredientData(foundLinks);
		}

		// Analyze with Gemini
		const geminiResponse = await analyzeWithGemini(
			apiKey,
			scrapedData,
			ingredientName,
		);
		const ingredientData = parseGeminiResponse(geminiResponse);

		// Add metadata about sources
		if (Object.keys(scrapedData).length === 0) {
			ingredientData.name = `${ingredientData.name} (own knowledge)`;
		}

		ingredientData.link_echa = ingredientData.link_echa || links.echa || "";
		ingredientData.link_cosIng =
			ingredientData.link_cosIng || links.cosIng || "";
		ingredientData.link_pubchem =
			ingredientData.link_pubchem || links.pubchem || "";
		ingredientData.link_other = ingredientData.link_other || links.other || "";

		// Save
		await saveToFile(ingredientData);

		console.log("\n✓ Processing complete!");
		console.log("Final data:", JSON.stringify(ingredientData, null, 2));

		return ingredientData;
	} catch (error) {
		console.error(
			`\n✗ Error processing ingredient "${ingredientName}":`,
			error,
		);
		throw error;
	}
}

async function main() {
	await processIngredient("sodium fluoride", {
		echa: "https://chem.echa.europa.eu/100.028.789/overview?searchText=sodium%20fluoride",
		cosIng: "https://ec.europa.eu/growth/tools-databases/cosing/details/87608",
		pubchem: "https://pubchem.ncbi.nlm.nih.gov/compound/5235",
		other: "",
	});
}

// Uncomment to run:
//extractUniqueElements('raw_ingredients.txt', 'processed_ingredients.txt');
main().catch(console.error);

export { processIngredient, scrapeIngredientData, analyzeWithGemini };
