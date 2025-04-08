/**
 * useApp.ts
 *
 * Custom hook that provides access to the Obsidian App object from any React component.
 * Uses the AppContext to retrieve the App instance that was passed down through the context provider.
 */

import { useContext } from "react";
import { App } from "obsidian";
import { AppContext } from "../context/AppContext";

/**
 * Hook to access the Obsidian App object from any component within the AppContext provider.
 *
 * @returns The Obsidian App object or undefined if not within AppContext
 */
export const useApp = (): App | undefined => {
	return useContext(AppContext);
};
