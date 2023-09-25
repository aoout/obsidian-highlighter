export interface HighlighterSettings {
    boxTags: string[];
    boxType: string;
    autoUpdate: boolean;
}

export const DEFAULT_SETTINGS: HighlighterSettings = {
    boxTags: ["HighlightBox"],
    boxType: "Folder",
    autoUpdate: false
};