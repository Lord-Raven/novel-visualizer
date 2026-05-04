import React from 'react';
import { darken, lighten } from '@mui/material/styles';

export interface InlineStyleContext {
    baseColor?: string;
    baseTextShadow?: string;
    baseFontFamily?: string;
}

export type InlineClassStyle =
    | React.CSSProperties
    | ((context: InlineStyleContext) => React.CSSProperties);

export interface FormatInlineStylesOptions {
    classStyles?: Record<string, InlineClassStyle>;
    includeDefaultClassStyles?: boolean;
    styleContext?: InlineStyleContext;
}

export interface MessageFormatTokens {
    baseTextShadow: string;
    defaultDialogueColor: string;
    defaultDialogueShadow: string;
    fallbackFontFamily: string;
}

export interface FormatMessageWithStylesOptions {
    speakerThemeColor?: string;
    speakerThemeFontFamily?: string;
    proseColor: string;
    tokens: MessageFormatTokens;
    inlineStyleOptions?: FormatInlineStylesOptions;
}

const INLINE_STYLE_SHEET_ID = 'novel-visualizer-inline-style-presets';
const INLINE_STYLE_PRESET_CSS = `
@keyframes nvInlineShinyPulse {
    0%, 68%, 100% {
        filter: brightness(1) saturate(1);
        text-shadow: inherit;
    }
    72% {
        filter: brightness(1.28) saturate(1.22);
        text-shadow: 0 0 5px currentColor, 0 0 14px rgba(255, 255, 255, 0.9);
    }
    76% {
        filter: brightness(1.1) saturate(1.08);
        text-shadow: 0 0 3px currentColor, 0 0 9px rgba(255, 255, 255, 0.55);
    }
}

@keyframes nvInlineSpookyWave {
    0%, 100% {
        transform: translateY(0px);
    }
    25% {
        transform: translateY(-2px);
    }
    75% {
        transform: translateY(2px);
    }
}

@keyframes nvInlineQuake {
    0% {
        transform: translate(0, 0) rotate(0deg);
    }
    25% {
        transform: translate(-0.45px, 0.45px) rotate(-0.2deg);
    }
    50% {
        transform: translate(0.4px, -0.4px) rotate(0.2deg);
    }
    75% {
        transform: translate(-0.35px, -0.45px) rotate(-0.15deg);
    }
    100% {
        transform: translate(0.35px, 0.25px) rotate(0.15deg);
    }
}

@keyframes nvInlineGlitch {
    0%, 100% {
        filter: saturate(1.08) contrast(1);
    }
    40% {
        filter: saturate(1.2) contrast(1.08);
    }
    70% {
        filter: saturate(1.12) contrast(1.12);
    }
}

@keyframes nvInlineGlitchChar {
    0%, 100% {
        transform: translate3d(0, 0, 0);
        text-shadow: inherit;
    }
    14% {
        transform: translate3d(-0.6px, 0, 0);
        text-shadow: -1px 0 rgba(255, 0, 92, 0.9), 1px 0 rgba(0, 229, 255, 0.9);
    }
    16% {
        transform: translate3d(0.55px, 0, 0);
        text-shadow: 1px 0 rgba(255, 0, 92, 0.8), -1px 0 rgba(0, 229, 255, 0.8);
    }
    60% {
        transform: translate3d(0, -0.45px, 0);
        text-shadow: -1px 0 rgba(255, 0, 92, 0.62), 1px 0 rgba(0, 229, 255, 0.62);
    }
}

@keyframes nvInlineZalgo {
    0%, 100% {
        filter: brightness(0.98) saturate(0.86);
        text-shadow: inherit;
    }
    50% {
        filter: brightness(1.08) saturate(0.72);
        text-shadow: 0 -1px 0 rgba(255, 255, 255, 0.35), 0 0 7px currentColor, 0 0 14px rgba(145, 255, 210, 0.28);
    }
}

@keyframes nvInlineZalgoChar {
    0%,
    100% {
        transform: translate3d(0, 0, 0) skewX(0deg);
    }
    30% {
        transform: translate3d(-0.5px, -0.35px, 0) skewX(-1.5deg);
    }
    65% {
        transform: translate3d(0.45px, 0.25px, 0) skewX(1.2deg);
    }
}

@keyframes nvInlineShout {
    0%, 100% {
        filter: brightness(1.14) saturate(1.14);
    }
}

@keyframes nvInlineFlutter {
    0%, 100% {
        opacity: 0.95;
        filter: saturate(1);
    }
    35% {
        opacity: 0.86;
        filter: saturate(1.08) hue-rotate(-7deg);
    }
    65% {
        opacity: 0.9;
        filter: saturate(1.02) hue-rotate(6deg);
    }
}

@keyframes nvInlineFlutterChar {
    0%, 100% {
        transform: translate3d(0, 0, 0);
    }
    25% {
        transform: translate3d(-0.7px, 0, 0);
    }
    50% {
        transform: translate3d(0.7px, 0, 0);
    }
    75% {
        transform: translate3d(-0.35px, 0, 0);
    }
}

@keyframes nvInlineSigh {
    0%, 100% {
        opacity: 0.78;
        filter: blur(0px) saturate(0.94);
    }
    55% {
        opacity: 0.62;
        filter: blur(0.35px) saturate(0.74);
    }
}

@keyframes nvInlineSighChar {
    0% {
        transform: scaleY(1);
    }
    70% {
        transform: scaleY(1.18);
    }
    100% {
        transform: scaleY(1.08);
    }
}

@keyframes nvInlineBurning {
    0%, 100% {
        filter: brightness(1) saturate(1.2);
        text-shadow: inherit;
    }
    40% {
        filter: brightness(1.12) saturate(1.38);
        text-shadow: 0 0 3px rgba(255, 190, 92, 0.95), 0 -1px 8px rgba(255, 98, 0, 0.76), 0 -2px 15px rgba(255, 44, 0, 0.45);
    }
    70% {
        filter: brightness(0.98) saturate(1.28);
        text-shadow: 0 0 2px rgba(255, 205, 120, 0.85), 0 -1px 6px rgba(255, 140, 0, 0.6), 0 -2px 11px rgba(255, 68, 0, 0.38);
    }
}

@keyframes nvInlineSparkRise {
    0% {
        transform: translate3d(0, 0, 0) scale(0.72);
        opacity: 0;
    }
    18% {
        opacity: 0.95;
    }
    100% {
        transform: translate3d(var(--nv-spark-x-drift, 0px), -1.25em, 0) scale(0.25);
        opacity: 0;
    }
}

@keyframes nvInlineSparkGlow {
    0%,
    100% {
        filter: brightness(0.92) saturate(1);
    }
    50% {
        filter: brightness(1.35) saturate(1.14);
    }
}

.nv-inline-burning {
    position: relative;
    display: inline-block;
    overflow: visible;
}

.nv-inline-burning-text {
    position: relative;
    z-index: 2;
}

.nv-inline-burning-sparks {
    position: absolute;
    left: 0;
    right: 0;
    top: -0.05em;
    bottom: 0;
    pointer-events: none;
    overflow: visible;
    z-index: 1;
}

.nv-inline-spark {
    position: absolute;
    bottom: 0.1em;
    width: 0.24em;
    height: 0.24em;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(255, 246, 178, 0.95) 0%, rgba(255, 204, 86, 0.9) 50%, rgba(255, 146, 0, 0) 74%);
    box-shadow: 0 0 7px rgba(255, 208, 95, 0.65);
    opacity: 0;
    animation:
        nvInlineSparkRise var(--nv-spark-duration, 1.2s) linear infinite,
        nvInlineSparkGlow 1.1s ease-in-out infinite;
    animation-delay: var(--nv-spark-delay, 0ms);
    will-change: transform, opacity;
}
`;

const mergeTextShadows = (...shadows: Array<string | undefined>): string | undefined => {
    const resolvedShadows = shadows.filter((shadow): shadow is string => Boolean(shadow));
    return resolvedShadows.length > 0 ? resolvedShadows.join(', ') : undefined;
};

const ensureInlineStyleSheet = (): void => {
    if (typeof document === 'undefined') {
        return;
    }

    if (document.getElementById(INLINE_STYLE_SHEET_ID)) {
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = INLINE_STYLE_SHEET_ID;
    styleElement.textContent = INLINE_STYLE_PRESET_CSS;
    document.head.appendChild(styleElement);
};

export const defaultInlineClassStyles: Record<string, InlineClassStyle> = {
    // horizontal shearing or color channel offsets or other effects to randomly manipulate or offset characters
    glitch: ({ baseColor, baseTextShadow }) => ({
        color: baseColor,
        animation: 'nvInlineGlitch 1.35s steps(2, end) infinite',
        textShadow: mergeTextShadows(
            baseTextShadow,
            '-1px 0 rgba(255, 0, 92, 0.9)',
            '1px 0 rgba(0, 229, 255, 0.9)'
        ),
        filter: 'saturate(1.18) contrast(1.06)'
    }),
    // Add random zalgo diacritics and maybe a bit of a sinister glow effect and slight vibration
    zalgo: ({ baseColor, baseTextShadow }) => ({
        color: baseColor,
        fontWeight: 600,
        letterSpacing: '0.08em',
        animation: 'nvInlineZalgo 1.7s steps(3, end) infinite',
        textShadow: mergeTextShadows(
            baseTextShadow,
            '0 -1px 0 rgba(255, 255, 255, 0.35)',
            '0 0 8px currentColor',
            '0 0 14px rgba(145, 255, 210, 0.28)'
        ),
        filter: 'brightness(0.96) saturate(0.82)'
    }),
    // Give text a bold, impactful style with a strong outline (maybe an overshot scaled shadow or other effect to make it feel like it's popping off the page) and maybe a slight shake or pulse.
    shout: ({ baseColor }) => ({
        color: baseColor,
        fontWeight: 900,
        fontSize: '1.1em',
        textTransform: 'uppercase',
        filter: 'brightness(1.14) saturate(1.16)',
        textShadow: '0 0 2px currentColor, 0 3px 0 rgba(0, 0, 0, 0.4), 0 0 14px currentColor, 0 0 22px rgba(255, 255, 255, 0.2)',
        WebkitTextStroke: '0.6px rgba(0, 0, 0, 0.45)'
    }),
    // Make text appear to flutter or wobble horizontally, possibly with a subtle color shift or shadow effect, for flustered or embarrassed dialogue
    flutter: ({ baseColor, baseTextShadow }) => ({
        color: baseColor,
        fontStyle: 'italic',
        animation: 'nvInlineFlutter 1.8s ease-in-out infinite',
        textShadow: mergeTextShadows(
            baseTextShadow,
            '0 0 5px rgba(255, 255, 255, 0.24)'
        )
    }),
    // Text drifts downward slightly, or elongates vertically, maybe with a subtle blur or shadow effect, to evoke a sense of sadness, exhaustion, or resignation
    sigh: ({ baseColor, baseTextShadow }) => ({
        color: baseColor,
        fontStyle: 'italic',
        opacity: 0.78,
        animation: 'nvInlineSigh 2.4s ease-out 1 both',
        textShadow: mergeTextShadows(
            baseTextShadow,
            '0 1px 2px rgba(0, 0, 0, 0.22)'
        ),
        filter: 'saturate(0.88)'
    }),
    // Characters appear to smolder or burn, with a flickering effect and maybe some ember-like particles or a smoky shadow, for intense or destructive emotions
    burning: ({ baseColor, baseTextShadow }) => ({
        color: baseColor,
        fontWeight: 700,
        animation: 'nvInlineBurning 1.45s steps(3, end) infinite',
        textShadow: mergeTextShadows(
            baseTextShadow,
            '0 0 3px rgba(255, 190, 92, 0.95)',
            '0 -1px 8px rgba(255, 98, 0, 0.76)',
            '0 -2px 15px rgba(255, 44, 0, 0.45)'
        ),
        filter: 'saturate(1.32) contrast(1.04)'
    }),
    // Make text appear shiny or reflective, possibly with a pulsing effect
    shiny: ({ baseColor }) => ({
        color: baseColor,
        fontWeight: 700,
        animation: 'nvInlineShinyPulse 5.2s ease-in-out infinite',
        textShadow: '0 0 4px currentColor, 0 0 11px rgba(255, 255, 255, 0.58)',
        filter: 'saturate(1.15)'
    }),
    spooky: ({ baseColor, baseTextShadow }) => ({
        color: baseColor,
        letterSpacing: '0.06em',
        fontStyle: 'italic',
        animation: 'nvInlineSpookyWave 2.4s ease-in-out infinite',
        textShadow: baseTextShadow
            ? `${baseTextShadow}, 0 0 8px currentColor`
            : '0 0 8px currentColor'
    }),
    quake: ({ baseColor, baseTextShadow }) => ({
        color: baseColor,
        animation: 'nvInlineQuake 95ms steps(2, end) infinite',
        textShadow: baseTextShadow
            ? `${baseTextShadow}, 0 0 2px currentColor`
            : '0 0 2px currentColor'
    }),
    whisper: ({ baseColor, baseTextShadow, baseFontFamily }) => ({
        color: baseColor,
        fontFamily: baseFontFamily,
        letterSpacing: '0.05em',
        fontSize: '0.92em',
        opacity: 0.85,
        textShadow: baseTextShadow
    })
};

const CLASS_TAG_PATTERN = /\[([a-zA-Z0-9_-]*)\]/g;

export const resolveEndingInlineClass = (
    sourceText: string,
    initialActiveClass: string | null = null
): string | null => {
    let activeClass = initialActiveClass;
    let match: RegExpExecArray | null;
    const tagPattern = new RegExp(CLASS_TAG_PATTERN.source, 'g');

    while ((match = tagPattern.exec(sourceText)) !== null) {
        const [, tagName] = match;
        activeClass = tagName === '' ? null : tagName;
    }

    return activeClass;
};

const resolveClassStyles = (options?: FormatInlineStylesOptions): Record<string, InlineClassStyle> => {
    if (options?.includeDefaultClassStyles === false) {
        return { ...(options.classStyles ?? {}) };
    }

    return {
        ...defaultInlineClassStyles,
        ...(options?.classStyles ?? {})
    };
};

const getResolvedClassStyle = (
    classStyle: InlineClassStyle | undefined,
    styleContext: InlineStyleContext
): React.CSSProperties | undefined => {
    if (!classStyle) return undefined;
    if (typeof classStyle === 'function') {
        return classStyle(styleContext);
    }
    return classStyle;
};

const ZALGO_ABOVE_DIACRITICS = [
    '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', '\u0307', '\u0308', '\u0309',
    '\u030A', '\u030B', '\u030C', '\u030D', '\u030E', '\u030F', '\u0310', '\u0311', '\u0312', '\u0313',
    '\u0314', '\u033D', '\u0342', '\u0346'
];
const ZALGO_BELOW_DIACRITICS = [
    '\u0316', '\u0317', '\u0318', '\u0319', '\u031A', '\u031B', '\u031C', '\u031D', '\u031E', '\u031F',
    '\u0320', '\u0321', '\u0322', '\u0323', '\u0324', '\u0325', '\u0326', '\u0327', '\u0328', '\u0329',
    '\u032A', '\u032B', '\u032C', '\u032D', '\u032E', '\u032F', '\u0330', '\u0331', '\u0332', '\u0333'
];
const PER_CHARACTER_INLINE_CLASSES = new Set(['glitch', 'flutter', 'sigh', 'zalgo']);
const MARKDOWN_INLINE_PATTERN = /(\*\*[^*]+\*\*|\*(?!\*)[^*]+\*|_[^_]+_|~~[^~]+~~|__[^_]+__|~[^~]+~|#{1,6} [^\n]+)/;
const BURNING_SPARK_HORIZONTAL_OFFSETS = [8, 22, 36, 51, 68, 84];
const BURNING_SPARK_X_DRIFTS = [-2.5, 1.5, -1, 2.2, -1.8, 1.2];

const getBurningSparkStyle = (sparkIndex: number): React.CSSProperties => {
    const durationMs = 980 + ((sparkIndex * 170) % 420);
    const delayMs = -((sparkIndex * 230) % 1100);
    const cssVars = {
        '--nv-spark-duration': `${durationMs}ms`,
        '--nv-spark-delay': `${delayMs}ms`,
        '--nv-spark-x-drift': `${BURNING_SPARK_X_DRIFTS[sparkIndex % BURNING_SPARK_X_DRIFTS.length]}px`
    } as React.CSSProperties;

    return {
        ...cssVars,
        left: `${BURNING_SPARK_HORIZONTAL_OFFSETS[sparkIndex % BURNING_SPARK_HORIZONTAL_OFFSETS.length]}%`
    };
};

const pickDeterministicMark = (source: string[], seed: number): string => {
    return source[Math.abs(seed) % source.length];
};

const toZalgoCharacter = (character: string, characterIndex: number): string => {
    if (/\s/.test(character)) {
        return character;
    }

    const codePoint = character.codePointAt(0) ?? 0;
    const baseSeed = (codePoint * 131) + (characterIndex * 71);
    const aboveCount = 2 + (Math.abs(baseSeed) % 2);
    const belowCount = 1 + (Math.abs(baseSeed + 17) % 2);

    let transformed = character;
    for (let i = 0; i < aboveCount; i += 1) {
        transformed += pickDeterministicMark(ZALGO_ABOVE_DIACRITICS, baseSeed + (i * 11));
    }
    for (let i = 0; i < belowCount; i += 1) {
        transformed += pickDeterministicMark(ZALGO_BELOW_DIACRITICS, baseSeed + (i * 13) + 29);
    }

    return transformed;
};

const getPerCharacterStyle = (activeClass: string, characterIndex: number): React.CSSProperties => {
    const cssIndex = {'--nv-char-index': `${characterIndex}`} as React.CSSProperties;

    if (activeClass === 'glitch') {
        return {
            ...cssIndex,
            display: 'inline-block',
            transformOrigin: 'center',
            animation: 'nvInlineGlitchChar 1.35s steps(2, end) infinite',
            animationDelay: `-${(characterIndex * 53) % 560}ms`,
            willChange: 'transform, text-shadow'
        };
    }

    if (activeClass === 'flutter') {
        return {
            ...cssIndex,
            display: 'inline-block',
            transformOrigin: 'center',
            animation: 'nvInlineFlutterChar 1.8s ease-in-out infinite',
            animationDelay: `-${characterIndex * 80}ms`,
            willChange: 'transform'
        };
    }

    if (activeClass === 'zalgo') {
        return {
            ...cssIndex,
            display: 'inline-block',
            transformOrigin: 'center',
            animation: 'nvInlineZalgoChar 1.2s steps(2, end) infinite',
            animationDelay: `-${(characterIndex * 67) % 700}ms`,
            willChange: 'transform'
        };
    }

    return {
        ...cssIndex,
        display: 'inline-block',
        transformOrigin: 'center bottom',
        animation: 'nvInlineSighChar 620ms cubic-bezier(0.2, 0.8, 0.22, 1) 1 both',
        animationDelay: `${Math.min(characterIndex * 20, 220)}ms`,
        willChange: 'transform'
    };
};

const renderPerCharacterSegment = (
    segmentText: string,
    activeClass: string,
    resolvedStyle: React.CSSProperties,
    segmentKey: string
): React.ReactNode => {
    const characters = Array.from(segmentText);
    return (
        <span key={segmentKey} className={activeClass} style={resolvedStyle}>
            {characters.map((character, characterIndex) => (
                <span
                    key={`${segmentKey}-char-${characterIndex}`}
                    style={getPerCharacterStyle(activeClass, characterIndex)}
                >
                    {activeClass === 'zalgo' ? toZalgoCharacter(character, characterIndex) : character}
                </span>
            ))}
        </span>
    );
};

const renderBurningSegment = (
    segmentText: string,
    resolvedStyle: React.CSSProperties,
    segmentKey: string,
    formatText: (value: string) => React.JSX.Element
): React.ReactNode => {
    if (!/\S/.test(segmentText)) {
        return (
            <span key={segmentKey} className="burning" style={resolvedStyle}>
                {formatText(segmentText)}
            </span>
        );
    }

    const visibleCharacterCount = Array.from(segmentText).filter((character) => !/\s/.test(character)).length;
    const sparkCount = Math.max(3, Math.min(6, Math.ceil(visibleCharacterCount / 3)));

    return (
        <span key={segmentKey} className="burning nv-inline-burning" style={resolvedStyle}>
            <span className="nv-inline-burning-text">{formatText(segmentText)}</span>
            <span className="nv-inline-burning-sparks" aria-hidden>
                {Array.from({ length: sparkCount }).map((_, sparkIndex) => (
                    <span
                        key={`${segmentKey}-spark-${sparkIndex}`}
                        className="nv-inline-spark"
                        style={getBurningSparkStyle(sparkIndex)}
                    />
                ))}
            </span>
        </span>
    );
};

// Helper function to format bold, italic, underlined, strikethrough, subscript, and header texts, following markdown-like syntax.
// Also supports class-style tokens like [spooky]text[] with configurable style maps.
export const formatInlineStyles = (
    text: string,
    options?: FormatInlineStylesOptions,
    initialActiveClass: string | null = null
): React.JSX.Element => {
    if (!text) return <></>;

    ensureInlineStyleSheet();

    const classStyles = resolveClassStyles(options);
    const styleContext = options?.styleContext ?? {};

    const formatItalics = (text: string): React.JSX.Element => {
        
        // Process both * and _ for italics, but avoid ** (bold)
        const italicParts = text.split(/(\*(?!\*)[^*]+\*|_[^_]+_)/g);
        
        return (
            <>
                {italicParts.map((italicPart, italicIndex) => {
                    if ((italicPart.startsWith('*') && italicPart.endsWith('*') && !italicPart.startsWith('**')) ||
                        (italicPart.startsWith('_') && italicPart.endsWith('_'))) {
                        const italicText = italicPart.slice(1, -1); // Remove * or _
                        return <em key={italicIndex}>{italicText}</em>;
                    } else {
                        return italicPart;
                    }
                })}
            </>
        );
    }

    const formatBold = (text: string): React.JSX.Element => {
        const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
        
        return (
            <>
                {boldParts.map((boldPart, boldIndex) => {
                    if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                        const boldText = boldPart.slice(2, -2); // Remove **
                        return (
                            <strong key={boldIndex}>
                                {formatItalics(boldText)}
                            </strong>
                        );
                    } else {
                        return formatItalics(boldPart);
                    }
                })}
            </>
        );
    }

    const formatStrikethrough = (text: string): React.JSX.Element => {
        const strikeParts = text.split(/(~~[^~]+~~)/g);
        
        return (
            <>
                {strikeParts.map((strikePart, strikeIndex) => {
                    if (strikePart.startsWith('~~') && strikePart.endsWith('~~')) {
                        const strikeText = strikePart.slice(2, -2); // Remove ~~
                        return (
                            <s key={strikeIndex}>
                                {formatBold(strikeText)}
                            </s>
                        );
                    } else {
                        return formatBold(strikePart);
                    }
                })}
            </>
        );
    }

    const formatUnderline = (text: string): React.JSX.Element => {
        const underlineParts = text.split(/(__[^_]+__)/g);
        
        return (
            <>
                {underlineParts.map((underlinePart, underlineIndex) => {
                    if (underlinePart.startsWith('__') && underlinePart.endsWith('__')) {
                        const underlineText = underlinePart.slice(2, -2); // Remove __
                        return (
                            <u key={underlineIndex}>
                                {formatStrikethrough(underlineText)}
                            </u>
                        );
                    } else {
                        return formatStrikethrough(underlinePart);
                    }
                })}
            </>
        );
    }

    const formatSubscript = (text: string): React.JSX.Element => {
        const subscriptParts = text.split(/(~[^~]+~)/g);
        
        return (
            <>
                {subscriptParts.map((subPart, subIndex) => {
                    if (subPart.startsWith('~') && subPart.endsWith('~')) {
                        const subText = subPart.slice(1, -1); // Remove ~
                        return (
                            <sub key={subIndex}>
                                {formatUnderline(subText)}
                            </sub>
                        );
                    } else {
                        return formatUnderline(subPart);
                    }
                })}
            </>
        );
    }

    const formatHeaders = (text: string): React.JSX.Element => {
        const headerParts = text.split(/(#{1,6} [^\n]+)/g);
        
        return (
            <>
                {headerParts.map((headerPart, headerIndex) => {
                    if (headerPart.startsWith('#')) {
                        const headerText = headerPart.replace(/^#{1,6} /, ''); // Remove leading #s and space
                        const level = headerPart.match(/^#{1,6}/)?.[0].length || 1;
                        switch (level) {
                            case 1:
                                return <h1 key={headerIndex}>{formatSubscript(headerText)}</h1>;
                            case 2:
                                return <h2 key={headerIndex}>{formatSubscript(headerText)}</h2>;
                            case 3:
                                return <h3 key={headerIndex}>{formatSubscript(headerText)}</h3>;
                            case 4:
                                return <h4 key={headerIndex}>{formatSubscript(headerText)}</h4>;
                            case 5:
                                return <h5 key={headerIndex}>{formatSubscript(headerText)}</h5>;
                            case 6:
                                return <h6 key={headerIndex}>{formatSubscript(headerText)}</h6>;
                            default:
                                return <span key={headerIndex}>{formatSubscript(headerText)}</span>;
                        }
                    } else {
                        return formatSubscript(headerPart);
                    }
                })}
            </>
        );
    }

    const renderSegment = (segmentText: string, activeClass: string | null, segmentKey: string): React.ReactNode | null => {
        if (!segmentText) return null;

        if (activeClass === null) {
            return (
                <React.Fragment key={segmentKey}>
                    {formatHeaders(segmentText)}
                </React.Fragment>
            );
        }

        const resolvedStyle = getResolvedClassStyle(classStyles[activeClass], styleContext);

        if (!resolvedStyle) {
            // Unknown style: ignore token and render text without additional styling.
            return (
                <React.Fragment key={segmentKey}>
                    {formatHeaders(segmentText)}
                </React.Fragment>
            );
        }

        if (PER_CHARACTER_INLINE_CLASSES.has(activeClass) && !MARKDOWN_INLINE_PATTERN.test(segmentText)) {
            return renderPerCharacterSegment(segmentText, activeClass, resolvedStyle, segmentKey);
        }

        if (activeClass === 'burning') {
            return renderBurningSegment(segmentText, resolvedStyle, segmentKey, formatHeaders);
        }

        return (
            <span key={segmentKey} className={activeClass} style={resolvedStyle}>
                {formatHeaders(segmentText)}
            </span>
        );
    };

    const formatTextWithClassTokens = (
        sourceText: string,
        keyPrefix = 'inline',
        startingClass: string | null = null
    ): React.JSX.Element => {
        const nodes: React.ReactNode[] = [];
        let lastIndex = 0;
        let segmentIndex = 0;
        let activeClass: string | null = startingClass;
        let match: RegExpExecArray | null;
        const tagPattern = new RegExp(CLASS_TAG_PATTERN.source, 'g');

        while ((match = tagPattern.exec(sourceText)) !== null) {
            const [fullMatch, tagName] = match;
            const tagStart = match.index;

            // Flush text accumulated since the last tag boundary.
            const pendingText = sourceText.slice(lastIndex, tagStart);
            const node = renderSegment(pendingText, activeClass, `${keyPrefix}-seg-${segmentIndex}`);
            if (node !== null) nodes.push(node);
            segmentIndex += 1;

            if (tagName === '') {
                // [] — close active style, resume unstyled.
                activeClass = null;
            } else {
                // [word] — replace active style (implicit close of previous).
                activeClass = tagName;
            }

            lastIndex = tagStart + fullMatch.length;
        }

        // Flush any remaining text after the last tag.
        const trailingText = sourceText.slice(lastIndex);
        const trailingNode = renderSegment(trailingText, activeClass, `${keyPrefix}-seg-${segmentIndex}`);
        if (trailingNode !== null) nodes.push(trailingNode);

        return <>{nodes}</>;
    };

    return formatTextWithClassTokens(text, 'inline', initialActiveClass);
};

export const formatMessageWithStyles = (
    text: string,
    options: FormatMessageWithStylesOptions
): React.JSX.Element => {
    if (!text) return <></>;

    const normalizedText = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    const dialogueParts = normalizedText.split(/(\"[^\"]*\")/g);
    const brightenedColor = options.speakerThemeColor
        ? lighten(options.speakerThemeColor, 0.5)
        : options.tokens.defaultDialogueColor;

    const dialogueStyle: React.CSSProperties = {
        color: brightenedColor,
        fontFamily: options.speakerThemeFontFamily || options.tokens.fallbackFontFamily,
        textShadow: options.speakerThemeColor
            ? `2px 2px 2px ${darken(options.speakerThemeColor, 0.3)}`
            : options.tokens.defaultDialogueShadow
    };
    const proseStyle: React.CSSProperties = {
        color: options.proseColor,
        fontFamily: options.tokens.fallbackFontFamily,
        textShadow: options.tokens.baseTextShadow
    };

    let activeInlineClass: string | null = null;

    return (
        <>
            {dialogueParts.map((part, index) => {
                const isDialoguePart = part.startsWith('"') && part.endsWith('"');
                const baseStyle = isDialoguePart ? dialogueStyle : proseStyle;
                const formattedPart = formatInlineStyles(
                    part,
                    {
                        ...options.inlineStyleOptions,
                        styleContext: {
                            ...(options.inlineStyleOptions?.styleContext ?? {}),
                            baseColor: baseStyle.color,
                            baseTextShadow: baseStyle.textShadow,
                            baseFontFamily: baseStyle.fontFamily
                        }
                    },
                    activeInlineClass
                );

                activeInlineClass = resolveEndingInlineClass(part, activeInlineClass);

                return (
                    <span key={index} style={baseStyle}>
                        {formattedPart}
                    </span>
                );
            })}
        </>
    );
};