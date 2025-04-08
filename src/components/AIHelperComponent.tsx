/**
 * AIHelperComponent.tsx
 *
 * The main React component that will be rendered in the AI Helper sidebar.
 * This component demonstrates how to access and use the Obsidian App object.
 */

import React, { useState } from "react";
import { useApp } from "../hooks/useApp";

/**
 * Main component for the AI Helper view that appears in the Obsidian sidebar.
 * Demonstrates accessing the Obsidian App object and displaying vault information.
 */
export const AIHelperComponent: React.FC = () => {
	// Access the Obsidian App object using the custom hook
	const app = useApp();

	// State for tracking various UI elements
	const [isExpanded, setIsExpanded] = useState(false);

	// Get information from the app object
	const vaultName = app?.vault.getName() || "Unknown Vault";
	const numFiles = app?.vault.getMarkdownFiles().length || 0;

	return (
		<div className="ai-helper-container">
			<h3 className="ai-helper-title">AI Helper</h3>

			<div className="ai-helper-info">
				<div className="ai-helper-info-item">
					<strong>Vault:</strong> {vaultName}
				</div>
				<div className="ai-helper-info-item">
					<strong>Files:</strong> {numFiles} markdown files
				</div>
			</div>

			<div className="ai-helper-controls">
				<button
					className="ai-helper-button"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					{isExpanded ? "Show Less" : "Show More"}
				</button>
			</div>

			{isExpanded && (
				<div className="ai-helper-expanded">
					<p>
						This is the expanded content area where additional
						features and information can be displayed.
					</p>
					<p>Future functionality will be implemented here.</p>
				</div>
			)}
		</div>
	);
};
