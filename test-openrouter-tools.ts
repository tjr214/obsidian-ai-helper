import dotenv from "dotenv";

/*
Load environment variables from .env file.
*/

// Load environment variables from .env file
dotenv.config();

// Check if API key is present
if (!process.env.OPENROUTER_API_KEY) {
	throw new Error(
		"OPENROUTER_API_KEY environment variable is required. Add it to your .env file."
	);
}

const apiKey = process.env.OPENROUTER_API_KEY;

/*
Define our Message Types for the OpenRouter API.
*/

// Define message types
interface SystemMessage {
	role: "system";
	content: string;
}

interface UserMessage {
	role: "user";
	content: string;
}

interface AssistantMessage {
	role: "assistant";
	content: string;
	tool_calls?: {
		id: string;
		function: {
			name: string;
			arguments: string;
		};
	}[];
}

interface ToolMessage {
	role: "tool";
	tool_call_id: string;
	name: string;
	content: string;
}

type Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage;

/*
Define our various Interfaces for working with Responses.
*/

// Define the Book interface
interface Book {
	id: number;
	title: string;
	authors: Array<{ name: string; birth_year?: number; death_year?: number }>;
}

// Define Gutenberg API response interfaces
interface GutenbergBook {
	id: number;
	title: string;
	authors: Array<{ name: string; birth_year?: number; death_year?: number }>;
	// Include other fields if needed
}

interface GutenbergResponse {
	results: GutenbergBook[];
	// Include other fields if needed
}

// Assign our model and starter messages
const model = "google/gemini-2.0-flash-001";
const systemMessage = "You are a helpful assistant.";

// Initialize our chat history
const chatHistory: (
	| SystemMessage
	| UserMessage
	| AssistantMessage
	| ToolMessage
)[] = [{ role: "system", content: systemMessage }];

/*
Define our Tools.
*/

// Our test tool -- a Gutenberg book search tool
async function searchGutenbergBooks(searchTerms: string[]): Promise<Book[]> {
	const searchQuery = searchTerms.join(" ");
	const url = "https://gutendex.com/books";
	const response = await fetch(`${url}?search=${searchQuery}`);
	const data = (await response.json()) as GutenbergResponse;

	return data.results.map((book: GutenbergBook) => ({
		id: book.id,
		title: book.title,
		authors: book.authors,
	}));
}

/*
Configure our Tools.
*/

// An array containing our tool definitions
const llm_tools = [
	{
		type: "function",
		function: {
			name: "search_gutenberg_books",
			description:
				"Search for books in the Project Gutenberg library based on specified search terms",
			parameters: {
				type: "object",
				properties: {
					search_terms: {
						type: "array",
						items: {
							type: "string",
						},
						description:
							"List of search terms to find books in the Gutenberg library (e.g. ['dickens', 'great'] to search for books by Dickens with 'great' in the title)",
					},
				},
				required: ["search_terms"],
			},
		},
	},
];

// A mapping of tool names to their implementations (used in the agentic loop)
const TOOL_MAPPING: Record<string, (args: string[]) => Promise<Book[]>> = {
	search_gutenberg_books: searchGutenbergBooks,
};

/* ------------------------------------------------------------ */
/* Function to run the basic Agentic Tool-Using Loop */
/* ------------------------------------------------------------ */
async function runBasicAgentLoop(
	userQuery: string,
	messages: Message[]
): Promise<string> {
	// Add the user query to messages
	const updatedMessages: Message[] = [
		...messages,
		{
			role: "user",
			content: userQuery,
		} as UserMessage,
	];

	// Make the initial call to the LLM
	const initialQueryResponse = await fetch(
		"https://openrouter.ai/api/v1/chat/completions",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				tools: llm_tools,
				messages: updatedMessages,
			}),
		}
	);

	const initialData = await initialQueryResponse.json();
	console.log("Initial LLM Response:", initialData);

	// Extract assistant message
	let assistantMessage: AssistantMessage | null = null;
	if (
		initialData.choices &&
		initialData.choices[0] &&
		initialData.choices[0].message
	) {
		assistantMessage = initialData.choices[0].message as AssistantMessage;
		updatedMessages.push(assistantMessage);
	} else {
		return "Error: Failed to get a response from the model";
	}

	// Process the requested tool calls if any exist
	if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
		const toolCalls = assistantMessage.tool_calls;

		for (const toolCall of toolCalls) {
			const toolName = toolCall.function.name;
			const toolArgs = JSON.parse(toolCall.function.arguments);

			// Call the appropriate tool function
			if (TOOL_MAPPING[toolName]) {
				const toolResponse = await TOOL_MAPPING[toolName](
					toolArgs.search_terms
				);

				// console.log("Tool response:", toolResponse);

				// Add the tool response to the messages
				updatedMessages.push({
					role: "tool",
					tool_call_id: toolCall.id,
					name: toolName,
					content: JSON.stringify(toolResponse),
				});
			}
		}

		// Make a second OpenRouter API call with updated messages
		const secondToolCallResponse = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model,
					messages: updatedMessages,
					tools: llm_tools,
				}),
			}
		);

		const finalData = await secondToolCallResponse.json();
		if (
			finalData.choices &&
			finalData.choices[0] &&
			finalData.choices[0].message
		) {
			const finalContent = finalData.choices[0].message.content;
			// console.log("Final Response:", finalContent);
			return finalContent;
		} else {
			console.error("Unexpected response format:", finalData);
			return "Error: Failed to get a proper response from the model";
		}
	}

	// If no tool calls were made, return the initial assistant response
	if (assistantMessage.content) {
		// console.log("Direct Response:", assistantMessage.content);
		return assistantMessage.content;
	}

	return "Error: No content found in the assistant's response";
}

/*
Execute the test.
*/

// Call the function to execute the test
runBasicAgentLoop("What are some books by Charles Darwin?", chatHistory)
	.then((responseText) => {
		// Add the response to chat history
		chatHistory.push({
			role: "assistant",
			content: responseText,
		});
		console.log("Test completed successfully");
		console.log("Final response added to chat history:", responseText);
	})
	.catch((error) => console.error("Error executing test:", error));
