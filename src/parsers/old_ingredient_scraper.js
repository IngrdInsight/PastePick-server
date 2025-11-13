/**
 * Scrape toothpaste brand websites for ingredient lists.
 * - Fetches HTML from brand URLs
 * - Extracts ingredient sections by keywords/patterns
 * - Saves results into a timestamped text file
 */

import https from "https";
import fs from "fs";

// Brand configurations (URLs, selectors, keywords)
const BRAND_CONFIGS = {
	colgate: {
		url: "",
		selectors: [
			"ingredients",
			"ingredient-list",
			"product-ingredients",
			"accordion",
		],
		keywords: ["ingredients", "active ingredient", "inactive ingredient"],
	},
	oralb: {
		url: "",
		selectors: ["ingredients", "product-details"],
		keywords: ["ingredients"],
	},
	marvis: {
		url: "",
		selectors: ["ingredients", "composition"],
		keywords: ["ingredients", "composition"],
	},
};

// Choose which brand to scrape
const CURRENT_BRAND = "colgate";

// Fetch HTML
function fetchPage(url) {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				let data = "";
				res.on("data", (chunk) => (data += chunk));
				res.on("end", () => resolve(data));
			})
			.on("error", (err) => reject(err));
	});
}

// Extract ingredient sections
function extractIngredients(html, config) {
	const ingredients = [];

	// Search by keyword matches
	config.keywords.forEach((keyword) => {
		const regex = new RegExp(`${keyword}[^a-z]*:?\\s*([^<]+)`, "gi");
		for (const match of html.matchAll(regex)) {
			if (match[1]) {
				const text = match[1]
					.replace(/<[^>]+>/g, "")
					.replace(/&[^;]+;/g, " ")
					.trim();
				if (text.length > 10) ingredients.push(text);
			}
		}
	});

	// Search by common HTML patterns
	const patterns = [
		/(?:active|inactive)?\s*ingredients?[:\s]+([^<]{20,})/gi,
		/<p[^>]*>[^<]*ingredients?[^<]*:([^<]+)<\/p>/gi,
	];
	patterns.forEach((pattern) => {
		for (const match of html.matchAll(pattern)) {
			if (match[1]) {
				const text = match[1]
					.replace(/<[^>]+>/g, "")
					.replace(/&[^;]+;/g, " ")
					.trim();
				if (text.length > 10) ingredients.push(text);
			}
		}
	});

	return [...new Set(ingredients)]; // Remove duplicates
}

// Write to file
function writeToFile(ingredients, brand) {
	const timestamp = new Date().toISOString().split("T")[0];
	const filename = `ingredients_${brand}_${timestamp}.txt`;

	let content = `Ingredients for ${brand.toUpperCase()}\n`;
	content += `Scraped on: ${new Date().toISOString()}\n`;
	content += `URL: ${BRAND_CONFIGS[brand].url}\n`;
	content += `${"=".repeat(50)}\n\n`;

	ingredients.forEach(
		(ingredient, i) => (content += `${i + 1}. ${ingredient}\n\n`),
	);
	fs.writeFileSync(filename, content, "utf8");

	console.log(`✓ Ingredients written to ${filename}`);
}

// scraping
async function scrapeIngredients(brand) {
	const config = BRAND_CONFIGS[brand];
	if (!config.url)
		return console.error(`Error: No URL configured for brand "${brand}"`);

	console.log(`Scraping ${brand}...`);
	try {
		const html = await fetchPage(config.url);
		const ingredients = extractIngredients(html, config);

		if (ingredients.length === 0) {
			console.warn("⚠ No ingredients found. Saving HTML for review...");
			fs.writeFileSync(`debug_${brand}.html`, html, "utf8");
		} else {
			writeToFile(ingredients, brand);
		}
	} catch (err) {
		console.error("Error scraping page:", err.message);
	}
}

// scrapeIngredients(CURRENT_BRAND);
