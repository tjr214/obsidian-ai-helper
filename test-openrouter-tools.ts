import dotenv from "dotenv";
import readline from "readline";

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
	refusal?: string | null;
	reasoning?: string | null;
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
interface AgentMessage {
	content: Message;
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
	datetime?: Date;
}

/*
Set model settings and initialize our chat history.
*/

// Assign our model and starter messages
const llm_model = "google/gemini-2.0-flash-001";
const systemMessage = "You are a helpful assistant.";

// Initialize our chat history
let chatHistory: AgentMessage[] = [
	{
		content: { role: "system", content: systemMessage } as SystemMessage,
		id: "system-message",
		provider: "The Developer",
		model: llm_model,
		datetime: new Date(),
	},
];

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
	messages: AgentMessage[],
	model: string,
	stream = false
): Promise<AgentMessage[]> {
	const agentResponseArray: AgentMessage[] = [];
	const _messages: Message[] = [];

	const initialUserQuery = {
		role: "user",
		content: userQuery,
	} as UserMessage;

	// Extract the content from each message into a format that the LLM API can use
	messages.forEach((message) => {
		_messages.push(message.content);
	});

	// Add the user query to messages
	const updatedMessages: Message[] = [..._messages, initialUserQuery];
	agentResponseArray.push({
		content: initialUserQuery,
		id: "user-message",
		provider: "Human Input",
		model: "my-human-brain-100T-sft-rl",
		datetime: new Date(),
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
				stream,
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
			content: assistantMessage,
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
			datetime: new Date(),
		});
	} else {
		// We didn't get a response so add an error response to the agent response array
		agentResponseArray.push({
			content: {
				role: "assistant",
				content: "Error: Failed to get a response from the model",
			} as AssistantMessage,
			datetime: new Date(),
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
				// Print status message for tool call
				console.log(
					`\x1b[36m🔧 Calling \`${toolName}\` with args: ${JSON.stringify(
						toolArgs.search_terms
					)} 🚀\x1b[0m`
				);
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
					stream,
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
				content: finalData.choices[0].message as AssistantMessage,
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
				datetime: new Date(),
			});
			return agentResponseArray;
		} else {
			console.error("Unexpected response format:", finalData);
			agentResponseArray.push({
				content: {
					role: "assistant",
					content:
						"Error: Failed to get a proper response from the model during Tool-Calling",
				} as AssistantMessage,
				datetime: new Date(),
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
function printChatHistory(messages: AgentMessage[]): void {
	console.log("\n----- CHAT HISTORY -----\n");

	messages.forEach((message, index) => {
		let roleColor = "";
		let roleLabel = "";

		// Set colors and labels based on role
		switch (message.content.role) {
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
			`${roleColor}[${roleLabel} @ ${
				message.datetime
			}]${resetColor} Message #${index + 1}:`
		);

		// Print content
		console.log(`${roleColor}${message.content.content}${resetColor}`);

		// Print tool calls if they exist
		if (
			message.content.role === "assistant" &&
			message.content.tool_calls
		) {
			console.log(`\x1b[33m[TOOL CALLS]:${resetColor}`);
			message.content.tool_calls.forEach((toolCall) => {
				console.log(`  - Function: ${toolCall.function.name}`);
				console.log(`  - Arguments: ${toolCall.function.arguments}`);
			});
		}

		// Print tool response details if it's a tool message
		if (message.content.role === "tool") {
			console.log(`${roleColor}[TOOL DETAILS]:${resetColor}`);
			console.log(`  - Tool Call ID: ${message.content.tool_call_id}`);
			console.log(`  - Tool Name: ${message.content.name}`);
		}

		console.log("\n---\n");
	});

	console.log("----- END OF CHAT HISTORY -----");
}

/*
Function to execute the agent loop with a given input.
*/

async function executeAgentLoop(
	incomingInput: string,
	_chatHistory: AgentMessage[],
	model: string,
	stream = false
): Promise<AgentMessage[]> {
	const localChatHistory = [..._chatHistory]; // Create a local copy of chat history

	try {
		// Call the Agent Loop
		const responseArray = await runBasicAgentLoop(
			incomingInput,
			localChatHistory,
			model,
			stream
		);

		// Process and add all responses from the agent loop to chat history
		responseArray.forEach((agentResponse) => {
			if (agentResponse.content) {
				localChatHistory.push(agentResponse);
			}
		});

		return localChatHistory;
	} catch (error) {
		console.error("Error executing agent loop:", error);
		throw error;
	}
}

/*
Execute the tools demo / test.
*/

// Example usage of the executeAgentLoop function
async function runMain() {
	// Create readline interface for user input
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	// Set up handler for ctrl-c
	rl.on("SIGINT", () => {
		console.log("\nExiting the chatbot...");
		rl.close();
		console.log("Final chatHistory output:\n", chatHistory);
		printChatHistory(chatHistory);
		process.exit(0);
	});

	let continueChat = true;

	while (continueChat) {
		// Prompt the user for input
		const userInput = await new Promise<string>((resolve) => {
			rl.question("\nEnter your query: ", (answer) => {
				resolve(answer);
			});
		});

		// Check if user wants to exit
		if (userInput.toLowerCase() === "/exit") {
			console.log("Exiting the chatbot...");
			continueChat = false;
			continue;
		}

		// Execute the agent loop with user input
		try {
			chatHistory = await executeAgentLoop(
				userInput,
				chatHistory,
				llm_model,
				false
			);

			// Print the chat history
			// printChatHistory([chatHistory[chatHistory.length - 1]]); // Print only the last message
			console.log(
				`AI: ${chatHistory[
					chatHistory.length - 1
				].content.content.trim()}`
			);
		} catch (error) {
			console.error("Error in execution:", error);
		}
	}

	// Close the readline interface when done
	rl.close();
	console.log("\nExiting the chatbot...");
	console.log("Final chatHistory output:\n", chatHistory);
	printChatHistory(chatHistory);
}

// Run our Code
runMain();
