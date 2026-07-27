import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Users, Wallet, TrendingUp, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getUserActivity, type UserActivity } from '@/features/admin/api/admin.api';
import { getPortfolio } from '@/features/payments/api/payments.api';
import { getSummary, getRevenueByService } from '@/features/dashboard/api/dashboard.api';
import { formatCOP, formatDateTime } from '@/lib/utils';

type Tab = 'usuarios' | 'cartera' | 'ingresos';

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'usuarios', label: 'Control por usuario', icon: Users },
  { key: 'cartera', label: 'Cartera', icon: Wallet },
  { key: 'ingresos', label: 'Ingresos', icon: TrendingUp },
];

/** Descarga cualquier tabla como CSV (se abre en Excel). */
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('usuarios');
  const [days, setDays] = useState('30');

  const activity = useQuery({
    queryKey: ['report-activity', days],
    queryFn: () => getUserActivity(Number(days)),
    enabled: tab === 'usuarios',
  });
  const portfolio = useQuery({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
    enabled: tab === 'cartera',
  });
  const summary = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getSummary,
    enabled: tab === 'ingresos',
  });
  const byService = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: getRevenueByService,
    enabled: tab === 'ingresos',
  });

  const exportar = () => {
    if (tab === 'usuarios' && activity.data) {
      downloadCsv(
        `reporte-usuarios-${days}dias.csv`,
        ['Usuario', 'Correo', 'Sesiones', 'Horas', 'Promedio (min)', 'Seguimientos', 'Clientes', 'Recibos', 'Último ingreso'],
        activity.data.map((u: UserActivity) => [
          u.full_name ?? '',
          u.email ?? '',
          u.sesiones,
          u.horas,
          u.promedio_min,
          u.seguimientos,
          u.clientes,
          u.recibos,
          u.ultimo_ingreso ? formatDateTime(u.ultimo_ingreso) : '',
        ]),
      );
    } else if (tab === 'cartera' && portfolio.data) {
      downloadCsv(
        'reporte-cartera.csv',
        ['Cliente', 'NIT', 'Facturas', 'Saldo', 'Vencido', 'Días de mora'],
        portfolio.data.clientes.map((c) => [
          c.client_name ?? '',
          c.nit ?? '',
          c.facturas,
          c.saldo,
          c.vencido,
          c.dias_max,
        ]),
      );
    } else if (tab === 'ingresos' && byService.data) {
      downloadCsv(
        'reporte-ingresos.csv',
        ['Servicio', 'Ingreso mensual'],
        byService.data.map((s) => [s.name, s.value]),
      );
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Estadísticas de control por usuario, cartera e ingresos de la firma.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === 'usuarios' && (
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-44" aria-label="Período">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={exportar}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.key}
              variant={tab === t.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(t.key)}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </Button>
          );
        })}
      </div>

      {tab === 'usuarios' && (
        <Card>
          <CardHeader>
            <CardTitle>Control por usuario</CardTitle>
            <CardDescription>
              Cuántas veces entró cada usuario, cuánto tiempo estuvo y qué registró en el período.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activity.isLoading ? (
              <TableSkeleton rows={5} columns={7} />
            ) : activity.error ? (
              <ErrorState error={activity.error} onRetry={() => activity.refetch()} />
            ) : !activity.data || activity.data.length === 0 ? (
              <EmptyState icon={<BarChart3 />} title="Sin datos en el período" description="" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-center">Sesiones</TableHead>
                    <TableHead className="text-center">Horas</TableHead>
                    <TableHead className="text-center">Promedio</TableHead>
                    <TableHead className="text-center">Seguimientos</TableHead>
                    <TableHead className="text-center">Clientes</TableHead>
                    <TableHead className="text-center">Recibos</TableHead>
                    <TableHead>Último ingreso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.data.map((u: UserActivity) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="font-medium">{u.full_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{u.sesiones}</TableCell>
                      <TableCell className="text-center">{u.horas}</TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {u.promedio_min ? `${u.promedio_min} min` : '—'}
                      </TableCell>
                      <TableCell className="text-center">{u.seguimientos}</TableCell>
                      <TableCell className="text-center">{u.clientes}</TableCell>
                      <TableCell className="text-center">{u.recibos}</TableCell>
                      <TableCell className="text-sm">
                        {u.ultimo_ingreso ? formatDateTime(u.ultimo_ingreso) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'cartera' && (
        <Card>
          <CardHeader>
            <CardTitle>Reporte de cartera</CardTitle>
            <CardDescription>Saldo pendiente por cliente y mora.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {portfolio.isLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : portfolio.error ? (
              <ErrorState error={portfolio.error} onRetry={() => portfolio.refetch()} />
            ) : !portfolio.data || portfolio.data.clientes.length === 0 ? (
              <EmptyState icon={<Wallet />} title="Sin cartera pendiente" description="" />
            ) : (
              <>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>
                    Total: <b>{formatCOP(portfolio.data.total)}</b>
                  </span>
                  <span className="text-destructive">
                    Vencida: <b>{formatCOP(portfolio.data.vencido)}</b>
                  </span>
                  <span>
                    Al día: <b>{formatCOP(portfolio.data.al_dia)}</b>
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Facturas</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Vencido</TableHead>
                      <TableHead>Mora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolio.data.clientes.map((c) => (
                      <TableRow key={c.client_id ?? c.nit}>
                        <TableCell className="font-medium">{c.client_name}</TableCell>
                        <TableCell className="text-center">{c.facturas}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCOP(c.saldo)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {c.vencido > 0 ? formatCOP(c.vencido) : '—'}
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'ingresos' && (
        <Card>
          <CardHeader>
            <CardTitle>Reporte de ingresos</CardTitle>
            <CardDescription>
              Ingreso mensual contratado, recaudo del mes y facturación acumulada del año.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.isLoading || byService.isLoading ? (
              <TableSkeleton rows={5} columns={2} />
            ) : summary.error ? (
              <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Recaudo del mes</p>
                    <p className="text-lg font-semibold">
                      {formatCOP(summary.data?.recaudo_mes ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Cartera pendiente</p>
                    <p className="text-lg font-semibold">{formatCOP(summary.data?.cartera ?? 0)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Facturación acumulada (año)</p>
                    <p className="text-lg font-semibold">
                      {formatCOP(summary.data?.facturacion_acumulada ?? 0)}
                    </p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead className="text-right">Ingreso mensual contratado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(byService.data ?? []).map((s) => (
                      <TableRow key={s.name}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCOP(s.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
