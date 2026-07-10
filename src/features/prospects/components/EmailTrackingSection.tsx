import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MailOpen, Send, MessageSquare, History, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/common/states';
import {
  getProspectTracking,
  getResponsesByProspect,
  type ProspectCampaignGroup,
} from '@/features/emails/api/emails.api';
import { SendMessageDialog } from '@/features/emails/components/SendMessageDialog';
import { formatDate, formatDateTime } from '@/lib/utils';

/** Traduce el error de un envío fallido a algo legible. */
function failureInfo(error: string | null): { quota: boolean; reason: string } {
  const e = (error ?? '').toLowerCase();
  if (e.includes('daily_quota') || e.includes('quota') || e.includes('429')) {
    return {
      quota: true,
      reason:
        'No salió porque se alcanzó el límite diario de envíos. El correo y el destinatario ' +
        'están bien; reinténtelo con «Responder».',
    };
  }
  return { quota: false, reason: error ?? 'No se pudo enviar.' };
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function CampaignBlock({
  group,
  onWrite,
  defaultOpen = false,
}: {
  group: ProspectCampaignGroup;
  onWrite: (email: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const dateRange =
    group.started_at &&
    `${formatDate(group.started_at)}${group.finished_at ? ` — ${formatDate(group.finished_at)}` : ' — en curso'}`;

  return (
    <div className="rounded-md border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/40"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{group.campaign_name}</span>
          {group.finished && (
            <Badge variant="secondary" className="text-[10px]">
              Terminada
            </Badge>
          )}
        </span>
        <span className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Enviados <span className="font-semibold text-foreground">{group.sent}</span>
          </span>
          <span>
            No enviados <span className="font-semibold text-foreground">{group.no_enviados}</span>
          </span>
          <span>
            Abiertos <span className="font-semibold text-primary">{group.opened}</span>
          </span>
          <span>
            Respondidos <span className="font-semibold text-foreground">{group.responded}</span>
          </span>
          <span className="text-primary">{open ? 'Ocultar' : 'Ver campaña'}</span>
        </span>
      </button>

      {open && (
        <>
          {dateRange && (
            <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">{dateRange}</div>
          )}
          <ul className="divide-y border-t">
            {group.sends.map((s) => {
              const failed = s.status === 'failed';
              const fail = failed ? failureInfo(s.error) : null;
              return (
                <li key={s.id} className="space-y-2 px-3 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">{s.recipient_email}</span>
                    {s.opens > 0 ? (
                      <Badge variant="success">Abierto</Badge>
                    ) : fail?.quota ? (
                      <Badge variant="warning">No enviado</Badge>
                    ) : failed ? (
                      <Badge variant="destructive">Falló</Badge>
                    ) : (
                      <Badge variant="secondary">Enviado</Badge>
                    )}
                  </div>
                  <div className="space-y-1 rounded-md bg-muted/40 px-3 py-2 text-xs">
                    <StatusLine
                      label={
                        failed ? (fail?.quota ? 'No enviado (límite diario)' : 'Intento de envío') : 'Enviado'
                      }
                      value={formatDateTime(s.date)}
                    />
                    <StatusLine
                      label="Abierto"
                      value={s.opened_at ? formatDateTime(s.opened_at) : 'Sin abrir aún'}
                    />
                    <StatusLine
                      label="Respondido"
                      value={
                        group.responded_at ? formatDateTime(group.responded_at) : 'Sin responder'
                      }
                    />
                    {fail && (
                      <div className={`pt-1 ${fail.quota ? 'text-muted-foreground' : 'text-destructive'}`}>
                        {fail.reason}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => onWrite(s.recipient_email)}>
                      <Send className="mr-1 h-3.5 w-3.5" /> Responder
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export function EmailTrackingSection({ prospectId }: { prospectId: string }) {
  const tracking = useQuery({
    queryKey: ['email-tracking', prospectId],
    queryFn: () => getProspectTracking(prospectId),
  });
  const { data: responses } = useQuery({
    queryKey: ['email-responses', prospectId],
    queryFn: () => getResponsesByProspect(prospectId),
  });
  const [composeTo, setComposeTo] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const data = tracking.data;
  const current = data?.current ?? [];
  const history = data?.history ?? [];
  const hasAny = current.length > 0 || history.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MailOpen className="h-4 w-4" /> Seguimiento de correo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tracking.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando correos…</p>
          ) : tracking.isError ? (
            <ErrorState error={tracking.error} onRetry={() => tracking.refetch()} />
          ) : !hasAny ? (
            <EmptyState
              title="Sin correos enviados"
              description="Cuando le envíes una campaña, aquí verás su trazabilidad: enviado, abierto y respondido, con fecha."
            />
          ) : (
            <>
              {/* Campaña actual (abierta) */}
              {current.map((g) => (
                <CampaignBlock
                  key={g.campaign_id ?? 'actual'}
                  group={g}
                  onWrite={setComposeTo}
                  defaultOpen
                />
              ))}

              {/* Historial de campañas anteriores */}
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
                    <div className="space-y-2">
                      {history.map((g) => (
                        <CampaignBlock
                          key={g.campaign_id ?? 'hist'}
                          group={g}
                          onWrite={setComposeTo}
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
