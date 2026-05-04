import {motion, Variants, easeOut, easeIn, AnimatePresence} from "framer-motion";
import {FC, useState, useEffect, useMemo, memo} from "react";

const IDLE_HEIGHT: number = 80;
const SPEAKING_HEIGHT: number = 85;

interface ActorImageProps {
    id: string;
    resolveImageUrl: () => string;
    xPosition: number;
    yPosition: number;
    zIndex: number;
    heightMultiplier: number;
    // 'speaker' indicates whether this actor is currently speaking and should be emphasized
    speaker?: boolean;
    highlightColor: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    // 'popInSide' determines which side of the screen the actor enters from when popping in
    popInSide?: 'none' | 'left' | 'right';
    // 'isAudioPlaying' indicates whether audio is currently playing for this character
    isAudioPlaying?: boolean;
    // Optional visual treatment for special character presentation
    filter?: 'ghost' | 'aura' | 'hologram';
    filterColor?: string;
}

const ActorImage: FC<ActorImageProps> = ({
    id,
    resolveImageUrl,
    xPosition,
    yPosition,
    zIndex,
    heightMultiplier,
    speaker,
    highlightColor,
    onMouseEnter,
    onMouseLeave,
    popInSide = 'none',
    isAudioPlaying = false,
    filter: imageFilter,
    filterColor = '#9ad8ff'
}) => {
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [displayedImageUrl, setDisplayedImageUrl] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('9 / 16');
    const imageUrl = resolveImageUrl();

    // Preload the next image and only swap once it is ready.
    useEffect(() => {
        if (!imageUrl) {
            setIsLoaded(false);
            setDisplayedImageUrl('');
            return;
        }

        if (imageUrl === displayedImageUrl && isLoaded) {
            return;
        }

        let isCancelled = false;
        const img = new Image();
        img.onload = () => {
            if (isCancelled) {
                return;
            }
            if (img.naturalWidth && img.naturalHeight) {
                setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
            }
            setDisplayedImageUrl(imageUrl);
            setIsLoaded(true);
        };
        img.src = imageUrl;

        return () => {
            isCancelled = true;
        };
    }, [displayedImageUrl, imageUrl, isLoaded]);

    // Calculate final parallax position
    const baseX = speaker ? 50 : xPosition;
    const baseY = yPosition;

    const variants: Variants = useMemo(() => {
        if (popInSide !== 'none') {
            // Pop-in mode: tilt in from the side
            const popInX = popInSide === 'left' ? 10 : 90;
            const offscreenX = popInSide === 'left' ? -20 : 120;
            const tiltRotate = popInSide === 'left' ? 15 : -15;
            
            return {
                absent: {
                    opacity: 0,
                    x: `${offscreenX}vw`,
                    bottom: `${baseY}vh`,
                    height: `${SPEAKING_HEIGHT * heightMultiplier * 0.8}vh`,
                    filter: 'brightness(0.7)',
                    rotate: tiltRotate * 1.5,
                    transition: { 
                        x: { ease: easeIn, duration: 0.4 }, 
                        bottom: { duration: 0.4 }, 
                        opacity: { duration: 0.5, ease: "easeInOut" },
                        rotate: { duration: 0.4 }
                    }
                },
                talking: {
                    opacity: 0.85,
                    x: `${popInX}vw`,
                    bottom: `${baseY}vh`,
                    height: `${SPEAKING_HEIGHT * heightMultiplier * 0.8}vh`,
                    filter: 'brightness(0.9)',
                    rotate: tiltRotate,
                    transition: { 
                        x: { ease: easeOut, duration: 0.4 }, 
                        bottom: { duration: 0.4 }, 
                        opacity: { ease: easeOut, duration: 0.4 },
                        rotate: { duration: 0.4 }
                    }
                },
                idle: {
                    opacity: 0.85,
                    x: `${popInX}vw`,
                    bottom: `${baseY}vh`,
                    height: `${IDLE_HEIGHT * heightMultiplier * 0.8}vh`,
                    filter: 'brightness(0.7)',
                    rotate: tiltRotate,
                    transition: { 
                        x: { ease: easeOut, duration: 0.4 }, 
                        bottom: { duration: 0.4 }, 
                        opacity: { ease: easeOut, duration: 0.4 },
                        rotate: { duration: 0.4 }
                    }
                }
            };
        }
        
        // Normal mode: existing behavior
        return {
            absent: {
                opacity: 0,
                x: `150vw`,
                bottom: `${baseY}vh`,
                height: `${IDLE_HEIGHT * heightMultiplier}vh`,
                filter: 'brightness(0.8)',
                transition: { x: { ease: easeIn, duration: 0.5 }, bottom: { duration: 0.5 }, opacity: { ease: easeOut, duration: 0.5 } }
            },
            talking: {
                opacity: 1,
                x: `${baseX}vw`,
                bottom: `${baseY}vh`,
                height: `${(SPEAKING_HEIGHT * heightMultiplier)}vh`,
                filter: 'brightness(1)',
                transition: { x: { ease: easeIn, duration: 0.3 }, bottom: { duration: 0.3 }, opacity: { ease: easeOut, duration: 0.3 } }
            },
            idle: {
                opacity: 1,
                x: `${baseX}vw`,
                bottom: `${baseY}vh`,
                height: `${(IDLE_HEIGHT * heightMultiplier)}vh`,
                filter: 'brightness(0.8)',
                transition: { x: { ease: easeIn, duration: 0.3 }, bottom: { duration: 0.3 }, opacity: { ease: easeOut, duration: 0.3 } }
            }
        };
    }, [baseX, baseY, yPosition, zIndex, heightMultiplier, popInSide]);

    // Dynamic animation parameters that vary over time
    const [animationParams, setAnimationParams] = useState(() => {
        const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random1 = Math.abs((Math.sin(seed) * 10000) % 1);
        const random2 = Math.abs((Math.sin(seed + 1) * 10000) % 1);
        
        // Initial randomized extremity: base range 0.995-1.005
        const squish = 0.995 + (random1 * 0.004);
        const stretch = 1.005 - (random2 * 0.004);
        
        // Initial randomized duration: 0.2-0.6s
        const duration = 0.2 + (random1 * 0.4);
        
        return { squish, stretch, duration };
    });

    // Continuously vary animation parameters when audio is playing
    useEffect(() => {
        if (!isAudioPlaying || !speaker) {
            return;
        }

        // Update animation parameters every 1-3 seconds for natural variation
        const updateInterval = 1000 + Math.random() * 2000;
        
        const intervalId = setInterval(() => {
            setAnimationParams(prev => {
                // Generate new random values with more variation
                const random1 = Math.random();
                const random2 = Math.random();
                const random3 = Math.random();
                
                // Wider range for squish: 0.992-0.998 (more compressed)
                const squish = 0.992 + (random1 * 0.006);
                
                // Wider range for stretch: 1.002-1.008 (more extended)
                const stretch = 1.002 + (random2 * 0.006);
                
                // Vary duration: 0.15-0.7s for different pacing
                const duration = 0.15 + (random3 * 0.55);
                
                return { squish, stretch, duration };
            });
        }, updateInterval);

        return () => clearInterval(intervalId);
    }, [isAudioPlaying, speaker]);

    // Build a single bottom mask so pop-in and ghost effects share the same clipping path.
    const bottomMaskStyle = useMemo(() => {
        if (imageFilter === 'ghost') {
            return {
                maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.72) 58%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.72) 58%, transparent 100%)'
            };
        }

        if (popInSide !== 'none') {
            return {
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
            };
        }

        return {};
    }, [imageFilter, popInSide]);

    // Build animate props based on speaker and audio state
    // When speaker and audio is playing, we need to add the scaleY animation
    const animateProps = useMemo(() => {
        if (speaker && isAudioPlaying) {
            // Get the talking variant values
            const talkingVariant = variants.talking;
            const baseTransition = popInSide !== 'none'
                ? { x: { ease: easeOut, duration: 0.4 }, bottom: { duration: 0.4 }, opacity: { ease: easeOut, duration: 0.4 }, rotate: { duration: 0.4 } }
                : { x: { ease: easeIn, duration: 0.3 }, bottom: { duration: 0.3 }, opacity: { ease: easeOut, duration: 0.3 } };
            
            return {
                ...talkingVariant,
                scaleY: [1, animationParams.squish, animationParams.stretch, 1],
                transition: {
                    ...baseTransition,
                    scaleY: {
                        duration: animationParams.duration,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                }
            };
        }
        return speaker ? 'talking' : 'idle';
    }, [speaker, isAudioPlaying, variants, popInSide, animationParams]);

    const tintFilterId = `tint-${id}`;
    const ghostTintFilterId = `ghost-tint-${id}`;
    const auraGlowFilterId = `aura-glow-${id}`;
    const hologramTintFilterId = `hologram-tint-${id}`;
    const isGhost = imageFilter === 'ghost';
    const isHologram = imageFilter === 'hologram';
    const backingOpacity = isGhost ? 0.82 : isHologram ? 0.95 : 1;
    const mainOpacity = isGhost ? 0.58 : isHologram ? 0.4 : 0.75;

    return displayedImageUrl ? (
        <>
            {/* SVG filter: multiply image by highlightColor, preserving transparency */}
            <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
                <defs>
                    <filter id={tintFilterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
                        <feFlood floodColor={highlightColor} result="flood" />
                        <feComposite in="flood" in2="SourceGraphic" operator="in" result="masked" />
                        <feBlend in="SourceGraphic" in2="masked" mode="multiply" />
                    </filter>
                    <filter id={ghostTintFilterId} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
                        <feFlood floodColor={filterColor} result="ghostFlood" />
                        <feComposite in="ghostFlood" in2="SourceAlpha" operator="in" result="ghostMask" />
                        <feGaussianBlur in="ghostMask" stdDeviation="2.2" result="ghostSoft" />
                        <feMerge>
                            <feMergeNode in="ghostSoft" />
                            <feMergeNode in="ghostMask" />
                        </feMerge>
                    </filter>
                    <filter id={auraGlowFilterId} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="auraBlur" />
                        <feFlood floodColor={filterColor} result="auraFlood" />
                        <feComposite in="auraFlood" in2="auraBlur" operator="in" result="auraGlow" />
                        <feGaussianBlur in="auraGlow" stdDeviation="1.4" result="auraSoft" />
                        <feMerge>
                            <feMergeNode in="auraSoft" />
                            <feMergeNode in="auraGlow" />
                        </feMerge>
                    </filter>
                    <filter id={hologramTintFilterId} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
                        <feFlood floodColor={filterColor} result="holoFlood" />
                        <feComposite in="holoFlood" in2="SourceAlpha" operator="in" result="holoMask" />
                        <feGaussianBlur in="holoMask" stdDeviation="1.6" result="holoSoft" />
                        <feBlend in="SourceGraphic" in2="holoSoft" mode="screen" />
                    </filter>
                </defs>
            </svg>
            {isHologram && (
                <style>
                    {`@keyframes hologramScanBand {\n  from {\n    -webkit-mask-position: 0% -130%;\n    mask-position: 0% -130%;\n  }\n  to {\n    -webkit-mask-position: 0% 130%;\n    mask-position: 0% 130%;\n  }\n}\n@keyframes hologramScanlines {\n  from {\n    background-position: 0 0;\n  }\n  to {\n    background-position: 0 120px;\n  }\n}`}
                </style>
            )}
        <motion.div
            key={`actor_motion_div_${id}`}
            variants={variants}
            // Prevent automatic initial animation on remounts/refreshes; rely on animate to move between states
            initial={'absent'}
            exit='absent'
            animate={animateProps}
            transformTemplate={(_, generatedTransform) => {
                const baseTransform = generatedTransform?.trim() || '';
                return baseTransform
                    ? `${baseTransform} translateX(-50%)`
                    : 'translateX(-50%)';
            }}
            style={{position: 'absolute', width: 'auto', aspectRatio, overflow: 'visible', zIndex: speaker ? 100 : zIndex, transformOrigin: 'bottom center'}}>
            <AnimatePresence>
                {/* Aura should render only as edge glow and never recolor the character layer. */}
                {displayedImageUrl && imageFilter === 'aura' && (
                    <motion.img
                        key={`${id}_${displayedImageUrl}_aura`}
                        src={displayedImageUrl}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            height: '100%',
                            filter: `url(#${auraGlowFilterId})`,
                            zIndex: 3,
                            pointerEvents: 'none',
                            ...bottomMaskStyle
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {/* Backing image layer - solid but blurry. */}
                {displayedImageUrl && (
                    <motion.img
                        key={`${id}_${displayedImageUrl}_bg`}
                        src={displayedImageUrl}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            height: '100%',
                            opacity: backingOpacity,
                            filter: isHologram
                                ? `url(#${hologramTintFilterId}) blur(3.4px) saturate(1.2) brightness(1.25)`
                                : `url(#${tintFilterId}) blur(2.5px)`,
                            zIndex: 4,
                            pointerEvents: 'none',
                            ...bottomMaskStyle
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {/* Ghost mode adds a subtle color haze without repainting the main sprite itself. */}
                {displayedImageUrl && imageFilter === 'ghost' && (
                    <motion.img
                        key={`${id}_${displayedImageUrl}_ghost`}
                        src={displayedImageUrl}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.42 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            height: '100%',
                            filter: `url(#${ghostTintFilterId})`,
                            zIndex: 5,
                            pointerEvents: 'none',
                            ...bottomMaskStyle
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {displayedImageUrl && isHologram && (
                    <motion.img
                        key={`${id}_${displayedImageUrl}_hologram_scan`}
                        src={displayedImageUrl}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.18, 0.52, 0.18] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 5.4, repeat: Infinity, ease: 'linear' }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 6,
                            pointerEvents: 'none',
                            filter: `url(#${hologramTintFilterId}) blur(0.5px) brightness(1.28)`,
                            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.8) 48%, black 52%, rgba(0, 0, 0, 0.8) 56%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.8) 48%, black 52%, rgba(0, 0, 0, 0.8) 56%, transparent 100%)',
                            maskSize: '100% 230%',
                            WebkitMaskSize: '100% 230%',
                            maskPosition: '0% -130%',
                            WebkitMaskPosition: '0% -130%',
                            animation: 'hologramScanBand 5.4s linear infinite',
                            ...bottomMaskStyle
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {displayedImageUrl && isHologram && (
                    <motion.div
                        key={`${id}_${displayedImageUrl}_hologram_scanlines`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.08, 0.18, 0.08] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 7,
                            pointerEvents: 'none',
                            mixBlendMode: 'screen',
                            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, ${filterColor} 2px, transparent 4px)`,
                            animation: 'hologramScanlines 3.2s linear infinite',
                            ...bottomMaskStyle
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {displayedImageUrl && isHologram && (
                    <motion.div
                        key={`${id}_${displayedImageUrl}_hologram_glow`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.1, 0.24, 0.1] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 8,
                            pointerEvents: 'none',
                            mixBlendMode: 'screen',
                            background: `linear-gradient(to bottom, transparent 0%, ${filterColor} 42%, transparent 70%)`,
                            filter: 'blur(8px)',
                            ...bottomMaskStyle
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {/* Main image layer - semi transparent, but crisp. */}
                {displayedImageUrl && (
                    <motion.img
                        key={`${id}_${displayedImageUrl}_main`}
                        src={displayedImageUrl}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: mainOpacity }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            height: '100%',
                            filter: isHologram
                                ? `url(#${hologramTintFilterId}) brightness(1.12) contrast(1.06)`
                                : `url(#${tintFilterId})`,
                            zIndex: isHologram ? 9 : 6,
                            ...bottomMaskStyle
                        }}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                )}
            </AnimatePresence>
        </motion.div>
        </>
    ) : <></>;
};

export default memo(ActorImage);