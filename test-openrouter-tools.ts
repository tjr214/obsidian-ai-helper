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
Define our various Interfaces for working with Responses from the Agentic Loop..
*/

// Define the interface for the response from the agentic loop
interface AgentResponse {
	response: Message;
	id?: string;
	provider?: string;
	model?: string;
	object?: string;
	usage?: {
		promptTokens?: number;
		completionTokens?: number;
		totalTokens?: number;
	};
	didUseTools?: boolean;
}

/*
Set model settings and initialize our chat history.
*/

// Assign our model and starter messages
const model = "google/gemini-2.0-flash-001";
const systemMessage = "You are a helpful assistant.";

// Initialize our chat history
const chatHistory: (
	| SystemMessage
	| UserMessage
	| AssistantMessage
	| ToolMessage
)[] = [{ role: "system", content: systemMessage } as SystemMessage];

/*
Define our various Interfaces for working with Tool Responses.
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
): Promise<AgentResponse[]> {
	const agentResponseArray: AgentResponse[] = [];

	const initialUserQuery = {
		role: "user",
		content: userQuery,
	} as UserMessage;

	// Add the user query to messages
	const updatedMessages: Message[] = [...messages, initialUserQuery];
	agentResponseArray.push({
		response: initialUserQuery,
	});

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
	// console.log("Initial LLM Response:", initialData);

	// Extract assistant message
	let assistantMessage: AssistantMessage | null = null;
	if (
		initialData.choices &&
		initialData.choices[0] &&
		initialData.choices[0].message
	) {
		assistantMessage = initialData.choices[0].message as AssistantMessage;
		updatedMessages.push(assistantMessage);

		// We got a response so add the initial response to the agent response array
		agentResponseArray.push({
			response: assistantMessage,
			id: initialData.id,
			provider: initialData.provider,
			model: initialData.model,
			object: initialData.object,
			usage: {
				promptTokens: initialData.usage?.prompt_tokens || 0,
				completionTokens: initialData.usage?.completion_tokens || 0,
				totalTokens: initialData.usage?.total_tokens || 0,
			},
			didUseTools:
				initialData.choices &&
				initialData.choices[0].finish_reason === "tool_calls",
		});
	} else {
		// We didn't get a response so add an error response to the agent response array
		agentResponseArray.push({
			response: {
				role: "assistant",
				content: "Error: Failed to get a response from the model",
			} as AssistantMessage,
		});
		return agentResponseArray; //return because we are erroring out
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
				} as ToolMessage);
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
			// We got a response to our tool-call response, so add the secondary Tool-Calling response to the agent response array
			agentResponseArray.push({
				response: finalData.choices[0].message as AssistantMessage,
				id: finalData.id,
				provider: finalData.provider,
				model: finalData.model,
				object: finalData.object,
				usage: {
					promptTokens: finalData.usage?.prompt_tokens || 0,
					completionTokens: finalData.usage?.completion_tokens || 0,
					totalTokens: finalData.usage?.total_tokens || 0,
				},
				didUseTools:
					finalData.choices &&
					finalData.choices[0].finish_reason === "tool_calls",
			});
			return agentResponseArray;
		} else {
			console.error("Unexpected response format:", finalData);
			agentResponseArray.push({
				response: {
					role: "assistant",
					content:
						"Error: Failed to get a proper response from the model during Tool-Calling",
				} as AssistantMessage,
			});
			return agentResponseArray;
		}
	}

	// If no tool calls were made, return the initial assistant response
	return agentResponseArray;
}

/*
Helper Function.
*/

// Function to print formatted chat history
function printChatHistory(messages: Message[]): void {
	console.log("\n----- CHAT HISTORY -----\n");

	messages.forEach((message, index) => {
		let roleColor = "";
		let roleLabel = "";

		// Set colors and labels based on role
		switch (message.role) {
			case "system":
				roleColor = "\x1b[35m"; // Magenta for system
				roleLabel = "SYSTEM";
				break;
			case "user":
				roleColor = "\x1b[32m"; // Green for user
				roleLabel = "USER";
				break;
			case "assistant":
				roleColor = "\x1b[34m"; // Blue for assistant
				roleLabel = "ASSISTANT";
				break;
			case "tool":
				roleColor = "\x1b[33m"; // Yellow for tool
				roleLabel = "TOOL";
				break;
		}

		const resetColor = "\x1b[0m";

		// Print the message with role and content
		console.log(
			`${roleColor}[${roleLabel}]${resetColor} Message #${index + 1}:`
		);

		// Print content
		console.log(`${roleColor}${message.content}${resetColor}`);

		// Print tool calls if they exist
		if (message.role === "assistant" && message.tool_calls) {
			console.log(`\x1b[33m[TOOL CALLS]:${resetColor}`);
			message.tool_calls.forEach((toolCall) => {
				console.log(`  - Function: ${toolCall.function.name}`);
				console.log(`  - Arguments: ${toolCall.function.arguments}`);
			});
		}

		// Print tool response details if it's a tool message
		if (message.role === "tool") {
			console.log(`${roleColor}[TOOL DETAILS]:${resetColor}`);
			console.log(`  - Tool Call ID: ${message.tool_call_id}`);
			console.log(`  - Tool Name: ${message.name}`);
		}

		console.log("\n---\n");
	});

	console.log("----- END OF CHAT HISTORY -----");
}

/*
Execute the test.
*/

// Call the function to execute the test
runBasicAgentLoop("What are some books by Charles Darwin?", chatHistory)
	.then((responseArray) => {
		// Process and add all responses from the agent loop to chat history
		responseArray.forEach((agentResponse) => {
			if (agentResponse.response) {
				chatHistory.push(agentResponse.response);
			}
		});

		console.log("Test completed successfully");
		console.log("Final response added to chat history:", responseArray);

		// Print the chat history using the new function
		printChatHistory(chatHistory);
	})
	.catch((error) => console.error("Error executing test:", error));
