import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Trash2,
  BellRing,
  UserPlus,
} from 'lucide-react';
import { AlertsPage } from '@/features/alerts/pages/AlertsPage';
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
  getClientesSinControl,
  getTaxSummary,
  listObligations,
  markObligation,
} from '@/features/tax/api/tax.api';
import { TAX_TYPES, semaforoMeta, taxTypeLabel } from '@/features/tax/lib/meta';
import { TaxFormDialog } from '@/features/tax/components/TaxFormDialog';
import { apiErrorMessage } from '@/api/client';
import type { TaxObligationType } from '@/types/api';
import { cn, formatDate } from '@/lib/utils';

type Vista = 'obligaciones' | 'alertas';

/** Pestañas entre las obligaciones tributarias y las alertas comerciales. */
function VistaTabs({
  vista,
  setVista,
}: {
  vista: Vista;
  setVista: (v: Vista) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={vista === 'obligaciones' ? 'default' : 'outline'}
        onClick={() => setVista('obligaciones')}
      >
        <ShieldCheck className="h-4 w-4" /> Obligaciones
      </Button>
      <Button
        size="sm"
        variant={vista === 'alertas' ? 'default' : 'outline'}
        onClick={() => setVista('alertas')}
      >
        <BellRing className="h-4 w-4" /> Alertas
      </Button>
    </div>
  );
}

export function TaxObligationsPage() {
  const qc = useQueryClient();
  const [vista, setVista] = useState<Vista>('obligaciones');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [preset, setPreset] = useState<
    { client_id: string; type: TaxObligationType } | undefined
  >();

  const summary = useQuery({ queryKey: ['tax', 'summary'], queryFn: getTaxSummary });
  const sinControl = useQuery({
    queryKey: ['tax', 'sin-control'],
    queryFn: getClientesSinControl,
  });
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

  if (vista === 'alertas') {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Obligaciones y alertas</h1>
            <p className="text-sm text-muted-foreground">
              Vencimientos tributarios y avisos comerciales en un solo lugar.
            </p>
          </div>
        </header>
        <VistaTabs vista={vista} setVista={setVista} />
        <AlertsPage embedded />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Obligaciones y alertas</h1>
          <p className="text-sm text-muted-foreground">
            Control de vencimientos con semáforo por cliente.
          </p>
        </div>
        <Can code="tax.create">
          <Button
            onClick={() => {
              setPreset(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nueva obligación
          </Button>
        </Can>
      </header>

      <VistaTabs vista={vista} setVista={setVista} />

      {/* Semáforo resumen */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryChip label="Vencidas" value={summary.data?.vencidas ?? 0} dot="bg-destructive" />
        <SummaryChip label="Próximas a vencer" value={summary.data?.proximas ?? 0} dot="bg-warning" />
        <SummaryChip label="Cumplidas" value={summary.data?.cumplidas ?? 0} dot="bg-success" />
      </div>

      {sinControl.data && sinControl.data.length > 0 && (
        <Card className="border-warning/60 bg-warning/5">
          <CardContent className="space-y-3 pt-5">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <UserPlus className="h-4 w-4 text-warning" />
                Clientes con contrato sin control tributario
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Al fidelizar un cliente la firma asume el control de sus impuestos. Estos ya
                tienen contrato pero todavía no se les registró ninguna obligación: haga clic en
                la que corresponda para crearla con el cliente ya seleccionado.
              </p>
            </div>
            <ul className="space-y-2">
              {sinControl.data.map((c) => (
                <li
                  key={c.client_id}
                  className="flex flex-col gap-2 rounded-md border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.razon_social}</p>
                    <p className="text-xs text-muted-foreground">NIT {c.nit}</p>
                  </div>
                  <Can code="tax.create">
                    <div className="flex flex-wrap gap-1.5">
                      {c.sugeridas.map((t) => (
                        <Button
                          key={t}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            setPreset({ client_id: c.client_id, type: t as TaxObligationType });
                            setFormOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3" /> {taxTypeLabel(t)}
                        </Button>
                      ))}
                    </div>
                  </Can>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

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

      <TaxFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setPreset(undefined);
        }}
        preset={preset}
      />
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
