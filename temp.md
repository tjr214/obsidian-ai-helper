# 1. What's the main purpose of this plugin?

This plugin is a set of interrelated AI features that assist the user in a variety of ways. The main interface is as an Obsidian View that fits in the right-side panel. This view contains a tab bar where the user can switch between multiple different concurrent conversations. Each chat session can also be popped out into a separate floating window. Each chat session can be in one of 5 modes: "General Chat", "Time Capsule", "Research", or "Youtube Summary", "Transcription".

Within each chat tab, the "chatbot" (agentic AI assistant) has the following capabilities:

-   The chatbot has access to the user's Vault and all the notes therein.
-   It also has agentic tool-using capabilities. With those tools it can search the Vault, read/edit/create new Notes in the Vault, etc. (To accomplish all of this we implement an agentic-loop.)
-   We also implement Anthropic's Model Context Protocol (MCP) to allow the chatbot to use tools.

The 5 Chat Modes:

1. A "General Chat" session is a normal chat session as one would expect.
2. A "Time Capsule" session lets the user summarize any given day.
    - The tab will let us select a date using a calendar widget, whose settings (What day of the week begins the week, etc.) are all inherited from the Obsidian settings.
    - It will summarize the day's events, create a special "Time Capsule" note according to rules we will later specify (and which can be user configured).
    - It will also allow the user to summarize a given week. We will do similar "Time Capsule" things for the summarized week. Which days constitute each "week" is also inherited from the Obsidian settings.
    - Similarly, we can also summarize a given month. To us, "months" run according to the Tropical zodiacal calendar. Tropical Aries is the first month of the Sacred Solar Year, Tropical Taurus is the second sacred month, etc.
    - Finally, we can also summarize a given year and multiple years.
3. A "Research" session where we are focused on doing research that may include general question and answering, questions about specific notes in the Vault, questions that span multiple notes and require use of tools to search and read said notes, and using tools to do 1) basic web searches, 2) more in-depth researches via Perplexity, and 3) using Perplexity's Deep Research models to do even more complex research (all of these things are done via the MCP protocol). Of course, we should be able to save our research to a file or multiple interconnected notes in the Vault.
4. A "Youtube Summary" session where we access the Gemini Pro 2.5 API to summarize Youtube videos, "chat" with those videos, and save the results to the Vault. As Gemini has a huge context window, we can also load up multiple Youtube videos and chat with them at once, perhaps asking the chatbot to find patterns across them (or compare and contrast them, etc.).
5. A "Transcription" mode where we can use the Gemini Pro 2.5 API to transcribe audio files (and even Youtube videos) and save the results to the Vault.

The other modes will also allow the user to select from multiple different AI Models (with `Claude 3.7 Sonnet Thinking` being the default), but the Youtube Summary and Transcription modes will only let you use Gemini Pro 2.5 (as those modes require functionality only available to Gemini Pro 2.5).

# 2. Who is it intended for?

It is intended for anyone who uses Obsidian as a note-taking app, but is specifically focused on agentic tasks within the Vault and tool-calling, summarization of specific time periods, Youtube video summarization, and research tasks of varying complexity and intensity (and cost!).

# 3.What are the key features you'd like to include?

The General Features to be included where already mentioned in #1, above. Any specifics we can work out, together, later or as we go along. Just make sure you verify with me that you understand the scope of the project.

In addition to the Tech Stack already mentioned in the global_rules, we want to use Shadcn UI for the UI components. If at all possible, we want to setup a custom theme where we inherit from the active Obsidian theme and dark/light setting.

# 4. Any specific requirements or integration points with Obsidian?

-   Yes, the plugin will need to have access to the Obsidian `App` object.
    -   We already have this in the `useApp` hook located at: `src/hooks/useApp.ts`.
-   We also need to be able to work with the right side panel. There is already example code in the repo that shows this at: `src/views/AIHelperView.tsx`.
-   Also, we have an AppContext setup at: `src/context/AppContext.ts`.
-   CRITICAL: in the attached global_rules are rules specific to Obsidian that should ALWAYS be referenced when writing code for this plugin.

# 5. Any similar plugins or tools that inspire this project?

There are other chatbot plugins for Obsidian, but they are not focused on the agentic loop, tool-calling, or MCP. Nor do they have Youtube or audio transcription capabilities. Finally, they don't have the "Time Capsule" or "Research" modes -- or ANYTHING similar.

Essentially, outside of the very basic chatbot functionality, this plugin is unique. (Other chatbots for Obsidian do not even support multiple chat sessions in tabs!)

# Follow-up

Let me know how that all sounds. Anything ambiguous we need to clear up? Anything that needs to be added or changed?
