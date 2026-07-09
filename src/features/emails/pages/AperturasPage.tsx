import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MailOpen, MessageSquare, Send, MousePointerClick } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/states';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/api/client';
import { getOpenings, getResponses, resendEmail } from '@/features/emails/api/emails.api';

export function AperturasPage() {
  const qc = useQueryClient();
  const openings = useQuery({ queryKey: ['email-openings'], queryFn: () => getOpenings(1) });
  const responses = useQuery({ queryKey: ['email-responses'], queryFn: () => getResponses(1) });

  const resend = useMutation({
    mutationFn: (id: string) => resendEmail(id),
    onSuccess: () => {
      toast.success('Correo reenviado');
      qc.invalidateQueries({ queryKey: ['email-openings'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const opens = openings.data;
  const resp = responses.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Apertura de correos</h1>
        <p className="text-sm text-muted-foreground">
          Todos los correos que sus clientes abrieron, y las respuestas que llegan.
        </p>
      </div>

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
                    <th className="py-2 pr-3 font-medium">Asunto</th>
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
                        {o.subject || '—'}
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
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resend.isPending}
                          onClick={() => resend.mutate(o.id)}
                        >
                          <Send className="mr-1 h-3.5 w-3.5" /> Reenviar
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
    </div>
  );
}
