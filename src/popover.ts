import { HoverPopover, MarkdownView, Notice } from "obsidian";
import { HighlightBox } from "./lib/HighlightBox";
import HighlighterPlugin from "./main";
import { PlatformPath } from "path/posix";
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const path = require("path-browserify").posix as PlatformPath;

const POPOVER_STYLES = {
	container: {
		padding: "6px",
		backgroundColor: "var(--background-primary)",
		borderRadius: "4px",
	},
	textarea: {
		width: "100%",
		minHeight: "60px",
		maxHeight: "120px",
		padding: "6px",
		border: "none",
		resize: "vertical" as const,
		fontFamily: "var(--font-text)",
		backgroundColor: "var(--background-primary)",
		color: "var(--text-normal)",
	},
	readonlyContainer: {
		padding: "6px",
		backgroundColor: "var(--background-primary)",
		borderRadius: "4px",
	},
	readonlyContent: {
		maxHeight: "150px",
		overflowY: "auto" as const,
		color: "var(--text-normal)",
		padding: "4px",
	},
};

export class Popover {
	private cursorClientX = 0;
	private cursorClientY = 0;

	constructor(
		private plugin: HighlighterPlugin,
		private textGetter: (text: string) => Promise<string>
	) {
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

	private onKeyChange = (event: KeyboardEvent) => {
		if (event.key !== "Control") return;

		const isKeyDown = event.type === "keydown";
		const highlightEls = [
			...document.querySelectorAll("[class='cm-highlight']"),
			...document.querySelectorAll("mark"),
		];

		highlightEls.forEach((el) => {
			this.togglePopoverEvents(el, isKeyDown);
		});

		if (isKeyDown) this.triggerMousemoveOnHovered();
	};

	private togglePopoverEvents(el: Element, add: boolean) {
		const handlerShow = (e: Event) => this.handlePopoverEvents(e as MouseEvent, true);
		const handlerHide = (e: Event) => this.handlePopoverEvents(e as MouseEvent, false);

		if (add) {
			el.addEventListener("mouseover", handlerShow);
			el.addEventListener("mousemove", handlerShow);
			el.addEventListener("mouseleave", handlerHide);
		} else {
			el.removeEventListener("mouseover", handlerShow);
			el.removeEventListener("mousemove", handlerShow);
			el.removeEventListener("mouseleave", handlerHide);
		}
	}

	private triggerMousemoveOnHovered() {
		const hoveredEls = document.querySelectorAll(":hover");
		const lastHovered = hoveredEls[hoveredEls.length - 1];
		if (!lastHovered) return;

		setTimeout(() => {
			lastHovered.dispatchEvent(
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

	private async handlePopoverEvents(event: MouseEvent, show: boolean) {
		const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) return;

		const mode = activeView.getMode();
		const { popupType } = this.plugin.settings;

		if (
			popupType === "always Editable" ||
			(mode === "source" && popupType !== "always Readonly")
		) {
			await this.showEditablePopup(event, activeView);
		} else {
			await this.showReadonlyPopup(event, show, activeView);
		}
	}

	private async showEditablePopup(event: MouseEvent, activeView: MarkdownView) {
		if (!(event.ctrlKey || event.metaKey)) return;

		const el = event.currentTarget as Element;
		const content = el.firstChild?.textContent;
		if (!content) return;

		let comment = "";
		comment = await this.plugin.getCommentByContent(content);
		if (comment === "Not any comment yet") comment = "";

		const popover = new HoverPopover(activeView, el as HTMLElement, null);
		const inputContainer = this.createInputContainer();
		const input = this.createTextarea(comment);

		const onEnter = async (e: KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				await this.saveCommentToHighlightFile(content, input.value.trim());
				new Notice("Comment saved successfully");
				popover.hoverEl.hide();
			}
		};

		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				popover.hoverEl.hide();
			}
		};

		input.addEventListener("keydown", onEnter);
		input.addEventListener("keydown", onEsc);

		inputContainer.appendChild(input);
		popover.hoverEl.appendChild(inputContainer);

		setTimeout(() => input.focus(), 0);
	}

	private createInputContainer() {
		const container = document.createElement("div");
		container.className = "highlighter-popover";
		Object.assign(container.style, POPOVER_STYLES.container);
		return container;
	}

	private createTextarea(value: string) {
		const textarea = document.createElement("textarea");
		textarea.value = value;
		textarea.placeholder = "输入...";
		textarea.setAttribute("aria-label", "评论输入框");
		Object.assign(textarea.style, POPOVER_STYLES.textarea);
		return textarea;
	}

	private async saveCommentToHighlightFile(content: string, comment: string) {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) return;

		const box = HighlightBox.type(this.plugin.settings.boxType).findBox(
			this.plugin.app,
			activeFile.path,
			this.plugin.settings
		);
		box.updateComment(activeFile.path, content, comment);
	}

	private async showReadonlyPopup(event: MouseEvent, show: boolean, activeView: MarkdownView) {
		if (!(event.ctrlKey || event.metaKey)) return;

		const el = event.currentTarget as Element;
		if (show) {

			const popover = new HoverPopover(activeView, el as HTMLElement, null);

			const contentText = await this.textGetter(el.firstChild?.textContent || "");
			const container = document.createElement("div");
			container.className = "highlighter-popover";
			Object.assign(container.style, POPOVER_STYLES.readonlyContainer);

			const contentDiv = document.createElement("div");
			contentDiv.className = "markdown-preview-view markdown-rendered";
			Object.assign(contentDiv.style, POPOVER_STYLES.readonlyContent);
			contentDiv.innerHTML = `<p>${contentText}</p>`;

			container.appendChild(contentDiv);
			popover.hoverEl.appendChild(container);
		} else {
			activeView.hoverPopover = null;
		}
	}
}
