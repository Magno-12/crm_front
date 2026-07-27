import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Lock, KeyRound, MoreHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { Can } from '@/components/auth/Can';
import {
  createUser,
  listRoles,
  listUsers,
  resetPassword,
  unlockUser,
} from '@/features/admin/api/admin.api';
import { apiErrorMessage } from '@/api/client';

export function UsersPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const users = useQuery({ queryKey: ['admin-users'], queryFn: () => listUsers({ page_size: 50 }) });

  const unlock = useMutation({
    mutationFn: unlockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario desbloqueado');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const reset = useMutation({
    mutationFn: resetPassword,
    onSuccess: (res) => setTempPassword(res.temporary_password),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gestiona accesos del equipo.</p>
        </div>
        <Can code="users.create">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo usuario
          </Button>
        </Can>
      </header>

      {users.isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : users.error ? (
        <ErrorState error={users.error} onRetry={() => users.refetch()} />
      ) : !users.data || users.data.items.length === 0 ? (
        <EmptyState icon={<Users />} title="Sin usuarios" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} variant="secondary">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.is_locked ? (
                      <Badge variant="destructive">Bloqueado</Badge>
                    ) : u.is_active ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Acciones">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Can code="users.unlock">
                          <DropdownMenuItem
                            disabled={!u.is_locked}
                            onClick={() => unlock.mutate(u.id)}
                          >
                            <Lock className="h-4 w-4" /> Desbloquear
                          </DropdownMenuItem>
                        </Can>
                        <Can code="users.edit">
                          <DropdownMenuItem onClick={() => reset.mutate(u.id)}>
                            <KeyRound className="h-4 w-4" /> Resetear contraseña
                          </DropdownMenuItem>
                        </Can>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(pwd) => setTempPassword(pwd)}
      />
      <TempPasswordDialog password={tempPassword} onClose={() => setTempPassword(null)} />
    </div>
  );
}

const schema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  role_ids: z.array(z.string().uuid()).min(1, 'Selecciona al menos un rol'),
});
type CreateUserInput = z.infer<typeof schema>;

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (pwd: string | null) => void;
}) {
  const qc = useQueryClient();
  const roles = useQuery({ queryKey: ['admin-roles'], queryFn: listRoles, enabled: open });
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', full_name: '', role_ids: [] },
  });
  const mut = useMutation({
    mutationFn: createUser,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario creado');
      onOpenChange(false);
      form.reset();
      onCreated(res.temporary_password ?? null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const selected = form.watch('role_ids');
  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((r) => r !== id) : [...selected, id];
    form.setValue('role_ids', next, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Se generará una contraseña temporal; el usuario deberá cambiarla al ingresar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-1.5 block">
              Email
            </Label>
            <Input id="email" type="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="full_name" className="mb-1.5 block">
              Nombre completo
            </Label>
            <Input id="full_name" {...form.register('full_name')} />
            {form.formState.errors.full_name && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.full_name.message}
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1.5 block">Roles</Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
              {roles.data?.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.includes(r.id)}
                    onCheckedChange={() => toggle(r.id)}
                  />
                  {r.name}
                </label>
              ))}
            </div>
            {form.formState.errors.role_ids && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.role_ids.message}
              </p>
            )}
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

function TempPasswordDialog({
  password,
  onClose,
}: {
  password: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!password} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contraseña temporal</DialogTitle>
          <DialogDescription>
            Cópiala y compártela de forma segura. No se volverá a mostrar.
          </DialogDescription>
        </DialogHeader>
        <code className="block rounded-md border bg-muted p-3 text-center text-lg font-bold tracking-wider">
          {password}
        </code>
        <DialogFooter>
          <Button
            onClick={() => {
              if (password) navigator.clipboard.writeText(password);
              toast.success('Copiada al portapapeles');
            }}
          >
            Copiar
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
