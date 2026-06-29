import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
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
import { ProspectCombobox } from '@/features/invoices/components/ProspectCombobox';
import { createInvoice, openInvoicePdf } from '@/features/invoices/api/invoices.api';
import { servicesByProspect } from '@/features/clients/api/clients.api';
import { listServices } from '@/features/dashboard/api/services.api';
import { apiErrorMessage } from '@/api/client';
import { formatCOP } from '@/lib/utils';

interface ItemRow {
  description: string;
  quantity: number;
  unit_price: number;
}

interface FormValues {
  prospect_id: string;
  tax_rate: number;
  due_date: string;
  notes: string;
  items: ItemRow[];
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      prospect_id: '',
      tax_rate: 19,
      due_date: '',
      notes: '',
      items: [{ description: '', quantity: 1, unit_price: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  const prospectId = form.watch('prospect_id');
  const catalog = useQuery({ queryKey: ['services'], queryFn: () => listServices(true) });
  const clientSvc = useQuery({
    queryKey: ['client-services-by-prospect', prospectId],
    queryFn: () => servicesByProspect(prospectId),
    enabled: open && !!prospectId,
  });

  // Al elegir un cliente fidelizado, precarga sus servicios contratados (concepto + valor).
  useEffect(() => {
    if (!clientSvc.data || clientSvc.data.length === 0) return;
    const rows = clientSvc.data.map((cs) => ({
      description: catalog.data?.find((s) => s.id === cs.service_id)?.name ?? 'Servicio contratado',
      quantity: 1,
      unit_price: Number(cs.valor_mensual),
    }));
    form.setValue('items', rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientSvc.data, catalog.data]);

  const items = form.watch('items');
  const taxRate = Number(form.watch('tax_rate')) || 0;
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0,
  );
  const tax = Math.round((subtotal * taxRate) / 100);
  const total = subtotal + tax;

  const mutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const onSubmit = async (values: FormValues) => {
    if (!values.prospect_id) {
      toast.error('Selecciona un prospecto');
      return;
    }
    if (values.items.length === 0 || values.items.every((i) => !i.description)) {
      toast.error('Agrega al menos un ítem con descripción');
      return;
    }
    setSubmitting(true);
    try {
      const invoice = await mutation.mutateAsync({
        prospect_id: values.prospect_id,
        tax_rate: String(values.tax_rate),
        due_date: values.due_date || null,
        notes: values.notes || null,
        items: values.items
          .filter((i) => i.description)
          .map((i) => ({
            description: i.description,
            quantity: String(i.quantity),
            unit_price: String(i.unit_price),
          })),
      });
      toast.success(`Factura ${invoice.number} creada`);
      onOpenChange(false);
      form.reset();
      await openInvoicePdf(invoice.id, invoice.number);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva factura</DialogTitle>
          <DialogDescription>
            Elige el cliente fidelizado; sus servicios se cargan automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Prospecto */}
          <div>
            <Label className="mb-1.5 block">Cliente fidelizado</Label>
            <ProspectCombobox
              value={form.watch('prospect_id')}
              onChange={(id) => form.setValue('prospect_id', id)}
            />
            {clientSvc.data && clientSvc.data.length > 0 && (
              <p className="mt-1 text-xs text-primary">
                Se cargaron {clientSvc.data.length} servicio(s) contratado(s).
              </p>
            )}
          </div>

          {/* Ítems */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>Ítems</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
              >
                <Plus className="h-4 w-4" /> Agregar ítem
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-start gap-2">
                  <Input
                    placeholder="Descripción del servicio"
                    className="flex-1"
                    {...form.register(`items.${idx}.description`)}
                  />
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    aria-label="Cantidad"
                    {...form.register(`items.${idx}.quantity`, { valueAsNumber: true })}
                  />
                  <Input
                    type="number"
                    min={0}
                    className="w-32"
                    placeholder="Vr. unitario"
                    {...form.register(`items.${idx}.unit_price`, { valueAsNumber: true })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(idx)}
                    disabled={fields.length === 1}
                    aria-label="Quitar ítem"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Config + totales */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="tax_rate" className="mb-1.5 block">
                IVA (%)
              </Label>
              <Input
                id="tax_rate"
                type="number"
                min={0}
                max={100}
                {...form.register('tax_rate', { valueAsNumber: true })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="due_date" className="mb-1.5 block">
                Vence (opcional)
              </Label>
              <Input id="due_date" type="date" {...form.register('due_date')} />
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="mb-1.5 block">
              Observaciones
            </Label>
            <Input id="notes" placeholder="Forma de pago, datos bancarios…" {...form.register('notes')} />
          </div>

          <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA ({taxRate}%)</span>
              <span>{formatCOP(tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCOP(total)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear y descargar PDF
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
