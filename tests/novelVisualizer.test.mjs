import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { NovelVisualizer } = require('@lord-raven/novel-visualizer');
const { default: Bookmark } = require('@mui/icons-material/Bookmark');
const { default: Edit } = require('@mui/icons-material/Edit');
const { default: Check } = require('@mui/icons-material/Check');

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

test('readOnly hides edit, reroll, and input while keeping a full-width continue button', () => {
    const markup = render({ additionalActionButtons, readOnly: true });
    assert.ok(!markup.includes('data-testid="EditIcon"'));
    assert.ok(!markup.includes('data-testid="CasinoIcon"'));
    assert.ok(markup.includes('data-testid="bookmark"'));
    assert.ok(!markup.includes('<input'));
    const continueButton = markup.match(/<button[^>]*class="[^"]*MuiButton-fullWidth[^"]*"[^>]*>/)?.[0];
    assert.ok(continueButton);
    assert.ok(markup.includes('Continue'));
});

const findElement = (node, predicate) => {
    if (!React.isValidElement(node)) return undefined;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props.children)) {
        const found = findElement(child, predicate);
        if (found) return found;
    }
};

// Retain hook state between server renders so edit controls can be exercised
// without mounting MUI or running browser/audio effects.
const createEditor = (props) => {
    const states = [];
    let tree;
    const Probe = () => {
        const originalUseState = React.useState;
        let cursor = 0;
        React.useState = (initial) => {
            const slot = cursor++;
            if (!(slot in states)) states[slot] = typeof initial === 'function' ? initial() : initial;
            return [states[slot], value => {
                states[slot] = typeof value === 'function' ? value(states[slot]) : value;
            }];
        };
        try {
            tree = NovelVisualizer({
                playerActorId: 'player',
                getActorImageUrl: () => '',
                enableAudio: false,
                ...props
            });
            return tree;
        } finally {
            React.useState = originalUseState;
        }
    };
    return {
        render: () => renderToStaticMarkup(React.createElement(Probe)),
        find: predicate => findElement(tree, predicate),
        clickIcon: icon => {
            const button = findElement(tree, node => node.props.children?.type === icon && node.props.onClick);
            assert.ok(button, 'Expected an actionable icon button');
            button.props.onClick();
        }
    };
};

for (const isVerticalLayout of [false, true]) {
    test(`speaker picker preserves custom positioning and prioritizes names (${isVerticalLayout ? 'vertical' : 'standard'})`, () => {
        const actors = {
            outsider: { id: 'outsider', name: 'Aaron' },
            future: { id: 'future', name: 'Future participant' },
            past: { id: 'past', name: 'Past participant' },
            presentZ: { id: 'presentZ', name: 'Zoe' },
            presentA: { id: 'presentA', name: 'Amy' }
        };
        const updates = [];
        const editor = createEditor({
            isVerticalLayout,
            actors,
            skit: { currentIndex: 1, script: [
                { speakerId: 'past', message: 'Earlier' },
                { speakerId: 'presentZ', message: 'Current' },
                { speakerId: 'future', message: 'Later' }
            ] },
            getPresentActors: () => [{ ...actors.presentZ }, { ...actors.presentA }],
            renderNameplate: actor => React.createElement('span', {
                'data-testid': 'custom-nameplate',
                style: { position: 'absolute', left: '50%', transform: 'translateX(-50%)' }
            }, actor?.name ?? ''),
            onUpdateSpeaker: (...args) => updates.push(args)
        });
        editor.render();
        editor.clickIcon(Edit);
        editor.render();
        const control = editor.find(node => node.props['aria-label'] === 'Change message speaker');
        assert.equal(control.props.sx.display, 'contents');
        assert.equal(control.props.sx.position, undefined);
        control.props.onClick();
        editor.render();
        const list = editor.find(node => node.props.role === 'listbox');
        const options = React.Children.toArray(list.props.children);
        assert.deepEqual(options.map(option => option.props.children.props.children),
            ['(Narrator)', 'Amy', 'Zoe', 'Future participant', 'Past participant', 'Aaron']);
        assert.equal(findElement(list, node => node.props['data-testid'] === 'custom-nameplate'), undefined);
        assert.equal(options[2].props['aria-selected'], true);
        options[4].props.onClick();
        editor.render();
        assert.equal(editor.find(node => node.props.role === 'listbox'), undefined);
        assert.equal(editor.find(node => node.props['data-testid'] === 'custom-nameplate').props.children, 'Past participant');
        editor.clickIcon(Check);
        editor.render();
        assert.deepEqual(updates, [[1, 'past']]);
    });
}
