import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Pencil,
  FileDown,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FullPageSpinner, ErrorState, EmptyState } from '@/components/common/states';
import { Can } from '@/components/auth/Can';
import {
  getClient,
  getDianCredentials,
  listClientServices,
  addClientService,
  updateClientService,
  downloadContract,
  type ContractFields,
} from '@/features/clients/api/clients.api';
import { ClientEditDialog } from '@/features/clients/components/ClientEditDialog';
import { EmailTrackingSection } from '@/features/prospects/components/EmailTrackingSection';
import { FollowUpTimeline } from '@/features/prospects/components/FollowUpTimeline';
import { listServices } from '@/features/dashboard/api/services.api';
import { apiErrorMessage } from '@/api/client';
import { formatCOP, formatDate } from '@/lib/utils';
import type { ClientRead, ClientServiceRead } from '@/types/api';

type ServiceRow = ClientServiceRead & ContractFields;

/** Formulario de servicio contratado: servicio, contrato, fechas, valor y estado. */
function ServiceFormDialog({
  clientId,
  service,
  open,
  onOpenChange,
}: {
  clientId: string;
  service: ServiceRow | null; // null = agregar
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const catalog = useQuery({ queryKey: ['services'], queryFn: () => listServices(true) });
  const [serviceId, setServiceId] = useState('');
  const [contrato, setContrato] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [valor, setValor] = useState('0');
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (open) {
      setServiceId(service?.service_id ?? '');
      setContrato(service?.contrato_numero ?? '');
      setStartDate(service?.start_date ?? '');
      setEndDate(service?.end_date ?? '');
      setValor(service ? String(service.valor_mensual) : '0');
      setActivo(service ? service.status === 'activo' : true);
    }
  }, [open, service]);

  const mut = useMutation({
    mutationFn: () => {
      const body = {
        service_id: serviceId,
        valor_mensual: valor || '0',
        contrato_numero: contrato.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        status: (activo ? 'activo' : 'cancelado') as 'activo' | 'cancelado',
      };
      return service
        ? updateClientService(clientId, service.id, body)
        : addClientService(clientId, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'services'] });
      toast.success(service ? 'Servicio actualizado' : 'Servicio agregado');
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !mut.isPending && onOpenChange(false)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{service ? 'Editar servicio' : 'Agregar servicio'}</DialogTitle>
          <DialogDescription>
            Cada servicio tiene su propio contrato, fechas y valor. Un cliente puede tener varios
            contratos a la vez.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Servicio a prestar</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el servicio" />
              </SelectTrigger>
              <SelectContent>
                {catalog.data?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">N° del contrato</Label>
            <Input
              placeholder="Ej. 001"
              value={contrato}
              onChange={(e) => setContrato(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Valor del contrato (mensual)</Label>
            <Input
              type="number"
              min={0}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Fecha de inicio</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Fecha final</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Contrato activo
            </label>
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
              if (!serviceId) return toast.error('Selecciona el servicio');
              mut.mutate();
            }}
          >
            {mut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Acceso al portal DIAN del cliente: usuario visible, clave bajo permiso. */
function DianAccessCard({ client }: { client: ClientRead }) {
  const [clave, setClave] = useState<string | null>(null);
  const usuario = (client as { dian_usuario?: string | null }).dian_usuario;
  const guardada = (client as { dian_clave_guardada?: boolean }).dian_clave_guardada;

  const reveal = useMutation({
    mutationFn: () => getDianCredentials(client.id),
    onSuccess: (res) => setClave(res.dian_clave ?? '—'),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (!usuario && !guardada) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" /> Acceso al portal DIAN
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <Info label="Usuario DIAN" value={usuario} />
        <div>
          <p className="text-muted-foreground">Clave DIAN</p>
          <p className="font-mono font-medium">
            {clave ?? (guardada ? '••••••••' : '—')}
          </p>
        </div>
        <div className="flex items-end">
          {guardada && (
            <Can code="clients.credentials">
              {clave ? (
                <Button variant="outline" size="sm" onClick={() => setClave(null)}>
                  <EyeOff className="h-4 w-4" /> Ocultar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reveal.isPending}
                  onClick={() => reveal.mutate()}
                  title="Queda registrado en la auditoría"
                >
                  {reveal.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Ver clave
                </Button>
              )}
            </Can>
          )}
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-3">
          La clave se guarda cifrada. Consultarla queda registrado en la auditoría del sistema.
        </p>
      </CardContent>
    </Card>
  );
}

export function ClientDetailPage() {
  const { id = '' } = useParams();
  const { data: client, isLoading, error, refetch } = useQuery({
    queryKey: ['clients', 'detail', id],
    queryFn: () => getClient(id),
    enabled: !!id,
  });
  const servicesQ = useQuery({
    queryKey: ['clients', id, 'services'],
    queryFn: () => listClientServices(id),
    enabled: !!id,
  });
  const catalog = useQuery({ queryKey: ['services'], queryFn: () => listServices(true) });

  const [serviceForm, setServiceForm] = useState<{ open: boolean; row: ServiceRow | null }>({
    open: false,
    row: null,
  });
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const onDownloadContract = async (row: ServiceRow) => {
    setDownloading(row.id);
    try {
      const blob = await downloadContract(id, row.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato_${row.contrato_numero ?? row.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) return <FullPageSpinner />;
  if (error || !client) return <ErrorState error={error} onRetry={() => refetch()} />;

  const serviceName = (sid: string) => catalog.data?.find((s) => s.id === sid)?.name ?? sid;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="/clients" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-2xl font-bold tracking-tight">{client.razon_social}</h1>
        <Badge variant="success">{client.status}</Badge>
        <Can code="clients.edit">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        </Can>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de facturación y contrato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Info label="NIT" value={client.nit} />
          <Info label="Teléfono" value={client.telefono} />
          <Info label="Email" value={client.email} />
          <Info label="Dirección" value={client.direccion} />
          <Info label="Contacto contabilidad" value={client.contacto_contabilidad_nombre} />
          <Info label="Tel. contabilidad" value={client.contacto_contabilidad_telefono} />
          <Info label="Correo contabilidad" value={client.contacto_contabilidad_email} />
          <Info label="N° contrato" value={client.contrato_numero} />
          <Info label="Fecha de fidelización" value={formatDate(client.fecha_contrato)} />
          <Info label="Creado" value={formatDate(client.created_at)} />
        </CardContent>
      </Card>

      <DianAccessCard client={client} />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Servicios contratados</CardTitle>
          <Can code="clients.edit">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setServiceForm({ open: true, row: null })}
            >
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </Can>
        </CardHeader>
        <CardContent className="space-y-4">
          {servicesQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : !servicesQ.data || servicesQ.data.length === 0 ? (
            <EmptyState title="Sin servicios" description="Agrega el primer servicio contratado." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Fecha de inicio</TableHead>
                    <TableHead>Fecha final</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Contrato PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicesQ.data.map((cs) => (
                    <TableRow key={cs.id}>
                      <TableCell className="font-medium">{serviceName(cs.service_id)}</TableCell>
                      <TableCell>{cs.contrato_numero || '—'}</TableCell>
                      <TableCell>{formatDate(cs.start_date)}</TableCell>
                      <TableCell>{formatDate(cs.end_date)}</TableCell>
                      <TableCell>{formatCOP(Number(cs.valor_mensual))}</TableCell>
                      <TableCell>
                        <Badge variant={cs.status === 'activo' ? 'success' : 'secondary'}>
                          {cs.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={downloading === cs.id}
                            onClick={() => onDownloadContract(cs)}
                            title="Descargar el contrato en PDF"
                          >
                            {downloading === cs.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <FileDown className="h-3.5 w-3.5" />
                            )}
                            Descargar
                          </Button>
                          <Can code="clients.edit">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              aria-label="Editar servicio"
                              onClick={() => setServiceForm({ open: true, row: cs })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Can>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hoja de vida completa: correos y gestiones (llamadas, citas, reuniones) */}
      {client.prospect_id && <EmailTrackingSection prospectId={client.prospect_id} />}
      {client.prospect_id && <FollowUpTimeline prospectId={client.prospect_id} />}

      <ClientEditDialog client={client} open={editing} onOpenChange={setEditing} />
      <ServiceFormDialog
        clientId={id}
        service={serviceForm.row}
        open={serviceForm.open}
        onOpenChange={(o) => setServiceForm((p) => ({ ...p, open: o }))}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}
