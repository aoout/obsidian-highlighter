/* eslint-disable @typescript-eslint/no-unused-vars */
import { Plugin, TFile} from "obsidian";
import { HighlightParser } from "src/highlightParser";
import { HighlightModal } from "src/highlightModal";
import { ExportHignlightParser } from "src/exportHighlightParser";
import { FolderHighlightBox, MOCHignlightBox } from "src/HighlightBox";

export default class MyPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "switch-highlighted-selected",
			name: "Switch highlighted status on selected text",
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					const editor = this.app.workspace.activeEditor?.editor;
					if (editor) {
						const selectedText = editor.getSelection();
						this.app.vault
							.cachedRead(activeFile)
							.then((content) => {
								// 使用正则表达式来判断是否为高亮
								const isHighlighted = /^==.+==$/.test(
									selectedText
								);
								const newContent = isHighlighted
									? content.replace(
											selectedText,
											selectedText.replace(
												/^==(.+)==$/,
												"$1"
											)
									)
									: content.replace(
											selectedText,
											"==" + selectedText + "=="
									);
								this.app.vault.modify(activeFile, newContent);
							});
					}
				}
			},
		});
		this.addCommand({
			id: "clear-highlights",
			name: "Clear hightlights on this file",
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					this.app.vault.cachedRead(activeFile).then((content) => {
						const newContent = content.replace(/==(.+)==/g, "$1");
						this.app.vault.modify(activeFile, newContent);
					});
				}
			},
		});
		this.addCommand({
			id: "find-highlights",
			name: "Find highlights on this file",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					// read the content of activeFile
					this.app.vault.cachedRead(activeFile).then((content) => {
						const parser = new HighlightParser(content);
						const highlights = parser.highlights;
						new HighlightModal(this.app, highlights).open();
					});
				}
			},
		});
		this.addCommand({
			id: "find-highlights-from-box",
			name: "Find highlights on this HighlightBox",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				const box = await FolderHighlightBox.findBox(
					this.app,
					activeFile?.path || ""
				);
				if (box) {
					const highlights = await box.getHighlights();
					if (highlights) {
						new HighlightModal(this.app, highlights).open();
					}
				}
			},
		});

		this.app.workspace.on("file-open", async (file) => {
			if (file && file.basename.includes("-highlights")) {
				// 找到该file去掉-highlights后的文件
				console.log(file.path);
				const MOC = this.app.vault.getAbstractFileByPath(
					file.path.replace("-highlights", "")
				);
				console.log(MOC?.path);
				if (
					MOC &&
					MOC instanceof TFile &&
					MOCHignlightBox.isBox(this.app, MOC)
				) {
					const box = new MOCHignlightBox(this.app, MOC);
					const highlights = await box.getHighlights();
					if (highlights) {
						console.log(highlights);
						const content = await this.app.vault.cachedRead(file);
						if (highlights) {
							const parser = new ExportHignlightParser("");
							highlights.forEach((highlight) => {
								parser.addHighlight(
									"==" + highlight.content + "==",
									highlight.noteLink?.split("/")[
										highlight.noteLink?.split("/").length -
											1
									] || ""
								);
							});
							const oldParser = new ExportHignlightParser(
								content
							);
							parser.merge(oldParser);
							this.app.vault.modify(file, parser.toString());
							console.log("Highlights have been updated.");
						}
					}
					/*
				const folderNote = this.app.vault.getAbstractFileByPath(
					file.path.replace("-highlights", "")
				);
				if (folderNote && folderNote instanceof TFile) {
					const folder = folderNote.parent;
					if (
						folder &&
						folder instanceof TFolder &&
						folder.name == folderNote.basename
					) {
						if (FolderHighlightBox.isBox(this.app, folder.path)) {
							const box = new FolderHighlightBox(this.app, folder.path);
							const highlights = await box.getHighlights();
							// const highlights:Highlight[] = []
							console.log(highlights);
							const content = await this.app.vault.cachedRead(
								file
							);
							if (highlights) {
								const parser = new ExportHignlightParser("");
								highlights.forEach((highlight) => {
									parser.addHighlight(
										"==" + highlight.content + "==",
										highlight.noteLink?.split("/")[
											highlight.noteLink?.split("/")
												.length - 1
										] || ""
									);
								});
								const oldParser = new ExportHignlightParser(
									content
								);
								parser.merge(oldParser);
								this.app.vault.modify(file, parser.toString());
								console.log("Highlights have been updated.");
							}
						}
					}
				}
				*/
				}
			}
		});
	}

	onunload() {}
}
