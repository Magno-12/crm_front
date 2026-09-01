import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Archive,
  Loader2,
  Mail,
  Megaphone,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, ErrorState } from '@/components/common/states';
import { Can } from '@/components/auth/Can';
import { searchCiiu } from '@/api/ciiu';
import { getUbicaciones, getZonas } from '@/api/ubicaciones';
import {
  archiveTemplate,
  deleteTemplate,
  getAudienceCount,
  getSendLimits,
  listSenders,
  listTemplates,
  sendCampaign,
  sendEmail,
} from '@/features/emails/api/emails.api';
import { TemplateBuilderDialog } from '@/features/emails/components/TemplateBuilderDialog';
import { TemplateEditDialog } from '@/features/emails/components/TemplateEditDialog';
import { TemplatePreviewDialog } from '@/features/emails/components/TemplatePreviewDialog';
import {
  PROSPECT_STATUSES,
  SEGMENTS,
  SEGMENT_META,
  statusMeta,
} from '@/features/prospects/lib/status';
import { useDebounce } from '@/hooks/useDebounce';
import { apiErrorMessage } from '@/api/client';
import type { EmailTemplateRead } from '@/types/api';

// Límite diario de respaldo mientras carga el real (viene del backend según el plan).
const DEFAULT_DAILY_LIMIT = 3000;

export function EmailsPage() {
  const qc = useQueryClient();
  // Las plantillas terminadas salen del trabajo diario, igual que las campañas.
  const [verTerminadas, setVerTerminadas] = useState(false);
  const templates = useQuery({
    queryKey: ['email-templates', verTerminadas],
    queryFn: () => listTemplates(verTerminadas),
  });
  const [templateOpen, setTemplateOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateRead | null>(null);
  const [editTemplate, setEditTemplate] = useState<EmailTemplateRead | null>(null);
  const [toDelete, setToDelete] = useState<EmailTemplateRead | null>(null);

  const archivar = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archiveTemplate(id, archived),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success(v.archived ? 'Plantilla terminada' : 'Plantilla reactivada');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla eliminada');
      setToDelete(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Correos</h1>
          <p className="text-sm text-muted-foreground">Plantillas, envíos individuales y campañas masivas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Can code="emails.templates.create">
            <Button variant="outline" onClick={() => setTemplateOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva plantilla
            </Button>
          </Can>
          <Can code="emails.send">
            <Button variant="outline" onClick={() => setComposerOpen(true)}>
              <Send className="h-4 w-4" /> Enviar correo
            </Button>
          </Can>
          <Can code="emails.send">
            <Button onClick={() => setCampaignOpen(true)}>
              <Megaphone className="h-4 w-4" /> Campaña
            </Button>
          </Can>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={verTerminadas ? 'outline' : 'default'}
          size="sm"
          onClick={() => setVerTerminadas(false)}
        >
          <Mail className="h-4 w-4" /> Plantillas vigentes
        </Button>
        <Button
          variant={verTerminadas ? 'default' : 'outline'}
          size="sm"
          onClick={() => setVerTerminadas(true)}
        >
          <Archive className="h-4 w-4" /> Plantillas terminadas
        </Button>
      </div>

      {templates.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : templates.error ? (
        <ErrorState error={templates.error} onRetry={() => templates.refetch()} />
      ) : !templates.data || templates.data.length === 0 ? (
        <EmptyState
          icon={<Mail />}
          title={verTerminadas ? 'Sin plantillas terminadas' : 'Sin plantillas'}
          description={
            verTerminadas
              ? 'Las plantillas que termine aparecerán aquí y se pueden reactivar.'
              : 'Crea una plantilla para empezar a enviar correos.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.data.map((t) => (
            <Card
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => setPreviewTemplate(t)}
              onKeyDown={(e) => e.key === 'Enter' && setPreviewTemplate(t)}
              className="cursor-pointer transition hover:border-primary/50 hover:shadow-sm"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="min-w-0 truncate">{t.name}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    {t.is_active ? (
                      <Badge variant="success">Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                    <Can code="emails.templates.edit">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        aria-label="Editar plantilla"
                        title="Editar plantilla"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTemplate(t);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Can>
                    <Can code="emails.templates.edit">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        aria-label={verTerminadas ? 'Reactivar plantilla' : 'Terminar plantilla'}
                        title={
                          verTerminadas
                            ? 'Reactivar: vuelve al listado de vigentes'
                            : 'Terminar: se oculta del trabajo diario, no se borra'
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          archivar.mutate({ id: t.id, archived: !verTerminadas });
                        }}
                      >
                        {verTerminadas ? (
                          <RotateCcw className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                    </Can>
                    <Can code="emails.templates.delete">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar plantilla"
                        title="Eliminar plantilla"
                        onClick={(e) => {
                          e.stopPropagation();
                          setToDelete(t);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Can>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="truncate text-sm text-muted-foreground">{t.subject}</p>
                {t.variables.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.variables.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">
                        ${v}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs font-medium text-primary">Clic para previsualizar →</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateBuilderDialog open={templateOpen} onOpenChange={setTemplateOpen} />
      <TemplatePreviewDialog
        template={previewTemplate}
        onOpenChange={(o) => !o && setPreviewTemplate(null)}
      />
      <TemplateEditDialog
        template={editTemplate}
        onOpenChange={(o) => !o && setEditTemplate(null)}
      />
      <ComposerDialog
        open={composerOpen}
        onOpenChange={setComposerOpen}
        templates={templates.data ?? []}
      />
      <CampaignDialog
        open={campaignOpen}
        onOpenChange={setCampaignOpen}
        templates={templates.data ?? []}
      />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && !del.isPending && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar plantilla?</DialogTitle>
            <DialogDescription>
              Se eliminará la plantilla{' '}
              <span className="font-medium text-foreground">{toDelete?.name}</span>. El historial de
              campañas y las aperturas se conservan. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={del.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="gap-1"
              disabled={del.isPending}
              onClick={() => toDelete && del.mutate(toDelete.id)}
            >
              {del.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignDialog({
  open,
  onOpenChange,
  templates,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templates: { id: string; name: string }[];
}) {
  const [templateId, setTemplateId] = useState('');
  const [segmento, setSegmento] = useState('all');
  const [estado, setEstado] = useState('all');
  const [ciiu, setCiiu] = useState('');
  // Territorio: la firma arma campañas por departamento y por municipio.
  const [departamento, setDepartamento] = useState('all');
  const [municipio, setMunicipio] = useState('all');
  const [zona, setZona] = useState('all');
  const [skipSent, setSkipSent] = useState(true);
  const [sender, setSender] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Cantidad a enviar hoy: 'max' (hasta el límite diario), un tope de la lista
  // (500, 1000…) o 'custom' para escribir cualquier cantidad.
  const [sendLimit, setSendLimit] = useState('max');
  const [customLimit, setCustomLimit] = useState('');
  const senders = useQuery({ queryKey: ['email-senders'], queryFn: listSenders, enabled: open });
  const limits = useQuery({ queryKey: ['email-limits'], queryFn: getSendLimits, enabled: open });
  const dailyLimit = limits.data?.daily_limit ?? DEFAULT_DAILY_LIMIT;
  const enviadosHoy = limits.data?.sent_today ?? 0;
  const restanteHoy = limits.data?.remaining_today ?? dailyLimit;
  // Opciones de 500 en 500 hasta el límite diario (3.000 hoy; se adapta si sube el plan).
  const limitOptions: number[] = [];
  for (let n = 500; n < dailyLimit; n += 500) limitOptions.push(n);
  const customNum = Number(customLimit);
  const customValido = Number.isInteger(customNum) && customNum >= 1 && customNum <= dailyLimit;
  const chosenLimit =
    sendLimit === 'max'
      ? dailyLimit
      : sendLimit === 'custom'
        ? customValido
          ? customNum
          : 0
        : Number(sendLimit);
  const debouncedCiiu = useDebounce(ciiu, 400);

  // Nombre de la actividad económica del código digitado (ej. 9602 → Peluquería…).
  const ciiuNombre = useQuery({
    queryKey: ['ciiu', debouncedCiiu],
    queryFn: async () => {
      const rows = await searchCiiu(debouncedCiiu, 5);
      return rows.find((r) => r.code === debouncedCiiu) ?? rows[0] ?? null;
    },
    enabled: open && debouncedCiiu.length >= 2,
  });

  const departamentos = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: () => getUbicaciones(),
    enabled: open,
  });
  const municipios = useQuery({
    queryKey: ['ubicaciones', departamento],
    queryFn: () => getUbicaciones(departamento),
    enabled: open && departamento !== 'all',
  });
  const zonasQ = useQuery({ queryKey: ['zonas'], queryFn: getZonas, enabled: open });

  const filters = {
    segmento: segmento === 'all' ? undefined : segmento,
    estado: estado === 'all' ? undefined : estado,
    actividad_ciiu: debouncedCiiu || undefined,
    departamento: departamento === 'all' ? undefined : departamento,
    ciudad: municipio === 'all' ? undefined : municipio,
    zona: zona === 'all' ? undefined : zona,
  };
  const audienceParams = {
    ...filters,
    template_id: templateId || undefined,
    skip_sent: skipSent,
  };

  const audience = useQuery({
    queryKey: ['email-audience', audienceParams],
    queryFn: () => getAudienceCount(audienceParams),
    enabled: open,
  });

  const mut = useMutation({
    mutationFn: () =>
      sendCampaign({
        template_id: templateId,
        skip_sent: skipSent,
        from_email: sender || undefined,
        start_date: startDate || null,
        end_date: endDate || null,
        limit: chosenLimit,
        ...filters,
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const count = audience.data ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Campaña de correo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Plantilla</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {senders.data && senders.data.length > 1 && (
            <div>
              <Label className="mb-1.5 block">Enviar desde</Label>
              <Select value={sender} onValueChange={setSender}>
                <SelectTrigger>
                  <SelectValue placeholder={senders.data[0]} />
                </SelectTrigger>
                <SelectContent>
                  {senders.data.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Segmento</Label>
              <Select value={segmento} onValueChange={setSegmento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {SEGMENTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEGMENT_META[s]?.label ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {PROSPECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusMeta(s).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Departamento (opcional)</Label>
              <Select
                value={departamento}
                onValueChange={(v) => {
                  setDepartamento(v);
                  setMunicipio('all');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {(departamentos.data ?? []).map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Municipio (opcional)</Label>
              <Select
                value={municipio}
                onValueChange={setMunicipio}
                disabled={departamento === 'all'}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      departamento === 'all' ? 'Elija primero el departamento' : 'Todos'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los municipios</SelectItem>
                  {(municipios.data ?? []).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Zona comercial (opcional)</Label>
            <Select value={zona} onValueChange={setZona}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                {(zonasQ.data ?? []).map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">Actividad CIIU (opcional)</Label>
            <Input placeholder="Ej. 8610" value={ciiu} onChange={(e) => setCiiu(e.target.value)} />
            {/* Al digitar el código se muestra de qué actividad se trata. */}
            {debouncedCiiu.length >= 2 && (
              <p className="mt-1.5 text-xs">
                {ciiuNombre.isFetching ? (
                  <span className="text-muted-foreground">Buscando actividad…</span>
                ) : ciiuNombre.data ? (
                  <span className="text-primary">
                    {ciiuNombre.data.code} · {ciiuNombre.data.description}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    No hay una actividad con ese código en el catálogo CIIU.
                  </span>
                )}
              </p>
            )}
          </div>

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
                <SelectItem value="custom">Otra cantidad…</SelectItem>
              </SelectContent>
            </Select>

            {/* Cantidad libre: cualquier número, sin quedar atado a los topes de 500. */}
            {sendLimit === 'custom' && (
              <div className="mt-2">
                <Input
                  type="number"
                  min={1}
                  max={dailyLimit}
                  step={1}
                  autoFocus
                  placeholder={`Escriba la cantidad (1 a ${dailyLimit.toLocaleString('es-CO')})`}
                  value={customLimit}
                  onChange={(e) => setCustomLimit(e.target.value)}
                  aria-label="Cantidad personalizada de correos"
                />
                {customLimit !== '' && !customValido && (
                  <p className="mt-1 text-xs text-destructive">
                    Escriba un número entero entre 1 y {dailyLimit.toLocaleString('es-CO')}, que es
                    el máximo que permite el plan de correo por día.
                  </p>
                )}
              </div>
            )}

            <p className="mt-1 text-xs text-muted-foreground">
              Hoy salen hasta esa cantidad; el resto de la audiencia continúa los días
              siguientes al volver a enviar la campaña.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Fecha de inicio (opcional)</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Fecha de fin (opcional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Estas fechas son <span className="font-medium">solo informativas</span> (el período de
            la campaña que se muestra en el historial). No controlan el envío: los correos salen de
            a {dailyLimit.toLocaleString('es-CO')} por día hasta cubrir la audiencia. Si las dejas
            vacías, se registran solas (inicio al enviar, fin al terminar).
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skipSent}
              onChange={(e) => setSkipSent(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            No reenviar a quienes ya recibieron esta plantilla
          </label>

          {/* Cupo del día: lo que ya salió y lo que queda, sin importar por qué
              filtro se esté enviando. */}
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-b pb-2 text-xs">
              <span className="font-medium">Cupo de hoy</span>
              <span className="text-muted-foreground">
                Enviados:{' '}
                <b className="text-foreground">{enviadosHoy.toLocaleString('es-CO')}</b>
              </span>
              <span className="text-muted-foreground">
                Disponibles:{' '}
                <b className={restanteHoy > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}>
                  {restanteHoy.toLocaleString('es-CO')}
                </b>{' '}
                de {dailyLimit.toLocaleString('es-CO')}
              </span>
              <span className="ml-auto text-muted-foreground">
                Este envío usaría{' '}
                <b className="text-foreground">
                  {Math.min(count, chosenLimit, restanteHoy).toLocaleString('es-CO')}
                </b>
              </span>
            </div>
            Audiencia con correo:{' '}
            <span className="font-semibold">{audience.isLoading ? '…' : count}</span> destinatario(s)
            {skipSent && templateId ? ' nuevos' : ''}.
            {restanteHoy <= 0 && (
              <span className="text-destructive">
                {' '}
                Hoy ya se agotó el cupo de {dailyLimit.toLocaleString('es-CO')} correos; el envío
                continúa mañana.
              </span>
            )}
            {restanteHoy > 0 && count > Math.min(chosenLimit, restanteHoy) && (
              <span className="text-muted-foreground">
                {' '}
                Hoy se enviarán {Math.min(chosenLimit, restanteHoy).toLocaleString('es-CO')}
                {restanteHoy < chosenLimit
                  ? ' porque es lo que queda del cupo del día'
                  : sendLimit === 'max'
                    ? ' por el límite diario'
                    : ' según la cantidad elegida'}
                ; el resto queda para los días siguientes.
              </span>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!templateId) return toast.error('Selecciona una plantilla');
              if (sendLimit === 'custom' && !customValido)
                return toast.error(
                  `Escriba una cantidad entre 1 y ${dailyLimit.toLocaleString('es-CO')}`,
                );
              if (count === 0) return toast.error('No hay destinatarios');
              mut.mutate();
            }}
            disabled={mut.isPending || (sendLimit === 'custom' && !customValido)}
          >
            <Megaphone className="h-4 w-4" /> Enviar a{' '}
            {Math.min(count, chosenLimit).toLocaleString('es-CO')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const composerSchema = z.object({
  template_id: z.string().uuid('Selecciona una plantilla'),
  recipients: z.string().min(3, 'Ingresa al menos un correo'),
});
type ComposerInput = z.infer<typeof composerSchema>;

function ComposerDialog({
  open,
  onOpenChange,
  templates,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templates: { id: string; name: string }[];
}) {
  const form = useForm<ComposerInput>({
    resolver: zodResolver(composerSchema),
    defaultValues: { template_id: '', recipients: '' },
  });
  const [sender, setSender] = useState('');
  const senders = useQuery({ queryKey: ['email-senders'], queryFn: listSenders, enabled: open });
  const mut = useMutation({
    mutationFn: (v: ComposerInput) =>
      sendEmail({
        template_id: v.template_id,
        recipients: v.recipients
          .split(/[\s,;]+/)
          .map((r) => r.trim())
          .filter(Boolean),
        from_email: sender || undefined,
        variables: {},
      }),
    onSuccess: (res) => {
      if (res.failed > 0) {
        const err = res.results.find((r) => r.status === 'failed')?.error;
        toast.error(`No se pudo enviar (${res.failed}). ${err ?? 'Revisa el SMTP.'}`);
        return;
      }
      toast.success(`Enviado a ${res.sent} destinatario(s).`);
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar correo</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Plantilla</Label>
            <Select
              value={form.watch('template_id')}
              onValueChange={(v) => form.setValue('template_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.template_id && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.template_id.message}
              </p>
            )}
          </div>
          {senders.data && senders.data.length > 1 && (
            <div>
              <Label className="mb-1.5 block">Enviar desde</Label>
              <Select value={sender} onValueChange={setSender}>
                <SelectTrigger>
                  <SelectValue placeholder={senders.data[0]} />
                </SelectTrigger>
                <SelectContent>
                  {senders.data.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="recipients" className="mb-1.5 block">
              Destinatarios
            </Label>
            <textarea
              id="recipients"
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={'cliente@empresa.co, otro@empresa.co\no uno por línea (no tienen que ser prospectos)'}
              {...form.register('recipients')}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Cualquier correo, separados por coma, espacio o salto de línea. No necesitan ser prospectos.
            </p>
            {form.formState.errors.recipients && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.recipients.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              <Send className="h-4 w-4" /> Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
