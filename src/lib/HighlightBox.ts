import { App, TFile } from "obsidian";
import { getHighlights, highlight } from "./getHighlights";

import * as path from "path";

export class HighlightBox {
	app: App;
	path: string;
	constructor(app: App, path: string) {
		this.app = app;
		this.path = path;
	}
	static type(type: string) {
		if (type == "MOC") return MocBox;
		if (type == "Folder") return FolderBox;
		throw new Error("Invalid type");
	}
	static tagCheck(app: App, path: string, boxTags: string[]): boolean {
		const tags = app.metadataCache.getCache(path)?.frontmatter?.tags || [];
		return tags.some((tag: string) => boxTags.includes(tag));
	}
	async getHighlights(): Promise<highlight[]> {
		const notes = this.getNotes();
		const highlights: highlight[] = [];
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		return new Promise<highlight[]>((resolve, _reject) => {
			for (const note of notes) {
				this.app.vault.cachedRead(note).then((content: string) => {
					const highlightsInNote = getHighlights(content, note.path);
					highlights.push(...highlightsInNote);
				});
			}
			resolve(highlights);
		});
	}
	getNotes(): TFile[] {
		throw new Error("Method not implemented.");
	}
}

class MocBox extends HighlightBox {
	static findBox(app: App, path: string, boxTags: string[]): MocBox {
		const file = app.vault.getAbstractFileByPath(path);
		if (!file || !(file instanceof TFile)) return;
		const backlinks =
			// @ts-ignore
			app.metadataCache.getBacklinksForFile(file);

		const result = Object.keys(backlinks.data).find((path: string) =>
			this.tagCheck(app, path, boxTags)
		);
		return new MocBox(app, result);
	}
	getNotes(): TFile[] {
		const notes = this.app.metadataCache.getCache(this.path).links.map((link) => {
			const file = this.app.vault.getAbstractFileByPath(link.link + ".md");
			if (!file) return;
			return file as TFile;
		});
		return notes;
	}
}

class FolderBox extends HighlightBox {
	static findBox(app: App, _path: string, boxTags: string[]): FolderBox {
		const dir = path.dirname(_path);
		const folderNote = dir + "/" + path.basename(dir) + ".md";
		if (this.tagCheck(app, folderNote, boxTags)) return new FolderBox(app, folderNote);
		if (dir == ".") return;
		return FolderBox.findBox(app, dir, boxTags);
	}
	getNotes(): TFile[] {
		const dir = path.dirname(this.path);
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((file) => file.path.split("/").includes(dir));
		return files;
	}
}
