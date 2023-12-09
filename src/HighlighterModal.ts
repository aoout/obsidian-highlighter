import { App, SuggestModal } from "obsidian";
import { highlight } from "./lib/getHighlights";

export class HighlighterModal extends SuggestModal<highlight> {
	highlighters: highlight[];
	choosed: (arg0: highlight) => void;
	getSuggestions(query: string): highlight[] | Promise<highlight[]> {
		return this.highlighters.filter((highlight) => highlight.content.includes(query));
	}
	renderSuggestion(item: highlight, el: HTMLElement): void {
		el.createEl("div", { text: item.sourcePath });
		el.createEl("small", { text: item.content });
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onChooseSuggestion(item: highlight, _evt: MouseEvent | KeyboardEvent) {
		this.choosed(item);
	}
	constructor(app: App, highlights: highlight[], choosed: (arg0: highlight) => void) {
		super(app);
		this.highlighters = highlights;
		this.choosed = choosed;
	}
}
