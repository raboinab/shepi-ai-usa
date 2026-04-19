import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FunctionHealth {
  name: string;
  deployed: boolean;
  statusCode: number;
  responseTimeMs: number;
  authType: 'jwt' | 'api-key' | 'webhook' | 'public';
  category: 'payments' | 'quickbooks' | 'documents' | 'ai' | 'sheets' | 'webhooks' | 'data' | 'misc';
  lastChecked: Date;
  error?: string;
}

// Function definitions with expected auth types
const FUNCTION_DEFINITIONS: Omit<FunctionHealth, 'deployed' | 'statusCode' | 'responseTimeMs' | 'lastChecked' | 'error'>[] = [
  // Payments (4)
  { name: 'check-subscription', authType: 'jwt', category: 'payments' },
  { name: 'create-checkout', authType: 'jwt', category: 'payments' },
  { name: 'customer-portal', authType: 'jwt', category: 'payments' },
  { name: 'stripe-webhook', authType: 'webhook', category: 'webhooks' },
  
  // QuickBooks (8)
  { name: 'trigger-qb-sync', authType: 'jwt', category: 'quickbooks' },
  { name: 'qb-sync-complete', authType: 'api-key', category: 'quickbooks' },
  { name: 'complete-qb-sync', authType: 'api-key', category: 'quickbooks' },
  { name: 'check-workflow-health', authType: 'jwt', category: 'quickbooks' },
  { name: 'get-qb-credentials', authType: 'api-key', category: 'quickbooks' },
  { name: 'refresh-qb-token', authType: 'jwt', category: 'quickbooks' },
  { name: 'proactive-qb-refresh', authType: 'api-key', category: 'quickbooks' },
  { name: 'process-quickbooks-file', authType: 'jwt', category: 'quickbooks' },
  
  // Documents (8)
  { name: 'extract-document-text', authType: 'jwt', category: 'documents' },
  { name: 'process-statement', authType: 'jwt', category: 'documents' },
  { name: 'validate-document-type', authType: 'jwt', category: 'documents' },
  { name: 'validate-financial-statement', authType: 'jwt', category: 'documents' },
  { name: 'process-payroll-document', authType: 'jwt', category: 'documents' },
  { name: 'process-fixed-assets', authType: 'jwt', category: 'documents' },
  { name: 'process-debt-schedule', authType: 'jwt', category: 'documents' },
  { name: 'process-material-contract', authType: 'jwt', category: 'documents' },
  
  // Data Storage (4)
  { name: 'processed-data-create', authType: 'jwt', category: 'data' },
  { name: 'processed-data-list', authType: 'jwt', category: 'data' },
  { name: 'processed-data-get-by-document', authType: 'jwt', category: 'data' },
  { name: 'db-proxy', authType: 'api-key', category: 'data' },
  
  // AI/Insights (4)
  { name: 'insights-chat', authType: 'jwt', category: 'ai' },
  { name: 'validate-adjustment-proof', authType: 'jwt', category: 'ai' },
  { name: 'embed-qoe-book', authType: 'jwt', category: 'ai' },
  { name: 'embed-rag-chunks', authType: 'jwt', category: 'ai' },
  
  // Sheets (3)
  { name: 'create-project-sheet', authType: 'jwt', category: 'sheets' },
  { name: 'sync-sheet', authType: 'jwt', category: 'sheets' },
  { name: 'parse-cim', authType: 'jwt', category: 'sheets' },
  
  // Webhooks (1 - stripe-webhook already in payments)
  { name: 'docuclipper-webhook', authType: 'webhook', category: 'webhooks' },
  
  // Misc (3)
  { name: 'submit-contact', authType: 'public', category: 'misc' },
  { name: 'parse-tax-return', authType: 'jwt', category: 'documents' },
  { name: 'analyze-transactions', authType: 'jwt', category: 'ai' },
];

// Minimal payloads to avoid 500 errors on health checks
const getPayloadForFunction = (funcName: string) => {
  switch (funcName) {
    case 'trigger-qb-sync':
      return { project_id: 'health-check-dummy-id' };
    case 'create-checkout':
      return { planType: 'monthly' };
    case 'process-quickbooks-file':
    case 'extract-document-text':
    case 'process-statement':
    case 'process-payroll-document':
    case 'process-fixed-assets':
    case 'process-debt-schedule':
    case 'process-material-contract':
    case 'validate-document-type':
    case 'validate-financial-statement':
    case 'processed-data-get-by-document':
    case 'analyze-transactions':
    case 'parse-cim':
      return { documentId: 'health-check-dummy-id', projectId: 'health-check-dummy-id' };
    case 'create-project-sheet':
    case 'sync-sheet':
    case 'refresh-qb-token':
    case 'processed-data-list':
      return { project_id: 'health-check-dummy-id' };
    case 'check-workflow-health':
      return { project_id: 'health-check-dummy-id' };
    case 'processed-data-create':
      return { 
        project_id: 'health-check-dummy-id', 
        source_type: 'health_check', 
        data_type: 'health_check', 
        data: {} 
      };
    case 'validate-adjustment-proof':
      return { 
        adjustmentId: 'dummy', 
        adjustment: { description: 'test', category: 'test', amount: 0, status: 'test', notes: '' },
        documentIds: ['dummy'], 
        projectId: 'dummy' 
      };
    case 'embed-qoe-book':
    case 'embed-rag-chunks':
      return { chunks: [], source: 'health-check' }; // Empty chunks might still fail validation but should be 400
    case 'insights-chat':
      return { messages: [{ role: 'user', content: 'health check' }] };
    case 'submit-contact':
      return { name: 'Health Check', email: 'test@example.com', message: 'Health check' };
    default:
      return {};
  }
};

export function useEdgeFunctionHealth() {
  const [results, setResults] = useState<FunctionHealth[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null);

  const checkFunction = useCallback(async (funcDef: typeof FUNCTION_DEFINITIONS[0]): Promise<FunctionHealth> => {
    const startTime = Date.now();
    
    try {
      // Get the session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      // For public functions, just call directly
      // For JWT functions, include auth header
      // For API-key functions, expect 401 (we don't have the key)
      // For webhooks, expect 400/401 (no signature)
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (funcDef.authType === 'jwt' && session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Use GET for functions that support it (like db-proxy health check)
      const method = ['db-proxy', 'proactive-qb-refresh'].includes(funcDef.name) ? 'GET' : 'POST';
      const body = method === 'POST' ? JSON.stringify(getPayloadForFunction(funcDef.name)) : undefined;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${funcDef.name}`,
        {
          method,
          headers,
          body,
        }
      );
      
      const responseTimeMs = Date.now() - startTime;
      
      // 404 means not deployed
      // Any other status means deployed (even errors)
      const deployed = response.status !== 404;
      
      // Consider it "healthy" if it's 2xx, or 400/401/403 (means it's running but rejected input/auth)
      // 500s are actual errors
      
      return {
        ...funcDef,
        deployed,
        statusCode: response.status,
        responseTimeMs,
        lastChecked: new Date(),
        error: deployed ? undefined : 'Function not found (404)',
      };
    } catch (error) {
      return {
        ...funcDef,
        deployed: false,
        statusCode: 0,
        responseTimeMs: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }, []);

  const checkAllFunctions = useCallback(async () => {
    setIsChecking(true);
    
    try {
      // Check all functions in parallel (batched to avoid overwhelming)
      const batchSize = 6;
      const allResults: FunctionHealth[] = [];
      
      for (let i = 0; i < FUNCTION_DEFINITIONS.length; i += batchSize) {
        const batch = FUNCTION_DEFINITIONS.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(checkFunction));
        allResults.push(...batchResults);
        
        // Update results progressively
        setResults([...allResults]);
      }
      
      setLastFullCheck(new Date());
      return allResults;
    } finally {
      setIsChecking(false);
    }
  }, [checkFunction]);

  const getStats = useCallback(() => {
    const deployed = results.filter(r => r.deployed).length;
    const total = FUNCTION_DEFINITIONS.length;
    const avgResponseTime = results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.responseTimeMs, 0) / results.length)
      : 0;
    const errors = results.filter(r => r.statusCode >= 500 || r.statusCode === 0).length;
    
    return { deployed, total, avgResponseTime, errors };
  }, [results]);

  const getByCategory = useCallback(() => {
    const categories: Record<string, FunctionHealth[]> = {};
    
    for (const result of results) {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result);
    }
    
    return categories;
  }, [results]);

  return {
    results,
    isChecking,
    lastFullCheck,
    checkAllFunctions,
    checkFunction,
    getStats,
    getByCategory,
    functionCount: FUNCTION_DEFINITIONS.length,
  };
}