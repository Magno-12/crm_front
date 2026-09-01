import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronRight, TrendingDown, Wallet } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState } from '@/components/common/states';
import { CardGridSkeleton } from '@/components/common/table-skeleton';
import { getClientPending, getPortfolio } from '@/features/payments/api/payments.api';
import { formatDate } from '@/lib/utils';
import { formatCOP, formatCompact } from '@/lib/utils';

/** Cartera de clientes: cuánto deben, cuánto está vencido y desde cuándo. */
export function CarteraPage() {
  // Cliente desplegado para ver el detalle de sus facturas pendientes.
  const [abierto, setAbierto] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
  });

  // El listado es de cobro: solo interesa quien efectivamente debe algo.
  const conSaldo = (data?.clientes ?? []).filter((c) => c.saldo > 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Cartera de clientes</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas por cobrar: qué debe cada cliente y desde hace cuánto.
        </p>
      </header>

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Cartera total</p>
                  <p className="text-xl font-semibold">{formatCOP(data.total)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <TrendingDown className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Vencida</p>
                  <p className="text-xl font-semibold text-destructive">
                    {formatCOP(data.vencido)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Al día</p>
                  <p className="text-xl font-semibold">{formatCOP(data.al_dia)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Primero el saldo por cliente: es lo que se consulta a diario. */}
          <Card>
            <CardHeader>
              <CardTitle>Cartera por cliente</CardTitle>
              <CardDescription>
                Solo los clientes con saldo pendiente. Abra la flecha para ver qué facturas debe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conSaldo.length === 0 ? (
                <EmptyState
                  icon={<Wallet />}
                  title="Ningún cliente debe"
                  description="Cuando quede una factura sin pagar, el cliente aparece aquí."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Cliente</TableHead>
                      <TableHead>NIT</TableHead>
                      <TableHead className="text-center">Facturas</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Vencido</TableHead>
                      <TableHead>Mora</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conSaldo.map((c) => {
                      const clave = c.client_id ?? c.nit ?? c.client_name ?? '';
                      const desplegado = abierto === clave;
                      return (
                        <Fragment key={clave}>
                          <TableRow
                            className="cursor-pointer"
                            onClick={() => setAbierto(desplegado ? null : clave)}
                          >
                            <TableCell className="text-muted-foreground">
                              {desplegado ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{c.client_name ?? '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{c.nit ?? '—'}</TableCell>
                            <TableCell className="text-center">{c.facturas}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCOP(c.saldo)}
                            </TableCell>
                            <TableCell className="text-right">
                              {c.vencido > 0 ? (
                                <span className="font-medium text-destructive">
                                  {formatCOP(c.vencido)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {c.dias_max > 0 ? (
                                <Badge variant={c.dias_max > 60 ? 'destructive' : 'warning'}>
                                  {c.dias_max} días
                                </Badge>
                              ) : (
                                <Badge variant="success">Al día</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {c.client_id && (
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link to={`/clients/${c.client_id}`}>Ver ficha</Link>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          {desplegado && c.client_id && (
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={8} className="bg-muted/30 p-0">
                                <FacturasDelCliente clientId={c.client_id} />
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cartera por edades</CardTitle>
              <CardDescription>Saldo vencido según los días transcurridos.</CardDescription>
            </CardHeader>
            <CardContent className="h-60">
              {data.total === 0 ? (
                <EmptyState
                  title="Sin cartera pendiente"
                  description="Todas las facturas emitidas están pagadas."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.antiguedad} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompact(v)} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      formatter={(v: number) => formatCOP(v)}
                    />
                    <Bar dataKey="value" name="Saldo" radius={[6, 6, 0, 0]} fill="#0E7490" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/** Facturas pendientes del cliente desplegado, dentro de la misma fila. */
function FacturasDelCliente({ clientId }: { clientId: string }) {
  const q = useQuery({
    queryKey: ['portfolio', 'client', clientId],
    queryFn: () => getClientPending(clientId),
  });

  if (q.isLoading) {
    return <p className="px-4 py-3 text-sm text-muted-foreground">Cargando facturas…</p>;
  }
  if (!q.data || q.data.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-muted-foreground">
        Este cliente no tiene facturas pendientes.
      </p>
    );
  }
  return (
    <div className="px-4 py-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Factura</TableHead>
            <TableHead>Emitida</TableHead>
            <TableHead>Vence</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {q.data.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-mono text-xs">{f.number}</TableCell>
              <TableCell>{formatDate(f.issue_date)}</TableCell>
              <TableCell>{f.due_date ? formatDate(f.due_date) : '—'}</TableCell>
              <TableCell className="text-right">{formatCOP(f.total)}</TableCell>
              <TableCell className="text-right font-semibold">{formatCOP(f.saldo)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
