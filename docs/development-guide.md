# Obsidian AI Helper: Development Guide

This guide provides instructions for setting up a development environment, building and testing the plugin, and contributing to the project.

## Development Environment Setup

### Prerequisites

-   [Node.js](https://nodejs.org/) v16 or later
-   [pnpm](https://pnpm.io/) for package management
-   [Obsidian](https://obsidian.md/) for testing
-   Git for version control

### Initial Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/tjr214/obsidian-ai-helper.git
    cd obsidian-ai-helper
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Set up development environment variables:
    - Copy `.env.example` to `.env`
    - Add any required API keys for development

### Development Workflow

1. Start the development server with hot-reloading:

    ```bash
    pnpm run dev
    ```

2. For testing in Obsidian:

    - Either clone the repo directly into your Obsidian vault's `.obsidian/plugins/obsidian-ai-helper` directory
    - Or create a symbolic link from your development folder to the plugins directory

3. Enable the plugin in Obsidian:
    - Open Obsidian settings
    - Go to Community Plugins
    - Turn off "Safe mode" if necessary
    - Enable "AI Helper" in the list of installed plugins

## Project Structure

See the [Architecture](./architecture.md) document for a detailed breakdown of the project structure. Here are the key directories for development:

-   `src/` - Main source code
-   `tasks/` - Project tasks and planning
-   `docs/` - Documentation
-   `prompts/` - Prompt templates and examples

## Build Process

The plugin uses esbuild for building:

1. Development build (with watch mode):

    ```bash
    pnpm dev
    ```

2. Production build:
    ```bash
    pnpm run build
    ```

## Task-Based Development

This project uses TaskMaster for task management. To work with tasks:

1. View all tasks:

    ```bash
    task-master list
    ```

2. View the next task to work on:

    ```bash
    task-master next
    ```

3. See details for a specific task:

    ```bash
    task-master show <task-id>
    ```

4. Mark a task as complete:
    ```bash
    task-master set-status --id=<task-id> --status=done
    ```

## Testing

### Manual Testing

1. Start Obsidian with the development version of the plugin
2. Test the relevant functionality
3. Check the Obsidian Developer Console (Ctrl+Shift+I / Cmd+Option+I) for errors

### Automated Testing

(Future) We plan to implement automated testing using:

-   Jest for unit tests
-   React Testing Library for component tests

## Coding Standards

### TypeScript

-   Use TypeScript for all code
-   Enable strict mode
-   Use proper typing for all variables, parameters, and return values
-   Avoid using `any` unless absolutely necessary

### React

-   Use functional components with hooks
-   Apply context for state management
-   Use proper prop typing
-   Follow React best practices

### File Organization

-   Keep components in appropriate directories based on their purpose
-   Create new directories as needed for new features
-   Follow the existing naming conventions

### Code Style

-   Use meaningful variable and function names
-   Add comments for complex logic
-   Follow the established patterns in the codebase

## Working with React in Obsidian

### Key Principles

1. React components must be mounted/unmounted properly:

    ```typescript
    // When mounting
    this.root = createRoot(containerEl);
    this.root.render(<Component />);

    // When unmounting
    this.root?.unmount();
    ```

2. Obsidian's App object should be accessed via the AppContext:

    ```typescript
    const app = useApp();
    const files = app?.vault.getMarkdownFiles();
    ```

3. For UI components, follow the Shadcn pattern and ensure compatibility with Obsidian themes

## Working with Obsidian API

### Key Concepts

-   `app.vault` - Access to files and folders
-   `app.workspace` - Access to the UI workspace, open files, and views
-   `app.metadataCache` - Access to cached metadata for files

### Common Operations

-   Reading a file: `app.vault.read(file)`
-   Creating a file: `app.vault.create(path, data)`
-   Getting file metadata: `app.metadataCache.getFileCache(file)`

## Debugging

1. Use the Obsidian Developer Console (Ctrl+Shift+I / Cmd+Option+I)
2. Add console.log statements for debugging
3. Use the React Developer Tools browser extension when applicable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

### Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation as necessary
3. Link to any relevant issues
4. Request review from maintainers

## Release Process

1. Build the plugin using `pnpm run build`
2. Update version in `manifest.json` and `package.json`
3. Update `versions.json` to include the new version
4. Create a release on GitHub with the built files
5. Submit to the Obsidian Community Plugins if applicable

## Getting Help

If you need help with development:

-   Check the documentation
-   Review the existing code for examples
-   Reach out to the project maintainers
