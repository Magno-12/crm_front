import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Plus, Send, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
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
  getAudienceCount,
  listTemplates,
  sendCampaign,
  sendEmail,
} from '@/features/emails/api/emails.api';
import { TemplateBuilderDialog } from '@/features/emails/components/TemplateBuilderDialog';
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

export function EmailsPage() {
  const templates = useQuery({ queryKey: ['email-templates'], queryFn: listTemplates });
  const [templateOpen, setTemplateOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateRead | null>(null);

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
                <CardTitle className="flex items-center justify-between text-base">
                  {t.name}
                  {t.is_active ? (
                    <Badge variant="success">Activa</Badge>
                  ) : (
                    <Badge variant="secondary">Inactiva</Badge>
                  )}
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
  const debouncedCiiu = useDebounce(ciiu, 400);

  const filters = {
    segmento: segmento === 'all' ? undefined : segmento,
    estado: estado === 'all' ? undefined : estado,
    actividad_ciiu: debouncedCiiu || undefined,
  };

  const audience = useQuery({
    queryKey: ['email-audience', filters],
    queryFn: () => getAudienceCount(filters),
    enabled: open,
  });

  const mut = useMutation({
    mutationFn: () => sendCampaign({ template_id: templateId, ...filters }),
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

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            Audiencia con correo:{' '}
            <span className="font-semibold">{audience.isLoading ? '…' : count}</span> prospecto(s).
            {count > 500 && (
              <span className="text-muted-foreground"> Se enviará a los primeros 500.</span>
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
            <Megaphone className="h-4 w-4" /> Enviar a {Math.min(count, 500)}
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
  const mut = useMutation({
    mutationFn: (v: ComposerInput) =>
      sendEmail({
        template_id: v.template_id,
        recipients: v.recipients
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
        variables: {},
      }),
    onSuccess: (res) => {
      toast.success(`Enviados: ${res.sent}, fallidos: ${res.failed}`);
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
          <div>
            <Label htmlFor="recipients" className="mb-1.5 block">
              Destinatarios (separados por coma)
            </Label>
            <Input
              id="recipients"
              placeholder="cliente@empresa.co, otro@empresa.co"
              {...form.register('recipients')}
            />
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
