/* eslint-disable @typescript-eslint/no-unused-vars */
import { App, TFile, TFolder } from "obsidian";
import { Highlight, HLedNote } from "./HLedNote";

class HighlightBox {
	static tags: string[] = ["HighlightBox"];
}

export class FolderHighlightBox extends HighlightBox {
	/*This class is used to abstract a highlight box, which contains all the highlights of the subfolders of a folder.
    When a markdown file with the same basename as the folder name exists under a folder (called folderNote),
    and folderNote contains certain specific tags, the folder will be regarded as a highlight box.*/

	app: App;
	path: string;
	name: string;

	constructor(app: App, path: string) {
		super();
		this.app = app;
		this.path = path;
		this.name = path.substring(path.lastIndexOf("/") + 1);
	}

	static async findBox(
		app: App,
		notePath: string
	): Promise<FolderHighlightBox | undefined> {
		// Starting from notePath, search upwards for the highlight box
		let path = notePath;
		while (path != "") {
			if (FolderHighlightBox.isBox(app, path)) {
				return new FolderHighlightBox(app, path);
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
					if (FolderHighlightBox.tags.includes(tag)) {
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
			} else if (
				file instanceof TFile &&
				file.extension == "md" &&
				!file.name.includes("-highlights")
			) {
				// 读取file的内容
				const content = await this.app.vault.cachedRead(file);
				const highlights2 = new HLedNote(content).highlights;
				// for 循环 为高亮添加 noteLink 属性
				for (const highlight of highlights2) {
					highlight.noteLink = file.path.split(".md")[0];
					highlights.push(highlight);
				}
			}
		}
	}
}

export class MOCHignlightBox extends HighlightBox {
	/*This class is used to abstract a highlight box, which contains all the highlights of from files that be linked to the MOC.
	when a MOC contains certain specific tags, the MOC will be regarded as a highlight box.*/
	app: App;
	MOC: TFile;
	constructor(app: App, MOC: TFile) {
		super();
		this.app = app;
		this.MOC = MOC;
	}
	static findBox(app: App, notePath: string): MOCHignlightBox | undefined {
		// getBacklinksForFile is not document officially, so it might break at some point.
		const file = app.vault.getAbstractFileByPath(notePath);
		if (file && file instanceof TFile) {
			// @ts-ignore
			const backlinks = app.metadataCache.getBacklinksForFile(file);
			const backlinksAsFiles = Object.keys(backlinks.data)
				.filter((pathAsKey) => pathAsKey !== file.path)
				.map((pathAsKey) => app.vault.getAbstractFileByPath(pathAsKey));
			// 从中筛选出有指定tags的文件
			const filteredFiles = backlinksAsFiles.filter((file2) => {
				if (file2 instanceof TFile) {
					return MOCHignlightBox.isBox(app, file2);
				}
			});
			const MOC = filteredFiles[0];
			if (MOC && MOC instanceof TFile) {
				return new MOCHignlightBox(app, MOC);
			}
		}
	}
	static isBox(app: App, file: TFile): boolean {
		const tags = app.metadataCache.getFileCache(file)?.frontmatter?.tags;
		if (tags) {
			for (const tag of tags) {
				if (MOCHignlightBox.tags.includes(tag)) {
					return true;
				}
			}
		}
		return false;
	}
	async getHighlights() {
		// 从MOC的 links属性里面获取所有的高亮
		const highlights: Highlight[] = [];
		const links = this.app.metadataCache.getFileCache(this.MOC)?.links;
		console.log("box-links", links);
		if (links) {
			for (const link of links) {
				const file = this.app.vault.getAbstractFileByPath(
					link.link + ".md"
				);
				if (file && file instanceof TFile) {
					const content = await this.app.vault.cachedRead(file);
					const highlights2 = new HLedNote(content).highlights;
					for (const highlight of highlights2) {
						highlight.noteLink = file.path.split(".md")[0];
						highlights.push(highlight);
					}
				}
			}
		}
		console.log("box-result", highlights);
		return highlights;
	}
}
