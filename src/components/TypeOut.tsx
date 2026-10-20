import React from 'react';
import { triggerHapticFeedback } from '../utils/haptics';

interface TypeOutProps {
    children: React.ReactNode;
    speed?: number; // ms per character
    className?: string;
    finishTyping?: boolean; // forces immediate completion when true
    onTypingComplete?: () => void; // called when typing animation finishes (either naturally or forced)
    enableHaptics?: boolean;
}

// Helper function to extract text content from React elements
const extractTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') {
        return node;
    }
    if (typeof node === 'number') {
        return String(node);
    }
    if (React.isValidElement(node)) {
        if (node.props.children) {
            return extractTextContent(node.props.children);
        }
    }
    if (Array.isArray(node)) {
        return node.map(extractTextContent).join('');
    }
    return '';
};

const getCharacterHapticDurations = (
    node: React.ReactNode,
    effectDuration = 6
): number[] => {
    if (typeof node === 'string' || typeof node === 'number') {
        const text = String(node);
        return Array.from(text).flatMap((character) =>
            Array.from({ length: character.length }, () => /\s/.test(character) ? 0 : effectDuration)
        );
    }

    if (Array.isArray(node)) {
        return node.flatMap((child) => getCharacterHapticDurations(child, effectDuration));
    }

    if (React.isValidElement(node)) {
        const className = typeof node.props.className === 'string' ? node.props.className : '';
        const effectClass = className.split(/\s+/).find(Boolean);
        const isStrongEffect = ['burn', 'glitch', 'quake', 'shout', 'zalgo'].includes(effectClass ?? '');
        const childDuration = Math.max(effectDuration, effectClass ? (isStrongEffect ? 10 : 8) : 0);
        return getCharacterHapticDurations(node.props.children, childDuration);
    }

    return [];
};

// Helper function to truncate React elements based on character count
const truncateReactContent = (node: React.ReactNode, maxLength: number): React.ReactNode => {
    let currentLength = 0;
    
    const truncateNode = (n: React.ReactNode, key?: string | number): React.ReactNode => {
        if (currentLength >= maxLength) {
            return null;
        }
        
        if (typeof n === 'string') {
            const remaining = maxLength - currentLength;
            const truncated = n.slice(0, remaining);
            currentLength += truncated.length;
            return truncated;
        }
        
        if (typeof n === 'number') {
            const str = String(n);
            const remaining = maxLength - currentLength;
            const truncated = str.slice(0, remaining);
            currentLength += truncated.length;
            return truncated;
        }
        
        if (React.isValidElement(n)) {
            const children = n.props.children;
            if (children !== undefined && children !== null) {
                const truncatedChildren = truncateNode(children);
                // Only render the element if there are truncated children or if it's a self-closing element
                if (truncatedChildren !== null || !children) {
                    return React.cloneElement(n, { ...n.props, key }, truncatedChildren);
                }
                return null;
            }
            // Self-closing element or element with no children
            return React.cloneElement(n, { ...n.props, key });
        }
        
        if (Array.isArray(n)) {
            const result: React.ReactNode[] = [];
            for (let i = 0; i < n.length; i++) {
                if (currentLength >= maxLength) break;
                const child = n[i];
                const truncated = truncateNode(child, i);
                if (truncated !== null && truncated !== undefined) {
                    result.push(truncated);
                }
            }
            return result.length > 0 ? result : null;
        }
        
        return n;
    };
    
    return truncateNode(node);
};

/*
  Types out React children from empty to full once. It restarts whenever the children change.
  Can be forced to complete immediately via finishTyping prop.
  Properly renders React elements including spans, divs, and other components.
*/
export const TypeOut: React.FC<TypeOutProps> = ({ 
    children, 
    speed = 25, 
    className, 
    finishTyping = false, 
    onTypingComplete,
    enableHaptics = false
}) => {
    const [displayLength, setDisplayLength] = React.useState<number>(0);
    const [finished, setFinished] = React.useState<boolean>(false);
    const timerRef = React.useRef<number | null>(null);
    const lastHapticAtRef = React.useRef<number>(0);
    
    const textContent = React.useMemo(() => extractTextContent(children), [children]);
    const hapticDurations = React.useMemo(
        () => getCharacterHapticDurations(children),
        [children]
    );
    const hapticSettingsRef = React.useRef({ enableHaptics, hapticDurations });
    const onTypingCompleteRef = React.useRef(onTypingComplete);

    React.useLayoutEffect(() => {
        hapticSettingsRef.current = { enableHaptics, hapticDurations };
    }, [enableHaptics, hapticDurations]);
    
    // Keep the callback ref up to date without causing re-renders
    React.useEffect(() => {
        onTypingCompleteRef.current = onTypingComplete;
    }, [onTypingComplete]);
    
    React.useLayoutEffect(() => {
        setDisplayLength(0);
        setFinished(false);

        if (!textContent) {
            setFinished(true);
            onTypingCompleteRef.current?.();
            return;
        }

        if (speed <= 0) {
            setDisplayLength(textContent.length);
            setFinished(true);
            onTypingCompleteRef.current?.();
            return;
        }

        // Start interval to reveal characters
        // Use a ref to track the current index so it persists across closures
        const idxRef = { current: 0 };

        timerRef.current = window.setInterval(() => {
            idxRef.current += 1;
            setDisplayLength(idxRef.current);
            const character = textContent[idxRef.current - 1];
            const { enableHaptics, hapticDurations } = hapticSettingsRef.current;
            const hapticDuration = hapticDurations[idxRef.current - 1] ?? 0;
            const now = Date.now();
            if (
                enableHaptics &&
                hapticDuration > 0 &&
                !/\s/.test(character) &&
                now - lastHapticAtRef.current >= 70
            ) {
                triggerHapticFeedback(hapticDuration);
                lastHapticAtRef.current = now;
            }
            if (idxRef.current >= textContent.length) {
                if (timerRef.current !== null) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setFinished(true);
                onTypingCompleteRef.current?.();
            }
        }, speed);

        return () => {
            if (timerRef.current !== null) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [textContent, speed]);

    // Effect to handle finishTyping prop
    React.useEffect(() => {
        if (finishTyping && !finished) {
            // Clear any running interval
            if (timerRef.current !== null) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            // Set to full length and mark as finished
            setDisplayLength(textContent.length);
            setFinished(true);
            onTypingCompleteRef.current?.();
        }
    }, [finishTyping, finished, textContent.length]);

    // Determine what to display
    const displayContent = React.useMemo(() => {
        if (displayLength === 0) {
            return null;
        }
        
        // If finished naturally or forced, show complete content
        if (finished || (finishTyping && displayLength >= textContent.length) || speed <= 0) {
            return children;
        }
        
        // Truncate React children based on character count
        return truncateReactContent(children, displayLength);
    }, [children, displayLength, finished, finishTyping, textContent.length, speed]);

    return (
        <span
            className={className}
            style={{
                userSelect: 'none',
                whiteSpace: 'pre-line'
            }}
            aria-label="message"
        >
            {displayContent}
        </span>
    );
};

export default TypeOut;
