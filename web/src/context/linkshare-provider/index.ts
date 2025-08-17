// File: src/components/LinkShareProvider.tsx
// This file defines a self-contained LinkShareProvider that manages the dialog state,
// renders a built-in LinkShareDialog component, and provides a useLinkShare hook for triggering it.
// You can import and wrap your app with <LinkShareProvider> to make useLinkShare() available everywhere.
// Usage: const { shareLink } = useLinkShare(); shareLink("Title", "Description", "https://example.com");

export { default as LinkShareProvider } from './linkshare-provider';
export { useLinkShare } from './useShareLink';


