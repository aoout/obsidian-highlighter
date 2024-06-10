import { MarkdownView } from "obsidian";
import { HighlightBox } from "./lib/HighlightBox";
import HighlighterPlugin from "./main";
import path from "path";

export class Popover {
	private plugin: HighlighterPlugin;
	private cursorClientX = 0;
	private cursorClientY = 0;

	constructor(plugin: HighlighterPlugin) {
		this.plugin = plugin;
		this.init();
	}

	private init() {
		this.plugin.registerDomEvent(document, "mousemove", this.saveMousePosition);
		this.plugin.registerDomEvent(document, "keydown", this.onKeyChange);
		this.plugin.registerDomEvent(document, "keyup", this.onKeyChange);
	}

	private saveMousePosition = (event: MouseEvent) => {
		this.cursorClientX = event.clientX;
		this.cursorClientY = event.clientY;
	};

	private handlePopoverEvents = async (event: MouseEvent) => {
		if (event.ctrlKey || event.metaKey) {
			const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) return;

			const el = event.currentTarget as Element;
			const activeFile = this.plugin.app.workspace.getActiveFile();
			const box = HighlightBox.type(this.plugin.settings.boxType).findBox(
				this.plugin.app,
				activeFile.path,
				this.plugin.settings.boxTags
			);

			const folder = path.dirname(box.path);
			const highlightsPath = folder + "/" + "highlights.md";
			this.plugin.app.workspace.trigger("hover-link", {
				event: event,
				source: "highlighter",
				hoverParent: activeView.containerEl,
				targetEl: el,
				linktext: highlightsPath,
				sourcePath: highlightsPath,
			});
		}
	};

	private onKeyChange = (event: KeyboardEvent) => {
		if (event.key === "Control") {
			const isKeyDown = event.type === "keydown";
			const commentsEls = document.querySelectorAll("[class='cm-highlight']");
			commentsEls.forEach((el) => {
				if (isKeyDown) {
					el.addEventListener("mouseover", (e) =>
						this.handlePopoverEvents(e as MouseEvent)
					);
					el.addEventListener("mousemove", (e) =>
						this.handlePopoverEvents(e as MouseEvent)
					);
					el.addEventListener("mouseleave", (e) =>
						this.handlePopoverEvents(e as MouseEvent)
					);
				} else {
					el.removeEventListener("mouseover", (e) =>
						this.handlePopoverEvents(e as MouseEvent)
					);
					el.removeEventListener("mousemove", (e) =>
						this.handlePopoverEvents(e as MouseEvent)
					);
					el.removeEventListener("mouseleave", (e) =>
						this.handlePopoverEvents(e as MouseEvent)
					);
				}
			});

			if (isKeyDown) {
				const hoveredEls = document.querySelectorAll(":hover");
				const hoveredElement = hoveredEls[hoveredEls.length - 1];
				if (hoveredElement) {
					setTimeout(() => {
						hoveredElement.dispatchEvent(
							new MouseEvent("mousemove", {
								bubbles: true,
								cancelable: true,
								ctrlKey: true,
								metaKey: true,
								clientX: this.cursorClientX,
								clientY: this.cursorClientY,
								view: window,
							})
						);
					}, 50);
				}
			}
		}
	};
}
