import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { createOpportunity } from '@/features/opportunities/api/opportunities.api';
import { listServices } from '@/features/dashboard/api/services.api';
import { listProspects } from '@/features/prospects/api/prospects.api';
import { apiErrorMessage } from '@/api/client';

const schema = z.object({
  prospect_id: z.string().uuid('Selecciona un prospecto'),
  service_id: z.string().optional(),
  valor_mensual: z.coerce.number().min(0),
  probabilidad: z.coerce.number().min(0).max(100),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function OpportunityFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { prospect_id: '', service_id: '', valor_mensual: 0, probabilidad: 50 },
  });

  const prospects = useQuery({
    queryKey: ['prospects', 'all-for-select'],
    queryFn: () => listProspects({ page: 1, page_size: 100 }),
    enabled: open,
  });
  const services = useQuery({
    queryKey: ['services'],
    queryFn: () => listServices(true),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: createOpportunity,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  });

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    try {
      await mutation.mutateAsync({
        prospect_id: values.prospect_id,
        service_id: values.service_id || null,
        valor_mensual: String(values.valor_mensual),
        probabilidad: values.probabilidad,
        estado: 'calificacion',
      });
      toast.success('Oportunidad creada');
      onOpenChange(false);
      form.reset();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva oportunidad</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Prospecto</Label>
            <Select
              value={form.watch('prospect_id')}
              onValueChange={(v) => form.setValue('prospect_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un prospecto" />
              </SelectTrigger>
              <SelectContent>
                {prospects.data?.items.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.prospect_id && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.prospect_id.message}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block">Servicio (opcional)</Label>
            <Select
              value={form.watch('service_id') ?? ''}
              onValueChange={(v) => form.setValue('service_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.data?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor" className="mb-1.5 block">
                Valor mensual (COP)
              </Label>
              <Input id="valor" type="number" min={0} {...form.register('valor_mensual')} />
            </div>
            <div>
              <Label htmlFor="prob" className="mb-1.5 block">
                Probabilidad (%)
              </Label>
              <Input
                id="prob"
                type="number"
                min={0}
                max={100}
                {...form.register('probabilidad')}
              />
            </div>
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
