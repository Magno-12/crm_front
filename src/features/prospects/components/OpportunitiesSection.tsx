import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/states';
import { Can } from '@/components/auth/Can';
import {
  createOpportunity,
  listOpportunitiesByProspect,
} from '@/features/opportunities/api/opportunities.api';
import { STAGE_LABEL } from '@/features/opportunities/lib/stages';
import { apiErrorMessage } from '@/api/client';
import { formatCOP } from '@/lib/utils';

export function OpportunitiesSection({ prospectId }: { prospectId: string }) {
  const qc = useQueryClient();
  const [valor, setValor] = useState('');
  const [prob, setProb] = useState('50');

  const { data } = useQuery({
    queryKey: ['opportunities', 'by-prospect', prospectId],
    queryFn: () => listOpportunitiesByProspect(prospectId),
  });

  const create = useMutation({
    mutationFn: () =>
      createOpportunity({
        prospect_id: prospectId,
        service_id: null,
        valor_mensual: valor || '0',
        probabilidad: Number(prob) || 0,
        estado: 'calificacion',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities', 'by-prospect', prospectId] });
      setValor('');
      setProb('50');
      toast.success('Oportunidad agregada');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" /> Oportunidades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Can code="opportunities.create">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <Label className="mb-1 block text-xs">Valor mensual (COP)</Label>
              <Input
                type="number"
                min={0}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ej. 800000"
              />
            </div>
            <div className="sm:w-32">
              <Label className="mb-1 block text-xs">Probabilidad %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={prob}
                onChange={(e) => setProb(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={create.isPending}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </form>
        </Can>

        {!data || data.length === 0 ? (
          <EmptyState title="Sin oportunidades" description="Registra la primera oportunidad de venta." />
        ) : (
          <ul className="divide-y rounded-md border">
            {data.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <Badge variant="secondary">{STAGE_LABEL[o.estado] ?? o.estado}</Badge>
                <span className="flex-1 font-medium">{formatCOP(Number(o.valor_mensual))}/mes</span>
                <span className="text-muted-foreground">{o.probabilidad}%</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
