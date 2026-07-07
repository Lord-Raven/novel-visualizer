import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Typography } from '@mui/material';
import { alpha, darken, lighten, useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, Edit, Check, Clear, Send, Forward, Close, Casino, CardGiftcard, SvgIconComponent, Computer, Warning } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import ActorImage from './ActorImage';
import { BlurredBackground } from './BlurredBackground';
import TypeOut from './TypeOut';
import { formatMessageWithStyles } from '../utils/TextFormatting';
import type { FormatInlineStylesOptions, MessageFormatTokens } from '../utils/TextFormatting';
import type { NovelActor, NovelSkit, NovelScriptEntry } from '../types';

export interface SubmitButtonConfig {
    label: string;
    icon?: React.ReactElement;
    colorScheme?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

const calculateActorXPosition = (actorIndex: number, totalActors: number, anySpeaker: boolean): number => {
    const leftRange = Math.min(40, Math.ceil((totalActors - 2) / 2) * 20);
    const rightRange = Math.min(40, Math.floor((totalActors - 2) / 2) * 20);
    const leftSide = (actorIndex % 2) === 0;
    const indexOnSide = leftSide ? Math.floor(actorIndex / 2) : Math.floor((actorIndex - 1) / 2);
    const actorsOnSide = leftSide ? Math.ceil(totalActors / 2) : Math.floor(totalActors / 2);
    const range = leftSide ? leftRange : rightRange;
    const increment = actorsOnSide > 1 ? (indexOnSide / (actorsOnSide - 1)) : 0.5;
    const center = leftSide ? (anySpeaker ? 25 : 30) : (anySpeaker ? 75 : 70);
    const xPosition = totalActors === 1 ? 50 : Math.round(increment * range) + (center - Math.floor(range / 2));

    return xPosition;
};

const applyPopInSideSkew = (
    xPosition: number,
    popInSide: 'left' | 'right' | null
): number => {
    if (!popInSide) {
        return xPosition;
    }

    const MAX_SKEW = 6;

    if (popInSide === 'right') {
        const proximityToRight = Math.max(0, Math.min(1, (xPosition - 50) / 50));
        return Math.round((xPosition - proximityToRight * MAX_SKEW) * 10) / 10;
    }

    const proximityToLeft = Math.max(0, Math.min(1, (50 - xPosition) / 50));
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
    isVerticalLayout?: boolean;
    typingSpeed?: number;
    allowTypingSkip?: boolean;
    onSubmitInput?: (inputText: string, skit: TSkit, index: number) => Promise<TSkit>;
    onUpdateMessage?: (index: number, message: string) => void;
    onSkitChange?: (newSkit: TSkit) => void;
    inputPlaceholder?: string | ((context: { index: number; entry?: TEntry }) => string);
    getSubmitButtonConfig?: (skit: TSkit, index: number, inputText: string) => SubmitButtonConfig;
    renderNameplate?: (actor: TActor | null) => React.ReactNode;
    responsiveOverlay?: (skit: TSkit | null, hoverActor: TActor | null) => React.ReactNode;
    getPresentActors: (skit: TSkit, index: number) => TActor[];
    getActorImageUrl: (actor: TActor, skit: TSkit, index: number) => string;
    getActorImageColorMultiplier?: (actor: TActor, skit: TSkit, index: number) => string;
    getActorFilter?: (actor: TActor, skit: TSkit, index: number) => { filter?: 'ghost' | 'aura' | 'hologram'; filterColor?: string };
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
    allowFontEffects?: boolean;
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
        onSkitChange,
        inputPlaceholder,
        getSubmitButtonConfig,
        renderNameplate,
        responsiveOverlay,
        getActorImageUrl,
        getActorImageColorMultiplier,
        getActorFilter,
        getPresentActors,
        backgroundElements,
        backgroundOptions,
        loading: externalLoading = false,
        setTooltip,
        hideInput = false,
        hideActionButtons = false,
        enablePopInSpeakers = false,
        enableAudio = true,
        enableTalkingAnimation = true,
        enableReroll = true,
        narratorLabel = '',
        allowFontEffects = true,
        inlineStyleOptions,
        messageWindowSx
    } = props;
    const [inputText, setInputText] = useState<string>('');
    const [finishTyping, setFinishTyping] = useState<boolean>(false);
    const [messageKey, setMessageKey] = React.useState<number>(0); // Key to force TypeOut reset
    const [hoveredActor, setHoveredActor] = useState<TActor | null>(null);
    const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);
    const audioContextRef = React.useRef<AudioContext | null>(null);
    const currentAudioSourceRef = React.useRef<MediaElementAudioSourceNode | null>(null);
    const currentAudioAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const [isAudioPlaying, setIsAudioPlaying] = React.useState<boolean>(false);
    const [audioAnalyser, setAudioAnalyser] = React.useState<AnalyserNode | null>(null);
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    const [messageBoxTopVh, setMessageBoxTopVh] = useState<number>(isVerticalLayout ? 50 : 60);
    const [loading, setLoading] = useState<boolean>(false);
    const isLoading = loading || externalLoading;
    const messageBoxRef = useRef<HTMLDivElement>(null);

    const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);
    const [editedMessage, setEditedMessage] = useState<string>('');
    const [originalMessage, setOriginalMessage] = useState<string>('');

    const [localSkit, setLocalSkit] = useState<TSkit | null>(skit);
    const scriptEntries = useMemo(() => localSkit?.script ?? [], [localSkit]);

    const [index, setIndex] = useState<number>(skit?.currentIndex ?? -1);
    const prevIndexRef = useRef<number>(index);
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
        () => `2px 2px 2px ${alpha(theme.palette.common.black, 0.8)}`,
        [theme]
    );
    const messageTokens = useMemo(
        () => ({
            baseTextShadow,
            defaultDialogueColor: theme.palette.info.light,
            defaultDialogueShadow: `2px 2px 2px ${alpha(theme.palette.info.dark, 0.5)}`,
            fallbackFontFamily: theme.typography.fontFamily as string
        }),
        [baseTextShadow, theme]
    );

    const cleanupCurrentAudioGraph = React.useCallback(() => {
        currentAudioSourceRef.current?.disconnect();
        currentAudioAnalyserRef.current?.disconnect();
        currentAudioSourceRef.current = null;
        currentAudioAnalyserRef.current = null;
        setAudioAnalyser(null);
    }, []);

    const attachAudioAnalyser = React.useCallback((audio: HTMLAudioElement) => {
        if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
            cleanupCurrentAudioGraph();
            return null;
        }

        try {
            const audioContext = audioContextRef.current ?? new window.AudioContext();
            audioContextRef.current = audioContext;

            cleanupCurrentAudioGraph();

            const source = audioContext.createMediaElementSource(audio);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.7;

            source.connect(analyser);
            analyser.connect(audioContext.destination);

            currentAudioSourceRef.current = source;
            currentAudioAnalyserRef.current = analyser;
            setAudioAnalyser(analyser);

            return analyser;
        } catch (error) {
            // Cross-origin audio can block MediaElementAudioSource analysis unless the
            // source server sends permissive CORS headers. Keep playback functional by
            // gracefully disabling analyser-driven animation.
            console.warn('Audio analyser unavailable; continuing without waveform analysis.', error);
            cleanupCurrentAudioGraph();
            return null;
        }
    }, [cleanupCurrentAudioGraph]);

    const setCurrentIndex = (currentIndex: number) => {
        if (localSkit) {
            setLocalSkit({ ...localSkit, currentIndex: currentIndex });
        }
        setIndex(currentIndex);
    }


    const formatMessage = (
        text: string,
        speakerActor: TActor | null | undefined,
        tokens: MessageFormatTokens
    ): JSX.Element => {
        return formatMessageWithStyles(text, {
            speakerThemeColor: speakerActor?.themeColor,
            speakerThemeFontFamily: speakerActor?.themeFontFamily,
            proseColor: theme.palette.text.primary,
            tokens,
            allowFontEffects,
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

    const popInSpeakerSide = useMemo<'left' | 'right' | null>(() => {
        if (!enablePopInSpeakers || !speakerActor || actorsAtIndex.includes(speakerActor)) {
            return null;
        }

        return speakerActor.id.charCodeAt(0) % 2 === 0 ? 'left' : 'right';
    }, [enablePopInSpeakers, speakerActor, actorsAtIndex]);

    const displayMessage = useMemo(() => {
        const message = index >= 0 && index < scriptEntries.length ? scriptEntries[index].message ?? '' : '';
        return formatMessage(message, speakerActor, messageTokens);
    }, [scriptEntries, index, speakerActor, messageTokens, isEditingMessage]);

    useEffect(() => {
        if (prevIndexRef.current !== index) {
            setFinishTyping(false);
            if (isEditingMessage) {
                setIsEditingMessage(false);
                setOriginalMessage('');
            }
            if (currentAudioRef.current) {
                // Stop any currently playing audio
                currentAudioRef.current.pause();
                currentAudioRef.current.currentTime = 0;
                setIsAudioPlaying(false);
                cleanupCurrentAudioGraph();
            }
            if (enableAudio && index >= 0 && index < scriptEntries.length && scriptEntries[index].speechUrl) {
                const audio = new Audio(scriptEntries[index].speechUrl);
                currentAudioRef.current = audio;

                // Required for cross-origin waveform analysis when the remote server
                // allows it via Access-Control-Allow-Origin. If CORS is not permitted,
                // playback will still proceed without analyser data.
                audio.crossOrigin = 'anonymous';

                const analyser = attachAudioAnalyser(audio);

                // Resume the AudioContext now, before play(), so that audio routed
                // through Web Audio is not silently swallowed by a suspended context.
                // The context is created in an async effect (outside a user gesture),
                // so it starts suspended; we must resume it proactively.
                if (audioContextRef.current?.state === 'suspended') {
                    void audioContextRef.current.resume().catch((error) => {
                        console.error('Error resuming audio context:', error);
                    });
                }

                // Set up event listeners for audio state
                const handlePlay = () => setIsAudioPlaying(true);
                const handlePauseOrEnded = () => setIsAudioPlaying(false);
                const handleAudioError = () => setIsAudioPlaying(false);

                // Some browsers surface CORS/analysis restrictions when playback starts.
                // If that happens, detach the graph and continue with plain playback.
                const handleMaybeCorsRestriction = () => {
                    if (analyser || !audioContextRef.current || audioContextRef.current.state !== 'running') {
                        return;
                    }
                    cleanupCurrentAudioGraph();
                };

                audio.addEventListener('play', handlePlay);
                audio.addEventListener('pause', handlePauseOrEnded);
                audio.addEventListener('ended', handlePauseOrEnded);
                audio.addEventListener('error', handleAudioError);
                audio.addEventListener('playing', handleMaybeCorsRestriction);

                audio.play().catch(err => {
                    console.error('Error playing audio:', err);
                    setIsAudioPlaying(false);
                });

                return () => {
                    audio.removeEventListener('play', handlePlay);
                    audio.removeEventListener('pause', handlePauseOrEnded);
                    audio.removeEventListener('ended', handlePauseOrEnded);
                    audio.removeEventListener('error', handleAudioError);
                    audio.removeEventListener('playing', handleMaybeCorsRestriction);
                };
            }
            prevIndexRef.current = index;
        }
        setMessageKey((prev) => prev + 1);
    }, [index, enableAudio, scriptEntries, attachAudioAnalyser, cleanupCurrentAudioGraph]);

    useEffect(() => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
            currentAudioRef.current = null;
            setIsAudioPlaying(false);
        }
        cleanupCurrentAudioGraph();
    }, [enableAudio, cleanupCurrentAudioGraph]);

    useEffect(() => {
        return () => {
            cleanupCurrentAudioGraph();
            if (audioContextRef.current) {
                void audioContextRef.current.close().catch(() => undefined);
                audioContextRef.current = null;
            }
        };
    }, [cleanupCurrentAudioGraph]);

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
            const baseXPosition = actor === focusActor ? 50 : calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor));
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
    }, [mousePosition, messageBoxTopVh, actorsAtIndex, speakerActor, enablePopInSpeakers, focusActor, popInSpeakerSide]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            if (e.key === 'ArrowLeft' && !isEditingMessage && !isInputFocused && inputText.trim() === '') {
                e.preventDefault();
                prev();
            } else if (e.key === 'ArrowRight' && !isEditingMessage && !isInputFocused && inputText.trim() === '') {
                e.preventDefault();
                next();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inputText, index, localSkit, finishTyping, isLoading, isEditingMessage]);

    const next = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) return;
        if (isEditingMessage) {
            handleConfirmEdit();
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
            handleConfirmEdit();
        }
        setCurrentIndex(Math.max(0, index - 1));
    };

    const handleEnterEditMode = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) return;
        const currentMessage = index >= 0 && index < scriptEntries.length ? scriptEntries[index]?.message ?? '' : '';
        setOriginalMessage(currentMessage);
        setEditedMessage(currentMessage);
        setIsEditingMessage(true);
    };

    const handleConfirmEdit = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) return;
        const currentMessage = index >= 0 && index < scriptEntries.length ? scriptEntries[index]?.message ?? '' : '';
        if (editedMessage === currentMessage) {
            setIsEditingMessage(false);
            setOriginalMessage('');
            return;
        }

        if (onUpdateMessage) {
            onUpdateMessage(index, editedMessage);
        } else {
            const updated = { ...localSkit };
            if (index >= 0 && index < updated.script.length && updated.script[index]) {
                updated.script[index] = { ...updated.script[index], message: editedMessage };
            }
            setLocalSkit(updated);
        }

        setIsEditingMessage(false);
        setOriginalMessage('');
    };

    const handleCancelEdit = () => {
        if (!localSkit || !Array.isArray(localSkit.script)) return;
        setEditedMessage(originalMessage);
        setIsEditingMessage(false);
        setOriginalMessage('');
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

    const renderNameplateNode = () => {
        if (renderNameplate)
            return renderNameplate(speakerActor);
        return (
            <Typography
                sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.light,
                    fontSize: isVerticalLayout ? '0.85rem' : '1rem',
                    textShadow: baseTextShadow
                }}
            >
                {speakerActor ? speakerActor.name : narratorLabel}
            </Typography>
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
            const baseXPosition = actor === focusActor ? 50 : calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor));
            const xPosition = applyPopInSideSkew(baseXPosition, popInSpeakerSide);
            const isSpeaking = actor === speakerActor;
            const isHovered = actor === hoveredActor;
            const yPosition = isVerticalLayout ? 15 : 0;
            const zIndex = 50 - Math.abs(xPosition - 50);
            const baseHighlightColor = getActorImageColorMultiplier ? getActorImageColorMultiplier(actor, activeScript, index) : "#ffffff";
            const filterProps = getActorFilter ? getActorFilter(actor, activeScript, index) : {filter: actor.filter, filterColor: actor.filterColor || '#ffffff'};

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
                    heightMultiplier={(isSpeaking ? 1 : sceneActorScale) * (actor.heightMultiplier ?? 1)}
                    speaker={isSpeaking}
                    highlightColor={isHovered ? lighten(baseHighlightColor, 0.2) : baseHighlightColor}
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
                    heightMultiplier={(isVerticalLayout ? 0.7 : 0.9) * (speakerActor.heightMultiplier ?? 1)}
                    speaker={true}
                    highlightColor={isHovered ? lighten(baseHighlightColor, 0.2) : baseHighlightColor}
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
        if (isEditingMessage) {
            handleConfirmEdit();
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

    const responsiveOverlayTop = isVerticalLayout ? 2 : 5;
    const responsiveOverlaySides = isVerticalLayout ? 2 : 5;
    const responsiveOverlayBottomGap = isVerticalLayout ? 1 : 2;

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
                            background: alpha(theme.palette.background.paper, 0.92),
                            border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
                            borderRadius: 3,
                            p: 2,
                            color: theme.palette.text.primary,
                            zIndex: 4,
                            backdropFilter: 'blur(8px)',
                            minHeight: isVerticalLayout ? '20vh' : undefined,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            overflow: 'visible',
                            
                            ...messageWindowSx
                        }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', overflow: 'visible' }}>
                        <Box sx={{ display: 'flex', gap: isVerticalLayout ? 0.5 : 1.5, alignItems: 'flex-end', flex: 1, overflow: 'visible' }}>
                            <IconButton
                                onClick={prev}
                                disabled={index === 0 || isLoading}
                                size="small"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                    padding: isVerticalLayout ? '4px' : undefined,
                                    minWidth: isVerticalLayout ? '28px' : undefined,
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
                                sx={{
                                    minWidth: isVerticalLayout ? 50 : 72,
                                    height: isVerticalLayout ? '24px' : undefined,
                                    fontSize: isVerticalLayout ? '0.7rem' : undefined,
                                    fontWeight: 700,
                                    color: theme.palette.primary.light,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                    transition: 'all 0.3s ease',
                                    '& .MuiChip-label': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: isVerticalLayout ? 0.25 : 0.5,
                                        padding: isVerticalLayout ? '0 6px' : undefined
                                    }
                                }}
                            />

                            <IconButton
                                onClick={next}
                                disabled={index >= scriptEntries.length - 1 || isLoading}
                                size="small"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                    padding: isVerticalLayout ? '4px' : undefined,
                                    minWidth: isVerticalLayout ? '28px' : undefined,
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
                                {!isEditingMessage ? (
                                    <IconButton
                                        onClick={handleEnterEditMode}
                                        onMouseEnter={() => {setTooltip?.('Edit message', Edit)}}
                                        onMouseLeave={() => setTooltip?.(null)}
                                        disabled={isLoading}
                                        size="small"
                                        sx={{
                                            color: accentMain,
                                            border: `1px solid ${alpha(accentMain, 0.25)}`,
                                            padding: isVerticalLayout ? '4px' : undefined,
                                            minWidth: isVerticalLayout ? '28px' : undefined,
                                            opacity: 1,
                                            transform: 'scale(1)',
                                            transition: 'all 0.3s ease',
                                            animation: 'fadeIn 0.3s ease',
                                            '@keyframes fadeIn': {
                                                from: { opacity: 0, transform: 'scale(0.8)' },
                                                to: { opacity: 1, transform: 'scale(1)' }
                                            },
                                            '&:hover': {
                                                borderColor: alpha(accentMain, 0.4),
                                                color: accentLight
                                            },
                                            '&:disabled': { color: theme.palette.text.disabled }
                                        }}
                                    >
                                        <Edit fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '16px' : undefined }} />
                                    </IconButton>
                                ) : (
                                    <>
                                        <IconButton
                                            onClick={handleConfirmEdit}
                                            onMouseEnter={() => {setTooltip?.('Confirm changes', Check)}}
                                            onMouseLeave={() => setTooltip?.(null)}
                                            size="small"
                                            sx={{
                                                color: accentMain,
                                                border: `1px solid ${alpha(accentMain, 0.25)}`,
                                                padding: isVerticalLayout ? '4px' : undefined,
                                                minWidth: isVerticalLayout ? '28px' : undefined,
                                                opacity: 1,
                                                transform: 'scale(1)',
                                                transition: 'all 0.3s ease',
                                                animation: 'fadeIn 0.3s ease',
                                                '@keyframes fadeIn': {
                                                    from: { opacity: 0, transform: 'scale(0.8)' },
                                                    to: { opacity: 1, transform: 'scale(1)' }
                                                },
                                                '&:hover': {
                                                    borderColor: alpha(accentMain, 0.4),
                                                    color: accentLight
                                                }
                                            }}
                                        >
                                            <Check fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '16px' : undefined }} />
                                        </IconButton>
                                        <IconButton
                                            onClick={handleCancelEdit}
                                            onMouseEnter={() => {setTooltip?.('Discard changes', Clear)}}
                                            onMouseLeave={() => setTooltip?.(null)}
                                            size="small"
                                            sx={{
                                                color: errorMain,
                                                border: `1px solid ${alpha(errorMain, 0.25)}`,
                                                padding: isVerticalLayout ? '4px' : undefined,
                                                minWidth: isVerticalLayout ? '28px' : undefined,
                                                opacity: 1,
                                                transform: 'scale(1)',
                                                transition: 'all 0.3s ease',
                                                animation: 'fadeIn 0.3s ease',
                                                '@keyframes fadeIn': {
                                                    from: { opacity: 0, transform: 'scale(0.8)' },
                                                    to: { opacity: 1, transform: 'scale(1)' }
                                                },
                                                '&:hover': {
                                                    borderColor: alpha(errorMain, 0.4),
                                                    color: errorLight
                                                }
                                            }}
                                        >
                                            <Clear fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '16px' : undefined }} />
                                        </IconButton>
                                    </>
                                )}

                                {enableReroll && (
                                    <IconButton
                                        onClick={handleReroll}
                                        onMouseEnter={() => {setTooltip?.('Regenerate events from this point', Casino)}}
                                        onMouseLeave={() => setTooltip?.(null)}
                                        disabled={isLoading}
                                        size="small"
                                        sx={{
                                            color: accentMain,
                                            border: `1px solid ${alpha(accentMain, 0.25)}`,
                                            padding: isVerticalLayout ? '4px' : undefined,
                                            minWidth: isVerticalLayout ? '28px' : undefined,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                borderColor: alpha(accentMain, 0.4),
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
                            my: isVerticalLayout ? 1 : 2,
                            minHeight: '4rem',
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
                            <TextField
                                fullWidth
                                multiline
                                value={editedMessage}
                                onChange={(e) => setEditedMessage(e.target.value)}
                                autoFocus
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
                                        backgroundColor: alpha(theme.palette.action.selected, 0.5),
                                        padding: '8px'
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: 0
                                    }
                                }}
                            />
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
                            <TextField
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
                                            borderColor: alpha(theme.palette.divider, 0.8)
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: accentMain
                                        },
                                        '&.Mui-disabled': {
                                            color: theme.palette.text.disabled,
                                            '& fieldset': {
                                                borderColor: alpha(theme.palette.divider, 0.5)
                                            }
                                        }
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: isVerticalLayout ? '6px 8px' : undefined
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: alpha(theme.palette.text.primary, 0.55),
                                        opacity: 1,
                                        fontSize: isVerticalLayout ? '0.75rem' : undefined
                                    },
                                    '& .MuiInputBase-input.Mui-disabled::placeholder': {
                                        color: alpha(theme.palette.text.primary, 0.4),
                                        opacity: 1
                                    },
                                    '& .MuiInputBase-input.Mui-disabled': {
                                        color: alpha(theme.palette.text.primary, 0.45),
                                        WebkitTextFillColor: alpha(theme.palette.text.primary, 0.45)
                                    }
                                }}
                            />
                            <Button
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
                                    height: '40px',
                                    minHeight: '40px',
                                    background: (() => {
                                        const colorScheme = getSubmitButtonConfig 
                                            ? localSkit ? getSubmitButtonConfig(localSkit, index, inputText).colorScheme : 'primary'
                                            : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                        const baseColor = getColorFromScheme(colorScheme ?? 'primary');
                                        return `linear-gradient(90deg, ${lighten(baseColor, 0.12)}, ${darken(baseColor, 0.2)})`;
                                    })(),
                                    color: (() => {
                                        const colorScheme = getSubmitButtonConfig 
                                            ? localSkit ? getSubmitButtonConfig(localSkit, index, inputText).colorScheme : 'primary'
                                            : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                        const baseColor = getColorFromScheme(colorScheme ?? 'primary');
                                        return theme.palette.getContrastText(baseColor);
                                    })(),
                                    fontWeight: 800,
                                    fontSize: isVerticalLayout ? 'clamp(0.6rem, 2vw, 0.875rem)' : undefined,
                                    padding: isVerticalLayout ? '4px 10px' : undefined,
                                    whiteSpace: 'nowrap',
                                    '&:hover': {
                                        background: (() => {
                                            const colorScheme = getSubmitButtonConfig 
                                                ? localSkit ? getSubmitButtonConfig(localSkit, index, inputText).colorScheme : 'primary'
                                                : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                            const baseColor = getColorFromScheme(colorScheme ?? 'primary');
                                            return `linear-gradient(90deg, ${lighten(baseColor, 0.2)}, ${darken(baseColor, 0.28)})`;
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
            </div>
        </BlurredBackground>
    );
}

export default NovelVisualizer;
