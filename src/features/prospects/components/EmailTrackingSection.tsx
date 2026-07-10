import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MailOpen, Mail, Send, MessageSquare, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/states';
import {
  getProspectTracking,
  getResponsesByProspect,
  type ProspectCampaignGroup,
} from '@/features/emails/api/emails.api';
import { SendMessageDialog } from '@/features/emails/components/SendMessageDialog';
import { formatDateTime } from '@/lib/utils';

function CampaignBlock({
  group,
  onWrite,
  muted,
}: {
  group: ProspectCampaignGroup;
  onWrite: (email: string) => void;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-md border ${muted ? 'bg-muted/30' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <span className="truncate text-sm font-medium">{group.campaign_name}</span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Enviado <span className="font-semibold text-foreground">{group.sent}</span>
          </span>
          <span>
            Abierto <span className="font-semibold text-primary">{group.opened}</span>
          </span>
          <span>
            Respondido <span className="font-semibold text-foreground">{group.responded}</span>
          </span>
        </div>
      </div>
      <ul className="divide-y">
        {group.sends.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="truncate">{s.recipient_email}</div>
              <div className="text-xs text-muted-foreground">
                {s.opens > 0
                  ? `Abierto: ${formatDateTime(s.opened_at)}`
                  : s.status === 'failed'
                    ? `Intento: ${formatDateTime(s.date)}`
                    : `Enviado: ${formatDateTime(s.date)}`}
                {s.status === 'failed' && s.error ? ` · ${s.error}` : ''}
              </div>
            </div>
            {s.opens > 0 ? (
              <Badge variant="success">Abierto</Badge>
            ) : s.status === 'failed' ? (
              <Badge variant="destructive">Falló</Badge>
            ) : (
              <Badge variant="secondary">Enviado</Badge>
            )}
            {!muted && (
              <Button size="sm" variant="outline" onClick={() => onWrite(s.recipient_email)}>
                <Send className="mr-1 h-3.5 w-3.5" /> Escribir
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmailTrackingSection({ prospectId }: { prospectId: string }) {
  const { data } = useQuery({
    queryKey: ['email-tracking', prospectId],
    queryFn: () => getProspectTracking(prospectId),
  });
  const { data: responses } = useQuery({
    queryKey: ['email-responses', prospectId],
    queryFn: () => getResponsesByProspect(prospectId),
  });
  const [composeTo, setComposeTo] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const active = data?.active ?? [];
  const history = data?.history ?? [];
  const hasAny = active.length > 0 || history.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MailOpen className="h-4 w-4" /> Seguimiento de correo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasAny ? (
            <EmptyState
              title="Sin correos enviados"
              description="Cuando le envíes campañas o correos, aquí verás la campaña, si los abrió y a qué hora."
            />
          ) : (
            <>
              {active.length > 0 ? (
                <div className="space-y-3">
                  {active.map((g) => (
                    <CampaignBlock
                      key={g.campaign_id ?? 'individuales'}
                      group={g}
                      onWrite={setComposeTo}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay campañas en curso. Revise el historial abajo.
                </p>
              )}

              {history.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground"
                    onClick={() => setShowHistory((v) => !v)}
                  >
                    <History className="h-4 w-4" />
                    {showHistory ? 'Ocultar' : 'Ver'} historial de campañas ({history.length})
                  </Button>
                  {showHistory && (
                    <div className="space-y-3">
                      {history.map((g) => (
                        <CampaignBlock
                          key={g.campaign_id ?? 'hist'}
                          group={g}
                          onWrite={setComposeTo}
                          muted
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
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
      <SendMessageDialog
        open={composeTo !== null}
        onOpenChange={(o) => !o && setComposeTo(null)}
        toEmail={composeTo ?? ''}
        prospectId={prospectId}
      />
    </>
  );
}
