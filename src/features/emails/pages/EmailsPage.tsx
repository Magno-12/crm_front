import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Plus, Send, Megaphone, Trash2, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, ErrorState } from '@/components/common/states';
import { Can } from '@/components/auth/Can';
import {
  deleteTemplate,
  getAudienceCount,
  listSenders,
  listTemplates,
  sendCampaign,
  sendEmail,
} from '@/features/emails/api/emails.api';
import { TemplateBuilderDialog } from '@/features/emails/components/TemplateBuilderDialog';
import { TemplateEditDialog } from '@/features/emails/components/TemplateEditDialog';
import { TemplatePreviewDialog } from '@/features/emails/components/TemplatePreviewDialog';
import {
  PROSPECT_STATUSES,
  SEGMENTS,
  SEGMENT_META,
  statusMeta,
} from '@/features/prospects/lib/status';
import { useDebounce } from '@/hooks/useDebounce';
import { apiErrorMessage } from '@/api/client';
import type { EmailTemplateRead } from '@/types/api';

// Límite de correos por día (todas las campañas).
const CAMPAIGN_MAX = 3000;

export function EmailsPage() {
  const qc = useQueryClient();
  const templates = useQuery({ queryKey: ['email-templates'], queryFn: listTemplates });
  const [templateOpen, setTemplateOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateRead | null>(null);
  const [editTemplate, setEditTemplate] = useState<EmailTemplateRead | null>(null);
  const [toDelete, setToDelete] = useState<EmailTemplateRead | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla eliminada');
      setToDelete(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Correos</h1>
          <p className="text-sm text-muted-foreground">Plantillas, envíos individuales y campañas masivas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Can code="emails.templates.create">
            <Button variant="outline" onClick={() => setTemplateOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva plantilla
            </Button>
          </Can>
          <Can code="emails.send">
            <Button variant="outline" onClick={() => setComposerOpen(true)}>
              <Send className="h-4 w-4" /> Enviar correo
            </Button>
          </Can>
          <Can code="emails.send">
            <Button onClick={() => setCampaignOpen(true)}>
              <Megaphone className="h-4 w-4" /> Campaña
            </Button>
          </Can>
        </div>
      </header>

      {templates.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : templates.error ? (
        <ErrorState error={templates.error} onRetry={() => templates.refetch()} />
      ) : !templates.data || templates.data.length === 0 ? (
        <EmptyState
          icon={<Mail />}
          title="Sin plantillas"
          description="Crea una plantilla para empezar a enviar correos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.data.map((t) => (
            <Card
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => setPreviewTemplate(t)}
              onKeyDown={(e) => e.key === 'Enter' && setPreviewTemplate(t)}
              className="cursor-pointer transition hover:border-primary/50 hover:shadow-sm"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="min-w-0 truncate">{t.name}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    {t.is_active ? (
                      <Badge variant="success">Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                    <Can code="emails.templates.edit">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        aria-label="Editar plantilla"
                        title="Editar plantilla"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTemplate(t);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Can>
                    <Can code="emails.templates.delete">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar plantilla"
                        title="Eliminar plantilla"
                        onClick={(e) => {
                          e.stopPropagation();
                          setToDelete(t);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Can>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="truncate text-sm text-muted-foreground">{t.subject}</p>
                {t.variables.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.variables.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">
                        ${v}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs font-medium text-primary">Clic para previsualizar →</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateBuilderDialog open={templateOpen} onOpenChange={setTemplateOpen} />
      <TemplatePreviewDialog
        template={previewTemplate}
        onOpenChange={(o) => !o && setPreviewTemplate(null)}
      />
      <TemplateEditDialog
        template={editTemplate}
        onOpenChange={(o) => !o && setEditTemplate(null)}
      />
      <ComposerDialog
        open={composerOpen}
        onOpenChange={setComposerOpen}
        templates={templates.data ?? []}
      />
      <CampaignDialog
        open={campaignOpen}
        onOpenChange={setCampaignOpen}
        templates={templates.data ?? []}
      />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && !del.isPending && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar plantilla?</DialogTitle>
            <DialogDescription>
              Se eliminará la plantilla{' '}
              <span className="font-medium text-foreground">{toDelete?.name}</span>. El historial de
              campañas y las aperturas se conservan. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={del.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="gap-1"
              disabled={del.isPending}
              onClick={() => toDelete && del.mutate(toDelete.id)}
            >
              {del.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignDialog({
  open,
  onOpenChange,
  templates,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templates: { id: string; name: string }[];
}) {
  const [templateId, setTemplateId] = useState('');
  const [segmento, setSegmento] = useState('all');
  const [estado, setEstado] = useState('all');
  const [ciiu, setCiiu] = useState('');
  const [skipSent, setSkipSent] = useState(true);
  const [sender, setSender] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const senders = useQuery({ queryKey: ['email-senders'], queryFn: listSenders, enabled: open });
  const debouncedCiiu = useDebounce(ciiu, 400);

  const filters = {
    segmento: segmento === 'all' ? undefined : segmento,
    estado: estado === 'all' ? undefined : estado,
    actividad_ciiu: debouncedCiiu || undefined,
  };
  const audienceParams = {
    ...filters,
    template_id: templateId || undefined,
    skip_sent: skipSent,
  };

  const audience = useQuery({
    queryKey: ['email-audience', audienceParams],
    queryFn: () => getAudienceCount(audienceParams),
    enabled: open,
  });

  const mut = useMutation({
    mutationFn: () =>
      sendCampaign({
        template_id: templateId,
        skip_sent: skipSent,
        from_email: sender || undefined,
        start_date: startDate || null,
        end_date: endDate || null,
        ...filters,
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const count = audience.data ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Campaña de correo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Plantilla</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {senders.data && senders.data.length > 1 && (
            <div>
              <Label className="mb-1.5 block">Enviar desde</Label>
              <Select value={sender} onValueChange={setSender}>
                <SelectTrigger>
                  <SelectValue placeholder={senders.data[0]} />
                </SelectTrigger>
                <SelectContent>
                  {senders.data.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Segmento</Label>
              <Select value={segmento} onValueChange={setSegmento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {SEGMENTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEGMENT_META[s]?.label ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {PROSPECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusMeta(s).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Actividad CIIU (opcional)</Label>
            <Input placeholder="Ej. 8610" value={ciiu} onChange={(e) => setCiiu(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Fecha de inicio (opcional)</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Fecha de fin (opcional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Estas fechas son <span className="font-medium">solo informativas</span> (el período de
            la campaña que se muestra en el historial). No controlan el envío: los correos salen de
            a {CAMPAIGN_MAX.toLocaleString('es-CO')} por día hasta cubrir la audiencia. Si las dejas
            vacías, se registran solas (inicio al enviar, fin al terminar).
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skipSent}
              onChange={(e) => setSkipSent(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            No reenviar a quienes ya recibieron esta plantilla
          </label>

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            Audiencia con correo:{' '}
            <span className="font-semibold">{audience.isLoading ? '…' : count}</span> destinatario(s)
            {skipSent && templateId ? ' nuevos' : ''}.
            {count > CAMPAIGN_MAX && (
              <span className="text-muted-foreground">
                {' '}
                Hoy se enviarán {CAMPAIGN_MAX.toLocaleString('es-CO')} por el límite diario; el
                resto continúa mañana.
              </span>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!templateId) return toast.error('Selecciona una plantilla');
              if (count === 0) return toast.error('No hay destinatarios');
              mut.mutate();
            }}
            disabled={mut.isPending}
          >
            <Megaphone className="h-4 w-4" /> Enviar a {Math.min(count, CAMPAIGN_MAX)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const composerSchema = z.object({
  template_id: z.string().uuid('Selecciona una plantilla'),
  recipients: z.string().min(3, 'Ingresa al menos un correo'),
});
type ComposerInput = z.infer<typeof composerSchema>;

function ComposerDialog({
  open,
  onOpenChange,
  templates,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templates: { id: string; name: string }[];
}) {
  const form = useForm<ComposerInput>({
    resolver: zodResolver(composerSchema),
    defaultValues: { template_id: '', recipients: '' },
  });
  const [sender, setSender] = useState('');
  const senders = useQuery({ queryKey: ['email-senders'], queryFn: listSenders, enabled: open });
  const mut = useMutation({
    mutationFn: (v: ComposerInput) =>
      sendEmail({
        template_id: v.template_id,
        recipients: v.recipients
          .split(/[\s,;]+/)
          .map((r) => r.trim())
          .filter(Boolean),
        from_email: sender || undefined,
        variables: {},
      }),
    onSuccess: (res) => {
      if (res.failed > 0) {
        const err = res.results.find((r) => r.status === 'failed')?.error;
        toast.error(`No se pudo enviar (${res.failed}). ${err ?? 'Revisa el SMTP.'}`);
        return;
      }
      toast.success(`Enviado a ${res.sent} destinatario(s).`);
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar correo</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Plantilla</Label>
            <Select
              value={form.watch('template_id')}
              onValueChange={(v) => form.setValue('template_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.template_id && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.template_id.message}
              </p>
            )}
          </div>
          {senders.data && senders.data.length > 1 && (
            <div>
              <Label className="mb-1.5 block">Enviar desde</Label>
              <Select value={sender} onValueChange={setSender}>
                <SelectTrigger>
                  <SelectValue placeholder={senders.data[0]} />
                </SelectTrigger>
                <SelectContent>
                  {senders.data.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="recipients" className="mb-1.5 block">
              Destinatarios
            </Label>
            <textarea
              id="recipients"
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={'cliente@empresa.co, otro@empresa.co\no uno por línea (no tienen que ser prospectos)'}
              {...form.register('recipients')}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Cualquier correo, separados por coma, espacio o salto de línea. No necesitan ser prospectos.
            </p>
            {form.formState.errors.recipients && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.recipients.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              <Send className="h-4 w-4" /> Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
