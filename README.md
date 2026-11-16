# novel-visualizer
A VN skit component for React. Uses Framer Motion. Intended for use in Chub.ai stages, but I guess I'll be agnostic about it.

## Reassigning a message's speaker

While editing a message, the nameplate becomes a clickable control. Clicking it
opens a drop-up listing the names of every actor in the `actors` record,
plus a narrator option (using `narratorLabel` or "(Narrator)"). Present actors
appear first, followed by other actors who speak anywhere in the skit's script,
then the remaining actors; each group is sorted by name. The narrator stays at
the top. Custom nameplates keep their positioning while editing and are not
rendered in the options list. Selecting a name stages
the reassignment; it is applied when the edits are confirmed, setting the
entry's `speakerId` to the chosen actor's id (or clearing it for the narrator).

Provide the optional `onUpdateSpeaker(index, speakerId)` callback to handle the
reassignment externally (`speakerId` is `undefined` for the narrator); when
omitted, the local script entry is updated directly.

## Additional action buttons

Pass an array of `ActionButtonConfig` objects to `additionalActionButtons` to render
custom actions to the left of the edit/reroll buttons:

```tsx
<NovelVisualizer
    {...visualizerProps}
    additionalActionButtons={[
        {
            id: 'bookmark',
            label: 'Bookmark',
            content: <Bookmark />,
            onClick: handleBookmark
        },
        {
            id: 'share',
            label: 'Share',
            content: <Share />,
            onClick: handleShare,
            disabled: !canShare
        }
    ]}
/>
```

Each action needs a unique, stable `id`, a `label` (used for its accessible name
and the `setTooltip` callback), `content`, and an `onClick` callback. The content
can be a MUI icon or any other React node, but should not include another button.
`Bookmark` and `Share` above are icons imported from `@mui/icons-material`.
The `ActionButtonConfig` type is exported from the package.

NovelVisualizer wraps the content in a MUI `IconButton` with the same styling,
hover effects, haptic feedback, and compact layout sizing as the edit button.
MUI icons are sized automatically. Buttons are disabled while loading or when
their optional `disabled` flag is true.

Custom actions remain visible while editing. `hideActionButtons` hides the entire
row, including custom buttons; `enableReroll` only controls the built-in reroll
button. Omit the prop or pass an empty array to preserve the default controls.

## Read-only mode

Set `readOnly` to prevent the user from modifying the script: the built-in edit
and reroll buttons are hidden and the input field is removed, leaving the
continue button to fill the entire bottom bar. Navigation (arrows, chat log,
clicking to advance) still works, and custom `additionalActionButtons` remain
visible. Unlike `hideInput`, which removes the whole bottom bar, `readOnly`
keeps the continue button available.
