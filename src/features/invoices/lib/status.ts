type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive';

export const INVOICE_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  borrador: { label: 'Borrador', variant: 'secondary' },
  emitida: { label: 'Emitida', variant: 'default' },
  pagada: { label: 'Pagada', variant: 'success' },
  anulada: { label: 'Anulada', variant: 'destructive' },
};

export const INVOICE_STATUSES = ['borrador', 'emitida', 'pagada', 'anulada'] as const;

export function invoiceStatusMeta(status: string) {
  return (
    INVOICE_STATUS_META[status] ?? { label: status, variant: 'secondary' as BadgeVariant }
  );
}
