import { useQuery } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getObligacionesPorNit } from '@/features/tax/api/obligaciones-nit.api';
import { formatDate } from '@/lib/utils';

const TIPOS: Record<string, string> = {
  iva: 'IVA',
  retencion: 'Retención en la fuente',
  ica: 'ICA',
  renta: 'Renta',
  exogena: 'Información exógena',
  distrital: 'Información distrital',
  renovacion_cc: 'Renovación Cámara de Comercio',
  renovacion_rut: 'Renovación RUT',
};

const TONO: Record<string, string> = {
  vencida: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  proxima: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  al_dia: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  cumplida: 'bg-muted text-muted-foreground',
};

/** Vencimientos tributarios de ese NIT, consultados desde la ficha.
 *
 * Solo aparece cuando el NIT corresponde a un cliente ya fidelizado: las
 * obligaciones se llevan por cliente, no por prospecto.
 */
export function ObligacionesPorNit({ nit }: { nit: string }) {
  const q = useQuery({
    queryKey: ['obligaciones-por-nit', nit],
    queryFn: () => getObligacionesPorNit(nit),
    enabled: !!nit,
  });

  if (!q.data?.cliente) return null;
  const filas = q.data.obligaciones;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Obligaciones tributarias
        </CardTitle>
        <CardDescription>
          Vencimientos registrados para el NIT {q.data.cliente.nit} ({q.data.cliente.razon_social}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este cliente no tiene obligaciones registradas.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obligación</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{TIPOS[o.tipo] ?? o.tipo}</TableCell>
                  <TableCell className="text-muted-foreground">{o.periodo}</TableCell>
                  <TableCell>{formatDate(o.vence)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${TONO[o.semaforo]}`}>
                      {o.semaforo === 'cumplida'
                        ? 'Cumplida'
                        : o.dias < 0
                          ? `Venció hace ${Math.abs(o.dias)} d`
                          : o.dias === 0
                            ? 'Vence hoy'
                            : `En ${o.dias} d`}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
