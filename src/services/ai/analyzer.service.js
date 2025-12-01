import { GoogleGenAI } from "@google/genai";
import { TOOTHPASTE_ANALYSIS_SYSTEM_PROMPT } from "./analysis_system_prompt.js";

const ai = new GoogleGenAI({});

/**
 * Analyze toothpaste to generate overall score and characteristics
 * @param {Object} data - Toothpaste data
 * @param {string} data.name - Toothpaste name
 * @param {string} data.brand - Brand name
 * @param {Array} data.ingredients - Array of ingredient objects with safety scores
 * @param {string} data.imageUrl - URL of product image
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeToothpaste(data) {
	try {
		const { name, brand, ingredients } = data;

		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: JSON.stringify({ ingredients: ingredients }),
			config: {
				systemInstruction: TOOTHPASTE_ANALYSIS_SYSTEM_PROMPT,
				responseMimeType: "application/json",
			}
		});

		const responseText = response.text;

		const analysis = JSON.parse(responseText);
		console.log(analysis);
		// Validate
		const validatedAnalysis = {
			overall_score: Number(analysis.overall_score),
			is_whitening: Boolean(analysis.is_whitening),
			for_sensitive_teeth: Boolean(analysis.for_sensitive_teeth),
			is_fluoride_free: Boolean(analysis.is_fluoride_free),
			is_natural: Boolean(analysis.is_natural),
			for_kids: Boolean(analysis.for_kids),
			analysis_notes: analysis.analysis_notes || "",
		};

		validatedAnalysis.overall_score = Math.max(
			0,
			Math.min(10, validatedAnalysis.overall_score),
		);

		console.log("response", responseText);
		console.log(
			`Analysis complete - Score: ${validatedAnalysis.overall_score}/10`,
		);
		console.log(
			`Characteristics: ${
				Object.entries(validatedAnalysis)
					.filter(([key, val]) => typeof val === "boolean" && val)
					.map(([key]) => key.replace("is_", "").replace("for_", ""))
					.join(", ") || "standard"
			}`,
		);

		return validatedAnalysis;
	} catch (error) {
		console.error("Error analyzing toothpaste:", error);
		throw error;
	}
}
