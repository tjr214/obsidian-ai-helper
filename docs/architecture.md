# Obsidian AI Helper: Architecture

This document outlines the technical architecture of the Obsidian AI Helper plugin, providing an overview of its structure, key components, and design patterns.

## Directory Structure

```
obsidian-ai-helper/
├── docs/                    # Documentation
├── prompts/                 # Prompt templates
├── scripts/                 # Build and helper scripts
├── src/                     # Source code
│   ├── components/          # React components
│   │   ├── ui/              # Shadcn UI components
│   │   └── ...              # Specialized components
│   ├── context/             # React contexts
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   ├── styles/              # CSS and styling
│   ├── utils/               # Utility functions
│   └── views/               # Obsidian view components
├── tasks/                   # Task management
├── main.ts                  # Plugin entry point
├── ReactView.tsx            # Example React component
├── manifest.json            # Plugin manifest
├── package.json             # Dependencies
├── styles.css               # Global CSS
└── ...                      # Configuration files
```

## Core Components

### 1. Plugin Entry Point (main.ts)

The main.ts file is the entry point for the Obsidian plugin. It:

-   Initializes the plugin
-   Registers views with Obsidian
-   Sets up commands and ribbon icons
-   Manages plugin settings
-   Handles lifecycle events (load/unload)

### 2. View System

#### AIHelperView

`src/views/AIHelperView.tsx` implements an Obsidian `ItemView` that:

-   Creates and manages the React root
-   Provides the App context to React components
-   Handles view lifecycle (open/close)
-   Renders the main plugin UI in Obsidian's sidebar

### 3. React Integration

#### AppContext

`src/context/AppContext.ts` creates a React context for sharing the Obsidian App object:

-   Provides access to Obsidian's API throughout the component tree
-   Allows React components to interact with the vault, workspace, and plugin systems

#### useApp Hook

`src/hooks/useApp.ts` provides a simple way to access the App context:

-   Returns the Obsidian App object
-   Provides type safety with TypeScript
-   Simplifies interaction with Obsidian's API

### 4. Event System

#### EventBus

`src/utils/EventBus.ts` implements a custom event system:

-   Enables communication between unrelated components
-   Provides a publish/subscribe pattern
-   Supports typed events with TypeScript

#### EventContext and useEventBus

`src/context/EventContext.tsx` creates a React context for the event system:

-   Provides event bus access throughout the component tree
-   Simplifies subscription and emission of events

### 5. UI Components

#### Shadcn UI Components

`src/components/ui/` contains reusable UI components built with Shadcn:

-   Follows a clean, modern design language
-   Inherits styles from Obsidian's theme
-   Provides consistent UI patterns across the application

#### Custom Components

`src/components/` contains specialized components for the plugin:

-   AIHelperComponent: Main component for the sidebar view
-   EventDemo: Example component demonstrating event system
-   (Future) Chat, Time Capsule, Research, and other mode-specific components

## Design Patterns

### 1. Context-based State Management

The plugin uses React's Context API for state management:

-   AppContext for Obsidian's App object
-   EventContext for event system
-   (Planned) Settings and other global state contexts

### 2. Component Composition

UI is built using a component composition pattern:

-   Small, reusable components combined to create larger interfaces
-   Clear separation of concerns between components
-   Props for passing data down, events for communication up

### 3. Hook-based Logic

Custom hooks encapsulate and reuse logic:

-   useApp for accessing Obsidian's API
-   useEventBus for event communication
-   (Planned) hooks for settings, API calls, etc.

### 4. Event-driven Communication

Components communicate through an event system:

-   Decouples components from direct dependencies
-   Allows for flexible UI arrangements
-   Supports communication across different parts of the application

### 5. Singleton Services

Key services follow the singleton pattern:

-   EventBus as a singleton service
-   (Planned) API clients, settings manager, etc.

## Integration Points

### Obsidian API Integration

The plugin integrates with Obsidian through:

-   Workspace Views (sidebar panel)
-   Vault API (for accessing notes)
-   Settings API (for configuration)
-   UI elements (ribbon icon, status bar)

### External API Integration

(Planned) The plugin will integrate with external APIs:

-   Claude API for AI assistance
-   Gemini API for multimedia processing
-   Perplexity API for enhanced research
-   YouTube API for video processing

## Data Flow

1. User interaction triggers events in React components
2. Events are processed by appropriate handlers
3. API calls to Obsidian or external services are made
4. Results flow back to components through state updates or events
5. UI updates to reflect the new state

## Security Considerations

-   API keys stored securely in Obsidian's data storage
-   User confirmation required for sensitive operations
-   Permissions model for different tool capabilities
-   (Planned) Network request isolation and security measures

## Future Architecture Considerations

-   Modular design to support additional AI modes
-   Extensibility for custom tools and commands
-   Performance optimization for large vaults
-   Support for complex workflows and automation
