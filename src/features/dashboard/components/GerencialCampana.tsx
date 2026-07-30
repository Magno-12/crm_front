import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Clock, Database, MailOpen, MousePointerClick, Rocket, Send, Undo2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/states';
import {
  getCampaignDetalle,
  type CampaignRow,
} from '@/features/dashboard/api/gerencial.api';
import { formatCOP } from '@/lib/utils';

const NUM = new Intl.NumberFormat('es-CO');

function pct(a: number, b: number): string {
  return b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '—';
}

function fechaLarga(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Detalle de una campaña: a qué ritmo va y qué está produciendo. */
export function GerencialCampana({ campana }: { campana: CampaignRow }) {
  const q = useQuery({
    queryKey: ['gerencial', 'campana', campana.id],
    queryFn: () => getCampaignDetalle(campana.id),
  });
  const d = q.data;

  if (campana.enviados === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <EmptyState
            title={`La campaña «${campana.name}» aún no ha empezado`}
            description={`${NUM.format(campana.total_segmento)} prospectos en el segmento ${
              campana.segmento ?? 'seleccionado'
            }.`}
          />
        </CardContent>
      </Card>
    );
  }

  const avance = campana.total_segmento
    ? (campana.enviados / campana.total_segmento) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Velocidad de consumo de la base */}
      <Card>
        <CardContent className="pt-5">
          <p className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Rocket className="h-4 w-4" />
            Ritmo de envío: {NUM.format(d?.ritmo_dia ?? 0)} correos por día de envío
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${avance}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs">
            <span className="text-sky-600 dark:text-sky-400">
              {avance.toFixed(1)}% enviado ({NUM.format(campana.enviados)})
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              {pct(campana.pendientes, campana.total_segmento)} pendiente (
              {NUM.format(campana.pendientes)})
            </span>
          </div>
          {d && d.dias_restantes > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              A este ritmo faltan <strong>{d.dias_restantes} días hábiles</strong> para agotar la
              base. Fecha estimada:{' '}
              <strong className="text-amber-600 dark:text-amber-400">
                {fechaLarga(d.fecha_estimada)}
              </strong>
              .
            </p>
          )}
        </CardContent>
      </Card>

      {/* Indicadores de la campaña */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<Database />} label="Total del segmento" valor={NUM.format(campana.total_segmento)} detalle={campana.segmento ?? 'Todos los segmentos'} color="border-l-violet-500" />
        <Kpi icon={<Send />} label="Enviados" valor={NUM.format(campana.enviados)} detalle={`${pct(campana.enviados, campana.total_segmento)} de la base`} color="border-l-sky-500" />
        <Kpi icon={<Clock />} label="Pendientes por enviar" valor={NUM.format(campana.pendientes)} detalle={pct(campana.pendientes, campana.total_segmento)} color="border-l-amber-500" />
        <Kpi icon={<MailOpen />} label="Tasa de apertura" valor={pct(campana.abiertos, campana.recibidos)} detalle={`${NUM.format(campana.abiertos)} abrieron`} color="border-l-emerald-500" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<Send />} label="Recibidos" valor={NUM.format(campana.recibidos)} detalle={pct(campana.recibidos, campana.enviados)} color="border-l-emerald-500" />
        <Kpi icon={<Undo2 />} label="No recibidos" valor={NUM.format(campana.no_recibidos)} detalle={`${campana.rebotados} rebotaron · ${campana.no_salieron} no salieron`} color="border-l-red-500" />
        <Kpi icon={<MailOpen />} label="Respondidos" valor={NUM.format(campana.respondidos)} detalle={`${pct(campana.respondidos, campana.abiertos)} de los abiertos`} color="border-l-violet-500" />
        <Kpi icon={<MousePointerClick />} label="Clics" valor={NUM.format(campana.clics)} detalle={`${pct(campana.clics, campana.abiertos)} de los abiertos`} color="border-l-amber-500" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<Database />} label="Clientes de la campaña" valor={NUM.format(campana.clientes)} detalle={`${pct(campana.clientes, campana.enviados)} de los correos enviados`} color="border-l-teal-600" />
        <Kpi icon={<Send />} label="Facturación de la campaña" valor={formatCOP(campana.facturacion)} detalle={campana.clientes ? `Ticket promedio ${formatCOP(campana.facturacion / campana.clientes)}` : 'Sin clientes aún'} color="border-l-teal-600" />
        <Kpi icon={<MousePointerClick />} label="Tasa de conversión" valor={pct(campana.clientes, campana.enviados)} detalle="De correo enviado a cliente" color="border-l-sky-500" />
        <Kpi icon={<MailOpen />} label="Entregas confirmadas" valor={NUM.format(campana.entregas_confirmadas)} detalle="Confirmadas por el proveedor" color="border-l-emerald-500" />
      </div>

      {/* Tendencia por tanda de envío */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia por fecha de envío</CardTitle>
          <CardDescription>Cuántos salieron, cuántos abrieron y cuántos hicieron clic en cada tanda.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          {d && d.series.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.series} margin={{ left: -18, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="enviados" name="Enviados" stroke="#2a78d6" strokeWidth={2} />
                <Line type="monotone" dataKey="abiertos" name="Abiertos" stroke="#1baf7a" strokeWidth={2} />
                <Line type="monotone" dataKey="clics" name="Clics" stroke="#eda100" strokeWidth={2} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Sin envíos registrados" description="Aún no hay tandas para graficar." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interacción por tanda</CardTitle>
          <CardDescription>Abiertos, respondidos y clics de cada fecha de envío.</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          {d && d.series.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.series} margin={{ left: -18, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="abiertos" name="Abiertos" fill="#1baf7a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="respondidos" name="Respondidos" fill="#4a3aa7" radius={[3, 3, 0, 0]} />
                <Bar dataKey="clics" name="Clics" fill="#eda100" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Sin envíos registrados" description="Aún no hay tandas para graficar." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  icon,
  label,
  valor,
  detalle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  valor: string;
  detalle: string;
  color: string;
}) {
  return (
    <div className={`rounded-xl border border-l-4 bg-card p-3.5 shadow-soft ${color}`}>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-bold leading-tight">{valor}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{detalle}</p>
    </div>
  );
}
