
export interface NovelActor {
    id: string;
    name: string;
    defaultImageUrl?: string;
    filter?: 'ghost' | 'aura' | 'hologram';
    filterColor?: string;
}

export interface NovelActorTheme {
    color?: string;
    fontFamily?: string;
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
 * Base interface for skits that the library requires.
 * Consumers can extend this with their own custom properties.
 */
export interface NovelSkit<TEntry extends NovelScriptEntry = NovelScriptEntry> {
    id?: string;
    currentIndex?: number;
    script: TEntry[];
}

export interface NovelScaleOffset {
    scale?: number;
    offsetX?: number;
    offsetY?: number;
}

export interface NovelVoiceModulation {
    rate?: number; // playback rate multiplier (1 is normal)
    volume?: number; // multiplier (1 is normal)
    warmth?: number; // +/- dB (0 is normal)
    brightness?: number; // +/- dB (0 is normal)
    nasality?: number; // +/- dB (0 is normal)
}
