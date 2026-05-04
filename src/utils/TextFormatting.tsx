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
        letter-spacing: 0.03em;
        filter: saturate(1.08) contrast(1);
        text-shadow: inherit;
    }
    20% {
        letter-spacing: 0.06em;
        filter: saturate(1.3) contrast(1.08);
        text-shadow: -1px 0 rgba(255, 0, 92, 0.95), 1px 0 rgba(0, 229, 255, 0.95);
    }
    21% {
        letter-spacing: 0.01em;
        text-shadow: 1px 0 rgba(255, 0, 92, 0.88), -1px 0 rgba(0, 229, 255, 0.88);
    }
    65% {
        filter: saturate(1.15) contrast(1.12);
        text-shadow: -2px 0 rgba(255, 0, 92, 0.7), 2px 0 rgba(0, 229, 255, 0.7);
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

@keyframes nvInlineShout {
    0%, 100% {
        filter: brightness(1) saturate(1);
        text-shadow: inherit;
    }
    48% {
        filter: brightness(1.16) saturate(1.08);
        text-shadow: 0 0 2px currentColor, 0 2px 0 rgba(0, 0, 0, 0.35), 0 0 14px currentColor;
    }
}

@keyframes nvInlineFlutter {
    0%, 100% {
        letter-spacing: 0.01em;
        opacity: 0.95;
        filter: saturate(1);
    }
    35% {
        letter-spacing: 0.07em;
        opacity: 0.86;
        filter: saturate(1.08) hue-rotate(-7deg);
    }
    65% {
        letter-spacing: 0.04em;
        opacity: 0.9;
        filter: saturate(1.02) hue-rotate(6deg);
    }
}

@keyframes nvInlineSigh {
    0%, 100% {
        opacity: 0.78;
        letter-spacing: 0.02em;
        filter: blur(0px) saturate(0.94);
    }
    55% {
        opacity: 0.62;
        letter-spacing: 0.05em;
        filter: blur(0.35px) saturate(0.74);
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
        letterSpacing: '0.03em',
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
        animation: 'nvInlineZalgo 170ms steps(2, end) infinite',
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
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        animation: 'nvInlineShout 1.9s ease-in-out infinite',
        textShadow: '0 0 1px currentColor, 0 2px 0 rgba(0, 0, 0, 0.35), 0 0 14px currentColor',
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
        animation: 'nvInlineSigh 3.4s ease-in-out infinite',
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