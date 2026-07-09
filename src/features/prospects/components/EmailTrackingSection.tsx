import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MailOpen, Mail, Send, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/states';
import { emailSendsByProspect } from '@/features/prospects/api/prospects.api';
import { getResponsesByProspect, resendEmail } from '@/features/emails/api/emails.api';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/api/client';

export function EmailTrackingSection({ prospectId }: { prospectId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['email-sends', prospectId],
    queryFn: () => emailSendsByProspect(prospectId),
  });
  const { data: responses } = useQuery({
    queryKey: ['email-responses', prospectId],
    queryFn: () => getResponsesByProspect(prospectId),
  });

  const resend = useMutation({
    mutationFn: (id: string) => resendEmail(id),
    onSuccess: () => {
      toast.success('Correo reenviado');
      qc.invalidateQueries({ queryKey: ['email-sends', prospectId] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const opened = data?.filter((d) => d.opens > 0).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MailOpen className="h-4 w-4" /> Apertura de correos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data || data.length === 0 ? (
          <EmptyState
            title="Sin correos enviados"
            description="Cuando le envíes campañas o correos, aquí verás si los abrió y a qué hora."
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {data.length} correo(s) enviado(s) ·{' '}
              <span className="font-medium text-primary">{opened} abierto(s)</span>
            </p>
            <ul className="divide-y rounded-md border">
              {data.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{s.recipient_email}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.opens > 0
                        ? `Abierto: ${formatDateTime(s.opened_at)}`
                        : `Enviado: ${formatDateTime(s.sent_at)}`}
                    </div>
                  </div>
                  {s.opens > 0 ? (
                    <Badge variant="success">Abierto</Badge>
                  ) : s.status === 'failed' ? (
                    <Badge variant="destructive">Falló</Badge>
                  ) : (
                    <Badge variant="secondary">Enviado</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resend.isPending}
                    onClick={() => resend.mutate(s.id)}
                  >
                    <Send className="mr-1 h-3.5 w-3.5" /> Reenviar
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Respuestas del cliente */}
        {responses && responses.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-primary" /> Respuestas ({responses.length})
            </p>
            <ul className="divide-y rounded-md border bg-muted/30">
              {responses.map((r) => (
                <li key={r.id} className="space-y-0.5 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{r.subject || '(sin asunto)'}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(r.received_at)}
                    </span>
                  </div>
                  {r.snippet && <p className="text-sm text-muted-foreground">{r.snippet}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
