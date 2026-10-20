import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { getCharacterHapticPatterns, triggerHapticFeedback } from '../src/utils/haptics.ts';

const span = (props, ...children) => React.createElement('span', props, ...children);
const dialogue = (...children) => span({ 'data-haptic-context': 'dialogue' }, ...children);

test('prose keeps its single pulse while dialogue uses a stronger double pulse', () => {
    assert.deepEqual(getCharacterHapticPatterns('a'), [6]);
    assert.deepEqual(getCharacterHapticPatterns(dialogue('a')), [[8, 12, 4]]);
});

test('font effects scale both prose and dialogue without losing the double pulse', () => {
    for (const className of ['shiny', 'burn', 'glitch', 'quake', 'shout', 'zalgo']) {
        const duration = className === 'shiny' ? 8 : 10;
        const effect = span({ className }, 'a');
        assert.deepEqual(getCharacterHapticPatterns(effect), [duration]);
        assert.deepEqual(getCharacterHapticPatterns(dialogue(effect)), [
            [duration + 2, 12, duration - 2]
        ]);
    }
});

test('dialogue context and the strongest effect survive nested formatting', () => {
    const content = dialogue(span({ className: 'burn' }, span({ className: 'shiny' }, 'a')));
    assert.deepEqual(getCharacterHapticPatterns(content), [[12, 12, 8]]);
});

test('mixed dialogue and prose retain their own patterns', () => {
    const content = React.createElement(React.Fragment, null,
        span({ 'data-haptic-context': 'prose' }, 'a'),
        dialogue(span(null, 'b')),
        span({ 'data-haptic-context': 'prose' }, 'c')
    );
    assert.deepEqual(getCharacterHapticPatterns(content), [6, [8, 12, 4], 6]);
    assert.deepEqual(
        getCharacterHapticPatterns(dialogue(span({ 'data-haptic-context': 'prose' }, 'a'))),
        [6]
    );
});

test('whitespace stays silent and patterns align with typewriter UTF-16 indices', () => {
    assert.deepEqual(getCharacterHapticPatterns(dialogue('a \n\t😀b')), [
        [8, 12, 4], 0, 0, 0, [8, 12, 4], [8, 12, 4], [8, 12, 4]
    ]);
});

test('numbers are supported and non-text children do not add patterns', () => {
    assert.deepEqual(getCharacterHapticPatterns([null, false, undefined, 12]), [6, 6]);
    assert.deepEqual(getCharacterHapticPatterns(dialogue(12)), [[8, 12, 4], [8, 12, 4]]);
});

test('vibration forwards single pulses, patterns, and the existing default', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const calls = [];
    try {
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: { vibrate: (pattern) => calls.push(pattern) }
        });
        triggerHapticFeedback();
        triggerHapticFeedback(8);
        triggerHapticFeedback([8, 12, 4]);
        assert.deepEqual(calls, [6, 8, [8, 12, 4]]);

        Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
        assert.doesNotThrow(() => triggerHapticFeedback([8, 12, 4]));
        Reflect.deleteProperty(globalThis, 'navigator');
        assert.doesNotThrow(() => triggerHapticFeedback());
    } finally {
        if (descriptor) {
            Object.defineProperty(globalThis, 'navigator', descriptor);
        } else {
            Reflect.deleteProperty(globalThis, 'navigator');
        }
    }
});
