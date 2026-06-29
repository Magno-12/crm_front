import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Upload, Search, Download, SlidersHorizontal } from 'lucide-react';
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
import { useProspects } from '@/features/prospects/hooks/useProspects';
import {
  PROSPECT_STATUSES,
  SEGMENTS,
  SEGMENT_META,
  segmentLabel,
  statusMeta,
} from '@/features/prospects/lib/status';
import { ProspectFormDialog } from '@/features/prospects/components/ProspectFormDialog';
import { ImportDialog } from '@/features/prospects/components/ImportDialog';
import { getAccessToken } from '@/api/client';

export function ProspectsPage() {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<string>('all');
  const [segmento, setSegmento] = useState<string>('all');
  const [ciiu, setCiiu] = useState('');
  const [regimen, setRegimen] = useState('');
  const [ingresosMin, setIngresosMin] = useState('');
  const [ingresosMax, setIngresosMax] = useState('');
  const [activosMin, setActivosMin] = useState('');
  const [activosMax, setActivosMax] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
    regimen: debouncedRegimen || undefined,
    ingresos_min: debouncedIngMin || undefined,
    ingresos_max: debouncedIngMax || undefined,
    activos_min: debouncedActMin || undefined,
    activos_max: debouncedActMax || undefined,
    page,
    page_size: 20,
  };
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
            {SEGMENTS.map((s) => (
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
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/prospects/${p.id}`}>Ver</Link>
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

      <ProspectFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
