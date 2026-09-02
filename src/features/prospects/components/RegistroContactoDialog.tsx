import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateFollowUp } from '@/features/prospects/hooks/useProspects';
import { OUTCOMES } from '@/features/prospects/lib/followup';
import { formatearTelefono } from '@/features/prospects/lib/telefono';
import { apiErrorMessage } from '@/api/client';
import type { FollowUpOutcome, FollowUpType, ProspectRead } from '@/types/api';

/** Por dónde se hizo el contacto que se está registrando. */
export type CanalContacto = Extract<FollowUpType, 'LLAMADA' | 'WHATSAPP'>;

/**
 * Registra en qué quedó la llamada sin salir de la base de mercadeo.
 *
 * Se abre al marcar desde la lista: si el asesor tiene que entrar a la ficha
 * para dejar constancia, en una jornada de llamadas no lo hace y la base se
 * queda sin saber a quién ya se llamó.
 */
export function RegistroContactoDialog({
  prospecto,
  canal,
  onClose,
}: {
  prospecto: ProspectRead | null;
  canal: CanalContacto;
  onClose: () => void;
}) {
  const [resultado, setResultado] = useState<FollowUpOutcome | ''>('');
  const [nota, setNota] = useState('');
  const crear = useCreateFollowUp(prospecto?.id ?? '');

  // Cada prospecto arranca en blanco: no heredar el resultado del anterior.
  useEffect(() => {
    if (prospecto) {
      setResultado('');
      setNota('');
    }
  }, [prospecto]);

  if (!prospecto) return null;

  const numero = prospecto.telefono?.trim() || prospecto.telefono_fijo?.trim() || null;
  const mueveA = OUTCOMES.find((o) => o.value === resultado)?.mueve;

  const guardar = async () => {
    if (!resultado) return;
    const etiqueta = OUTCOMES.find((o) => o.value === resultado)?.label ?? resultado;
    try {
      await crear.mutateAsync({
        type: canal,
        // La nota es obligatoria en el backend; si el asesor no escribe nada
        // queda al menos el resultado, que es lo que se va a leer después.
        notes: nota.trim() || etiqueta,
        outcome: resultado,
      });
      toast.success(mueveA ? `Registrado · pasa a ${mueveA}` : 'Contacto registrado');
      onClose();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !crear.isPending && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {canal === 'WHATSAPP' ? (
              <MessageCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            ¿En qué quedó?
          </DialogTitle>
          <DialogDescription>
            {prospecto.razon_social}
            {numero ? ` · ${formatearTelefono(numero)}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs">Resultado</Label>
            {/* Botones y no una lista desplegable: en una jornada de llamadas
                se registra decenas de veces y cada clic de más cuenta. */}
            <div className="grid grid-cols-2 gap-1.5">
              {OUTCOMES.map((o) => (
                <Button
                  key={o.value}
                  type="button"
                  size="sm"
                  variant={resultado === o.value ? 'default' : 'outline'}
                  className="h-auto justify-start whitespace-normal py-1.5 text-left text-xs"
                  onClick={() => setResultado(o.value)}
                >
                  {o.label}
                </Button>
              ))}
            </div>
            {mueveA && (
              <p className="mt-2 text-xs text-muted-foreground">
                Al guardar, el prospecto pasa a <strong>{mueveA}</strong>.
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1 block text-xs">Nota (opcional)</Label>
            <Input
              placeholder="¿Qué le dijeron?"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && resultado && guardar()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={crear.isPending}>
            Ahora no
          </Button>
          <Button onClick={guardar} disabled={!resultado || crear.isPending}>
            {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
