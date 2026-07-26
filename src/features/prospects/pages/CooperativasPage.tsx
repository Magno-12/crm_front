import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, Search, Upload } from 'lucide-react';
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
import { PROSPECT_STATUSES, statusMeta } from '@/features/prospects/lib/status';
import { ImportDialog } from '@/features/prospects/components/ImportDialog';

/** Cooperativas y entidades vigiladas por la Supersolidaria (base propia). */
export function CooperativasPage() {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const debouncedQ = useDebounce(q, 300);

  const { data, isLoading, error, refetch } = useProspects({
    q: debouncedQ || undefined,
    estado: estado === 'all' ? undefined : estado,
    segmento: 'cooperativa',
    page,
    page_size: 20,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cooperativas</h1>
          <p className="text-sm text-muted-foreground">
            Entidades vigiladas por la Supersolidaria: fondos de empleados, cooperativas y
            mutuales. Funcionan igual que los prospectos y reciben campañas de correo.
          </p>
        </div>
        <Can code="prospects.import">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Importar
          </Button>
        </Can>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, sigla o NIT…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="pl-9"
            aria-label="Buscar cooperativas"
          />
        </div>
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
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<HeartHandshake />}
          title="Aún no hay cooperativas"
          description="Importa el Excel de entidades vigiladas por la Supersolidaria."
          action={
            <Can code="prospects.import">
              <Button onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" /> Importar Excel
              </Button>
            </Can>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entidad</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Municipio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => {
                const meta = statusMeta(p.estado);
                const sigla = (p as { sigla?: string | null }).sigla;
                const tipo = (p as { tipo_entidad?: string | null }).tipo_entidad;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="max-w-md truncate font-medium">{p.razon_social}</div>
                      {sigla && <div className="text-xs text-muted-foreground">{sigla}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.nit}
                      {p.dv ? `-${p.dv}` : ''}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{tipo ?? '—'}</span>
                    </TableCell>
                    <TableCell>{p.ciudad ?? '—'}</TableCell>
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
            {data.total} cooperativa{data.total !== 1 ? 's' : ''}
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

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} cooperativas />
    </div>
  );
}
