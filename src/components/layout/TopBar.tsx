import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, User as UserIcon, Monitor, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

interface TopBarProps {
  onOpenMobileNav: () => void;
}

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const initials = (user?.full_name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system'] as const;
    const next = order[(order.indexOf(theme) + 1) % order.length] ?? 'system';
    setTheme(next);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      {user?.last_login_at && (
        <span
          className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground sm:flex"
          title="Fecha y hora de su ingreso a la plataforma"
        >
          <Clock className="h-3.5 w-3.5" /> Ingreso: {formatDateTime(user.last_login_at)}
        </span>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        aria-label={`Tema: ${theme}`}
        title={`Tema: ${theme}`}
      >
        {theme === 'system' ? (
          <Monitor className="h-5 w-5" />
        ) : resolvedTheme === 'dark' ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Menú de usuario"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initials}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate">{user?.full_name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user?.email}
              </span>
              {user?.last_login_at && (
                <span className="mt-1 flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Clock className="h-3 w-3" /> Ingreso: {formatDateTime(user.last_login_at)}
                </span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/change-password')}>
            <UserIcon className="h-4 w-4" />
            Cambiar contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
