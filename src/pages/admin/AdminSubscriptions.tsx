import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AdminSubscriptions() {
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000000);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'canceled':
        return 'destructive';
      case 'past_due':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Subscriptions</h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period Start</TableHead>
              <TableHead>Period End</TableHead>
              <TableHead>Stripe Customer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No subscriptions found
                </TableCell>
              </TableRow>
            ) : (
              subscriptions?.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.plan_type}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(sub.status)}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sub.current_period_start
                      ? format(new Date(sub.current_period_start), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {sub.current_period_end
                      ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {sub.stripe_customer_id || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
