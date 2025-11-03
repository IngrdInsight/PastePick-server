import sharp from "sharp";
import { GoogleGenAI } from "@google/genai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const genAI = new GoogleGenAI({});
const ALLAS_CONFIG = {
	endpoint: process.env.ALLAS_ENDPOINT,
	bucket: process.env.ALLAS_BUCKET,
	accessKey: process.env.ALLAS_ACCESS_KEY,
	secretKey: process.env.ALLAS_SECRET_KEY,
};

/**
 * Upload and process toothpaste image to Allas object storage
 * @param {Buffer|string} image - Image buffer or base64 string
 * @param {mimeType|string} mimeType - Image mimetype string
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function uploadImageToAllas(image, mimeType) {
	try {
		// 1. Process image with Gemini to remove background and center product
		/*const processedImage = await processImageWithGemini(image, mimeType);
        if (!processedImage) {
            throw new Error("Image processing failed — Gemini did not return an image buffer.");
        }*/

		// 2. Optimize image
		const optimizedImage = await sharp(image)
			.resize(800, 800, {
				fit: "contain",
				background: { r: 255, g: 255, b: 255, alpha: 1 },
			})
			.toFormat("webp", { quality: 90 })
			.toBuffer();

		// 3. Generate unique filename
		const filename = `toothpaste_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

		// 4. Upload to Allas
		const uploadUrl = await uploadToAllas(optimizedImage, filename);

		console.log(`✓ Image uploaded: ${uploadUrl}`);
		return uploadUrl;
	} catch (error) {
		console.error("Error uploading image to Allas:", error);
		throw new Error(`Image upload failed: ${error.message}`);
	}
}

/**
 * Process image with Gemini 2.5 to remove background and center product
 * @param {fileBuffer|string} fileBuffer - Input image
 * @param {mimeType|string} mimeType - Image mimetype string
 * @returns {Promise<Buffer>} Processed image buffer
 */
async function processImageWithGemini(fileBuffer, mimeType) {
	try {
		// Convert image to base64
		const base64Image = fileBuffer.toString("base64");

		const prompt = `You are a product image processor. Your task is to:
                1. Identify the toothpaste tube or package in this image
                2. Remove the background completely (make it pure white)
                3. Center the product in the frame
                4. Ensure the product is clearly visible and properly lit
                5. Output a square image with exact dimensions 800x800 pixels
                
                The output should be a clean, professional product photo on a white background.`;

		const contents = [
			{
				inlineData: {
					mimeType: mimeType,
					data: base64Image,
				},
			},
			{ text: prompt },
		];

		const response = await genAI.models.generateContent({
			model: "gemini-2.5-flash-image",
			contents: contents,
		});

		if (!response?.candidates?.length) {
			throw new Error("Gemini returned no candidates");
		}
		const candidate = response.candidates[0];
		const parts = candidate?.content?.parts;

		if (!Array.isArray(parts)) {
			console.error(
				"Unexpected Gemini response:",
				JSON.stringify(response, null, 2),
			);
			throw new Error("Gemini returned unexpected response format");
		}

		for (const part of response.candidates[0].content.parts) {
			if (part.text) {
				throw new Error(`Wrong image: ${part.text}`);
			} else if (part.inlineData) {
				const imageData = part.inlineData.data;
				const buffer = Buffer.from(imageData, "base64");
				return buffer;
			}
		}
	} catch (error) {
		console.error("Error processing image with Gemini:", error);
	}
}

/**
 * Upload file to Allas object storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Destination filename
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadToAllas(fileBuffer, filename) {
	try {
		const s3 = new S3Client({
			endpoint: ALLAS_CONFIG.endpoint,
			region: "eu-north-1",
			credentials: {
				accessKeyId: ALLAS_CONFIG.accessKey,
				secretAccessKey: ALLAS_CONFIG.secretKey,
			},
			s3ForcePathStyle: true,
		});

		const params = {
			Bucket: ALLAS_CONFIG.bucket,
			Key: filename,
			Body: fileBuffer,
			ContentType: "image/webp",
			ACL: "public-read",
		};

		await s3.send(new PutObjectCommand(params));
		const uploadUrl = `${ALLAS_CONFIG.endpoint}/${ALLAS_CONFIG.bucket}/${filename}`;
		return uploadUrl;
	} catch (error) {
		console.error("Error uploading to Allas:", error);
		throw error;
	}
}
