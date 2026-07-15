/**
 * Bank / credit-card account normalization helpers.
 *
 * Source of truth lives in `supabase/functions/_shared/bankAccountNormalization.ts`
 * so the enrich-document edge function and the client agree on canonical
 * institution/account-label strings and grouping keys.
 *
 * This file re-exports for browser use.
 */
export {
  bankAccountGroupKey,
  canonicalIssuer,
  extractLast4,
  issuerFromFilename,
  last4FromFilename,
  normalizeAccountLabel,
  normalizeInstitution,
  parsePeriodFromFilename,
  stripCompanyFromInstitution,
} from "../../supabase/functions/_shared/bankAccountNormalization";
