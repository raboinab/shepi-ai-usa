import { useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { FunctionCard } from '@/components/admin/FunctionCard';
import { useEdgeFunctionHealth } from '@/hooks/useEdgeFunctionHealth';

const CATEGORY_LABELS: Record<string, string> = {
  payments: 'Payments & Billing',
  quickbooks: 'QuickBooks Sync',
  documents: 'Document Processing',
  data: 'Data Storage',
  ai: 'AI & Insights',
  sheets: 'Export & Sheets',
  webhooks: 'Webhooks',
  misc: 'Miscellaneous',
};

const CATEGORY_ORDER = ['payments', 'quickbooks', 'documents', 'data', 'ai', 'sheets', 'webhooks', 'misc'];

export default function AdminDiagnostics() {
  const {
    results,
    isChecking,
    lastFullCheck,
    checkAllFunctions,
    getStats,
    getByCategory,
    functionCount,
  } = useEdgeFunctionHealth();

  // Run initial check on mount
  useEffect(() => {
    if (results.length === 0) {
      checkAllFunctions();
    }
  }, []);

  const stats = getStats();
  const byCategory = getByCategory();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backend Diagnostics</h1>
          <p className="text-muted-foreground">
            Monitor and test all {functionCount} backend functions
          </p>
        </div>
        <Button onClick={checkAllFunctions} disabled={isChecking}>
          {isChecking ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Test All Functions
            </>
          )}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployed</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deployed}/{stats.total}</div>
            <p className="text-xs text-muted-foreground">Functions responding</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errors}</div>
            <p className="text-xs text-muted-foreground">Functions with issues</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Zap className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastFullCheck ? lastFullCheck.toLocaleTimeString() : 'Never'}</div>
            <p className="text-xs text-muted-foreground">{lastFullCheck ? lastFullCheck.toLocaleDateString() : 'Run a check'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Status Legend</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge>200/401/400</Badge>
              <span className="text-muted-foreground">Function deployed & responding</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">404</Badge>
              <span className="text-muted-foreground">Not deployed</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">5xx/0</Badge>
              <span className="text-muted-foreground">Server error</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">jwt</Badge>
              <span className="text-muted-foreground">User token required</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">api-key</Badge>
              <span className="text-muted-foreground">Service API key</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">webhook</Badge>
              <span className="text-muted-foreground">Signature validation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">public</Badge>
              <span className="text-muted-foreground">No auth needed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Functions by Category */}
      {isChecking && results.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
          <span className="ml-3 text-muted-foreground">Running health checks...</span>
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No results yet. Click "Test All Functions" to check backend health.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CATEGORY_ORDER.map((category) => {
            const functions = byCategory[category] || [];
            if (functions.length === 0) return null;
            
            const deployedCount = functions.filter(f => f.deployed).length;
            const hasErrors = functions.some(f => f.statusCode >= 500 || f.statusCode === 0);
            
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {CATEGORY_LABELS[category] || category}
                    </CardTitle>
                    <Badge variant={hasErrors ? "destructive" : "outline"}>
                      {deployedCount}/{functions.length}
                    </Badge>
                  </div>
                  <CardDescription>
                    {functions.length} function{functions.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {functions.map((func) => (
                    <FunctionCard key={func.name} func={func} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
