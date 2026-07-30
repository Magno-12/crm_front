import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';

/** Minutos de inactividad antes de cerrar la sesión automáticamente. */
const IDLE_MINUTES = 30;
/** Minutos antes del cierre en que se muestra el aviso para extender la sesión. */
const WARN_BEFORE_MINUTES = 1;

const IDLE_MS = IDLE_MINUTES * 60_000;
const WARN_MS = IDLE_MS - WARN_BEFORE_MINUTES * 60_000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'wheel',
  'scroll',
  'touchstart',
];

/**
 * Cierra la sesión tras IDLE_MINUTES sin actividad (control de sesiones).
 * Un minuto antes muestra un aviso con la opción de seguir conectado.
 */
export function useIdleLogout() {
  const { user, logout } = useAuth();
  const warnTimer = useRef<number | undefined>(undefined);
  const logoutTimer = useRef<number | undefined>(undefined);
  const warnToastId = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    if (!user) return;

    const clearTimers = () => {
      window.clearTimeout(warnTimer.current);
      window.clearTimeout(logoutTimer.current);
      if (warnToastId.current !== undefined) {
        toast.dismiss(warnToastId.current);
        warnToastId.current = undefined;
      }
    };

    const arm = () => {
      clearTimers();
      warnTimer.current = window.setTimeout(() => {
        warnToastId.current = toast.warning('Tu sesión se cerrará por inactividad', {
          description: `Se cerrará en ${WARN_BEFORE_MINUTES} minuto. ¿Sigues ahí?`,
          duration: WARN_BEFORE_MINUTES * 60_000,
          action: { label: 'Seguir conectado', onClick: () => arm() },
        });
      }, WARN_MS);
      logoutTimer.current = window.setTimeout(() => {
        clearTimers();
        void logout().finally(() => {
          toast.info('Sesión cerrada por inactividad', {
            description: 'Vuelve a iniciar sesión para continuar.',
          });
        });
      }, IDLE_MS);
    };

    // Reinicia el contador con cualquier actividad (limitado a 1 vez por segundo).
    let last = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - last < 1000) return;
      last = now;
      arm();
    };

    arm();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [user, logout]);
}
