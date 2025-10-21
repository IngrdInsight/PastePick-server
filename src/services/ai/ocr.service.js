import { Mistral } from "@mistralai/mistralai";
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey });

/**
 * Extract ingredients from an image using OCR
 * @param {Object} options - Configuration options
 * @param {string} options.imageUrl - URL of the image
 * @param {boolean} options.includeImageBase64 - Include base64 in response
 * @returns {Promise<string[]>} Array of ingredient strings
 */
export async function extractIngredients(options) {
	const {
		imageUrl,
		includeImageBase64 = true,
		provider = "gemini", // 'mistral' or 'gemini'
	} = options;

	if (!imageUrl) {
		throw new Error("imageUrl must be provided");
	}

	if (provider === "mistral") {
		return extractWithMistral(imageUrl, includeImageBase64);
	} else if (provider === "gemini") {
		return extractWithGemini(imageUrl);
	} else {
		throw new Error('Invalid provider. Use "mistral" or "gemini"');
	}
}

async function extractWithMistral(imageUrl, includeImageBase64) {
	// OCR
	const ocrResponse = await client.ocr.process({
		model: "mistral-ocr-latest",
		document: { type: "image_url", imageUrl },
		includeImageBase64,
	});

	// Extract ingredients using AI
	const ingredientsResponse = await client.chat.complete({
		model: "mistral-medium-latest",
		messages: [
			{
				role: "system",
				content: `Extract the ingredients from this OCR data: ${JSON.stringify(ocrResponse)}.
Return ONLY a comma-separated list of ingredients. Remove any non-ingredient text like brand names, descriptions, or instructions. 
Return plain text with no formatting, no asterisks, no markdown, just the ingredient names separated by commas.`,
			},
		],
	});

	const ingredientsText =
		ingredientsResponse.choices?.[0]?.message?.content || "";
	return parseIngredients(ingredientsText);
}

async function extractWithGemini(imageUrl) {
	const genAI = new GoogleGenAI({});
	const base64ImageFile = fs.readFileSync(
		"/Users/null/WebstormProjects/PastePick-server/src/services/ai/sg.jpeg",
		{
			encoding: "base64",
		},
	);

	const prompt = `Analyze this image and extract ONLY the ingredients list.
Return a comma-separated list of ingredients with no additional text, formatting, or markdown.
Remove brand names, descriptions, instructions, and any non-ingredient text.
Just return the ingredient names separated by commas.`;

	const contents = [
		{
			inlineData: {
				mimeType: "image/jpeg",
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

async function fetchImageAsBase64(imageUrl) {
	const response = await fetch(imageUrl);
	const buffer = await response.arrayBuffer();
	return Buffer.from(buffer).toString("base64");
}

function parseIngredients(ingredientsText) {
	return ingredientsText
		.split(",")
		.map((ingredient) => ingredient.trim())
		.filter((ingredient) => ingredient.length > 0);
}

/**
 * Extract ingredients from a URL
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string[]>} Array of ingredient strings
 */
export async function extractIngredientsFromUrl(imageUrl) {
	return extractIngredients({ imageUrl });
}

/**
 * Extract ingredients from base64 encoded image
 * @param {string} imageBase64 - Base64 encoded image string
 * @returns {Promise<string[]>} Array of ingredient strings
 */
/*export async function extractIngredientsFromBase64(imageBase64) {
    return extractIngredients({ imageBase64 });
}*/
