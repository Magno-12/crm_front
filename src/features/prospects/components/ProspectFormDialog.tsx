import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CiiuPicker } from '@/features/prospects/components/CiiuPicker';
import { lookupRues } from '@/features/prospects/api/prospects.api';
import {
  PROSPECT_STATUSES,
  SEGMENTS,
  SEGMENT_META,
  statusMeta,
} from '@/features/prospects/lib/status';
import { useCreateProspect, useUpdateProspect } from '@/features/prospects/hooks/useProspects';
import { apiErrorMessage } from '@/api/client';
import type {
  ProspectCreate,
  ProspectRead,
  ProspectSegment,
  ProspectStatus,
  ProspectUpdate,
} from '@/types/api';

const schema = z.object({
  nit: z.string().min(1, 'Requerido'),
  razon_social: z.string().min(1, 'Requerido'),
  segmento: z.string(),
  estado: z.string(),
  representante_legal: z.string().optional(),
  cedula_representante: z.string().optional(),
  contacto_nombre: z.string().optional(),
  contacto_cargo: z.string().optional(),
  contacto_telefono: z.string().optional(),
  contacto_email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  departamento: z.string().optional(),
  actividad_ciiu: z.string().optional(),
  regimen_tributario: z.string().optional(),
  fecha_matricula: z.string().optional(),
  fecha_renovacion: z.string().optional(),
  ingresos: z.string().optional(),
  activos: z.string().optional(),
  estado_actual: z.string().optional(),
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
  const [ruesLoading, setRuesLoading] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { nit: '', razon_social: '', segmento: 'otro', estado: 'nuevo' },
  });

  const handleRues = async () => {
    const nit = form.getValues('nit')?.trim();
    if (!nit || nit.length < 3) {
      toast.error('Escribe el NIT primero');
      return;
    }
    setRuesLoading(true);
    try {
      const r = await lookupRues(nit);
      if (!r) {
        toast.error('No se encontró ese NIT en el RUES');
        return;
      }
      if (r.razon_social) form.setValue('razon_social', r.razon_social);
      if (r.actividad_ciiu) form.setValue('actividad_ciiu', r.actividad_ciiu);
      toast.success(
        `RUES: ${r.razon_social ?? ''}${r.camara ? ` · ${r.camara}` : ''}${r.estado ? ` · ${r.estado}` : ''}`,
      );
    } catch {
      toast.error('No se pudo consultar el RUES');
    } finally {
      setRuesLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      form.reset({
        nit: prospect?.nit ?? '',
        razon_social: prospect?.razon_social ?? '',
        segmento: prospect?.segmento ?? 'otro',
        estado: prospect?.estado ?? 'nuevo',
        representante_legal: prospect?.representante_legal ?? '',
        cedula_representante: prospect?.cedula_representante ?? '',
        contacto_nombre: prospect?.contacto_nombre ?? '',
        contacto_cargo: prospect?.contacto_cargo ?? '',
        contacto_telefono: prospect?.contacto_telefono ?? '',
        contacto_email: prospect?.contacto_email ?? '',
        telefono: prospect?.telefono ?? '',
        email: prospect?.email ?? '',
        direccion: prospect?.direccion ?? '',
        ciudad: prospect?.ciudad ?? '',
        departamento: prospect?.departamento ?? '',
        actividad_ciiu: prospect?.actividad_ciiu ?? '',
        regimen_tributario: prospect?.regimen_tributario ?? '',
        fecha_matricula: prospect?.fecha_matricula ?? '',
        fecha_renovacion: prospect?.fecha_renovacion ?? '',
        ingresos: prospect?.ingresos != null ? String(prospect.ingresos) : '',
        activos: prospect?.activos != null ? String(prospect.activos) : '',
        estado_actual: prospect?.estado_actual ?? '',
        notes: prospect?.notes ?? '',
      });
    }
  }, [open, prospect, form]);

  const onSubmit = async (values: FormInput) => {
    setSubmitting(true);
    try {
      const clean = (v?: string) => (v && v.trim() !== '' ? v : null);
      const payload = {
        ...values,
        email: clean(values.email),
        contacto_email: clean(values.contacto_email),
        fecha_matricula: clean(values.fecha_matricula),
        fecha_renovacion: clean(values.fecha_renovacion),
        ingresos: clean(values.ingresos),
        activos: clean(values.activos),
      };
      if (editing) {
        await update.mutateAsync(payload as unknown as ProspectUpdate);
        toast.success('Prospecto actualizado');
      } else {
        await create.mutateAsync(payload as unknown as ProspectCreate);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar prospecto' : 'Nuevo prospecto'}</DialogTitle>
          <DialogDescription>Datos del prospecto, representante y contacto comercial.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="NIT" id="nit" error={form.formState.errors.nit?.message}>
            <div className="flex gap-2">
              <Input id="nit" disabled={editing} {...form.register('nit')} />
              {!editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRues}
                  disabled={ruesLoading}
                  title="Traer razón social y CIIU desde el RUES"
                >
                  {ruesLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  RUES
                </Button>
              )}
            </div>
          </FormField>
          <FormField
            label="Razón social"
            id="razon_social"
            error={form.formState.errors.razon_social?.message}
          >
            <Input id="razon_social" {...form.register('razon_social')} />
          </FormField>

          <FormField label="Segmento" id="segmento">
            <Select
              value={form.watch('segmento')}
              onValueChange={(v) => form.setValue('segmento', v as ProspectSegment)}
            >
              <SelectTrigger id="segmento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SEGMENT_META[s]?.label ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Estado" id="estado">
            <Select
              value={form.watch('estado')}
              onValueChange={(v) => form.setValue('estado', v as ProspectStatus)}
            >
              <SelectTrigger id="estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROSPECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusMeta(s).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <SectionTitle>Representante legal</SectionTitle>
          <FormField label="Nombre del representante" id="representante_legal">
            <Input id="representante_legal" {...form.register('representante_legal')} />
          </FormField>
          <FormField label="Cédula del representante" id="cedula_representante">
            <Input id="cedula_representante" {...form.register('cedula_representante')} />
          </FormField>

          <SectionTitle>Persona de contacto (comercial)</SectionTitle>
          <FormField label="Nombre de contacto" id="contacto_nombre">
            <Input id="contacto_nombre" {...form.register('contacto_nombre')} />
          </FormField>
          <FormField label="Cargo" id="contacto_cargo">
            <Input id="contacto_cargo" {...form.register('contacto_cargo')} />
          </FormField>
          <FormField label="Teléfono de contacto" id="contacto_telefono">
            <Input id="contacto_telefono" {...form.register('contacto_telefono')} />
          </FormField>
          <FormField
            label="Email de contacto"
            id="contacto_email"
            error={form.formState.errors.contacto_email?.message}
          >
            <Input id="contacto_email" type="email" {...form.register('contacto_email')} />
          </FormField>

          <SectionTitle>Empresa</SectionTitle>
          <FormField label="Teléfono" id="telefono">
            <Input id="telefono" {...form.register('telefono')} />
          </FormField>
          <FormField label="Email" id="email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" {...form.register('email')} />
          </FormField>
          <FormField label="Dirección" id="direccion" className="sm:col-span-2">
            <Input id="direccion" {...form.register('direccion')} />
          </FormField>
          <FormField label="Ciudad" id="ciudad">
            <Input id="ciudad" {...form.register('ciudad')} />
          </FormField>
          <FormField label="Departamento" id="departamento">
            <Input id="departamento" {...form.register('departamento')} />
          </FormField>
          <FormField label="Actividad CIIU" id="actividad_ciiu" className="sm:col-span-2">
            <CiiuPicker
              value={form.watch('actividad_ciiu') ?? ''}
              onChange={(code) => form.setValue('actividad_ciiu', code)}
            />
          </FormField>
          <FormField label="Régimen tributario" id="regimen_tributario">
            <Input id="regimen_tributario" {...form.register('regimen_tributario')} />
          </FormField>
          <FormField label="Estado actual (registro)" id="estado_actual">
            <Input id="estado_actual" {...form.register('estado_actual')} />
          </FormField>
          <FormField label="Matrícula mercantil (fecha)" id="fecha_matricula">
            <Input id="fecha_matricula" type="date" {...form.register('fecha_matricula')} />
          </FormField>
          <FormField label="Renovación (fecha)" id="fecha_renovacion">
            <Input id="fecha_renovacion" type="date" {...form.register('fecha_renovacion')} />
          </FormField>
          <FormField label="Ingresos anuales (COP)" id="ingresos">
            <Input id="ingresos" type="number" min={0} {...form.register('ingresos')} />
          </FormField>
          <FormField label="Patrimonio / activos (COP)" id="activos">
            <Input id="activos" type="number" min={0} {...form.register('activos')} />
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 border-b pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-2">
      {children}
    </p>
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
