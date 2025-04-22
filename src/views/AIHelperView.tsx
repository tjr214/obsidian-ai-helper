/**
 * AIHelperView.tsx
 *
 * This file defines the custom view that will appear in Obsidian's sidebar.
 * It extends ItemView and manages the lifecycle of the React component.
 */

import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { AIHelperComponent } from "../components/AIHelperComponent";
import { AppContext } from "../context/AppContext";
import { EventProvider } from "../context/EventContext";

// Unique identifier for this view type
export const AI_HELPER_VIEW_TYPE = "ai-helper-view";

/**
 * Custom view that renders a React component in the Obsidian sidebar.
 * Handles the creation, mounting, and cleanup of the React component.
 */
export class AIHelperView extends ItemView {
	// Store the React root to properly unmount it later
	private root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	/**
	 * Returns the unique identifier for this view type.
	 */
	getViewType(): string {
		return AI_HELPER_VIEW_TYPE;
	}

	/**
	 * Returns the display name that appears in the sidebar.
	 */
	getDisplayText(): string {
		return "AI Helper";
	}

	/**
	 * Returns the icon name to be displayed in the sidebar.
	 * Using the same "brain" icon as in the ribbon.
	 */
	getIcon(): string {
		return "brain";
	}

	/**
	 * Gets called when the view is opened.
	 * Creates and mounts the React component.
	 */
	async onOpen(): Promise<void> {
		const { containerEl } = this;

		// Create a React root on the container element
		this.root = createRoot(containerEl.children[1]);

		// Render the React component with App context
		this.root.render(
			<StrictMode>
				<AppContext.Provider value={this.app}>
					<EventProvider>
						<AIHelperComponent />
					</EventProvider>
				</AppContext.Provider>
			</StrictMode>
		);
	}

	/**
	 * Gets called when the view is closed.
	 * Unmounts the React component to prevent memory leaks.
	 */
	async onClose(): Promise<void> {
		// Unmount the React component to prevent memory leaks
		this.root?.unmount();
	}
}
