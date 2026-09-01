import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GerencialPanel } from '@/features/dashboard/components/GerencialPanel';

export function DashboardPage() {
  // Periodo del control por asesor; el resto de indicadores es del estado actual.
  const [dias, setDias] = useState(30);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard gerencial</h1>
          <p className="text-sm text-muted-foreground">
            Cómo va cada campaña, cuánto se debe, qué vence y qué hizo cada asesor.
          </p>
        </div>
        <Select value={String(dias)} onValueChange={(v) => setDias(Number(v))}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <GerencialPanel days={dias} />
    </div>
  );
}
