import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';
import type { WorkflowStatus } from '@/types/workflow';
import { cn } from '@/lib/utils';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<WorkflowStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ReactNode;
}> = {
  pending: {
    label: 'Pending',
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
  },
  running: {
    label: 'Running',
    variant: 'default',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  completed: {
    label: 'Completed',
    variant: 'outline',
    icon: <CheckCircle2 className="h-3 w-3 text-primary" />,
  },
  failed: {
    label: 'Failed',
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'secondary',
    icon: <Ban className="h-3 w-3" />,
  },
};

export function WorkflowStatusBadge({ 
  status, 
  className,
  showIcon = true 
}: WorkflowStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge 
      variant={config.variant} 
      className={cn('gap-1', className)}
    >
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
}
