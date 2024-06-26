export interface HighlighterSettings {
	boxTags: string[];
	boxType: string;
	template: string;
	storage: string;
	autoUpdate: boolean;
}

export const DEFAULT_SETTINGS: HighlighterSettings = {
	boxTags: ["HighlightBox"],
	boxType: "MOC",
	template: "{{highlight}}",
	storage: "highlights",
	autoUpdate: false
};
