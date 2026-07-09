import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCampaignDetail, updateCampaignDates } from '@/features/emails/api/emails.api';
import { apiErrorMessage } from '@/api/client';
import { formatDateOrTime } from '@/lib/utils';

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${accent ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}

export function CampaignDetailDialog({
  campaignId,
  onOpenChange,
}: {
  campaignId: string | null;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['campaign-detail', campaignId],
    queryFn: () => getCampaignDetail(campaignId!),
    enabled: !!campaignId,
  });

  const c = data?.campaign;
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    setStart(c?.start_date ?? '');
    setEnd(c?.end_date ?? '');
  }, [c?.start_date, c?.end_date]);

  const saveDates = useMutation({
    mutationFn: () =>
      updateCampaignDates(campaignId!, { start_date: start || null, end_date: end || null }),
    onSuccess: () => {
      toast.success('Fechas actualizadas');
      qc.invalidateQueries({ queryKey: ['campaign-detail', campaignId] });
      qc.invalidateQueries({ queryKey: ['email-campaigns'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={campaignId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{c?.name ?? 'Campaña'}</DialogTitle>
          <DialogDescription>
            {c
              ? `Inicio ${formatDateOrTime(c.started_at)} · ${c.finished_at ? `Fin ${formatDateOrTime(c.finished_at)}` : 'En curso'}`
              : 'Cargando…'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[76vh] space-y-4 overflow-y-auto p-5">
          {c && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <Stat label="Audiencia" value={String(c.audience)} />
              <Stat label="Enviados" value={String(c.sent)} />
              <Stat label="Abiertos" value={String(c.opened)} />
              <Stat label="% Apertura" value={`${c.open_rate}%`} accent />
              <Stat label="Clics" value={String(c.clicked)} />
              <Stat label="Respuestas" value={String(c.responses)} accent />
            </div>
          )}

          {c && (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
              <div>
                <Label className="mb-1 block text-xs">Fecha de inicio (a mano)</Label>
                <Input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="h-9 w-40"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Fecha de fin (a mano)</Label>
                <Input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="h-9 w-40"
                />
              </div>
              <Button size="sm" disabled={saveDates.isPending} onClick={() => saveDates.mutate()}>
                Guardar fechas
              </Button>
              <p className="text-xs text-muted-foreground">
                Si las dejas vacías, se usan las automáticas (envío / fin real).
              </p>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando destinatarios…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Empresa / correo</th>
                    <th className="py-2 pr-3 font-medium">Estado</th>
                    <th className="py-2 pr-3 font-medium">Abierto</th>
                    <th className="py-2 pr-3 font-medium">Clic</th>
                    <th className="py-2 font-medium">Respondió</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recipients.map((r, i) => (
                    <tr key={i} className="border-b align-top last:border-0">
                      <td className="py-2 pr-3">
                        {r.prospect_id ? (
                          <Link
                            to={`/prospects/${r.prospect_id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {r.razon_social || r.recipient_email}
                          </Link>
                        ) : (
                          <span className="font-medium">{r.razon_social || r.recipient_email}</span>
                        )}
                        <div className="text-xs text-muted-foreground">{r.recipient_email}</div>
                      </td>
                      <td className="py-2 pr-3">
                        {r.status === 'sent' ? (
                          <Badge variant="secondary">Enviado</Badge>
                        ) : r.status === 'failed' ? (
                          <Badge variant="destructive">Falló</Badge>
                        ) : (
                          <Badge variant="secondary">{r.status}</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {r.opened_at ? formatDateOrTime(r.opened_at) : '—'}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {r.clicked_at ? formatDateOrTime(r.clicked_at) : '—'}
                      </td>
                      <td className="py-2">
                        {r.responded ? (
                          <div>
                            <Badge variant="success">Sí</Badge>
                            {r.response_snippet && (
                              <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                                {r.response_snippet}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
