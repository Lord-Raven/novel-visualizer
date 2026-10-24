export { default as NovelVisualizer } from './components/NovelVisualizer';
export type { NovelVisualizerProps, SubmitButtonConfig, ActionButtonConfig } from './components/NovelVisualizer';
export type { 
    NovelActor,
    NovelActorTheme,
    NovelSkit as BaseScript, 
    NovelScriptEntry as BaseScriptEntry,
    NovelScaleOffset,
    NovelVoiceModulation
} from './types';
export { default as ActorImage } from './components/ActorImage';
export { default as BlurredBackground } from './components/BlurredBackground';
export { default as FontHandler, getFontSizeMultiplier, collectFontFamilies, buildGoogleFontImportRules } from './components/FontHandler';
export { default as TypeOut } from './components/TypeOut';
export { formatInlineStyles, defaultInlineClassStyles } from './utils/TextFormatting';
export type {
    InlineStyleContext,
    InlineClassStyle,
    FormatInlineStylesOptions
} from './utils/TextFormatting';
export { playVoiceAudio } from './utils/playVoiceAudio';
export type { VoiceAudioPlayback } from './utils/playVoiceAudio';
export {
    DEFAULT_VOICE_MODULATION,
    normalizeVoiceModulation,
    ACTOR_VOICE_ACCENTS,
    ACTOR_VOICE_GENDER_LABELS,
    ACTOR_VOICES,
    getActorVoice,
    formatActorVoiceLabel,
    getActorVoiceVolume
} from './components/ActorVoice';
export type {
    VoiceModulation,
    ActorVoiceAccent,
    ActorVoiceGender,
    ActorVoice
} from './components/ActorVoice';
