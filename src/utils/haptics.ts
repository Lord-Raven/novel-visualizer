export const triggerHapticFeedback = (duration = 6): void => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(duration);
    }
};
