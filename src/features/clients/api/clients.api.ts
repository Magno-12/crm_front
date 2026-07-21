import { api } from '@/api/client';
import type {
  ClientCreate,
  ClientRead,
  ClientServiceCreate,
  ClientServiceRead,
  ClientUpdate,
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

export async function updateClient(id: string, body: ClientUpdate): Promise<ClientRead> {
  const { data } = await api.patch<ClientRead>(`/clients/${id}`, body);
  return data;
}

/** Elimina el cliente fidelizado (y sus servicios); el prospecto se conserva. */
export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}

export async function listClientServices(
  id: string,
): Promise<(ClientServiceRead & ContractFields)[]> {
  const { data } = await api.get<(ClientServiceRead & ContractFields)[]>(
    `/clients/${id}/services`,
  );
  return data;
}

/** Servicios contratados del cliente asociado a un prospecto (para auto-facturar). */
export async function servicesByProspect(prospectId: string): Promise<ClientServiceRead[]> {
  const { data } = await api.get<ClientServiceRead[]>(
    `/clients/by-prospect/${prospectId}/services`,
  );
  return data;
}

/** Campos del contrato por servicio (aún no están en los tipos generados). */
export interface ContractFields {
  contrato_numero?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export async function addClientService(
  id: string,
  body: ClientServiceCreate & ContractFields,
): Promise<ClientServiceRead & ContractFields> {
  const { data } = await api.post<ClientServiceRead & ContractFields>(
    `/clients/${id}/services`,
    body,
  );
  return data;
}

export async function updateClientService(
  clientId: string,
  serviceRowId: string,
  body: Partial<ClientServiceCreate> & ContractFields,
): Promise<ClientServiceRead & ContractFields> {
  const { data } = await api.patch<ClientServiceRead & ContractFields>(
    `/clients/${clientId}/services/${serviceRowId}`,
    body,
  );
  return data;
}

/** Descarga el contrato del servicio en PDF (plantilla estándar con datos del cliente). */
export async function downloadContract(clientId: string, serviceRowId: string): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/clients/${clientId}/services/${serviceRowId}/contract`,
    { responseType: 'blob' },
  );
  return data;
}
