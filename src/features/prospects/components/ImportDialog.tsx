import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
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
import { apiErrorMessage } from '@/api/client';
import type { ImportResult } from '@/types/api';

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
  const [result, setResult] = useState<ImportResult | null>(null);
  const importProspectsMut = useImportProspects();
  const importCoopMut = useImportCooperativas();
  const importMut = cooperativas ? importCoopMut : importProspectsMut;

  const onImport = async () => {
    if (!file) return;
    try {
      const res = cooperativas
        ? await importCoopMut.mutateAsync(file)
        : await importProspectsMut.mutateAsync({ file, segmento });
      setResult(res);
      toast.success(`Importación: ${res.created} creados, ${res.skipped} omitidos`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const close = (next: boolean) => {
    if (!next) {
      setFile(null);
      setResult(null);
    }
    onOpenChange(next);
  };

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

        {!cooperativas && (
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

        <div className="space-y-2">
          <Label htmlFor="excel">Archivo .xlsx</Label>
          <Input
            id="excel"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {result && (
          <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
            <p>
              <span className="font-semibold text-success">{result.created}</span> creados ·{' '}
              <span className="font-semibold">{result.skipped}</span> omitidos ·{' '}
              <span className="font-semibold text-destructive">{result.errors.length}</span> errores
            </p>
            {result.errors.length > 0 && (
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                {result.errors.slice(0, 50).map((err, i) => (
                  <li key={i}>
                    Fila {String((err as Record<string, unknown>).row ?? '?')}:{' '}
                    {String((err as Record<string, unknown>).error ?? '')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cerrar
          </Button>
          <Button onClick={onImport} disabled={!file || importMut.isPending}>
            {importMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
