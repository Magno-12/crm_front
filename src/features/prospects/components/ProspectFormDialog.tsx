import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProspect, useUpdateProspect } from '@/features/prospects/hooks/useProspects';
import { apiErrorMessage } from '@/api/client';
import type { ProspectRead } from '@/types/api';

const schema = z.object({
  nit: z.string().min(1, 'Requerido'),
  razon_social: z.string().min(1, 'Requerido'),
  ciudad: z.string().optional(),
  departamento: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  actividad_ciiu: z.string().optional(),
  notes: z.string().optional(),
});
type FormInput = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect?: ProspectRead;
}

export function ProspectFormDialog({ open, onOpenChange, prospect }: Props) {
  const editing = !!prospect;
  const create = useCreateProspect();
  const update = useUpdateProspect(prospect?.id ?? '');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { nit: '', razon_social: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nit: prospect?.nit ?? '',
        razon_social: prospect?.razon_social ?? '',
        ciudad: prospect?.ciudad ?? '',
        departamento: prospect?.departamento ?? '',
        telefono: prospect?.telefono ?? '',
        email: prospect?.email ?? '',
        actividad_ciiu: prospect?.actividad_ciiu ?? '',
        notes: prospect?.notes ?? '',
      });
    }
  }, [open, prospect, form]);

  const onSubmit = async (values: FormInput) => {
    setSubmitting(true);
    try {
      const payload = { ...values, email: values.email || null };
      if (editing) {
        await update.mutateAsync(payload);
        toast.success('Prospecto actualizado');
      } else {
        await create.mutateAsync({ ...payload, estado: 'nuevo', segmento: 'otro' });
        toast.success('Prospecto creado');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar prospecto' : 'Nuevo prospecto'}</DialogTitle>
          <DialogDescription>Datos básicos del prospecto comercial.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="NIT" id="nit" error={form.formState.errors.nit?.message}>
            <Input id="nit" disabled={editing} {...form.register('nit')} />
          </FormField>
          <FormField
            label="Razón social"
            id="razon_social"
            error={form.formState.errors.razon_social?.message}
          >
            <Input id="razon_social" {...form.register('razon_social')} />
          </FormField>
          <FormField label="Ciudad" id="ciudad">
            <Input id="ciudad" {...form.register('ciudad')} />
          </FormField>
          <FormField label="Departamento" id="departamento">
            <Input id="departamento" {...form.register('departamento')} />
          </FormField>
          <FormField label="Teléfono" id="telefono">
            <Input id="telefono" {...form.register('telefono')} />
          </FormField>
          <FormField label="Email" id="email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" {...form.register('email')} />
          </FormField>
          <FormField label="Actividad CIIU" id="actividad_ciiu">
            <Input id="actividad_ciiu" {...form.register('actividad_ciiu')} />
          </FormField>
          <FormField label="Notas" id="notes" className="sm:col-span-2">
            <Input id="notes" {...form.register('notes')} />
          </FormField>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  id,
  error,
  className,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
