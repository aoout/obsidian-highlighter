export interface highlight {
	content: string;
	sourcePath: string;
}

export function getHighlights(content: string, sourcePath: string): highlight[] {
	// use regex to find highlights in content.
	// "==this a test text==", like this, we call it highlight.
	const highlights = [];
	const regex = /==(.+)==/g;
	let match: RegExpExecArray | null = null;
	while ((match = regex.exec(content)) !== null) {
		highlights.push({
			content: match[1],
			sourcePath: sourcePath,
		});
	}
	return highlights;
}
