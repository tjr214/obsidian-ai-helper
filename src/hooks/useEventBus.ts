/**
 * useEventBus.ts
 *
 * Custom React hook that provides access to the application's event bus.
 * Makes it easy for components to subscribe to and emit events.
 */

import { useEffect, useCallback, useRef } from "react";
import { EventBus, EventType, EventCallback } from "../utils/EventBus";

/**
 * Custom hook that provides access to the EventBus methods and handles
 * automatic unsubscription when the component unmounts.
 *
 * @returns Object containing methods to interact with the EventBus
 */
export const useEventBus = () => {
	const eventBus = EventBus.getInstance();
	const subscriptions = useRef<Array<() => void>>([]);

	/**
	 * Subscribe to an event, with automatic cleanup when the component unmounts.
	 *
	 * @param eventType The event type to subscribe to
	 * @param callback The callback function to be called when the event is emitted
	 */
	const subscribe = useCallback(
		<T>(eventType: EventType, callback: EventCallback<T>) => {
			// Get unsubscribe function from EventBus
			const unsubscribe = eventBus.subscribe(eventType, callback);

			// Store the unsubscribe function for cleanup
			subscriptions.current.push(unsubscribe);

			return unsubscribe;
		},
		[]
	);

	/**
	 * Emit an event with data.
	 *
	 * @param eventType The event type to emit
	 * @param data The data to pass to the callbacks
	 */
	const emit = useCallback(<T>(eventType: EventType, data?: T) => {
		eventBus.emit(eventType, data);
	}, []);

	/**
	 * Clean up all subscriptions when the component unmounts.
	 */
	useEffect(() => {
		// Cleanup function that runs when the component unmounts
		return () => {
			// Call all stored unsubscribe functions
			subscriptions.current.forEach((unsubscribe) => unsubscribe());
			// Clear the subscriptions array
			subscriptions.current = [];
		};
	}, []);

	return {
		subscribe,
		emit,
	};
};
