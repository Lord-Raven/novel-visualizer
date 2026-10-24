import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { NovelVisualizer } = require('@lord-raven/novel-visualizer');

const render = (props = {}) => renderToStaticMarkup(React.createElement(NovelVisualizer, {
    skit: { currentIndex: 0, script: [{ message: 'Hello' }] },
    actors: {},
    playerActorId: 'player',
    getPresentActors: () => [],
    getActorImageUrl: () => '',
    enableAudio: false,
    ...props
}));

const additionalActionButtons = React.createElement(React.Fragment, null,
    React.createElement('button', { 'data-testid': 'bookmark' }, 'Bookmark'),
    React.createElement('button', { 'data-testid': 'share' }, 'Share')
);

for (const isVerticalLayout of [false, true]) {
    test(`custom actions precede edit/reroll in ${isVerticalLayout ? 'vertical' : 'standard'} layout`, () => {
        const markup = render({ additionalActionButtons, isVerticalLayout });
        const bookmark = markup.indexOf('data-testid="bookmark"');
        const share = markup.indexOf('data-testid="share"');
        const edit = markup.indexOf('data-testid="EditIcon"');
        const reroll = markup.indexOf('data-testid="CasinoIcon"');
        assert.ok(bookmark >= 0);
        assert.ok(share > bookmark);
        assert.ok(edit > share);
        assert.ok(reroll > edit);
    });
}

test('hideActionButtons hides custom and built-in actions', () => {
    const markup = render({ additionalActionButtons, hideActionButtons: true });
    for (const id of ['bookmark', 'share', 'EditIcon', 'CasinoIcon']) {
        assert.ok(!markup.includes(`data-testid="${id}"`));
    }
});

test('disabling reroll preserves custom actions and edit', () => {
    const markup = render({ additionalActionButtons, enableReroll: false });
    assert.ok(markup.includes('data-testid="bookmark"'));
    assert.ok(markup.includes('data-testid="EditIcon"'));
    assert.ok(!markup.includes('data-testid="CasinoIcon"'));
});

test('omitting custom actions preserves built-in controls', () => {
    const markup = render();
    assert.ok(markup.includes('data-testid="EditIcon"'));
    assert.ok(markup.includes('data-testid="CasinoIcon"'));
    assert.ok(!markup.includes('data-testid="bookmark"'));
});
