
export interface NovelActor {
    id: string;
    name: string;
    themeColor?: string;
    themeFontFamily?: string;
    defaultImageUrl?: string;
}

/**
 * Base interface for script entries that the library requires.
 * Consumers can extend this with their own custom properties.
 */
export interface NovelScriptEntry {
    speakerId?: string;
    message?: string;
    speechUrl?: string;
    endScene?: boolean;
}

/**
 * Base interface for scripts that the library requires.
 * Consumers can extend this with their own custom properties.
 */
export interface NovelScript<TEntry extends NovelScriptEntry = NovelScriptEntry> {
    script: TEntry[];
}

