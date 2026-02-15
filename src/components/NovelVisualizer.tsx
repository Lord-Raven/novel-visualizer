import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Typography } from '@mui/material';
import { alpha, darken, lighten, useTheme } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, Edit, Check, Clear, Send, Forward, Close, Casino, CardGiftcard } from '@mui/icons-material';
import ActorImage from './ActorImage';
import { BlurredBackground } from './BlurredBackground';
import TypeOut from './TypeOut';
import { formatInlineStyles } from '../utils/TextFormatting';
import type { NovelActor, NovelScript, NovelScriptEntry } from '../types';

interface MessageFormatTokens {
    baseTextShadow: string;
    defaultDialogueColor: string;
    defaultDialogueShadow: string;
    fallbackFontFamily: string;
}

// Helper function to brighten a color for better visibility
const adjustColor = (color: string, amount: number = 0.6): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const newR = Math.min(255, Math.round(r + (255 - r) * amount));
    const newG = Math.min(255, Math.round(g + (255 - g) * amount));
    const newB = Math.min(255, Math.round(b + (255 - b) * amount));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

export interface SubmitButtonConfig {
    label: string;
    icon?: React.ReactElement;
    colorScheme?: 'primary' | 'error';
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

/**
 * Props for the NovelVisualizer component.
 * @template TScript - The script type
 * @template TEntry - The script entry type
 */
export interface NovelVisualizerProps<
    TActor extends NovelActor,
    TScript extends NovelScript,
    TEntry extends NovelScriptEntry
> {
    script: TScript;
    actors: Record<string, TActor>;
    playerActorId: string;
    getBackgroundImageUrl: (script: TScript, index: number) => string;
    isVerticalLayout?: boolean;
    typingSpeed?: number;
    allowTypingSkip?: boolean;
    onSubmitInput?: (inputText: string, script: TScript, index: number) => Promise<void>;
    onUpdateMessage?: (index: number, message: string) => void;
    onReroll?: (index: number) => void;
    inputPlaceholder?: string | ((context: { index: number; entry?: TEntry }) => string);
    /**
     * Function to determine button label, icon, and color scheme based on script state.
     * If not provided, defaults to showing "Continue"/"Send"/"End" based on input and scene state.
     */
    getSubmitButtonConfig?: (script: TScript, index: number, inputText: string) => SubmitButtonConfig;
    renderNameplate?: (params: { actor: TActor | null}) => React.ReactNode;
    renderActorHoverInfo?: (actor: TActor | null) => React.ReactNode;
    /**
     * Determines which actors should be visible at the given script index.
     * @param script - The full script object
     * @param index - The current script entry index
     * @param actors - All available actors
     * @returns Array of actors that should be visible
     */
    getPresentActors: (script: TScript, index: number) => TActor[];
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
    enableGhostSpeakers?: boolean;
    enableAudio?: boolean;
    /**
     * When enabled, speaking characters will squish and stretch slightly while audio plays.
     * Requires enableAudio to be true to have any effect.
     */
    enableTalkingAnimation?: boolean;

}

export function NovelVisualizer<
    TActor extends NovelActor,
    TScript extends NovelScript,
    TEntry extends NovelScriptEntry
>(props: NovelVisualizerProps<TActor, TScript, TEntry>): JSX.Element {
    const theme = useTheme();
    const {
        script,
        actors,
        playerActorId,
        getBackgroundImageUrl,
        isVerticalLayout = false,
        typingSpeed = 20,
        allowTypingSkip = true,
        onSubmitInput,
        onUpdateMessage,
        onReroll,
        inputPlaceholder,
        getSubmitButtonConfig,
        renderNameplate,
        renderActorHoverInfo,
        getActorImageUrl,
        getPresentActors,
        backgroundOptions,
        hideInput = false,
        hideActionButtons = false,
        enableGhostSpeakers = false,
        enableAudio = true,
        enableTalkingAnimation = true
    } = props;
    const [inputText, setInputText] = useState<string>('');
    const [finishTyping, setFinishTyping] = useState<boolean>(false);
    const [messageKey, setMessageKey] = React.useState<number>(0); // Key to force TypeOut reset
    const [hoveredActor, setHoveredActor] = useState<TActor | null>(null);
    const [audioEnabled, setAudioEnabled] = React.useState<boolean>(enableAudio);
    const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);
    const [isAudioPlaying, setIsAudioPlaying] = React.useState<boolean>(false);
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    const [messageBoxTopVh, setMessageBoxTopVh] = useState<number>(isVerticalLayout ? 50 : 60);
    const [loading, setLoading] = useState<boolean>(false);
    const messageBoxRef = useRef<HTMLDivElement>(null);

    const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);
    const [editedMessage, setEditedMessage] = useState<string>('');
    const [originalMessage, setOriginalMessage] = useState<string>('');

    const [localScript, setLocalScript] = useState<TScript>(script);

    const [index, setIndex] = useState<number>(0);
    const prevIndexRef = useRef<number>(index);

    const activeScript = onUpdateMessage ? script : localScript;
    const entries = (activeScript?.script || []) as TEntry[];

    const accentMain = theme.palette.primary.main;
    const accentLight = theme.palette.primary.light;
    const errorMain = theme.palette.error.main;
    const errorLight = theme.palette.error.light;
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

    useEffect(() => {
        setLocalScript(script);
    }, [script]);

    useEffect(() => {
        if (messageBoxRef.current) {
            const rect = messageBoxRef.current.getBoundingClientRect();
            const topVh = (rect.top / window.innerHeight) * 100;
            setMessageBoxTopVh(topVh);
        }
    }, [isVerticalLayout, activeScript]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        setMousePosition({ x, y });
    };

    const actorsAtIndex = useMemo(() => getPresentActors(activeScript, index), [activeScript, index, actors, getPresentActors]);

    const speakerActor = useMemo(() => {
        return entries[index] && entries[index].speakerId ? actors[entries[index].speakerId] : null;
    }, [entries, index, actors]);

    const displayMessage = useMemo(() => {
        const message = entries[index]?.message || '';
        return formatMessage(message, speakerActor, messageTokens);
    }, [entries, index, speakerActor, messageTokens]);

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
            }
            if (audioEnabled && activeScript.script[index]?.speechUrl) {
                const audio = new Audio(activeScript.script[index].speechUrl);
                currentAudioRef.current = audio;
                
                // Set up event listeners for audio state
                audio.addEventListener('play', () => setIsAudioPlaying(true));
                audio.addEventListener('pause', () => setIsAudioPlaying(false));
                audio.addEventListener('ended', () => setIsAudioPlaying(false));
                
                audio.play().catch(err => {
                    console.error('Error playing audio:', err);
                    setIsAudioPlaying(false);
                });
            }
            prevIndexRef.current = index;
        }
        setMessageKey(messageKey + 1);
    }, [index]);

    useEffect(() => {
        if (!mousePosition) {
            setHoveredActor(null);
            return;
        }

        if (mousePosition.y > messageBoxTopVh) {
            setHoveredActor(null);
            return;
        }

        if (actorsAtIndex.length === 0 && !(enableGhostSpeakers && speakerActor)) {
            setHoveredActor(null);
            return;
        }

        const actorPositions = actorsAtIndex.map((actor, i) => ({
            actor,
            xPosition: calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor))
        }));

        // Add ghost speaker to hover detection if present
        if (enableGhostSpeakers && speakerActor && !actorsAtIndex.includes(speakerActor)) {
            const ghostSide = speakerActor.id.charCodeAt(0) % 2 === 0 ? 'left' : 'right';
            actorPositions.push({
                actor: speakerActor,
                xPosition: ghostSide === 'left' ? 10 : 90
            });
        }

        const HOVER_RANGE = 10;
        let closestActor: TActor | null = null;
        let closestDistance = Infinity;

        actorPositions.forEach(({ actor, xPosition }) => {
            const actualXPosition = actor === speakerActor && actorsAtIndex.includes(actor) ? 50 : xPosition;
            const distance = Math.abs(mousePosition.x - actualXPosition);
            if (distance < closestDistance && distance <= HOVER_RANGE) {
                closestDistance = distance;
                closestActor = actor;
            }
        });

        setHoveredActor(closestActor);
    }, [mousePosition, messageBoxTopVh, actorsAtIndex, speakerActor, enableGhostSpeakers]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            if (e.key === 'ArrowLeft' && (!isInputFocused || inputText.trim() === '')) {
                e.preventDefault();
                prev();
            } else if (e.key === 'ArrowRight' && (!isInputFocused || inputText.trim() === '')) {
                e.preventDefault();
                next();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inputText, index, entries.length, finishTyping, loading]);

    const next = () => {
        if (isEditingMessage) {
            handleConfirmEdit();
        }
        if (finishTyping) {
            setIndex(Math.min(entries.length - 1, index + 1));
        } else if (allowTypingSkip) {
            setFinishTyping(true);
        }
    };

    const prev = () => {
        if (isEditingMessage) {
            handleConfirmEdit();
        }
        setIndex(Math.max(0, index - 1));
    };

    const handleEnterEditMode = () => {
        const currentMessage = entries[index]?.message || '';
        setOriginalMessage(currentMessage);
        setEditedMessage(currentMessage);
        setIsEditingMessage(true);
    };

    const handleConfirmEdit = () => {
        const currentMessage = entries[index]?.message || '';
        if (editedMessage === currentMessage) {
            setIsEditingMessage(false);
            setOriginalMessage('');
            return;
        }

        if (onUpdateMessage) {
            onUpdateMessage(index, editedMessage);
        } else {
            const updated = { ...activeScript, script: [...entries] };
            if (updated.script[index]) {
                updated.script[index] = { ...updated.script[index], message: editedMessage };
            }
            setLocalScript(updated);
        }

        setIsEditingMessage(false);
        setOriginalMessage('');
    };

    const handleCancelEdit = () => {
        setEditedMessage(originalMessage);
        setIsEditingMessage(false);
        setOriginalMessage('');
    };

    const sceneEnded = Boolean(entries[index]?.endScene);

    const progressLabel = `${entries.length === 0 ? 0 : index + 1} / ${entries.length}`;

    const placeholderText = useMemo(() => {
        if (typeof inputPlaceholder === 'function') {
            return inputPlaceholder({ index, entry: entries[index] });
        }
        if (inputPlaceholder) return inputPlaceholder;
        if (sceneEnded) return 'Scene concluded';
        if (loading) return 'Loading...';
        return 'Type your next action...';
    }, [inputPlaceholder, index, entries, sceneEnded, loading]);

    const renderNameplateNode = () => {
        if (renderNameplate)
            return renderNameplate({ actor: speakerActor });
        return (
            <Typography
                sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.light,
                    fontSize: isVerticalLayout ? '0.85rem' : '1rem',
                    textShadow: baseTextShadow
                }}
            >
                {speakerActor ? speakerActor.name : 'Narrator'}
            </Typography>
        );
    };

    const renderActors = () => {
        const actorElements = actorsAtIndex.map((actor, i) => {
            const xPosition = calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor));
            const isSpeaking = actor === speakerActor;
            const isHovered = actor === hoveredActor;
            const imageUrl = getActorImageUrl(actor, activeScript, index);
            const yPosition = isVerticalLayout ? 20 : 0;
            const zIndex = 50 - Math.abs(xPosition - 50);

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
                    heightMultiplier={isVerticalLayout ? (isSpeaking ? 0.9 : 0.7) : 1.0}
                    speaker={isSpeaking}
                    highlightColor={isHovered ? 'rgba(255,255,255,1)' : 'rgba(225,225,225,1)'}
                    isAudioPlaying={isSpeaking && isAudioPlaying && enableTalkingAnimation}
                />
            );
        });

        // Check if we should render a ghost speaker
        if (enableGhostSpeakers && speakerActor && !actorsAtIndex.includes(speakerActor)) {
            const yPosition = isVerticalLayout ? 20 : 0;
            const isHovered = speakerActor === hoveredActor;
            // Alternate sides based on actor ID for consistency
            const ghostSide = speakerActor.id.charCodeAt(0) % 2 === 0 ? 'left' : 'right';
            
            actorElements.push(
                <ActorImage
                    key={`ghost-${speakerActor.id}`}
                    id={`ghost-${speakerActor.id}`}
                    resolveImageUrl={() => {
                        return getActorImageUrl(speakerActor, activeScript, index);
                    }}
                    xPosition={ghostSide === 'left' ? 10 : 90}
                    yPosition={yPosition}
                    zIndex={45}
                    heightMultiplier={isVerticalLayout ? 0.65 : 0.85}
                    speaker={true}
                    highlightColor={isHovered ? 'rgba(255,255,255,1)' : 'rgba(200,200,200,0.9)'}
                    isGhost={true}
                    ghostSide={ghostSide}
                    isAudioPlaying={isAudioPlaying && enableTalkingAnimation}
                />
            );
        }

        return actorElements;
    };

    const handleSubmit = () => {
        if (isEditingMessage) {
            handleConfirmEdit();
        }

        if (!inputText.trim() && index < entries.length - 1) {
            next();
            return;
        }

        // If onSubmitInput exists, call it and then set loading to false when the promise completes
        if (inputText.trim()) {
            // Slice skit to current index + 1 to remove any future entries, then add player's input as a new entry:
            activeScript.script = activeScript.script.slice(0, index + 1);
            activeScript.script.push({
                speakerId: playerActorId,
                message: inputText,
                speechUrl: '',
            });
            setIndex(index + 1); // Move to this input.
        }
        if (onSubmitInput) {
            setLoading(true);
            onSubmitInput?.(inputText, activeScript, index).then(() => {
                setLoading(false);
            }).catch(() => {
                setLoading(false);
            });
            setIndex(Math.min(entries.length - 1, index + 1)); // Move to next entry after submission
        }
        setInputText('');
    };


    const hoverInfoNode = renderActorHoverInfo ? renderActorHoverInfo(hoveredActor) : null;

    const backgroundImageUrl = useMemo(
        () => getBackgroundImageUrl(activeScript, index),
        [getBackgroundImageUrl, activeScript, index]
    );

    
    const namesMatch = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

    const findBestNameMatch = (speakerName: string, actors: Record<string, TActor>): TActor | null => {
        const normalized = speakerName.trim().toLowerCase();
        if (!normalized) return null;

        const exact = Object.values(actors).find(actor => namesMatch(actor.name, normalized));
        if (exact) return exact;

        const loose = Object.values(actors).find(actor => actor.name.toLowerCase().includes(normalized));
        return loose || null;
    };

    const formatMessage = (
        text: string,
        speakerActor: TActor | null | undefined,
        tokens: MessageFormatTokens
    ): JSX.Element => {
        if (!text) return <></>;

        text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

        const dialogueParts = text.split(/(\"[^\"]*\")/g);

        return (
            <>
                {dialogueParts.map((part, index) => {
                    if (part.startsWith('"') && part.endsWith('"')) {
                        const brightenedColor = speakerActor?.themeColor
                            ? adjustColor(speakerActor.themeColor, 0.6)
                            : tokens.defaultDialogueColor;

                        const dialogueStyle: React.CSSProperties = {
                            color: brightenedColor,
                            fontFamily: speakerActor?.themeFontFamily || tokens.fallbackFontFamily,
                            textShadow: speakerActor?.themeColor
                                ? `2px 2px 2px ${adjustColor(speakerActor.themeColor, -0.25)}`
                                : tokens.defaultDialogueShadow
                        };
                        return (
                            <span key={index} style={dialogueStyle}>
                                {formatInlineStyles(part)}
                            </span>
                        );
                    }
                    return (
                        <span key={index} style={{ textShadow: tokens.baseTextShadow }}>
                            {formatInlineStyles(part)}
                        </span>
                    );
                })}
            </>
        );
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
                style={{ position: 'relative', width: '100vw', height: '100vh' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setMousePosition(null)}
            >
                <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                    {renderActors()}
                </div>

                {hoverInfoNode && (
                    <div
                        style={{
                            position: 'absolute',
                            top: isVerticalLayout ? '2%' : '5%',
                            right: isVerticalLayout ? '2%' : '5%',
                            width: isVerticalLayout ? '35vw' : '15vw',
                            height: '30vh',
                            zIndex: 3
                        }}
                    >
                        {hoverInfoNode}
                    </div>
                )}

                <Paper
                    ref={messageBoxRef}
                    elevation={8}
                    sx={{
                        position: 'absolute',
                        left: isVerticalLayout ? '2%' : '5%',
                        right: isVerticalLayout ? '2%' : '5%',
                        bottom: isVerticalLayout ? '1%' : '4%',
                        background: alpha(theme.palette.background.paper, 0.92),
                        border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
                        borderRadius: 3,
                        p: 2,
                        color: theme.palette.text.primary,
                        zIndex: 2,
                        backdropFilter: 'blur(8px)',
                        minHeight: isVerticalLayout ? '20vh' : undefined,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: isVerticalLayout ? 1 : 2 }}>
                        <Box sx={{ display: 'flex', gap: isVerticalLayout ? 0.5 : 1.5, alignItems: 'center', flex: 1 }}>
                            <IconButton
                                onClick={prev}
                                disabled={index === 0 || loading}
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
                                label={loading ? (
                                    <CircularProgress size={isVerticalLayout ? 12 : 16} sx={{ color: theme.palette.primary.light }} />
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: isVerticalLayout ? '2px' : '4px' }}>
                                        {progressLabel}
                                    </span>
                                )}
                                sx={{
                                    minWidth: isVerticalLayout ? 50 : 72,
                                    height: isVerticalLayout ? '24px' : undefined,
                                    fontSize: isVerticalLayout ? '0.7rem' : undefined,
                                    fontWeight: 700,
                                    color: theme.palette.primary.light,
                                    background: alpha(theme.palette.action.hover, 0.5),
                                    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
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
                                disabled={index >= entries.length - 1 || loading}
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

                            {renderNameplateNode()}
                        </Box>

                        {!hideActionButtons && (
                            <Box sx={{ display: 'flex', gap: isVerticalLayout ? 0.5 : 1.5, alignItems: 'center' }}>
                                {!isEditingMessage ? (
                                    <IconButton
                                        onClick={handleEnterEditMode}
                                        disabled={loading}
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

                                {onReroll && (
                                    <IconButton
                                        onClick={() => onReroll(index)}
                                        disabled={loading}
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
                            minHeight: '4rem',
                            cursor: isEditingMessage ? 'text' : 'pointer',
                            borderRadius: 1,
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                                backgroundColor: isEditingMessage ? 'transparent' : theme.palette.action.hover
                            }
                        }}
                        onClick={() => {
                            if (!isEditingMessage && !loading) {
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
                                {entries.length > 0 ? (
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
                                        if (!loading) {
                                            handleSubmit();
                                        }
                                    }
                                }}
                                placeholder={placeholderText}
                                disabled={loading}
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
                                disabled={loading}
                                variant="contained"
                                startIcon={(() => {
                                    if (getSubmitButtonConfig) {
                                        const config = getSubmitButtonConfig(activeScript, index, inputText);
                                        return config.icon;
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
                                    background: (() => {
                                        const colorScheme = getSubmitButtonConfig 
                                            ? getSubmitButtonConfig(activeScript, index, inputText).colorScheme 
                                            : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                        const baseColor = colorScheme === 'error' ? errorMain : accentMain;
                                        return `linear-gradient(90deg, ${lighten(baseColor, 0.12)}, ${darken(baseColor, 0.2)})`;
                                    })(),
                                    color: (() => {
                                        const colorScheme = getSubmitButtonConfig 
                                            ? getSubmitButtonConfig(activeScript, index, inputText).colorScheme 
                                            : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                        const baseColor = colorScheme === 'error' ? errorMain : accentMain;
                                        return theme.palette.getContrastText(baseColor);
                                    })(),
                                    fontWeight: 800,
                                    minWidth: isVerticalLayout ? 76 : 100,
                                    fontSize: isVerticalLayout ? 'clamp(0.6rem, 2vw, 0.875rem)' : undefined,
                                    padding: isVerticalLayout ? '4px 10px' : undefined,
                                    '&:hover': {
                                        background: (() => {
                                            const colorScheme = getSubmitButtonConfig 
                                                ? getSubmitButtonConfig(activeScript, index, inputText).colorScheme 
                                                : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                            const baseColor = colorScheme === 'error' ? errorMain : accentMain;
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
                                        return getSubmitButtonConfig(activeScript, index, inputText).label;
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
