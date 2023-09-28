import { App, EditorRange, TFile } from "obsidian";

export interface Highlight {
	content: string;
	range: EditorRange;
	noteLink?: string;
}

export class HLedNote {
	app:App;
	file:TFile;
	constructor(app:App,file:TFile) {
		this.app = app;
		this.file = file;

	}
	async getHighlights():Promise<Highlight[]> {
		const highlights = [];
		const regex = /==([^=]+)==/g;
		const content = await this.app.vault.cachedRead(this.file);
		let match = regex.exec(content);
		while (match) {
			const start = match.index;
			const end = start + match[0].length - 1;
			const startline =
				content.substring(0, start).split("\n").length - 1;
			const startch =
				content.substring(0, start).length -
				content.substring(0, start).lastIndexOf("\n") -
				1;
			const endline = content.substring(0, end).split("\n").length - 1;
			const endch =
				content.substring(0, end).length -
				content.substring(0, end).lastIndexOf("\n") -
				1;
			const highlight: Highlight = {
				content: match[1],
				range: {
					from: { line: startline, ch: startch },
					to: { line: endline, ch: endch },
				},
				noteLink: this.file.path.split(".md")[0],
			};
			console.log(highlight.noteLink);
			highlights.push(highlight);
			match = regex.exec(content);
		}
		return highlights;

	}
}
