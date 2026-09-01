import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
import { listClients } from '@/features/clients/api/clients.api';
import { createObligation, searchTaxCalendar } from '@/features/tax/api/tax.api';
import { TAX_TYPES, taxTypeLabel } from '@/features/tax/lib/meta';
import { apiErrorMessage } from '@/api/client';
import { formatDate } from '@/lib/utils';
import type { TaxObligationType } from '@/types/api';

/** Texto de búsqueda en el calendario DIAN por tipo de obligación. */
const CALENDAR_QUERY: Partial<Record<TaxObligationType, string>> = {
  iva: 'iva',
  retencion: 'retención',
  renta: 'renta',
};

interface FormValues {
  client_id: string;
  type: TaxObligationType;
  period: string;
  due_date: string;
  amount: string;
  notes: string;
}

export function TaxFormDialog({
  open,
  onOpenChange,
  preset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Cliente y tipo con los que abrir el formulario ya diligenciado. */
  preset?: { client_id: string; type: TaxObligationType };
}) {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const clients = useQuery({
    queryKey: ['clients', 'all-for-tax'],
    queryFn: () => listClients({ page: 1, page_size: 100 }),
    enabled: open,
  });
  const form = useForm<FormValues>({
    defaultValues: { client_id: '', type: 'iva', period: '', due_date: '', amount: '', notes: '' },
  });

  // Cuando se abre desde un cliente sin control, el formulario ya llega
  // apuntando a ese cliente y a la obligación que le falta.
  useEffect(() => {
    if (open && preset) {
      form.setValue('client_id', preset.client_id);
      form.setValue('type', preset.type);
    }
  }, [open, preset, form]);

  const clientId = form.watch('client_id');
  const type = form.watch('type');
  const selectedNit = clients.data?.items.find((c) => c.id === clientId)?.nit;
  const calendarQ = CALENDAR_QUERY[type];
  const suggestions = useQuery({
    queryKey: ['tax-calendar', calendarQ, selectedNit],
    queryFn: () => searchTaxCalendar(calendarQ as string, selectedNit),
    enabled: open && !!calendarQ && !!selectedNit,
  });

  const mut = useMutation({
    mutationFn: createObligation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax'] });
      toast.success('Obligación creada');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const onSubmit = async (v: FormValues) => {
    if (!v.client_id) return toast.error('Selecciona un cliente');
    if (!v.due_date) return toast.error('Indica la fecha de vencimiento');
    setSubmitting(true);
    try {
      await mut.mutateAsync({
        client_id: v.client_id,
        type: v.type,
        period: v.period,
        due_date: v.due_date,
        amount: v.amount ? v.amount : null,
        notes: v.notes || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva obligación tributaria</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Cliente</Label>
            <Select
              value={form.watch('client_id')}
              onValueChange={(val) => form.setValue('client_id', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.data?.items.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.razon_social} — {c.nit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Tipo</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(val) => form.setValue('type', val as TaxObligationType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {taxTypeLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="period" className="mb-1.5 block">
                Periodo
              </Label>
              <Input id="period" placeholder="2026-06 / Bimestre 3" {...form.register('period')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date" className="mb-1.5 block">
                Vence
              </Label>
              <Input id="due_date" type="date" {...form.register('due_date')} />
            </div>
            <div>
              <Label htmlFor="amount" className="mb-1.5 block">
                Valor (opcional)
              </Label>
              <Input id="amount" type="number" min={0} {...form.register('amount')} />
            </div>
          </div>

          {suggestions.data && suggestions.data.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Vencimientos DIAN 2026 sugeridos (último dígito del NIT {selectedNit}):
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.data.map((s, i) => (
                  <button
                    key={`${s.due_date}-${i}`}
                    type="button"
                    className="rounded-md border bg-background px-2 py-1 text-xs hover:bg-accent"
                    onClick={() => {
                      form.setValue('due_date', s.due_date);
                      if (s.periodo) form.setValue('period', s.periodo);
                    }}
                  >
                    {formatDate(s.due_date)}
                    {s.periodo ? ` · ${s.periodo}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="notes" className="mb-1.5 block">
              Notas
            </Label>
            <Input id="notes" {...form.register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
