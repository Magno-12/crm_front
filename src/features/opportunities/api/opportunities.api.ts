import { api } from '@/api/client';
import type { OpportunityCreate, OpportunityRead, OpportunityStage } from '@/types/api';

interface KanbanResponse {
  view: 'kanban';
  columns: Record<string, OpportunityRead[]>;
}
interface ListResponse {
  view: 'list';
  items: OpportunityRead[];
}

export async function listKanban(): Promise<KanbanResponse> {
  const { data } = await api.get<KanbanResponse>('/opportunities', { params: { view: 'kanban' } });
  return data;
}

export async function listOpportunities(): Promise<OpportunityRead[]> {
  const { data } = await api.get<ListResponse>('/opportunities', { params: { view: 'list' } });
  return data.items;
}

export async function listOpportunitiesByProspect(prospectId: string): Promise<OpportunityRead[]> {
  const { data } = await api.get<ListResponse>('/opportunities', {
    params: { view: 'list', prospect_id: prospectId },
  });
  return data.items;
}

export async function createOpportunity(body: OpportunityCreate): Promise<OpportunityRead> {
  const { data } = await api.post<OpportunityRead>('/opportunities', body);
  return data;
}

export async function moveStage(
  id: string,
  newStage: OpportunityStage,
): Promise<OpportunityRead> {
  const { data } = await api.patch<OpportunityRead>(`/opportunities/${id}/stage`, {
    new_stage: newStage,
  });
  return data;
}
