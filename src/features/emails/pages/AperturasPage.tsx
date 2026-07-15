import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MailOpen, MessageSquare, MousePointerClick, Send, ArrowLeft, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/states';
import { formatDateTime, formatDateOrTime } from '@/lib/utils';
import {
  getResponses,
  getCampaigns,
  getCampaignDetail,
  getRecipients,
  type OpeningRow,
  type RecipientStatus,
  type CampaignHistoryRow,
} from '@/features/emails/api/emails.api';
import { SendMessageDialog } from '@/features/emails/components/SendMessageDialog';

type FilterKey = 'recibidos' | 'no_recibidos' | 'abiertos' | 'clics' | 'respondidos';

const SEND_STATUS: Record<Exclude<FilterKey, 'respondidos'>, RecipientStatus> = {
  recibidos: 'sent',
  no_recibidos: 'no_enviados',
  abiertos: 'opened',
  clics: 'clicked',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'recibidos', label: 'Recibidos' },
  { key: 'no_recibidos', label: 'No recibidos' },
  { key: 'abiertos', label: 'Abiertos' },
  { key: 'respondidos', label: 'Respondidos' },
  { key: 'clics', label: 'Con clic' },
];

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);

function Recuadro({
  label,
  value,
  sub,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-lg border p-3 text-center transition ${
        active ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/40'
      } ${onClick ? 'hover:bg-muted' : ''}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? 'text-primary' : ''}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Comp>
  );
}

function failReason(error: string | null): string {
  const e = (error ?? '').toLowerCase();
  if (e.includes('daily_quota') || e.includes('quota') || e.includes('429')) {
    return 'No salió por el límite diario de envíos (se reintenta luego).';
  }
  return error ?? 'No se pudo enviar.';
}

/** Detalle de una campaña: recuadros + filtro + lista de correos (sin Reenviar). */
function CampaignDetail({
  campaign,
  onBack,
}: {
  campaign: CampaignHistoryRow;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<FilterKey>('recibidos');
  const [includeUnmatched, setIncludeUnmatched] = useState(true);
  const [compose, setCompose] = useState<{
    email: string;
    prospectId: string | null;
    subject: string | null;
  } | null>(null);

  const total = campaign.audience;
  const isResp = filter === 'respondidos';
  const recipients = useInfiniteQuery({
    queryKey: ['email-recipients', campaign.id, filter],
    queryFn: ({ pageParam }) =>
      getRecipients(
        SEND_STATUS[filter as Exclude<FilterKey, 'respondidos'>],
        campaign.id,
        pageParam,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
    enabled: !isResp,
  });
  const responses = useInfiniteQuery({
    queryKey: ['email-responses', campaign.id, includeUnmatched],
    queryFn: ({ pageParam }) => getResponses(pageParam, includeUnmatched, campaign.id),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
    enabled: isResp,
  });

  const detail = useQuery({
    queryKey: ['email-campaign-detail', campaign.id],
    queryFn: () => getCampaignDetail(campaign.id),
  });
  const envios = detail.data?.envios ?? [];

  const rows: OpeningRow[] = recipients.data?.pages.flatMap((p) => p.items) ?? [];
  const responseItems = responses.data?.pages.flatMap((p) => p.items) ?? [];
  const listTotal = isResp
    ? (responses.data?.pages[0]?.total ?? 0)
    : (recipients.data?.pages[0]?.total ?? 0);

  const whenLabel =
    filter === 'recibidos'
      ? 'Recibido'
      : filter === 'clics'
        ? 'Con clic'
        : filter === 'no_recibidos'
          ? 'Motivo'
          : 'Abierto';
  const whenValue = (o: OpeningRow) => {
    if (filter === 'no_recibidos')
      return <span className="text-xs text-destructive">{failReason(o.error)}</span>;
    const d = filter === 'recibidos' ? o.sent_at : filter === 'clics' ? o.clicked_at : o.opened_at;
    return <span className="font-medium text-primary">{formatDateTime(d)}</span>;
  };

  // Solo la fecha de envío por correo (no inicio/fin). Los envíos se agrupan por
  // día real; la cabecera cuadra con el bloque "Envíos".
  const lastEnvio = envios[envios.length - 1];
  const sendLabel =
    envios.length > 1
      ? `${envios.length} envíos por correo`
      : lastEnvio
        ? `Enviada el ${formatDateOrTime(lastEnvio.date)}`
        : campaign.send_date
          ? `Enviada el ${formatDateOrTime(campaign.send_date)}`
          : 'Aún sin envíos';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Campañas
          </Button>
          <div>
            <CardTitle className="text-base">{campaign.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{sendLabel}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Envíos: cada lote enviado con su día y cifras (una campaña puede tener varios) */}
        {envios.length > 0 && (
          <div className="rounded-lg border">
            <div className="border-b px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
              Envíos ({envios.length})
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Fecha de envío</th>
                  <th className="px-3 py-2 font-medium">Enviados</th>
                  <th className="px-3 py-2 font-medium">Recibidos</th>
                  <th className="px-3 py-2 font-medium">Abiertos</th>
                </tr>
              </thead>
              <tbody>
                {envios.map((e, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      {e.date ? formatDateOrTime(e.date) : '—'}
                    </td>
                    <td className="px-3 py-2">{e.audience}</td>
                    <td className="px-3 py-2">{e.sent}</td>
                    <td className="px-3 py-2 text-primary">{e.opened}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recuadros de la campaña (porcentajes sobre el total de enviados) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <Recuadro label="Enviados" value={String(total)} sub="100%" />
          <Recuadro
            label="Recibidos"
            value={String(campaign.sent)}
            sub={`${pct(campaign.sent, total)}%`}
            active={filter === 'recibidos'}
            onClick={() => setFilter('recibidos')}
          />
          <Recuadro
            label="No recibidos"
            value={String(campaign.no_enviados)}
            sub={`${pct(campaign.no_enviados, total)}%`}
            active={filter === 'no_recibidos'}
            onClick={() => setFilter('no_recibidos')}
          />
          <Recuadro
            label="Abiertos"
            value={String(campaign.opened)}
            sub={`${pct(campaign.opened, total)}%`}
            accent
            active={filter === 'abiertos'}
            onClick={() => setFilter('abiertos')}
          />
          <Recuadro
            label="Respondidos"
            value={String(campaign.responses)}
            sub={`${pct(campaign.responses, total)}%`}
            accent
            active={filter === 'respondidos'}
            onClick={() => setFilter('respondidos')}
          />
          <Recuadro
            label="Clics"
            value={String(campaign.clicked)}
            sub={`${pct(campaign.clicked, total)}%`}
            active={filter === 'clics'}
            onClick={() => setFilter('clics')}
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

        {/* Lista */}
        <div className="flex items-center gap-2 text-sm font-medium">
          {isResp ? <MessageSquare className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
          {FILTERS.find((f) => f.key === filter)?.label}
          <Badge variant="secondary">{listTotal}</Badge>
          {isResp && (
            <label className="ml-auto flex items-center gap-2 text-xs font-normal text-muted-foreground">
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

        {isResp ? (
          responseItems.length === 0 ? (
            <EmptyState title="Sin respuestas" description="Nadie ha respondido esta campaña aún." />
          ) : (
            <>
            <ul className="divide-y rounded-md border">
              {responseItems.map((r) => (
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
            {responses.hasNextPage && (
              <div className="mt-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={responses.isFetchingNextPage}
                  onClick={() => responses.fetchNextPage()}
                >
                  {responses.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
                </Button>
              </div>
            )}
            </>
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
                    <td className="py-2 text-right">
                      {o.prospect_id && (
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/prospects/${o.prospect_id}`}>Ver ficha</Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recipients.hasNextPage && (
              <div className="mt-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={recipients.isFetchingNextPage}
                  onClick={() => recipients.fetchNextPage()}
                >
                  {recipients.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <SendMessageDialog
        open={!!compose}
        onOpenChange={(o) => !o && setCompose(null)}
        toEmail={compose?.email ?? ''}
        prospectId={compose?.prospectId ?? null}
        defaultSubject={compose?.subject ?? null}
      />
    </Card>
  );
}

export function AperturasPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const campaigns = useQuery({ queryKey: ['email-campaigns'], queryFn: () => getCampaigns(1) });

  const items = campaigns.data?.items ?? [];
  const selected = items.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Seguimiento de correo</h1>
        <p className="text-sm text-muted-foreground">
          Cada campaña con su trazabilidad: recibidos, abiertos, respondidos y clics.
        </p>
      </div>

      {selected ? (
        <CampaignDetail campaign={selected} onBack={() => setSelectedId(null)} />
      ) : (
        /* Mercadeo de campañas: elige una para ver su seguimiento */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4" /> Mercadeo de campañas
              {campaigns.data && (
                <Badge variant="secondary" className="ml-1">
                  {campaigns.data.total}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <EmptyState
                title="Aún no hay campañas"
                description="Cuando envíes una campaña, aquí aparecerá para ver su seguimiento."
              />
            ) : (
              <ul className="divide-y rounded-md border">
                {items.map((c) => (
                  <li
                    key={c.id}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-3 py-3 hover:bg-muted/40"
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-primary">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.envios_count > 1
                          ? `${c.envios_count} envíos · último ${formatDateOrTime(
                              c.send_date ?? c.started_at,
                            )}`
                          : `Enviada el ${formatDateOrTime(c.send_date ?? c.started_at)}`}
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-sm font-medium text-primary">
                      Ver campaña →
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
