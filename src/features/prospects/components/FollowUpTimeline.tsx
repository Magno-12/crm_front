import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronRight,
  Paperclip,
  Plus,
  FileDown,
  Trash2,
} from 'lucide-react';
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
import {
  deleteAttachment,
  downloadAttachment,
  listAttachments,
  uploadAttachment,
} from '@/features/prospects/api/prospects.api';
import { apiErrorMessage } from '@/api/client';
import { formatDate } from '@/lib/utils';
import type { FollowUpOutcome } from '@/types/api';
import {
  FOLLOWUP_TYPES,
  OUTCOMES,
  SIN_RESULTADO,
  outcomeLabel,
  typeIcon,
  typeLabel,
} from '@/features/prospects/lib/followup';

const followUpSchema = z.object({
  type: z.enum(['LLAMADA', 'WHATSAPP', 'CORREO', 'VISITA', 'CITA', 'REUNION', 'OTROS']),
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
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useFollowUps(prospectId);
  const create = useCreateFollowUp(prospectId);
  const form = useForm<FollowUpInput>({
    resolver: zodResolver(followUpSchema),
    defaultValues: { type: 'LLAMADA', notes: '', outcome: SIN_RESULTADO },
  });

  // Aviso de a qué estado va a quedar el prospecto al guardar.
  const mueveA = OUTCOMES.find((o) => o.value === form.watch('outcome'))?.mueve;

  // Documentos adjuntos de todos los seguimientos del prospecto.
  const attachments = useQuery({
    queryKey: ['prospect-attachments', prospectId],
    queryFn: () => listAttachments(prospectId),
    enabled: !!prospectId,
  });
  const byFollowUp = (id: string) =>
    (attachments.data ?? []).filter((a) => a.follow_up_id === id);

  const onSubmit = async (values: FollowUpInput) => {
    try {
      const created = await create.mutateAsync({
        ...values,
        outcome:
          values.outcome === SIN_RESULTADO
            ? undefined
            : (values.outcome as FollowUpOutcome),
      });
      if (file) {
        await uploadAttachment(prospectId, created.id, file);
        qc.invalidateQueries({ queryKey: ['prospect-attachments', prospectId] });
        setFile(null);
        if (fileInput.current) fileInput.current.value = '';
      }
      form.reset({ type: values.type, notes: '', outcome: SIN_RESULTADO });
      toast.success(file ? 'Seguimiento y documento registrados' : 'Seguimiento registrado');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const onDownload = async (id: string, filename: string) => {
    try {
      const blob = await downloadAttachment(prospectId, id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteAttachment(prospectId, id);
      qc.invalidateQueries({ queryKey: ['prospect-attachments', prospectId] });
      toast.success('Documento eliminado');
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
            Seguimiento de prospectos
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
            className="space-y-2 rounded-md border bg-muted/30 p-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
                        <span className="flex items-center gap-2">
                          <t.icon className="h-3.5 w-3.5" />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-64">
                <Label className="mb-1 block text-xs">¿En qué quedó?</Label>
                <Select
                  value={form.watch('outcome')}
                  onValueChange={(v) => form.setValue('outcome', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_RESULTADO}>Sin registrar</SelectItem>
                    {OUTCOMES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
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
            </div>
            {mueveA && (
              <p className="text-xs text-muted-foreground">
                Al guardar, el prospecto pasa a <strong>{mueveA}</strong>.
              </p>
            )}
            {/* Adjuntar documento a la gestión (propuesta, contrato, soporte…) */}
            <div className="flex flex-wrap items-center gap-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" /> Documento (opcional)
              </Label>
              <Input
                ref={fileInput}
                type="file"
                className="h-9 max-w-xs text-xs"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <span className="text-xs text-primary">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </span>
              )}
              <span className="text-xs text-muted-foreground">Máx. 5 MB por archivo.</span>
            </div>
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
                  <Badge variant="secondary" className="gap-1">
                    {(() => {
                      const Icono = typeIcon(f.type);
                      return <Icono className="h-3 w-3" />;
                    })()}
                    {typeLabel(f.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(f.created_at)}</span>
                </div>
                <p className="mt-1 text-sm">{f.notes}</p>
                {f.outcome && (
                  <p className="text-xs text-muted-foreground">
                    Resultado: {outcomeLabel(f.outcome)}
                  </p>
                )}
                {byFollowUp(f.id).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {byFollowUp(f.id).map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5"
                      >
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-xs">{a.filename}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {Math.max(1, Math.round(a.size_bytes / 1024))} KB
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={() => onDownload(a.id, a.filename)}
                        >
                          <FileDown className="h-3.5 w-3.5" /> Descargar
                        </Button>
                        <Can code="followups.create">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label="Eliminar documento"
                            onClick={() => onDelete(a.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </Can>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
      )}
    </Card>
  );
}
