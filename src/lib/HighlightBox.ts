import { App, TFile } from "obsidian";
import { getHighlights, highlight } from "./getHighlights";

import { PlatformPath } from "path/posix";
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const path = (require("path-browserify").posix) as PlatformPath;
import { HighlightsBuilder } from "./highlightsBuilder";
import { HighlighterSettings } from "../settings/settings";

export class HighlightBox {
	app: App;
	settings: HighlighterSettings;
	path: string;
	constructor(app: App, settings:HighlighterSettings, path: string) {
		this.app = app;
		this.settings = settings;
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
		const noteFile = this.app.vault.getAbstractFileByPath(notePath);
		
		if (!(noteFile instanceof TFile)) {
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
	static findBox(app: App, path: string, settings:HighlighterSettings): MocBox {
		const file = app.vault.getAbstractFileByPath(path);
		if (!file || !(file instanceof TFile)) return;
		const backlinks =
			// @ts-ignore
			app.metadataCache.getBacklinksForFile(file);
		const result = Object.keys(backlinks.data).find((path: string) =>{
			return this.tagCheck(app, path, settings.boxTags);
		});
		return new MocBox(app,settings, result);
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
		return path.dirname(this.path) + "/" + this.settings.storage +  ".md";
	}
}

class FolderBox extends HighlightBox {
	static findBox(app: App, _path: string,settings:HighlighterSettings): FolderBox {
		const dir = path.dirname(_path);
		const folderNote = dir + "/" + path.basename(dir) + ".md";
		if (this.tagCheck(app, folderNote, settings.boxTags)) return new FolderBox(app,settings, folderNote);
		if (dir == ".") return;
		return FolderBox.findBox(app, dir, settings);
	}
	getNotes(): TFile[] {
		const dir = path.dirname(this.path);
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((file) => file.path.split("/").includes(dir));
		return files;
	}
}
