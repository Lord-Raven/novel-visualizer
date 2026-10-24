# novel-visualizer
A VN skit component for React. Uses Framer Motion. Intended for use in Chub.ai stages, but I guess I'll be agnostic about it.

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
