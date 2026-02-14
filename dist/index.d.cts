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

interface SubmitButtonConfig {
    label: string;
    icon?: React__default.ReactElement;
    colorScheme?: 'primary' | 'error';
}
/**
 * Props for the NovelVisualizer component.
 * @template TScript - The script type
 * @template TEntry - The script entry type
 */
interface NovelVisualizerProps<TActor extends NovelActor, TScript extends NovelScript, TEntry extends NovelScriptEntry> {
    script: TScript;
    actors: Record<string, TActor>;
    getBackgroundImageUrl: (script: TScript, index: number) => string;
    isVerticalLayout?: boolean;
    typingSpeed?: number;
    allowTypingSkip?: boolean;
    onSubmitInput?: (inputText: string, script: TScript, index: number) => Promise<void>;
    onUpdateMessage?: (index: number, message: string) => void;
    onReroll?: (index: number) => void;
    inputPlaceholder?: string | ((context: {
        index: number;
        entry?: TEntry;
    }) => string);
    /**
     * Function to determine button label, icon, and color scheme based on script state.
     * If not provided, defaults to showing "Continue"/"Send"/"End" based on input and scene state.
     */
    getSubmitButtonConfig?: (script: TScript, index: number, inputText: string) => SubmitButtonConfig;
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
        transitionDuration?: number;
    };
    hideInput?: boolean;
    hideActionButtons?: boolean;
    /**
     * When enabled, non-present actors who speak can "ghost" into the scene,
     * tilting in from the edge of the screen for visual presence.
     */
    allowGhostSpeakers?: boolean;
    enableAudio?: boolean;
    /**
     * When enabled, speaking characters will squish and stretch slightly while audio plays.
     * Requires enableAudio to be true to have any effect.
     */
    enableTalkingAnimation?: boolean;
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
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    isGhost?: boolean;
    ghostSide?: 'left' | 'right';
    isAudioPlaying?: boolean;
}
declare const _default: React.NamedExoticComponent<ActorImageProps>;

interface BlurredBackgroundProps {
    imageUrl: string;
    brightness?: number;
    contrast?: number;
    blur?: number;
    scale?: number;
    overlay?: string;
    transitionDuration?: number;
    children?: React__default.ReactNode;
}
/**
 * A reusable component that provides a blurred background image with consistent styling
 * across all screens in the application. Features smooth fade transitions when the image changes.
 * @param transitionDuration - Duration of the fade transition in milliseconds (default: 600)
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

export { _default as ActorImage, type NovelScript as BaseScript, type NovelScriptEntry as BaseScriptEntry, BlurredBackground, type NovelActor, NovelVisualizer, type NovelVisualizerProps, type SubmitButtonConfig, TypeOut };
