/* eslint-disable @typescript-eslint/no-unused-vars */
import { EditorRange, TFile, TFolder } from "obsidian";
import { ObsidianSnippet } from "./ExtendedObsidianApi/PluginApi";
import HighlighterPlugin from "main";

export interface Highlight extends ObsidianSnippet {
	content: string;
	range: EditorRange;
	sourcePath: string;
}

class HLBox {
	static tags: string[] = ["HighlightBox"];
}

export class FolderHLBox extends HLBox {
	plugin: HighlighterPlugin;
	path: string;
	name: string;
	highlightsFile: TFile;

	constructor(plugin: HighlighterPlugin, folderNote: TFile) {
		if (
			!folderNote.parent ||
			!FolderHLBox.isBox(plugin, folderNote.parent.path)
		)
			return;
		super();
		this.plugin = plugin;
		this.path = folderNote.parent.path;
		this.name = this.path.substring(this.path.lastIndexOf("/") + 1);
		this.highlightsFile = this.plugin.api.getFilebyPath(
			this.path + "/" + this.name + "-highlights.md"
		) as TFile;
	}

	static async findBox(
		plugin: HighlighterPlugin,
		notePath: string
	): Promise<FolderHLBox | undefined> {
		let path = notePath;
		while (path != "") {
			if (FolderHLBox.isBox(plugin, path)) {
				const file = plugin.api.getFilebyPath(
					path +
						"/" +
						path.substring(path.lastIndexOf("/") + 1) +
						".md"
				);
				if (!file) return;
				return new FolderHLBox(plugin, file);
			}
			path = path.substring(0, path.lastIndexOf("/"));
		}
	}

	static isBox(plugin: HighlighterPlugin, path: string): boolean | undefined {
		const basename = path.substring(path.lastIndexOf("/") + 1);
		const folderNote = plugin.app.vault.getAbstractFileByPath(
			path + "/" + basename + ".md"
		);
		if (folderNote && folderNote instanceof TFile) {
			const tags =
				plugin.app.metadataCache.getFileCache(folderNote)?.frontmatter
					?.tags;
			if (tags) {
				for (const tag of tags) {
					if (FolderHLBox.tags.includes(tag)) {
						return true;
					}
				}
			}
		}
		return false;
	}

	async getHighlights(): Promise<Highlight[] | undefined> {
		const highlights: Highlight[] = [];
		const folder = this.plugin.app.vault.getAbstractFileByPath(this.path);
		if (folder && folder instanceof TFolder) {
			await this.getHighlightsRecursively(folder, highlights);
			return highlights;
		}
	}

	async getHighlightsRecursively(
		folder: TFolder,
		highlights: Highlight[]
	): Promise<void> {
		folder.children.sort((a, b) => {
			if (a instanceof TFolder && b instanceof TFile) {
				return -1;
			} else if (a instanceof TFile && b instanceof TFolder) {
				return 1;
			} else {
				return a.name.localeCompare(b.name);
			}
		});
		for (const file of folder.children) {
			if (file instanceof TFolder) {
				await this.getHighlightsRecursively(file, highlights);
			} else if (
				file instanceof TFile &&
				file.extension == "md" &&
				!file.name.includes("-highlights")
			) {
				const highlights2 = await this.plugin.getHighlights(file);
				highlights.push(...highlights2);
			}
		}
	}
}

export class MOCHLBox extends HLBox {
	plugin: HighlighterPlugin;
	MOC: TFile;
	highlightsFile: TFile;
	constructor(plugin: HighlighterPlugin, MOC: TFile) {
		if (!MOCHLBox.isBox(plugin, MOC)) return;
		super();
		this.plugin = plugin;
		this.MOC = MOC;
		this.highlightsFile = this.plugin.api.getFilebyPath(
			this.MOC.path.replace(".md", "-highlights.md")
		) as TFile;
	}
	static findBox(
		plugin: HighlighterPlugin,
		notePath: string
	): MOCHLBox | undefined {
		const file = plugin.api.getFilebyPath(notePath);
		if (!file) return;
		const linkedTofiles = plugin.api.getLinkedTo(file);
		const MOC = linkedTofiles.filter((item) =>
			MOCHLBox.isBox(plugin, item)
		)[0];
		if (MOC) {
			return new MOCHLBox(plugin, MOC);
		}
	}
	static isBox(plugin: HighlighterPlugin, file: TFile): boolean {
		const tags = plugin.api.getTags(file);
		if (!tags) return false;
		for (const tag of tags) {
			if (MOCHLBox.tags.includes(tag)) {
				return true;
			}
		}
		return false;
	}
	async getHighlights() {
		const highlights: Highlight[] = [];
		const linkToFiles = this.plugin.api.getLinkTo(this.MOC);
		if (!linkToFiles) return;

		for (const file of linkToFiles) {
			if(!(file instanceof TFile)) continue;
			highlights.push(...(await this.plugin.getHighlights(file)));
		}
		
		return highlights;
	}
}
