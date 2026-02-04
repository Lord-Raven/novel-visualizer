import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, Edit, Check, Clear, Send, Forward, Close, Casino, CardGiftcard } from '@mui/icons-material';
import ActorImage from './ActorImage';
import { BlurredBackground } from './BlurredBackground';
import TypeOut from './TypeOut';
import { formatInlineStyles } from '../utils/TextFormatting';
import type { NovelActor, NovelScript, NovelScriptEntry } from '../types';

// Base text shadow for non-dialogue text
const baseTextShadow = '2px 2px 2px rgba(0, 0, 0, 0.8)';

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

const formatMessage = (text: string, speakerActor?: NovelActor | null): JSX.Element => {
    if (!text) return <></>;

    text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

    const dialogueParts = text.split(/(\"[^\"]*\")/g);

    return (
        <>
            {dialogueParts.map((part, index) => {
                if (part.startsWith('"') && part.endsWith('"')) {
                    const brightenedColor = speakerActor?.themeColor
                        ? adjustColor(speakerActor.themeColor, 0.6)
                        : '#87CEEB';

                    const dialogueStyle: React.CSSProperties = {
                        color: brightenedColor,
                        fontFamily: speakerActor?.themeFontFamily || undefined,
                        textShadow: speakerActor?.themeColor
                            ? `2px 2px 2px ${adjustColor(speakerActor.themeColor, -0.25)}`
                            : '2px 2px 2px rgba(135, 206, 235, 0.5)'
                    };
                    return (
                        <span key={index} style={dialogueStyle}>
                            {formatInlineStyles(part)}
                        </span>
                    );
                }
                return (
                    <span key={index} style={{ textShadow: baseTextShadow }}>
                        {formatInlineStyles(part)}
                    </span>
                );
            })}
        </>
    );
};

const namesMatch = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

const findBestNameMatch = (speakerName: string, actors: Record<string, NovelActor>): NovelActor | null => {
    const normalized = speakerName.trim().toLowerCase();
    if (!normalized) return null;

    const exact = Object.values(actors).find(actor => namesMatch(actor.name, normalized));
    if (exact) return exact;

    const loose = Object.values(actors).find(actor => actor.name.toLowerCase().includes(normalized));
    return loose || null;
};

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
    backgroundImageUrl: string;
    isVerticalLayout?: boolean;
    loading?: boolean;
    currentIndex?: number;
    typingSpeed?: number;
    allowTypingSkip?: boolean;
    onSubmitInput?: (inputText: string, context: { index: number; entry?: TEntry; wrapUp?: boolean }) => void;
    onUpdateMessage?: (index: number, message: string) => void;
    onReroll?: (index: number) => void;
    onWrapUp?: (index: number) => void;
    onClose?: () => void;
    inputPlaceholder?: string | ((context: { index: number; entry?: TEntry }) => string);
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
    };
    hideInput?: boolean;
    hideActionButtons?: boolean;
}

export function NovelVisualizer<
    TActor extends NovelActor,
    TScript extends NovelScript,
    TEntry extends NovelScriptEntry
>(props: NovelVisualizerProps<TActor, TScript, TEntry>): JSX.Element {
    const {
    script,
    actors,
    backgroundImageUrl,
    isVerticalLayout = false,
    loading = false,
    typingSpeed = 20,
    allowTypingSkip = true,
    onSubmitInput,
    onUpdateMessage,
    onReroll,
    onWrapUp,
    onClose,
    inputPlaceholder,
    renderNameplate,
    renderActorHoverInfo,
    getActorImageUrl,
    getPresentActors,
    resolveSpeaker,
    backgroundOptions,
    hideInput = false,
    hideActionButtons = false
} = props;
    const [inputText, setInputText] = useState<string>('');
    const [finishTyping, setFinishTyping] = useState<boolean>(false);
    const [messageKey, setMessageKey] = useState<number>(0);
    const [hoveredActor, setHoveredActor] = useState<TActor | null>(null);
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    const [messageBoxTopVh, setMessageBoxTopVh] = useState<number>(isVerticalLayout ? 50 : 60);
    const messageBoxRef = useRef<HTMLDivElement>(null);

    const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);
    const [editedMessage, setEditedMessage] = useState<string>('');
    const [originalMessage, setOriginalMessage] = useState<string>('');

    const [localScript, setLocalScript] = useState<TScript>(script);

    const [index, setIndex] = useState<number>(0);
    const prevIndexRef = useRef<number>(index);

    const activeScript = onUpdateMessage ? script : localScript;
    const entries = (activeScript?.script || []) as TEntry[];

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
        if (resolveSpeaker) return resolveSpeaker(script, index);
        return null
    }, [entries, index, actors, resolveSpeaker]);

    const displayMessage = useMemo(() => {
        const message = entries[index]?.message || '';
        return formatMessage(message, speakerActor);
    }, [entries, index, speakerActor]);

    useEffect(() => {
        if (prevIndexRef.current !== index) {
            setFinishTyping(false);
            if (isEditingMessage) {
                setIsEditingMessage(false);
                setOriginalMessage('');
            }
            prevIndexRef.current = index;
        }
        setMessageKey(prev => prev + 1);
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

        if (actorsAtIndex.length === 0) {
            setHoveredActor(null);
            return;
        }

        const actorPositions = actorsAtIndex.map((actor, i) => ({
            actor,
            xPosition: calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor))
        }));

        const HOVER_RANGE = 10;
        let closestActor: NovelActor | null = null;
        let closestDistance = Infinity;

        actorPositions.forEach(({ actor, xPosition }) => {
            const distance = Math.abs(mousePosition.x - (actor === speakerActor ? 50 : xPosition));
            if (distance < closestDistance && distance <= HOVER_RANGE) {
                closestDistance = distance;
                closestActor = actor;
            }
        });

        setHoveredActor(closestActor);
    }, [mousePosition, messageBoxTopVh, actorsAtIndex, speakerActor]);

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
            setIndex(index + 1);
        } else if (allowTypingSkip) {
            setFinishTyping(true);
        }
    };

    const prev = () => {
        if (isEditingMessage) {
            handleConfirmEdit();
        }
        setIndex(index - 1);
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
        if (loading) return 'Processing...';
        return 'Type your next action...';
    }, [inputPlaceholder, index, entries, sceneEnded, loading]);

    const renderNameplateNode = () => {
        if (renderNameplate)
            return renderNameplate({ actor: speakerActor });
        return (
            <Typography
                sx={{
                    fontWeight: 700,
                    color: '#bfffd0',
                    fontSize: isVerticalLayout ? '0.85rem' : '1rem',
                    textShadow: baseTextShadow
                }}
            >
                {speakerActor ? speakerActor.name : 'Narrator'}
            </Typography>
        );
    };

    const renderActors = () => {
        return actorsAtIndex.map((actor, i) => {
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
                    panX={0}
                    panY={0}
                />
            );
        });
    };

    const handleSubmit = (wrapUp: boolean = false) => {
        if (isEditingMessage) {
            handleConfirmEdit();
        }

        if (!inputText.trim() && index < entries.length - 1) {
            next();
            return;
        }

        onSubmitInput?.(inputText, { index, entry: entries[index], wrapUp });
        setInputText('');
    };

    const handleWrapUp = () => {
        if (onWrapUp) {
            onWrapUp(index);
            return;
        }
        handleSubmit(true);
    };

    const hoverInfoNode = renderActorHoverInfo ? renderActorHoverInfo(hoveredActor) : null;

    return (
        <BlurredBackground
            imageUrl={backgroundImageUrl}
            brightness={backgroundOptions?.brightness}
            contrast={backgroundOptions?.contrast}
            blur={backgroundOptions?.blur}
            scale={backgroundOptions?.scale}
            overlay={backgroundOptions?.overlay}
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
                        background: 'rgba(10,20,30,0.95)',
                        border: '2px solid rgba(0,255,136,0.12)',
                        borderRadius: 3,
                        p: 2,
                        color: '#e8fff0',
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
                                    color: '#cfe',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    padding: isVerticalLayout ? '4px' : undefined,
                                    minWidth: isVerticalLayout ? '28px' : undefined,
                                    '&:disabled': { color: 'rgba(255,255,255,0.3)' }
                                }}
                            >
                                <ChevronLeft fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '14px' : undefined }} />
                            </IconButton>

                            <Chip
                                label={loading ? (
                                    <CircularProgress size={isVerticalLayout ? 12 : 16} sx={{ color: '#bfffd0' }} />
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
                                    color: '#bfffd0',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.03)',
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
                                    color: '#cfe',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    padding: isVerticalLayout ? '4px' : undefined,
                                    minWidth: isVerticalLayout ? '28px' : undefined,
                                    '&:disabled': { color: 'rgba(255,255,255,0.3)' }
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
                                            color: '#00ff88',
                                            border: '1px solid rgba(0,255,136,0.2)',
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
                                                borderColor: 'rgba(0,255,136,0.4)',
                                                color: '#00ffaa'
                                            },
                                            '&:disabled': { color: 'rgba(255,255,255,0.3)' }
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
                                                color: '#00ff88',
                                                border: '1px solid rgba(0,255,136,0.2)',
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
                                                    borderColor: 'rgba(0,255,136,0.4)',
                                                    color: '#00ffaa'
                                                }
                                            }}
                                        >
                                            <Check fontSize={isVerticalLayout ? 'inherit' : 'small'} sx={{ fontSize: isVerticalLayout ? '16px' : undefined }} />
                                        </IconButton>
                                        <IconButton
                                            onClick={handleCancelEdit}
                                            size="small"
                                            sx={{
                                                color: '#ff6b6b',
                                                border: '1px solid rgba(255,107,107,0.2)',
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
                                                    borderColor: 'rgba(255,107,107,0.4)',
                                                    color: '#ff5252'
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
                                            color: '#00ff88',
                                            border: '1px solid rgba(0,255,136,0.2)',
                                            padding: isVerticalLayout ? '4px' : undefined,
                                            minWidth: isVerticalLayout ? '28px' : undefined,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                borderColor: 'rgba(0,255,136,0.4)',
                                                color: '#00ffaa',
                                                transform: 'rotate(180deg)'
                                            },
                                            '&:disabled': { color: 'rgba(255,255,255,0.3)' }
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
                                backgroundColor: isEditingMessage ? 'transparent' : 'rgba(255,255,255,0.02)'
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
                                        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                                        color: '#e9fff7',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
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
                                    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                                    color: '#e9fff7',
                                    textShadow: baseTextShadow
                                }}
                            >
                                {entries.length > 0 ? (
                                    <TypeOut
                                        key={messageKey}
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
                                            if (sceneEnded && inputText.trim() === '') {
                                                onClose?.();
                                            } else {
                                                handleSubmit(false);
                                            }
                                        }
                                    }
                                }}
                                placeholder={placeholderText}
                                disabled={loading}
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                                        color: '#eafff2',
                                        fontSize: isVerticalLayout ? '0.75rem' : undefined,
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.08)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.12)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'rgba(0,255,136,0.3)'
                                        },
                                        '&.Mui-disabled': {
                                            color: 'rgba(255,255,255,0.6)',
                                            '& fieldset': {
                                                borderColor: 'rgba(255,255,255,0.04)'
                                            }
                                        }
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: isVerticalLayout ? '6px 8px' : undefined
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: 'rgba(255,255,255,0.5)',
                                        opacity: 1,
                                        fontSize: isVerticalLayout ? '0.75rem' : undefined
                                    },
                                    '& .MuiInputBase-input.Mui-disabled::placeholder': {
                                        color: 'rgba(255,255,255,0.4)',
                                        opacity: 1
                                    },
                                    '& .MuiInputBase-input.Mui-disabled': {
                                        color: 'rgba(255,255,255,0.45)',
                                        WebkitTextFillColor: 'rgba(255,255,255,0.45)'
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    if (sceneEnded && !inputText.trim()) {
                                        onClose?.();
                                    } else {
                                        handleSubmit(false);
                                    }
                                }}
                                disabled={loading}
                                variant="contained"
                                startIcon={sceneEnded && !inputText.trim() ? <Close fontSize={isVerticalLayout ? 'small' : undefined} /> : (inputText.trim() ? <Send fontSize={isVerticalLayout ? 'small' : undefined} /> : <Forward fontSize={isVerticalLayout ? 'small' : undefined} />)}
                                sx={{
                                    background: sceneEnded && !inputText.trim()
                                        ? 'linear-gradient(90deg,#ff8c66,#ff5a3b)'
                                        : 'linear-gradient(90deg,#00ff88,#00b38f)',
                                    color: sceneEnded && !inputText.trim() ? '#fff' : '#00221a',
                                    fontWeight: 800,
                                    minWidth: isVerticalLayout ? 76 : 100,
                                    fontSize: isVerticalLayout ? 'clamp(0.6rem, 2vw, 0.875rem)' : undefined,
                                    padding: isVerticalLayout ? '4px 10px' : undefined,
                                    '&:hover': {
                                        background: sceneEnded && !inputText.trim()
                                            ? 'linear-gradient(90deg,#ff7a52,#ff4621)'
                                            : 'linear-gradient(90deg,#00e67a,#009a7b)'
                                    },
                                    '&:disabled': {
                                        background: 'rgba(255,255,255,0.04)',
                                        color: 'rgba(255,255,255,0.3)'
                                    }
                                }}
                            >
                                {sceneEnded && !inputText.trim() ? 'End' : (inputText.trim() ? 'Send' : 'Continue')}
                            </Button>

                            {onWrapUp && (
                                <IconButton
                                    onClick={handleWrapUp}
                                    disabled={loading}
                                    sx={{
                                        background: 'linear-gradient(90deg,#00ff88,#00b38f)',
                                        color: '#00221a',
                                        padding: isVerticalLayout ? '4px' : '6px',
                                        borderRadius: '4px',
                                        '&:hover': {
                                            background: 'linear-gradient(90deg,#00e67a,#009a7b)'
                                        },
                                        '&:disabled': {
                                            background: 'rgba(255,255,255,0.04)',
                                            color: 'rgba(255,255,255,0.3)'
                                        }
                                    }}
                                >
                                    <CardGiftcard fontSize={isVerticalLayout ? 'small' : 'medium'} />
                                </IconButton>
                            )}
                        </Box>
                    )}
                </Paper>
            </div>
        </BlurredBackground>
    );
}

export default NovelVisualizer;
