import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ImageOff, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorMessage } from '@/api/client';
import {
  deleteSiteImage,
  siteImageUrl,
  uploadSiteImage,
  type SiteImageSlot,
} from '@/features/site/api/site.api';

const TIPOS = 'image/png,image/jpeg,image/webp';

/** Una imagen suelta del sitio (el logo, la foto de la dirección). */
export function SiteImageSlotCard({
  slot,
  puedeEditar,
}: {
  slot: SiteImageSlot;
  puedeEditar: boolean;
}) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  // Cambia al subir o borrar para que el navegador vuelva a pedir la imagen.
  const [version, setVersion] = useState(() => Date.now());
  const [cargada, setCargada] = useState(true);

  const refrescar = () => {
    setVersion(Date.now());
    setCargada(true);
    void queryClient.invalidateQueries({ queryKey: ['site-content'] });
  };

  const subir = useMutation({
    mutationFn: (file: File) => uploadSiteImage(slot.clave, file),
    onSuccess: (r) => {
      refrescar();
      toast.success(r.mensaje);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const quitar = useMutation({
    mutationFn: () => deleteSiteImage(slot.clave),
    onSuccess: () => {
      refrescar();
      setCargada(false);
      toast.success('Imagen quitada. Falta publicar para que se vea en el sitio.');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Card className="p-4">
      <p className="text-sm font-medium">{slot.etiqueta}</p>
      {slot.ayuda && <p className="mt-1 text-xs text-muted-foreground">{slot.ayuda}</p>}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {cargada ? (
            <img
              src={siteImageUrl(slot.clave, version)}
              alt={slot.etiqueta}
              className="h-full w-full object-contain"
              onError={() => setCargada(false)}
            />
          ) : (
            <ImageOff className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        {puedeEditar && (
          <div className="flex flex-col gap-2">
            <input
              ref={input}
              type="file"
              accept={TIPOS}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) subir.mutate(file);
                e.target.value = '';
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => input.current?.click()}
              disabled={subir.isPending}
            >
              <Upload className="h-4 w-4" />
              {subir.isPending ? 'Subiendo…' : cargada ? 'Reemplazar' : 'Subir imagen'}
            </Button>
            {cargada && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => quitar.mutate()}
                disabled={quitar.isPending}
              >
                Quitar
              </Button>
            )}
            <p className="text-xs text-muted-foreground">PNG, JPG o WEBP, hasta 8 MB.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
