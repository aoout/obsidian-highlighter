/* eslint-disable @typescript-eslint/no-unused-vars */
import { Plugin, TFile } from "obsidian";
import { Highlight, HighlightParser } from "src/highlightParser";
import { HighlightModal } from "src/highlightModal";
import { ExportHignlightParser } from "src/exportHighlightParser";

export default class MyPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "highlight-selected",
			name: "Highlight selected text",
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					const editor = this.app.workspace.activeEditor?.editor;
					if (editor) {
						const selectedText = editor.getSelection();
						this.app.vault
							.cachedRead(activeFile)
							.then((content) => {
								const newContent = content.replace(
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
			name: "Clear hightlights on active file",
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
			name: "Find highlights on active file",
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
			id: "find-highlights-from-moc",
			name: "Find highlights on active file as MOC",
			callback: async () => {
				const highlights = await this.getHighlightsFromMOC();
				if (highlights) {
					new HighlightModal(this.app, highlights).open();
				}
			},
		});

		this.addCommand({
			id: "export-highlights",
			name: "Export highlights on active file as MOC",
			callback: async () => {
				const highlights = await this.getHighlightsFromMOC();
				if (highlights) {
					const activeFile = this.app.workspace.getActiveFile();
					if (activeFile) {
						const parser = new ExportHignlightParser("");
						highlights.forEach((highlight) => {
							parser.addHighlight(
								highlight.content,
								highlight.noteLink?.split("/").pop() || ""
							);
						});

						const dir = activeFile.path.substring(
							0,
							activeFile.path.lastIndexOf("/")
						);
						const path = `${dir}/exported-highlights.md`;
						const file = this.app.vault.getAbstractFileByPath(path);
						// 如果已经存在该文件，则读取其内容，也放进解析器里
						if (file && file instanceof TFile) {
							await this.app.vault
								.cachedRead(file)
								.then((content) => {
									const oldParser = new ExportHignlightParser(
										content
									);
									// oldParser.merge(parser);
									// 使用parser.toString更新文件内容
									this.app.vault.modify(
										file,
										oldParser.toString()
									);
								});
						} else {
							this.app.vault.create(path, parser.toString());
						}
					}
				}
			},
		});
	}

	async getHighlightsFromMOC(): Promise<void | Highlight[]> {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			const highlights: Highlight[] = [];

			for (const item of this.app.metadataCache.getFileCache(activeFile)
				?.links || []) {
				const file = this.app.vault.getAbstractFileByPath(
					item.link + ".md"
				);
				if (file && file instanceof TFile) {
					await this.app.vault.cachedRead(file).then((content) => {
						const parser = new HighlightParser(content);
						console.log(parser.highlights);
						parser.highlights.forEach((highlight) => {
							highlight.noteLink = item.link;
							highlights.push(highlight);
						});
					});
				}
			}
			console.log(highlights);
			return highlights;
		}
	}

	onunload() {}
}
