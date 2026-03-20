import React, { FC, useEffect, useState } from 'react';

interface BlurredBackgroundProps {
    imageUrl?: string;
    brightness?: number;
    contrast?: number;
    blur?: number;
    scale?: number;
    overlay?: string;
    transitionDuration?: number;
    children?: React.ReactNode;
}

/**
 * A reusable component that provides a blurred background image with consistent styling
 * across all screens in the application. Features smooth fade transitions when the image changes.
 * @param transitionDuration - Duration of the fade transition in milliseconds (default: 600)
 */
export const BlurredBackground: FC<BlurredBackgroundProps> = ({
    imageUrl,
    brightness = 0.6,
    contrast = 1.05,
    blur = 6,
    scale = 1.03,
    overlay,
    transitionDuration = 600,
    children
}) => {
    const [currentImage, setCurrentImage] = useState<string | undefined>(imageUrl);
    const [previousImage, setPreviousImage] = useState<string | undefined>();
    const [incomingImage, setIncomingImage] = useState<string | undefined>();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isFadeActive, setIsFadeActive] = useState(false);

    useEffect(() => {
        if (imageUrl !== currentImage) {
            // Start transition by keeping the previous image visible while the next image fades in.
            setPreviousImage(currentImage);
            setIncomingImage(imageUrl);
            setIsTransitioning(true);
            setIsFadeActive(false);

            const rafId = requestAnimationFrame(() => {
                setIsFadeActive(true);
            });

            const timer = setTimeout(() => {
                setCurrentImage(imageUrl);
                setIsTransitioning(false);
                setIsFadeActive(false);
                setPreviousImage(undefined);
                setIncomingImage(undefined);
            }, transitionDuration);

            return () => {
                cancelAnimationFrame(rafId);
                clearTimeout(timer);
            };
        }
    }, [imageUrl, currentImage, transitionDuration]);

    const imageStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: `blur(${blur}px) brightness(${brightness}) contrast(${contrast})`,
        transform: `scale(${scale})`,
        transition: `opacity ${transitionDuration}ms ease-in-out`
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Previous background image (fading out). */}
            {isTransitioning && previousImage && (
                <div style={{
                    ...imageStyle,
                    backgroundImage: `url(${previousImage})`,
                    opacity: isFadeActive ? 0 : 1,
                    zIndex: 0
                }} />
            )}

            {/* Incoming or current background image. */}
            {isTransitioning ? (
                incomingImage && (
                    <div style={{
                        ...imageStyle,
                        backgroundImage: `url(${incomingImage})`,
                        opacity: isFadeActive ? 1 : 0,
                        zIndex: 1
                    }} />
                )
            ) : (
                currentImage && (
                    <div style={{
                        ...imageStyle,
                        backgroundImage: `url(${currentImage})`,
                        opacity: 1,
                        zIndex: 0
                    }} />
                )
            )}

            {/* Optional overlay */}
            {overlay && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: overlay,
                    zIndex: 1
                }} />
            )}

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                height: '100%'
            }}>
                {children}
            </div>
        </div>
    );
};

export default BlurredBackground;