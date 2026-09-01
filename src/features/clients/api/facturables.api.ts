import { api } from '@/api/client';

export interface ClienteFacturable {
  id: string;
  prospect_id: string | null;
  razon_social: string;
  nit: string;
  email: string | null;
  telefono: string | null;
  contrato_numero: string | null;
  servicios: string[];
  valor_mensual: number;
  saldo: number;
  facturas_pendientes: number;
}

/** Clientes con contrato: lo que facturan y lo que deben.
 *
 * Es por donde arrancan Facturación y Recibos de caja: primero el cliente,
 * después el documento.
 */
export async function getClientesFacturables(params: {
  q?: string;
  solo_con_saldo?: boolean;
}): Promise<ClienteFacturable[]> {
  const { data } = await api.get<ClienteFacturable[]>('/clients/facturables', { params });
  return data;
}
