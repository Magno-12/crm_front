import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MailOpen, MessageSquare, MousePointerClick, History, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/states';
import { formatDateTime, formatDateOrTime } from '@/lib/utils';
import {
  getResponses,
  getCampaigns,
  getRecipients,
  type OpeningRow,
  type RecipientStatus,
} from '@/features/emails/api/emails.api';
import { getEmailEngagement } from '@/features/dashboard/api/dashboard.api';
import { CampaignDetailDialog } from '@/features/emails/components/CampaignDetailDialog';
import { SendMessageDialog } from '@/features/emails/components/SendMessageDialog';

type FilterKey = 'enviados' | 'abiertos' | 'clics' | 'respondidos' | 'no_enviados';

const SEND_STATUS: Record<Exclude<FilterKey, 'respondidos'>, RecipientStatus> = {
  enviados: 'sent',
  abiertos: 'opened',
  clics: 'clicked',
  no_enviados: 'no_enviados',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'enviados', label: 'Enviados' },
  { key: 'abiertos', label: 'Abiertos' },
  { key: 'clics', label: 'Con clic' },
  { key: 'respondidos', label: 'Respondidos' },
  { key: 'no_enviados', label: 'No enviados' },
];

function Stat({
  label,
  value,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: string;
  accent?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-center transition ${
        active ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/40 hover:bg-muted'
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? 'text-primary' : ''}`}>{value}</p>
    </button>
  );
}

/** Texto legible para un envío fallido. */
function failReason(error: string | null): string {
  const e = (error ?? '').toLowerCase();
  if (e.includes('daily_quota') || e.includes('quota') || e.includes('429')) {
    return 'No salió por el límite diario de envíos (se reintenta luego).';
  }
  return error ?? 'No se pudo enviar.';
}

export function AperturasPage() {
  const [filter, setFilter] = useState<FilterKey>('abiertos');
  // Por defecto incluimos también los correos que no están en la base.
  const [includeUnmatched, setIncludeUnmatched] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [compose, setCompose] = useState<{
    email: string;
    prospectId: string | null;
    subject: string | null;
  } | null>(null);

  const isResp = filter === 'respondidos';
  const recipients = useQuery({
    queryKey: ['email-recipients', filter],
    queryFn: () => getRecipients(SEND_STATUS[filter as Exclude<FilterKey, 'respondidos'>]),
    enabled: !isResp,
  });
  const responses = useQuery({
    queryKey: ['email-responses', includeUnmatched],
    queryFn: () => getResponses(1, includeUnmatched),
  });
  const campaigns = useQuery({ queryKey: ['email-campaigns'], queryFn: () => getCampaigns(1) });
  const engagement = useQuery({ queryKey: ['email-engagement'], queryFn: getEmailEngagement });

  const resp = responses.data;
  const eng = engagement.data;
  const sent = eng?.sent ?? 0;
  const responded = resp?.total ?? 0;
  const respondedRate = sent ? Math.round((responded / sent) * 1000) / 10 : 0;

  const listTotal = isResp ? (resp?.total ?? 0) : (recipients.data?.total ?? 0);
  const rows: OpeningRow[] = recipients.data?.items ?? [];

  const whenLabel =
    filter === 'enviados'
      ? 'Enviado'
      : filter === 'clics'
        ? 'Con clic'
        : filter === 'no_enviados'
          ? 'Motivo'
          : 'Abierto';

  const whenValue = (o: OpeningRow) => {
    if (filter === 'no_enviados')
      return <span className="text-xs text-destructive">{failReason(o.error)}</span>;
    const d = filter === 'enviados' ? o.sent_at : filter === 'clics' ? o.clicked_at : o.opened_at;
    return <span className="font-medium text-primary">{formatDateTime(d)}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Seguimiento de correo</h1>
        <p className="text-sm text-muted-foreground">
          Toque un recuadro o un filtro para ver quién recibió, abrió, respondió o no le llegó.
        </p>
      </div>

      {/* Resumen (clic para filtrar) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat
          label="Enviados"
          value={String(sent)}
          active={filter === 'enviados'}
          onClick={() => setFilter('enviados')}
        />
        <Stat
          label="Abiertos"
          value={String(eng?.opened ?? 0)}
          active={filter === 'abiertos'}
          onClick={() => setFilter('abiertos')}
        />
        <Stat
          label="Respondidos"
          value={String(responded)}
          active={filter === 'respondidos'}
          onClick={() => setFilter('respondidos')}
        />
        <Stat
          label="% Abierto"
          value={`${eng?.open_rate ?? 0}%`}
          accent
          active={filter === 'abiertos'}
          onClick={() => setFilter('abiertos')}
        />
        <Stat
          label="% Respondido"
          value={`${respondedRate}%`}
          accent
          active={filter === 'respondidos'}
          onClick={() => setFilter('respondidos')}
        />
      </div>

      {/* Filtro */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? 'default' : 'outline'}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Lista filtrada */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {isResp ? <MessageSquare className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
              {FILTERS.find((f) => f.key === filter)?.label}
              <Badge variant="secondary" className="ml-1">
                {listTotal}
              </Badge>
            </CardTitle>
            {isResp && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeUnmatched}
                  onChange={(e) => setIncludeUnmatched(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Incluir correos que no están en la base
              </label>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isResp ? (
            !resp || resp.items.length === 0 ? (
              <EmptyState
                title="Sin respuestas aún"
                description="Cuando un cliente responda un correo, aquí podrá leerlo sin salir del sistema."
              />
            ) : (
              <ul className="divide-y rounded-md border">
                {resp.items.map((r) => (
                  <li key={r.id} className="space-y-1 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      {r.prospect_id ? (
                        <Link
                          to={`/prospects/${r.prospect_id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {r.razon_social || r.from_email}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {r.from_email}
                          <Badge variant="secondary" className="text-[10px]">
                            no está en la base
                          </Badge>
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(r.received_at)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() =>
                            setCompose({
                              email: r.from_email,
                              prospectId: r.prospect_id,
                              subject: r.subject,
                            })
                          }
                        >
                          <Send className="h-3.5 w-3.5" /> Responder
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{r.from_email}</div>
                    {r.subject && <div className="text-sm font-medium">{r.subject}</div>}
                    {r.snippet && <p className="text-sm text-muted-foreground">{r.snippet}</p>}
                  </li>
                ))}
              </ul>
            )
          ) : recipients.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : rows.length === 0 ? (
            <EmptyState title="Sin resultados" description="No hay correos en este estado." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Empresa / correo</th>
                    <th className="py-2 pr-3 font-medium">Campaña</th>
                    <th className="py-2 pr-3 font-medium">{whenLabel}</th>
                    {filter === 'abiertos' && <th className="py-2 pr-3 font-medium">Clic</th>}
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        {o.prospect_id ? (
                          <Link
                            to={`/prospects/${o.prospect_id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {o.razon_social || o.recipient_email}
                          </Link>
                        ) : (
                          <span className="font-medium">{o.razon_social || o.recipient_email}</span>
                        )}
                        <div className="text-xs text-muted-foreground">{o.recipient_email}</div>
                      </td>
                      <td className="max-w-[220px] truncate py-2 pr-3 text-muted-foreground">
                        {o.campana || o.subject || '—'}
                      </td>
                      <td className="py-2 pr-3">{whenValue(o)}</td>
                      {filter === 'abiertos' && (
                        <td className="py-2 pr-3">
                          {o.clicked_at ? (
                            <Badge variant="success" className="gap-1">
                              <MousePointerClick className="h-3 w-3" /> Sí
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      <td className="py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() =>
                              setCompose({
                                email: o.recipient_email,
                                prospectId: o.prospect_id,
                                subject: o.campana || o.subject,
                              })
                            }
                          >
                            <Send className="h-3.5 w-3.5" /> Reenviar
                          </Button>
                          {o.prospect_id && (
                            <Button asChild size="sm" variant="ghost">
                              <Link to={`/prospects/${o.prospect_id}`}>Ver ficha</Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de campañas (al final) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Historial de campañas
            {campaigns.data && (
              <Badge variant="secondary" className="ml-1">
                {campaigns.data.total}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!campaigns.data || campaigns.data.items.length === 0 ? (
            <EmptyState
              title="Aún no hay campañas"
              description="Cuando envíes una campaña, aquí verás su historial: inicio, fin y resultados."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Campaña</th>
                    <th className="py-2 pr-3 font-medium">Inicio</th>
                    <th className="py-2 pr-3 font-medium">Fin</th>
                    <th className="py-2 pr-3 font-medium">Audiencia</th>
                    <th className="py-2 pr-3 font-medium">Enviados %</th>
                    <th className="py-2 pr-3 font-medium">No enviados %</th>
                    <th className="py-2 pr-3 font-medium">Abierto %</th>
                    <th className="py-2 pr-3 font-medium">Respondidos %</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.data.items.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                      onClick={() => setDetailId(c.id)}
                      title="Ver detalle de la campaña"
                    >
                      <td className="max-w-[220px] truncate py-2 pr-3 font-medium text-primary">
                        {c.name}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {formatDateOrTime(c.started_at)}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {c.finished_at ? formatDateOrTime(c.finished_at) : 'En curso'}
                      </td>
                      <td className="py-2 pr-3">{c.audience}</td>
                      <td className="py-2 pr-3">
                        {c.sent} <span className="text-xs text-muted-foreground">· {c.sent_rate}%</span>
                      </td>
                      <td className="py-2 pr-3">
                        {c.no_enviados}{' '}
                        <span className="text-xs text-muted-foreground">· {c.no_enviados_rate}%</span>
                      </td>
                      <td className="py-2 pr-3">
                        {c.opened}{' '}
                        <span className="text-xs font-medium text-primary">· {c.open_rate}%</span>
                      </td>
                      <td className="py-2 pr-3">
                        {c.responses}{' '}
                        <span className="text-xs text-muted-foreground">· {c.response_rate}%</span>
                      </td>
                      <td className="py-2 text-right">
                        <span className="whitespace-nowrap text-xs font-medium text-primary">
                          Ver campaña →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignDetailDialog campaignId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />

      <SendMessageDialog
        open={!!compose}
        onOpenChange={(o) => !o && setCompose(null)}
        toEmail={compose?.email ?? ''}
        prospectId={compose?.prospectId ?? null}
        defaultSubject={compose?.subject ?? null}
      />
    </div>
  );
}
