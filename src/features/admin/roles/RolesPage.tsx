import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { Can } from '@/components/auth/Can';
import {
  assignPermissions,
  listPermissions,
  listRoles,
} from '@/features/admin/api/admin.api';
import { apiErrorMessage } from '@/api/client';
import type { PermissionRead, RoleRead } from '@/types/api';

export function RolesPage() {
  const roles = useQuery({ queryKey: ['admin-roles'], queryFn: listRoles });
  const permissions = useQuery({ queryKey: ['admin-permissions'], queryFn: listPermissions });
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const selectedRole = roles.data?.find((r) => r.id === selectedRoleId) ?? roles.data?.[0] ?? null;

  if (roles.isLoading || permissions.isLoading) return <TableSkeleton rows={8} columns={3} />;
  if (roles.error) return <ErrorState error={roles.error} onRetry={() => roles.refetch()} />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Roles y permisos</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona un rol para editar su matriz de permisos.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {roles.data?.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  selectedRole?.id === r.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {r.name}
                </span>
                {r.is_system && (
                  <Badge variant="secondary" className="text-[10px]">
                    sistema
                  </Badge>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {selectedRole && permissions.data && (
            <PermissionMatrix role={selectedRole} permissions={permissions.data} />
          )}
        </div>
      </div>
    </div>
  );
}

function PermissionMatrix({
  role,
  permissions,
}: {
  role: RoleRead;
  permissions: PermissionRead[];
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissions));

  // Reinicia selección cuando cambia el rol.
  useEffect(() => {
    setSelected(new Set(role.permissions));
  }, [role.id, role.permissions]);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionRead[]>();
    for (const p of permissions) {
      const list = map.get(p.resource) ?? [];
      list.push(p);
      map.set(p.resource, list);
    }
    return Array.from(map.entries());
  }, [permissions]);

  const mut = useMutation({
    mutationFn: (codes: string[]) => assignPermissions(role.id, codes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-roles'] });
      toast.success('Permisos actualizados');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const isSystemSuper = role.name === 'super_admin';

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{role.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{role.description}</p>
        </div>
        <Can code="roles.assign_permissions">
          <Button
            onClick={() => mut.mutate(Array.from(selected))}
            disabled={mut.isPending || isSystemSuper}
            title={isSystemSuper ? 'super_admin siempre tiene todos los permisos' : undefined}
          >
            <Save className="h-4 w-4" /> Guardar
          </Button>
        </Can>
      </CardHeader>
      <CardContent className="space-y-5">
        {grouped.map(([resource, perms]) => (
          <div key={resource}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {resource}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {perms.map((p) => (
                <label
                  key={p.code}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <Checkbox
                    checked={selected.has(p.code)}
                    disabled={isSystemSuper}
                    onCheckedChange={() => toggle(p.code)}
                  />
                  <span className="truncate" title={p.description}>
                    {p.action}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
