import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { createTemplate } from '@/features/emails/api/emails.api';
import {
  DEFAULT_FIELDS,
  DESIGNS,
  detectVariables,
  withSampleData,
  type TemplateFields,
} from '@/features/emails/lib/templates';
import { apiErrorMessage } from '@/api/client';

export function TemplateBuilderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [designId, setDesignId] = useState(DESIGNS[0]!.id);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Información de su firma contable');
  const [fields, setFields] = useState<TemplateFields>(DEFAULT_FIELDS);

  const design = DESIGNS.find((d) => d.id === designId) ?? DESIGNS[0]!;
  const html = useMemo(() => design.render(fields), [design, fields]);
  const preview = useMemo(() => withSampleData(html), [html]);

  const set = (key: keyof TemplateFields, value: string) =>
    setFields((f) => ({ ...f, [key]: value }));

  const mut = useMutation({
    mutationFn: () =>
      createTemplate({
        name,
        subject,
        body_html: html,
        variables: detectVariables(html + ' ' + subject),
        is_active: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla creada');
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Nueva plantilla de correo</DialogTitle>
          <DialogDescription>
            Elige un diseño, edita los textos y mira la previsualización en vivo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-2">
          {/* Editor */}
          <div className="space-y-4 overflow-y-auto border-r p-6">
            <div>
              <Label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
                Diseño
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {DESIGNS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDesignId(d.id)}
                    className={cn(
                      'relative overflow-hidden rounded-lg border text-left transition',
                      designId === d.id
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    {designId === d.id && (
                      <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-primary p-0.5 text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <div className="pointer-events-none h-24 w-full overflow-hidden bg-white">
                      <iframe
                        title={d.name}
                        srcDoc={withSampleData(d.render(DEFAULT_FIELDS))}
                        className="h-[360px] w-[600px] origin-top-left"
                        style={{ transform: 'scale(0.32)' }}
                      />
                    </div>
                    <div className="border-t px-2 py-1.5">
                      <p className="text-xs font-medium">{d.name}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{design.description}</p>
            </div>

            <Field label="Nombre de la plantilla (interno)">
              <Input
                placeholder="Ej. Bienvenida prospectos"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Asunto del correo">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre de la firma (encabezado)">
                <Input value={fields.company} onChange={(e) => set('company', e.target.value)} />
              </Field>
              <Field label="Lema (opcional)">
                <Input value={fields.tagline} onChange={(e) => set('tagline', e.target.value)} />
              </Field>
            </div>
            <Field label="Título principal">
              <Input value={fields.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label="Subtítulo (opcional)">
              <Input value={fields.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
            </Field>
            <Field label="Cuerpo del mensaje" hint="Usa $razon_social, $nit, $ciudad para personalizar.">
              <textarea
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={fields.body}
                onChange={(e) => set('body', e.target.value)}
              />
            </Field>
            <Field label="Recuadro destacado (opcional)" hint="Una frase clave: un vencimiento, una promo…">
              <Input value={fields.highlight} onChange={(e) => set('highlight', e.target.value)} />
            </Field>
            <Field
              label="Lista / pasos (opcional)"
              hint="Una línea por punto. Sale con check ✓ (o numerada en Bienvenida)."
            >
              <textarea
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={fields.points}
                onChange={(e) => set('points', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Texto del botón (opcional)">
                <Input value={fields.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} />
              </Field>
              <Field label="Enlace del botón">
                <Input value={fields.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value)} />
              </Field>
            </div>
            <Field label="Firma">
              <textarea
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={fields.signature}
                onChange={(e) => set('signature', e.target.value)}
              />
            </Field>
            <Field label="Pie / contacto (opcional)">
              <Input value={fields.contact} onChange={(e) => set('contact', e.target.value)} />
            </Field>
          </div>

          {/* Previsualización en vivo */}
          <div className="hidden flex-col bg-muted/40 md:flex">
            <div className="border-b px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
              Previsualización en vivo
            </div>
            <iframe title="preview" srcDoc={preview} className="h-full w-full flex-1" />
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!name.trim()) return toast.error('Ponle un nombre a la plantilla');
              mut.mutate();
            }}
            disabled={mut.isPending}
          >
            Guardar plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
