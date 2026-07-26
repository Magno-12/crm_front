import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Pencil,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  MailX,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FullPageSpinner, ErrorState } from '@/components/common/states';
import { Can } from '@/components/auth/Can';
import { ProspectFormDialog } from '@/features/prospects/components/ProspectFormDialog';
import { EmailTrackingSection } from '@/features/prospects/components/EmailTrackingSection';
import { FollowUpTimeline } from '@/features/prospects/components/FollowUpTimeline';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useProspect, useConvertToClient } from '@/features/prospects/hooks/useProspects';
import { searchCiiu, setEmailOptOut } from '@/features/prospects/api/prospects.api';
import { segmentLabel, statusMeta } from '@/features/prospects/lib/status';
import { apiErrorMessage } from '@/api/client';
import { formatDate, formatDateTime } from '@/lib/utils';


export function ProspectDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: prospect, isLoading, error, refetch } = useProspect(id);
  const [editOpen, setEditOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const convert = useConvertToClient();
  const qc = useQueryClient();

  // Volver a la vista desde donde se abrió la ficha (Seguimiento de correo,
  // Seguimiento de prospecto, etc.); si se abrió directo, va a la base.
  const goBack = () => {
    if (window.history.length > 1 && location.key !== 'default') navigate(-1);
    else navigate('/prospects');
  };

  const optOut = useMutation({
    mutationFn: (block: boolean) => setEmailOptOut(id, block),
    onSuccess: (_, block) => {
      qc.invalidateQueries({ queryKey: ['prospects'] });
      toast.success(
        block
          ? 'Prospecto bloqueado: no recibirá más correos ni contactos del sistema.'
          : 'Prospecto desbloqueado: vuelve a estar disponible para campañas.',
      );
      setBlockOpen(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const ciiuCode = prospect?.actividad_ciiu ?? '';
  const ciiu = useQuery({
    queryKey: ['ciiu', ciiuCode],
    queryFn: () => searchCiiu(ciiuCode),
    enabled: !!ciiuCode,
  });
  const ciiuDesc = ciiu.data?.find((c) => c.code === ciiuCode)?.description;

  if (isLoading) return <FullPageSpinner />;
  if (error || !prospect) return <ErrorState error={error} onRetry={() => refetch()} />;

  const meta = statusMeta(prospect.estado);
  const blocked = Boolean(
    (prospect as { email_opt_out?: boolean }).email_opt_out,
  );
  const blockedAt = (prospect as { email_opt_out_at?: string | null }).email_opt_out_at;

  const onConvert = async () => {
    try {
      await convert.mutateAsync(prospect.id);
      toast.success('Prospecto convertido en cliente');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={goBack} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="flex-1 text-2xl font-bold tracking-tight">{prospect.razon_social}</h1>
        {blocked && (
          <Badge variant="destructive" className="gap-1">
            <MailX className="h-3 w-3" /> Prospecto bloqueado
          </Badge>
        )}
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>

      {prospect.estado === 'fidelizado' && (
        <Can code="clients.convert_from_prospect">
          <div className="flex flex-col items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Cliente fidelizado 🎉</p>
              <p className="text-sm text-muted-foreground">
                Registra el servicio prestado y el valor del contrato para activarlo como cliente.
              </p>
            </div>
            <Button onClick={onConvert} disabled={convert.isPending}>
              <UserCheck className="h-4 w-4" /> Registrar contrato
            </Button>
          </div>
        </Can>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Información</CardTitle>
            <Can code="prospects.edit">
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            </Can>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="NIT" value={prospect.nit + (prospect.dv ? `-${prospect.dv}` : '')} />
            <InfoRow label="Segmento" value={segmentLabel(prospect.segmento)} />
            {(prospect as { sigla?: string | null }).sigla && (
              <InfoRow label="Sigla" value={(prospect as { sigla?: string }).sigla ?? ''} />
            )}
            {(prospect as { tipo_entidad?: string | null }).tipo_entidad && (
              <InfoRow
                label="Tipo de entidad"
                value={(prospect as { tipo_entidad?: string }).tipo_entidad ?? ''}
              />
            )}
            <InfoRow label="Representante legal" value={prospect.representante_legal ?? '—'} />
            <InfoRow label="Cédula representante" value={prospect.cedula_representante ?? '—'} />
            <InfoRow
              label="Contacto comercial"
              value={
                prospect.contacto_nombre
                  ? `${prospect.contacto_nombre}${prospect.contacto_cargo ? ` (${prospect.contacto_cargo})` : ''}`
                  : '—'
              }
            />
            <InfoRow
              label="Tel. contacto"
              value={prospect.contacto_telefono ?? '—'}
              icon={<Phone className="h-4 w-4" />}
            />
            <InfoRow
              label="Ciudad"
              value={[prospect.ciudad, prospect.departamento].filter(Boolean).join(', ') || '—'}
              icon={<MapPin className="h-4 w-4" />}
            />
            <InfoRow
              label="Teléfono"
              value={prospect.telefono ?? '—'}
              icon={<Phone className="h-4 w-4" />}
            />
            <InfoRow
              label="Email"
              value={prospect.email ?? '—'}
              icon={<Mail className="h-4 w-4" />}
            />
            <InfoRow
              label="Actividad CIIU"
              value={
                prospect.actividad_ciiu
                  ? `${prospect.actividad_ciiu}${ciiuDesc ? ` — ${ciiuDesc}` : ''}`
                  : '—'
              }
            />
            <InfoRow label="Estado actual" value={prospect.estado_actual ?? '—'} />
            <InfoRow label="Matrícula mercantil" value={formatDate(prospect.fecha_matricula)} />
            <InfoRow label="Renovación" value={formatDate(prospect.fecha_renovacion)} />
            <InfoRow label="Origen" value={prospect.source} />
            <InfoRow label="Creado" value={formatDate(prospect.created_at)} />
            {blocked && (
              <InfoRow label="Bloqueado desde" value={formatDateTime(blockedAt) ?? 'Sí'} />
            )}
            <Can code="clients.convert_from_prospect">
              <Button
                className="mt-2 w-full"
                onClick={onConvert}
                disabled={convert.isPending}
              >
                <UserCheck className="h-4 w-4" /> Convertir en cliente
              </Button>
            </Can>
            <Can code="prospects.edit">
              {blocked ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => optOut.mutate(false)}
                  disabled={optOut.isPending}
                >
                  {optOut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Desbloquear prospecto
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setBlockOpen(true)}
                >
                  <MailX className="h-4 w-4" /> Bloquear prospecto
                </Button>
              )}
            </Can>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <EmailTrackingSection prospectId={prospect.id} />
          {/* Seguimiento de prospecto: llamadas, citas, reuniones y demás acciones */}
          <FollowUpTimeline prospectId={prospect.id} />
        </div>
      </div>

      <ProspectFormDialog open={editOpen} onOpenChange={setEditOpen} prospect={prospect} />

      <Dialog open={blockOpen} onOpenChange={(o) => !o && !optOut.isPending && setBlockOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Bloquear este prospecto?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{prospect.razon_social}</span> quedará
              bloqueado a nivel global: no recibirá campañas, ni correos individuales, ni
              respuestas (por ejemplo, si falleció, vendió el negocio o pidió no ser contactado).
              Su información y su historial se conservan, y puedes desbloquearlo cuando quieras.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockOpen(false)}
              disabled={optOut.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="gap-1"
              disabled={optOut.isPending}
              onClick={() => optOut.mutate(true)}
            >
              {optOut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailX className="h-4 w-4" />
              )}
              Bloquear prospecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
