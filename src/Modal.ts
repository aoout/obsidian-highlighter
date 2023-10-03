import { SuggestModal } from "obsidian";
import HighlighterPlugin from "main";
import { Highlight } from "./HLBox";

export class Modal extends SuggestModal<Highlight> {
	plugin: HighlighterPlugin;
	highlights: Highlight[];
	emptyStateText = "No highlights found.";
	getSuggestions(query: string): Highlight[] | Promise<Highlight[]> {
		return this.highlights.filter((item) =>
			item.content.includes(query)
		);
	}
	renderSuggestion(item: Highlight, el: HTMLElement): void {
		if (item.sourcePath) {
			const basename = item.sourcePath?.split("/").pop();
			el.createEl("div", { text: basename });
		}
		el.createEl("small", { text: item.content });
	}
	onChooseSuggestion(
		item: Highlight,
		evt: MouseEvent | KeyboardEvent
	): boolean {
		let file = null;
		if (item.sourcePath)
			file = this.plugin.api.getFilebyPath(item.sourcePath);
		if (!file) return false;
		this.plugin.api.jumpTo(file, item.range);
		return true;
	}
	constructor(plugin: HighlighterPlugin, highlights: Highlight[]) {
		super(plugin.app);
		this.plugin = plugin;
		this.highlights = highlights;
	}
}
