export interface HighlighterSettings {
	boxTags: string[];
	boxType: string;
	template: string;
	popupType: string;
	storage: string;
	autoUpdate: boolean;
}

export const DEFAULT_SETTINGS: HighlighterSettings = {
	boxTags: ["HighlightBox"],
	boxType: "MOC",
	template: "{{highlight}}",
	popupType: "same as active file mode",
	storage: "highlights",
	autoUpdate: false
};
