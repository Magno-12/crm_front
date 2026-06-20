import { useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { changePasswordRequest } from '@/features/auth/api/auth.api';
import { apiErrorMessage } from '@/api/client';

const schema = z
  .object({
    current_password: z.string().min(1, 'Ingresa tu contraseña actual'),
    new_password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .max(128, 'Máximo 128 caracteres'),
    confirm: z.string(),
  })
  .refine((data) => data.new_password === data.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  });
type ChangePasswordInput = z.infer<typeof schema>;

export function ChangePasswordPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', new_password: '', confirm: '' },
  });

  const forced = user?.must_change_password ?? false;

  const onSubmit = async (values: ChangePasswordInput) => {
    setSubmitting(true);
    try {
      const updated = await changePasswordRequest(values.current_password, values.new_password);
      setUser(updated);
      toast.success('Contraseña actualizada');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/40 p-4">
      <Card className="w-full max-w-md rounded-2xl border-border/60 shadow-elevated">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Cambiar contraseña</CardTitle>
          <CardDescription>
            {forced
              ? 'Por seguridad, debes cambiar tu contraseña antes de continuar.'
              : 'Actualiza tu contraseña.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field
              id="current_password"
              label="Contraseña actual"
              type="password"
              autoComplete="current-password"
              error={form.formState.errors.current_password?.message}
              register={form.register('current_password')}
            />
            <Field
              id="new_password"
              label="Nueva contraseña"
              type="password"
              autoComplete="new-password"
              error={form.formState.errors.new_password?.message}
              register={form.register('new_password')}
            />
            <Field
              id="confirm"
              label="Confirmar nueva contraseña"
              type="password"
              autoComplete="new-password"
              error={form.formState.errors.confirm?.message}
              register={form.register('confirm')}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
            {forced && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                Cerrar sesión
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  error?: string;
  register: UseFormRegisterReturn;
}

function Field({ id, label, type, autoComplete, error, register }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} autoComplete={autoComplete} aria-invalid={!!error} {...register} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
