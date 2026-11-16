import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { safeAlpha, safeDarken, safeGetContrastText, safeLighten } from '../utils/safeColor';
import type { SxProps, Theme } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, Edit, Check, Clear, Send, Forward, Close, Casino, Delete, SvgIconComponent, Computer, Warning, Forum, ArrowDropUp, RecordVoiceOver } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import ActorImage from './ActorImage';
import { BlurredBackground } from './BlurredBackground';
import TypeOut from './TypeOut';
import { formatMessageWithStyles } from '../utils/TextFormatting';
import type { FormatInlineStylesOptions, MessageFormatTokens } from '../utils/TextFormatting';
import { useVoiceAudio } from '../utils/useVoiceAudio';
import { triggerHapticFeedback } from '../utils/haptics';
import type { NovelActor, NovelSkit, NovelScriptEntry, NovelScaleOffset, NovelVoiceModulation, NovelActorTheme } from '../types';

export interface SubmitButtonConfig {
    label: string;
    icon?: React.ReactElement;
    colorScheme?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export interface ActionButtonConfig {
    id: string;
    /** Accessible name and tooltip text. */
    label: string;
    content: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}

const calculateActorXPosition = (actorIndex: number, totalActors: number, hasCenteredActor: boolean): number => {
    const leftRange = Math.min(40, Math.ceil((totalActors - 2) / 2) * 20);
    const rightRange = Math.min(40, Math.floor((totalActors - 2) / 2) * 20);
    const leftSide = (actorIndex % 2) === 0;
    const indexOnSide = leftSide ? Math.floor(actorIndex / 2) : Math.floor((actorIndex - 1) / 2);
    const actorsOnSide = leftSide ? Math.ceil(totalActors / 2) : Math.floor(totalActors / 2);
    const range = leftSide ? leftRange : rightRange;
    const increment = actorsOnSide > 1 ? (indexOnSide / (actorsOnSide - 1)) : 0.5;
    const center = leftSide ? (hasCenteredActor ? 22 : 30) : (hasCenteredActor ? 78 : 70);
    const xPosition = totalActors === 1 ? 50 : Math.round(increment * range) + (center - Math.floor(range / 2));

    return xPosition;
};

// Interactive elements (including those rendered over the scene by a consuming
// application) whose clicks should never toggle message box visibility.
const INTERACTIVE_CLICK_SELECTOR = 'button, a, input, textarea, select, [role="button"], [role="link"], [role="menuitem"], [tabindex]';

const applyPopInSideSkew = (
    xPosition: number,
    popInSide: 'left' | 'right' | null
): number => {
    if (!popInSide) {
        return xPosition;
    }

    const MAX_SKEW = 6;

    if (popInSide === 'right') {
        const proximityToRight = Math.max(0, Math.min(1, (xPosition) / 100));
        return Math.round((xPosition - proximityToRight * MAX_SKEW) * 10) / 10;
    }

    const proximityToLeft = Math.max(0, Math.min(1, (100 - xPosition) / 100));
    return Math.round((xPosition + proximityToLeft * MAX_SKEW) * 10) / 10;
};

/**
 * Props for the NovelVisualizer component.
 * @template TScript - The script type
 * @template TEntry - The script entry type
 */
export interface NovelVisualizerProps<
    TActor extends NovelActor,
    TSkit extends NovelSkit,
    TEntry extends NovelScriptEntry
> {
    skit: TSkit | null;
    actors: Record<string, TActor>;
    playerActorId: string;
    getBackgroundImageUrl?: (skit: TSkit, index: number) => string;
    /** Use compact spacing, thinner panel borders, and smaller controls for portrait layouts. */
    isVerticalLayout?: boolean;
    typingSpeed?: number;
    allowTypingSkip?: boolean;
    onSubmitInput?: (inputText: string, skit: TSkit, index: number) => Promise<TSkit>;
    onUpdateMessage?: (index: number, message: string) => void;
    /**
     * Called when the user reassigns a message to a different actor while editing;
     * `speakerId` is undefined when the message is reassigned to the narrator.
     * When omitted, the entry's speakerId is updated on the local script.
     */
    onUpdateSpeaker?: (index: number, speakerId: string | undefined) => void;
    /** Called when the user deletes a message while editing; when omitted, the entry is removed from the local script. */
    onDeleteMessage?: (index: number) => void;
    onSkitChange?: (newSkit: TSkit) => void;
    inputPlaceholder?: string | ((context: { index: number; entry?: TEntry }) => string);
    getSubmitButtonConfig?: (skit: TSkit, index: number, inputText: string) => SubmitButtonConfig;
    renderNameplate?: (actor: TActor | null) => React.ReactNode;
    responsiveOverlay?: (skit: TSkit | null, hoverActor: TActor | null) => React.ReactNode;
    getPresentActors: (skit: TSkit, index: number) => TActor[];
    getActorImageUrl: (actor: TActor, skit: TSkit, index: number) => string;
    getActorImageColorMultiplier?: (actor: TActor, skit: TSkit, index: number) => string;
    getActorScaleOffset?: (actor: TActor, skit: TSkit, index: number) => NovelScaleOffset;
    getActorFilter?: (actor: TActor, skit: TSkit, index: number) => { filter?: 'ghost' | 'aura' | 'hologram'; filterColor?: string };
    getActorVoiceModulation?: (actor: TActor, skit: TSkit, index: number) => NovelVoiceModulation | undefined;
    getActorTheme?: (actor: TActor, skit: TSkit, index: number) => NovelActorTheme;
    backgroundElements?: React.ReactNode | ((context: {
        skit: TSkit;
        index: number;
        presentActors: TActor[];
    }) => React.ReactNode);
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
    /**
     * When enabled, the user cannot modify the script: the edit and reroll buttons are
     * hidden, the input field is removed, and the continue button fills the bottom bar.
     */
    readOnly?: boolean;
    hideActionButtons?: boolean;
    /** Styled custom actions rendered before edit/reroll; hidden when hideActionButtons is true. */
    additionalActionButtons?: readonly ActionButtonConfig[];
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
    /**
     * When enabled, supported devices provide haptic feedback during typing and button presses.
     * Dialogue uses a stronger double pulse than prose; font effects further increase pulse duration.
     */
    enableHaptics?: boolean;
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

export function NovelVisualizer<
    TActor extends NovelActor,
    TSkit extends NovelSkit,
    TEntry extends NovelScriptEntry
>(props: NovelVisualizerProps<TActor, TSkit, TEntry>): JSX.Element {
    const theme = useTheme();
    const {
        skit: skit,
        actors,
        playerActorId,
        getBackgroundImageUrl,
        isVerticalLayout = false,
        typingSpeed = 20,
        allowTypingSkip = true,
        onSubmitInput,
        onUpdateMessage,
        onUpdateSpeaker,
        onDeleteMessage,
        onSkitChange,
        inputPlaceholder,
        getSubmitButtonConfig,
        renderNameplate,
        responsiveOverlay,
        getActorImageUrl,
        getActorImageColorMultiplier,
        getActorFilter,
        getActorScaleOffset,
        getActorVoiceModulation,
        getActorTheme,
        getPresentActors,
        backgroundElements,
        backgroundOptions,
        loading: externalLoading = false,
        setTooltip,
        hideInput = false,
        readOnly = false,
        hideActionButtons = false,
        additionalActionButtons,
        enablePopInSpeakers = false,
        enableAudio = true,
        enableTalkingAnimation = true,
        enableHaptics = false,
        enableReroll = true,
        narratorLabel = '',
        enableFontEffects: enableFontEffects = true,
        inlineStyleOptions,
        messageWindowSx
    } = props;

    const [inputText, setInputText] = useState<string>('');
    const [finishTyping, setFinishTyping] = useState<boolean>(false);
    const [messageKey, setMessageKey] = React.useState<number>(0); // Key to force TypeOut reset
    const [hoveredActor, setHoveredActor] = useState<TActor | null>(null);
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    const [messageBoxTopVh, setMessageBoxTopVh] = useState<number>(isVerticalLayout ? 50 : 60);
    const [isMessageBoxHidden, setIsMessageBoxHidden] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const isLoading = loading || externalLoading;
    const messageBoxRef = useRef<HTMLDivElement>(null);

    const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);
    const [editedMessage, setEditedMessage] = useState<string>('');
    const [originalMessage, setOriginalMessage] = useState<string>('');
    const [isDeletingMessage, setIsDeletingMessage] = useState<boolean>(false);
    // Pending speaker reassignment while editing; null means the narrator.
    const [editedSpeakerId, setEditedSpeakerId] = useState<string | null>(null);
    const [isSpeakerMenuOpen, setIsSpeakerMenuOpen] = useState<boolean>(false);

    const [isChatLogOpen, setIsChatLogOpen] = useState<boolean>(false);
    const chatLogContainerRef = useRef<HTMLDivElement>(null);
    const currentLogEntryRef = useRef<HTMLDivElement>(null);

    const handleButtonPress = (action: () => void) => () => {
        if (enableHaptics) {
            triggerHapticFeedback(8);
        }
        action();
    };

    const [localSkit, setLocalSkit] = useState<TSkit | null>(skit);
    const scriptEntries = useMemo(() => localSkit?.script ?? [], [localSkit]);

    const [index, setIndex] = useState<number>(skit?.currentIndex ?? -1);
    const prevIndexRef = useRef<number>(index);
    const prevTypingIndexRef = useRef<number>(index);
    const prevExternalLoadingRef = useRef<boolean>(externalLoading);

    const accentMain = theme.palette.primary.main;
    const accentLight = theme.palette.primary.light;
    const errorMain = theme.palette.error.main;
    const errorLight = theme.palette.error.light;

    const getColorFromScheme = (colorScheme: string): string => {
        const schemeMap: Record<string, string> = {
            'primary': theme.palette.primary.main,
            'secondary': theme.palette.secondary.main,
            'error': theme.palette.error.main,
            'warning': theme.palette.warning.main,
            'info': theme.palette.info.main,
            'success': theme.palette.success.main,
        };
        return schemeMap[colorScheme] || theme.palette.primary.main;
    };
    const baseTextShadow = useMemo(
        () => `2px 2px 2px ${safeAlpha(theme.palette.common.black, 0.8)}`,
        [theme]
    );
    const messageTokens = useMemo(
        () => ({
            baseTextShadow,
            defaultDialogueColor: theme.palette.info.light,
            defaultDialogueShadow: `2px 2px 2px ${safeAlpha(theme.palette.info.dark, 0.5)}`,
            fallbackFontFamily: theme.typography.fontFamily as string
        }),
        [baseTextShadow, theme]
    );

    const setCurrentIndex = (currentIndex: number) => {
        if (localSkit) {
            setLocalSkit({ ...localSkit, currentIndex: currentIndex });
        }
        setIndex(currentIndex);
    }


    const formatMessage = (
        text: string,
        speakerActor: TActor | null | undefined,
        actorTheme: NovelActorTheme | null | undefined,
        tokens: MessageFormatTokens
    ): JSX.Element => {
        return formatMessageWithStyles(text, {
            speakerThemeColor: actorTheme?.color,
            speakerThemeFontFamily: actorTheme?.fontFamily,
            proseColor: theme.palette.text.primary,
            tokens,
            enableFontEffects,
            inlineStyleOptions
        });
    };


    useEffect(() => {
        if (skit != localSkit) {
            setLocalSkit(skit);
        }
    }, [skit, externalLoading]);

    useEffect(() => {
        // Update skit properties to match localSkit:
        if (skit && localSkit) {
            skit.currentIndex = localSkit?.currentIndex ?? skit.currentIndex;
            skit.script = localSkit?.script ?? skit.script;
            if (onSkitChange) {
                onSkitChange(skit);
            }
        }
    }, [localSkit, onSkitChange]);

    useEffect(() => {
        const el = messageBoxRef.current;
        if (!el) return;

        const measure = () => {
            const rect = el.getBoundingClientRect();
            const topVh = (rect.top / window.innerHeight) * 100;
            setMessageBoxTopVh(topVh);
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [isVerticalLayout, localSkit]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        setMousePosition({ x, y });
    };

    const actorsAtIndex = useMemo(() => {
        if (!localSkit || !Array.isArray(localSkit.script)) {
            return [];
        }

        return getPresentActors(localSkit, index);
    }, [localSkit, index, actors, getPresentActors]);

    const focusActor = useMemo(() => {
        // start at index and work back to last speaker Id that is in actors:
        for (let i = Math.min(index, scriptEntries.length - 1); i >= 0; i--) {
            const speakerId = scriptEntries[i].speakerId;
            if (speakerId && actors[speakerId] && playerActorId !== speakerId) {
                return actors[speakerId];
            }
        }
        return null;
    }, [scriptEntries, index, actors]);

    const speakerActor = useMemo(() => {
        return index >= 0 && index < scriptEntries.length && scriptEntries[index].speakerId ? actors[scriptEntries[index].speakerId] : null;
    }, [scriptEntries, index, actors]);

    const currentSpeechUrl = useMemo(() => {
        return index >= 0 && index < scriptEntries.length ? scriptEntries[index].speechUrl : undefined;
    }, [scriptEntries, index]);

    const { isAudioPlaying, audioAnalyser } = useVoiceAudio(
        enableAudio,
        currentSpeechUrl,
        index,
        speakerActor && localSkit ? getActorVoiceModulation?.(speakerActor, localSkit, index) : undefined
    );

    const popInSpeakerSide = useMemo<'left' | 'right' | null>(() => {
        if (!enablePopInSpeakers || !speakerActor || actorsAtIndex.includes(speakerActor) || speakerActor.id === playerActorId) {
            return null;
        }
        return speakerActor.id.charCodeAt(0) % 2 === 0 ? 'left' : 'right';
    }, [enablePopInSpeakers, speakerActor, actorsAtIndex]);

    // The focus actor stays centered after they stop speaking, so the others stay spread out too.
    const hasCenteredActor = useMemo(() => {
        return Boolean(speakerActor) || (focusActor ? actorsAtIndex.includes(focusActor) : false);
    }, [speakerActor, focusActor, actorsAtIndex]);

    const actorTheme = useMemo(() => {
        return speakerActor && localSkit && getActorTheme ? getActorTheme(speakerActor, localSkit, index) : undefined;
    }, [speakerActor, localSkit, index, getActorTheme]);

    const displayMessage = useMemo(() => {
        const message = index >= 0 && index < scriptEntries.length ? scriptEntries[index].message ?? '' : '';
        return formatMessage(message, speakerActor, actorTheme, messageTokens);
    }, [scriptEntries, index, speakerActor, messageTokens, isEditingMessage, actorTheme]);

    useLayoutEffect(() => {
        if (prevTypingIndexRef.current !== index) {
            // Clear skip state synchronously so a newly mounted TypeOut does not
            // see stale finishTyping=true for one layout pass.
            setFinishTyping(false);
            setMessageKey((prev) => prev + 1);
            prevTypingIndexRef.current = index;
        }
    }, [index]);

    useEffect(() => {
        if (prevIndexRef.current !== index) {
            if (isEditingMessage) {
                setIsEditingMessage(false);
                setIsDeletingMessage(false);
                setIsSpeakerMenuOpen(false);
                setOriginalMessage('');
            }
            prevIndexRef.current = index;
        }
    }, [index, isEditingMessage]);

    useEffect(() => {
        if (prevExternalLoadingRef.current !== externalLoading) {
            prevIndexRef.current = -1;
            setCurrentIndex(Math.min(Math.max(0, index), scriptEntries.length - 1)); // Ensure index is in bounds after script changes
            prevExternalLoadingRef.current = externalLoading;
        }
    }, [externalLoading, scriptEntries.length]);

    useEffect(() => {
        if (!mousePosition) {
            setHoveredActor(null);
            return;
        }

        if (mousePosition.y > messageBoxTopVh) {
            setHoveredActor(null);
            return;
        }

        if (actorsAtIndex.length === 0 && !(enablePopInSpeakers && speakerActor)) {
            setHoveredActor(null);
            return;
        }

        const actorPositions = actorsAtIndex.map((actor, i) => {
            const baseXPosition = actor === focusActor ? 50 : calculateActorXPosition(i, actorsAtIndex.length, hasCenteredActor);
            return {
                actor,
                xPosition: applyPopInSideSkew(baseXPosition, popInSpeakerSide)
            };
        });

        // Add pop-in speaker to hover detection if present
        if (popInSpeakerSide && speakerActor) {
            actorPositions.push({
                actor: speakerActor,
                xPosition: popInSpeakerSide === 'left' ? 10 : 90
            });
        }

        const HOVER_RANGE = 10;
        let closestActor: TActor | null = null;
        let closestDistance = Infinity;

        actorPositions.forEach(({ actor, xPosition }) => {
            const actualXPosition = (actor === speakerActor || actor === focusActor) && actorsAtIndex.includes(actor) ? 50 : xPosition;
            const distance = Math.abs(mousePosition.x - actualXPosition);
            if (distance < closestDistance && distance <= HOVER_RANGE) {
                closestDistance = distance;
                closestActor = actor;
            }
        });

        setHoveredActor(closestActor);
    }, [mousePosition, messageBoxTopVh, actorsAtIndex, speakerActor, enablePopInSpeakers, focusActor, popInSpeakerSide, hasCenteredActor]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            if (e.key === 'Escape' && isSpeakerMenuOpen) {
                e.preventDefault();
                setIsSpeakerMenuOpen(false);
            } else if (e.key === 'Escape' && isChatLogOpen) {
                e.preventDefault();
                setIsChatLogOpen(false);
            } else if (e.key === 'Escape' && isDeletingMessage) {
                // The edit field is disabled while a deletion is pending, so handle Escape here.
                e.preventDefault();
                setIsDeletingMessage(false);
            } else if (e.key === 'ArrowLeft' && !isEditingMessage && !isInputFocused && inputText.trim() === '') {
                e.preventDefault();
                prev();
            } else if (e.key === 'ArrowRight' && !isEditingMessage && !isInputFocused && inputText.trim() === '') {
                e.preventDefault();
                next();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inputText, index, localSkit, finishTyping, isLoading, isEditingMessage, isDeletingMessage, isChatLogOpen, isSpeakerMenuOpen]);

    // Center the current message in view whenever the chat log opens.
    // Scroll only the chat log container itself; scrollIntoView would also
    // scroll scrollable ancestors (e.g. the scene when an actor image trails
    // off the bottom of it), permanently shifting the whole scene upward.
    useLayoutEffect(() => {
        if (!isChatLogOpen) return;
        const container = chatLogContainerRef.current;
        const entry = currentLogEntryRef.current;
        if (!container || !entry) return;
        const containerRect = container.getBoundingClientRect();
        const entryRect = entry.getBoundingClientRect();
        container.scrollTop += (entryRect.top - containerRect.top) - (container.clientHeight - entryRect.height) / 2;
    }, [isChatLogOpen]);

    const next = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) return;
        if (isEditingMessage) {
            // Navigation never confirms a pending deletion; it only saves text edits.
            if (isDeletingMessage) {
                handleCancelEdit();
            } else {
                handleConfirmEdit();
            }
        }
        if (finishTyping) {
            setCurrentIndex(Math.min(scriptEntries.length - 1, index + 1));
        } else if (allowTypingSkip) {
            setFinishTyping(true);
        }
    };

    const prev = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) return;
        if (isEditingMessage) {
            if (isDeletingMessage) {
                handleCancelEdit();
            } else {
                handleConfirmEdit();
            }
        }
        setCurrentIndex(Math.max(0, index - 1));
    };

    const handleSceneClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        // Ignore clicks within the message box or on interactive elements
        // (e.g. buttons rendered over the scene by a consuming application).
        if (messageBoxRef.current?.contains(target)) return;
        const interactive = target.closest(INTERACTIVE_CLICK_SELECTOR);
        if (interactive && e.currentTarget.contains(interactive)) return;

        if (!isMessageBoxHidden) {
            if (isEditingMessage) return;
            setIsMessageBoxHidden(true);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = rect.width > 0 ? ((e.clientX - rect.left) / rect.width) * 100 : 50;

        if (xPercent <= 15) {
            if (!isLoading && index > 0 && localSkit && Array.isArray(localSkit.script)) {
                if (enableHaptics) {
                    triggerHapticFeedback(8);
                }
                setCurrentIndex(Math.max(0, index - 1));
            }
        } else if (xPercent >= 85) {
            if (!isLoading && index < scriptEntries.length - 1 && localSkit && Array.isArray(localSkit.script)) {
                if (enableHaptics) {
                    triggerHapticFeedback(8);
                }
                setCurrentIndex(Math.min(scriptEntries.length - 1, index + 1));
            }
        } else {
            setIsMessageBoxHidden(false);
        }
    };

    const handleEnterEditMode = () => {
        if (readOnly) return;
        if (!localSkit || !Array.isArray(localSkit.script)) return;
        const currentMessage = index >= 0 && index < scriptEntries.length ? scriptEntries[index]?.message ?? '' : '';
        const currentSpeakerId = index >= 0 && index < scriptEntries.length ? scriptEntries[index]?.speakerId : undefined;
        setOriginalMessage(currentMessage);
        setEditedMessage(currentMessage);
        setEditedSpeakerId(currentSpeakerId || null);
        setIsSpeakerMenuOpen(false);
        setIsDeletingMessage(false);
        setIsEditingMessage(true);
    };

    const handleToggleDeleteMessage = () => {
        setIsDeletingMessage((pending) => !pending);
    };

    const handleConfirmEdit = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) return;

        if (isDeletingMessage) {
            // Confirmed deletion: remove the current message without touching the entries that follow.
            const newIndex = Math.max(0, Math.min(index, scriptEntries.length - 2));
            if (onDeleteMessage) {
                onDeleteMessage(index);
                setCurrentIndex(newIndex);
            } else {
                const updatedScript = localSkit.script.filter((_, i) => i !== index);
                setLocalSkit({ ...localSkit, script: updatedScript, currentIndex: newIndex });
                setIndex(newIndex);
            }
            // Retype the entry that now occupies this index.
            setFinishTyping(false);
            setMessageKey((prev) => prev + 1);
            setIsEditingMessage(false);
            setIsDeletingMessage(false);
            setIsSpeakerMenuOpen(false);
            setOriginalMessage('');
            return;
        }

        const currentMessage = index >= 0 && index < scriptEntries.length ? scriptEntries[index]?.message ?? '' : '';
        const currentSpeakerId = index >= 0 && index < scriptEntries.length ? scriptEntries[index]?.speakerId : undefined;
        const newSpeakerId = editedSpeakerId ?? undefined;
        const messageChanged = editedMessage !== currentMessage;
        const speakerChanged = newSpeakerId !== (currentSpeakerId || undefined);
        if (!messageChanged && !speakerChanged) {
            setIsEditingMessage(false);
            setIsSpeakerMenuOpen(false);
            setOriginalMessage('');
            return;
        }

        if (messageChanged && onUpdateMessage) {
            onUpdateMessage(index, editedMessage);
        }
        if (speakerChanged && onUpdateSpeaker) {
            onUpdateSpeaker(index, newSpeakerId);
        }

        // Apply whichever changes have no external handler to the local script.
        const applyLocalMessage = messageChanged && !onUpdateMessage;
        const applyLocalSpeaker = speakerChanged && !onUpdateSpeaker;
        if (applyLocalMessage || applyLocalSpeaker) {
            const updated = { ...localSkit };
            if (index >= 0 && index < updated.script.length && updated.script[index]) {
                const entry = { ...updated.script[index] };
                if (applyLocalMessage) {
                    entry.message = editedMessage;
                }
                if (applyLocalSpeaker) {
                    entry.speakerId = newSpeakerId;
                }
                updated.script[index] = entry;
            }
            setLocalSkit(updated);
        }

        setIsEditingMessage(false);
        setIsSpeakerMenuOpen(false);
        setOriginalMessage('');
    };

    const handleCancelEdit = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) return;
        setEditedMessage(originalMessage);
        setIsEditingMessage(false);
        setIsDeletingMessage(false);
        setIsSpeakerMenuOpen(false);
        setOriginalMessage('');
    };

    const handleToggleChatLog = () => {
        setIsChatLogOpen((prevOpen) => !prevOpen);
    };

    const handleChatLogEntryClick = (entryIndex: number) => {
        if (enableHaptics) {
            triggerHapticFeedback(8);
        }
        setCurrentIndex(entryIndex);
        setIsChatLogOpen(false);
    };

    const sceneEnded = Boolean(index >= 0 && index < scriptEntries.length && scriptEntries[index]?.endScene);

    const progressLabel = `${scriptEntries.length === 0 ? 0 : index + 1} / ${scriptEntries.length}`;

    const placeholderText = useMemo(() => {
        if (!localSkit || !Array.isArray(localSkit.script)) return 'Type your next action...';
        if (typeof inputPlaceholder === 'function') {
            return inputPlaceholder({ index, entry: index >= 0 && index < scriptEntries.length ? scriptEntries[index] as TEntry : undefined });
        }
        if (inputPlaceholder) return inputPlaceholder;
        if (sceneEnded) return 'End scene or type to continue...';
        if (isLoading) return 'Loading...';
        return 'Type your next action...';
    }, [inputPlaceholder, index, localSkit, scriptEntries, sceneEnded, isLoading]);

    const editedSpeakerActor = useMemo(() => {
        return editedSpeakerId ? actors[editedSpeakerId] ?? null : null;
    }, [editedSpeakerId, actors]);

    const renderNameplateFor = (actor: TActor | null) => {
        if (renderNameplate)
            return renderNameplate(actor);
        return (
            <Typography
                sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.light,
                    fontSize: isVerticalLayout ? '0.85rem' : '1rem',
                    textShadow: baseTextShadow
                }}
            >
                {actor ? actor.name : narratorLabel}
            </Typography>
        );
    };

    // Narrator normally has a blank nameplate; show a dimmed placeholder in the
    // speaker picker so the option is still visible and clickable.
    const renderSpeakerOptionContent = (actor: TActor | null) => {
        if (actor || renderNameplate || narratorLabel) {
            return renderNameplateFor(actor);
        }
        return (
            <Typography
                sx={{
                    fontWeight: 700,
                    fontStyle: 'italic',
                    color: theme.palette.text.secondary,
                    fontSize: isVerticalLayout ? '0.85rem' : '1rem'
                }}
            >
                (Narrator)
            </Typography>
        );
    };

    const handleSelectSpeaker = (speakerId: string | null) => {
        if (enableHaptics) {
            triggerHapticFeedback(8);
        }
        setEditedSpeakerId(speakerId);
        setIsSpeakerMenuOpen(false);
    };

    const renderNameplateNode = () => {
        if (!isEditingMessage) {
            return renderNameplateFor(speakerActor);
        }

        const speakerOptions: (TActor | null)[] = [null, ...Object.values(actors)];

        return (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                <Box
                    role="button"
                    aria-haspopup="listbox"
                    aria-expanded={isSpeakerMenuOpen}
                    aria-label="Change message speaker"
                    tabIndex={isDeletingMessage ? -1 : 0}
                    onClick={() => {
                        if (isDeletingMessage) return;
                        if (enableHaptics) {
                            triggerHapticFeedback(8);
                        }
                        setIsSpeakerMenuOpen((open) => !open);
                    }}
                    onKeyDown={(e) => {
                        if (isDeletingMessage) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsSpeakerMenuOpen((open) => !open);
                        }
                    }}
                    onMouseEnter={() => setTooltip?.('Reassign this message to another actor', RecordVoiceOver)}
                    onMouseLeave={() => setTooltip?.(null)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.25,
                        px: isVerticalLayout ? 0.5 : 0.75,
                        borderRadius: 1,
                        border: `1px dashed ${safeAlpha(accentMain, 0.5)}`,
                        cursor: isDeletingMessage ? 'default' : 'pointer',
                        opacity: isDeletingMessage ? 0.5 : 1,
                        transition: 'background-color 0.2s ease, border-color 0.2s ease',
                        '&:hover': isDeletingMessage ? undefined : {
                            borderColor: safeAlpha(accentMain, 0.8),
                            backgroundColor: theme.palette.action.hover
                        }
                    }}
                >
                    {renderSpeakerOptionContent(editedSpeakerActor)}
                    <ArrowDropUp sx={{ color: accentMain, fontSize: isVerticalLayout ? '16px' : '20px' }} />
                </Box>
                {isSpeakerMenuOpen && !isDeletingMessage && (
                    <>
                        {/* Click-away layer; sits inside the message box so scene clicks stay ignored. */}
                        <Box
                            onClick={() => setIsSpeakerMenuOpen(false)}
                            sx={{ position: 'fixed', inset: 0, zIndex: 11 }}
                        />
                        <Paper
                            role="listbox"
                            aria-label="Message speaker"
                            elevation={8}
                            sx={{
                                position: 'absolute',
                                bottom: '100%',
                                left: 0,
                                mb: 0.5,
                                zIndex: 12,
                                minWidth: isVerticalLayout ? '120px' : '160px',
                                maxHeight: '40vh',
                                overflowY: 'auto',
                                background: safeAlpha(theme.palette.background.paper, 0.95),
                                border: `1px solid ${safeAlpha(theme.palette.divider, 0.3)}`,
                                borderRadius: isVerticalLayout ? 1 : 1.5,
                                backdropFilter: 'blur(8px)',
                                p: 0.5,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.25
                            }}
                        >
                            {speakerOptions.map((actor) => {
                                const optionId = actor?.id ?? null;
                                const isSelected = optionId === editedSpeakerId;
                                return (
                                    <Box
                                        key={optionId ?? '__narrator__'}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelectSpeaker(optionId)}
                                        sx={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            minHeight: isVerticalLayout ? '22px' : '28px',
                                            px: isVerticalLayout ? 0.5 : 1,
                                            py: 0.25,
                                            borderRadius: 1,
                                            border: `1px solid ${isSelected ? safeAlpha(accentMain, 0.6) : 'transparent'}`,
                                            backgroundColor: isSelected ? safeAlpha(accentMain, 0.15) : 'transparent',
                                            transition: 'background-color 0.2s ease, border-color 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: theme.palette.action.hover
                                            }
                                        }}
                                    >
                                        {renderSpeakerOptionContent(actor)}
                                    </Box>
                                );
                            })}
                        </Paper>
                    </>
                )}
            </Box>
        );
    };

    const renderActors = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) {
            return [];
        }

        const activeScript = localSkit;

        const scalePerActor = isVerticalLayout ? 0.05 : 0.03;
        const sceneActorScale = Math.max(0.7, 1 - Math.max(0, actorsAtIndex.length - 1) * scalePerActor);

        const actorElements = actorsAtIndex.map((actor, i) => {
            const baseXPosition = actor === focusActor ? 50 : calculateActorXPosition(i, actorsAtIndex.length, hasCenteredActor);
            const xPosition = applyPopInSideSkew(baseXPosition, popInSpeakerSide);
            const isSpeaking = actor === speakerActor;
            const isHovered = actor === hoveredActor;
            const yPosition = isVerticalLayout ? 15 : 0;
            const zIndex = 50 - Math.abs(xPosition - 50);
            const baseHighlightColor = getActorImageColorMultiplier ? getActorImageColorMultiplier(actor, activeScript, index) : "#ffffff";
            const filterProps = getActorFilter ? getActorFilter(actor, activeScript, index) : {filter: actor.filter, filterColor: actor.filterColor || '#ffffff'};
            const scaleOffset = getActorScaleOffset ? getActorScaleOffset(actor, activeScript, index) : { scale: 1, offsetX: 0, offsetY: 0 };


            return (
                <ActorImage
                    key={actor.id}
                    id={actor.id}
                    resolveImageUrl={() => {
                        return getActorImageUrl(actor, activeScript, index);
                    }}
                    xPosition={xPosition}
                    yPosition={yPosition}
                    zIndex={zIndex}
                    scale={(isSpeaking ? 1 : sceneActorScale) * (scaleOffset?.scale ?? 1)}
                    offsetX={scaleOffset?.offsetX ?? 0}
                    offsetY={scaleOffset?.offsetY ?? 0}
                    speaker={isSpeaking}
                    highlightColor={isHovered ? safeLighten(baseHighlightColor, 0.2) : baseHighlightColor}
                    isAudioPlaying={isSpeaking && isAudioPlaying && enableTalkingAnimation}
                    audioAnalyser={isSpeaking && isAudioPlaying && enableTalkingAnimation ? audioAnalyser : null}
                    filter={filterProps.filter}
                    filterColor={filterProps.filterColor}
                />
            );
        });

        // Check if we should render a pop-in speaker
        if (popInSpeakerSide && speakerActor) {
            const yPosition = isVerticalLayout ? 20 : 0;
            const isHovered = speakerActor === hoveredActor;
            const baseHighlightColor = getActorImageColorMultiplier ? getActorImageColorMultiplier(speakerActor, activeScript, index) : "#ffffff";
            const filterProps = getActorFilter ? getActorFilter(speakerActor, activeScript, index) : {filter: speakerActor.filter, filterColor: speakerActor.filterColor || '#ffffff'};
            const popInScaleOffset = getActorScaleOffset ? getActorScaleOffset(speakerActor, activeScript, index) : { scale: 1, offsetX: 0, offsetY: 0 };
            const popInScale = (isVerticalLayout ? 0.7 : 0.9) * (popInScaleOffset?.scale ?? 1);

            actorElements.push(
                <ActorImage
                    key={`pop-in-${speakerActor.id}`}
                    id={`pop-in-${speakerActor.id}`}
                    resolveImageUrl={() => {
                        return getActorImageUrl(speakerActor, activeScript, index);
                    }}
                    xPosition={popInSpeakerSide === 'left' ? 10 : 90}
                    yPosition={yPosition}
                    zIndex={45}
                    scale={popInScale}
                    offsetX={popInScaleOffset?.offsetX ?? 0}
                    offsetY={popInScaleOffset?.offsetY ?? 0}
                    speaker={true}
                    highlightColor={isHovered ? safeLighten(baseHighlightColor, 0.2) : baseHighlightColor}
                    popInSide={popInSpeakerSide}
                    isAudioPlaying={isAudioPlaying && enableTalkingAnimation}
                    audioAnalyser={isAudioPlaying && enableTalkingAnimation ? audioAnalyser : null}
                    filter={filterProps.filter}
                    filterColor={filterProps.filterColor}
                />
            );
        }

        return actorElements;
    };

    const handleSubmit = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) return;
        if (enableHaptics) {
            triggerHapticFeedback(8);
        }
        if (isEditingMessage) {
            if (isDeletingMessage) {
                handleCancelEdit();
            } else {
                handleConfirmEdit();
            }
        }

        if (!inputText.trim() && index < scriptEntries.length - 1) {
            next();
            return;
        }

        let atIndex = index;
        // If onSubmitInput exists, call it and then set loading to false when the promise completes
        if (inputText.trim()) {
            // Slice skit to current index + 1 to remove any future entries, then add player's input as a new entry:
            localSkit.script = localSkit.script.slice(0, index + 1);
            localSkit.script.push({
                speakerId: playerActorId,
                message: inputText,
                speechUrl: '',
            });
            setLocalSkit({...localSkit}); // Trigger re-render with updated script
            setCurrentIndex(localSkit.script.length - 1); // Move to this input.
            atIndex = localSkit.script.length - 1;
        }
        if (onSubmitInput) {
            setLoading(true);
            const tempScript = {...localSkit}; // Create a temp copy to pass to onSubmitInput
            onSubmitInput(inputText, tempScript, atIndex).then((newScript) => {
                setLoading(false);
                if (newScript) {
                    if (newScript.id !== tempScript.id) {
                        setCurrentIndex(0); // Move to first entry, if this is a new script.
                    } else {
                        setCurrentIndex(Math.min((newScript?.script?.length ?? 0) - 1, atIndex + 1)); // Move to next entry after submission
                    }
                } else {
                    setCurrentIndex(-1); // Set to -1 to indicate end of script if no new script is returned
                }
                setLocalSkit(newScript ? { ...newScript } : null);
            }).catch((error) => {
                console.log('Submission failed', error);
                setLoading(false);
            });
        }
        setInputText('');
    };

    const handleReroll = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) return;
        const rerollIndex = index;
        // Trim script to index before reroll point, then call onSubmitInput with the same input to regenerate from that point
        const tempScript = {...localSkit, script: localSkit.script.slice(0, rerollIndex)};
        console.log('Reroll clicked');
        if (onSubmitInput) {
            setLoading(true);
            console.log('Rerolling');
            onSubmitInput(inputText, tempScript, rerollIndex - 1).then((newScript) => {
                setLoading(false);
                setCurrentIndex(Math.min((newScript?.script?.length ?? 0) - 1, rerollIndex)); // Move to reroll point, which will now have new content
                setLocalSkit(newScript ? { ...newScript } : null);
            }).catch((error) => {
                console.log('Reroll failed', error);
                setLoading(false);
            });
        }
    };

    const responsiveOverlayNode = responsiveOverlay ? responsiveOverlay(localSkit, hoveredActor) : null;

    const backgroundImageUrl = useMemo(
        () => (getBackgroundImageUrl && localSkit) ? getBackgroundImageUrl(localSkit, index) : undefined,
        [getBackgroundImageUrl, localSkit, index]
    );

    const resolvedBackgroundElements = useMemo<React.ReactNode>(() => {
        if (typeof backgroundElements === 'function') {
            if (!localSkit) {
                return null;
            }

            return backgroundElements({
                skit: localSkit,
                index,
                presentActors: actorsAtIndex
            });
        }

        return backgroundElements ?? null;
    }, [backgroundElements, localSkit, index, actorsAtIndex]);

    const responsiveOverlayTop = isVerticalLayout ? 1 : 5;
    const responsiveOverlaySides = isVerticalLayout ? 1 : 5;
    const responsiveOverlayBottomGap = isVerticalLayout ? 0.5 : 2;
    const compactIconButtonSx = isVerticalLayout ? {
        width: '24px',
        height: '24px',
        minWidth: '24px',
        padding: '3px',
        boxSizing: 'border-box',
        flexShrink: 0
    } : {};
    const actionIconButtonSx = {
        color: accentMain,
        border: `1px solid ${safeAlpha(accentMain, 0.25)}`,
        ...compactIconButtonSx,
        opacity: 1,
        transform: 'scale(1)',
        transition: 'all 0.3s ease',
        animation: 'fadeIn 0.3s ease',
        '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'scale(0.8)' },
            to: { opacity: 1, transform: 'scale(1)' }
        },
        '& .MuiSvgIcon-root': { fontSize: isVerticalLayout ? '16px' : '20px' },
        '&:hover': {
            borderColor: safeAlpha(accentMain, 0.4),
            color: accentLight
        },
        '&:disabled': { color: theme.palette.text.disabled }
    };

    return (
        <BlurredBackground
            imageUrl={backgroundImageUrl}
            brightness={backgroundOptions?.brightness}
            contrast={backgroundOptions?.contrast}
            blur={backgroundOptions?.blur}
            scale={backgroundOptions?.scale}
            overlay={backgroundOptions?.overlay}
            transitionDuration={backgroundOptions?.transitionDuration}
        >
            <div
                style={{ position: 'relative', width: '100%', height: '100%' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setMousePosition(null)}
                onClick={handleSceneClick}
            >
                {resolvedBackgroundElements && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                        {resolvedBackgroundElements}
                    </div>
                )}

                <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                    <AnimatePresence>
                        {renderActors()}
                    </AnimatePresence>
                </div>

                {responsiveOverlayNode && (
                    <div
                        style={{
                            position: 'absolute',
                            top: `${responsiveOverlayTop}%`,
                            bottom: `${100 - messageBoxTopVh + responsiveOverlayBottomGap}%`,
                            right: `${responsiveOverlaySides}%`,
                            left: `${responsiveOverlaySides}%`,
                            zIndex: 3,
                            overflow: 'visible'
                        }}
                    >
                        {responsiveOverlayNode}
                    </div>
                )}

                <Paper
                    ref={messageBoxRef}
                    elevation={8}
                    sx={{
                            position: 'absolute',
                            left: `${responsiveOverlaySides}%`,
                            right: `${responsiveOverlaySides}%`,
                            bottom: `${responsiveOverlayBottomGap}%`,
                            background: safeAlpha(theme.palette.background.paper, 0.92),
                            border: `${isVerticalLayout ? 1 : 2}px solid ${safeAlpha(theme.palette.divider, 0.3)}`,
                            borderRadius: isVerticalLayout ? 1.5 : 3,
                            p: isVerticalLayout ? 1 : 2,
                            color: theme.palette.text.primary,
                            zIndex: 4,
                            backdropFilter: 'blur(8px)',
                            minHeight: isVerticalLayout ? '20vh' : undefined,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            overflow: 'visible',
                            transition: 'opacity 0.25s ease, visibility 0.25s ease',

                            ...messageWindowSx,
                            ...(isMessageBoxHidden ? {
                                opacity: 0,
                                visibility: 'hidden',
                                pointerEvents: 'none'
                            } : {})
                        }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', overflow: 'visible' }}>
                        <Box sx={{ display: 'flex', gap: isVerticalLayout ? 0.5 : 1.5, alignItems: 'flex-end', flex: 1, overflow: 'visible' }}>
                            <IconButton
                                onClick={handleButtonPress(prev)}
                                disabled={index === 0 || isLoading}
                                size="small"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    border: `1px solid ${safeAlpha(theme.palette.divider, 0.2)}`,
                                    ...compactIconButtonSx,
                                    '&:disabled': { color: theme.palette.text.disabled }
                                }}
                            >
                                <ChevronLeft fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '14px' : undefined }} />
                            </IconButton>

                            <Chip
                                label={isLoading ? (
                                    <CircularProgress size={isVerticalLayout ? 12 : 16} sx={{ color: theme.palette.primary.light }} 
                                        onMouseEnter={() => {setTooltip?.('Awaiting content from the LLM', Computer)}}
                                        onMouseLeave={() => setTooltip?.(null)}
                                    />
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: isVerticalLayout ? '2px' : '4px' }}>
                                        {index + 1 < scriptEntries.length && inputText.length > 0 && (
                                            <span 
                                                onMouseEnter={() => {setTooltip?.('Sending input will replace subsequent messages', Warning)}}
                                                onMouseLeave={() => setTooltip?.(null)}
                                                style={{ 
                                                    color: theme.palette.warning.main || theme.palette.text.secondary,
                                                }}
                                            >
                                                ⚠
                                            </span>
                                        )}
                                        {progressLabel}
                                    </span>
                                )}
                                onClick={!isLoading ? handleButtonPress(handleToggleChatLog) : undefined}
                                onMouseEnter={!isLoading ? () => {setTooltip?.(isChatLogOpen ? 'Close the chat log' : 'Open the chat log', Forum)} : undefined}
                                onMouseLeave={!isLoading ? () => setTooltip?.(null) : undefined}
                                sx={{
                                    minWidth: isVerticalLayout ? 44 : 72,
                                    height: isVerticalLayout ? '22px' : undefined,
                                    fontSize: isVerticalLayout ? '0.7rem' : undefined,
                                    fontWeight: 700,
                                    color: theme.palette.primary.light,
                                    border: `1px solid ${safeAlpha(theme.palette.divider, 0.2)}`,
                                    transition: 'all 0.3s ease',
                                    cursor: isLoading ? 'default' : 'pointer',
                                    '&:hover': isLoading ? undefined : {
                                        borderColor: safeAlpha(accentMain, 0.4),
                                        backgroundColor: theme.palette.action.hover
                                    },
                                    '& .MuiChip-label': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: isVerticalLayout ? 0.25 : 0.5,
                                        padding: isVerticalLayout ? '0 4px' : undefined
                                    }
                                }}
                            />

                            <IconButton
                                onClick={handleButtonPress(next)}
                                disabled={index >= scriptEntries.length - 1 || isLoading}
                                size="small"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    border: `1px solid ${safeAlpha(theme.palette.divider, 0.2)}`,
                                    ...compactIconButtonSx,
                                    '&:disabled': { color: theme.palette.text.disabled }
                                }}
                            >
                                <ChevronRight fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '14px' : undefined }} />
                            </IconButton>

                            <Box
                                sx={{
                                    height: 0,
                                    overflow: 'visible',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    alignSelf: 'flex-end'
                                }}
                            >
                                {renderNameplateNode()}
                            </Box>
                        </Box>

                        {!hideActionButtons && (
                            <Box sx={{ display: 'flex', gap: isVerticalLayout ? 0.5 : 1.5, alignItems: 'center' }}>
                                {additionalActionButtons?.map((button) => (
                                    <IconButton
                                        key={button.id}
                                        aria-label={button.label}
                                        onClick={handleButtonPress(button.onClick)}
                                        onMouseEnter={() => setTooltip?.(button.label)}
                                        onMouseLeave={() => setTooltip?.(null)}
                                        disabled={isLoading || button.disabled}
                                        size="small"
                                        sx={actionIconButtonSx}
                                    >
                                        {button.content}
                                    </IconButton>
                                ))}
                                {!readOnly && (!isEditingMessage ? (
                                    <IconButton
                                        onClick={handleButtonPress(handleEnterEditMode)}
                                        onMouseEnter={() => {setTooltip?.('Edit message', Edit)}}
                                        onMouseLeave={() => setTooltip?.(null)}
                                        disabled={isLoading}
                                        size="small"
                                        sx={actionIconButtonSx}
                                    >
                                        <Edit fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '16px' : undefined }} />
                                    </IconButton>
                                ) : (
                                    <>
                                        <IconButton
                                            onClick={handleButtonPress(handleConfirmEdit)}
                                            onMouseEnter={() => {setTooltip?.(isDeletingMessage ? 'Confirm deletion' : 'Confirm changes', Check)}}
                                            onMouseLeave={() => setTooltip?.(null)}
                                            size="small"
                                            sx={{
                                                color: accentMain,
                                                border: `1px solid ${safeAlpha(accentMain, 0.25)}`,
                                                ...compactIconButtonSx,
                                                opacity: 1,
                                                transform: 'scale(1)',
                                                transition: 'all 0.3s ease',
                                                animation: 'fadeIn 0.3s ease',
                                                '@keyframes fadeIn': {
                                                    from: { opacity: 0, transform: 'scale(0.8)' },
                                                    to: { opacity: 1, transform: 'scale(1)' }
                                                },
                                                '&:hover': {
                                                    borderColor: safeAlpha(accentMain, 0.4),
                                                    color: accentLight
                                                }
                                            }}
                                        >
                                            <Check fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '16px' : undefined }} />
                                        </IconButton>
                                        <IconButton
                                            onClick={handleButtonPress(handleCancelEdit)}
                                            onMouseEnter={() => {setTooltip?.('Discard changes', Clear)}}
                                            onMouseLeave={() => setTooltip?.(null)}
                                            size="small"
                                            sx={{
                                                color: errorMain,
                                                border: `1px solid ${safeAlpha(errorMain, 0.25)}`,
                                                ...compactIconButtonSx,
                                                opacity: 1,
                                                transform: 'scale(1)',
                                                transition: 'all 0.3s ease',
                                                animation: 'fadeIn 0.3s ease',
                                                '@keyframes fadeIn': {
                                                    from: { opacity: 0, transform: 'scale(0.8)' },
                                                    to: { opacity: 1, transform: 'scale(1)' }
                                                },
                                                '&:hover': {
                                                    borderColor: safeAlpha(errorMain, 0.4),
                                                    color: errorLight
                                                }
                                            }}
                                        >
                                            <Clear fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '16px' : undefined }} />
                                        </IconButton>
                                        <IconButton
                                            onClick={handleButtonPress(handleToggleDeleteMessage)}
                                            onMouseEnter={() => {setTooltip?.(isDeletingMessage ? 'Cancel deletion' : 'Delete this message', Delete)}}
                                            onMouseLeave={() => setTooltip?.(null)}
                                            size="small"
                                            sx={{
                                                color: isDeletingMessage ? errorLight : errorMain,
                                                border: `1px solid ${safeAlpha(errorMain, isDeletingMessage ? 0.6 : 0.25)}`,
                                                backgroundColor: isDeletingMessage ? safeAlpha(errorMain, 0.2) : 'transparent',
                                                ...compactIconButtonSx,
                                                opacity: 1,
                                                transform: 'scale(1)',
                                                transition: 'all 0.3s ease',
                                                animation: 'fadeIn 0.3s ease',
                                                '@keyframes fadeIn': {
                                                    from: { opacity: 0, transform: 'scale(0.8)' },
                                                    to: { opacity: 1, transform: 'scale(1)' }
                                                },
                                                '&:hover': {
                                                    borderColor: safeAlpha(errorMain, 0.4),
                                                    color: errorLight
                                                }
                                            }}
                                        >
                                            <Delete fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '16px' : undefined }} />
                                        </IconButton>
                                    </>
                                ))}

                                {enableReroll && !readOnly && !isEditingMessage && (
                                    <IconButton
                                        onClick={handleButtonPress(handleReroll)}
                                        onMouseEnter={() => {setTooltip?.('Regenerate events from this point', Casino)}}
                                        onMouseLeave={() => setTooltip?.(null)}
                                        disabled={isLoading}
                                        size="small"
                                        sx={{
                                            color: accentMain,
                                            border: `1px solid ${safeAlpha(accentMain, 0.25)}`,
                                            ...compactIconButtonSx,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                borderColor: safeAlpha(accentMain, 0.4),
                                                color: accentLight,
                                                transform: 'rotate(180deg)'
                                            },
                                            '&:disabled': { color: theme.palette.text.disabled }
                                        }}
                                    >
                                        <Casino fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '16px' : undefined }} />
                                    </IconButton>
                                )}
                            </Box>
                        )}
                    </Box>

                    <Box
                        sx={{
                            my: isVerticalLayout ? 0.75 : 2,
                            minHeight: isVerticalLayout ? '3rem' : '4rem',
                            cursor: isEditingMessage ? 'text' : 'pointer',
                            borderRadius: 1,
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                                backgroundColor: isEditingMessage ? 'transparent' : theme.palette.action.hover
                            }
                        }}
                        onClick={() => {
                            if (!isEditingMessage && !isLoading) {
                                if (!finishTyping) {
                                    setFinishTyping(true);
                                } else if (allowTypingSkip) {
                                    next();
                                }
                            }
                        }}
                    >
                        {isEditingMessage ? (
                            <Box sx={{ position: 'relative' }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    value={editedMessage}
                                    onChange={(e) => setEditedMessage(e.target.value)}
                                    autoFocus
                                    disabled={isDeletingMessage}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                            e.preventDefault();
                                            handleConfirmEdit();
                                        } else if (e.key === 'Escape') {
                                            e.preventDefault();
                                            handleCancelEdit();
                                        }
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            fontSize: isVerticalLayout ? 'clamp(0.75rem, 2vw, 1.18rem)' : '1.18rem',
                                            lineHeight: 1.55,
                                            fontFamily: theme.typography.fontFamily,
                                            color: theme.palette.text.primary,
                                            backgroundColor: safeAlpha(theme.palette.action.selected, 0.5),
                                            padding: isVerticalLayout ? '4px' : '8px'
                                        },
                                        '& .MuiInputBase-input': {
                                            padding: 0
                                        }
                                    }}
                                />
                                {isDeletingMessage && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 1,
                                            backgroundColor: safeAlpha(theme.palette.common.black, 0.65),
                                            zIndex: 1,
                                            animation: 'fadeIn 0.2s ease',
                                            '@keyframes fadeIn': {
                                                from: { opacity: 0 },
                                                to: { opacity: 1 }
                                            }
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                letterSpacing: '0.08em',
                                                fontSize: isVerticalLayout ? 'clamp(0.75rem, 2vw, 1.18rem)' : '1.18rem',
                                                fontFamily: theme.typography.fontFamily,
                                                color: errorLight,
                                                textShadow: baseTextShadow
                                            }}
                                        >
                                            Delete Message
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Typography
                                variant="body1"
                                sx={{
                                    fontSize: isVerticalLayout ? 'clamp(0.75rem, 2vw, 1.18rem)' : '1.18rem',
                                    lineHeight: 1.55,
                                    fontFamily: theme.typography.fontFamily,
                                    color: theme.palette.text.primary,
                                    textShadow: baseTextShadow
                                }}
                            >
                                {scriptEntries.length > 0 ? (
                                    <TypeOut
                                        key={`typeout-${messageKey}`}
                                        speed={typingSpeed}
                                        finishTyping={finishTyping}
                                        enableHaptics={enableHaptics}
                                        onTypingComplete={() => setFinishTyping(true)}
                                    >
                                        {displayMessage}
                                    </TypeOut>
                                ) : ''}
                            </Typography>
                        )}
                    </Box>

                    {!hideInput && (
                        <Box sx={{ display: 'flex', gap: isVerticalLayout ? 0.5 : 1.5, alignItems: 'center' }}>
                            {!readOnly && <TextField
                                fullWidth
                                value={inputText}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (!isLoading) {
                                            handleSubmit();
                                        }
                                    }
                                }}
                                placeholder={placeholderText}
                                disabled={isLoading}
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        background: theme.palette.action.hover,
                                        color: theme.palette.text.primary,
                                        fontSize: isVerticalLayout ? '0.75rem' : undefined,
                                        '& fieldset': {
                                            borderColor: theme.palette.divider
                                        },
                                        '&:hover fieldset': {
                                            borderColor: safeAlpha(theme.palette.divider, 0.8)
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: accentMain
                                        },
                                        '&.Mui-disabled': {
                                            color: theme.palette.text.disabled,
                                            '& fieldset': {
                                                borderColor: safeAlpha(theme.palette.divider, 0.5)
                                            }
                                        }
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: isVerticalLayout ? '4px 6px' : undefined
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: safeAlpha(theme.palette.text.primary, 0.55),
                                        opacity: 1,
                                        fontSize: isVerticalLayout ? '0.75rem' : undefined
                                    },
                                    '& .MuiInputBase-input.Mui-disabled::placeholder': {
                                        color: safeAlpha(theme.palette.text.primary, 0.4),
                                        opacity: 1
                                    },
                                    '& .MuiInputBase-input.Mui-disabled': {
                                        color: safeAlpha(theme.palette.text.primary, 0.45),
                                        WebkitTextFillColor: safeAlpha(theme.palette.text.primary, 0.45)
                                    }
                                }}
                            />}
                            <Button
                                fullWidth={readOnly}
                                onClick={handleSubmit}
                                disabled={isLoading}
                                variant="contained"
                                startIcon={(() => {
                                    if (getSubmitButtonConfig && localSkit) {
                                        return getSubmitButtonConfig(localSkit, index, inputText).icon;
                                    }
                                    // Default behavior
                                    if (sceneEnded && !inputText.trim()) {
                                        return <Close fontSize={isVerticalLayout ? 'small' : undefined} />;
                                    }
                                    return inputText.trim() 
                                        ? <Send fontSize={isVerticalLayout ? 'small' : undefined} /> 
                                        : <Forward fontSize={isVerticalLayout ? 'small' : undefined} />;
                                })()}
                                sx={{
                                    height: isVerticalLayout ? '28px' : '40px',
                                    minHeight: isVerticalLayout ? '28px' : '40px',
                                    minWidth: isVerticalLayout ? '48px' : undefined,
                                    background: (() => {
                                        const colorScheme = getSubmitButtonConfig 
                                            ? localSkit ? getSubmitButtonConfig(localSkit, index, inputText).colorScheme : 'primary'
                                            : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                        const baseColor = getColorFromScheme(colorScheme ?? 'primary');
                                        return `linear-gradient(90deg, ${safeLighten(baseColor, 0.12)}, ${safeDarken(baseColor, 0.2)})`;
                                    })(),
                                    color: (() => {
                                        const colorScheme = getSubmitButtonConfig 
                                            ? localSkit ? getSubmitButtonConfig(localSkit, index, inputText).colorScheme : 'primary'
                                            : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                        const baseColor = getColorFromScheme(colorScheme ?? 'primary');
                                        return safeGetContrastText(
                                            theme.palette.getContrastText,
                                            baseColor,
                                            theme.palette.primary.contrastText
                                        );
                                    })(),
                                    fontWeight: 800,
                                    fontSize: isVerticalLayout ? 'clamp(0.6rem, 2vw, 0.875rem)' : undefined,
                                    padding: isVerticalLayout ? '3px 6px' : undefined,
                                    whiteSpace: 'nowrap',
                                    ...(isVerticalLayout && {
                                        '& .MuiButton-startIcon': {
                                            marginLeft: 0,
                                            marginRight: '4px',
                                            '& > :nth-of-type(1)': {
                                                fontSize: '16px'
                                            }
                                        }
                                    }),
                                    '&:hover': {
                                        background: (() => {
                                            const colorScheme = getSubmitButtonConfig 
                                                ? localSkit ? getSubmitButtonConfig(localSkit, index, inputText).colorScheme : 'primary'
                                                : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                            const baseColor = getColorFromScheme(colorScheme ?? 'primary');
                                            return `linear-gradient(90deg, ${safeLighten(baseColor, 0.2)}, ${safeDarken(baseColor, 0.28)})`;
                                        })()
                                    },
                                    '&:disabled': {
                                        background: theme.palette.action.disabledBackground,
                                        color: theme.palette.text.disabled
                                    }
                                }}
                            >
                                {(() => {
                                    if (getSubmitButtonConfig) {
                                        return localSkit ? getSubmitButtonConfig(localSkit, index, inputText).label : 'Continue';
                                    }
                                    // Default behavior
                                    if (sceneEnded && !inputText.trim()) {
                                        return 'End';
                                    }
                                    return inputText.trim() ? 'Send' : 'Continue';
                                })()}
                            </Button>
                        </Box>
                    )}
                </Paper>

                {isChatLogOpen && (
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsChatLogOpen(false);
                        }}
                        sx={{
                            position: 'absolute',
                            top: '2%',
                            inset: 0,
                            zIndex: 5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: safeAlpha(theme.palette.common.black, 0.4)
                        }}
                    >
                        <Paper
                            ref={chatLogContainerRef}
                            elevation={8}
                            role="dialog"
                            aria-label="Chat log"
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                                width: `${100 - responsiveOverlaySides * 2}%`,
                                maxHeight: '85%',
                                overflowY: 'auto',
                                background: safeAlpha(theme.palette.background.paper, 0.85),
                                border: `${isVerticalLayout ? 1 : 2}px solid ${safeAlpha(theme.palette.divider, 0.3)}`,
                                borderRadius: isVerticalLayout ? 1.5 : 3,
                                p: isVerticalLayout ? 1 : 2,
                                color: theme.palette.text.primary,
                                backdropFilter: 'blur(8px)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: isVerticalLayout ? 0.5 : 1
                            }}
                        >
                            {scriptEntries.map((entry, entryIndex) => {
                                const entrySpeaker = entry.speakerId ? actors[entry.speakerId] ?? null : null;
                                const entryTheme = entrySpeaker && localSkit && getActorTheme
                                    ? getActorTheme(entrySpeaker, localSkit, entryIndex)
                                    : undefined;
                                const isCurrentEntry = entryIndex === index;

                                return (
                                    <Box
                                        key={entryIndex}
                                        ref={isCurrentEntry ? currentLogEntryRef : undefined}
                                        onClick={() => handleChatLogEntryClick(entryIndex)}
                                        sx={{
                                            cursor: 'pointer',
                                            borderRadius: 1,
                                            p: isVerticalLayout ? 0.75 : 1.5,
                                            border: `2px solid ${isCurrentEntry ? accentMain : 'transparent'}`,
                                            transition: 'background-color 0.2s ease, border-color 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: theme.palette.action.hover
                                            }
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                color: theme.palette.primary.light,
                                                fontSize: isVerticalLayout ? '0.75rem' : '0.9rem',
                                                textShadow: baseTextShadow
                                            }}
                                        >
                                            {entrySpeaker ? entrySpeaker.name : narratorLabel}
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontSize: isVerticalLayout ? 'clamp(0.7rem, 2vw, 1rem)' : '1rem',
                                                lineHeight: 1.5,
                                                fontFamily: theme.typography.fontFamily,
                                                color: theme.palette.text.primary,
                                                textShadow: baseTextShadow
                                            }}
                                        >
                                            {formatMessage(entry.message ?? '', entrySpeaker, entryTheme, messageTokens)}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Paper>
                    </Box>
                )}
            </div>
        </BlurredBackground>
    );
}

export default NovelVisualizer;
