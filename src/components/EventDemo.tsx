/**
 * EventDemo.tsx
 *
 * A demonstration component showing how to use the event system for
 * communication between unrelated components.
 */

import React, { useState, useEffect } from "react";
import { useEventBus } from "../hooks/useEventBus";
import { EventType } from "../utils/EventBus";

/**
 * Example data type for messages
 */
interface Message {
	id: string;
	text: string;
	timestamp: number;
}

/**
 * Component that sends messages through the event system
 */
export const MessageSender: React.FC = () => {
	const [messageText, setMessageText] = useState("");
	const { emit } = useEventBus();

	const handleSendMessage = () => {
		if (messageText.trim()) {
			// Create a message object
			const message: Message = {
				id: Date.now().toString(),
				text: messageText,
				timestamp: Date.now(),
			};

			// Emit the message event
			emit(EventType.CHAT_MESSAGE_SENT, message);

			// Clear the input
			setMessageText("");
		}
	};

	return (
		<div className="message-sender">
			<h4>Message Sender</h4>
			<div className="message-input-container">
				<input
					type="text"
					value={messageText}
					onChange={(e) => setMessageText(e.target.value)}
					placeholder="Type a message..."
					className="message-input"
					onKeyDown={(e) => {
						if (e.key === "Enter") handleSendMessage();
					}}
				/>
				<button
					className="send-button"
					onClick={handleSendMessage}
					disabled={!messageText.trim()}
				>
					Send
				</button>
			</div>
		</div>
	);
};

/**
 * Component that receives messages through the event system
 */
export const MessageReceiver: React.FC = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const { subscribe } = useEventBus();

	useEffect(() => {
		// Subscribe to message events
		const unsubscribe = subscribe<Message>(
			EventType.CHAT_MESSAGE_SENT,
			(message) => {
				setMessages((prevMessages) => [...prevMessages, message]);
			}
		);

		// Clean up subscription on unmount
		return () => unsubscribe();
	}, [subscribe]);

	return (
		<div className="message-receiver">
			<h4>Message Receiver</h4>
			{messages.length === 0 ? (
				<p className="no-messages">No messages yet. Try sending one!</p>
			) : (
				<ul className="message-list">
					{messages.map((message) => (
						<li key={message.id} className="message-item">
							<span className="message-text">{message.text}</span>
							<span className="message-time">
								{new Date(
									message.timestamp
								).toLocaleTimeString()}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

/**
 * Container component that demonstrates event-based communication
 */
export const EventDemo: React.FC = () => {
	return (
		<div className="event-demo-container">
			<h3>Event System Demo</h3>
			<p className="demo-description">
				This demo shows how components can communicate using the event
				system. Type a message in the sender and it will appear in the
				receiver without direct props passing.
			</p>
			<div className="event-demo-components">
				<MessageSender />
				<MessageReceiver />
			</div>
		</div>
	);
};
