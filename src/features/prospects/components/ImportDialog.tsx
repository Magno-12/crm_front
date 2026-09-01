import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Upload, XCircle } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useImportCooperativas, useImportProspects } from '@/features/prospects/hooks/useProspects';
import { getImportJob, type ImportJob } from '@/features/prospects/api/prospects.api';
import { apiErrorMessage } from '@/api/client';

const NUM = new Intl.NumberFormat('es-CO');

export function ImportDialog({
  open,
  onOpenChange,
  cooperativas = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Importa el Excel de la Supersolidaria (cooperativas) en lugar de prospectos. */
  cooperativas?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  // En las bases de 2026 las hojas son departamentos: el segmento lo define
  // el archivo, no la hoja.
  const [segmento, setSegmento] = useState('persona_juridica');
  // Cargue en curso: el archivo se sube y el procesamiento sigue en el
  // servidor, así que aquí solo se consulta el avance.
  const [jobId, setJobId] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const importProspectsMut = useImportProspects();
  const importCoopMut = useImportCooperativas();

  const job = useQuery({
    queryKey: ['import-job', jobId],
    queryFn: () => getImportJob(jobId as string),
    enabled: !!jobId,
    // Mientras procesa se consulta cada dos segundos; al terminar se detiene.
    refetchInterval: (q) =>
      (q.state.data as ImportJob | undefined)?.status === 'procesando' ? 2000 : false,
  });

  const estado = job.data;
  const enCurso = estado?.status === 'procesando';

  useEffect(() => {
    if (!estado || estado.status === 'procesando') return;
    if (estado.status === 'terminado') {
      toast.success(
        `Cargue terminado: ${NUM.format(estado.created)} creados, ${NUM.format(
          estado.skipped,
        )} omitidos.`,
      );
    } else {
      toast.error(`El cargue falló: ${estado.message ?? 'error desconocido'}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado?.status]);

  const onImport = async () => {
    if (!file) return;
    setSubiendo(true);
    try {
      const creado = cooperativas
        ? await importCoopMut.mutateAsync(file)
        : await importProspectsMut.mutateAsync({ file, segmento });
      setJobId(creado.id);
      toast.info('Archivo recibido. El cargue continúa en segundo plano.');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSubiendo(false);
    }
  };

  const close = (next: boolean) => {
    if (!next) {
      setFile(null);
      setJobId(null);
    }
    onOpenChange(next);
  };

  const porcentaje =
    estado && estado.total_estimado > 0
      ? Math.min(100, Math.round((estado.procesados / estado.total_estimado) * 100))
      : null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {cooperativas ? 'Importar cooperativas desde Excel' : 'Importar prospectos desde Excel'}
          </DialogTitle>
          <DialogDescription>
            {cooperativas ? (
              <>
                Archivo de entidades vigiladas por la Supersolidaria (columnas{' '}
                <code>NOMBREENTIDAD</code>, <code>NIT</code>, <code>EMAIL</code>…). Los NIT
                duplicados se omiten.
              </>
            ) : (
              <>
                El archivo debe tener al menos las columnas <code>nit</code> y{' '}
                <code>razon_social</code>. Los NIT duplicados se omiten.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!jobId && !cooperativas && (
          <div className="space-y-2">
            <Label>¿De qué es esta base?</Label>
            <Select value={segmento} onValueChange={setSegmento}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="persona_juridica">Personas jurídicas</SelectItem>
                <SelectItem value="persona_natural">Personas naturales</SelectItem>
                <SelectItem value="alcaldia">Alcaldías</SelectItem>
                <SelectItem value="ese">Ese</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              En las bases nuevas cada hoja es un departamento, así que el segmento lo define el
              archivo. El departamento, el municipio y la zona comercial se leen del propio archivo.
            </p>
          </div>
        )}

        {!jobId && (
          <div className="space-y-2">
            <Label htmlFor="excel">Archivo .xlsx</Label>
            <Input
              id="excel"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Las bases grandes tardan varios minutos. El cargue corre en segundo plano: puede
              cerrar esta ventana y seguir trabajando.
            </p>
          </div>
        )}

        {estado && (
          <div className="space-y-3 rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex items-center gap-2">
              {enCurso ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : estado.status === 'terminado' ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className="font-medium">
                {enCurso
                  ? 'Cargando la base…'
                  : estado.status === 'terminado'
                    ? 'Cargue terminado'
                    : 'El cargue falló'}
              </span>
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {estado.filename}
              </span>
            </div>

            {enCurso && (
              <>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${porcentaje ?? 5}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {NUM.format(estado.procesados)} de{' '}
                  {estado.total_estimado > 0 ? NUM.format(estado.total_estimado) : '—'} filas
                  {porcentaje !== null && ` · ${porcentaje}%`}
                </p>
              </>
            )}

            {!enCurso && estado.status === 'terminado' && (
              <p>
                <span className="font-semibold text-success">{NUM.format(estado.created)}</span>{' '}
                creados · <span className="font-semibold">{NUM.format(estado.skipped)}</span>{' '}
                omitidos ·{' '}
                <span className="font-semibold text-destructive">{estado.errors.length}</span> con
                error
              </p>
            )}

            {estado.status === 'fallido' && (
              <p className="text-xs text-destructive">{estado.message}</p>
            )}

            {estado.errors.length > 0 && (
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                {estado.errors.slice(0, 50).map((err, i) => (
                  <li key={i}>
                    Fila {String(err.row ?? '?')}: {String(err.error ?? '')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            {enCurso ? 'Cerrar y seguir en segundo plano' : 'Cerrar'}
          </Button>
          {!jobId && (
            <Button onClick={onImport} disabled={!file || subiendo}>
              {subiendo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {subiendo ? 'Subiendo…' : 'Importar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
