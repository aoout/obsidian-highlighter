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
		if (this.isHighlight(text)) {
			return this.ReHighlight(text);
		} else {
			return this.Highlight(text);
		}
	}
}
