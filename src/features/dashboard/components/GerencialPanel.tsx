import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Megaphone } from 'lucide-react';
import { CardGridSkeleton } from '@/components/common/table-skeleton';
import { ErrorState } from '@/components/common/states';
import { getCampaigns } from '@/features/dashboard/api/gerencial.api';
import { GerencialCampana } from '@/features/dashboard/components/GerencialCampana';
import {
  KpisFinancieros,
  ProspectosActivos,
  TablaAsesores,
  TablaCampanas,
  TablaCartera,
  TablaObligaciones,
} from '@/features/dashboard/components/GerencialGeneral';

const ESTADO_TONO: Record<string, string> = {
  Activa: 'text-emerald-700 dark:text-emerald-400',
  Próxima: 'text-amber-700 dark:text-amber-400',
  Pendiente: 'text-muted-foreground',
  Terminada: 'text-sky-700 dark:text-sky-400',
};

/** Panel gerencial: la vista general de la firma y el detalle de cada campaña. */
export function GerencialPanel({ days }: { days: number }) {
  const [vista, setVista] = useState<string>('general');
  const campanas = useQuery({ queryKey: ['gerencial', 'campanas'], queryFn: () => getCampaigns() });

  if (campanas.isLoading) return <CardGridSkeleton count={4} />;
  if (campanas.error)
    return <ErrorState error={campanas.error} onRetry={() => campanas.refetch()} />;

  const lista = campanas.data ?? [];
  const activa = lista.find((c) => c.id === vista);

  return (
    <div className="space-y-4">
      {/* Selector: la firma completa, o una campaña en particular */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setVista('general')}
          className={`flex min-w-[140px] flex-1 flex-col rounded-lg border px-3 py-2 text-left transition ${
            vista === 'general'
              ? 'border-2 border-primary bg-card'
              : 'bg-muted/40 hover:border-muted-foreground/40'
          }`}
        >
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <LayoutGrid className="h-3 w-3" />
            Vista
          </span>
          <span className="text-sm font-medium">General</span>
          <span className="text-[11px] text-primary">● Toda la firma</span>
        </button>

        {lista.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setVista(c.id)}
            className={`flex min-w-[140px] flex-1 flex-col rounded-lg border px-3 py-2 text-left transition ${
              vista === c.id
                ? 'border-2 border-primary bg-card'
                : 'bg-muted/40 hover:border-muted-foreground/40'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Megaphone className="h-3 w-3" />
              Campaña {i + 1}
            </span>
            <span className="truncate text-sm font-medium">{c.name}</span>
            <span className={`text-[11px] ${ESTADO_TONO[c.estado_campana] ?? ''}`}>
              ● {c.estado_campana}
            </span>
          </button>
        ))}
      </div>

      {activa ? (
        <GerencialCampana campana={activa} />
      ) : (
        <>
          <TablaCampanas campanas={lista} />
          <KpisFinancieros />
          <TablaCartera />
          <TablaObligaciones />
          <ProspectosActivos />
          <TablaAsesores days={days} />
        </>
      )}
    </div>
  );
}
