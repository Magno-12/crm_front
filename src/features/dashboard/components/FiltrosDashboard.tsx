import { useQuery } from '@tanstack/react-query';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getZonas } from '@/api/ubicaciones';
import { listUsers } from '@/features/admin/api/admin.api';
import type { FiltrosGerencial } from '@/features/dashboard/api/gerencial.api';

/** Periodos del dashboard. El rango se calcula al vuelo sobre la fecha de hoy. */
export const PERIODOS = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '365', label: 'Último año' },
];

/** Convierte el periodo elegido en el rango de fechas que espera el servidor. */
export function rangoDelPeriodo(dias: number): { desde: string; hasta: string } {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
}

/** Filtros que atraviesan el dashboard: periodo, asesor y zona comercial. */
export function FiltrosDashboard({
  filtros,
  onCambiar,
}: {
  filtros: FiltrosGerencial;
  onCambiar: (f: FiltrosGerencial) => void;
}) {
  const asesores = useQuery({
    queryKey: ['usuarios-filtro'],
    queryFn: () => listUsers({ page: 1, page_size: 100 }),
  });
  const zonas = useQuery({ queryKey: ['zonas'], queryFn: getZonas });

  const hayFiltro = !!filtros.asesor || !!filtros.zona || (filtros.days ?? 30) !== 30;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-soft">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filtros
      </span>

      <Select
        value={String(filtros.days ?? 30)}
        onValueChange={(v) => onCambiar({ ...filtros, days: Number(v) })}
      >
        <SelectTrigger className="w-[165px]" aria-label="Periodo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODOS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filtros.asesor ?? 'todos'}
        onValueChange={(v) => onCambiar({ ...filtros, asesor: v === 'todos' ? undefined : v })}
      >
        <SelectTrigger className="w-[200px]" aria-label="Asesor">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los asesores</SelectItem>
          {(asesores.data?.items ?? []).map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.full_name ?? u.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filtros.zona ?? 'todas'}
        onValueChange={(v) => onCambiar({ ...filtros, zona: v === 'todas' ? undefined : v })}
      >
        <SelectTrigger className="w-[180px]" aria-label="Zona comercial">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las zonas</SelectItem>
          {(zonas.data ?? []).map((z) => (
            <SelectItem key={z} value={z}>
              {z}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hayFiltro && (
        <Button variant="ghost" size="sm" onClick={() => onCambiar({ days: 30 })}>
          <RotateCcw className="h-3.5 w-3.5" /> Limpiar
        </Button>
      )}

      <span className="ml-auto text-xs text-muted-foreground">
        {/* Ser explícito evita que alguien lea una cifra pensando que está filtrada. */}
        El periodo aplica a lo facturado, lo recaudado y al control por asesor. Las campañas
        muestran siempre su acumulado.
      </span>
    </div>
  );
}
