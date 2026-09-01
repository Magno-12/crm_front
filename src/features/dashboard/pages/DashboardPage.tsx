import { useState } from 'react';
import { FiltrosDashboard } from '@/features/dashboard/components/FiltrosDashboard';
import { GerencialPanel } from '@/features/dashboard/components/GerencialPanel';
import type { FiltrosGerencial } from '@/features/dashboard/api/gerencial.api';

export function DashboardPage() {
  // Filtros que atraviesan el tablero: periodo, asesor y zona comercial.
  const [filtros, setFiltros] = useState<FiltrosGerencial>({ days: 30 });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard gerencial</h1>
        <p className="text-sm text-muted-foreground">
          Cómo va cada campaña, cuánto se debe, qué vence y qué hizo cada asesor.
        </p>
      </header>

      <FiltrosDashboard filtros={filtros} onCambiar={setFiltros} />

      <GerencialPanel filtros={filtros} />
    </div>
  );
}
