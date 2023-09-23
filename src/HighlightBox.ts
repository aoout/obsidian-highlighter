import { App, TFile, TFolder } from "obsidian";
import { Highlight, HighlightParser } from "./highlightParser";

export class HighlightBox {
	/*This class is used to abstract a highlight box, which contains all the highlights of the subfolders of a folder.
    When a markdown file with the same basename as the folder name exists under a folder (called folderNote),
    and folderNote contains certain specific tags, the folder will be regarded as a highlight box.*/

	static tags: string[] = ["HighlightBox"];
	app: App;
	path: string;
	name: string;

	constructor(app: App, path: string) {
		this.app = app;
		this.path = path;
		this.name = path.substring(path.lastIndexOf("/") + 1);
	}

	static async findBox(
		app: App,
		notePath: string
	): Promise<HighlightBox | undefined> {
		// Starting from notePath, search upwards for the highlight box
		let path = notePath;
		while (path != "") {
			if (HighlightBox.isBox(app, path)) {
				return new HighlightBox(app, path);
			}
			path = path.substring(0, path.lastIndexOf("/"));
		}
	}

	static isBox(app: App, path: string): boolean | undefined {
		// Determine whether a folder is a highlight box
		const basename = path.substring(path.lastIndexOf("/") + 1);
		const folderNote = app.vault.getAbstractFileByPath(
			path + "/" + basename + ".md"
		);
		if (folderNote && folderNote instanceof TFile) {
			const tags =
				app.metadataCache.getFileCache(folderNote)?.frontmatter?.tags;
			if (tags) {
				for (const tag of tags) {
					if (HighlightBox.tags.includes(tag)) {
						return true;
					}
				}
			}
		}
		return false;
	}

	async getHighlights(): Promise<Highlight[] | undefined> {
		// Get the highlights of the folders and all subfolders under the current folder
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
		// Get the highlights of the current folder and all subfolders
		// 实现一个对于folder.children的排序算法
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
			} else if (file instanceof TFile && file.extension == "md" && ! file.name.includes("-highlights")) {
				// 读取file的内容
				const content = await this.app.vault.cachedRead(file);
				const highlights2 = new HighlightParser(content).highlights;
				// for 循环 为高亮添加 noteLink 属性
				for (const highlight of highlights2) {
					highlight.noteLink = file.path.split(".md")[0];
					highlights.push(highlight);
				}
			}
		}
	}
}
