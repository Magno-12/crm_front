import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  FileText,
  HandCoins,
  Phone,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/states';
import {
  getAsesores,
  getCarteraEdades,
  getFinanzas,
  getObligaciones,
  getProspectosActivos,
  type CampaignRow,
  type FiltrosGerencial,
  type ObligacionCelda,
} from '@/features/dashboard/api/gerencial.api';
import { formatCOP, formatDateShort } from '@/lib/utils';
import { rangoDelPeriodo } from '@/features/dashboard/components/FiltrosDashboard';

const NUM = new Intl.NumberFormat('es-CO');

function pct(a: number, b: number): string {
  return b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '—';
}

const fechaCorta = formatDateShort;

/** Tabla consolidada de campañas: el embudo completo de la firma. */
export function TablaCampanas({ campanas }: { campanas: CampaignRow[] }) {
  if (campanas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState
            title="Sin campañas"
            description="Cuando se envíe la primera campaña, aquí aparece su seguimiento."
          />
        </CardContent>
      </Card>
    );
  }

  const t = campanas.reduce(
    (acc, c) => ({
      total_segmento: acc.total_segmento + c.total_segmento,
      enviados: acc.enviados + c.enviados,
      pendientes: acc.pendientes + c.pendientes,
      recibidos: acc.recibidos + c.recibidos,
      abiertos: acc.abiertos + c.abiertos,
      respondidos: acc.respondidos + c.respondidos,
      clics: acc.clics + c.clics,
      clientes: acc.clientes + c.clientes,
    }),
    {
      total_segmento: 0,
      enviados: 0,
      pendientes: 0,
      recibidos: 0,
      abiertos: 0,
      respondidos: 0,
      clics: 0,
      clientes: 0,
    },
  );

  const estadoColor: Record<string, string> = {
    Activa: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    Próxima: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    Pendiente: 'bg-muted text-muted-foreground',
    Terminada: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campañas de correo</CardTitle>
        <CardDescription>
          De cuántos prospectos consta el segmento, cuántos correos han salido y qué pasó con ellos.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Campaña</th>
              <th className="px-3 py-2 text-right font-medium">Total segmento</th>
              <th className="px-3 py-2 text-right font-medium">Enviados</th>
              <th className="px-3 py-2 text-right font-medium">No enviados</th>
              <th className="px-3 py-2 text-right font-medium">Recibidos</th>
              <th className="px-3 py-2 text-right font-medium">Abiertos</th>
              <th className="px-3 py-2 text-right font-medium">Respondidos</th>
              <th className="px-3 py-2 text-right font-medium">Clics</th>
              <th className="px-3 py-2 text-right font-medium">Clientes</th>
            </tr>
          </thead>
          <tbody>
            {campanas.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        estadoColor[c.estado_campana] ?? 'bg-muted'
                      }`}
                    >
                      {c.estado_campana}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.segmento ?? 'Todos'}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-medium text-violet-600 dark:text-violet-400">
                  {NUM.format(c.total_segmento)}
                </td>
                <Celda valor={c.enviados} sub={pct(c.enviados, c.total_segmento)} />
                <Celda valor={c.pendientes} sub={pct(c.pendientes, c.total_segmento)} alerta />
                <Celda valor={c.recibidos} sub={pct(c.recibidos, c.enviados)} bueno />
                <Celda valor={c.abiertos} sub={pct(c.abiertos, c.recibidos)} bueno />
                <Celda valor={c.respondidos} sub={pct(c.respondidos, c.abiertos)} />
                <Celda valor={c.clics} sub={pct(c.clics, c.abiertos)} />
                {/* Conversión sobre los correos enviados: un cliente puede llegar
                    sin haber respondido el correo (llamó, o lo trajo el asesor). */}
                <Celda valor={c.clientes} sub={pct(c.clientes, c.enviados)} bueno />
              </tr>
            ))}
            <tr className="border-t-2 bg-muted/50 font-medium">
              <td className="px-4 py-2.5">Total consolidado</td>
              <td className="px-3 py-2.5 text-right text-violet-600 dark:text-violet-400">
                {NUM.format(t.total_segmento)}
              </td>
              <td className="px-3 py-2.5 text-right">{NUM.format(t.enviados)}</td>
              <td className="px-3 py-2.5 text-right">{NUM.format(t.pendientes)}</td>
              <td className="px-3 py-2.5 text-right">{NUM.format(t.recibidos)}</td>
              <td className="px-3 py-2.5 text-right">{NUM.format(t.abiertos)}</td>
              <td className="px-3 py-2.5 text-right">{NUM.format(t.respondidos)}</td>
              <td className="px-3 py-2.5 text-right">{NUM.format(t.clics)}</td>
              <td className="px-3 py-2.5 text-right">{NUM.format(t.clientes)}</td>
            </tr>
            <tr className="bg-muted/30 text-xs text-muted-foreground">
              <td className="px-4 py-1.5 italic">% sobre el paso anterior</td>
              <td className="px-3 py-1.5 text-right">100%</td>
              <td className="px-3 py-1.5 text-right">{pct(t.enviados, t.total_segmento)}</td>
              <td className="px-3 py-1.5 text-right">{pct(t.pendientes, t.total_segmento)}</td>
              <td className="px-3 py-1.5 text-right">{pct(t.recibidos, t.enviados)}</td>
              <td className="px-3 py-1.5 text-right">{pct(t.abiertos, t.recibidos)}</td>
              <td className="px-3 py-1.5 text-right">{pct(t.respondidos, t.abiertos)}</td>
              <td className="px-3 py-1.5 text-right">{pct(t.clics, t.abiertos)}</td>
              <td className="px-3 py-1.5 text-right">{pct(t.clientes, t.enviados)}</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function Celda({
  valor,
  sub,
  bueno,
  alerta,
}: {
  valor: number;
  sub: string;
  bueno?: boolean;
  alerta?: boolean;
}) {
  return (
    <td className="px-3 py-3 text-right">
      <div>{NUM.format(valor)}</div>
      <div
        className={`text-[11px] ${
          bueno
            ? 'text-emerald-600 dark:text-emerald-400'
            : alerta
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-muted-foreground'
        }`}
      >
        {sub}
      </div>
    </td>
  );
}

/** Los cuatro indicadores de plata: qué se facturó, qué entró y qué falta cobrar. */
export function KpisFinancieros({ filtros }: { filtros: FiltrosGerencial }) {
  const navegar = useNavigate();
  const rango = rangoDelPeriodo(filtros.days ?? 30);
  const consulta = { ...filtros, ...rango };
  const q = useQuery({
    queryKey: ['gerencial', 'finanzas', consulta],
    queryFn: () => getFinanzas(consulta),
  });
  const d = q.data;
  const periodo = `${fechaCorta(rango.desde)} — ${fechaCorta(rango.hasta)}`;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiBloque
        icon={<FileText />}
        label="Facturado del periodo"
        value={d ? formatCOP(d.facturado_mes) : '—'}
        detalle={periodo}
        color="border-l-teal-600"
        onClick={() => navegar('/invoices')}
      />
      <KpiBloque
        icon={<HandCoins />}
        label="Recaudo del periodo"
        value={d ? formatCOP(d.recaudo_mes) : '—'}
        detalle="Recibos de caja registrados"
        color="border-l-emerald-500"
        onClick={() => navegar('/recibos')}
      />
      <KpiBloque
        icon={<TrendingUp />}
        label="Acumulado facturado"
        value={d ? formatCOP(d.facturacion_acumulada) : '—'}
        detalle={`Enero – ${new Date().toLocaleDateString('es-CO', { month: 'long' })}`}
        color="border-l-sky-500"
      />
      <KpiBloque
        icon={<Wallet />}
        label="Saldo total de cartera"
        value={d ? formatCOP(d.cartera) : '—'}
        detalle={d ? `${d.cartera_facturas} factura(s) por cobrar` : 'Pendiente de cobro'}
        color="border-l-red-500"
        alerta
        onClick={() => navegar('/cartera')}
      />
    </div>
  );
}

function KpiBloque({
  icon,
  label,
  value,
  detalle,
  color,
  alerta,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detalle: string;
  color: string;
  alerta?: boolean;
  /** Al hacer clic se abre la pantalla donde está el detalle de esa cifra. */
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
      title={onClick ? 'Abrir el detalle' : undefined}
      className={`rounded-xl border border-l-4 bg-card p-3.5 shadow-soft ${color} ${
        onClick ? 'cursor-pointer transition hover:shadow-md' : ''
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-xl font-bold leading-tight">{value}</p>
      <p className={`mt-0.5 text-xs ${alerta ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
        {detalle}
      </p>
    </div>
  );
}

/** Cartera por edades: cuánto se debe y desde hace cuánto. */
export function TablaCartera({ filtros }: { filtros: FiltrosGerencial }) {
  const navegar = useNavigate();
  const q = useQuery({
    queryKey: ['gerencial', 'cartera', filtros.asesor],
    queryFn: () => getCarteraEdades(filtros),
  });
  const d = q.data;

  if (d && d.clientes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cartera por edades</CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <EmptyState title="Sin cartera pendiente" description="No hay facturas por cobrar." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cartera por edades</CardTitle>
        <CardDescription>Saldos pendientes de cobro según el tiempo de vencimiento.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Cliente</th>
              <th className="px-3 py-2 text-right font-medium">0–30 días</th>
              <th className="px-3 py-2 text-right font-medium text-amber-600">31–60 días</th>
              <th className="px-3 py-2 text-right font-medium text-orange-600">61–90 días</th>
              <th className="px-3 py-2 text-right font-medium text-red-600">+90 días</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {(d?.clientes ?? []).map((c) => (
              <tr
                key={c.cliente}
                className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                onClick={() => navegar('/cartera')}
                title="Ver la cartera del cliente"
              >
                <td className="px-4 py-2.5">
                  <div className="font-medium">{c.cliente}</div>
                  {c.dias_max > 0 && (
                    <div className="text-[11px] text-muted-foreground">
                      {c.dias_max} día(s) de mora
                    </div>
                  )}
                </td>
                <MontoCelda valor={c.d0_30} tono="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" />
                <MontoCelda valor={c.d31_60} tono="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" />
                <MontoCelda valor={c.d61_90} tono="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" />
                <MontoCelda valor={c.mas90} tono="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" />
                <td className="px-3 py-2.5 text-right font-semibold">{formatCOP(c.total)}</td>
              </tr>
            ))}
            {d && (
              <tr className="border-t-2 bg-muted/50 font-medium">
                <td className="px-4 py-2.5">Total cartera</td>
                <td className="px-3 py-2.5 text-right">{formatCOP(d.totales.d0_30)}</td>
                <td className="px-3 py-2.5 text-right">{formatCOP(d.totales.d31_60)}</td>
                <td className="px-3 py-2.5 text-right">{formatCOP(d.totales.d61_90)}</td>
                <td className="px-3 py-2.5 text-right">{formatCOP(d.totales.mas90)}</td>
                <td className="px-3 py-2.5 text-right text-sky-700 dark:text-sky-400">
                  {formatCOP(d.totales.total)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function MontoCelda({ valor, tono }: { valor: number; tono: string }) {
  return (
    <td className="px-3 py-2.5 text-right">
      {valor > 0 ? (
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tono}`}>
          {formatCOP(valor)}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </td>
  );
}

const OBLIGACIONES = [
  { key: 'renta', label: 'Renta' },
  { key: 'iva', label: 'IVA' },
  { key: 'retencion', label: 'Retenciones' },
  { key: 'ica', label: 'ICA' },
  { key: 'exogena', label: 'Exógena' },
];

/** Matriz de clientes y sus próximos vencimientos tributarios. */
export function TablaObligaciones({ filtros }: { filtros: FiltrosGerencial }) {
  const navegar = useNavigate();
  const q = useQuery({
    queryKey: ['gerencial', 'obligaciones', filtros.asesor],
    queryFn: () => getObligaciones(filtros),
  });
  const filas = q.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Clientes: obligaciones y vencimientos
        </CardTitle>
        <CardDescription>La próxima fecha pendiente de cada obligación, por cliente.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {filas.length === 0 ? (
          <div className="pb-8">
            <EmptyState
              title="Sin obligaciones pendientes"
              description="Todas las obligaciones registradas están cumplidas."
            />
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Cliente</th>
                {OBLIGACIONES.map((o) => (
                  <th key={o.key} className="px-3 py-2 text-center font-medium">
                    {o.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr
                  key={f.cliente}
                  className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                  onClick={() => navegar('/tax')}
                  title="Abrir obligaciones y alertas"
                >
                  <td className="px-4 py-3 font-medium">{f.cliente}</td>
                  {OBLIGACIONES.map((o) => (
                    <td key={o.key} className="px-3 py-3 text-center">
                      <CeldaObligacion celda={f.obligaciones[o.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
      <div className="flex flex-wrap gap-3 border-t px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Vencida
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Vence en 15 días o menos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Al día
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> No aplica
        </span>
      </div>
    </Card>
  );
}

function CeldaObligacion({ celda }: { celda: ObligacionCelda | undefined }) {
  if (!celda) return <span className="text-muted-foreground">—</span>;
  const tono =
    celda.semaforo === 'vencida'
      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
      : celda.semaforo === 'proxima'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
  const detalle =
    celda.dias < 0
      ? `Venció hace ${Math.abs(celda.dias)} d`
      : celda.dias === 0
        ? 'Vence hoy'
        : `En ${celda.dias} d`;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tono}`}>
        {fechaCorta(celda.fecha)}
      </span>
      <span className="text-[10px] text-muted-foreground">{detalle}</span>
    </div>
  );
}

/** Prospectos que están en juego ahora mismo. */
export function ProspectosActivos({ filtros }: { filtros: FiltrosGerencial }) {
  const navegar = useNavigate();
  const q = useQuery({
    queryKey: ['gerencial', 'prospectos', filtros.asesor, filtros.zona],
    queryFn: () => getProspectosActivos(filtros),
  });
  const filas = q.data ?? [];
  if (filas.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Users className="h-4 w-4" />
        Prospectos en seguimiento activo
        <Badge variant="secondary">{filas.length}</Badge>
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filas.map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => navegar(`/prospects/${p.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navegar(`/prospects/${p.id}`)}
            title="Abrir la ficha del prospecto"
            className="cursor-pointer rounded-xl border bg-card p-3.5 shadow-soft transition hover:shadow-md"
          >
            <p className="font-medium leading-tight">{p.razon_social}</p>
            <p className="text-xs text-muted-foreground">NIT {p.nit}</p>
            {p.telefono && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {p.telefono}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {p.etapa}
              </Badge>
              <span
                className={`text-xs ${
                  p.dias_en_etapa > 15
                    ? 'text-red-600 dark:text-red-400'
                    : p.dias_en_etapa > 7
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                }`}
              >
                {p.dias_en_etapa === 0 ? 'Hoy' : `${p.dias_en_etapa} día(s) en la etapa`}
              </span>
            </div>
            {p.ultima_nota && (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.ultima_nota}</p>
            )}
            <div className="mt-2.5 flex items-end justify-between border-t pt-2">
              <span className="text-xs text-muted-foreground">{p.asesor ?? 'Sin asignar'}</span>
              <span className="text-xs font-medium">{fechaCorta(p.fecha_evento)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Qué hizo cada asesor: uso del sistema, gestión comercial y cartera a cargo. */
export function TablaAsesores({ filtros }: { filtros: FiltrosGerencial }) {
  const navegar = useNavigate();
  const dias = filtros.days ?? 30;
  const q = useQuery({
    queryKey: ['gerencial', 'asesores', dias, filtros.asesor],
    queryFn: () => getAsesores(filtros),
  });
  const filas = q.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-4 w-4" />
          Control por asesor
        </CardTitle>
        <CardDescription>
          Uso del sistema, gestión comercial y cartera a cargo en los últimos {dias} días.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-1.5 text-left font-medium" />
              <th colSpan={3} className="border-b-2 border-sky-500 px-3 py-1.5 text-center font-medium text-sky-700 dark:text-sky-400">
                Actividad en el sistema
              </th>
              <th colSpan={2} className="border-b-2 border-emerald-600 border-l px-3 py-1.5 text-center font-medium text-emerald-700 dark:text-emerald-400">
                Gestión comercial
              </th>
              <th colSpan={2} className="border-b-2 border-violet-500 border-l px-3 py-1.5 text-center font-medium text-violet-700 dark:text-violet-400">
                Cartera
              </th>
            </tr>
            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Asesor</th>
              <th className="px-3 py-2 text-center font-medium">Sesiones</th>
              <th className="px-3 py-2 text-center font-medium">Horas</th>
              <th className="px-3 py-2 text-center font-medium">Promedio</th>
              <th className="border-l px-3 py-2 text-center font-medium">Seguimientos</th>
              <th className="px-3 py-2 text-center font-medium">Fidelizados</th>
              <th className="border-l px-3 py-2 text-center font-medium">Con mora</th>
              <th className="px-3 py-2 text-center font-medium">Cartera</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((a) => (
              <tr
                key={a.user_id}
                className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                onClick={() => navegar('/reportes')}
                title="Abrir el reporte del usuario"
              >
                <td className="px-4 py-3">
                  <div className="font-medium leading-tight">{a.full_name ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{a.email}</div>
                </td>
                <td className="px-3 py-3 text-center">{a.sesiones}</td>
                <td className="px-3 py-3 text-center text-sky-700 dark:text-sky-400">{a.horas}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">
                  {a.sesiones ? `${a.promedio_min} min` : '—'}
                </td>
                <td className="border-l px-3 py-3 text-center text-emerald-700 dark:text-emerald-400">
                  {a.seguimientos || '—'}
                </td>
                <td className="px-3 py-3 text-center text-teal-700 dark:text-teal-400">
                  {a.fidelizados || '—'}
                </td>
                <td className="border-l px-3 py-3 text-center">
                  {a.con_mora > 0 ? (
                    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {a.con_mora}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-3 text-center text-violet-700 dark:text-violet-400">
                  {a.cartera > 0 ? formatCOP(a.cartera) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
