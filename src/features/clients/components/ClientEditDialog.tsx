import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import { updateClient } from '@/features/clients/api/clients.api';
import { apiErrorMessage } from '@/api/client';
import type { ClientRead, ClientUpdate } from '@/types/api';

export function ClientEditDialog({
  client,
  open,
  onOpenChange,
}: {
  client: ClientRead;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [v, setV] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setV({
        razon_social: client.razon_social ?? '',
        direccion: client.direccion ?? '',
        telefono: client.telefono ?? '',
        email: client.email ?? '',
        contacto_contabilidad_nombre: client.contacto_contabilidad_nombre ?? '',
        contacto_contabilidad_telefono: client.contacto_contabilidad_telefono ?? '',
        contacto_contabilidad_email: client.contacto_contabilidad_email ?? '',
        contrato_numero: client.contrato_numero ?? '',
        fecha_contrato: client.fecha_contrato ?? '',
        notas: client.notas ?? '',
      });
    }
  }, [open, client]);

  const set = (k: string, val: string) => setV((p) => ({ ...p, [k]: val }));

  const mut = useMutation({
    mutationFn: () => {
      const clean = (s: string) => (s.trim() !== '' ? s : null);
      const body: ClientUpdate = {
        razon_social: v.razon_social,
        direccion: clean(v.direccion ?? ''),
        telefono: clean(v.telefono ?? ''),
        email: clean(v.email ?? ''),
        contacto_contabilidad_nombre: clean(v.contacto_contabilidad_nombre ?? ''),
        contacto_contabilidad_telefono: clean(v.contacto_contabilidad_telefono ?? ''),
        contacto_contabilidad_email: clean(v.contacto_contabilidad_email ?? ''),
        contrato_numero: clean(v.contrato_numero ?? ''),
        fecha_contrato: clean(v.fecha_contrato ?? ''),
        notas: clean(v.notas ?? ''),
      };
      return updateClient(client.id, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', 'detail', client.id] });
      toast.success('Cliente actualizado');
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>Datos de facturación, cobro y contrato.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <F label="Razón social" className="sm:col-span-2">
            <Input value={v.razon_social} onChange={(e) => set('razon_social', e.target.value)} />
          </F>
          <F label="Dirección" className="sm:col-span-2">
            <Input value={v.direccion} onChange={(e) => set('direccion', e.target.value)} />
          </F>
          <F label="Teléfono">
            <Input value={v.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </F>
          <F label="Email">
            <Input value={v.email} onChange={(e) => set('email', e.target.value)} />
          </F>

          <Section>Contacto de contabilidad (facturación)</Section>
          <F label="Nombre">
            <Input
              value={v.contacto_contabilidad_nombre}
              onChange={(e) => set('contacto_contabilidad_nombre', e.target.value)}
            />
          </F>
          <F label="Teléfono">
            <Input
              value={v.contacto_contabilidad_telefono}
              onChange={(e) => set('contacto_contabilidad_telefono', e.target.value)}
            />
          </F>
          <F label="Correo" className="sm:col-span-2">
            <Input
              value={v.contacto_contabilidad_email}
              onChange={(e) => set('contacto_contabilidad_email', e.target.value)}
            />
          </F>

          <Section>Contrato</Section>
          <F label="N° de contrato">
            <Input value={v.contrato_numero} onChange={(e) => set('contrato_numero', e.target.value)} />
          </F>
          <F label="Fecha de fidelización">
            <Input
              type="date"
              value={v.fecha_contrato}
              onChange={(e) => set('fecha_contrato', e.target.value)}
            />
          </F>
          <F label="Notas" className="sm:col-span-2">
            <Input value={v.notas} onChange={(e) => set('notas', e.target.value)} />
          </F>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 border-b pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-2">
      {children}
    </p>
  );
}

function F({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
    </div>
  );
}
