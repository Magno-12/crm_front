import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUbicaciones, getZonas } from '@/api/ubicaciones';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Download,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { Can } from '@/components/auth/Can';
import { useDebounce } from '@/hooks/useDebounce';
import { useProspects, usePurgeProspects } from '@/features/prospects/hooks/useProspects';
import {
  MARKET_SEGMENTS,
  PROSPECT_STATUSES,
  SEGMENT_META,
  segmentLabel,
  statusMeta,
} from '@/features/prospects/lib/status';
import { ProspectFormDialog } from '@/features/prospects/components/ProspectFormDialog';
import { ImportDialog } from '@/features/prospects/components/ImportDialog';
import {
  enlaceWhatsapp,
  formatearTelefono,
  paraMarcar,
} from '@/features/prospects/lib/telefono';
import { apiErrorMessage, getAccessToken } from '@/api/client';
import {
  type CanalContacto,
  RegistroContactoDialog,
} from '@/features/prospects/components/RegistroContactoDialog';
import type { ProspectRead } from '@/types/api';

/** Teléfono del prospecto y cómo contactarlo, sin salir de la lista. */
function CeldaTelefono({
  prospecto,
  onContactar,
}: {
  prospecto: ProspectRead;
  /** Al marcar se abre el registro del resultado, con el canal usado. */
  onContactar: (prospecto: ProspectRead, canal: CanalContacto) => void;
}) {
  // El celular manda: es el que sirve para llamar y para WhatsApp.
  const numero = prospecto.telefono?.trim() || prospecto.telefono_fijo?.trim() || null;
  const marcar = paraMarcar(numero);
  const whatsapp = enlaceWhatsapp(numero);

  if (!marcar) {
    return <span className="text-xs text-muted-foreground">Sin teléfono</span>;
  }

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <a
        href={`tel:${marcar}`}
        onClick={() => onContactar(prospecto, 'LLAMADA')}
        className="text-sm tabular-nums text-primary hover:underline"
        title={`Llamar a ${marcar}`}
      >
        {formatearTelefono(numero)}
      </a>
      <Button asChild variant="ghost" size="icon" className="h-6 w-6" title="Llamar y registrar">
        <a
          href={`tel:${marcar}`}
          onClick={() => onContactar(prospecto, 'LLAMADA')}
          aria-label="Llamar"
        >
          <Phone className="h-3.5 w-3.5" />
        </a>
      </Button>
      {whatsapp && (
        <Button asChild variant="ghost" size="icon" className="h-6 w-6" title="Abrir WhatsApp">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onContactar(prospecto, 'WHATSAPP')}
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
          </a>
        </Button>
      )}
    </div>
  );
}

export function ProspectsPage() {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<string>('all');
  const [segmento, setSegmento] = useState<string>('all');
  const [ciiu, setCiiu] = useState('');
  const [regimen, setRegimen] = useState('');
  // Territorio: las bases vienen por departamento, municipio y zona comercial.
  const [departamento, setDepartamento] = useState('all');
  const [municipio, setMunicipio] = useState('all');
  const [zona, setZona] = useState('all');
  const [ingresosMin, setIngresosMin] = useState('');
  const [ingresosMax, setIngresosMax] = useState('');
  const [activosMin, setActivosMin] = useState('');
  const [activosMax, setActivosMax] = useState('');
  // Para trabajar la lista de llamadas sin tropezar con los que no tienen número.
  const [soloConTelefono, setSoloConTelefono] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  // Prospecto al que se acaba de marcar, para registrar en qué quedó.
  const [contacto, setContacto] = useState<{
    prospecto: ProspectRead;
    canal: CanalContacto;
  } | null>(null);
  const debouncedQ = useDebounce(q, 300);
  const debouncedCiiu = useDebounce(ciiu, 400);
  const debouncedRegimen = useDebounce(regimen, 400);
  const debouncedIngMin = useDebounce(ingresosMin, 400);
  const debouncedIngMax = useDebounce(ingresosMax, 400);
  const debouncedActMin = useDebounce(activosMin, 400);
  const debouncedActMax = useDebounce(activosMax, 400);

  const filters = {
    q: debouncedQ || undefined,
    estado: estado === 'all' ? undefined : estado,
    segmento: segmento === 'all' ? undefined : segmento,
    actividad_ciiu: debouncedCiiu || undefined,
    departamento: departamento === 'all' ? undefined : departamento,
    ciudad: municipio === 'all' ? undefined : municipio,
    zona: zona === 'all' ? undefined : zona,
    con_telefono: soloConTelefono || undefined,
    regimen: debouncedRegimen || undefined,
    ingresos_min: debouncedIngMin || undefined,
    ingresos_max: debouncedIngMax || undefined,
    activos_min: debouncedActMin || undefined,
    activos_max: debouncedActMax || undefined,
    page,
    page_size: 20,
  };
  const departamentos = useQuery({ queryKey: ['ubicaciones'], queryFn: () => getUbicaciones() });
  const municipios = useQuery({
    queryKey: ['ubicaciones', departamento],
    queryFn: () => getUbicaciones(departamento),
    enabled: departamento !== 'all',
  });
  const zonasQ = useQuery({ queryKey: ['zonas'], queryFn: getZonas });
  const purge = usePurgeProspects();

  const { data, isLoading, error, refetch } = useProspects(filters);

  const exportUrl = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'}/prospects/export`;

  const handleExport = async () => {
    const token = getAccessToken();
    const resp = await fetch(exportUrl, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prospectos.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Base de datos mercadeo</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu base comercial de prospectos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Can code="prospects.export">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </Can>
          <Can code="prospects.import">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" /> Importar
            </Button>
          </Can>
          <Can code="prospects.delete">
            <Button variant="outline" onClick={() => setPurgeOpen(true)}>
              <Trash2 className="h-4 w-4" /> Vaciar base
            </Button>
          </Can>
          <Can code="prospects.create">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Nuevo
            </Button>
          </Can>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por razón social o NIT…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="pl-9"
            aria-label="Buscar prospectos"
          />
        </div>
        <Select
          value={segmento}
          onValueChange={(v) => {
            setSegmento(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48" aria-label="Filtrar por segmento">
            <SelectValue placeholder="Segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los segmentos</SelectItem>
            {MARKET_SEGMENTS.map((s) => (
              <SelectItem key={s} value={s}>
                {SEGMENT_META[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={estado}
          onValueChange={(v) => {
            setEstado(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-52" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {PROSPECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusMeta(s).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={soloConTelefono ? 'default' : 'outline'}
          onClick={() => {
            setSoloConTelefono((v) => !v);
            setPage(1);
          }}
          className="shrink-0"
          title="Deja solo los prospectos a los que se les puede marcar"
        >
          <Phone className="h-4 w-4" /> Con teléfono
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced((v) => !v)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtros
        </Button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Actividad CIIU</label>
            <Input
              placeholder="Ej. 8610"
              value={ciiu}
              onChange={(e) => {
                setCiiu(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Departamento</label>
            <Select
              value={departamento}
              onValueChange={(v) => {
                setDepartamento(v);
                setMunicipio('all');
                setPage(1);
              }}
            >
              <SelectTrigger aria-label="Filtrar por departamento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(departamentos.data ?? []).map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Municipio</label>
            <Select
              value={municipio}
              onValueChange={(v) => {
                setMunicipio(v);
                setPage(1);
              }}
              disabled={departamento === 'all'}
            >
              <SelectTrigger aria-label="Filtrar por municipio">
                <SelectValue placeholder={departamento === 'all' ? 'Elija departamento' : 'Todos'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(municipios.data ?? []).map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Zona comercial</label>
            <Select
              value={zona}
              onValueChange={(v) => {
                setZona(v);
                setPage(1);
              }}
            >
              <SelectTrigger aria-label="Filtrar por zona">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(zonasQ.data ?? []).map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Régimen tributario</label>
            <Input
              placeholder="Ej. Responsable de IVA"
              value={regimen}
              onChange={(e) => {
                setRegimen(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div />
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Ingresos desde (COP)</label>
            <Input
              type="number"
              min={0}
              placeholder="Ej. 3000000"
              value={ingresosMin}
              onChange={(e) => {
                setIngresosMin(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Ingresos hasta (COP)</label>
            <Input
              type="number"
              min={0}
              value={ingresosMax}
              onChange={(e) => {
                setIngresosMax(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div />
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Patrimonio desde (COP)</label>
            <Input
              type="number"
              min={0}
              placeholder="Ej. 80000000"
              value={activosMin}
              onChange={(e) => {
                setActivosMin(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Patrimonio hasta (COP)</label>
            <Input
              type="number"
              min={0}
              placeholder="Ej. 100000000"
              value={activosMax}
              onChange={(e) => {
                setActivosMax(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} columns={5} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Aún no hay prospectos"
          description="Importa tu base desde Excel o crea el primero manualmente."
          action={
            <Can code="prospects.create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" /> Crear prospecto
              </Button>
            </Can>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón social</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => {
                const meta = statusMeta(p.estado);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.razon_social}</TableCell>
                    <TableCell className="text-muted-foreground">{p.nit}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{segmentLabel(p.segmento)}</Badge>
                    </TableCell>
                    <TableCell>{p.ciudad ?? '—'}</TableCell>
                    <TableCell>
                      <CeldaTelefono
                        prospecto={p}
                        onContactar={(prospecto, canal) => setContacto({ prospecto, canal })}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/prospects/${p.id}`}>Ver ficha</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.total} prospecto{data.total !== 1 ? 's' : ''}
          </span>
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

      <RegistroContactoDialog
        prospecto={contacto?.prospecto ?? null}
        canal={contacto?.canal ?? 'LLAMADA'}
        onClose={() => setContacto(null)}
      />

      <ProspectFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Vaciar la base para volver a cargarla: no tiene vuelta atrás. */}
      <Dialog open={purgeOpen} onOpenChange={(o) => !o && !purge.isPending && setPurgeOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Vaciar la base de mercadeo?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Se borran <b>todos los prospectos</b> con su historial de correos y seguimientos,
                  para volver a cargar la base desde cero. Esta acción no se puede deshacer.
                </p>
                <p>
                  Los prospectos que ya se <b>fidelizaron</b> no se borran: son clientes de la firma
                  y con ellos se irían sus contratos, facturas y cartera.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurgeOpen(false)} disabled={purge.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={purge.isPending}
              onClick={async () => {
                try {
                  const r = await purge.mutateAsync();
                  toast.success(
                    `Base vaciada: ${r.prospectos.toLocaleString('es-CO')} prospectos borrados, ` +
                      `${r.conservados} fidelizados conservados.`,
                  );
                  setPurgeOpen(false);
                } catch (e) {
                  toast.error(apiErrorMessage(e));
                }
              }}
            >
              {purge.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Sí, vaciar la base
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
