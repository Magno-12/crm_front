import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  MailOpen,
  MessageSquare,
  MousePointerClick,
  Send,
  ArrowLeft,
  Megaphone,
  Loader2,
  Pencil,
  Archive,
  RotateCcw,
  FileDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { EmptyState } from '@/components/common/states';
import { Can } from '@/components/auth/Can';
import { apiErrorMessage } from '@/api/client';
import { formatDateTime, formatDateOrTime } from '@/lib/utils';
import {
  getResponses,
  getCampaigns,
  getCampaignDetail,
  getRecipients,
  archiveCampaign,
  exportSends,
  updateCampaignDates,
  listTemplates,
  getAudienceCount,
  getSendLimits,
  sendCampaign,
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

/** Editar una campaña: nombre y fechas de inicio/fin. */
function CampaignEditDialog({
  campaign,
  onOpenChange,
}: {
  campaign: CampaignHistoryRow | null;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loadedId, setLoadedId] = useState<string | null>(null);

  if (campaign && campaign.id !== loadedId) {
    setName(campaign.name);
    setStartDate(campaign.start_date?.slice(0, 10) ?? '');
    setEndDate(campaign.end_date?.slice(0, 10) ?? '');
    setLoadedId(campaign.id);
  }

  const mut = useMutation({
    mutationFn: () =>
      updateCampaignDates(campaign!.id, {
        start_date: startDate || null,
        end_date: endDate || null,
        name: name.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-campaigns'] });
      qc.invalidateQueries({ queryKey: ['email-campaign-detail'] });
      toast.success('Campaña actualizada');
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={!!campaign} onOpenChange={(o) => !o && !mut.isPending && onOpenChange(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar campaña</DialogTitle>
          <DialogDescription>
            Cambia el nombre o las fechas del período de la campaña.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Nombre de la campaña</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Fecha de inicio</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Fecha de fin</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="gap-1">
            {mut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type SourceFilter = 'opened' | 'clicked' | 'not_opened';

/** Re-campaña: nuevo envío según la interacción (abrieron, clic o no abrieron). */
function RecampaignDialog({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: CampaignHistoryRow;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [templateId, setTemplateId] = useState('');
  const [filter, setFilter] = useState<SourceFilter>('opened');
  // Modo del mensaje: plantilla existente o mensaje escrito a mano.
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  // Cantidad a enviar hoy: 'max' = hasta el límite diario, o un tope elegido.
  const [sendLimit, setSendLimit] = useState('max');
  const templates = useQuery({ queryKey: ['email-templates'], queryFn: listTemplates, enabled: open });
  const limits = useQuery({ queryKey: ['email-limits'], queryFn: getSendLimits, enabled: open });
  const dailyLimit = limits.data?.daily_limit ?? 3000;
  const limitOptions: number[] = [];
  for (let n = 500; n < dailyLimit; n += 500) limitOptions.push(n);
  const chosenLimit = sendLimit === 'max' ? dailyLimit : Number(sendLimit);

  const usingTemplate = mode === 'template';
  const audience = useQuery({
    queryKey: ['email-audience-recampaign', campaign.id, filter, usingTemplate ? templateId : ''],
    queryFn: () =>
      getAudienceCount({
        source_campaign_id: campaign.id,
        source_filter: filter,
        template_id: usingTemplate && templateId ? templateId : undefined,
        skip_sent: usingTemplate && !!templateId,
      }),
    enabled: open,
  });

  const mut = useMutation({
    mutationFn: () =>
      sendCampaign({
        template_id: usingTemplate ? templateId : null,
        custom_subject: usingTemplate ? null : customSubject.trim(),
        custom_body: usingTemplate ? null : customBody.trim(),
        source_campaign_id: campaign.id,
        source_filter: filter,
        skip_sent: true,
        limit: chosenLimit,
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const count = audience.data ?? 0;
  const notOpened = Math.max(0, campaign.sent - campaign.opened);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !mut.isPending && onOpenChange(false)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Re-campaña de seguimiento</DialogTitle>
          <DialogDescription>
            Nuevo envío según la interacción con{' '}
            <span className="font-medium text-foreground">{campaign.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Dirigida a</Label>
            <Select value={filter} onValueChange={(v) => setFilter(v as SourceFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opened">
                  Quienes abrieron el correo ({campaign.opened})
                </SelectItem>
                <SelectItem value="clicked">
                  Quienes hicieron clic ({campaign.clicked})
                </SelectItem>
                <SelectItem value="not_opened">
                  Quienes NO abrieron el correo ({notOpened})
                </SelectItem>
              </SelectContent>
            </Select>
            {filter === 'not_opened' && (
              <p className="mt-1 text-xs text-muted-foreground">
                Reenvío de seguimiento: usa un mensaje distinto al original para no repetir.
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block">Mensaje del nuevo correo</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={usingTemplate ? 'default' : 'outline'}
                onClick={() => setMode('template')}
              >
                Usar plantilla
              </Button>
              <Button
                type="button"
                size="sm"
                variant={usingTemplate ? 'outline' : 'default'}
                onClick={() => setMode('custom')}
              >
                Escribir mensaje
              </Button>
            </div>
          </div>

          {usingTemplate ? (
            <div>
              <Label className="mb-1.5 block">Plantilla</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.data?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block">Asunto</Label>
                <Input
                  placeholder="Ej. $razon_social, aún está a tiempo de ponerse al día"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Texto del mensaje</Label>
                <textarea
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={'Escribe el mensaje…\nPuedes usar $razon_social, $nit, $ciudad, $atencion.'}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  El mensaje queda guardado como plantilla para reutilizarlo después.
                </p>
              </div>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block">Cantidad a enviar hoy</Label>
            <Select value={sendLimit} onValueChange={setSendLimit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {limitOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n.toLocaleString('es-CO')} correos
                  </SelectItem>
                ))}
                <SelectItem value="max">
                  Máximo del día ({dailyLimit.toLocaleString('es-CO')})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            Destinatarios:{' '}
            <span className="font-semibold">{audience.isLoading ? '…' : count}</span> con correo
            {usingTemplate && templateId ? ' (sin repetir la plantilla elegida)' : ''}.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button
            className="gap-1"
            disabled={mut.isPending}
            onClick={() => {
              if (usingTemplate && !templateId) return toast.error('Selecciona una plantilla');
              if (!usingTemplate && (!customSubject.trim() || !customBody.trim()))
                return toast.error('Escribe el asunto y el texto del mensaje');
              if (count === 0) return toast.error('No hay destinatarios');
              mut.mutate();
            }}
          >
            {mut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Megaphone className="h-4 w-4" />
            )}
            Enviar a {Math.min(count, chosenLimit).toLocaleString('es-CO')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  const [recampaignOpen, setRecampaignOpen] = useState(false);
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
          <div className="flex-1">
            <CardTitle className="text-base">{campaign.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{sendLabel}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => setRecampaignOpen(true)}
          >
            <Megaphone className="h-4 w-4" /> Re-campaña a interesados
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Envíos: cada lote enviado con su día y cifras (una campaña puede tener varios) */}
        {envios.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <div className="border-b px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
              Envíos ({envios.length})
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Fecha de envío</th>
                  <th className="px-3 py-2 font-medium">Enviados</th>
                  <th className="px-3 py-2 font-medium">Recibidos</th>
                  <th className="px-3 py-2 font-medium">No recibidos</th>
                  <th className="px-3 py-2 font-medium">Abiertos</th>
                  <th className="px-3 py-2 font-medium">Respondidos</th>
                  <th className="px-3 py-2 font-medium">Clics</th>
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
                    <td className="px-3 py-2">{e.no_enviados}</td>
                    <td className="px-3 py-2 text-primary">{e.opened}</td>
                    <td className="px-3 py-2 text-primary">{e.responded}</td>
                    <td className="px-3 py-2">{e.clicked}</td>
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
      <RecampaignDialog
        campaign={campaign}
        open={recampaignOpen}
        onOpenChange={setRecampaignOpen}
      />
    </Card>
  );
}

export function AperturasPage() {
  // La campaña seleccionada vive en la URL (?campana=): al entrar a una ficha y
  // volver atrás, se regresa a esta misma campaña y no al inicio.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('campana');
  // Vista: campañas vigentes o terminadas.
  const terminadas = searchParams.get('vista') === 'terminadas';
  const [toArchive, setToArchive] = useState<CampaignHistoryRow | null>(null);
  const [toEdit, setToEdit] = useState<CampaignHistoryRow | null>(null);
  const qc = useQueryClient();
  const campaigns = useQuery({
    queryKey: ['email-campaigns', terminadas],
    queryFn: () => getCampaigns(1, terminadas),
  });

  const [exportando, setExportando] = useState(false);

  /** Descarga el Excel de correos enviados (todos, o los de la campaña abierta). */
  const descargarExcel = async (campaignId: string | null) => {
    setExportando(true);
    try {
      const blob = await exportSends(campaignId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = campaignId ? 'correos-campana.xlsx' : 'correos-enviados.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setExportando(false);
    }
  };

  const archive = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archiveCampaign(id, archived),
    onSuccess: (res) => {
      toast.success(
        res.archived
          ? 'Campaña terminada: pasó a «Campañas terminadas».'
          : 'Campaña reactivada: vuelve a las vigentes.',
      );
      qc.invalidateQueries({ queryKey: ['email-campaigns'] });
      setToArchive(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const items = campaigns.data?.items ?? [];
  const selected = items.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Seguimiento de correo</h1>
          <p className="text-sm text-muted-foreground">
            Cada campaña con su trazabilidad: recibidos, abiertos, respondidos y clics.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={exportando}
          onClick={() => descargarExcel(selectedId)}
          title="Descarga en Excel los correos enviados con su trazabilidad"
        >
          {exportando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {selected ? 'Exportar esta campaña' : 'Exportar correos a Excel'}
        </Button>
      </div>

      {selected ? (
        <CampaignDetail campaign={selected} onBack={() => setSearchParams({})} />
      ) : (
        /* Mercadeo de campañas: elige una para ver su seguimiento */
        <Card>
          <CardHeader className="gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4" />
              {terminadas ? 'Campañas terminadas' : 'Mercadeo de campañas'}
              {campaigns.data && (
                <Badge variant="secondary" className="ml-1">
                  {campaigns.data.total}
                </Badge>
              )}
            </CardTitle>
            {/* Vigentes vs terminadas: las terminadas salen del listado principal */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={terminadas ? 'outline' : 'default'}
                onClick={() => setSearchParams({})}
              >
                Campañas vigentes
              </Button>
              <Button
                size="sm"
                variant={terminadas ? 'default' : 'outline'}
                onClick={() => setSearchParams({ vista: 'terminadas' })}
              >
                <Archive className="h-4 w-4" /> Campañas terminadas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <EmptyState
                title={terminadas ? 'No hay campañas terminadas' : 'Aún no hay campañas'}
                description={
                  terminadas
                    ? 'Cuando termines una campaña, aquí quedará archivada con toda su trazabilidad.'
                    : 'Cuando envíes una campaña, aquí aparecerá para ver su seguimiento.'
                }
              />
            ) : (
              <ul className="divide-y rounded-md border">
                {items.map((c) => (
                  <li
                    key={c.id}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-3 py-3 hover:bg-muted/40"
                    onClick={() => setSearchParams({ campana: c.id })}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-primary">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.start_date && c.end_date
                          ? `Del ${formatDateOrTime(c.start_date)} al ${formatDateOrTime(
                              c.end_date,
                            )}`
                          : c.send_date
                            ? `Enviada el ${formatDateOrTime(c.send_date)}`
                            : 'Sin fecha definida'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="whitespace-nowrap text-sm font-medium text-primary">
                        Ver campaña →
                      </span>
                      <Can code="emails.send">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          aria-label="Editar campaña"
                          title="Editar campaña (nombre y fechas)"
                          onClick={(e) => {
                            e.stopPropagation();
                            setToEdit(c);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Can>
                      {/* Terminar la campaña: sale de las vigentes sin borrar nada */}
                      <Can code="emails.send">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          aria-label={terminadas ? 'Reactivar campaña' : 'Terminar campaña'}
                          title={
                            terminadas
                              ? 'Reactivar: vuelve a las campañas vigentes'
                              : 'Terminar campaña: pasa a «Campañas terminadas»'
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (terminadas) archive.mutate({ id: c.id, archived: false });
                            else setToArchive(c);
                          }}
                        >
                          {terminadas ? (
                            <RotateCcw className="h-4 w-4" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </Button>
                      </Can>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <CampaignEditDialog campaign={toEdit} onOpenChange={(o) => !o && setToEdit(null)} />

      <Dialog
        open={!!toArchive}
        onOpenChange={(o) => !o && !archive.isPending && setToArchive(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Terminar la campaña?</DialogTitle>
            <DialogDescription>
              La campaña{' '}
              <span className="font-medium text-foreground">{toArchive?.name}</span> pasará a
              <b> Campañas terminadas</b>. No se borra nada: sus envíos y su trazabilidad
              (recibidos, aperturas, respuestas y clics) se conservan y se pueden consultar cuando
              quieras. Así, en el listado principal quedan solo las campañas vigentes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToArchive(null)}
              disabled={archive.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="gap-1"
              disabled={archive.isPending}
              onClick={() => toArchive && archive.mutate({ id: toArchive.id, archived: true })}
            >
              {archive.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              Terminar campaña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
