import { NavLink } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { NAV_SECTIONS } from './nav';

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const { user } = useAuth();
  const can = (perm?: string) => !perm || (user?.permissions.includes(perm) ?? false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 top-0 h-full max-w-[80vw] translate-x-0 translate-y-0 rounded-none border-r sm:rounded-none">
        <DialogTitle className="mb-2">Menú</DialogTitle>
        <nav className="space-y-4">
          {NAV_SECTIONS.map((section, i) => {
            const visible = section.items.filter((item) => can(item.permission));
            if (visible.length === 0) return null;
            return (
              <div key={i}>
                {section.title && (
                  <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </p>
                )}
                <ul className="space-y-1">
                  {visible.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === '/'}
                          onClick={() => onOpenChange(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-accent hover:text-accent-foreground',
                            )
                          }
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
