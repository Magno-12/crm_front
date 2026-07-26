import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { listSessions, type UserSession } from '@/features/admin/api/admin.api';
import { formatDateTime } from '@/lib/utils';

/** "2 h 15 min", "45 min", "menos de 1 min". */
function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return 'menos de 1 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const STATUS_META: Record<UserSession['status'], { label: string; variant: 'success' | 'secondary' | 'warning' }> = {
  activa: { label: 'En sesión', variant: 'success' },
  cerrada: { label: 'Cerrada', variant: 'secondary' },
  sin_cierre: { label: 'Sin cierre registrado', variant: 'warning' },
};

export function SessionsPage() {
  const [days, setDays] = useState('30');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-sessions', days, page],
    queryFn: () => listSessions({ days: Number(days), page, page_size: 50 }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sesiones</h1>
          <p className="text-sm text-muted-foreground">
            Control de acceso: quién entró a la plataforma, a qué hora, cuándo salió y cuánto
            estuvo.
          </p>
        </div>
        <Select
          value={days}
          onValueChange={(v) => {
            setDays(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48" aria-label="Período">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Clock />}
          title="Sin sesiones en el período"
          description="Cuando los usuarios entren a la plataforma, aquí verás sus sesiones."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Tiempo en la plataforma</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((s, i) => {
                const meta = STATUS_META[s.status];
                return (
                  <TableRow key={`${s.user_id}-${s.login_at}-${i}`}>
                    <TableCell>
                      <div className="font-medium">{s.full_name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{s.email ?? ''}</div>
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatDateTime(s.login_at)}
                    </TableCell>
                    <TableCell>
                      {s.logout_at ? formatDateTime(s.logout_at) : '—'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatDuration(s.duration_seconds)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.ip_address ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        La salida queda registrada al cerrar sesión o por el cierre automático tras 15 minutos
        de inactividad. «Sin cierre registrado» significa que el usuario cerró el navegador de
        golpe y no se alcanzó a registrar la hora de salida.
      </p>

      {data && data.total > 50 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data.total} sesiones</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_prev}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_next}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
