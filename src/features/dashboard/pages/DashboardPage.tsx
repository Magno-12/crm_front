import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  UserPlus,
  Percent,
  Wallet,
  MailOpen,
  Users,
  Briefcase,
  Receipt,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGridSkeleton } from '@/components/common/table-skeleton';
import { ErrorState, EmptyState } from '@/components/common/states';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import {
  getEmailEngagement,
  getKpis,
  getProspectsByCity,
  getRevenueByService,
  getRevenueByActivity,
  getSummary,
  getTopClients,
  getTrend,
} from '@/features/dashboard/api/dashboard.api';
import { formatCOP, formatCompact, formatDate } from '@/lib/utils';

const PIE_COLORS = ['#0e9aa7', '#22b8cf', '#4263eb', '#7048e8', '#e64980', '#f59f00'];

const KPI_ICON: Record<string, JSX.Element> = {
  new_prospects_month: <UserPlus />,
  conversion_rate: <Percent />,
  monthly_revenue: <Wallet />,
  email_open_rate: <MailOpen />,
};

function kpiValue(key: string, value: number): string {
  if (key === 'conversion_rate' || key === 'email_open_rate') return `${value}%`;
  if (key === 'monthly_revenue') return formatCOP(value);
  return String(value);
}

export function DashboardPage() {
  const kpis = useQuery({ queryKey: ['dashboard', 'kpis'], queryFn: getKpis });
  const summary = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getSummary });
  const trend = useQuery({ queryKey: ['dashboard', 'trend'], queryFn: getTrend });
  const engagement = useQuery({
    queryKey: ['dashboard', 'engagement'],
    queryFn: getEmailEngagement,
  });
  const revenue = useQuery({ queryKey: ['dashboard', 'revenue'], queryFn: getRevenueByService });
  const cities = useQuery({ queryKey: ['dashboard', 'cities'], queryFn: getProspectsByCity });
  const byActivity = useQuery({
    queryKey: ['dashboard', 'by-activity'],
    queryFn: getRevenueByActivity,
  });
  const topClients = useQuery({ queryKey: ['dashboard', 'top-clients'], queryFn: getTopClients });

  const revenueTotal = (revenue.data ?? []).reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard gerencial</h1>
        <p className="text-sm text-muted-foreground">
          Visión consolidada de prospectos, facturación y aperturas de correo.
        </p>
      </header>

      {/* KPIs principales */}
      {kpis.isLoading ? (
        <CardGridSkeleton count={4} />
      ) : kpis.error ? (
        <ErrorState error={kpis.error} onRetry={() => kpis.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.data?.kpis.map((k) => (
            <KpiCard
              key={k.key}
              label={k.label}
              value={kpiValue(k.key, k.value)}
              trend={k.trend}
              icon={KPI_ICON[k.key]}
            />
          ))}
        </div>
      )}

      {/* Métricas de contexto */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatChip
          icon={<Users />}
          label="Prospectos totales"
          value={summary.data ? String(summary.data.total_prospects) : '—'}
        />
        <StatChip
          icon={<Briefcase />}
          label="Clientes activos"
          value={summary.data ? String(summary.data.active_clients) : '—'}
        />
        <StatChip
          icon={<MailOpen />}
          label="Correos abiertos"
          value={summary.data ? String(summary.data.emails_opened) : '—'}
        />
        <StatChip
          icon={<Receipt />}
          label="Ticket promedio"
          value={summary.data ? formatCOP(summary.data.avg_ticket) : '—'}
        />
      </div>

      {/* Tendencia mensual */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia comercial</CardTitle>
          <CardDescription>
            Prospectos nuevos frente a clientes ganados en los últimos 6 meses.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ChartGuard query={trend}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend.data} margin={{ left: -18, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="gNuevos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0e9aa7" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0e9aa7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGanados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ stroke: 'hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="nuevos"
                  name="Nuevos"
                  stroke="#0e9aa7"
                  strokeWidth={2}
                  fill="url(#gNuevos)"
                />
                <Area
                  type="monotone"
                  dataKey="ganados"
                  name="Ganados"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#gGanados)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartGuard>
        </CardContent>
      </Card>

      {/* Aperturas de correo (tracking Resend) */}
      <Card>
        <CardHeader>
          <CardTitle>Aperturas de correo</CardTitle>
          <CardDescription>
            Quién está abriendo las campañas — útil para priorizar el seguimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Enviados" value={String(engagement.data?.sent ?? 0)} />
            <MiniStat label="Abiertos" value={String(engagement.data?.opened ?? 0)} />
            <MiniStat label="Clics" value={String(engagement.data?.clicked ?? 0)} />
            <MiniStat label="% Apertura" value={`${engagement.data?.open_rate ?? 0}%`} accent />
          </div>
          {engagement.data && engagement.data.openers.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Últimos que abrieron
              </p>
              <ul className="divide-y rounded-md border">
                {engagement.data.openers.map((o, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="flex-1 truncate font-medium">{o.razon_social}</span>
                    <span className="truncate text-xs text-muted-foreground">{o.email}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(o.opened_at)}</span>
                    {o.prospect_id && (
                      <Link
                        to={`/prospects/${o.prospect_id}`}
                        className="text-xs font-medium text-primary"
                      >
                        Ver ficha
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState
              title="Aún sin aperturas"
              description="Cuando envíes campañas con tracking activo, verás aquí quién las abre."
            />
          )}
        </CardContent>
      </Card>

      {/* Facturación + ciudades */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Facturación por servicio</CardTitle>
            <CardDescription>Ingreso mensual recurrente de clientes activos.</CardDescription>
          </CardHeader>
          <CardContent className="relative h-72">
            <ChartGuard query={revenue}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenue.data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {(revenue.data ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCOP(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 mb-8 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">Total / mes</span>
                <span className="text-lg font-bold">{formatCOP(revenueTotal)}</span>
              </div>
            </ChartGuard>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prospectos por ciudad</CardTitle>
            <CardDescription>Distribución geográfica de la base comercial.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ChartGuard query={cities}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cities.data} margin={{ left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    formatter={(v: number) => formatCompact(v)}
                  />
                  <Bar dataKey="value" name="Prospectos" radius={[6, 6, 0, 0]} fill="#4263eb" />
                </BarChart>
              </ResponsiveContainer>
            </ChartGuard>
          </CardContent>
        </Card>
      </div>

      {/* Inteligencia comercial */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por actividad económica</CardTitle>
            <CardDescription>Qué actividad (CIIU) genera más ingreso recurrente.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ChartGuard query={byActivity}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byActivity.data} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompact(v)} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(v: number) => formatCOP(v)} />
                  <Bar dataKey="value" name="Ingreso/mes" radius={[0, 6, 6, 0]} fill="#0e9aa7" />
                </BarChart>
              </ResponsiveContainer>
            </ChartGuard>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes más rentables</CardTitle>
            <CardDescription>Ranking por ingreso mensual contratado.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ChartGuard query={topClients}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClients.data} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompact(v)} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(v: number) => formatCOP(v)} />
                  <Bar dataKey="value" name="Ingreso/mes" radius={[0, 6, 6, 0]} fill="#7048e8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartGuard>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-soft">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${accent ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}

interface QueryLike<T> {
  isLoading: boolean;
  error: unknown;
  data: T[] | undefined;
  refetch: () => void;
}

function ChartGuard<T>({ query, children }: { query: QueryLike<T>; children: React.ReactNode }) {
  if (query.isLoading)
    return <div className="h-full w-full animate-pulse rounded-lg bg-muted" aria-label="Cargando" />;
  if (query.error) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data || query.data.length === 0)
    return <EmptyState title="Sin datos" description="Aún no hay información para graficar." />;
  return <>{children}</>;
}
