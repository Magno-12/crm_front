import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
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
import { sendMessage } from '@/features/emails/api/emails.api';
import { apiErrorMessage } from '@/api/client';

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

  useEffect(() => {
    if (open) {
      const base = defaultSubject?.trim();
      setSubject(base ? (base.toLowerCase().startsWith('re:') ? base : `Re: ${base}`) : '');
      setBody('');
    }
  }, [open, defaultSubject]);

  const mut = useMutation({
    mutationFn: () =>
      sendMessage({ to_email: toEmail, subject, body, prospect_id: prospectId ?? null }),
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
