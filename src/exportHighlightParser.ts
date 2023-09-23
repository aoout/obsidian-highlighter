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
        // 排除掉items中的第一个
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
		// "# 一段文本" 这样的形式代表标题。从一个标题出现，直到下一个标题出现，视为一个section,如此分割内容,并且按照标题文本分组
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
        // 需要深入高亮级别进行实现
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
            // 删除content最后一个字符
            content = content.slice(0, -1)
        })
        // 删除content最后一个字符
        content = content.slice(0, -1)
        return content
    }
}
