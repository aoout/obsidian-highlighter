import { Plugin, TFile } from "obsidian";
import { Highlight, HighlightParser } from "src/highlightParser";
import { HighlightModal } from "src/highlightModal";

export default class MyPlugin extends Plugin {
	async onload() {
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
			name: "Find highlights on active file as Moc",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					const highlights: Highlight[] = [];

					for (const item of this.app.metadataCache.getFileCache(activeFile)?.links || []) {
						const file = this.app.vault.getAbstractFileByPath(
							item.link + ".md"
						);
						if (file && file instanceof TFile) {
							await this.app.vault
								.cachedRead(file)
								.then((content) => {
									const parser = new HighlightParser(
										content
									);
									console.log(parser.highlights);
									parser.highlights.forEach(
										(highlight) => {
											highlight.noteLink = item.link;
											highlights.push(highlight);
										}
									);
								});
						}
					}
					console.log(highlights);
					new HighlightModal(this.app, highlights).open();
				}
			},
		});
	}

	onunload() {}
}
