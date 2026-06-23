import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, ShieldCheck, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Can } from '@/components/auth/Can';
import {
  deleteObligation,
  getTaxSummary,
  listObligations,
  markObligation,
} from '@/features/tax/api/tax.api';
import { TAX_TYPES, semaforoMeta, taxTypeLabel } from '@/features/tax/lib/meta';
import { TaxFormDialog } from '@/features/tax/components/TaxFormDialog';
import { apiErrorMessage } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';

export function TaxObligationsPage() {
  const qc = useQueryClient();
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);

  const summary = useQuery({ queryKey: ['tax', 'summary'], queryFn: getTaxSummary });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tax', 'list', { type, status }],
    queryFn: () =>
      listObligations({
        type: type === 'all' ? undefined : type,
        status: status === 'all' ? undefined : status,
      }),
  });

  const mark = useMutation({
    mutationFn: ({ id, s }: { id: string; s: 'pendiente' | 'cumplida' }) => markObligation(id, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const del = useMutation({
    mutationFn: deleteObligation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax'] });
      toast.success('Obligación eliminada');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Obligaciones tributarias</h1>
          <p className="text-sm text-muted-foreground">
            Control de vencimientos con semáforo por cliente.
          </p>
        </div>
        <Can code="tax.create">
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva obligación
          </Button>
        </Can>
      </header>

      {/* Semáforo resumen */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryChip label="Vencidas" value={summary.data?.vencidas ?? 0} dot="bg-destructive" />
        <SummaryChip label="Próximas a vencer" value={summary.data?.proximas ?? 0} dot="bg-warning" />
        <SummaryChip label="Cumplidas" value={summary.data?.cumplidas ?? 0} dot="bg-success" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-64" aria-label="Filtrar por tipo">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {TAX_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {taxTypeLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="cumplida">Cumplidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck />}
          title="Sin obligaciones"
          description="Registra las obligaciones tributarias de tus clientes para controlarlas."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Obligación</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Semáforo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((o) => {
                const meta = semaforoMeta(o.semaforo);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.client_name ?? '—'}</TableCell>
                    <TableCell>{taxTypeLabel(o.type)}</TableCell>
                    <TableCell className="text-muted-foreground">{o.period}</TableCell>
                    <TableCell>
                      {formatDate(o.due_date)}
                      {o.status === 'pendiente' && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({o.days_to_due < 0 ? `+${-o.days_to_due}d` : `${o.days_to_due}d`})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Can code="tax.edit">
                        {o.status === 'pendiente' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => mark.mutate({ id: o.id, s: 'cumplida' })}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Cumplir
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => mark.mutate({ id: o.id, s: 'pendiente' })}
                          >
                            <RotateCcw className="h-4 w-4" /> Reabrir
                          </Button>
                        )}
                      </Can>
                      <Can code="tax.delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => del.mutate(o.id)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <TaxFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

function SummaryChip({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={cn('h-3 w-3 rounded-full', dot)} />
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
