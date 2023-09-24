/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Plugin, TFile } from "obsidian";
import { HLedNote } from "src/HLedNote";
import { Modal } from "src/Modal";
import { HLNoteBuilder } from "src/HLNoteBuilder";
import { FolderHLBox, MOCHLBox } from "src/HLBox";
import { HighlightParser } from "src/HighlightParser";

export default class MyPlugin extends Plugin {
	async onload() {
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
			id: "find-highlights",
			name: "Find highlights on this file",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return;
				this.app.vault.cachedRead(activeFile).then((content) => {
					const parser = new HLedNote(content);
					const highlights = parser.highlights;
					new Modal(this.app, highlights).open();
				});
			},
		});
		this.addCommand({
			id: "find-highlights-from-box",
			name: "Find highlights on this HighlightBox",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if(!activeFile) return;
				const box = await FolderHLBox.findBox(
					this.app,
					activeFile?.path
				);
				if (!box) return;
				const highlights = await box.getHighlights();
				if (!highlights) return;
				new Modal(this.app, highlights).open();
			},
		});

		this.app.workspace.on("file-open", async (file) => {
			if (!file || !file.basename.includes("-highlights")) return;
			const MOC = this.app.vault.getAbstractFileByPath(
				file.path.replace("-highlights", "")
			);
			if (
				!MOC ||
				!(MOC instanceof TFile) ||
				!MOCHLBox.isBox(this.app, MOC)
			)
				return;

			const box = new MOCHLBox(this.app, MOC);
			const highlights = await box.getHighlights();
			if (!highlights) return;
			const builder = HLNoteBuilder.create(highlights);
			const content = await this.app.vault.cachedRead(file);
			builder.mergeComment(new HLNoteBuilder(content));
			this.app.vault.modify(file, builder.toString());
		});
	}

	onunload() {}
}
