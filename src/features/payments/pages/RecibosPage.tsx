import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Receipt, Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  createPayment,
  deletePayment,
  getClientPending,
  listPayments,
  PAYMENT_METHOD_LABEL,
  type PaymentMethod,
  type PaymentRead,
} from '@/features/payments/api/payments.api';
import { listClients } from '@/features/clients/api/clients.api';
import { apiErrorMessage } from '@/api/client';
import { formatCOP, formatDate } from '@/lib/utils';

const METHODS: PaymentMethod[] = [
  'transferencia',
  'efectivo',
  'consignacion',
  'cheque',
  'tarjeta',
  'otro',
];

/** Registrar un recibo de caja: cliente, factura (opcional), valor y medio de pago. */
function PaymentFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('transferencia');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const clients = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => listClients({ page: 1, page_size: 100 }),
    enabled: open,
  });
  const pending = useQuery({
    queryKey: ['portfolio', 'client', clientId],
    queryFn: () => getClientPending(clientId),
    enabled: open && !!clientId,
  });

  // Al elegir una factura se propone su saldo como valor del recibo.
  useEffect(() => {
    if (!invoiceId) return;
    const f = pending.data?.find((p) => p.id === invoiceId);
    if (f) setAmount(String(Math.round(f.saldo)));
  }, [invoiceId, pending.data]);

  const mut = useMutation({
    mutationFn: () =>
      createPayment({
        client_id: clientId,
        invoice_id: invoiceId || null,
        payment_date: paymentDate || null,
        amount,
        method,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Recibo ${res.number} registrado`);
      onOpenChange(false);
      setClientId('');
      setInvoiceId('');
      setAmount('');
      setReference('');
      setNotes('');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !mut.isPending && onOpenChange(false)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo recibo de caja</DialogTitle>
          <DialogDescription>
            Registra el pago recibido. Si se aplica a una factura y cubre el saldo, la factura
            queda pagada automáticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Cliente</Label>
            <Select
              value={clientId}
              onValueChange={(v) => {
                setClientId(v);
                setInvoiceId('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.data?.items.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Factura (opcional)</Label>
            <Select value={invoiceId} onValueChange={setInvoiceId} disabled={!clientId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !clientId
                      ? 'Elige primero el cliente'
                      : pending.data && pending.data.length > 0
                        ? 'Selecciona la factura'
                        : 'Este cliente no tiene facturas pendientes'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {pending.data?.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.number} · saldo {formatCOP(f.saldo)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">Valor recibido</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Fecha del pago</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Medio de pago</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Referencia</Label>
            <Input
              placeholder="N° de transacción o cheque"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Observaciones</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button
            className="gap-1"
            disabled={mut.isPending}
            onClick={() => {
              if (!clientId) return toast.error('Selecciona el cliente');
              if (!amount || Number(amount) <= 0) return toast.error('Ingresa el valor recibido');
              mut.mutate();
            }}
          >
            {mut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Registrar recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RecibosPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PaymentRead | null>(null);
  const debouncedQ = useDebounce(q, 300);
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payments', { q: debouncedQ, page }],
    queryFn: () => listPayments({ q: debouncedQ || undefined, page, page_size: 20 }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Recibo anulado');
      setToDelete(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recibos de caja</h1>
          <p className="text-sm text-muted-foreground">
            Registro de los pagos recibidos de los clientes.
          </p>
        </div>
        <Can code="payments.create">
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo recibo
          </Button>
        </Can>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente o número de recibo…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="pl-9"
          aria-label="Buscar recibos"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title="Aún no hay recibos de caja"
          description="Registra el primer pago recibido de un cliente."
          action={
            <Can code="payments.create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" /> Nuevo recibo
              </Button>
            </Can>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recibo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Medio</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono font-medium">{p.number}</TableCell>
                  <TableCell className="font-medium">{p.client_name ?? '—'}</TableCell>
                  <TableCell>{formatDate(p.payment_date)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.invoice_number ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{PAYMENT_METHOD_LABEL[p.method]}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCOP(Number(p.amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Can code="payments.delete">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label="Anular recibo"
                        title="Anular recibo"
                        onClick={() => setToDelete(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Can>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {data && data.total > 20 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data.total} recibos</span>
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

      <PaymentFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && !del.isPending && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Anular el recibo?</DialogTitle>
            <DialogDescription>
              Se anulará el recibo{' '}
              <span className="font-medium text-foreground">{toDelete?.number}</span> de{' '}
              {toDelete?.client_name}. Si la factura estaba marcada como pagada, volverá a quedar
              pendiente por el saldo.
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
              Anular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
