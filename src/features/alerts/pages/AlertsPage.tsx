import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BellRing,
  Clock,
  FileWarning,
  UserX,
  ShieldAlert,
  Send,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/common/states';
import { CardGridSkeleton } from '@/components/common/table-skeleton';
import { Can } from '@/components/auth/Can';
import {
  getAlerts,
  sendAlertsDigest,
  sendAlertsDigestToMe,
} from '@/features/alerts/api/alerts.api';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import type { Alert } from '@/types/api';

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof Clock; to: (id: string) => string | null }
> = {
  sin_seguimiento: {
    label: 'Sin seguimiento',
    icon: Clock,
    to: (id) => `/prospects/${id}`,
  },
  propuesta_estancada: {
    label: 'Propuesta sin respuesta',
    icon: FileWarning,
    to: (id) => `/prospects/${id}`,
  },
  cliente_sin_contacto: { label: 'Cliente sin contacto', icon: UserX, to: (id) => `/clients/${id}` },
  obligacion: { label: 'Obligación tributaria', icon: ShieldAlert, to: () => '/tax' },
};

export function AlertsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });
  const navigate = useNavigate();

  const digest = useMutation({
    mutationFn: (soloYo: boolean) =>
      soloYo ? sendAlertsDigestToMe() : sendAlertsDigest(),
    onSuccess: (res) => {
      if (res.sent === 0) {
        toast.info('No había alertas para enviar.');
        return;
      }
      toast.success(
        `Resumen enviado a ${res.sent} asesor(es) con ${res.total_alerts} alerta(s).`,
      );
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alertas</h1>
          <p className="text-sm text-muted-foreground">
            Automatización comercial: lo que requiere tu atención hoy.
          </p>
        </div>
        <Can code="users.view">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={digest.isPending}
              onClick={() => digest.mutate(true)}
              title="Envía el resumen solo a tu correo (prueba)"
            >
              {digest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviarme el resumen
            </Button>
            <Button
              disabled={digest.isPending}
              onClick={() => digest.mutate(false)}
              title="Envía a cada asesor las alertas de sus prospectos y clientes"
            >
              {digest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar a los asesores
            </Button>
          </div>
        </Can>
      </header>

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.alerts.length === 0 ? (
        <EmptyState
          icon={<BellRing />}
          title="Todo al día"
          description="No hay alertas pendientes. Cuando algo requiera seguimiento, aparecerá aquí."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <Card key={key}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="text-xl font-bold leading-none">{data.counts[key] ?? 0}</p>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-2">
            {data.alerts.map((a: Alert, i: number) => {
              const meta = CATEGORY_META[a.category];
              const Icon = meta?.icon ?? BellRing;
              const link = meta?.to(a.entity_id) ?? null;
              return (
                <Card
                  key={i}
                  className={cn(
                    'transition-shadow',
                    link && 'cursor-pointer hover:shadow-elevated',
                  )}
                  onClick={() => link && navigate(link)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        a.severity === 'alta'
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-warning/15 text-warning',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="truncate text-sm text-muted-foreground">{a.detail}</p>
                    </div>
                    <Badge variant={a.severity === 'alta' ? 'destructive' : 'warning'}>
                      {a.severity === 'alta' ? 'Alta' : 'Media'}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
