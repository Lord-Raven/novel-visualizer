import React from 'react';

type HapticPattern = number | number[];

export const getCharacterHapticPatterns = (
    node: React.ReactNode,
    effectDuration = 6,
    isDialogue = false
): HapticPattern[] => {
    if (typeof node === 'string' || typeof node === 'number') {
        const pattern: HapticPattern = isDialogue
            ? [effectDuration + 2, 12, Math.max(4, effectDuration - 2)]
            : effectDuration;

        // Match the UTF-16 indices used by the typewriter, including surrogate pairs.
        return Array.from(String(node)).flatMap((character) =>
            Array.from({ length: character.length }, () => /\s/.test(character) ? 0 : pattern)
        );
    }

    if (Array.isArray(node)) {
        return node.flatMap((child) => getCharacterHapticPatterns(child, effectDuration, isDialogue));
    }

    if (React.isValidElement(node)) {
        const className = typeof node.props.className === 'string' ? node.props.className : '';
        const effectClass = className.split(/\s+/).find(Boolean);
        const isStrongEffect = ['burn', 'glitch', 'quake', 'shout', 'zalgo'].includes(effectClass ?? '');
        const childDuration = Math.max(effectDuration, effectClass ? (isStrongEffect ? 10 : 8) : 0);
        const context = node.props['data-haptic-context'];
        const childIsDialogue = context === 'dialogue' || (context !== 'prose' && isDialogue);
        return getCharacterHapticPatterns(node.props.children, childDuration, childIsDialogue);
    }

    return [];
};

export const triggerHapticFeedback = (pattern: HapticPattern = 6): void => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
    }
};
