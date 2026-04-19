import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "./components/system/AppErrorBoundary.tsx";
import "./index.css";

// Pre-React OAuth interception - runs BEFORE React mounts
// Catches OAuth tokens that land on wrong paths and redirects to /auth/callback
if (window.location.hash.includes('access_token=') || window.location.hash.includes('error=')) {
  const hash = window.location.hash;
  const currentPath = window.location.pathname;
  
  // If we have OAuth tokens but aren't on the callback page, redirect immediately
  if (currentPath !== '/auth/callback') {
    console.log('[OAuth Bootstrap] Detected OAuth hash on path:', currentPath, '- redirecting to /auth/callback');
    window.location.href = '/auth/callback' + hash;
    // Stop further execution - the page will reload at the correct path
    throw new Error('Redirecting to OAuth callback');
  }
}

// Global error handlers to catch errors before React mounts
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
});

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
