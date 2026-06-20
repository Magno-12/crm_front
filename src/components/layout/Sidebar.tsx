import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { NAV_SECTIONS } from './nav';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const can = (perm?: string) => !perm || (user?.permissions.includes(perm) ?? false);

  return (
    <aside
      className={cn(
        'hidden h-full flex-col border-r bg-card transition-all duration-200 lg:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-glow">
          <span className="text-base font-bold">C</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="truncate text-sm font-semibold">CRM Contable</span>
            <span className="truncate text-[11px] text-muted-foreground">y Tributario</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {NAV_SECTIONS.map((section, i) => {
          const visible = section.items.filter((item) => can(item.permission));
          if (visible.length === 0) return null;
          return (
            <div key={i}>
              {!collapsed && section.title && (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {visible.map((item) => (
                  <li key={item.to}>
                    <NavItemLink item={item} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}

function NavItemLink({
  item,
  collapsed,
}: {
  item: { label: string; to: string; icon: React.ComponentType<{ className?: string }> };
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'group/nav relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          isActive
            ? 'bg-primary/10 font-semibold text-primary shadow-soft'
            : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground',
          collapsed && 'justify-center px-0',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return link;
}
