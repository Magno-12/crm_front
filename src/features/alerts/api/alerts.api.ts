import { api } from '@/api/client';
import type { AlertsResponse } from '@/types/api';

export async function getAlerts(): Promise<AlertsResponse> {
  const { data } = await api.get<AlertsResponse>('/alerts');
  return data;
}

export interface DigestResult {
  sent: number;
  total_alerts: number;
  recipients: { email?: string; alerts?: number; error?: string }[];
}

/** Envía por correo el resumen de alertas a cada asesor responsable. */
export async function sendAlertsDigest(): Promise<DigestResult> {
  const { data } = await api.post<DigestResult>('/alerts/digest');
  return data;
}

/** Envía el resumen solo a quien lo solicita (prueba). */
export async function sendAlertsDigestToMe(): Promise<DigestResult> {
  const { data } = await api.post<DigestResult>('/alerts/digest/me');
  return data;
}
