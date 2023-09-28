/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Notice, Plugin, TFile } from "obsidian";
import { HLedNote } from "src/HLedNote";
import { Modal } from "src/Modal";
import { HLNoteBuilder } from "src/HLNoteBuilder";
import { FolderHLBox, MOCHLBox } from "src/HLBox";
import { HighlightParser } from "src/HighlightParser";
import { DEFAULT_SETTINGS, HighlighterSettings } from "src/settings";
import { HighlighterSettingsTab } from "src/settingsTab";

export default class HighlighterPlugin extends Plugin {
	settings: HighlighterSettings;
	async onload() {
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
				const content = await this.app.vault.cachedRead(activeFile);
				const content2 = content.replace(
					selectedText,
					HighlightParser.switchHighlight(selectedText)
				);
				this.app.vault.modify(activeFile, content2);
			},
		});
		this.addCommand({
			id: "clear-highlights",
			name: "Clear hightlights on this file",
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return;
				this.app.vault.cachedRead(activeFile).then((content) => {
					const newContent = content.replace(/==(.+)==/g, "$1");
					this.app.vault.modify(activeFile, newContent);
				});
			},
		});
		this.addCommand({
			id: "search-highlights",
			name: "Search highlights on this file",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return;
				const highlights = await new HLedNote(this.app,activeFile).getHighlights()
				new Modal(this.app, highlights).open();
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
				if (!activeFile) return;
				const seclection = this.app.workspace.activeEditor?.editor?.getSelection()
				if(!seclection) return;
				if(!HighlightParser.isHighlight(seclection)) return;
				const seclectedText = HighlightParser.ReHighlight(seclection);
				if (activeFile.basename.includes("-highlights")) {
					this.jumpToSource(activeFile,seclectedText);
				} else {
					this.jumpToHighlights(activeFile,seclectedText);
				}
			}
		})
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
		const box = await HLBox.findBox(this.app, activeFile?.path);
		if (!box) {
			new Notice("This file is not in a highlight box.");
			return;
		}
		const highlights = await box.getHighlights();
		if (!highlights) return;
		console.log("highlights",highlights)
		new Modal(this.app, highlights).open();
	}

	async updateHighlightsFile(file: TFile | null) {
		if (!file || !file.basename.includes("-highlights")){
			new Notice("This file is not a highlights file.");
			return;
		}
		const key = this.app.vault.getAbstractFileByPath(
			file.path.replace("-highlights", "")
		);
		console.log(key);
		if (!key || !(key instanceof TFile)) return;
		const HLBox = this.settings.boxType == "MOC" ? MOCHLBox : FolderHLBox;
		const box = new HLBox(this.app, key);
		const highlights = await box.getHighlights();
		if (!highlights) return;
		const builder = HLNoteBuilder.create(highlights);
		const content = await this.app.vault.cachedRead(file);
		builder.mergeComment(new HLNoteBuilder(content));
		this.app.vault.modify(file, builder.toString());
		new Notice("Highlights updated.");
	}

	async jumpToSource(activeFile:TFile,seclectedText: string) {
		const HLBox = this.settings.boxType == "MOC" ? MOCHLBox : FolderHLBox;
		const key = this.app.vault.getAbstractFileByPath(
			activeFile.path.replace("-highlights", "")
		);
		if(!key || !(key instanceof TFile)) return;
		const box = new HLBox(this.app,key);
		if(!box) return;
		const highlights = await box.getHighlights();
		if(!highlights) return;
		const target = highlights.find((h) => h.content == seclectedText);
		if(!target) return;
		const file = this.app.vault.getAbstractFileByPath(target.noteLink + ".md");
		if(!file || !(file instanceof TFile)) return;
		this.app.workspace
			.getLeaf()
			.openFile(file)
			.then(() => {
				this.app.workspace.activeEditor?.editor?.scrollIntoView(
					target.range,
					true
				);
			});
	}

	async jumpToHighlights(activeFile:TFile,seclectedText: string) {
		const HLBox = this.settings.boxType == "MOC" ? MOCHLBox : FolderHLBox;
		const box = await HLBox.findBox(this.app, activeFile?.path);
		if(!box) return;
		const highlightsFile = box.highlightsFile;
		const highlights = await new HLedNote(this.app,highlightsFile).getHighlights();
		if(!highlights) return;
		console.log("seclectedText",seclectedText);
		console.log("highlights",highlights);
		const target = highlights.find((h) => h.content == seclectedText);
		if(!target) return;
		console.log("target",target);
		const file = this.app.vault.getAbstractFileByPath(target.noteLink + ".md");
		if(!file || !(file instanceof TFile)) return;
		this.app.workspace
			.getLeaf()
			.openFile(file)
			.then(() => {
				this.app.workspace.activeEditor?.editor?.scrollIntoView(
					target.range,
					true
				);
			});
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
