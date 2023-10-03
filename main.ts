/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Notice, Plugin, TFile } from "obsidian";
import { Modal } from "src/Modal";
import { HLNoteBuilder } from "src/HLNoteBuilder";
import { Highlight, FolderHLBox, MOCHLBox } from "src/HLBox";
import { HighlightParser } from "src/HighlightParser";
import { DEFAULT_SETTINGS, HighlighterSettings } from "src/settings";
import { HighlighterSettingsTab } from "src/settingsTab";
import { PluginApi } from "src/ExtendedObsidianApi/PluginApi";

export default class HighlighterPlugin extends Plugin {
	api: PluginApi;
	settings: HighlighterSettings;
	async onload() {
		this.api = new PluginApi(this);
		await this.loadSettings();
		this.addSettingTab(new HighlighterSettingsTab(this.app, this));
		
		this.addCommand({
			id: "switch-highlighted-selected",
			name: "Switch highlighted status on selected text",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				const editor = this.app.workspace.activeEditor?.editor;
				if (!activeFile || !editor) return;
				const selectedText = editor.getSelection();
				const content = await this.api.readFile(activeFile);
				this.api.writeFile(
					activeFile,
					content.replace(
						selectedText,
						HighlightParser.switchHighlight(selectedText)
					)
				);
			},
		});
		this.addCommand({
			id: "clear-highlights",
			name: "Clear hightlights on this file",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return;
				const content = await this.api.readFile(activeFile);
				this.api.writeFile(
					activeFile,
					content.replace(/==(.+)==/g, "$1")
				);
			},
		});
		this.addCommand({
			id: "search-highlights",
			name: "Search highlights on this file",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return;
				const highlights = await this.getHighlights(activeFile);
				new Modal(this, highlights).open();
			},
		});
		this.addCommand({
			id: "search-highlights-from-box",
			name: "Search highlights on this HighlightBox",
			callback: async () => {
				await this.searchHighlightsinBox();
			},
		});
		this.addCommand({
			id: "update-highlights-file",
			name: "Update -hightlights file.",
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				this.updateHighlightsFile(activeFile);
			},
		});
		this.addCommand({
			id: "jump-between-source-and-highlights",
			name: "Jump between source and highlights",
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				const seclection =
					this.app.workspace.activeEditor?.editor?.getSelection();
				if (
					!activeFile ||
					!seclection ||
					!HighlightParser.isHighlight(seclection)
				)
					return;
				const seclectedText = HighlightParser.ReHighlight(seclection);
				if (activeFile.basename.includes("-highlights")) {
					this.jumpToSource(activeFile, seclectedText);
				} else {
					this.jumpToHighlights(activeFile, seclectedText);
				}
			},
		});
		this.addRibbonIcon("search", "search highlights in box", async () => {
			await this.searchHighlightsinBox();
		});
		this.addRibbonIcon(
			"rotate-ccw",
			"update -highlights file",
			async () => {
				const activeFile = this.app.workspace.getActiveFile();
				await this.updateHighlightsFile(activeFile);
			}
		);

		this.app.workspace.on("file-open", async (file) => {
			if (!this.settings.autoUpdate) return;
			if (!file || !file.basename.includes("-highlights")) return;
			await this.updateHighlightsFile(file);
		});
	}

	async searchHighlightsinBox() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;
		const HLBox = this.settings.boxType == "MOC" ? MOCHLBox : FolderHLBox;
		const box = await HLBox.findBox(this, activeFile?.path);
		if (!box) {
			new Notice("This file is not in a highlight box.");
			return;
		}
		const highlights = await box.getHighlights();
		if (!highlights) return;
		console.log("highlights", highlights);
		new Modal(this, highlights).open();
	}

	async updateHighlightsFile(file: TFile | null) {
		if (!file || !file.basename.includes("-highlights")) {
			new Notice("This file is not a highlights file.");
			return;
		}
		const key = this.api.getFilebyPath(
			file.path.replace("-highlights", "")
		);
		if (!key) return;
		const HLBox = this.settings.boxType == "MOC" ? MOCHLBox : FolderHLBox;
		const box = new HLBox(this, key);
		const highlights = await box.getHighlights();
		if (!highlights) return;
		const builder = HLNoteBuilder.create(highlights);
		const content = await this.api.readFile(file);
		builder.mergeComment(new HLNoteBuilder(content));
		this.api.writeFile(file, builder.toString());
		new Notice("Highlights updated.");
	}

	async jumpToSource(activeFile: TFile, seclectedText: string) {
		const HLBox = this.settings.boxType == "MOC" ? MOCHLBox : FolderHLBox;
		const key = this.api.getFilebyPath(
			activeFile.path.replace("-highlights", "")
		);
		if (!key) return;
		const box = new HLBox(this, key);
		if (!box) return;
		const highlights = await box.getHighlights();
		if (!highlights) return;
		const target = highlights.find((h) => h.content == seclectedText);
		if (!target) return;
		const file = this.api.getFilebyPath(target.sourcePath);
		if (!file) return;
		this.api.jumpTo(file, target.range);
	}

	async jumpToHighlights(activeFile: TFile, seclectedText: string) {
		const HLBox = this.settings.boxType == "MOC" ? MOCHLBox : FolderHLBox;
		const box = await HLBox.findBox(this, activeFile?.path);
		if (!box) return;
		const highlights = await this.getHighlights(box.highlightsFile);
		if (!highlights) return;
		const target = highlights.find((h) => h.content == seclectedText);
		if (!target) return;
		const file = this.api.getFilebyPath(target.sourcePath);
		if (!file) return;
		this.api.jumpTo(file, target.range);
	}

	async getHighlights(file: TFile): Promise<Highlight[]> {
		const snippets = await this.api.getHighlights(file);
		const highlights = snippets as Highlight[];
		highlights.forEach((h) => {
			h.sourcePath = file.path;
		});
		return highlights;
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	onunload() {}
}
