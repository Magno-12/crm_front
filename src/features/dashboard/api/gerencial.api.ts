import { api } from '@/api/client';

export interface CampaignRow {
  id: string;
  name: string;
  segmento: string | null;
  estado_campana: string;
  total_segmento: number;
  enviados: number;
  pendientes: number;
  recibidos: number;
  no_recibidos: number;
  rebotados: number;
  no_salieron: number;
  entregas_confirmadas: number;
  abiertos: number;
  respondidos: number;
  clics: number;
  clientes: number;
  facturacion: number;
  start_date: string | null;
  end_date: string | null;
}

export interface CampaignSeriesPoint {
  fecha: string;
  enviados: number;
  abiertos: number;
  clics: number;
  rebotados: number;
  respondidos: number;
}

export interface CampaignDetalle {
  id: string;
  name: string;
  segmento: string | null;
  total_segmento: number;
  enviados: number;
  pendientes: number;
  ritmo_dia: number;
  dias_restantes: number;
  fecha_estimada: string | null;
  series: CampaignSeriesPoint[];
}

export interface FinanzasGerencial {
  cartera: number;
  cartera_facturas: number;
  recaudo_mes: number;
  facturacion_acumulada: number;
  facturado_mes: number;
}

export interface CarteraCliente {
  cliente: string;
  d0_30: number;
  d31_60: number;
  d61_90: number;
  mas90: number;
  total: number;
  dias_max: number;
}

export interface CarteraEdades {
  clientes: CarteraCliente[];
  totales: Omit<CarteraCliente, 'cliente' | 'dias_max'>;
}

export interface ObligacionCelda {
  fecha: string;
  periodo: string;
  dias: number;
  semaforo: 'vencida' | 'proxima' | 'al_dia';
}

export interface ObligacionesFila {
  cliente: string;
  obligaciones: Record<string, ObligacionCelda>;
}

export interface ProspectoActivo {
  id: string;
  razon_social: string;
  nit: string;
  telefono: string | null;
  etapa: string;
  dias_en_etapa: number;
  ultima_accion: string | null;
  ultima_nota: string | null;
  fecha_evento: string;
  asesor: string | null;
}

export interface AsesorControl {
  user_id: string;
  email: string | null;
  full_name: string | null;
  sesiones: number;
  horas: number;
  promedio_min: number;
  seguimientos: number;
  clientes: number;
  recibos: number;
  fidelizados: number;
  con_mora: number;
  cartera: number;
}

export async function getCampaigns(archived = false): Promise<CampaignRow[]> {
  const { data } = await api.get<CampaignRow[]>('/dashboard/gerencial/campanas', {
    params: { archived },
  });
  return data;
}

export async function getCampaignDetalle(id: string): Promise<CampaignDetalle> {
  const { data } = await api.get<CampaignDetalle>(`/dashboard/gerencial/campanas/${id}`);
  return data;
}

export async function getFinanzas(): Promise<FinanzasGerencial> {
  const { data } = await api.get<FinanzasGerencial>('/dashboard/gerencial/finanzas');
  return data;
}

export async function getCarteraEdades(): Promise<CarteraEdades> {
  const { data } = await api.get<CarteraEdades>('/dashboard/gerencial/cartera');
  return data;
}

export async function getObligaciones(): Promise<ObligacionesFila[]> {
  const { data } = await api.get<ObligacionesFila[]>('/dashboard/gerencial/obligaciones');
  return data;
}

export async function getProspectosActivos(): Promise<ProspectoActivo[]> {
  const { data } = await api.get<ProspectoActivo[]>('/dashboard/gerencial/prospectos');
  return data;
}

export async function getAsesores(days = 30): Promise<AsesorControl[]> {
  const { data } = await api.get<AsesorControl[]>('/dashboard/gerencial/asesores', {
    params: { days },
  });
  return data;
}
