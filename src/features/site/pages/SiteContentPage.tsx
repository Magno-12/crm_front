import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronRight, Globe, RotateCcw, Save, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState } from '@/components/common/states';
import { Skeleton } from '@/components/ui/skeleton';
import { Can } from '@/components/auth/Can';
import { useCan } from '@/features/auth/hooks/useAuth';
import { apiErrorMessage } from '@/api/client';
import { getSiteContent, publishSite, saveSiteContent } from '@/features/site/api/site.api';
import type { SiteField, SiteGroup } from '@/features/site/api/site.api';
import { SiteImageSlotCard } from '@/features/site/components/SiteImageSlotCard';
import { SiteCardsEditor } from '@/features/site/components/SiteCardsEditor';

const SITIO = 'https://www.proyectamosasesoria.net';

export function SiteContentPage() {
  const queryClient = useQueryClient();
  const puedeEditar = useCan('site.edit');
  const grupos = useQuery({ queryKey: ['site-content'], queryFn: getSiteContent });

  // Solo lo que el usuario tocó en esta pantalla, por clave.
  const [borrador, setBorrador] = useState<Record<string, string>>({});
  const [confirmarPublicar, setConfirmarPublicar] = useState(false);

  const campos = useMemo(
    () => (grupos.data ?? []).flatMap((g) => g.campos),
    [grupos.data],
  );

  const valorDe = (campo: SiteField) => borrador[campo.clave] ?? campo.valor;
  const cambiado = (campo: SiteField) => valorDe(campo) !== campo.valor;
  const sinGuardar = campos.filter(cambiado);
  const yaEditados = campos.filter((c) => c.editado);

  const guardar = useMutation({
    mutationFn: () => {
      const cambios: Record<string, string> = {};
      for (const campo of sinGuardar) cambios[campo.clave] = valorDe(campo);
      return saveSiteContent(cambios);
    },
    onSuccess: (r) => {
      setBorrador({});
      void queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast.success(r.mensaje);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const publicar = useMutation({
    mutationFn: publishSite,
    onSuccess: (r) => {
      setConfirmarPublicar(false);
      toast.success(r.detalle);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const escribir = (clave: string, valor: string) =>
    setBorrador((b) => ({ ...b, [clave]: valor }));

  const renderCampos = (lista: SiteField[]) => (
    <div className="grid gap-5 md:grid-cols-2">
      {lista.map((campo) => {
        const valor = valorDe(campo);
        const tocado = cambiado(campo);
        return (
          <div key={campo.clave} className={campo.multilinea ? 'md:col-span-2' : undefined}>
            <div className="mb-1.5 flex items-center gap-2">
              <Label htmlFor={campo.clave}>{campo.etiqueta}</Label>
              {tocado && <Badge variant="secondary">sin guardar</Badge>}
              {!tocado && campo.editado && <Badge variant="outline">editado</Badge>}
              {valor !== campo.original && puedeEditar && (
                <button
                  type="button"
                  onClick={() => escribir(campo.clave, campo.original)}
                  className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  title="Volver al texto con el que venía la página"
                >
                  <RotateCcw className="h-3 w-3" /> Texto original
                </button>
              )}
            </div>
            {campo.multilinea ? (
              <textarea
                id={campo.clave}
                rows={Math.min(8, Math.max(3, Math.ceil(valor.length / 90)))}
                value={valor}
                disabled={!puedeEditar}
                onChange={(e) => escribir(campo.clave, e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
            ) : (
              <Input
                id={campo.clave}
                value={valor}
                disabled={!puedeEditar}
                onChange={(e) => escribir(campo.clave, e.target.value)}
              />
            )}
            {campo.ayuda && (
              <p className="mt-1 text-xs text-muted-foreground">{campo.ayuda}</p>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderGrupo = (grupo: SiteGroup) => {
    const sueltos = grupo.campos.filter((c) => !c.subgrupo);
    // Una imagen que pertenece a un bloque se muestra dentro de ese bloque, al
    // lado de sus textos; las demás van arriba, sueltas.
    const imagenesSueltas = grupo.imagenes.filter((i) => !i.subgrupo);
    return (
      <Card key={grupo.grupo} className="p-5">
        <h2 className="mb-4 text-lg font-semibold">{grupo.titulo}</h2>

        {sueltos.length > 0 && renderCampos(sueltos)}

        {imagenesSueltas.length > 0 && (
          <div className={`grid gap-4 md:grid-cols-2 ${sueltos.length ? 'mt-5' : ''}`}>
            {imagenesSueltas.map((slot) => (
              <SiteImageSlotCard key={slot.clave} slot={slot} puedeEditar={puedeEditar} />
            ))}
          </div>
        )}

        {grupo.coleccion && (
          <div className={sueltos.length || grupo.imagenes.length ? 'mt-6' : ''}>
            <SiteCardsEditor coleccion={grupo.coleccion} puedeEditar={puedeEditar} />
          </div>
        )}

        {/* Los nueve servicios van plegados: son más de cien textos y abiertos
            de golpe no habría forma de encontrar nada. */}
        {grupo.subgrupos.map((sub) => {
          const delSub = grupo.campos.filter((c) => c.subgrupo === sub);
          const tocados = delSub.filter(cambiado).length;
          const editados = delSub.filter((c) => c.editado).length;
          return (
            <details key={sub} className="group mt-3 rounded-md border">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/50">
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                {sub}
                <span className="text-xs font-normal text-muted-foreground">
                  {delSub.length} textos
                </span>
                {tocados > 0 && <Badge variant="secondary">{tocados} sin guardar</Badge>}
                {tocados === 0 && editados > 0 && (
                  <Badge variant="outline">{editados} editados</Badge>
                )}
              </summary>
              <div className="space-y-5 border-t p-4">
                {grupo.imagenes
                  .filter((i) => i.subgrupo === sub)
                  .map((slot) => (
                    <SiteImageSlotCard key={slot.clave} slot={slot} puedeEditar={puedeEditar} />
                  ))}
                {renderCampos(delSub)}
              </div>
            </details>
          );
        })}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Página web</h1>
          <p className="text-sm text-muted-foreground">
            Textos e imágenes de{' '}
            <a
              href={SITIO}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              proyectamosasesoria.net
            </a>
            . El diseño no cambia: solo lo que dice y lo que muestra cada bloque.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Can code="site.edit">
            <Button
              onClick={() => guardar.mutate()}
              disabled={sinGuardar.length === 0 || guardar.isPending}
            >
              <Save className="h-4 w-4" />
              {sinGuardar.length > 0 ? `Guardar (${sinGuardar.length})` : 'Guardar'}
            </Button>
          </Can>
          <Can code="site.publish">
            <Button
              variant="outline"
              onClick={() => setConfirmarPublicar(true)}
              disabled={publicar.isPending}
            >
              <UploadCloud className="h-4 w-4" /> Publicar
            </Button>
          </Can>
        </div>
      </header>

      <Card className="border-dashed p-4 text-sm text-muted-foreground">
        Guardar deja el cambio listo en el CRM; <strong>publicar</strong> es lo que lo saca al
        aire, y la página tarda uno o dos minutos en actualizarse. Las fotos y las fichas se
        guardan una por una, con su propio botón.
        {yaEditados.length > 0 && (
          <> Hay {yaEditados.length} texto{yaEditados.length === 1 ? '' : 's'} ya guardado
            {yaEditados.length === 1 ? '' : 's'}.</>
        )}
      </Card>

      {grupos.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : grupos.error ? (
        <ErrorState error={grupos.error} onRetry={() => grupos.refetch()} />
      ) : (
        (grupos.data ?? []).map(renderGrupo)
      )}

      <Dialog open={confirmarPublicar} onOpenChange={setConfirmarPublicar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar la página</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Se va a reconstruir la página con lo que esté guardado. Los cambios quedan
              visibles para cualquiera en uno o dos minutos.
            </p>
            {sinGuardar.length > 0 && (
              <p className="font-medium text-foreground">
                Ojo: tiene {sinGuardar.length} cambio{sinGuardar.length === 1 ? '' : 's'} sin
                guardar. Lo que no esté guardado no se publica.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarPublicar(false)}>
              Cancelar
            </Button>
            <Button onClick={() => publicar.mutate()} disabled={publicar.isPending}>
              <Globe className="h-4 w-4" />
              {publicar.isPending ? 'Publicando…' : 'Sí, publicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
