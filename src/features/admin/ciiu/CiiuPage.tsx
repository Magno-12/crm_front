import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, FileSpreadsheet, Loader2, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/common/states';
import { getCiiuStatus, importCiiu, searchCiiu } from '@/api/ciiu';
import { useDebounce } from '@/hooks/useDebounce';

/** Catálogo CIIU: la firma sube el archivo del DANE y el CRM muestra el nombre
 *  de la actividad cada vez que aparece un código. */
export function CiiuPage() {
  const qc = useQueryClient();
  const inputFile = useRef<HTMLInputElement>(null);
  const [busqueda, setBusqueda] = useState('');
  const consulta = useDebounce(busqueda, 400);

  const estado = useQuery({ queryKey: ['ciiu', 'status'], queryFn: getCiiuStatus });
  const resultados = useQuery({
    queryKey: ['ciiu', 'buscar', consulta],
    queryFn: () => searchCiiu(consulta, 25),
    enabled: consulta.length >= 2,
  });

  const subir = useMutation({
    mutationFn: importCiiu,
    onSuccess: (r) => {
      toast.success(
        `Catálogo cargado: ${r.creados} actividad(es) nueva(s) y ${r.actualizados} actualizada(s).`,
      );
      qc.invalidateQueries({ queryKey: ['ciiu'] });
      if (inputFile.current) inputFile.current.value = '';
    },
    onError: () => {
      if (inputFile.current) inputFile.current.value = '';
    },
  });

  const total = estado.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Catálogo de actividades CIIU</h1>
        <p className="text-sm text-muted-foreground">
          Con este catálogo el sistema puede mostrar el nombre de la actividad económica cada vez
          que aparece un código.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Cargar el archivo del DANE
          </CardTitle>
          <CardDescription>
            El listado oficial lo publica el DANE (Clasificación Industrial Internacional Uniforme,
            revisión 4 adaptada para Colombia). Descárguelo de la página del DANE y súbalo aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3.5 text-sm">
            <p className="font-medium">Qué debe tener el archivo</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-muted-foreground">
              <li>Formato Excel (.xlsx) o CSV.</li>
              <li>
                Una columna con el <b>código</b> (por ejemplo 9602) y otra con la{' '}
                <b>descripción</b> de la actividad. Opcionalmente, una de <b>nivel</b>
                (sección, división, grupo o clase).
              </li>
              <li>
                Puede traer títulos arriba: el sistema busca el encabezado en las primeras filas.
              </li>
              <li>
                Se puede volver a subir cuantas veces haga falta: los códigos que ya existen se
                actualizan y no se duplican.
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputFile}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) subir.mutate(f);
              }}
            />
            <Button onClick={() => inputFile.current?.click()} disabled={subir.isPending}>
              {subir.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {subir.isPending ? 'Cargando…' : 'Subir archivo del DANE'}
            </Button>

            {total > 0 ? (
              <span className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {total.toLocaleString('es-CO')} actividades cargadas
              </span>
            ) : (
              <span className="text-sm text-amber-700 dark:text-amber-400">
                El catálogo está vacío: mientras no se cargue, los códigos aparecen sin el nombre de
                la actividad.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consultar el catálogo</CardTitle>
          <CardDescription>Busque por código o por nombre de la actividad.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Ej. 9602 o peluquería"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {consulta.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Escriba al menos dos caracteres para buscar.
            </p>
          ) : resultados.isLoading ? (
            <p className="text-sm text-muted-foreground">Buscando…</p>
          ) : !resultados.data || resultados.data.length === 0 ? (
            <EmptyState
              title="Sin resultados"
              description={
                total === 0
                  ? 'El catálogo aún no se ha cargado.'
                  : 'Ningún código o actividad coincide con la búsqueda.'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Código</TableHead>
                  <TableHead>Actividad económica</TableHead>
                  <TableHead className="w-32">Nivel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.data.map((c) => (
                  <TableRow key={c.code}>
                    <TableCell className="font-mono font-medium">{c.code}</TableCell>
                    <TableCell>{c.description}</TableCell>
                    <TableCell className="text-muted-foreground">{c.nivel ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
