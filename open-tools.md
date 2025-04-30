# OpenRouter Tools Integration PRD

## Overview

This document outlines the requirements for enhancing the OpenRouter tools integration for the Obsidian AI Helper plugin. The integration allows the AI assistant to use external tools via the OpenRouter API, enabling more powerful and dynamic responses to user queries.

## Current Implementation

The current implementation (in `test-openrouter-tools.ts`) provides a foundation for tool-based interactions but lacks streaming support for real-time responses. The code demonstrates a working console-based chatbot that:

1. Connects to OpenRouter's API using an API key
2. Maintains a conversation history
3. Allows the AI to call external tools (currently a Gutenberg book search API)
4. Processes tool results and sends them back to the AI
5. Displays responses to the user

### Technical Architecture

-   **Message Types**: System, User, Assistant, and Tool messages with appropriate interfaces
-   **Agentic Loop**: A mechanism for handling the conversation flow, tool calls, and responses
-   **Tool Definition**: A structure for defining tools that the AI can use
-   **Tool Execution**: Logic for executing tool calls and processing their results
-   **Chat History Management**: A system for tracking and updating the conversation history

### Current Limitations

-   **Streaming Support**: The code includes a `stream` parameter but attempts to parse streaming responses as regular JSON, causing errors
-   **Single Tool**: Only one tool (Gutenberg book search) is currently implemented
-   **Console-Only Interface**: The current implementation is terminal-based, not integrated with Obsidian's UI
-   **Error Handling**: Limited error handling and recovery mechanisms

## Requirements for Enhancement

### 1. Streaming Response Support

Implement full support for streaming responses from OpenRouter, allowing for:

-   Real-time display of AI responses as they're generated
-   Proper handling of tool calls within streaming responses
-   Appropriate UI updates during streaming

#### Streaming Technical Details

The current implementation fails because it attempts to parse the streaming response as a complete JSON object with:

```typescript
const initialData = await initialQueryResponse.json();
```

However, OpenRouter's streaming responses use the Server-Sent Events (SSE) format, which consists of multiple text lines with each event starting with field names like `data:`. Each chunk looks like:

```
data: {"id": "...", "object": "...", ...}
```

This format requires incremental processing of the response stream, not a single JSON parse operation.

#### Specific Tasks:

-   Implement SSE parsing logic to properly handle streaming responses:
    -   Replace `.json()` calls with response stream handling
    -   Use a `ReadableStream` reader to process chunks as they arrive
    -   Parse individual `data:` prefixed lines into JSON objects
    -   Handle special messages like `[DONE]` markers
-   Create a state management system to accumulate partial responses
-   Develop a mechanism for detecting and handling tool calls mid-stream
-   Add support for cancellation and cleanup of active streams
-   Implement a UI rendering approach that updates as new chunks arrive
-   Add a fallback mechanism for non-streaming mode when needed

### 2. Error Handling and Resilience

Enhance error handling to provide:

-   Graceful degradation when tools fail
-   Clear error messages for the user, especially for streaming-related errors
-   Automatic retry mechanisms where appropriate
-   Proper handling of JSON parse errors in streaming mode
-   Logging for troubleshooting purposes

## Acceptance Criteria

The implementation will be considered successful when:

1. Users can interact with the AI and receive streaming responses that appear in real-time
2. The AI can successfully call tools and incorporate their results into responses, even in streaming mode
3. SSE responses are correctly parsed without the JSON syntax errors currently occurring
4. Error states are handled gracefully with clear user feedback
5. Response streaming can be toggled on/off without affecting core functionality

## Technical Considerations

-   OpenRouter's SSE format compliance and parsing requirements
-   Efficient stream processing to minimize memory usage
-   Rate limiting and token usage optimization
-   Appropriate error handling for network issues and malformed SSE data
-   Proper cleanup of resources (especially for streaming connections)
-   Type safety throughout the implementation
-   Progressive enhancement of the UI as streaming chunks arrive

## Implementation Approach

1. **Stream Processing Implementation**:

    - Create a dedicated stream handler class to process SSE responses
    - Implement incremental parsing of `data:` lines
    - Develop a content accumulator for building complete responses

2. **Tool Integration with Streaming**:

    - Add detection for tool calls within streaming responses
    - Implement a mechanism to pause stream processing when tools need to be called
    - Resume streaming after tool execution completes

3. **Error Recovery**:
    - Add specific error handlers for SSE parsing failures
    - Implement graceful fallback to non-streaming mode when needed
    - Create user-friendly error messages for common streaming issues
