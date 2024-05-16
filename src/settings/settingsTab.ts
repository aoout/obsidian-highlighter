import HighlighterPlugin from "../main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class HighlighterSettingsTab extends PluginSettingTab {
	plugin: HighlighterPlugin;
	constructor(app: App, plugin: HighlighterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Tags")
			.setDesc("The tags that will be added to the imported books.")
			.addText((text) =>
				text
					.setPlaceholder("HighlighterBox")
					.setValue(this.plugin.settings.boxTags.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.boxTags = value.split(",").map((tag) => tag.trim());
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("HighlighterBox Type")
			.setDesc("The type of the HighlighterBox that will be used.")
			.addDropdown((text) =>
				text
					.addOptions({
						Folder: "Folder",
						MOC: "MOC",
					})
					.setValue(this.plugin.settings.boxType)
					.onChange(async (value) => {
						this.plugin.settings.boxType = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Template")
			.setDesc("Change the way highlights are displayed.")
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.template)
					.onChange(async (value) => {
						this.plugin.settings.template = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
