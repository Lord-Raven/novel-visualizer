import React, { FC, useEffect, useState } from 'react';

interface BlurredBackgroundProps {
    imageUrl: string;
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
    const [currentImage, setCurrentImage] = useState(imageUrl);
    const [previousImage, setPreviousImage] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (imageUrl !== currentImage) {
            // Start transition
            setPreviousImage(currentImage);
            setIsTransitioning(true);
            
            // After a short delay, update to the new image
            const timer = setTimeout(() => {
                setCurrentImage(imageUrl);
                setIsTransitioning(false);
                
                // Clear the previous image after transition completes
                const cleanupTimer = setTimeout(() => {
                    setPreviousImage(null);
                }, transitionDuration);
                
                return () => clearTimeout(cleanupTimer);
            }, 50); // Small delay to ensure transition is visible
            
            return () => clearTimeout(timer);
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
            {/* Previous background image (fading out) */}
            {previousImage && (
                <div style={{
                    ...imageStyle,
                    backgroundImage: `url(${previousImage})`,
                    opacity: isTransitioning ? 0 : 1,
                    zIndex: 0
                }} />
            )}

            {/* Current background image (fading in) */}
            <div style={{
                ...imageStyle,
                backgroundImage: `url(${currentImage})`,
                opacity: 1,
                zIndex: previousImage ? 1 : 0
            }} />

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