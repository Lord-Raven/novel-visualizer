import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Typography } from '@mui/material';
import { alpha, darken, lighten, useTheme } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, Edit, Check, Clear, Send, Forward, Close, Casino, CardGiftcard, SvgIconComponent, Computer, Warning } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
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
    onSubmitInput?: (inputText: string, script: TScript, index: number) => Promise<TScript>;
    onUpdateMessage?: (index: number, message: string) => void;
    inputPlaceholder?: string | ((context: { index: number; entry?: TEntry }) => string);
    getSubmitButtonConfig?: (script: TScript, index: number, inputText: string) => SubmitButtonConfig;
    renderNameplate?: (actor: TActor | null) => React.ReactNode;
    renderActorHoverInfo?: (actor: TActor | null) => React.ReactNode;
    getPresentActors: (script: TScript, index: number) => TActor[];
    getActorImageUrl: (actor: TActor, script: TScript, index: number) => string;
    backgroundElements?: React.ReactNode | ((context: {
        script: TScript;
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
        inputPlaceholder,
        getSubmitButtonConfig,
        renderNameplate,
        renderActorHoverInfo,
        getActorImageUrl,
        getPresentActors,
        backgroundElements,
        backgroundOptions,
        setTooltip,
        hideInput = false,
        hideActionButtons = false,
        enableGhostSpeakers = false,
        enableAudio = true,
        enableTalkingAnimation = true,
        enableReroll = true,
        narratorLabel = ''
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


    const formatMessage = (
        text: string,
        speakerActor: TActor | null | undefined,
        tokens: MessageFormatTokens
    ): JSX.Element => {
        if (!text) return <></>;

        text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

        const dialogueParts = text.split(/(\"[^\"]*\")/g);
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
        const proseStyle: React.CSSProperties = {
            color: theme.palette.text.primary,
            fontFamily: tokens.fallbackFontFamily,
            textShadow: tokens.baseTextShadow
        };

        return (
            <>
                {dialogueParts.map((part, index) => {
                    if (part.startsWith('"') && part.endsWith('"')) {

                        return (
                            <span key={index} style={dialogueStyle}>
                                {formatInlineStyles(part)}
                            </span>
                        );
                    }
                    return (
                        <span key={index} style={proseStyle}>
                            {formatInlineStyles(part)}
                        </span>
                    );
                })}
            </>
        );
    };


    useEffect(() => {
        setLocalScript(script);
    }, [script]);

    useEffect(() => {
        if (messageBoxRef.current) {
            const rect = messageBoxRef.current.getBoundingClientRect();
            const topVh = (rect.top / window.innerHeight) * 100;
            setMessageBoxTopVh(topVh);
        }
    }, [isVerticalLayout, localScript]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        setMousePosition({ x, y });
    };

    const actorsAtIndex = useMemo(() => getPresentActors(localScript, index), [localScript, index, actors, getPresentActors]);

    const speakerActor = useMemo(() => {
        return localScript.script[index] && localScript.script[index].speakerId ? actors[localScript.script[index].speakerId] : null;
    }, [localScript, index, actors]);

    const displayMessage = useMemo(() => {
        const message = localScript.script[index]?.message || '';
        return formatMessage(message, speakerActor, messageTokens);
    }, [localScript, index, speakerActor, messageTokens]);

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
            if (audioEnabled && localScript.script[index]?.speechUrl) {
                const audio = new Audio(localScript.script[index].speechUrl);
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
    }, [inputText, index, localScript, finishTyping, loading, isEditingMessage]);

    const next = () => {
        if (isEditingMessage) {
            handleConfirmEdit();
        }
        if (finishTyping) {
            setIndex(Math.min(localScript.script.length - 1, index + 1));
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
        const currentMessage = localScript.script[index]?.message || '';
        setOriginalMessage(currentMessage);
        setEditedMessage(currentMessage);
        setIsEditingMessage(true);
    };

    const handleConfirmEdit = () => {
        const currentMessage = localScript.script[index]?.message || '';
        if (editedMessage === currentMessage) {
            setIsEditingMessage(false);
            setOriginalMessage('');
            return;
        }

        if (onUpdateMessage) {
            onUpdateMessage(index, editedMessage);
        } else {
            const updated = { ...localScript };
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

    const sceneEnded = Boolean(localScript.script[index]?.endScene);

    const progressLabel = `${localScript.script.length === 0 ? 0 : index + 1} / ${localScript.script.length}`;

    const placeholderText = useMemo(() => {
        if (typeof inputPlaceholder === 'function') {
            return inputPlaceholder({ index, entry: localScript.script[index] as TEntry });
        }
        if (inputPlaceholder) return inputPlaceholder;
        if (sceneEnded) return 'Scene concluded';
        if (loading) return 'Loading...';
        return 'Type your next action...';
    }, [inputPlaceholder, index, localScript, sceneEnded, loading]);

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
        const actorElements = actorsAtIndex.map((actor, i) => {
            const xPosition = calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor));
            const isSpeaking = actor === speakerActor;
            const isHovered = actor === hoveredActor;
            const imageUrl = getActorImageUrl(actor, localScript, index);
            const yPosition = isVerticalLayout ? 20 : 0;
            const zIndex = 50 - Math.abs(xPosition - 50);

            return (
                <ActorImage
                    key={actor.id}
                    id={actor.id}
                    resolveImageUrl={() => {
                        return getActorImageUrl(actor, localScript, index);
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
                        return getActorImageUrl(speakerActor, localScript, index);
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

        if (!inputText.trim() && index < localScript.script.length - 1) {
            next();
            return;
        }

        let atIndex = index;
        // If onSubmitInput exists, call it and then set loading to false when the promise completes
        if (inputText.trim()) {
            // Slice skit to current index + 1 to remove any future entries, then add player's input as a new entry:
            localScript.script = localScript.script.slice(0, index + 1);
            localScript.script.push({
                speakerId: playerActorId,
                message: inputText,
                speechUrl: '',
            });
            setIndex(localScript.script.length - 1); // Move to this input.
            atIndex = localScript.script.length - 1;
        }
        if (onSubmitInput) {
            setLoading(true);
            const tempScript = {...localScript}; // Create a temp copy to pass to onSubmitInput
            onSubmitInput(inputText, tempScript, atIndex).then((newScript) => {
                setLoading(false);
                if (newScript.id !== tempScript.id) {
                    console.log('New script detected.');
                    setIndex(0); // Move to first entry, if this is a new script.
                } else {
                    setIndex(Math.min(newScript.script.length - 1, atIndex + 1)); // Move to next entry after submission
                }
                setLocalScript({...newScript});
            }).catch((error) => {
                console.log('Submission failed', error);
                setLoading(false);
            });
        }
        setInputText('');
    };

    const handleReroll = () => {
        const rerollIndex = index;
        // Trim script to index before reroll point, then call onSubmitInput with the same input to regenerate from that point
        const tempScript = {...localScript, script: localScript.script.slice(0, rerollIndex)};
        console.log('Reroll clicked');
        if (onSubmitInput) {
            setLoading(true);
            console.log('Rerolling');
            onSubmitInput(inputText, tempScript, rerollIndex - 1).then((newScript) => {
                setLoading(false);
                setIndex(Math.min(newScript.script.length - 1, rerollIndex)); // Move to reroll point, which will now have new content
                setLocalScript({...newScript});
            }).catch((error) => {
                console.log('Reroll failed', error);
                setLoading(false);
            });
        }
    };

    const hoverInfoNode = renderActorHoverInfo ? renderActorHoverInfo(hoveredActor) : null;

    const backgroundImageUrl = useMemo(
        () => getBackgroundImageUrl(localScript, index),
        [getBackgroundImageUrl, localScript, index]
    );

    const resolvedBackgroundElements =
        typeof backgroundElements === 'function'
            ? backgroundElements({
                script: localScript,
                index,
                presentActors: actorsAtIndex
            })
            : backgroundElements;

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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                                    <CircularProgress size={isVerticalLayout ? 12 : 16} sx={{ color: theme.palette.primary.light }} 
                                        onMouseEnter={() => {setTooltip?.('Awaiting content from the LLM', Computer)}}
                                        onMouseLeave={() => setTooltip?.(null)}
                                    />
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: isVerticalLayout ? '2px' : '4px' }}>
                                        {index + 1 < localScript.script.length && inputText.length > 0 && (
                                            <span 
                                                onMouseEnter={() => {setTooltip?.('Sending input will replace subsequent messages', Warning)}}
                                                onMouseLeave={() => setTooltip?.(null)}
                                                style={{ 
                                                    color: theme.palette.text.secondary,
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
                                disabled={index >= localScript.script.length - 1 || loading}
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
                                        onMouseEnter={() => {setTooltip?.('Edit message', Edit)}}
                                        onMouseLeave={() => setTooltip?.(null)}
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
                                {localScript.script.length > 0 ? (
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
                                        const config = getSubmitButtonConfig(localScript, index, inputText);
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
                                    height: '40px',
                                    minHeight: '40px',
                                    background: (() => {
                                        const colorScheme = getSubmitButtonConfig 
                                            ? getSubmitButtonConfig(localScript, index, inputText).colorScheme 
                                            : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                        const baseColor = colorScheme === 'error' ? errorMain : accentMain;
                                        return `linear-gradient(90deg, ${lighten(baseColor, 0.12)}, ${darken(baseColor, 0.2)})`;
                                    })(),
                                    color: (() => {
                                        const colorScheme = getSubmitButtonConfig 
                                            ? getSubmitButtonConfig(localScript, index, inputText).colorScheme 
                                            : (sceneEnded && !inputText.trim() ? 'error' : 'primary');
                                        const baseColor = colorScheme === 'error' ? errorMain : accentMain;
                                        return theme.palette.getContrastText(baseColor);
                                    })(),
                                    fontWeight: 800,
                                    fontSize: isVerticalLayout ? 'clamp(0.6rem, 2vw, 0.875rem)' : undefined,
                                    padding: isVerticalLayout ? '4px 10px' : undefined,
                                    whiteSpace: 'nowrap',
                                    '&:hover': {
                                        background: (() => {
                                            const colorScheme = getSubmitButtonConfig 
                                                ? getSubmitButtonConfig(localScript, index, inputText).colorScheme 
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
                                        return getSubmitButtonConfig(localScript, index, inputText).label;
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
