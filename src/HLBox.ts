/* eslint-disable @typescript-eslint/no-unused-vars */
import { App, TFile, TFolder } from "obsidian";
import { Highlight, HLedNote } from "./HLedNote";

class HLBox {
	static tags: string[] = ["HighlightBox"];
}

export class FolderHLBox extends HLBox {
	app: App;
	path: string;
	name: string;
	highlightsFile : TFile;

	constructor(app: App, folderNote: TFile) {
		if (
			!folderNote.parent ||
			!FolderHLBox.isBox(app, folderNote.parent.path)
		)
			return;
		super();
		this.app = app;
		this.path = folderNote.parent.path;
		this.name = this.path.substring(this.path.lastIndexOf("/") + 1);
		this.highlightsFile = this.app.vault.getAbstractFileByPath(
			this.path + "/" + this.name + "-highlights.md"
		) as TFile;
	}

	static async findBox(
		app: App,
		notePath: string
	): Promise<FolderHLBox | undefined> {
		let path = notePath;
		while (path != "") {
			if (FolderHLBox.isBox(app, path)) {
				const file = app.vault.getAbstractFileByPath(
					path +
						"/" +
						path.substring(path.lastIndexOf("/") + 1) +
						".md"
				);
				if (!file || !(file instanceof TFile)) return;
				return new FolderHLBox(app, file);
			}
			path = path.substring(0, path.lastIndexOf("/"));
		}
	}

	static isBox(app: App, path: string): boolean | undefined {
		const basename = path.substring(path.lastIndexOf("/") + 1);
		const folderNote = app.vault.getAbstractFileByPath(
			path + "/" + basename + ".md"
		);
		if (folderNote && folderNote instanceof TFile) {
			const tags =
				app.metadataCache.getFileCache(folderNote)?.frontmatter?.tags;
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
		const folder = this.app.vault.getAbstractFileByPath(this.path);
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
				const highlights2 = await new HLedNote(this.app, file).getHighlights();
				highlights.push(...highlights2);

			}
		}
	}
}

export class MOCHLBox extends HLBox {
	app: App;
	MOC: TFile;
	highlightsFile : TFile;
	constructor(app: App, MOC: TFile) {
		if (!MOCHLBox.isBox(app, MOC)) return;
		super();
		this.app = app;
		this.MOC = MOC;
		this.highlightsFile = this.app.vault.getAbstractFileByPath(
			this.MOC.path.replace(".md", "-highlights.md")
		) as TFile;
	}
	static findBox(app: App, notePath: string): MOCHLBox | undefined {
		const file = app.vault.getAbstractFileByPath(notePath);
		if (!file || !(file instanceof TFile)) return;
		// @ts-ignore
		const backlinks = app.metadataCache.getBacklinksForFile(file);
		const backlinksAsFiles = Object.keys(backlinks.data)
			.filter((pathAsKey) => pathAsKey !== file.path)
			.map((pathAsKey) => app.vault.getAbstractFileByPath(pathAsKey));
		const filteredFiles = backlinksAsFiles.filter((file2) => {
			if (file2 instanceof TFile) {
				return MOCHLBox.isBox(app, file2);
			}
		});
		const MOC = filteredFiles[0];
		if (MOC && MOC instanceof TFile) {
			return new MOCHLBox(app, MOC);
		}
	}
	static isBox(app: App, file: TFile): boolean {
		const tags = app.metadataCache.getFileCache(file)?.frontmatter?.tags;
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
		const links = this.app.metadataCache.getFileCache(this.MOC)?.links;
		console.log(links)
		if (!links) return;
		for (const link of links) {
			const file = this.app.vault.getAbstractFileByPath(
				link.link + ".md"
			);
			if (!file || !(file instanceof TFile)) continue;
			const highlights2 = await new HLedNote(this.app, file).getHighlights();
			highlights.push(...highlights2);
		}
		return highlights;
	}
}
