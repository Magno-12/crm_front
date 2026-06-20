import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Plus, Send } from 'lucide-react';
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
  createTemplate,
  listTemplates,
  sendEmail,
} from '@/features/emails/api/emails.api';
import { apiErrorMessage } from '@/api/client';

export function EmailsPage() {
  const templates = useQuery({ queryKey: ['email-templates'], queryFn: listTemplates });
  const [templateOpen, setTemplateOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Correos</h1>
          <p className="text-sm text-muted-foreground">Plantillas y envíos vía ListMonk.</p>
        </div>
        <div className="flex gap-2">
          <Can code="emails.templates.create">
            <Button variant="outline" onClick={() => setTemplateOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva plantilla
            </Button>
          </Can>
          <Can code="emails.send">
            <Button onClick={() => setComposerOpen(true)}>
              <Send className="h-4 w-4" /> Enviar correo
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
            <Card key={t.id}>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} />
      <ComposerDialog
        open={composerOpen}
        onOpenChange={setComposerOpen}
        templates={templates.data ?? []}
      />
    </div>
  );
}

const templateSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  subject: z.string().min(1, 'Requerido'),
  body_html: z.string().min(1, 'Requerido'),
});
type TemplateInput = z.infer<typeof templateSchema>;

function TemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const form = useForm<TemplateInput>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', subject: '', body_html: '' },
  });
  const mut = useMutation({
    mutationFn: (body: TemplateInput) => createTemplate({ ...body, variables: [], is_active: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla creada');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva plantilla</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-1.5 block">
              Nombre
            </Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="subject" className="mb-1.5 block">
              Asunto
            </Label>
            <Input id="subject" placeholder="Hola $nombre" {...form.register('subject')} />
          </div>
          <div>
            <Label htmlFor="body" className="mb-1.5 block">
              Cuerpo HTML
            </Label>
            <textarea
              id="body"
              rows={6}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="<p>Hola $nombre, …</p>"
              {...form.register('body_html')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              Crear
            </Button>
          </DialogFooter>
        </form>
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
