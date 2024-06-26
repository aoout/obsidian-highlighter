import { Plugin, EditorRange, TFile } from "obsidian";
import { DEFAULT_SETTINGS, HighlighterSettings } from "./settings/settings";
import { HighlightBox } from "./lib/HighlightBox";
import { HighlighterModal } from "./HighlighterModal";
import { getHighlights, highlight } from "./lib/getHighlights";
import { HighlighterSettingsTab } from "./settings/settingsTab";
import path from "path";
import { HighlightsBuilder } from "./lib/highlightsBuilder";
import { Popover } from "./popover";

export default class HighlighterPlugin extends Plugin {
	settings: HighlighterSettings;

	async onload() {
		console.log("Plugin Highlighter loaded.");
		await this.loadSettings();
		this.addSettingTab(new HighlighterSettingsTab(this.app, this));
		this.addCommand({
			id: "search-highlights-in-current-note",
			name: "Search highlights in current note",
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			checkCallback: (checking) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return false;
				if (checking) return true;
				this.app.vault.cachedRead(activeFile).then((content: string) => {
					const highlights = getHighlights(content, activeFile.path);
					new HighlighterModal(this.app, highlights, (highlight: highlight) => {
						this.jumpToHighlight(highlight);
					}).open();
				});
				return true;
			},
		});
		this.addCommand({
			id: "search-highlights-in-current-HighlightBox",
			name: "Search highlights in current HighlightBox",
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return false;
				const box = HighlightBox.type(this.settings.boxType).findBox(
					this.app,
					activeFile.path,
					this.settings
				);
				if (!box) return false;
				if (checking) return true;
				box.getHighlights().then((highlights: highlight[]) => {
					new HighlighterModal(this.app, highlights, (highlight: highlight) => {
						this.jumpToHighlight(highlight);
					}).open();
				});
				return true;
			},
		});
		this.addCommand({
			id: "update-highlights-file",
			name: "Update highlights file",
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return false;
				const box = HighlightBox.type(this.settings.boxType).findBox(
					this.app,
					activeFile.path,
					this.settings
				);
				if (!box) return false;
				if (checking) return true;
				box.updateHighlightsNote(this.settings.template);
				return true;
			},
		});
		this.registerEvent(
			this.app.workspace.on("editor-change",async (editor, info)=>{
				if(!this.settings.autoUpdate) return;
				const box = HighlightBox.type(this.settings.boxType).findBox(
					this.app,
					info.file.path,
					this.settings
				);
				if (!box) return;
				//@ts-ignore
				await info.save();

				//@ts-ignore
				this.app.commands.executeCommandById("highlighter:update-highlights-file");
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const popover = new Popover(this, this.getCommentByContent);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}

	jumpToHighlight(highlight: highlight) {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;
		if (activeFile.path != highlight.sourcePath) {
			const file = this.app.vault.getAbstractFileByPath(highlight.sourcePath);
			if (!file || !(file instanceof TFile)) return;
			this.app.workspace
				.getLeaf()
				.openFile(file)
				.then(() => {
					this.jumpToContent(highlight.content);
				});
		} else {
			this.jumpToContent(highlight.content);
		}
	}

	jumpToContent(content: string) {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;
		this.app.vault.cachedRead(activeFile).then((content2: string) => {
			const editor = this.app.workspace.activeEditor.editor;
			const st = content2.indexOf(content);
			const ed = st + content.length;
			const range: EditorRange = {
				from: editor.offsetToPos(st),
				to: editor.offsetToPos(ed),
			};
			editor.scrollIntoView(range, true);
		});
	}

	getCommentByContent = async (content: string): Promise<string> => {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return null;

		const box = HighlightBox.type(this.settings.boxType).findBox(
			this.app,
			activeFile.path,
			this.settings
		);
		if (!box) return "It is not in a box";
		const folder = path.dirname(box.path);
		const highlightsPath = folder + "/" + this.settings.storage + ".md";
		const highlightsFile = this.app.vault.getAbstractFileByPath(highlightsPath) as TFile;
		const highlightsContent = await this.app.vault.read(highlightsFile);

		const map = HighlightsBuilder.markdown2map(highlightsContent, this.settings.template);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const [_, items] of map.entries()) {
			const foundItem = items.find((item) => item.content === content);
			if (foundItem) return foundItem.comment || "Not any comment yet";
		}

		return "Not any comment yet";
	};
}
