# Documentation Maintenance Guide

This guide explains how to use the documentation generation prompts and how to maintain proper documentation throughout the project lifecycle.

## Documentation Prompts

The following documentation prompts are available in this directory:

1. **generate-comprehensive-docs.md** - Detailed prompt for generating all documentation files
2. **generate-docs-script.md** - Script-friendly version for automated workflows
3. **documentation-maintenance.md** - This file, explaining documentation maintenance

## When to Generate Documentation

### Initial Documentation

Generate initial documentation when:

-   Starting a new project
-   Taking over an existing project without documentation
-   After significant refactoring or restructuring

Use the `generate-comprehensive-docs.md` prompt to create a complete documentation set in one go.

### Documentation Updates

Update documentation when:

-   Implementing a new feature
-   Making significant architectural changes
-   Changing project structure or patterns
-   Before a major release

## How to Use the Documentation Prompts

### Method 1: Manual Generation with AI Assistant

1. Open the `generate-comprehensive-docs.md` file
2. Send the content to an AI assistant
3. Allow the AI to scan your project
4. Review and commit the generated documentation files

### Method 2: Script-Based Generation

1. Use the prompt from `generate-docs-script.md`
2. Include it in your script or automation workflow
3. Process the output to create the documentation files
4. Review the generated files before committing

## Ongoing Documentation Maintenance

### The Development Log

The `development-log.md` file should be updated regularly:

-   Add entries in reverse chronological order (newest first)
-   Document significant decisions, challenges, and solutions
-   Note major milestones and achievements
-   Update the current status section

Example entry format:

```markdown
### [Date] - [Feature/Change Name]

-   Implemented [feature] using [technology]
-   Resolved [challenge] by [solution]
-   Made decision to use [approach] because [rationale]
```

### Updating Other Documentation Files

-   **architecture.md**: Update when changing project structure or patterns
-   **components.md**: Update when adding, removing, or significantly changing components
-   **development-guide.md**: Update when changing dev processes or requirements
-   **future-plans.md**: Update when roadmap changes or after completing planned features

## Documentation Quality Guidelines

1. **Accuracy** - Documentation must reflect the current state of the code
2. **Clarity** - Use clear, concise language and logical organization
3. **Completeness** - Cover all important aspects of the project
4. **Consistency** - Maintain consistent style, terminology, and formatting
5. **Examples** - Include practical code examples from the actual codebase
6. **Cross-References** - Link between documentation files where appropriate

## Special Considerations for Documentation in Obsidian Plugins

For Obsidian plugins, ensure documentation addresses:

1. **Obsidian API Integration** - How the plugin interacts with Obsidian's API
2. **React in Obsidian** - Patterns for using React within Obsidian's environment
3. **Plugin Settings** - How settings are structured and persisted
4. **User Experience** - How users interact with the plugin
5. **Installation and Usage** - Clear instructions for end users

## Documentation Review Checklist

Before committing documentation updates, verify:

-   [ ] Documentation reflects current code
-   [ ] All 7 documentation files are present and up-to-date
-   [ ] Code examples are accurate and from the actual codebase
-   [ ] Style and formatting are consistent
-   [ ] Cross-references between files are correct
-   [ ] Readability for both new and experienced developers
-   [ ] Development log includes recent changes

## Implementation Recommendations

-   Add documentation review to your PR process
-   Consider automating documentation generation for major releases
-   Keep documentation close to code for better maintainability
-   Use consistent markdown formatting across all documentation
