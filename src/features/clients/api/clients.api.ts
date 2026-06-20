import { api } from '@/api/client';
import type {
  ClientCreate,
  ClientRead,
  ClientServiceCreate,
  ClientServiceRead,
  Page,
} from '@/types/api';

export async function listClients(params: {
  q?: string;
  page?: number;
  page_size?: number;
}): Promise<Page<ClientRead>> {
  const { data } = await api.get<Page<ClientRead>>('/clients', { params });
  return data;
}

export async function getClient(id: string): Promise<ClientRead> {
  const { data } = await api.get<ClientRead>(`/clients/${id}`);
  return data;
}

export async function createClient(body: ClientCreate): Promise<ClientRead> {
  const { data } = await api.post<ClientRead>('/clients', body);
  return data;
}

export async function listClientServices(id: string): Promise<ClientServiceRead[]> {
  const { data } = await api.get<ClientServiceRead[]>(`/clients/${id}/services`);
  return data;
}

export async function addClientService(
  id: string,
  body: ClientServiceCreate,
): Promise<ClientServiceRead> {
  const { data } = await api.post<ClientServiceRead>(`/clients/${id}/services`, body);
  return data;
}
