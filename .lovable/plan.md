Plan: Add FeedbackBar widget script to `index.html`

1. Insert the provided widget script just before the closing `</body>` tag in `index.html`:
   ```html
   <script src="https://cdn.feedbackbar.io/widget.js" data-widget="wgt3k0pmzj7l" async></script>
   ```
2. Keep the existing Vite module script and all other head/body elements unchanged.
3. Verify the change by running the build to confirm `index.html` remains valid and the app boots normally.