import FormData from "form-data";
import axios from "axios";

/**
 * Upload and process toothpaste image to Allas object storage
 * @param {Buffer|string} image - Image buffer or base64 string
 * @param {mimeType|string} mimeType - Image mimetype string
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function uploadImageToAllas(image, mimeType) {
	try {
		const filename = `toothpaste_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
		const formData = new FormData();
		formData.append("file", image, {
			filename: filename,
			contentType: mimeType,
		});

		const response = await axios.post(
			process.env.ALLAS_UPLOAD_ENDPOINT,
			formData,
			{
				headers: formData.getHeaders(),
			},
		);

		return response.data;
	} catch (error) {
		console.error("Error uploading image to Allas:", error);
		const errorMsg = error.response?.data?.detail || error.message;
		throw new Error(`Image upload failed: ${errorMsg}`);
	}
}
