import { useQuery } from '@tanstack/react-query';
import { MailOpen, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/states';
import { emailSendsByProspect } from '@/features/prospects/api/prospects.api';
import { formatDate } from '@/lib/utils';

export function EmailTrackingSection({ prospectId }: { prospectId: string }) {
  const { data } = useQuery({
    queryKey: ['email-sends', prospectId],
    queryFn: () => emailSendsByProspect(prospectId),
  });

  const opened = data?.filter((d) => d.opens > 0).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MailOpen className="h-4 w-4" /> Correos y aperturas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!data || data.length === 0 ? (
          <EmptyState
            title="Sin correos enviados"
            description="Cuando le envíes campañas o correos, aquí verás si los abrió."
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {data.length} correo(s) enviado(s) · <span className="font-medium text-primary">{opened} abierto(s)</span>
            </p>
            <ul className="divide-y rounded-md border">
              {data.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{s.recipient_email}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(s.sent_at)}</span>
                  {s.opens > 0 ? (
                    <Badge variant="success">Abierto</Badge>
                  ) : s.status === 'failed' ? (
                    <Badge variant="destructive">Falló</Badge>
                  ) : (
                    <Badge variant="secondary">Enviado</Badge>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
