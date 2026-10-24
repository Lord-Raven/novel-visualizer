import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { NovelVisualizer } = require('@lord-raven/novel-visualizer');
const { default: Bookmark } = require('@mui/icons-material/Bookmark');

const render = (props = {}) => renderToStaticMarkup(React.createElement(NovelVisualizer, {
    skit: { currentIndex: 0, script: [{ message: 'Hello' }] },
    actors: {},
    playerActorId: 'player',
    getPresentActors: () => [],
    getActorImageUrl: () => '',
    enableAudio: false,
    ...props
}));

const additionalActionButtons = [
    {
        id: 'bookmark',
        label: 'Bookmark',
        content: React.createElement(Bookmark, { 'data-testid': 'bookmark' }),
        onClick: () => {}
    },
    {
        id: 'share',
        label: 'Share',
        content: React.createElement('span', { 'data-testid': 'share' }, 'Share'),
        onClick: () => {}
    }
];

for (const isVerticalLayout of [false, true]) {
    const layout = isVerticalLayout ? 'vertical' : 'standard';
    test(`custom actions precede edit/reroll in ${layout} layout`, () => {
        const markup = render({ additionalActionButtons, isVerticalLayout });
        const bookmark = markup.indexOf('data-testid="bookmark"');
        const share = markup.indexOf('data-testid="share"');
        const edit = markup.indexOf('data-testid="EditIcon"');
        const reroll = markup.indexOf('data-testid="CasinoIcon"');
        assert.ok(bookmark >= 0);
        assert.ok(share > bookmark);
        assert.ok(edit > share);
        assert.ok(reroll > edit);
        const customButton = markup.match(/<button[^>]*aria-label="Bookmark"[^>]*>/)?.[0];
        assert.ok(customButton);
        assert.ok(customButton.includes('MuiIconButton-sizeSmall'));
        const customClass = customButton.match(/class="([^"]*)"/)?.[1];
        const editButton = markup.slice(0, edit).match(/<button[^>]*>/g)?.at(-1);
        assert.equal(editButton?.match(/class="([^"]*)"/)?.[1], customClass);
        assert.ok(markup.includes(`.MuiSvgIcon-root{font-size:${isVerticalLayout ? 16 : 20}px;}`));
    });

    test(`loading disables all custom actions in ${layout} layout`, () => {
        const markup = render({ additionalActionButtons, loading: true, isVerticalLayout });
        for (const label of ['Bookmark', 'Share']) {
            const button = markup.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0];
            assert.ok(button?.includes('disabled=""'));
        }
    });

    test(`individual actions can be disabled independently in ${layout} layout`, () => {
        const markup = render({
            isVerticalLayout,
            additionalActionButtons: additionalActionButtons.map(button => ({
                ...button,
                disabled: button.id === 'bookmark'
            }))
        });
        const bookmark = markup.match(/<button[^>]*aria-label="Bookmark"[^>]*>/)?.[0];
        const share = markup.match(/<button[^>]*aria-label="Share"[^>]*>/)?.[0];
        assert.ok(bookmark?.includes('disabled=""'));
        assert.ok(share && !share.includes('disabled=""'));
    });

    test(`empty action lists and non-icon contents are supported in ${layout} layout`, () => {
        assert.equal(render({ additionalActionButtons: [], isVerticalLayout }), render({ isVerticalLayout }));
        const markup = render({
            isVerticalLayout,
            additionalActionButtons: [{ id: 'text', label: 'Text action', content: 'Custom text', onClick: () => {} }]
        });
        assert.match(markup, /aria-label="Text action"/);
        assert.ok(markup.includes('Custom text'));
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
