import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, UserCheck, Phone, Mail, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FullPageSpinner, ErrorState, EmptyState } from '@/components/common/states';
import { Can } from '@/components/auth/Can';
import { ProspectFormDialog } from '@/features/prospects/components/ProspectFormDialog';
import { EmailTrackingSection } from '@/features/prospects/components/EmailTrackingSection';
import { useQuery } from '@tanstack/react-query';
import {
  useProspect,
  useFollowUps,
  useCreateFollowUp,
  useConvertToClient,
} from '@/features/prospects/hooks/useProspects';
import { searchCiiu } from '@/features/prospects/api/prospects.api';
import { segmentLabel, statusMeta } from '@/features/prospects/lib/status';
import { apiErrorMessage } from '@/api/client';
import { formatDate } from '@/lib/utils';
import type { FollowUpType } from '@/types/api';

const FOLLOWUP_TYPES: FollowUpType[] = [
  'LLAMADA',
  'CORREO',
  'REUNION',
  'VISITA',
  'WHATSAPP',
  'NOTA',
];

const followUpSchema = z.object({
  type: z.enum(['LLAMADA', 'CORREO', 'REUNION', 'VISITA', 'WHATSAPP', 'NOTA']),
  notes: z.string().min(1, 'Escribe una nota'),
  outcome: z.string().optional(),
});
type FollowUpInput = z.infer<typeof followUpSchema>;

export function ProspectDetailPage() {
  const { id = '' } = useParams();
  const { data: prospect, isLoading, error, refetch } = useProspect(id);
  const [editOpen, setEditOpen] = useState(false);
  const convert = useConvertToClient();

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
        <Button asChild variant="ghost" size="icon">
          <Link to="/prospects" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-2xl font-bold tracking-tight">{prospect.razon_social}</h1>
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
            <Can code="clients.convert_from_prospect">
              <Button
                className="mt-2 w-full"
                onClick={onConvert}
                disabled={convert.isPending}
              >
                <UserCheck className="h-4 w-4" /> Convertir en cliente
              </Button>
            </Can>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <EmailTrackingSection prospectId={prospect.id} />
          <FollowUpTimeline prospectId={prospect.id} />
        </div>
      </div>

      <ProspectFormDialog open={editOpen} onOpenChange={setEditOpen} prospect={prospect} />
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

function FollowUpTimeline({ prospectId }: { prospectId: string }) {
  const { data, isLoading, error, refetch } = useFollowUps(prospectId);
  const create = useCreateFollowUp(prospectId);
  const form = useForm<FollowUpInput>({
    resolver: zodResolver(followUpSchema),
    defaultValues: { type: 'LLAMADA', notes: '', outcome: '' },
  });

  const onSubmit = async (values: FollowUpInput) => {
    try {
      await create.mutateAsync(values);
      form.reset({ type: values.type, notes: '', outcome: '' });
      toast.success('Seguimiento registrado');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguimientos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Can code="followups.create">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-end"
          >
            <div className="sm:w-40">
              <Label className="mb-1 block text-xs">Tipo</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(v) => form.setValue('type', v as FollowUpType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLLOWUP_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-1 block text-xs">Nota</Label>
              <Input placeholder="¿Qué pasó?" {...form.register('notes')} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </form>
        </Can>
        {form.formState.errors.notes && (
          <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Sin seguimientos" description="Registra el primer contacto." />
        ) : (
          <ol className="relative space-y-4 border-l pl-6">
            {data.map((f) => (
              <li key={f.id} className="relative">
                <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{f.type}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(f.created_at)}</span>
                </div>
                <p className="mt-1 text-sm">{f.notes}</p>
                {f.outcome && (
                  <p className="text-xs text-muted-foreground">Resultado: {f.outcome}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
