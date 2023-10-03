export interface Snippet {
	content: string;
	range: {
		from: { line: number; ch: number };
		to: { line: number; ch: number };
	};
}

export class MarkdownParser {
	content: string;
	constructor(content: string) {
		this.content = content;
	}
	getSections(): { title: string; content: string }[] {
		const lines = this.content.split("\n");
		const sections = [];
		let currentTitle = "";
		let currentContent = "";
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			for (let i = 0; i < 6; i++) {
				if (line.startsWith("#".repeat(i + 1) + " ")) {
					if (sections.length) {
						sections[sections.length - 1].content = currentContent;
					}

					currentContent = "";
					const sectionTitle = line.substring(i + 2);

					currentTitle = sectionTitle;
					sections.push({
						title: currentTitle,
						content: "",
					});
					break;
				}
			}
			currentContent += line + "\n";
			if (i == lines.length - 1) {
				if (sections.length) {
					sections[sections.length - 1].content = currentContent;
				}
			}
		}
		for (let i = 0; i < sections.length; i++) {
			const section = sections[i];
			section.content = section.content.split("\n").slice(1).join("\n");
		}
		return sections;
	}
	getHighlights(): Snippet[] {
		const content = this.content;
		const highlights = [];
		const regex = /==([^=]+)==/g;
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
			const highlight: Snippet = {
				content: match[1],
				range: {
					from: { line: startline, ch: startch },
					to: { line: endline, ch: endch },
				},
			};
			highlights.push(highlight);
			match = regex.exec(content);
		}
		return highlights;
	}
}
