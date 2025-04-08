# Obsidian AI Helper

An intelligent assistant plugin for Obsidian (https://obsidian.md) that works with your vault and files.

## Features

The Obsidian AI Helper plugin is an agentic plugin that:

-   Helps you interact with your vault and its files using AI
-   Provides smart assistance for various tasks in your Obsidian workflow
-   Uses modern React-based UI components (in Strict mode) for a beautiful experience
-   Features a dedicated sidebar view for quick access to AI helper functions

### Sidebar View

The plugin adds a dedicated view to Obsidian's right sidebar:

-   Access vault information at a glance
-   Quick actions for common AI assistance tasks
-   Modern UI built with React
-   Seamless integration with Obsidian's look and feel

You can open the sidebar view in two ways:

1. Click the brain icon in the left ribbon
2. Use the command palette and search for "Toggle AI Helper View"

## Project Status

This plugin is currently under active development. Features and documentation will be expanded as development progresses.

## Development Setup

This project uses TypeScript and React (in Strict mode) to provide a modern development experience:

-   Clone this repository to your local machine
-   Make sure you have NodeJS v16 or later installed
-   Run `pnpm install` to install dependencies
-   Run `pnpm run dev` to start compilation in watch mode

For convenience during development, you can clone this repo directly into your `.obsidian/plugins/` folder in your vault.

## Plugin Structure

-   TypeScript for type safety and better code organization
-   React (in Strict mode) for building UI components
-   Clean architecture with well-documented code

### Project Directory Layout

```
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
├── 📁 tasks/                   # Project planning and tasks
│
└── 📁 .cursor/                 # Cursor IDE configuration
```

## Installation

### From Obsidian Community Plugins

_(Once published)_

1. Open Obsidian
2. Go to Settings > Community plugins
3. Search for "AI Helper"
4. Click Install, then Enable

### Installation via Git Clone

1. Open a terminal or command prompt
2. Navigate to your vault's `.obsidian/plugins/` directory
3. Run the following command:
    ```bash
    git clone https://github.com/tjr214/obsidian-ai-helper.git
    ```
4. Restart Obsidian
5. Enable the plugin in Settings > Community plugins

This method is especially useful for developers who want to stay up-to-date with the latest changes or contribute to the project.

### Manual Installation via Releases

1. Download the latest release from the Releases section
2. Extract the files into your vault's `.obsidian/plugins/obsidian-ai-helper/` directory
3. Reload Obsidian
4. Enable the plugin in Settings > Community plugins

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Documentation Resources

-   [Official Obsidian Documentation](https://docs.obsidian.md/) - Reference for Obsidian API and plugin development
-   For more details on developing with React in Obsidian, see the plugin's source code and comments

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Support

If you find this plugin helpful, consider supporting its development:

_(Support links will be added here in the future)_
