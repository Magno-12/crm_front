import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FullPageSpinner, ErrorState, EmptyState } from '@/components/common/states';
import { Can } from '@/components/auth/Can';
import {
  getClient,
  listClientServices,
  addClientService,
} from '@/features/clients/api/clients.api';
import { listServices } from '@/features/dashboard/api/services.api';
import { apiErrorMessage } from '@/api/client';
import { formatCOP, formatDate } from '@/lib/utils';

const schema = z.object({
  service_id: z.string().uuid('Selecciona un servicio'),
  valor_mensual: z.coerce.number().min(0),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function ClientDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
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

  const [adding, setAdding] = useState(false);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { service_id: '', valor_mensual: 0 },
  });
  const addMut = useMutation({
    mutationFn: (body: FormOutput) =>
      addClientService(id, {
        service_id: body.service_id,
        valor_mensual: String(body.valor_mensual),
        status: 'activo',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', id, 'services'] });
      toast.success('Servicio agregado');
      setAdding(false);
      form.reset();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">NIT</p>
            <p className="font-medium">{client.nit}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Inicio</p>
            <p className="font-medium">{formatDate(client.start_date)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Creado</p>
            <p className="font-medium">{formatDate(client.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Servicios contratados</CardTitle>
          <Can code="clients.edit">
            <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </Can>
        </CardHeader>
        <CardContent className="space-y-4">
          {adding && (
            <form
              onSubmit={form.handleSubmit((v) => addMut.mutate(v))}
              className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <Label className="mb-1 block text-xs">Servicio</Label>
                <Select
                  value={form.watch('service_id')}
                  onValueChange={(v) => form.setValue('service_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
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
              <div className="sm:w-40">
                <Label className="mb-1 block text-xs">Valor mensual</Label>
                <Input type="number" min={0} {...form.register('valor_mensual')} />
              </div>
              <Button type="submit" disabled={addMut.isPending}>
                Guardar
              </Button>
            </form>
          )}

          {servicesQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : !servicesQ.data || servicesQ.data.length === 0 ? (
            <EmptyState title="Sin servicios" description="Agrega el primer servicio contratado." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Valor mensual</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicesQ.data.map((cs) => (
                  <TableRow key={cs.id}>
                    <TableCell className="font-medium">{serviceName(cs.service_id)}</TableCell>
                    <TableCell>{formatCOP(Number(cs.valor_mensual))}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{cs.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
