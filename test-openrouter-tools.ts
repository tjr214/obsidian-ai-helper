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
Interfaces and classes for handling streaming responses.
*/

// Define the interface for parsed chunks of SSE data
interface ParsedChunk {
	id?: string;
	event?: string;
	data?:
		| {
				choices?: Array<{
					delta?: {
						content?: string;
						tool_calls?: Array<{
							index: number;
							id?: string;
							function?: {
								name?: string;
								arguments?: string;
							};
						}>;
					};
					finish_reason?: string;
				}>;
				[key: string]: unknown;
		  }
		| string;
	isComplete: boolean;
	isDone: boolean;
}

// Define the interface for stream processor event handlers
interface StreamProcessorEvents {
	onContent?: (content: string) => void;
	onToolCall?: (toolCall: ToolCall) => void;
	onComplete?: () => void;
	onError?: (error: Error) => void;
}

/**
 * StreamingUIManager - handles UI updates for streaming responses
 * Acts as a bridge between the StreamProcessor and UI components
 */
interface StreamingUIOptions {
	debounceInterval?: number;
	statusCallback?: (
		status:
			| "starting"
			| "streaming"
			| "processing-tools"
			| "complete"
			| "error"
	) => void;
	streamCallback?: (content: string, isComplete: boolean) => void;
	toolCallback?: (toolName: string, args: Record<string, unknown>) => void;
	completeCallback?: (fullResponse: AssistantMessage) => void;
	errorCallback?: (error: Error) => void;
}

interface ToolCall {
	id: string;
	function: {
		name: string;
		arguments: string;
	};
}

// Define the interface for tool call delta in streaming responses
interface ToolCallDelta {
	index: number;
	id?: string;
	function?: {
		name?: string;
		arguments?: string;
	};
}

/**
 * Manages UI updates during streaming responses
 * Provides mechanisms for updating UI components and tracking stream state
 */
class StreamingUIManager {
	private content: string;
	private toolCalls: ToolCall[] = [];
	private isStreaming: boolean;
	private debounceTimeout: NodeJS.Timeout | null;
	private options: StreamingUIOptions;

	constructor(options: StreamingUIOptions = {}) {
		this.content = "";
		this.isStreaming = false;
		this.debounceTimeout = null;
		this.options = {
			debounceInterval: options.debounceInterval || 50, // Default to 50ms debounce
			statusCallback: options.statusCallback || (() => {}),
			streamCallback: options.streamCallback || (() => {}),
			toolCallback: options.toolCallback || (() => {}),
			completeCallback: options.completeCallback || (() => {}),
			errorCallback: options.errorCallback || console.error,
		};
	}

	/**
	 * Start a new streaming session
	 */
	startStreaming(): void {
		this.content = "";
		this.toolCalls = [];
		this.isStreaming = true;
		this.options.statusCallback?.("starting");

		// Initial UI update with empty content
		this.options.streamCallback?.("", false);
	}

	/**
	 * Update content with new chunk from stream
	 * @param newContent The new content to append
	 */
	updateContent(newContent: string): void {
		if (!this.isStreaming) {
			this.startStreaming();
		}

		this.options.statusCallback?.("streaming");
		this.content += newContent;

		// Debounce updates to prevent too many UI refreshes
		if (this.debounceTimeout) {
			clearTimeout(this.debounceTimeout);
		}

		this.debounceTimeout = setTimeout(() => {
			this.options.streamCallback?.(this.content, false);
		}, this.options.debounceInterval);
	}

	/**
	 * Handle a tool call detected in the stream
	 * @param toolCall The tool call information
	 */
	handleToolCall(toolCall: ToolCall): void {
		if (toolCall && toolCall.function && toolCall.function.name) {
			this.toolCalls.push(toolCall);
			this.options.toolCallback?.(
				toolCall.function.name,
				toolCall.function.arguments
					? JSON.parse(toolCall.function.arguments)
					: {}
			);
		}
	}

	/**
	 * Update UI to show tool execution is happening
	 */
	startToolExecution(): void {
		this.options.statusCallback?.("processing-tools");
	}

	/**
	 * End the streaming session
	 * @param finalMessage The complete assistant message
	 */
	completeStreaming(finalMessage: AssistantMessage): void {
		// Ensure any debounced updates are applied immediately
		if (this.debounceTimeout) {
			clearTimeout(this.debounceTimeout);
			this.debounceTimeout = null;
		}

		this.isStreaming = false;
		this.options.statusCallback?.("complete");

		// One last update with the complete content
		this.options.streamCallback?.(finalMessage.content, true);

		// Call the completion callback with the full message
		this.options.completeCallback?.(finalMessage);
	}

	/**
	 * Handle an error during streaming
	 * @param error The error that occurred
	 */
	handleError(error: Error): void {
		this.isStreaming = false;
		this.options.statusCallback?.("error");
		this.options.errorCallback?.(error);
	}

	/**
	 * Get the content accumulated so far
	 */
	getCurrentContent(): string {
		return this.content;
	}

	/**
	 * Get the tool calls detected so far
	 */
	getToolCalls(): ToolCall[] {
		return [...this.toolCalls];
	}

	/**
	 * Create StreamProcessorEvents that connect to this UI manager
	 */
	createProcessorEvents(): StreamProcessorEvents {
		return {
			onContent: (content) => this.updateContent(content),
			onToolCall: (toolCall) => this.handleToolCall(toolCall),
			onComplete: () => {}, // We'll call completeStreaming with the full message
			onError: (error) => this.handleError(error),
		};
	}
}

/**
 * StreamProcessor class for handling OpenRouter API streaming responses
 * Processes Server-Sent Events (SSE) format and extracts content and tool calls
 */
class StreamProcessor {
	private reader: ReadableStreamDefaultReader<Uint8Array>;
	private decoder: TextDecoder;
	private buffer: string;
	private done: boolean;
	private events: StreamProcessorEvents;
	private assistantMessage: AssistantMessage;

	/**
	 * Create a new StreamProcessor
	 * @param response The fetch response containing a ReadableStream
	 * @param events Event handlers for different stream events
	 */
	constructor(
		response: Response,
		events: StreamProcessorEvents = {},
		initialMessage?: AssistantMessage
	) {
		if (!response.body) {
			throw new Error("Response body is null, cannot stream");
		}

		this.reader = response.body.getReader();
		this.decoder = new TextDecoder("utf-8");
		this.buffer = "";
		this.done = false;
		this.events = events;

		// Initialize or use provided assistant message
		this.assistantMessage = initialMessage || {
			role: "assistant",
			content: "",
		};
	}

	/**
	 * Get the current state of the assistant message being built
	 */
	getMessage(): AssistantMessage {
		return { ...this.assistantMessage };
	}

	/**
	 * Process a chunk of SSE data
	 * @param chunk The raw text chunk to process
	 * @returns Array of parsed chunks
	 */
	private processChunk(chunk: string): ParsedChunk[] {
		// Add chunk to buffer
		this.buffer += chunk;

		// Split buffer by newlines
		const lines = this.buffer.split("\n");
		// Keep last potentially incomplete line in buffer
		this.buffer = lines.pop() || "";

		const parsedChunks: ParsedChunk[] = [];
		let currentChunk: ParsedChunk = {
			isComplete: false,
			isDone: false,
		};

		// Process each line
		for (const line of lines) {
			// Skip empty lines
			if (!line.trim()) {
				if (currentChunk.data) {
					currentChunk.isComplete = true;
					parsedChunks.push(currentChunk);
					currentChunk = {
						isComplete: false,
						isDone: false,
					};
				}
				continue;
			}

			// Process SSE-formatted lines
			if (line.startsWith("id:")) {
				currentChunk.id = line.substring(3).trim();
			} else if (line.startsWith("event:")) {
				currentChunk.event = line.substring(6).trim();
			} else if (line.startsWith("data:")) {
				const data = line.substring(5).trim();

				// Check for [DONE] message
				if (data === "[DONE]") {
					currentChunk.isDone = true;
					currentChunk.isComplete = true;
					parsedChunks.push(currentChunk);
					continue;
				}

				// Try to parse JSON data
				try {
					currentChunk.data = JSON.parse(data);
				} catch (e) {
					console.error("Error parsing SSE data:", e);
					currentChunk.data = data; // Store as string if not JSON
				}
			}
		}

		// If we have accumulated data without a complete chunk, add it
		if (currentChunk.data && !currentChunk.isComplete) {
			parsedChunks.push(currentChunk);
		}

		return parsedChunks;
	}

	/**
	 * Update the assistant message with delta content
	 * @param delta The content delta to apply
	 */
	private updateMessage(parsedChunk: ParsedChunk): void {
		if (
			!parsedChunk.data ||
			typeof parsedChunk.data === "string" ||
			!parsedChunk.data.choices?.[0]?.delta
		) {
			return;
		}

		const delta = parsedChunk.data.choices[0].delta;

		// Update content if present
		if (delta.content) {
			this.assistantMessage.content += delta.content;
			if (this.events.onContent) {
				this.events.onContent(delta.content);
			}
		}

		// Process tool calls if present
		if (delta.tool_calls) {
			// Process each tool call
			delta.tool_calls.forEach((toolCallDelta: ToolCallDelta) => {
				if (toolCallDelta.index !== undefined) {
					const index = toolCallDelta.index;

					// Initialize tool_calls array if not present
					if (!this.assistantMessage.tool_calls) {
						this.assistantMessage.tool_calls = [];
					}

					// Create a new tool call if needed
					if (!this.assistantMessage.tool_calls[index]) {
						this.assistantMessage.tool_calls[index] = {
							id: toolCallDelta.id || "",
							function: {
								name: "",
								arguments: "",
							},
						};
					}

					// Update the tool call with new information
					if (toolCallDelta.id) {
						this.assistantMessage.tool_calls[index].id =
							toolCallDelta.id;
					}

					if (toolCallDelta.function) {
						if (toolCallDelta.function.name) {
							this.assistantMessage.tool_calls[
								index
							].function.name = toolCallDelta.function.name;
						}

						if (toolCallDelta.function.arguments) {
							this.assistantMessage.tool_calls[
								index
							].function.arguments +=
								toolCallDelta.function.arguments;
						}
					}

					// Call tool call handler if provided
					if (this.events.onToolCall) {
						this.events.onToolCall(
							this.assistantMessage.tool_calls[index]
						);
					}
				}
			});
		}
	}

	/**
	 * Check if a parsed chunk indicates the response is complete
	 * @param parsedChunk The chunk to check
	 * @returns Boolean indicating if response is complete
	 */
	private isFinished(parsedChunk: ParsedChunk): boolean {
		if (parsedChunk.isDone) {
			return true;
		}

		if (
			parsedChunk.data &&
			typeof parsedChunk.data !== "string" &&
			parsedChunk.data.choices?.[0]?.finish_reason
		) {
			return true;
		}

		return false;
	}

	/**
	 * Process the stream until completion
	 * @returns The final assistant message
	 */
	async processStream(): Promise<AssistantMessage> {
		try {
			while (!this.done) {
				const { value, done } = await this.reader.read();
				this.done = done;

				if (done) break;

				// Decode chunk
				const chunk = this.decoder.decode(value, { stream: true });

				// Process the chunk into parsed chunks
				const parsedChunks = this.processChunk(chunk);

				// Update message based on each parsed chunk
				for (const parsedChunk of parsedChunks) {
					this.updateMessage(parsedChunk);

					if (this.isFinished(parsedChunk)) {
						if (this.events.onComplete) {
							this.events.onComplete();
						}
						this.done = true;
						break;
					}
				}
			}

			// Final decode for any remaining bytes in the buffer
			const finalChunk = this.decoder.decode();
			if (finalChunk) {
				const parsedChunks = this.processChunk(finalChunk);
				for (const parsedChunk of parsedChunks) {
					this.updateMessage(parsedChunk);
				}
			}

			return this.getMessage();
		} catch (error) {
			if (this.events.onError) {
				this.events.onError(error as Error);
			}
			throw error;
		} finally {
			if (!this.done) {
				this.reader.releaseLock();
			}
		}
	}

	/**
	 * Stop processing the stream
	 */
	async stop(): Promise<void> {
		if (!this.done) {
			this.done = true;
			await this.reader.cancel();
		}
	}
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

	// Prepare headers for the API request
	const headers: HeadersInit = {
		Authorization: `Bearer ${apiKey}`,
		"Content-Type": "application/json",
	};

	// Add streaming-specific headers if stream mode is enabled
	if (stream) {
		headers["Accept"] = "text/event-stream";
	}

	// Create a streaming UI manager if we're in streaming mode
	const uiManager = stream
		? new StreamingUIManager({
				statusCallback: (status) => {
					// Log status changes for this example
					console.log(`\n\x1b[36m[STREAM STATUS: ${status}]\x1b[0m`);
				},
				streamCallback: (content, isComplete) => {
					// In a real UI, this would update the displayed content
					// For this example, we don't do anything here since we're updating directly from stream events
				},
				toolCallback: (toolName, args) => {
					// Log tool calls for this example
					console.log(
						`\n\x1b[33m[TOOL DETECTED: ${toolName}]\x1b[0m`
					);
				},
		  })
		: null;

	// Make the initial call to the LLM
	const initialQueryResponse = await fetch(
		"https://openrouter.ai/api/v1/chat/completions",
		{
			method: "POST",
			headers,
			body: JSON.stringify({
				model,
				tools: llm_tools,
				messages: updatedMessages,
				stream,
			}),
		}
	);

	// Handle streaming response if stream is true
	if (stream) {
		if (!initialQueryResponse.body) {
			throw new Error("Response body is null, cannot stream");
		}

		// Create a placeholder for the assistant message that we'll build up
		const assistantMessage: AssistantMessage = {
			role: "assistant",
			content: "",
		};

		// Add the placeholder message to our messages and response array
		updatedMessages.push(assistantMessage);
		const assistantResponseEntry: AgentMessage = {
			content: assistantMessage,
			id: "streaming-response",
			provider: "OpenRouter",
			model: model,
			didUseTools: false,
			datetime: new Date(),
		};
		agentResponseArray.push(assistantResponseEntry);

		// Start the streaming UI
		uiManager?.startStreaming();
		console.log("\n\x1b[34m[STREAMING RESPONSE STARTED]\x1b[0m");

		// Create events for the stream processor, connecting to UI manager
		const events: StreamProcessorEvents = uiManager
			? uiManager.createProcessorEvents()
			: {
					onContent: (content) => {
						// Fallback if no UI manager: just write to console
						process.stdout.write(content);
					},
					onToolCall: (_) => {
						// Mark that we're using tools
						assistantResponseEntry.didUseTools = true;
					},
					onComplete: () => {
						console.log("\n\x1b[34m[STREAM COMPLETE]\x1b[0m");
					},
					onError: (error) => {
						console.error("Error processing stream:", error);
					},
			  };

		// Create a stream processor and process the stream
		const streamProcessor = new StreamProcessor(
			initialQueryResponse,
			events,
			assistantMessage
		);

		try {
			// Process the stream and update the message
			await streamProcessor.processStream();

			// Update the response entry with the latest message
			assistantResponseEntry.content = streamProcessor.getMessage();

			// Complete the streaming UI with the final message
			uiManager?.completeStreaming(streamProcessor.getMessage());

			// If tool calls were detected, process them
			if (
				assistantResponseEntry.didUseTools &&
				assistantMessage.tool_calls &&
				assistantMessage.tool_calls.length > 0
			) {
				// Update UI to show tool execution is happening
				uiManager?.startToolExecution();

				const toolCalls = assistantMessage.tool_calls;

				for (const toolCall of toolCalls) {
					const toolName = toolCall.function.name;
					try {
						const toolArgs = JSON.parse(
							toolCall.function.arguments
						);

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

							// Add the tool response to the messages
							updatedMessages.push({
								role: "tool",
								tool_call_id: toolCall.id,
								name: toolName,
								content: JSON.stringify(toolResponse),
							} as ToolMessage);

							// Add tool message to response array
							agentResponseArray.push({
								content: {
									role: "tool",
									tool_call_id: toolCall.id,
									name: toolName,
									content: JSON.stringify(toolResponse),
								} as ToolMessage,
								id: `tool-response-${toolCall.id}`,
								provider: "Tool Provider",
								model: "tool-execution",
								datetime: new Date(),
							});
						}
					} catch (e) {
						console.error(
							`Error processing tool call ${toolName}:`,
							e
						);
					}
				}

				// Make a second OpenRouter API call with updated messages
				console.log(
					"\n\x1b[34m[MAKING SECOND CALL WITH TOOL RESULTS]\x1b[0m\n"
				);

				// Create a new UI manager for the second response if we're streaming
				const secondUIManager = stream
					? new StreamingUIManager({
							statusCallback: (status) => {
								console.log(
									`\n\x1b[36m[SECOND STREAM STATUS: ${status}]\x1b[0m`
								);
							},
							streamCallback: (content, isComplete) => {
								// For this example, we don't do anything here
							},
					  })
					: null;

				const secondToolCallResponse = await fetch(
					"https://openrouter.ai/api/v1/chat/completions",
					{
						method: "POST",
						headers: stream
							? {
									...headers,
									Accept: "text/event-stream",
							  }
							: headers,
						body: JSON.stringify({
							model,
							messages: updatedMessages,
							tools: llm_tools,
							stream,
						}),
					}
				);

				// Process second stream response
				if (stream && secondToolCallResponse.body) {
					// Start the second UI manager
					secondUIManager?.startStreaming();

					// Create a new message for the second response
					const secondAssistantMessage: AssistantMessage = {
						role: "assistant",
						content: "",
					};

					// Add it to our updated messages
					updatedMessages.push(secondAssistantMessage);

					// Create a response entry for it
					const secondAssistantResponseEntry: AgentMessage = {
						content: secondAssistantMessage,
						id: "streaming-response-after-tools",
						provider: "OpenRouter",
						model: model,
						didUseTools: false,
						datetime: new Date(),
					};
					agentResponseArray.push(secondAssistantResponseEntry);

					// Create events for the second stream processor, connecting to UI manager
					const secondEvents: StreamProcessorEvents = secondUIManager
						? secondUIManager.createProcessorEvents()
						: {
								onContent: (content) => {
									// Fallback if no UI manager: just write to console
									process.stdout.write(content);
								},
								onComplete: () => {
									console.log(
										"\n\x1b[34m[SECOND STREAM COMPLETE]\x1b[0m"
									);
								},
								onError: (error) => {
									console.error(
										"Error processing second stream:",
										error
									);
								},
						  };

					// Process the second stream
					console.log(
						"\x1b[34m[SECOND STREAMING RESPONSE STARTED]\x1b[0m"
					);

					const secondStreamProcessor = new StreamProcessor(
						secondToolCallResponse,
						secondEvents,
						secondAssistantMessage
					);

					// Process the stream and update the message
					await secondStreamProcessor.processStream();

					// Update the response entry with the latest message
					secondAssistantResponseEntry.content =
						secondStreamProcessor.getMessage();

					// Complete the second streaming UI with the final message
					secondUIManager?.completeStreaming(
						secondStreamProcessor.getMessage()
					);

					return agentResponseArray;
				} else {
					// Non-streaming second response handling
					const finalData = await secondToolCallResponse.json();

					if (
						finalData.choices &&
						finalData.choices[0] &&
						finalData.choices[0].message
					) {
						// Add the secondary Tool-Calling response to the agent response array
						agentResponseArray.push({
							content: finalData.choices[0]
								.message as AssistantMessage,
							id: finalData.id,
							provider: finalData.provider,
							model: finalData.model,
							object: finalData.object,
							usage: {
								promptTokens:
									finalData.usage?.prompt_tokens || 0,
								completionTokens:
									finalData.usage?.completion_tokens || 0,
								totalTokens: finalData.usage?.total_tokens || 0,
							},
							didUseTools:
								finalData.choices &&
								finalData.choices[0].finish_reason ===
									"tool_calls",
							datetime: new Date(),
						});
					} else {
						console.error(
							"Unexpected response format in second call:",
							finalData
						);
						agentResponseArray.push({
							content: {
								role: "assistant",
								content:
									"Error: Failed to get a proper response from the model during Tool-Calling",
							} as AssistantMessage,
							datetime: new Date(),
						});
					}
				}
			}

			return agentResponseArray;
		} catch (error) {
			console.error("Error processing stream:", error);
			uiManager?.handleError(error as Error);
			throw error;
		}
	} else {
		// Original non-streaming code path
		const initialData = await initialQueryResponse.json();
		// console.log("Initial LLM Response:", initialData);

		// Extract assistant message
		let assistantMessage: AssistantMessage | null = null;
		if (
			initialData.choices &&
			initialData.choices[0] &&
			initialData.choices[0].message
		) {
			assistantMessage = initialData.choices[0]
				.message as AssistantMessage;
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
		if (
			assistantMessage.tool_calls &&
			assistantMessage.tool_calls.length > 0
		) {
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
					headers,
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
						completionTokens:
							finalData.usage?.completion_tokens || 0,
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

		const resetColor = "\x1b[0m"; // Reset color

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

const enableStreaming = true;

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
				enableStreaming
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
