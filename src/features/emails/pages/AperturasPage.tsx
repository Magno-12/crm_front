import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MailOpen, MessageSquare, Send, MousePointerClick, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/states';
import { formatDateTime, formatDateOrTime } from '@/lib/utils';
import {
  getOpenings,
  getResponses,
  getCampaigns,
  type OpeningRow,
} from '@/features/emails/api/emails.api';
import { getEmailEngagement } from '@/features/dashboard/api/dashboard.api';
import { SendMessageDialog } from '@/features/emails/components/SendMessageDialog';
import { CampaignDetailDialog } from '@/features/emails/components/CampaignDetailDialog';

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}

export function AperturasPage() {
  const openings = useQuery({ queryKey: ['email-openings'], queryFn: () => getOpenings(1) });
  const responses = useQuery({ queryKey: ['email-responses'], queryFn: () => getResponses(1) });
  const campaigns = useQuery({ queryKey: ['email-campaigns'], queryFn: () => getCampaigns(1) });
  const engagement = useQuery({ queryKey: ['email-engagement'], queryFn: getEmailEngagement });
  const [compose, setCompose] = useState<OpeningRow | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const opens = openings.data;
  const resp = responses.data;
  const eng = engagement.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Apertura de correos</h1>
        <p className="text-sm text-muted-foreground">
          Resultados de las campañas: quién abrió, porcentajes y respuestas.
        </p>
      </div>

      {/* Resumen (porcentajes) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Enviados" value={String(eng?.sent ?? 0)} />
        <Stat label="Abiertos" value={String(eng?.opened ?? 0)} />
        <Stat label="Clics" value={String(eng?.clicked ?? 0)} />
        <Stat label="% Apertura" value={`${eng?.open_rate ?? 0}%`} accent />
      </div>

      {/* Historial de campañas */}
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
                    <th className="py-2 pr-3 font-medium">Enviados</th>
                    <th className="py-2 pr-3 font-medium">Abiertos</th>
                    <th className="py-2 pr-3 font-medium">% Apertura</th>
                    <th className="py-2 pr-3 font-medium">Clics</th>
                    <th className="py-2 font-medium">Respuestas</th>
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
                        {c.sent}
                        {c.failed > 0 && (
                          <span className="ml-1 text-xs text-destructive">({c.failed} fallidos)</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">{c.opened}</td>
                      <td className="py-2 pr-3 font-medium text-primary">{c.open_rate}%</td>
                      <td className="py-2 pr-3">{c.clicked}</td>
                      <td className="py-2 font-medium">{c.responses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Correos abiertos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MailOpen className="h-4 w-4" /> Correos abiertos
            {opens && (
              <Badge variant="secondary" className="ml-1">
                {opens.total}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!opens || opens.items.length === 0 ? (
            <EmptyState
              title="Aún no hay aperturas"
              description="Cuando sus clientes abran los correos de las campañas, aquí los verá con fecha y hora."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Empresa / correo</th>
                    <th className="py-2 pr-3 font-medium">Campaña</th>
                    <th className="py-2 pr-3 font-medium">Abierto (fecha y hora)</th>
                    <th className="py-2 pr-3 font-medium">Clic</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {opens.items.map((o) => (
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
                      <td className="py-2 pr-3 font-medium text-primary">
                        {formatDateTime(o.opened_at)}
                      </td>
                      <td className="py-2 pr-3">
                        {o.clicked_at ? (
                          <Badge variant="success" className="gap-1">
                            <MousePointerClick className="h-3 w-3" /> Sí
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        <Button size="sm" variant="outline" onClick={() => setCompose(o)}>
                          <Send className="mr-1 h-3.5 w-3.5" /> Escribir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Respuestas de clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" /> Respuestas de clientes
            {resp && (
              <Badge variant="secondary" className="ml-1">
                {resp.total}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!resp || resp.items.length === 0 ? (
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
                      <span className="text-sm font-medium">{r.razon_social || r.from_email}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(r.received_at)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{r.from_email}</div>
                  {r.subject && <div className="text-sm font-medium">{r.subject}</div>}
                  {r.snippet && <p className="text-sm text-muted-foreground">{r.snippet}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <SendMessageDialog
        open={compose !== null}
        onOpenChange={(o) => !o && setCompose(null)}
        toEmail={compose?.recipient_email ?? ''}
        prospectId={compose?.prospect_id}
        defaultSubject={compose?.subject}
      />

      <CampaignDetailDialog
        campaignId={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
    </div>
  );
}
