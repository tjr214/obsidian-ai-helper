// To run this code you need to install the following dependencies:
// npm install @google/genai mime dotenv
// npm install -D @types/node tsx

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Check if API key is present
if (!process.env.GOOGLE_API_KEY) {
	throw new Error(
		"GOOGLE_API_KEY environment variable is required. Add it to your .env file."
	);
}

const apiKey = process.env.GOOGLE_API_KEY;

// const modelName = "gemini-2.5-pro-preview-03-25";
// const modelName = "gemini-2.5-pro-exp-03-25";
const modelName = "gemini-2.0-flash";

// const query = `Summarize this video with Markdown headings and formatting. Provide a Table of Contents that links each heading to the timecode in the youtube video.`;

const query = `Provide a transcript of the video. Also, describe what is going on in detail.`;

/**
 * Demonstration of streaming content generation from Gemini
 */
async function main() {
	console.log(`Initializing Google GenAI with model: ${modelName}...`);
	const ai = new GoogleGenAI({ apiKey });

	// Configuration for the generation request
	const config = {
		responseMimeType: "text/plain",
		maxOutputTokens: 16000,
		// temperature: 0.7,
	};

	const contents = [
		{
			role: "user",
			parts: [
				{
					fileData: {
						fileUri: "https://youtu.be/6ZrO90AI0c8",
						mimeType: "video/*",
					},
				},
				{
					text: query,
				},
			],
		},
	];

	console.log("Sending request to Gemini API...");

	try {
		// Initialize content streaming
		const stream = await ai.models.generateContentStream({
			model: modelName,
			config,
			contents,
		});

		console.log("Response received, streaming content:");
		console.log("----------------------------------------");

		// Process the streaming response
		let fullResponse = "";
		for await (const chunk of stream) {
			// Display each chunk as it arrives
			if (chunk.text) {
				process.stdout.write(chunk.text);
				fullResponse += chunk.text;
			}
		}

		console.log("\n----------------------------------------");
		console.log(
			"Full response received, total length:",
			fullResponse.length
		);
	} catch (error) {
		console.error("Error during content generation:");
		console.error("Error:", error.message);
		if (error.cause) {
			console.error("Cause:", error.cause);
		}
	}
}

main().catch((error) => {
	console.error("Fatal error:", error.message);
	if (error.cause) {
		console.error("Cause:", error.cause);
	}
	process.exit(1);
});
