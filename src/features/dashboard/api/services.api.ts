import { api } from '@/api/client';
import type { ServiceCreate, ServiceRead } from '@/types/api';

export async function listServices(onlyActive = false): Promise<ServiceRead[]> {
  const { data } = await api.get<ServiceRead[]>('/services', {
    params: { only_active: onlyActive },
  });
  return data;
}

export async function createService(body: ServiceCreate): Promise<ServiceRead> {
  const { data } = await api.post<ServiceRead>('/services', body);
  return data;
}
