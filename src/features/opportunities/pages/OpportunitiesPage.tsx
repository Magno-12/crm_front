import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState } from '@/components/common/states';
import { CardGridSkeleton } from '@/components/common/table-skeleton';
import { Can } from '@/components/auth/Can';
import { useCan } from '@/features/auth/hooks/useAuth';
import { listKanban, moveStage } from '@/features/opportunities/api/opportunities.api';
import { STAGES } from '@/features/opportunities/lib/stages';
import { OpportunityFormDialog } from '@/features/opportunities/components/OpportunityFormDialog';
import { apiErrorMessage } from '@/api/client';
import { cn, formatCOP } from '@/lib/utils';
import type { OpportunityRead, OpportunityStage } from '@/types/api';

export function OpportunitiesPage() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const canMove = useCan('opportunities.move_stage');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['opportunities', 'kanban'],
    queryFn: listKanban,
  });

  const move = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: OpportunityStage }) => moveStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const id = String(active.id);
    const targetStage = String(over.id) as OpportunityStage;
    const currentStage = active.data.current?.stage as string | undefined;
    if (targetStage && targetStage !== currentStage) {
      move.mutate({ id, stage: targetStage });
    }
  };

  const hasAny = data && Object.values(data.columns).some((col) => col.length > 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Oportunidades</h1>
          <p className="text-sm text-muted-foreground">Arrastra las tarjetas entre etapas.</p>
        </div>
        <Can code="opportunities.create">
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva oportunidad
          </Button>
        </Can>
      </header>

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !hasAny ? (
        <EmptyState
          icon={<Target />}
          title="Sin oportunidades"
          description="Crea la primera oportunidad para empezar a gestionar tu pipeline."
          action={
            <Can code="opportunities.create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" /> Nueva oportunidad
              </Button>
            </Can>
          }
        />
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <Column
                key={stage.key}
                stageKey={stage.key}
                label={stage.label}
                items={data?.columns[stage.key] ?? []}
                draggable={canMove}
              />
            ))}
          </div>
        </DndContext>
      )}

      <OpportunityFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

function Column({
  stageKey,
  label,
  items,
  draggable,
}: {
  stageKey: string;
  label: string;
  items: OpportunityRead[];
  draggable: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  const total = items.reduce((sum, o) => sum + Number(o.valor_mensual), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors',
        isOver && 'ring-2 ring-primary',
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">{formatCOP(total)}</span>
      </div>
      <div className="flex-1 space-y-2 p-2">
        {items.map((o) => (
          <OpportunityCard key={o.id} opportunity={o} stageKey={stageKey} draggable={draggable} />
        ))}
        {items.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">Vacío</p>
        )}
      </div>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  stageKey,
  draggable,
}: {
  opportunity: OpportunityRead;
  stageKey: string;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
    data: { stage: stageKey },
    disabled: !draggable,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab touch-none p-3 shadow-sm active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
      {...listeners}
      {...attributes}
    >
      <p className="text-sm font-semibold">{formatCOP(Number(opportunity.valor_mensual))}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Probabilidad: {opportunity.probabilidad}%
      </p>
      {opportunity.fecha_estimada_cierre && (
        <p className="text-xs text-muted-foreground">Cierre: {opportunity.fecha_estimada_cierre}</p>
      )}
    </Card>
  );
}
