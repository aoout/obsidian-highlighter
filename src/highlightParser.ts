export class HighlightParser {
	static isHighlight(text: string) {
		return /^==.+==$/.test(text);
	}
	static Highlight(text: string) {
		return "==" + text + "==";
	}
	static ReHighlight(text: string) {
		return text.replace(/^==(.+)==$/, "$1");
	}
	static switchHighlight(text: string) {
		return this.isHighlight(text)
			? this.ReHighlight(text)
			: this.Highlight(text);
	}
}
