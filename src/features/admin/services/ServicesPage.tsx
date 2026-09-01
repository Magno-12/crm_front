import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { Can } from '@/components/auth/Can';
import { useCan } from '@/features/auth/hooks/useAuth';
import {
  AREAS_CONTRATO,
  createService,
  listServices,
  updateService,
} from '@/features/dashboard/api/services.api';
import { apiErrorMessage } from '@/api/client';
import { formatCOP } from '@/lib/utils';
import type { ServiceRead } from '@/types/api';

export function ServicesPage() {
  const services = useQuery({ queryKey: ['services'], queryFn: () => listServices(false) });
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
          <p className="text-sm text-muted-foreground">Catálogo de servicios de la firma.</p>
        </div>
        <Can code="services.create">
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo servicio
          </Button>
        </Can>
      </header>

      {services.isLoading ? (
        <TableSkeleton rows={6} columns={3} />
      ) : services.error ? (
        <ErrorState error={services.error} onRetry={() => services.refetch()} />
      ) : !services.data || services.data.length === 0 ? (
        <EmptyState icon={<Settings />} title="Sin servicios" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Área del contrato</TableHead>
                <TableHead>Valor base</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    {s.category ? <Badge variant="outline">{s.category}</Badge> : '—'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {s.description || '—'}
                  </TableCell>
                  <TableCell>
                    <AreaSelector servicio={s} />
                  </TableCell>
                  <TableCell>{formatCOP(Number(s.default_value))}</TableCell>
                  <TableCell>
                    {s.is_active ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="rounded-lg border bg-muted/40 p-3.5 text-sm">
        <p className="font-medium">Para qué sirve el área del contrato</p>
        <p className="mt-1 text-muted-foreground">
          El contrato marco tiene nueve áreas de especialidad y cada una trae su anexo técnico.
          Al asignarle el área a un servicio, el contrato del cliente que lo tenga contratado
          marca esa casilla en la Cláusula Primera y adjunta el anexo correspondiente.{' '}
          <strong>Un servicio sin área sale en el contrato pero sin su anexo.</strong>
        </p>
      </div>

      <ServiceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
  area_contrato: z.string().optional(),
  default_value: z.coerce.number().min(0),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function ServiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', area_contrato: 'ninguna', default_value: 0 },
  });
  const mut = useMutation({
    mutationFn: (v: FormOutput) =>
      createService({
        name: v.name,
        category: '',
        description: v.description ?? '',
        area_contrato: v.area_contrato && v.area_contrato !== 'ninguna' ? v.area_contrato : null,
        default_value: String(v.default_value),
        is_active: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Servicio creado');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo servicio</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-1.5 block">
              Nombre
            </Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="description" className="mb-1.5 block">
              Descripción
            </Label>
            <Input id="description" {...form.register('description')} />
          </div>
          <div>
            <Label className="mb-1.5 block">Área del contrato marco</Label>
            <Select
              value={form.watch('area_contrato') ?? 'ninguna'}
              onValueChange={(v) => form.setValue('area_contrato', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Sin área (no adjunta anexo)</SelectItem>
                {AREAS_CONTRATO.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Define qué anexo técnico se adjunta al contrato de los clientes que contraten
              este servicio.
            </p>
          </div>
          <div>
            <Label htmlFor="default_value" className="mb-1.5 block">
              Valor base (COP)
            </Label>
            <Input id="default_value" type="number" min={0} {...form.register('default_value')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Área del contrato marco del servicio: define qué anexo técnico se adjunta. */
function AreaSelector({ servicio }: { servicio: ServiceRead }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (area: string) =>
      updateService(servicio.id, { area_contrato: area === 'ninguna' ? null : area }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Área del contrato actualizada');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const actual = (servicio as ServiceRead & { area_contrato?: string | null }).area_contrato;
  const puedeEditar = useCan('services.edit');

  // Quien no puede editar el catálogo solo ve el área asignada.
  if (!puedeEditar) {
    return (
      <span className="text-muted-foreground">
        {AREAS_CONTRATO.find((a) => a.value === actual)?.label ?? 'Sin área'}
      </span>
    );
  }

  return (
    <>
      <Select
        value={actual ?? 'ninguna'}
        onValueChange={(v) => mut.mutate(v)}
        disabled={mut.isPending}
      >
        <SelectTrigger className="w-[240px]" aria-label={`Área del contrato de ${servicio.name}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ninguna">Sin área (no adjunta anexo)</SelectItem>
          {AREAS_CONTRATO.map((a) => (
            <SelectItem key={a.value} value={a.value}>
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
