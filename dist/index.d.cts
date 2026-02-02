import * as React from 'react';
import React__default, { FC } from 'react';

interface NovelActor {
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
interface NovelScriptEntry {
    speaker?: string;
    message?: string;
    speechUrl?: string;
    endScene?: boolean;
}
/**
 * Base interface for scripts that the library requires.
 * Consumers can extend this with their own custom properties.
 */
interface NovelScript<TEntry extends NovelScriptEntry = NovelScriptEntry> {
    script: TEntry[];
}

/**
 * Props for the NovelVisualizer component.
 * @template TScript - The script type
 * @template TEntry - The script entry type
 */
interface NovelVisualizerProps<TActor extends NovelActor, TScript extends NovelScript, TEntry extends NovelScriptEntry> {
    script: TScript;
    actors: Record<string, TActor>;
    backgroundImageUrl: string;
    isVerticalLayout?: boolean;
    loading?: boolean;
    currentIndex?: number;
    typingSpeed?: number;
    allowTypingSkip?: boolean;
    onSubmitInput?: (inputText: string, context: {
        index: number;
        entry?: TEntry;
        wrapUp?: boolean;
    }) => void;
    onUpdateMessage?: (index: number, message: string) => void;
    onReroll?: (index: number) => void;
    onWrapUp?: (index: number) => void;
    onClose?: () => void;
    inputPlaceholder?: string | ((context: {
        index: number;
        entry?: TEntry;
    }) => string);
    renderNameplate?: (params: {
        actor: TActor | null;
    }) => React__default.ReactNode;
    renderActorHoverInfo?: (actor: TActor | null) => React__default.ReactNode;
    /**
     * Determines which actors should be visible at the given script index.
     * @param script - The full script object
     * @param index - The current script entry index
     * @param actors - All available actors
     * @returns Array of actors that should be visible
     */
    getPresentActors: (script: TScript, index: number) => TActor[];
    resolveSpeaker: (script: TScript, index: number) => TActor | null;
    /**
     * Resolves the image URL for an actor based on their emotion and script index.
     * This is where you implement your own logic to determine which image to display.
     * @param actor - The actor to get image for
     * @param emotion - The emotion returned by getActorEmotion
     * @param script - The full script object
     * @param index - The current script entry index
     * @returns The URL of the image to display
     */
    getActorImageUrl: (actor: TActor, script: TScript, index: number) => string;
    backgroundOptions?: {
        brightness?: number;
        contrast?: number;
        blur?: number;
        scale?: number;
        overlay?: string;
    };
    hideInput?: boolean;
    hideActionButtons?: boolean;
}
declare function NovelVisualizer<TActor extends NovelActor, TScript extends NovelScript, TEntry extends NovelScriptEntry>(props: NovelVisualizerProps<TActor, TScript, TEntry>): JSX.Element;

interface ActorImageProps {
    id: string;
    resolveImageUrl: () => string;
    xPosition: number;
    yPosition: number;
    zIndex: number;
    heightMultiplier: number;
    speaker?: boolean;
    highlightColor: string;
    panX: number;
    panY: number;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}
declare const _default: React.NamedExoticComponent<ActorImageProps>;

interface BlurredBackgroundProps {
    imageUrl: string;
    brightness?: number;
    contrast?: number;
    blur?: number;
    scale?: number;
    overlay?: string;
    children?: React__default.ReactNode;
}
/**
 * A reusable component that provides a blurred background image with consistent styling
 * across all screens in the application.
 */
declare const BlurredBackground: FC<BlurredBackgroundProps>;

interface TypeOutProps {
    children: React__default.ReactNode;
    speed?: number;
    className?: string;
    finishTyping?: boolean;
    onTypingComplete?: () => void;
}
declare const TypeOut: React__default.FC<TypeOutProps>;

export { _default as ActorImage, type NovelScript as BaseScript, type NovelScriptEntry as BaseScriptEntry, BlurredBackground, type NovelActor, NovelVisualizer, type NovelVisualizerProps, TypeOut };
