---
description: Globally Active Rules that Apply No Matter What.
globs: 
alwaysApply: true
---

# Greetings

Hello, Claude! Let's work on developing, building and shipping and Obsidian Plugin, as a Team!

---

# Instructions

Our project is an Obsidian Plugin called `Obsidian AI Helper`. It is an agentic plugin that works with the user's Vault and its files.

We are working with Typescript and React (in Strict mode).

- Always use types.
- Always fully comment and explain our code.
- See the section "Using React in Obsidian Plugins", below, for additional instructions related to React.
- If we are building a component that needs access to the Obsidian `App` object, please see the section "Additional React Instructions Specific to Components Needing App Access" for detailed instructions.
- To see the project layout, see the Section "Project Directory and File Layout", below.

- As we work, read and maintain the `README.md` file.
- Also, always follow the additional instructions given in the "Planning" Section, below.

- Always refer to the latest Obsidain docs, found at: https://docs.obsidian.md/

- When working with libraries and packages, always use the latest version (do not pin versions) of the library.
- When working with libraries and packages, always use the search_tool to get the latest documentation.

- Use your search and read tools to see our codebase and view any files you need to.

- Before beginning any coding work, and at the start of any conversation, make sure we are on the same page. Ask me any questions you need to.

Never just assume things. Asking clarifiying questions is _always_ preferable to just blindly and confidently forging ahead.

IMPORTANT! Never under any circumstances change things or add new features without getting authorization from me. Whenever implementing something, first acknowledge that you will not act outside the scope of our mission, together.

---

# Planning

- Take your time and always think things through.
- Form a plan in your head before acting. You can share that plan with me.

For each feature we are implementing:

  - Create a plan and save it as a markdown file with tasks that we can update and checkoff as we make progress on the project.
  - Also include implementation details and anything else we would need to restart work from where we last left off.
  - Save the markdown file in the `tasks/` directory with a name similar to: `thing-we-are-implementing-progress.md`.
  - Read and continuously update this file as we work.

---

# Using React in Obsidian Plugins

## Create a React Component

This is an example of creating a React Component. It needs to be stored in the project root.

```tsx
export const ReactView = () => {
  return <h4>Hello, React!</h4>;
};
```

## Mount / Unmount the React Component

To use the React component, it needs to be mounted on HTML elements. The following example mounts the ReactView component on the this.containerEl.children[1] element:

```tsx
import { StrictMode } from 'react';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { ReactView } from './ReactView';

const VIEW_TYPE_EXAMPLE = 'example-view';

class ExampleView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return 'Example view';
	}

	async onOpen() {
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<StrictMode>
				<ReactView />,
			</StrictMode>,
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
```

For more information on createRoot and unmount(), refer to the documentation on ReactDOM (https://react.dev/reference/react-dom/client/createRoot#root-render).

You can mount your React component on any HTMLElement, for example status bar items. Just make sure to clean up properly by calling this.root.unmount() when you're done.

---

# Additional React Instructions Specific to Components Needing App Access

## Create And Use an Obsidian App Context

If you want to access the App object from one of your React components, you need to create a React context for the app to make it globally available to all components inside your React view.

1) Use `createContext()` to create a new app context.

```tsx
import { createContext } from 'react';
import { App } from 'obsidian';

export const AppContext = createContext<App | undefined>(undefined);
```

2) Wrap the `ReactView` with a context provider and pass the app as the value.

```tsx
this.root = createRoot(this.containerEl.children[1]);
this.root.render(
  <AppContext.Provider value={this.app}>
    <ReactView />
  </AppContext.Provider>
);
```

3) Create a custom hook to make it easier to use the context in your components.

```tsx
import { useContext } from 'react';
import { AppContext } from './context';

export const useApp = (): App | undefined => {
  return useContext(AppContext);
};
```

4) Use the hook in any React component within `ReactView` to access the app.

```tsx
import { useApp } from './hooks';

export const ReactView = () => {
  const { vault } = useApp();

  return <h4>{vault.getName()}</h4>;
};
```

---

# Project Directory and File Layout

obsidian-ai-helper/
├── 📄 main.ts                  # Main plugin entry point
├── 📄 manifest.json            # Plugin manifest
├── 📄 package.json             # Dependencies and scripts
├── 📄 README.md                # Project documentation
├── 📄 styles.css               # Plugin styles
├── 📄 ReactView.tsx            # Example React component
├── 📄 versions.json            # Version tracking
├── 📄 version-bump.mjs         # Version bump script
├── 📄 .eslintrc                # ESLint configuration
├── 📄 LICENSE                  # Apache 2.0 license
│
├── 📁 src/                     # Source code directory
│   ├── 📁 views/               # React views for Obsidian
│   │   └── 📄 AIHelperView.tsx # Main sidebar view
│   │
│   ├── 📁 components/          # React components
│   │   └── 📄 AIHelperComponent.tsx # Main React component
│   │
│   ├── 📁 hooks/               # Custom React hooks
│   │   └── 📄 useApp.ts        # Hook for accessing Obsidian App
│   │
│   └── 📁 context/             # React contexts
│       └── 📄 AppContext.ts    # Context for Obsidian App object
│
├── 📁 tasks/                   # Project planning and tasks (stored as markdown files)
│
└── 📁 .cursor/                 # Cursor IDE configuration

---
