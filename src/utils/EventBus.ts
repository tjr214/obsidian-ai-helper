/**
 * EventBus.ts
 *
 * This file implements an event bus pattern for communication between components.
 * It provides a way to subscribe to events, unsubscribe, and emit events with payload data.
 */

/**
 * EventCallback interface defines the shape of callback functions registered to the event bus.
 * T represents the type of data that will be passed when the event is emitted.
 */
export interface EventCallback<T = unknown> {
	(data: T): void;
}

/**
 * Event type for the application.
 * This can be extended to include all event types needed for the application.
 */
export enum EventType {
	// Chat events
	CHAT_MESSAGE_SENT = "chat_message_sent",
	CHAT_MESSAGE_RECEIVED = "chat_message_received",
	CHAT_SESSION_CREATED = "chat_session_created",
	CHAT_SESSION_DELETED = "chat_session_deleted",
	CHAT_SESSION_UPDATED = "chat_session_updated",

	// UI events
	TAB_CHANGED = "tab_changed",
	VIEW_CREATED = "view_created",
	VIEW_DESTROYED = "view_destroyed",
	VIEW_STATE_CHANGED = "view_state_changed",

	// Tool events
	TOOL_EXECUTION_STARTED = "tool_execution_started",
	TOOL_EXECUTION_COMPLETED = "tool_execution_completed",
	TOOL_EXECUTION_FAILED = "tool_execution_failed",

	// Settings events
	SETTINGS_CHANGED = "settings_changed",

	// Vault events
	VAULT_CHANGE = "vault_change",
	FILE_CREATED = "file_created",
	FILE_MODIFIED = "file_modified",
	FILE_DELETED = "file_deleted",
}

/**
 * EventBus class implements the event bus pattern for the application.
 * It allows components to subscribe to events, unsubscribe, and emit events.
 */
export class EventBus {
	private static instance: EventBus;
	private listeners: Map<EventType, Set<EventCallback>>;

	/**
	 * Private constructor to enforce singleton pattern.
	 */
	private constructor() {
		this.listeners = new Map();
	}

	/**
	 * Get the singleton instance of EventBus.
	 */
	public static getInstance(): EventBus {
		if (!EventBus.instance) {
			EventBus.instance = new EventBus();
		}
		return EventBus.instance;
	}

	/**
	 * Subscribe to an event with a callback function.
	 *
	 * @param eventType The event type to subscribe to
	 * @param callback The callback function to be called when the event is emitted
	 * @returns A function to unsubscribe the callback
	 */
	public subscribe<T>(
		eventType: EventType,
		callback: EventCallback<T>
	): () => void {
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, new Set());
		}

		this.listeners.get(eventType)?.add(callback);

		// Return an unsubscribe function
		return () => this.unsubscribe(eventType, callback);
	}

	/**
	 * Unsubscribe a callback from an event.
	 *
	 * @param eventType The event type to unsubscribe from
	 * @param callback The callback function to unsubscribe
	 */
	public unsubscribe(eventType: EventType, callback: EventCallback): void {
		const callbacks = this.listeners.get(eventType);
		if (callbacks) {
			callbacks.delete(callback);

			// Clean up the map entry if there are no more listeners
			if (callbacks.size === 0) {
				this.listeners.delete(eventType);
			}
		}
	}

	/**
	 * Emit an event with data to all subscribed callbacks.
	 *
	 * @param eventType The event type to emit
	 * @param data The data to pass to the callbacks
	 */
	public emit<T>(eventType: EventType, data?: T): void {
		const callbacks = this.listeners.get(eventType);

		if (callbacks) {
			callbacks.forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					console.error(
						`Error in event callback for ${eventType}:`,
						error
					);
				}
			});
		}
	}

	/**
	 * Clear all listeners for a specific event type.
	 *
	 * @param eventType The event type to clear listeners for
	 */
	public clearListeners(eventType: EventType): void {
		this.listeners.delete(eventType);
	}

	/**
	 * Clear all listeners for all event types.
	 */
	public clearAllListeners(): void {
		this.listeners.clear();
	}
}

// Export a default instance for easy imports
export const eventBus = EventBus.getInstance();
