/**
 * EventContext.tsx
 *
 * This file defines a React context for providing access to the EventBus
 * throughout the React component tree. This allows any component to subscribe
 * to and emit events without directly importing the EventBus.
 */

import React, { createContext, useContext, ReactNode } from "react";
import {
	EventBus,
	eventBus as defaultEventBus,
	EventType,
	EventCallback,
} from "../utils/EventBus";

/**
 * Interface for the context value
 */
interface EventContextValue {
	eventBus: EventBus;
	subscribe: <T>(
		eventType: EventType,
		callback: EventCallback<T>
	) => () => void;
	emit: <T>(eventType: EventType, data?: T) => void;
}

// Create context with a default value
const EventContext = createContext<EventContextValue | undefined>(undefined);

/**
 * Props for the EventProvider component
 */
interface EventProviderProps {
	eventBus?: EventBus;
	children: ReactNode;
}

/**
 * Provider component that makes the EventBus available to all child components
 */
export const EventProvider: React.FC<EventProviderProps> = ({
	eventBus = defaultEventBus,
	children,
}) => {
	// Create the context value
	const contextValue: EventContextValue = {
		eventBus,
		subscribe: <T,>(eventType: EventType, callback: EventCallback<T>) =>
			eventBus.subscribe(eventType, callback),
		emit: <T,>(eventType: EventType, data?: T) =>
			eventBus.emit(eventType, data),
	};

	return (
		<EventContext.Provider value={contextValue}>
			{children}
		</EventContext.Provider>
	);
};

/**
 * Custom hook to use the EventContext
 * @returns The EventContext value
 * @throws Error if used outside of an EventProvider
 */
export const useEventContext = (): EventContextValue => {
	const context = useContext(EventContext);

	if (context === undefined) {
		throw new Error("useEventContext must be used within an EventProvider");
	}

	return context;
};
