import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Briefcase, Search, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { Can } from '@/components/auth/Can';
import { useDebounce } from '@/hooks/useDebounce';
import { deleteClient, listClients } from '@/features/clients/api/clients.api';
import { apiErrorMessage } from '@/api/client';
import { formatCOP, formatDate } from '@/lib/utils';
import type { ClientRead } from '@/types/api';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  activo: 'success',
  suspendido: 'warning',
  retirado: 'destructive',
};

export function ClientsPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<ClientRead | null>(null);
  const debouncedQ = useDebounce(q, 300);
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clients', { q: debouncedQ, page }],
    queryFn: () => listClients({ q: debouncedQ || undefined, page, page_size: 20 }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente eliminado');
      setToDelete(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Clientes fidelizados</h1>
        <p className="text-sm text-muted-foreground">Clientes activos y fidelizados de la firma.</p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por razón social o NIT…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="pl-9"
          aria-label="Buscar clientes"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title="Aún no hay clientes"
          description="Los clientes se crean al convertir prospectos ganados."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón social</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Valor del servicio</TableHead>
                <TableHead>Fecha de fidelización</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.razon_social}</TableCell>
                  <TableCell className="text-muted-foreground">{c.nit}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[c.status] ?? 'secondary'}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCOP(
                      Number((c as { valor_servicio?: string | number }).valor_servicio ?? 0),
                    )}
                  </TableCell>
                  <TableCell>{formatDate(c.fecha_contrato)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/clients/${c.id}`}>Ver ficha</Link>
                      </Button>
                      <Can code="clients.delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label="Eliminar cliente"
                          title="Eliminar cliente"
                          onClick={() => setToDelete(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Can>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && !del.isPending && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente fidelizado?</DialogTitle>
            <DialogDescription>
              Se eliminará el cliente{' '}
              <span className="font-medium text-foreground">{toDelete?.razon_social}</span> con sus
              servicios contratados. El prospecto y su historial de correos y seguimientos se
              conservan en la base de mercadeo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={del.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="gap-1"
              disabled={del.isPending}
              onClick={() => toDelete && del.mutate(toDelete.id)}
            >
              {del.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
