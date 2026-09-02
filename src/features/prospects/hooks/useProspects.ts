import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ProspectFilters,
  assignProspect,
  convertToClient,
  createFollowUp,
  createProspect,
  deleteProspect,
  getProspect,
  importCooperativas,
  importProspects,
  purgeProspects,
  listFollowUps,
  listProspects,
  updateProspect,
} from '@/features/prospects/api/prospects.api';
import type { FollowUpCreate, ProspectCreate, ProspectUpdate } from '@/types/api';

const KEY = 'prospects';

export function useProspects(filters: ProspectFilters) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: () => listProspects(filters),
  });
}

export function useProspect(id: string) {
  return useQuery({ queryKey: [KEY, 'detail', id], queryFn: () => getProspect(id), enabled: !!id });
}

export function useCreateProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProspectCreate) => createProspect(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateProspect(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProspectUpdate) => updateProspect(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProspect(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAssignProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => assignProspect(id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useConvertToClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => convertToClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useImportProspects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, segmento }: { file: File; segmento?: string }) =>
      importProspects(file, segmento),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

/** Vacía la base de mercadeo (los clientes fidelizados se conservan). */
export function usePurgeProspects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: purgeProspects,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useImportCooperativas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importCooperativas(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useFollowUps(prospectId: string) {
  return useQuery({
    queryKey: [KEY, 'followups', prospectId],
    queryFn: () => listFollowUps(prospectId),
    enabled: !!prospectId,
  });
}

export function useCreateFollowUp(prospectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: FollowUpCreate) => createFollowUp(prospectId, body),
    // El resultado del seguimiento mueve el estado del prospecto, así que hay
    // que refrescar también las listas y la ficha, no solo el historial.
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
