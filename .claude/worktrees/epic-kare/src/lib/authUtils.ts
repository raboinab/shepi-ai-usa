/**
 * OAuth callback utilities to prevent 412 "Precondition Failed" errors
 * and ensure tokens are properly processed from URL hash.
 */

import { supabase } from "@/integrations/supabase/client";

const OAUTH_PROCESSED_KEY = 'shepi_oauth_processed';
const OAUTH_PROCESSED_TIMESTAMP_KEY = 'shepi_oauth_processed_ts';
const PROCESSING_WINDOW_MS = 10000; // 10 seconds - tokens should be processed within this window

/**
 * Check if there's an OAuth callback in the URL hash.
 * This function detects access_token in hash but does NOT clear it.
 * 
 * @returns Object with hasCallback (whether OAuth tokens were found)
 */
export function hasOAuthCallback(): boolean {
  return window.location.hash.includes('access_token');
}

/**
 * Parse OAuth tokens from URL hash.
 * @returns Object with access_token and refresh_token, or null if not found
 */
export function parseHashTokens(): { access_token: string; refresh_token: string } | null {
  const hash = window.location.hash;
  if (!hash.includes('access_token')) {
    return null;
  }

  try {
    // Remove the leading # and parse as URLSearchParams
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      console.log('[Auth] Parsed tokens from URL hash');
      return { access_token, refresh_token };
    }
    
    console.warn('[Auth] Hash contains access_token but parsing failed');
    return null;
  } catch (error) {
    console.error('[Auth] Error parsing hash tokens:', error);
    return null;
  }
}

/**
 * Attempt to set session from URL hash tokens using setSession().
 * This is the nuclear option when Supabase's automatic token detection fails.
 * 
 * @returns Object with success status and optional error
 */
export async function trySetSessionFromUrlHash(): Promise<{
  success: boolean;
  hasHash: boolean;
  error?: string;
}> {
  const tokens = parseHashTokens();
  
  if (!tokens) {
    return { success: false, hasHash: hasOAuthCallback() };
  }

  // Check if we already processed these tokens recently
  const processedToken = sessionStorage.getItem(OAUTH_PROCESSED_KEY);
  const processedTimestamp = sessionStorage.getItem(OAUTH_PROCESSED_TIMESTAMP_KEY);
  const tokenFingerprint = tokens.access_token.slice(-20); // Last 20 chars as identifier

  if (processedToken === tokenFingerprint && processedTimestamp) {
    const elapsed = Date.now() - parseInt(processedTimestamp, 10);
    if (elapsed < PROCESSING_WINDOW_MS) {
      console.log('[Auth] Tokens already being processed, skipping duplicate');
      return { success: false, hasHash: true, error: 'already_processing' };
    }
  }

  // Mark as processing
  sessionStorage.setItem(OAUTH_PROCESSED_KEY, tokenFingerprint);
  sessionStorage.setItem(OAUTH_PROCESSED_TIMESTAMP_KEY, Date.now().toString());

  console.log('[Auth] Attempting setSession with parsed tokens');

  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    if (error) {
      console.error('[Auth] setSession failed:', error.message);
      // Clear the processing flag on error so retry is possible
      clearOAuthProcessedFlag();
      return { success: false, hasHash: true, error: error.message };
    }

    if (data.session?.user) {
      console.log('[Auth] setSession success:', data.session.user.email);
      cleanupOAuthHash();
      return { success: true, hasHash: true };
    }

    console.warn('[Auth] setSession returned no session');
    clearOAuthProcessedFlag();
    return { success: false, hasHash: true, error: 'no_session_returned' };
  } catch (err) {
    console.error('[Auth] setSession exception:', err);
    clearOAuthProcessedFlag();
    return { 
      success: false, 
      hasHash: true, 
      error: err instanceof Error ? err.message : 'unknown_error' 
    };
  }
}

/**
 * Legacy function - checks for OAuth hash but with improved logic.
 * Kept for backward compatibility.
 * 
 * @returns Object with hasCallback and shouldProcess
 */
export function handleOAuthHash(): { hasCallback: boolean; shouldProcess: boolean } {
  const hasHash = hasOAuthCallback();
  
  if (!hasHash) {
    return { hasCallback: false, shouldProcess: false };
  }
  
  console.log('[Auth] OAuth callback detected in URL');
  
  // Check if we're already processing
  const processedTimestamp = sessionStorage.getItem(OAUTH_PROCESSED_TIMESTAMP_KEY);
  if (processedTimestamp) {
    const elapsed = Date.now() - parseInt(processedTimestamp, 10);
    if (elapsed < PROCESSING_WINDOW_MS) {
      console.log('[Auth] OAuth tokens being processed, waiting for completion');
      return { hasCallback: true, shouldProcess: false };
    }
  }
  
  return { hasCallback: true, shouldProcess: true };
}

/**
 * Clean up OAuth hash from URL after session is established.
 * Call this AFTER the session is confirmed.
 */
export function cleanupOAuthHash(): void {
  if (window.location.hash.includes('access_token')) {
    console.log('[Auth] Cleaning up OAuth hash from URL');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

/**
 * Clear the OAuth processed flags.
 * Call this on sign-out to allow fresh OAuth flow.
 */
export function clearOAuthProcessedFlag(): void {
  sessionStorage.removeItem(OAUTH_PROCESSED_KEY);
  sessionStorage.removeItem(OAUTH_PROCESSED_TIMESTAMP_KEY);
}

/**
 * Check if a 412 error occurred and handle recovery.
 * @param error - The error from Supabase
 * @returns true if it was a 412 error that was handled
 */
export function handle412Error(error: Error | null): boolean {
  if (!error) return false;
  
  const is412 = error.message?.includes('412') || 
                error.message?.includes('Precondition Failed') ||
                (error as any)?.status === 412;
  
  if (is412) {
    console.warn('[Auth] 412 error detected, clearing OAuth state');
    clearOAuthProcessedFlag();
    cleanupOAuthHash();
    return true;
  }
  
  return false;
}
