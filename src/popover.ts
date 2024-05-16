import { HoverPopover, MarkdownView, Plugin } from "obsidian";

export class Popover {
	private plugin: Plugin;
	private textGetter;
	private cursorClientX = 0;
	private cursorClientY = 0;
	private popoverShown = false;

	constructor(plugin: Plugin, textGetter) {
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
		if (event.ctrlKey || event.metaKey) {
			const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) return;

			const el = event.currentTarget as Element;
			if (show) {
				await this.showPopoverForElement(activeView, el as HTMLElement);
			} else {
				activeView.hoverPopover = null;
			}
		}
	};

	private showPopoverForElement = async (view: MarkdownView, el: HTMLElement) => {
		if (this.popoverShown) return;

		const popover = new HoverPopover(view, el, null);
		popover.onload = () => (this.popoverShown = true);
		popover.onunload = () => (this.popoverShown = false);
		popover.hoverEl.innerHTML = this.getPopoverLayout(
			await this.textGetter(el.firstChild?.textContent)
		);
	};

	private getPopoverLayout(textContent: string) {
		return `<div class="markdown-embed is-loaded" style="height: revert">
			<div class="markdown-embed-content">
				<div class="markdown-preview-view markdown-rendered node-insert-event show-indentation-guide allow-fold-headings allow-fold-lists">
					<div class="markdown-preview-sizer markdown-preview-section">
						<p>${textContent}</p>
					</div>
				</div>
			</div>
		</div>`;
	}

	private onKeyChange = (event: KeyboardEvent) => {
		if (event.key === "Control") {
			const isKeyDown = event.type === "keydown";
			const commentsEls = document.querySelectorAll("[class='cm-highlight']");
			commentsEls.forEach((el) => {
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
