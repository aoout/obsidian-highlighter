import { EditorRange, Plugin, TFile, TFolder } from "obsidian";
import { Snippet,MarkdownParser } from "./MarkdownParser";

export interface ObsidianSnippet extends Snippet {
	content: string;
	range: EditorRange;
}

export class PluginApi {
	plugin: Plugin;
	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}
	async readFile(file: TFile): Promise<string> {
		return await this.plugin.app.vault.cachedRead(file);
	}
	async readPath(path: string): Promise<string | null> {
		const file = this.plugin.app.vault.getAbstractFileByPath(path);
		if (!file || !(file instanceof TFile)) return null;
		return await this.readFile(file);
	}
	async writeFile(file: TFile, content: string): Promise<void> {
		return this.plugin.app.vault.modify(file, content);
	}
	async writePath(
		path: string,
		content: string,
		create = false
	): Promise<TFile | void> {
		const file = this.plugin.app.vault.getAbstractFileByPath(path);
		if (!file || !(file instanceof TFile)) {
			if (!create) return;
			return await this.plugin.app.vault.create(path, content);
		}
		return this.writeFile(file, content);
	}
	getFilebyPath(path: string): TFile | null {
		const file = this.plugin.app.vault.getAbstractFileByPath(path);
		if (!file || !(file instanceof TFile)) return null;
		return file;
	}
	getFolderbyPath(path: string): TFolder | null {
		const folder = this.plugin.app.vault.getAbstractFileByPath(path);
		if (!folder || !(folder instanceof TFolder)) return null;
		return folder;
	}
	async jumpTo(
		file: TFile | string | null = null,
		range: EditorRange
	): Promise<boolean> {
		if (!file) {
			this.plugin.app.workspace.activeEditor?.editor?.scrollIntoView(
				range,
				true
			);
			return true;
		}
		if (!(file instanceof TFile)) {
			const result = this.getFilebyPath(file);
			if (!result) return false;
			file = result;
		}

		this.plugin.app.workspace
			.getLeaf()
			.openFile(file)
			.then(() => {
				this.plugin.app.workspace.activeEditor?.editor?.scrollIntoView(
					range,
					true
				);
			});
		return true;
	}
	getLinkTo(file: TFile): (TFile | string)[] {
		return this.plugin.app.metadataCache
			.getFileCache(file)
			?.links?.map((link) => {
				const path = link.link + ".md";
				const file = this.getFilebyPath(path);
				if (!file) return path;
				return file;
			}) as (TFile | string)[];
	}
	getLinkedTo(file: TFile): TFile[] {
		const backlinks =
			// @ts-ignore
			this.plugin.app.metadataCache.getBacklinksForFile(file);
		const backlinksAsFiles = Object.keys(backlinks.data)
			.map((pathAsKey) => {
				const file = this.getFilebyPath(pathAsKey);
				if (!file) return null;
				return file;
			})
			.filter((file) => file);
		return backlinksAsFiles as TFile[];
	}
	getTags(file: TFile): string[] {
		return this.plugin.app.metadataCache.getFileCache(file)?.frontmatter
			?.tags;
	}
	async getSections(
		file: TFile
	): Promise<{ title: string; content: string }[]> {
		const content = await this.readFile(file);
		const parser =  new MarkdownParser(content);
		return parser.getSections();
	}
	async getHighlights(file: TFile): Promise<ObsidianSnippet[]> {
		const content = await this.readFile(file);
		const parser =  new MarkdownParser(content);
		return parser.getHighlights() as ObsidianSnippet[];
	}
}
