import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Paperclip, Send, X } from 'lucide-react';
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
import { sendMessage, type EmailAttachment } from '@/features/emails/api/emails.api';
import { apiErrorMessage } from '@/api/client';

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // 15 MB en total (límite práctico de correo)

/** Lee un archivo y lo devuelve como adjunto en base64 (sin el prefijo data:). */
function fileToAttachment(file: File): Promise<EmailAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.slice(result.indexOf(',') + 1);
      resolve({
        filename: file.name,
        content: base64,
        content_type: file.type || 'application/octet-stream',
      });
    };
    reader.readAsDataURL(file);
  });
}

export function SendMessageDialog({
  open,
  onOpenChange,
  toEmail,
  prospectId,
  defaultSubject,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  toEmail: string;
  prospectId?: string | null;
  defaultSubject?: string | null;
}) {
  const qc = useQueryClient();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const base = defaultSubject?.trim();
      setSubject(base ? (base.toLowerCase().startsWith('re:') ? base : `Re: ${base}`) : '');
      setBody('');
      setFiles([]);
    }
  }, [open, defaultSubject]);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...files, ...Array.from(list)].slice(0, MAX_FILES);
    const total = next.reduce((sum, f) => sum + f.size, 0);
    if (next.length > MAX_FILES) {
      toast.error(`Máximo ${MAX_FILES} archivos.`);
      return;
    }
    if (total > MAX_TOTAL_BYTES) {
      toast.error('Los adjuntos superan 15 MB en total.');
      return;
    }
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const mut = useMutation({
    mutationFn: async () => {
      const attachments = await Promise.all(files.map(fileToAttachment));
      return sendMessage({
        to_email: toEmail,
        subject,
        body,
        prospect_id: prospectId ?? null,
        attachments,
      });
    },
    onSuccess: () => {
      toast.success('Correo enviado');
      qc.invalidateQueries({ queryKey: ['email-openings'] });
      if (prospectId) qc.invalidateQueries({ queryKey: ['email-sends', prospectId] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Escribir correo</DialogTitle>
          <DialogDescription>Para: {toEmail}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="msg-subject" className="mb-1.5 block">
              Asunto
            </Label>
            <Input
              id="msg-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del correo"
            />
          </div>
          <div>
            <Label htmlFor="msg-body" className="mb-1.5 block">
              Mensaje
            </Label>
            <textarea
              id="msg-body"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escriba aquí su mensaje…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Adjuntar archivos */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" /> Adjuntar archivo
            </Button>
            {files.length > 0 && (
              <ul className="space-y-1">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {f.name}{' '}
                      <span className="text-xs text-muted-foreground">
                        ({Math.max(1, Math.round(f.size / 1024))} KB)
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Quitar ${f.name}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={mut.isPending || !subject.trim() || !body.trim()}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
