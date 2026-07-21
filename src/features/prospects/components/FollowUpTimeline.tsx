import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState, EmptyState } from '@/components/common/states';
import { Can } from '@/components/auth/Can';
import { useFollowUps, useCreateFollowUp } from '@/features/prospects/hooks/useProspects';
import { apiErrorMessage } from '@/api/client';
import { formatDate } from '@/lib/utils';
import type { FollowUpType } from '@/types/api';

// Opciones que puede elegir el usuario al registrar un seguimiento.
const FOLLOWUP_TYPES: { value: FollowUpType; label: string }[] = [
  { value: 'LLAMADA', label: 'Llamada' },
  { value: 'CITA', label: 'Cita' },
  { value: 'REUNION', label: 'Reunión' },
  { value: 'OTROS', label: 'Otros' },
];

// Etiquetas legibles para mostrar cualquier tipo (incluye los heredados).
const TYPE_LABELS: Record<string, string> = {
  LLAMADA: 'Llamada',
  CITA: 'Cita',
  REUNION: 'Reunión',
  OTROS: 'Otros',
  CORREO: 'Correo',
  VISITA: 'Visita',
  WHATSAPP: 'WhatsApp',
  NOTA: 'Nota',
};

const followUpSchema = z.object({
  type: z.enum(['LLAMADA', 'CITA', 'REUNION', 'OTROS']),
  notes: z.string().min(1, 'Escribe una nota'),
  outcome: z.string().optional(),
});
type FollowUpInput = z.infer<typeof followUpSchema>;

export function FollowUpTimeline({
  prospectId,
  defaultOpen = false,
}: {
  prospectId: string;
  /** La sección puede ocultarse para despejar la ficha; cerrada por defecto. */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { data, isLoading, error, refetch } = useFollowUps(prospectId);
  const create = useCreateFollowUp(prospectId);
  const form = useForm<FollowUpInput>({
    resolver: zodResolver(followUpSchema),
    defaultValues: { type: 'LLAMADA', notes: '', outcome: '' },
  });

  const onSubmit = async (values: FollowUpInput) => {
    try {
      await create.mutateAsync(values);
      form.reset({ type: values.type, notes: '', outcome: '' });
      toast.success('Seguimiento registrado');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
        role="button"
        aria-expanded={open}
      >
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            Seguimientos
            {data && data.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {data.length}
              </Badge>
            )}
          </span>
          <span className="text-xs font-normal text-primary">
            {open ? 'Ocultar' : 'Mostrar'}
          </span>
        </CardTitle>
      </CardHeader>
      {open && (
      <CardContent className="space-y-4">
        <Can code="followups.create">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-end"
          >
            <div className="sm:w-40">
              <Label className="mb-1 block text-xs">Tipo</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(v) => form.setValue('type', v as FollowUpInput['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLLOWUP_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-1 block text-xs">Nota</Label>
              <Input placeholder="¿Qué pasó?" {...form.register('notes')} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </form>
        </Can>
        {form.formState.errors.notes && (
          <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Sin seguimientos" description="Registra el primer contacto." />
        ) : (
          <ol className="relative space-y-4 border-l pl-6">
            {data.map((f) => (
              <li key={f.id} className="relative">
                <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{TYPE_LABELS[f.type] ?? f.type}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(f.created_at)}</span>
                </div>
                <p className="mt-1 text-sm">{f.notes}</p>
                {f.outcome && <p className="text-xs text-muted-foreground">Resultado: {f.outcome}</p>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
      )}
    </Card>
  );
}
