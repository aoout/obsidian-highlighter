import { highlight } from "./getHighlights";

export type HighlightItem = { content: string; comment: string };
export type HighlightsMap = Map<string, HighlightItem[]>;

export class HighlightsBuilder {
	static highlights2map(highlights: highlight[]): HighlightsMap {
		const map = new Map();
		highlights.forEach((highlight) => {
			const { sourcePath, content } = highlight;
			const title = sourcePath.split("/").splice(-1)[0].split(".md")[0];
			const note = map.get(title);
			if (note) {
				note.push({ content: content, Comment: "" });
			} else {
				map.set(title, [{ content: content, Comment: "" }]);
			}
		});
		return map;
	}
	static map2markdown(map: HighlightsMap, template: string): string {
		let markdown = "";
		map.forEach((value, key) => {
			markdown += `## ${key}\n\n`;
			value.forEach((item: HighlightItem) => {
				markdown += template.replace("{{highlight}}", item.content);
				markdown += "\n";
				if (item.comment) {
					markdown += `@\n${item.comment}\n`;
				}
				markdown += "\n";
			});
		});
		return markdown;
	}
	static markdown2map(markdown: string, template: string): HighlightsMap {
		const map = new Map();
		const notes = markdown.split("## ").splice(1);
		notes.forEach((note) => {
			const title = note.split("\n")[0];
			const highlights = note
				.split("\n\n")
				.splice(1)
				.filter((highlight) => highlight);
			const items: HighlightItem[] = [];
			highlights.forEach((highlight) => {
				const content = highlight.split("\n")[0].replaceAll(
					new RegExp(`${template.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&").replaceAll(/\\{\\{highlight\\}\\}/g,"(.*)")}`,"g"),
					"$1"
				);
				const comment = highlight.split(content).splice(1).join("\n").split("@\n")[1];
				items.push({
					content: content,
					comment: comment,
				});
			});
			map.set(title, items);
		});
		return map;
	}
	static mergeComments(mapOld: HighlightsMap, mapNew: HighlightsMap): HighlightsMap {
		return new Map(
			Array.from(mapNew.entries()).map((i) => [
				i[0],
				i[1].map((j) => ({
					content: j.content,
					comment: mapOld.get(i[0])?.find((i) => i.content == j.content)?.comment || "",
				})),
			])
		);
	}
}
