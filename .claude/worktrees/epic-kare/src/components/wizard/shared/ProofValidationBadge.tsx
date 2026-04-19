import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, Clock, HelpCircle } from "lucide-react";

interface ProofValidationBadgeProps {
  score: number | null;
  status: 'validated' | 'supported' | 'partial' | 'insufficient' | 'contradictory' | 'pending';
  keyFindings?: string[];
  redFlags?: string[];
}

export const ProofValidationBadge = ({ score, status, keyFindings = [], redFlags = [] }: ProofValidationBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'validated':
        return {
          label: 'Validated',
          icon: CheckCircle2,
          className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20',
          description: 'Strong documentation fully supports this adjustment'
        };
      case 'supported':
        return {
          label: 'Supported',
          icon: CheckCircle2,
          className: 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20',
          description: 'Good documentation with minor gaps'
        };
      case 'partial':
        return {
          label: 'Partial',
          icon: AlertTriangle,
          className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20',
          description: 'Some support but significant gaps exist'
        };
      case 'insufficient':
        return {
          label: 'Insufficient',
          icon: XCircle,
          className: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20',
          description: 'Documentation does not adequately support the claim'
        };
      case 'contradictory':
        return {
          label: 'Contradictory',
          icon: AlertCircle,
          className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
          description: 'Documentation contradicts the claimed adjustment'
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          icon: Clock,
          className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
          description: 'Awaiting validation'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const tooltipContent = (
    <div className="space-y-2 max-w-xs">
      <div className="font-medium">{config.description}</div>
      {score !== null && (
        <div className="text-sm">
          <span className="text-muted-foreground">Confidence Score:</span>{' '}
          <span className="font-medium">{score}/100</span>
        </div>
      )}
      {keyFindings.length > 0 && (
        <div className="text-sm">
          <div className="text-muted-foreground mb-1">Key Findings:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {keyFindings.slice(0, 3).map((finding, i) => (
              <li key={i} className="text-xs">{finding}</li>
            ))}
          </ul>
        </div>
      )}
      {redFlags.length > 0 && (
        <div className="text-sm">
          <div className="text-destructive mb-1">Red Flags:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {redFlags.slice(0, 3).map((flag, i) => (
              <li key={i} className="text-xs text-destructive">{flag}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`gap-1 cursor-help ${config.className}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
            {score !== null && <span className="ml-1 text-xs opacity-75">({score})</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="p-3">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
