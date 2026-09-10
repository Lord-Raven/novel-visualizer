import * as React from 'react';
import React__default, { FC } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { SvgIconComponent } from '@mui/icons-material';

interface InlineStyleContext {
    baseColor?: string;
    baseTextShadow?: string;
    baseFontFamily?: string;
}
type InlineClassStyle = React__default.CSSProperties | ((context: InlineStyleContext) => React__default.CSSProperties);
interface FormatInlineStylesOptions {
    classStyles?: Record<string, InlineClassStyle>;
    includeDefaultClassStyles?: boolean;
    styleContext?: InlineStyleContext;
}
declare const defaultInlineClassStyles: Record<string, InlineClassStyle>;
declare const formatInlineStyles: (text: string, options?: FormatInlineStylesOptions, initialActiveClass?: string | null) => React__default.JSX.Element;

interface NovelActor {
    id: string;
    name: string;
    defaultImageUrl?: string;
    filter?: 'ghost' | 'aura' | 'hologram';
    filterColor?: string;
}
interface NovelActorTheme {
    color?: string;
    fontFamily?: string;
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
 * Base interface for skits that the library requires.
 * Consumers can extend this with their own custom properties.
 */
interface NovelSkit<TEntry extends NovelScriptEntry = NovelScriptEntry> {
    id?: string;
    currentIndex?: number;
    script: TEntry[];
}
interface NovelScaleOffset {
    scale?: number;
    offsetX?: number;
    offsetY?: number;
}
interface NovelVoiceModulation {
    rate?: number;
    volume?: number;
    warmth?: number;
    brightness?: number;
    nasality?: number;
}

interface SubmitButtonConfig {
    label: string;
    icon?: React__default.ReactElement;
    colorScheme?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}
/**
 * Props for the NovelVisualizer component.
 * @template TScript - The script type
 * @template TEntry - The script entry type
 */
interface NovelVisualizerProps<TActor extends NovelActor, TSkit extends NovelSkit, TEntry extends NovelScriptEntry> {
    skit: TSkit | null;
    actors: Record<string, TActor>;
    playerActorId: string;
    getBackgroundImageUrl?: (skit: TSkit, index: number) => string;
    isVerticalLayout?: boolean;
    typingSpeed?: number;
    allowTypingSkip?: boolean;
    onSubmitInput?: (inputText: string, skit: TSkit, index: number) => Promise<TSkit>;
    onUpdateMessage?: (index: number, message: string) => void;
    onSkitChange?: (newSkit: TSkit) => void;
    inputPlaceholder?: string | ((context: {
        index: number;
        entry?: TEntry;
    }) => string);
    getSubmitButtonConfig?: (skit: TSkit, index: number, inputText: string) => SubmitButtonConfig;
    renderNameplate?: (actor: TActor | null) => React__default.ReactNode;
    responsiveOverlay?: (skit: TSkit | null, hoverActor: TActor | null) => React__default.ReactNode;
    getPresentActors: (skit: TSkit, index: number) => TActor[];
    getActorImageUrl: (actor: TActor, skit: TSkit, index: number) => string;
    getActorImageColorMultiplier?: (actor: TActor, skit: TSkit, index: number) => string;
    getActorScaleOffset?: (actor: TActor, skit: TSkit, index: number) => NovelScaleOffset;
    getActorFilter?: (actor: TActor, skit: TSkit, index: number) => {
        filter?: 'ghost' | 'aura' | 'hologram';
        filterColor?: string;
    };
    getActorVoiceModulation?: (actor: TActor, skit: TSkit, index: number) => NovelVoiceModulation | undefined;
    getActorTheme?: (actor: TActor, skit: TSkit, index: number) => NovelActorTheme;
    backgroundElements?: React__default.ReactNode | ((context: {
        skit: TSkit;
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
    /**
     * Optional external loading signal. When true, the component behaves as loading
     * in addition to its internal async loading state.
     */
    loading?: boolean;
    setTooltip?: (newMessage: string | null, newIcon?: SvgIconComponent) => void;
    hideInput?: boolean;
    hideActionButtons?: boolean;
    /**
     * When enabled, non-present actors who speak can "pop in" into the scene,
     * tilting in from the edge of the screen for visual presence.
     */
    enablePopInSpeakers?: boolean;
    enableAudio?: boolean;
    /**
     * When enabled, speaking characters will squish and stretch slightly while audio plays.
     * Requires enableAudio to be true to have any effect.
     */
    enableTalkingAnimation?: boolean;
    enableReroll?: boolean;
    narratorLabel?: string;
    enableFontEffects?: boolean;
    inlineStyleOptions?: FormatInlineStylesOptions;
    /**
     * Optional sx overrides for the main message display Paper.
     * Values provided here supplement and can override the component defaults.
     */
    messageWindowSx?: SxProps<Theme>;
}
declare function NovelVisualizer<TActor extends NovelActor, TSkit extends NovelSkit, TEntry extends NovelScriptEntry>(props: NovelVisualizerProps<TActor, TSkit, TEntry>): JSX.Element;

interface ActorImageProps {
    id: string;
    resolveImageUrl: () => string;
    xPosition: number;
    yPosition: number;
    zIndex: number;
    scale: number;
    offsetY: number;
    offsetX: number;
    speaker?: boolean;
    highlightColor: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    popInSide?: 'none' | 'left' | 'right';
    isAudioPlaying?: boolean;
    audioAnalyser?: AnalyserNode | null;
    filter?: 'ghost' | 'aura' | 'hologram';
    filterColor?: string;
}
declare const _default: React.NamedExoticComponent<ActorImageProps>;

interface BlurredBackgroundProps {
    imageUrl?: string;
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

interface FontHandlerProps {
    fontFamilies: string[];
}
declare const collectFontFamilies: (fontStacks: Array<string | undefined>) => string[];
declare const getFontSizeMultiplier: (fontStack?: string) => number;
declare const buildGoogleFontImportRules: (fontStacks: Array<string | undefined>) => string;
declare const FontHandler: FC<FontHandlerProps>;

interface TypeOutProps {
    children: React__default.ReactNode;
    speed?: number;
    className?: string;
    finishTyping?: boolean;
    onTypingComplete?: () => void;
}
declare const TypeOut: React__default.FC<TypeOutProps>;

interface VoiceAudioPlayback {
    audioContext: AudioContext;
    analyser: AnalyserNode;
    ended: Promise<void>;
    stop: () => void;
}
/**
 * Loads and plays an audio URL with the supplied voice modulation.
 *
 * Pass an AudioContext to reuse one owned by the consumer. When omitted, this
 * function creates a context and closes it after playback ends or is stopped.
 */
declare const playVoiceAudio: (audioUrl: string, voiceModulation: NovelVoiceModulation, audioContext?: AudioContext) => Promise<VoiceAudioPlayback>;

export { _default as ActorImage, type NovelSkit as BaseScript, type NovelScriptEntry as BaseScriptEntry, BlurredBackground, FontHandler, type FormatInlineStylesOptions, type InlineClassStyle, type InlineStyleContext, type NovelActor, type NovelActorTheme, type NovelScaleOffset, NovelVisualizer, type NovelVisualizerProps, type NovelVoiceModulation, type SubmitButtonConfig, TypeOut, type VoiceAudioPlayback, buildGoogleFontImportRules, collectFontFamilies, defaultInlineClassStyles, formatInlineStyles, getFontSizeMultiplier, playVoiceAudio };
