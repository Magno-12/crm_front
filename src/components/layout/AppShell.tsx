import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { HelpFab } from '@/components/help/HelpFab';

const STORAGE_KEY = 'sidebar-collapsed';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev));
      return !prev;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <HelpFab />
    </div>
  );
}
