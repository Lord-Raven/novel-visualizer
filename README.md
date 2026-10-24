# novel-visualizer
A VN skit component for React. Uses Framer Motion. Intended for use in Chub.ai stages, but I guess I'll be agnostic about it.

## Additional action buttons

Pass `additionalActionButtons` to `NovelVisualizer` to render custom React nodes
to the left of the edit/reroll buttons:

```tsx
<NovelVisualizer
    {...visualizerProps}
    additionalActionButtons={
        <>
            <button onClick={handleBookmark}>Bookmark</button>
            <button onClick={handleShare}>Share</button>
        </>
    }
/>
```

The buttons share the action row's layout spacing, including in vertical layouts,
and remain visible while editing. `hideActionButtons` hides the entire row,
including custom buttons; `enableReroll` only controls the built-in reroll button.
Custom buttons control their own styling, event handlers, and disabled state
(including during loading). Omit the prop to preserve the default controls.
