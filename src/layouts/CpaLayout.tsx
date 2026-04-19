import { Outlet } from 'react-router-dom';
import { useCpaCheck } from '@/hooks/useCpaCheck';
import { Spinner } from '@/components/ui/spinner';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { CpaSidebar } from '@/components/cpa/CpaSidebar';

export function CpaLayout() {
  const { isCpa, isLoading } = useCpaCheck();

  if (isLoading || !isCpa) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <CpaSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground">CPA Portal</span>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default CpaLayout;
