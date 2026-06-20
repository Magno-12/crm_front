/**
 * Alias de tipos derivados del esquema OpenAPI generado.
 * NUNCA se tipan a mano: se generan con `npm run gen:api`.
 */
import type { components } from '@/api/generated/schema';

type Schemas = components['schemas'];

export type UserPublic = Schemas['UserPublic'];
export type TokenResponse = Schemas['TokenResponse'];

export type UserRead = Schemas['UserRead'];
export type UserCreate = Schemas['UserCreate'];
export type UserCreatedResponse = Schemas['UserCreatedResponse'];
export type RoleRead = Schemas['RoleRead'];
export type RoleCreate = Schemas['RoleCreate'];
export type PermissionRead = Schemas['PermissionRead'];
export type AuditRead = Schemas['AuditRead'];
export type TempPasswordResponse = Schemas['TempPasswordResponse'];

export type ProspectRead = Schemas['ProspectRead'];
export type ProspectCreate = Schemas['ProspectCreate'];
export type ProspectUpdate = Schemas['ProspectUpdate'];
export type ProspectStatus = Schemas['ProspectStatus'];
export type ProspectSegment = Schemas['ProspectSegment'];
export type FollowUpRead = Schemas['FollowUpRead'];
export type FollowUpCreate = Schemas['FollowUpCreate'];
export type FollowUpType = Schemas['FollowUpType'];
export type ImportResult = Schemas['ImportResult'];

export type OpportunityRead = Schemas['OpportunityRead'];
export type OpportunityCreate = Schemas['OpportunityCreate'];
export type OpportunityStage = Schemas['OpportunityStage'];

export type ClientRead = Schemas['ClientRead'];
export type ClientCreate = Schemas['ClientCreate'];
export type ClientServiceRead = Schemas['ClientServiceRead'];
export type ClientServiceCreate = Schemas['ClientServiceCreate'];

export type ServiceRead = Schemas['ServiceRead'];
export type ServiceCreate = Schemas['ServiceCreate'];

export type EmailTemplateRead = Schemas['EmailTemplateRead'];
export type EmailTemplateCreate = Schemas['EmailTemplateCreate'];
export type EmailSendRequest = Schemas['EmailSendRequest'];
export type EmailSendResult = Schemas['EmailSendResult'];

export type Kpi = Schemas['Kpi'];
export type KpisResponse = Schemas['KpisResponse'];

/** Paginación genérica (el backend devuelve este envoltorio). */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

/** Punto genérico {name, value} para charts. */
export interface NamedValue {
  name: string;
  value: number;
  amount?: number;
}

export interface ConversionRow {
  advisor: string;
  prospects: number;
  won: number;
  conversion_rate: number;
}

export interface DashboardSummary {
  total_prospects: number;
  active_clients: number;
  open_opportunities: number;
  lost_prospects: number;
  avg_ticket: number;
}

export interface TrendPoint {
  name: string;
  nuevos: number;
  ganados: number;
}
