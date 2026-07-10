import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
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
import { updateTemplate } from '@/features/emails/api/emails.api';
import { detectVariables, withSampleData } from '@/features/emails/lib/templates';
import { apiErrorMessage } from '@/api/client';
import type { EmailTemplateRead } from '@/types/api';

export function TemplateEditDialog({
  template,
  onOpenChange,
}: {
  template: EmailTemplateRead | null;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBodyHtml(template.body_html);
    }
  }, [template]);

  const preview = useMemo(() => withSampleData(bodyHtml), [bodyHtml]);

  const mut = useMutation({
    mutationFn: () =>
      updateTemplate(template!.id, {
        name,
        subject,
        body_html: bodyHtml,
        variables: detectVariables(bodyHtml + ' ' + subject),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla actualizada');
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && !mut.isPending && onOpenChange(false)}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Editar plantilla</DialogTitle>
          <DialogDescription>
            Edita el nombre, el asunto y el HTML del correo. Usa $razon_social, $nit, $ciudad para
            personalizar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-2">
          {/* Editor */}
          <div className="space-y-4 overflow-y-auto border-r p-6">
            <div>
              <Label className="mb-1.5 block text-sm">Nombre de la plantilla (interno)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Asunto del correo</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">HTML del correo</Label>
              <textarea
                rows={18}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
              />
            </div>
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
            className="gap-1"
            onClick={() => {
              if (!name.trim()) return toast.error('Ponle un nombre a la plantilla');
              if (!subject.trim()) return toast.error('Ponle un asunto');
              if (!bodyHtml.trim()) return toast.error('El HTML no puede quedar vacío');
              mut.mutate();
            }}
            disabled={mut.isPending}
          >
            {mut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
