# Obsidian AI Helper: Components Documentation

This document provides detailed information about the React components used in the Obsidian AI Helper plugin, their organization, and usage patterns.

## Component Organization

Components in the project are organized into several categories:

1. **Core UI Components** (`src/components/ui/`)

    - Shadcn UI-based reusable components (buttons, inputs, etc.)
    - Theme-aware and work with Obsidian's styling

2. **Compound Components** (`src/components/`)

    - Feature-specific components built from core UI components
    - Self-contained functionality for specific plugin features

3. **View Components** (`src/views/`)
    - Obsidian-specific view components that integrate with Obsidian's interface
    - Handle mounting/unmounting of React components into Obsidian's DOM

## Core UI Components

### Button (`src/components/ui/button.tsx`)

A customizable button component built using Shadcn UI principles:

```typescript
import { Button } from "@/src/components/ui/button";

// Usage examples
<Button>Default Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>
<Button size="sm">Small Button</Button>
```

**Properties:**

-   `variant`: Appearance style ('default', 'destructive', 'outline', 'secondary', 'ghost', 'link')
-   `size`: Button size ('default', 'sm', 'lg', 'icon')
-   `asChild`: Boolean to allow rendering as a different element via Radix UI Slot
-   Standard button props (`onClick`, `disabled`, etc.)

## Compound Components

### AIHelperComponent (`src/components/AIHelperComponent.tsx`)

The main component for the AI Helper sidebar view:

```typescript
import { AIHelperComponent } from "@/src/components/AIHelperComponent";

// Usage (typically within AIHelperView)
<AIHelperComponent />;
```

**Features:**

-   Displays basic vault information (name, file count)
-   Expandable interface with a show more/less button
-   Demonstrates accessing Obsidian's App object

### EventDemo (`src/components/EventDemo.tsx`)

A demonstration component showing the event system functionality:

```typescript
import { EventDemo } from "@/src/components/EventDemo";

// Usage
<EventDemo />;
```

**Features:**

-   Displays a message sender and receiver
-   Demonstrates inter-component communication with the event system
-   Shows real-time updates using the event bus

## View Components

### AIHelperView (`src/views/AIHelperView.tsx`)

The main view component for the Obsidian sidebar:

```typescript
// Usage (in main.ts)
this.registerView(AI_HELPER_VIEW_TYPE, (leaf) => new AIHelperView(leaf));
```

**Responsibilities:**

-   Extends Obsidian's `ItemView`
-   Creates and manages the React root
-   Provides the App context to React components
-   Handles proper mounting/unmounting of React components

## Context Providers

### AppContext.Provider

Provides the Obsidian App object to all React components:

```typescript
import { AppContext } from "@/src/context/AppContext";

// Usage
<AppContext.Provider value={this.app}>
	<YourComponent />
</AppContext.Provider>;
```

**Purpose:**

-   Makes the Obsidian App object available to all child components
-   Allows any component to access Obsidian's API

### EventProvider

Provides the event bus for component communication:

```typescript
import { EventProvider } from "@/src/context/EventContext";

// Usage
<EventProvider>
	<YourComponent />
</EventProvider>;
```

**Purpose:**

-   Provides event subscription and emission capabilities
-   Enables loosely coupled component communication

## Hooks

### useApp

Custom hook for accessing the Obsidian App object:

```typescript
import { useApp } from "@/src/hooks/useApp";

// Usage within a component
const MyComponent = () => {
	const app = useApp();
	const files = app?.vault.getMarkdownFiles();
	// ...
};
```

### useEventBus

Hook for accessing the event bus:

```typescript
import { useEventBus } from "@/src/hooks/useEventBus";
import { EventType } from "@/src/utils/EventBus";

// Usage within a component
const MyComponent = () => {
	const { subscribe, emit } = useEventBus();

	useEffect(() => {
		const unsubscribe = subscribe(EventType.SOME_EVENT, (data) => {
			// Handle event
		});
		return unsubscribe;
	}, [subscribe]);

	const handleAction = () => {
		emit(EventType.SOME_EVENT, {
			/* data */
		});
	};
	// ...
};
```

## Component Patterns

### 1. Theme-Aware Components

Components should adapt to Obsidian's theme:

```typescript
// Example using CSS variables
const StyledComponent = () => {
	return (
		<div className="my-component">
			{/* This will use Obsidian's theme variables */}
			<p>Themed content</p>
		</div>
	);
};
```

### 2. Lifecycle Management

Always clean up subscriptions and side effects:

```typescript
useEffect(() => {
	// Setup code
	return () => {
		// Cleanup code
	};
}, [dependencies]);
```

### 3. Error Boundaries

Use error boundaries for component error handling:

```typescript
// Future implementation
<ErrorBoundary fallback={<ErrorDisplay />}>
	<YourComponent />
</ErrorBoundary>
```

## Future Components

The following components are planned but not yet implemented:

1. **Chat Interface Components**

    - MessageList
    - MessageInput
    - ChatControls

2. **Time Capsule Components**

    - CalendarWidget
    - TimePeriodSelector
    - SummaryDisplay

3. **Research Mode Components**

    - SearchInterface
    - ResultsDisplay
    - CrossReferenceViewer

4. **Media Processing Components**
    - YoutubeVideoCard
    - TranscriptionDisplay
    - AudioController

## Guidelines for New Components

When creating new components:

1. Place in the appropriate directory based on function
2. Use TypeScript interfaces for props
3. Implement proper cleanup in useEffect
4. Follow established naming conventions
5. Keep components focused on a single responsibility
6. Use composition over inheritance
7. Add JSDoc comments for component purpose and props
