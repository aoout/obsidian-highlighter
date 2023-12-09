export interface HighlighterSettings {
	boxTags: string[];
	boxType: string;
}

export const DEFAULT_SETTINGS: HighlighterSettings = {
	boxTags: ["HighlightBox"],
	boxType: "Folder",
};
