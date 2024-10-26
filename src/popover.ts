import { HoverPopover, MarkdownView } from "obsidian";
import { HighlightBox } from "./lib/HighlightBox";
import HighlighterPlugin from "./main";
import { PlatformPath } from "path/posix";
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const path = (require("path-browserify").posix) as PlatformPath;

export class Popover {
	private plugin: HighlighterPlugin;
	private textGetter;
	private cursorClientX = 0;
	private cursorClientY = 0;
	private popoverShown = false;

	constructor(plugin: HighlighterPlugin, textGetter) {
		this.plugin = plugin;
		this.textGetter = textGetter;
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

	private handlePopoverEvents = async (event: MouseEvent, show: boolean) => {
		const mode = this.plugin.app.workspace.getActiveViewOfType(MarkdownView).getMode();
		if (
			this.plugin.settings.popupType == "always Editable" ||
			(mode == "source" && this.plugin.settings.popupType != "always Readonly")
		) {
			this.showEditablePopup(event);
		}else{
			this.showReadonlyPopup(event, show);
		}
	};

	private showEditablePopup = async (event: MouseEvent) => {
		if (event.ctrlKey || event.metaKey) {
			const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) return;

			const el = event.currentTarget as Element;
			const activeFile = this.plugin.app.workspace.getActiveFile();
			const box = HighlightBox.type(this.plugin.settings.boxType).findBox(
				this.plugin.app,
				activeFile.path,
				this.plugin.settings
			);

			const folder = path.dirname(box.path);
			const highlightsPath = folder + "/" + this.plugin.settings.storage +  ".md";
			this.plugin.app.workspace.trigger("hover-link", {
				event: event,
				source: "highlighter",
				hoverParent: activeView.containerEl,
				targetEl: el,
				linktext: highlightsPath,
				sourcePath: highlightsPath,
			});
			const content = el.firstChild?.textContent;
			const comment = await this.plugin.getCommentByContent(content);
			this.plugin.registerEvent(
				this.plugin.app.workspace.on("active-leaf-change", () => {
					if (comment != "Not any comment yet") {
						this.plugin.jumpToContent(comment);
					} else {
						this.plugin.jumpToContent(content);
					}
				})
			);
		}
	};

	private showReadonlyPopup = async (event: MouseEvent, show: boolean) => {
		if (event.ctrlKey || event.metaKey) {
			const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) return;

			const el = event.currentTarget as Element;
			if (show) {
				if (this.popoverShown) return;

				const popover = new HoverPopover(activeView, el as HTMLElement, null);
				popover.onload = () => (this.popoverShown = true);
				popover.onunload = () => (this.popoverShown = false);
				popover.hoverEl.innerHTML = `<div class="markdown-embed is-loaded" style="height: revert">
					<div class="markdown-embed-content">
						<div class="markdown-preview-view markdown-rendered node-insert-event show-indentation-guide allow-fold-headings allow-fold-lists">
							<div class="markdown-preview-sizer markdown-preview-section">
								<p>${await this.textGetter(el.firstChild?.textContent)}</p>
							</div>
						</div>
					</div>
				</div>`;
			} else {
				activeView.hoverPopover = null;
			}
		}
	};

	private onKeyChange = (event: KeyboardEvent) => {
		if (event.key === "Control") {
			const isKeyDown = event.type === "keydown";
			const commentsEls = document.querySelectorAll("[class='cm-highlight']").values();
			const commentsEls2 = document.querySelectorAll("mark").values();
			[...commentsEls, ...commentsEls2].forEach((el) => {
				if (isKeyDown) {
					el.addEventListener("mouseover", (e) =>
						this.handlePopoverEvents(e as MouseEvent, true)
					);
					el.addEventListener("mousemove", (e) =>
						this.handlePopoverEvents(e as MouseEvent, true)
					);
					el.addEventListener("mouseleave", (e) =>
						this.handlePopoverEvents(e as MouseEvent, false)
					);
				} else {
					el.removeEventListener("mouseover", (e) =>
						this.handlePopoverEvents(e as MouseEvent, true)
					);
					el.removeEventListener("mousemove", (e) =>
						this.handlePopoverEvents(e as MouseEvent, true)
					);
					el.removeEventListener("mouseleave", (e) =>
						this.handlePopoverEvents(e as MouseEvent, false)
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
