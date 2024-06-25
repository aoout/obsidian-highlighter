import { App, TFile } from "obsidian";
import { getHighlights, highlight } from "./getHighlights";

import * as path from "path";
import { HighlightsBuilder } from "./highlightsBuilder";

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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const highlights: highlight[] = (await Promise.all(
			notes.map(async (note) => {
				const content = await this.app.vault.read(note);
				return getHighlights(content, note.path);
			})
		)).flat();
		return highlights;
	}
	getNotes(): TFile[] {
		throw new Error("Method not implemented.");
	}
	getHighlightsNotePath(): string {
		throw new Error("Method not implemented.");
	}
	async updateHighlightsNote(template: string): Promise<void> {
		const highlights: highlight[] = await this.getHighlights();
		
		const map = HighlightsBuilder.highlights2map(highlights);
		const notePath = this.getHighlightsNotePath();
		const noteFile = this.app.vault.getAbstractFileByPath(notePath) as TFile;
		if (!highlights) {
			await this.app.vault.create(
				notePath,
				HighlightsBuilder.map2markdown(map, template)
			);
		} else {
			const content: string = await this.app.vault.read(noteFile);
			const mapOld = HighlightsBuilder.markdown2map(
				content,
				template
			);
			const mapNew = HighlightsBuilder.mergeComments(mapOld, map);
			await this.app.vault.modify(
				noteFile,
				HighlightsBuilder.map2markdown(mapNew, template)
			);
		}
	}
}

class MocBox extends HighlightBox {
	static findBox(app: App, path: string, boxTags: string[]): MocBox {
		const file = app.vault.getAbstractFileByPath(path);
		if (!file || !(file instanceof TFile)) return;
		const backlinks =
			// @ts-ignore
			app.metadataCache.getBacklinksForFile(file);
		const result = Object.keys(backlinks.data).find((path: string) =>{
			return this.tagCheck(app, path, boxTags);
		});
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
	getHighlightsNotePath(): string {
		return path.dirname(this.path) + "/" + "highlights.md";
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
