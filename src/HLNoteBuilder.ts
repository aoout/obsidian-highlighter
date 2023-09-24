/* eslint-disable @typescript-eslint/no-unused-vars */

import { HighlightParser } from "./HighlightParser";
import { Highlight } from "./HLedNote";

interface HighlightItem {
	content: string;
	comment: string | null;
}

class Section {
	title: string;
	content: string;
	highlights: HighlightItem[];
	constructor(content: string) {
		this.content = content;
		this.title = content.split("\n")[0].replace(/^# /, "");

		const items = this.content.split("\n\n");
		items.shift();
		this.highlights = items.map((item) => {
			const lines = item.split("\n@");
			const content = lines[0];
			const comment = lines[1];
			return { content, comment };
		});
	}
}

export class HLNoteBuilder {
	content: string;
	sections: Section[];
	constructor(content: string) {
		this.content = content;
		this.sections = [];
		if (!content) return;
		content.split("\n").forEach((line) => {
			if (line.match(/^# /)) {
				this.sections.push(new Section(line));
			} else {
				const lastSection = this.sections.pop();
				if (!lastSection) return;
				this.sections.push(
					new Section(lastSection.content + "\n" + line)
				);
			}
		});
	}

	addHighlight(content: string, sectionTitle: string) {
		const section = this.sections.find(
			(section) => section.title === sectionTitle
		);
		if (!section) {
			this.sections.push(new Section(`# ${sectionTitle}\n\n${content}`));
			return;
		}
		const highlight = section.highlights.find(
			(highlight) => highlight.content == content
		);
		if (!highlight) {
			section.highlights.push({ content, comment: null });
		}
	}

	static create(highlights: Highlight[]) {
		const parser = new HLNoteBuilder("");
		highlights.forEach((highlight) => {
			parser.addHighlight(
				HighlightParser.Highlight(highlight.content),
				highlight.noteLink?.split("/").pop() || ""
			);
		});
		return parser;
	}

	mergeComment(highlightParser: HLNoteBuilder) {
		highlightParser.sections.forEach((section) => {
			const section2 = this.sections.find(
				(section2) => section2.title === section.title
			);
			if (section2) {
				section.highlights.forEach((highlight) => {
					if (highlight.comment) {
						const highlight2 = section2.highlights.find(
							(highlight2) =>
								highlight2.content === highlight.content
						);
						if (highlight2) {
							highlight2.comment = highlight.comment;
						}
					}
				});
			}
		});
	}

	toString() {
		console.log(this.sections);
		let content = "";
		this.sections.forEach((section) => {
			content += "# " + section.title + "\n\n";
			section.highlights.forEach((highlight) => {
				content += highlight.content;
				if (highlight.comment) {
					content += "\n@" + highlight.comment;
				}
				content += "\n\n";
			});
			content = content.slice(0, -1);
		});
		content = content.slice(0, -1);
		return content;
	}
}
