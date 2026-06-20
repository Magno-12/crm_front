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
import { useImportProspects } from '@/features/prospects/hooks/useProspects';
import { apiErrorMessage } from '@/api/client';
import type { ImportResult } from '@/types/api';

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const importMut = useImportProspects();

  const onImport = async () => {
    if (!file) return;
    try {
      const res = await importMut.mutateAsync(file);
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
          <DialogTitle>Importar prospectos desde Excel</DialogTitle>
          <DialogDescription>
            El archivo debe tener al menos las columnas <code>nit</code> y{' '}
            <code>razon_social</code>. Los NIT duplicados se omiten.
          </DialogDescription>
        </DialogHeader>

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
