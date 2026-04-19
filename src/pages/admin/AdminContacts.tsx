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
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export default function AdminContacts() {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Contact Submissions</h1>

      <div className="rounded-md border">
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No contact submissions yet
                </TableCell>
              </TableRow>
            ) : (
              contacts?.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{(contact as any).role || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{(contact as any).interest || '—'}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Message from {contact.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{contact.email}</p>
                          </div>
                          {(contact as any).company && (
                            <div>
                              <p className="text-sm text-muted-foreground">Company</p>
                              <p className="font-medium">{(contact as any).company}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            {(contact as any).role && (
                              <div>
                                <p className="text-sm text-muted-foreground">Role</p>
                                <p className="font-medium">{(contact as any).role}</p>
                              </div>
                            )}
                            {(contact as any).interest && (
                              <div>
                                <p className="text-sm text-muted-foreground">Interest</p>
                                <p className="font-medium">{(contact as any).interest}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Message</p>
                            <p className="whitespace-pre-wrap">{contact.message}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Submitted</p>
                            <p>{format(new Date(contact.created_at), 'PPpp')}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
