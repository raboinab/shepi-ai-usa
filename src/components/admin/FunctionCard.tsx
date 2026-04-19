import { CheckCircle, XCircle, AlertCircle, Clock, Shield, Key, Globe, Webhook } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FunctionHealth } from '@/hooks/useEdgeFunctionHealth';

interface FunctionCardProps {
  func: FunctionHealth;
}

function getStatusIcon(func: FunctionHealth) {
  if (!func.deployed) {
    return <XCircle className="h-4 w-4 text-destructive" />;
  }
  if (func.statusCode >= 500 || func.statusCode === 0) {
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
  if (func.statusCode >= 400) {
    // 4xx is expected for auth-protected functions called without proper auth
    return <CheckCircle className="h-4 w-4 text-primary" />;
  }
  return <CheckCircle className="h-4 w-4 text-primary" />;
}

function getStatusLabel(func: FunctionHealth): string {
  if (!func.deployed) return 'Not Deployed';
  if (func.statusCode >= 500) return 'Server Error';
  if (func.statusCode === 401) return 'Auth Required';
  if (func.statusCode === 400) return 'Bad Request';
  if (func.statusCode === 200) return 'OK';
  return `${func.statusCode}`;
}

function getAuthIcon(authType: FunctionHealth['authType']) {
  switch (authType) {
    case 'jwt':
      return <Shield className="h-3 w-3" />;
    case 'api-key':
      return <Key className="h-3 w-3" />;
    case 'webhook':
      return <Webhook className="h-3 w-3" />;
    case 'public':
      return <Globe className="h-3 w-3" />;
  }
}

export function FunctionCard({ func }: FunctionCardProps) {
  const isHealthy = func.deployed && func.statusCode < 500 && func.statusCode !== 0;
  
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border",
        isHealthy ? "bg-card" : "bg-destructive/5 border-destructive/20"
      )}
    >
      <div className="flex items-center gap-3">
        {getStatusIcon(func)}
        <div>
          <div className="font-mono text-sm font-medium">{func.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs gap-1">
              {getAuthIcon(func.authType)}
              {func.authType}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {func.responseTimeMs}ms
            </span>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <Badge 
          variant={isHealthy ? "default" : "destructive"}
          className="text-xs"
        >
          {getStatusLabel(func)}
        </Badge>
        {func.error && (
          <div className="text-xs text-destructive mt-1 max-w-[150px] truncate">
            {func.error}
          </div>
        )}
      </div>
    </div>
  );
}
