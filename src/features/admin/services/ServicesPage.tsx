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
import { EmptyState, ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { Can } from '@/components/auth/Can';
import { createService, listServices } from '@/features/dashboard/api/services.api';
import { apiErrorMessage } from '@/api/client';
import { formatCOP } from '@/lib/utils';

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
                <TableHead>Descripción</TableHead>
                <TableHead>Valor base</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.description || '—'}</TableCell>
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

      <ServiceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
  default_value: z.coerce.number().min(0),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function ServiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', default_value: 0 },
  });
  const mut = useMutation({
    mutationFn: (v: FormOutput) =>
      createService({
        name: v.name,
        description: v.description ?? '',
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
