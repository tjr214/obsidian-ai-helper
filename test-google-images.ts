// To run this code you need to install the following dependencies:
// npm install @google/genai mime dotenv
// npm install -D @types/node

import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import { writeFile } from "fs";
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

function saveBinaryFile(fileName: string, content: Buffer) {
	writeFile(fileName, content, "utf8", (err) => {
		if (err) {
			console.error(`Error writing file ${fileName}:`, err);
			return;
		}
		console.log(`File ${fileName} saved to file system.`);
	});
}

async function main() {
	const ai = new GoogleGenAI({ apiKey });
	const config = {
		responseModalities: ["image", "text"],
		responseMimeType: "text/plain",
	};
	const model = "gemini-2.0-flash-exp-image-generation";
	const contents = [
		{
			role: "user",
			parts: [
				{
					text: `Can you make a marijuana mascot sitting on a mushroom in a forest growing inside of a house, all under a blue sky? For adults only, of course. Make her super happy and feminine with reds to accent the greens.`,
				},
			],
		},
	];

	try {
		const response = await ai.models.generateContentStream({
			model,
			config,
			contents,
		});
		for await (const chunk of response) {
			if (
				!chunk.candidates ||
				!chunk.candidates[0].content ||
				!chunk.candidates[0].content.parts
			) {
				continue;
			}
			if (chunk.candidates[0].content.parts[0].inlineData) {
				const fileName = "image_gen.jpg";
				const inlineData =
					chunk.candidates[0].content.parts[0].inlineData;
				const fileExtension = mime.getExtension(
					inlineData.mimeType || ""
				);
				const buffer = Buffer.from(inlineData.data || "", "base64");
				saveBinaryFile(`${fileName}.${fileExtension}`, buffer);
			} else {
				console.log(chunk.text);
			}
		}
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
