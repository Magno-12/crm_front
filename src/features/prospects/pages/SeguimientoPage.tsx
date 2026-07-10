import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useProspects, useFollowUps } from '@/features/prospects/hooks/useProspects';
import { segmentLabel, statusMeta } from '@/features/prospects/lib/status';
import { formatDate } from '@/lib/utils';
import type { ProspectRead } from '@/types/api';

export function SeguimientoPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const { data, isLoading, error, refetch } = useProspects({
    en_gestion: true,
    q: debouncedQ || undefined,
    page: 1,
    page_size: 50,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Seguimiento de prospecto</h1>
        <p className="text-sm text-muted-foreground">
          Prospectos contactados que están en gestión activa.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por razón social o NIT…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
          aria-label="Buscar en seguimiento"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={1} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="Nada en seguimiento"
          description="Cuando contactes un prospecto y cambies su estado, aparecerá aquí."
        />
      ) : (
        <Card className="divide-y">
          {data.items.map((p) => (
            <SeguimientoRow key={p.id} prospect={p} />
          ))}
        </Card>
      )}
    </div>
  );
}

function SeguimientoRow({ prospect }: { prospect: ProspectRead }) {
  const [open, setOpen] = useState(false);
  const meta = statusMeta(prospect.estado);
  return (
    <div className="p-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <div className="flex-1">
          <p className="font-medium">{prospect.razon_social}</p>
          <p className="text-xs text-muted-foreground">
            {prospect.nit} · {segmentLabel(prospect.segmento)}
          </p>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/prospects/${prospect.id}`}>Corregir</Link>
        </Button>
      </div>
      {open && <MiniTimeline prospectId={prospect.id} />}
    </div>
  );
}

function MiniTimeline({ prospectId }: { prospectId: string }) {
  const { data, isLoading } = useFollowUps(prospectId);
  if (isLoading) return <p className="px-10 py-2 text-sm text-muted-foreground">Cargando…</p>;
  if (!data || data.length === 0)
    return <p className="px-10 py-2 text-sm text-muted-foreground">Sin seguimientos registrados.</p>;
  return (
    <ol className="ml-10 mt-2 space-y-2 border-l pl-4">
      {data.slice(0, 5).map((f) => (
        <li key={f.id} className="relative">
          <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {f.type}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(f.created_at)}</span>
          </div>
          <p className="text-sm">{f.notes}</p>
        </li>
      ))}
    </ol>
  );
}
