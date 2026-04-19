import { Outlet } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Spinner } from '@/components/ui/spinner';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export function AdminLayout() {
  const { isAdmin, isLoading } = useAdminCheck();

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 bg-background">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm font-medium text-muted-foreground">Admin Portal</span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
