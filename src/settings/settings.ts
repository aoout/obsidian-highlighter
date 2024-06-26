export interface HighlighterSettings {
	boxTags: string[];
	boxType: string;
	template: string;
	popupType: string;
}

export const DEFAULT_SETTINGS: HighlighterSettings = {
	boxTags: ["HighlightBox"],
	boxType: "MOC",
	template: "{{highlight}}",
	popupType: "default"
};
