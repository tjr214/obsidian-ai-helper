import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { AIHelperView, AI_HELPER_VIEW_TYPE } from "./src/views/AIHelperView";

// Remember to rename these classes and interfaces!

interface ObsidainAIPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: ObsidainAIPluginSettings = {
	mySetting: "default",
};

export default class ObsidainAIPlugin extends Plugin {
	settings: ObsidainAIPluginSettings;

	async onload() {
		await this.loadSettings();

		// Register the AI Helper view
		this.registerView(
			AI_HELPER_VIEW_TYPE,
			(leaf) => new AIHelperView(leaf)
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"brain", // Using a more appropriate icon
			"Open AI Helper View",
			(evt: MouseEvent) => {
				// Activate the AI Helper view in the right sidebar
				this.activateView();
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("AI Helper Ready");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// Add a command to toggle the AI Helper view
		this.addCommand({
			id: "toggle-ai-helper-view",
			name: "Toggle AI Helper View",
			callback: () => {
				this.activateView();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	/**
	 * Method to activate the AI Helper view in the right sidebar.
	 * If the view is already open, it will just reveal it.
	 * Otherwise, it will create a new leaf in the right sidebar.
	 */
	async activateView() {
		// If the view is already open, don't open another one
		const existingLeaves =
			this.app.workspace.getLeavesOfType(AI_HELPER_VIEW_TYPE);
		if (existingLeaves.length > 0) {
			// Reveal the existing leaf
			this.app.workspace.revealLeaf(existingLeaves[0]);
			return;
		}

		// Open a new leaf in the right sidebar
		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: AI_HELPER_VIEW_TYPE,
				active: true,
			});

			// Reveal the newly created leaf
			const leaves =
				this.app.workspace.getLeavesOfType(AI_HELPER_VIEW_TYPE);
			if (leaves.length > 0) {
				this.app.workspace.revealLeaf(leaves[0]);
			}
		}
	}

	onunload() {
		// Clean up by detaching views
		this.app.workspace.detachLeavesOfType(AI_HELPER_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: ObsidainAIPlugin;

	constructor(app: App, plugin: ObsidainAIPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
