/* eslint-disable @typescript-eslint/no-unused-vars */

interface Highlight {
	content: string;
	comment: string | null;
}

class Section {
	title: string;
	content: string;
	highlights: Highlight[];
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

export class ExportHignlightParser {
	content: string;
	sections: Section[];
	constructor(content: string) {
		this.content = content;
		this.sections = [];
        if(content){
            content.split("\n").forEach((line) => {
                if (line.match(/^# /)) {
                    this.sections.push(new Section(line));
                } else {
                    const lastSection = this.sections[this.sections.length - 1];
                    this.sections[this.sections.length - 1] = new Section(
                        lastSection.content + "\n" + line
                    );
                }
            });
            
        }
		
	}

	addHighlight(content: string, sectionTitle: string) {

		const section = this.sections.find(
			(section) => section.title === sectionTitle
		);
		if (section) {
			const highlight = section.highlights.find(
				(highlight) => highlight.content == content
			);
			if (!highlight) {
				section.highlights.push({ content, comment: null });
			}
		} else {
			this.sections.push(new Section(`# ${sectionTitle}\n\n${content}`));
		}
	}

    merge(highlightParser: ExportHignlightParser) {
        highlightParser.sections.forEach(section => {
            section.highlights.forEach(highlight => {
                this.addHighlight(highlight.content, section.title)
            })
        })
    }

    toString() {
        console.log(this.sections);
        let content = ""
        this.sections.forEach(section => {
            content += "# " + section.title + "\n\n"
            section.highlights.forEach(highlight => {
                content += highlight.content
                if(highlight.comment){
                    content += "\n@" + highlight.comment
                }
                content += "\n\n"
            })
            content = content.slice(0, -1)
        })
        content = content.slice(0, -1)
        return content
    }
}
