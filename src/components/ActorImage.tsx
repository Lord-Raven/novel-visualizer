import {motion, Variants, easeOut, easeIn, AnimatePresence} from "framer-motion";
import {FC, useState, useEffect, useRef, useMemo, memo} from "react";

const IDLE_HEIGHT: number = 80;
const SPEAKING_HEIGHT: number = 90;

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
    // 'isGhost' indicates a non-present actor that's appearing briefly for this message
    isGhost?: boolean;
    // 'ghostSide' determines which side of the screen the ghost enters from
    ghostSide?: 'left' | 'right';
    // 'isAudioPlaying' indicates whether audio is currently playing for this character
    isAudioPlaying?: boolean;
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
    isGhost = false,
    ghostSide = 'left',
    isAudioPlaying = false
}) => {
    const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
    const [prevImageUrl, setPrevImageUrl] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('9 / 16');
    const imageUrl = resolveImageUrl();
    const prevRawImageUrl = useRef<string>(imageUrl);

    // Process image with color multiplication
    useEffect(() => {
        if (!imageUrl) {
            setProcessedImageUrl(imageUrl);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
                // Set aspect ratio based on image dimensions
                if (img.naturalWidth && img.naturalHeight) {
                    setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
                }
            const result = multiplyImageByColor(img, highlightColor);
            if (result) {
                setProcessedImageUrl(result);
            }
        };
        img.src = imageUrl;
    }, [imageUrl, highlightColor]);

    // Track previous processed image for fade transition
    useEffect(() => {
        if (prevRawImageUrl.current !== imageUrl) {
            setPrevImageUrl(processedImageUrl);
            prevRawImageUrl.current = imageUrl;
        }
    }, [imageUrl, processedImageUrl]);

    // Calculate final parallax position
    const baseX = speaker ? 50 : xPosition;
    const baseY = yPosition;

    const variants: Variants = useMemo(() => {
        if (isGhost) {
            // Ghost mode: tilt in from the side
            const ghostX = ghostSide === 'left' ? 10 : 90;
            const offscreenX = ghostSide === 'left' ? -20 : 120;
            const tiltRotate = ghostSide === 'left' ? 15 : -15;
            
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
                        opacity: { ease: easeOut, duration: 0.3 },
                        rotate: { duration: 0.4 }
                    }
                },
                talking: {
                    opacity: 0.85,
                    x: `${ghostX}vw`,
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
                    x: `${ghostX}vw`,
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
    }, [baseX, baseY, yPosition, zIndex, heightMultiplier, isGhost, ghostSide]);

    // Generate randomized animation parameters based on actor ID for variety
    const animationParams = useMemo(() => {
        const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random1 = (Math.sin(seed) * 10000) % 1;
        const random2 = (Math.sin(seed + 1) * 10000) % 1;
        
        // Randomize extremity: base range 0.97-1.03, with ±0.005 variation
        const squish = 0.97 + (random1 * 0.01 - 0.005);
        const stretch = 1.03 + (random2 * 0.01 - 0.005);
        
        // Randomize duration: 0.3-0.4s
        const duration = 0.3 + (random1 * 0.1);
        
        return { squish, stretch, duration };
    }, [id]);

    // Talking animation: squish and stretch while audio plays
    const talkingAnimationProps = isAudioPlaying ? {
        scaleY: [1, animationParams.squish, animationParams.stretch, 1],
        transition: {
            scaleY: {
                duration: animationParams.duration,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    } : {};

    return processedImageUrl ? (
        <motion.div
            key={`actor_motion_div_${id}`}
            variants={variants}
            // Prevent automatic initial animation on remounts/refreshes; rely on animate to move between states
            initial={'absent'}
            exit='absent'
            animate={speaker ? { ...variants.talking, ...talkingAnimationProps } : 'idle'}
            style={{position: 'absolute', width: 'auto', aspectRatio, overflow: 'visible', zIndex: speaker ? 100 : zIndex, transformOrigin: 'bottom center'}}>
            <AnimatePresence>
                {/* Previous image layer for crossfade */}
                {prevImageUrl && prevImageUrl !== processedImageUrl && (
                    <motion.img
                        key={`${id}_${prevImageUrl}_prev`}
                        src={prevImageUrl}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            height: '100%',
                            filter: 'blur(2.5px)',
                            zIndex: 3,
                            transform: `translateX(-50%)`,
                            pointerEvents: 'none'
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {/* Backing image layer - solid but blurry. */}
                {processedImageUrl && (
                    <motion.img
                        key={`${id}_${imageUrl}_bg`}
                        src={processedImageUrl}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, filter: 'blur(2.5px)' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 4,
                            transform: `translateX(-50%)`,
                            pointerEvents: 'none'
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {/* Main image layer - semi transparent, but crisp. */}
                {processedImageUrl && (
                    <motion.img
                        key={`${id}_${imageUrl}_main`}
                        src={processedImageUrl}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.75 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 5,
                            transform: `translateX(-50%)`,
                        }}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    ) : <></>;
};

const multiplyImageByColor = (img: HTMLImageElement, hex: string): string | null => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Apply color multiplication
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = hex.toUpperCase();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Preserve original alpha channel
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL();
};

export default memo(ActorImage);