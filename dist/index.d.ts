import * as React from 'react';
import React__default, { FC } from 'react';
import { SvgIconComponent } from '@mui/icons-material';

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
    speakerId?: string;
    message?: string;
    speechUrl?: string;
    endScene?: boolean;
}
/**
 * Base interface for scripts that the library requires.
 * Consumers can extend this with their own custom properties.
 */
interface NovelScript<TEntry extends NovelScriptEntry = NovelScriptEntry> {
    id: string;
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
    playerActorId: string;
    getBackgroundImageUrl: (script: TScript, index: number) => string;
    isVerticalLayout?: boolean;
    typingSpeed?: number;
    allowTypingSkip?: boolean;
    onSubmitInput?: (inputText: string, script: TScript, index: number) => Promise<TScript>;
    onUpdateMessage?: (index: number, message: string) => void;
    inputPlaceholder?: string | ((context: {
        index: number;
        entry?: TEntry;
    }) => string);
    getSubmitButtonConfig?: (script: TScript, index: number, inputText: string) => SubmitButtonConfig;
    renderNameplate?: (actor: TActor | null) => React__default.ReactNode;
    renderActorHoverInfo?: (actor: TActor | null) => React__default.ReactNode;
    getPresentActors: (script: TScript, index: number) => TActor[];
    getActorImageUrl: (actor: TActor, script: TScript, index: number) => string;
    backgroundElements?: React__default.ReactNode | ((context: {
        script: TScript;
        index: number;
        presentActors: TActor[];
    }) => React__default.ReactNode);
    backgroundOptions?: {
        brightness?: number;
        contrast?: number;
        blur?: number;
        scale?: number;
        overlay?: string;
        transitionDuration?: number;
    };
    setTooltip?: (newMessage: string | null, newIcon?: SvgIconComponent) => void;
    hideInput?: boolean;
    hideActionButtons?: boolean;
    /**
     * When enabled, non-present actors who speak can "ghost" into the scene,
     * tilting in from the edge of the screen for visual presence.
     */
    enableGhostSpeakers?: boolean;
    enableAudio?: boolean;
    /**
     * When enabled, speaking characters will squish and stretch slightly while audio plays.
     * Requires enableAudio to be true to have any effect.
     */
    enableTalkingAnimation?: boolean;
    enableReroll?: boolean;
    narratorLabel?: string;
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
