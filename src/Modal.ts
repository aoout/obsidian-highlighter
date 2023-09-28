import { App, SuggestModal, TFile } from "obsidian";
import { Highlight } from "./HLedNote";
import HighlighterPlugin from "main";

export class Modal extends SuggestModal<Highlight> {
	plugin:HighlighterPlugin
	app: App;
	highlight: Highlight[];
	emptyStateText = "No highlights found.";
	getSuggestions(query: string): Highlight[] | Promise<Highlight[]> {
		return this.highlight.filter((h) => h.content.includes(query));
	}
	renderSuggestion(item: Highlight, el: HTMLElement): void {
		if (item.noteLink) {
			const basename = item.noteLink?.split("/").pop();
			el.createEl("div", { text: basename });
		}
		el.createEl("small", { text: item.content });
	}
	onChooseSuggestion(
		item: Highlight,
		evt: MouseEvent | KeyboardEvent
	): boolean {
		if (item.noteLink) {
			const file = this.app.vault.getAbstractFileByPath(
				item.noteLink + ".md"
			);
			if (file && file instanceof TFile) {
				this.plugin.jumpTo(file, item.range);
			}
		} else {
			this.app.workspace.activeEditor?.editor?.scrollIntoView(
				item.range,
				true
			);
		}

		return true;
	}
	constructor(plugin:HighlighterPlugin,app: App, highlights: Highlight[]) {
		super(app);
		this.plugin = plugin;
		this.app = app;
		this.highlight = highlights;
	}
}
