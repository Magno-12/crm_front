import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/table-skeleton';
import {
  getClientesFacturables,
  type ClienteFacturable,
} from '@/features/clients/api/facturables.api';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCOP } from '@/lib/utils';

/** Listado de clientes con contrato, por donde arrancan Facturación y Recibos.
 *
 * `soloConSaldo` deja únicamente a los que tienen facturas pendientes, que es
 * lo que hace falta para registrar un recibo de caja.
 */
export function ClientesConContrato({
  soloConSaldo = false,
  titulo,
  descripcion,
  accion,
  onSeleccionar,
}: {
  soloConSaldo?: boolean;
  titulo: string;
  descripcion: string;
  accion: string;
  onSeleccionar: (cliente: ClienteFacturable) => void;
}) {
  const [q, setQ] = useState('');
  const busqueda = useDebounce(q, 300);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clientes-facturables', busqueda, soloConSaldo],
    queryFn: () =>
      getClientesFacturables({
        q: busqueda || undefined,
        solo_con_saldo: soloConSaldo,
      }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {titulo}
        </CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre, NIT o cédula…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar cliente"
          />
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} columns={5} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={soloConSaldo ? 'Ningún cliente tiene facturas pendientes' : 'Sin clientes con contrato'}
            description={
              soloConSaldo
                ? 'Cuando quede una factura sin pagar, el cliente aparece aquí.'
                : 'Los clientes aparecen aquí cuando se fidelizan y se les registra el contrato.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>NIT / cédula</TableHead>
                <TableHead>Servicios contratados</TableHead>
                <TableHead className="text-right">
                  {soloConSaldo ? 'Saldo pendiente' : 'Valor mensual'}
                </TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => onSeleccionar(c)}
                  title={accion}
                >
                  <TableCell>
                    <div className="font-medium">{c.razon_social}</div>
                    {c.contrato_numero && (
                      <div className="text-xs text-muted-foreground">
                        Contrato {c.contrato_numero}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.nit}</TableCell>
                  <TableCell>
                    {c.servicios.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.servicios.map((s) => (
                          <Badge key={s} variant="secondary">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {soloConSaldo ? (
                      <>
                        {formatCOP(c.saldo)}
                        <div className="text-xs font-normal text-muted-foreground">
                          {c.facturas_pendientes} factura(s)
                        </div>
                      </>
                    ) : (
                      formatCOP(c.valor_mensual)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      {accion}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
