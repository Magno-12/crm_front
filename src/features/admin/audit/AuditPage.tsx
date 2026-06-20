import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { listAudit } from '@/features/admin/api/admin.api';
import { formatDate } from '@/lib/utils';

export function AuditPage() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const debouncedAction = useDebounce(action, 300);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-audit', { action: debouncedAction, page }],
    queryFn: () => listAudit({ action: debouncedAction || undefined, page, page_size: 30 }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground">Registro inmutable de acciones del sistema.</p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filtrar por acción (ej. auth.login)…"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="pl-9"
          aria-label="Filtrar auditoría"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} columns={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={<ScrollText />} title="Sin registros" />
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acción</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Badge variant="outline">{a.action}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.resource_type}
                      {a.resource_id ? ` · ${a.resource_id.slice(0, 8)}` : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.ip_address ?? '—'}</TableCell>
                    <TableCell>{formatDate(a.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{data.total} registros</span>
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
        </>
      )}
    </div>
  );
}
