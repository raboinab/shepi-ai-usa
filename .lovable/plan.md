## Fix: Resource link clicks land mid-page instead of top

### Root cause
React Router doesn't reset scroll position on route changes. When a user scrolls down on `/resources`, then clicks a guide link, the new page renders but the window keeps the previous scroll offset.

### Changes

1. **Create `src/components/ScrollToTop.tsx`**
   - Subscribes to `useLocation().pathname`
   - On change, calls `window.scrollTo({ top: 0, left: 0, behavior: "instant" })`
   - If the new URL has a `#hash`, scrolls to that element instead (preserves anchor links)
   - Renders `null`

2. **Mount it in `src/App.tsx`**
   - Add `<ScrollToTop />` inside `<BrowserRouter>`, just above `<Routes>`, so it has router context

### Notes
- Same-page TOC anchor clicks (`<a href="#id">` without route change) keep working — the browser handles them natively and `useLocation` doesn't fire.
- "instant" behavior avoids a jarring smooth-scroll on every navigation.
