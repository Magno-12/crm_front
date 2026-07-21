import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Plus, Search, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { Can } from '@/components/auth/Can';
import { useDebounce } from '@/hooks/useDebounce';
import { deleteInvoice, listInvoices, openInvoicePdf } from '@/features/invoices/api/invoices.api';
import type { InvoiceRead } from '@/types/api';
import {
  INVOICE_STATUSES,
  invoiceStatusMeta,
} from '@/features/invoices/lib/status';
import { InvoiceFormDialog } from '@/features/invoices/components/InvoiceFormDialog';
import { apiErrorMessage } from '@/api/client';
import { formatCOP, formatDate } from '@/lib/utils';

export function InvoicesPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<InvoiceRead | null>(null);
  const debouncedQ = useDebounce(q, 300);
  const qc = useQueryClient();

  const del = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Factura eliminada');
      setToDelete(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', { q: debouncedQ, status, page }],
    queryFn: () =>
      listInvoices({
        q: debouncedQ || undefined,
        status: status === 'all' ? undefined : status,
        page,
        page_size: 20,
      }),
  });

  const download = async (id: string, number: string) => {
    try {
      await openInvoicePdf(id, number);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
          <p className="text-sm text-muted-foreground">Genera y descarga facturas en PDF.</p>
        </div>
        <Can code="invoices.create">
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva factura
          </Button>
        </Can>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente o NIT…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="pl-9"
            aria-label="Buscar facturas"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-52" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {INVOICE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {invoiceStatusMeta(s).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} columns={5} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Aún no hay facturas"
          description="Crea la primera factura desde un prospecto o cliente."
          action={
            <Can code="invoices.create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" /> Nueva factura
              </Button>
            </Can>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((inv) => {
                const meta = invoiceStatusMeta(inv.status);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono font-medium">{inv.number}</TableCell>
                    <TableCell>
                      <div className="font-medium">{inv.bill_to_name}</div>
                      <div className="text-xs text-muted-foreground">{inv.bill_to_nit}</div>
                    </TableCell>
                    <TableCell>{formatDate(inv.issue_date)}</TableCell>
                    <TableCell className="font-semibold">{formatCOP(Number(inv.total))}</TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => download(inv.id, inv.number)}>
                          <Download className="h-4 w-4" /> Descargar
                        </Button>
                        <Can code="invoices.delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            aria-label="Eliminar factura"
                            title="Eliminar factura"
                            onClick={() => setToDelete(inv)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.total} factura{data.total !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_prev}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_next}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <InvoiceFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && !del.isPending && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar factura?</DialogTitle>
            <DialogDescription>
              Se eliminará la factura{' '}
              <span className="font-medium text-foreground">{toDelete?.number}</span> de{' '}
              {toDelete?.bill_to_name} con sus renglones. Esta acción no se puede deshacer.
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
