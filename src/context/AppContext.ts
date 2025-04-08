/**
 * AppContext.ts
 *
 * This file defines a React context for providing access to the Obsidian App object
 * throughout the React component tree. This allows any component to access the App
 * without prop drilling.
 */

import { createContext } from "react";
import { App } from "obsidian";

// Create a context for the Obsidian App object
export const AppContext = createContext<App | undefined>(undefined);
