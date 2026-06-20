import { api } from '@/api/client';
import type {
  AuditRead,
  Page,
  PermissionRead,
  RoleCreate,
  RoleRead,
  TempPasswordResponse,
  UserCreate,
  UserCreatedResponse,
  UserRead,
} from '@/types/api';

// ---- Usuarios ----
export async function listUsers(params: {
  q?: string;
  page?: number;
  page_size?: number;
}): Promise<Page<UserRead>> {
  const { data } = await api.get<Page<UserRead>>('/admin/users', { params });
  return data;
}

export async function createUser(body: UserCreate): Promise<UserCreatedResponse> {
  const { data } = await api.post<UserCreatedResponse>('/admin/users', body);
  return data;
}

export async function updateUser(
  id: string,
  body: { full_name?: string; is_active?: boolean },
): Promise<UserRead> {
  const { data } = await api.patch<UserRead>(`/admin/users/${id}`, body);
  return data;
}

export async function unlockUser(id: string): Promise<UserRead> {
  const { data } = await api.post<UserRead>(`/admin/users/${id}/unlock`);
  return data;
}

export async function resetPassword(id: string): Promise<TempPasswordResponse> {
  const { data } = await api.post<TempPasswordResponse>(`/admin/users/${id}/reset-password`);
  return data;
}

export async function assignRoles(id: string, roleIds: string[]): Promise<UserRead> {
  const { data } = await api.put<UserRead>(`/admin/users/${id}/roles`, { role_ids: roleIds });
  return data;
}

// ---- Roles / permisos ----
export async function listRoles(): Promise<RoleRead[]> {
  const { data } = await api.get<RoleRead[]>('/admin/roles');
  return data;
}

export async function createRole(body: RoleCreate): Promise<RoleRead> {
  const { data } = await api.post<RoleRead>('/admin/roles', body);
  return data;
}

export async function assignPermissions(id: string, codes: string[]): Promise<RoleRead> {
  const { data } = await api.put<RoleRead>(`/admin/roles/${id}/permissions`, {
    permission_codes: codes,
  });
  return data;
}

export async function listPermissions(): Promise<PermissionRead[]> {
  const { data } = await api.get<PermissionRead[]>('/admin/permissions');
  return data;
}

// ---- Auditoría ----
export async function listAudit(params: {
  page?: number;
  page_size?: number;
  action?: string;
  resource_type?: string;
}): Promise<Page<AuditRead>> {
  const { data } = await api.get<Page<AuditRead>>('/admin/audit', { params });
  return data;
}
