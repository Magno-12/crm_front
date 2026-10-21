import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ImageOff, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/states';
import { apiErrorMessage } from '@/api/client';
import {
  cardImageKey,
  createSiteCard,
  deleteSiteCard,
  deleteSiteImage,
  listSiteCards,
  siteImageUrl,
  updateSiteCard,
  uploadSiteImage,
  type SiteCard,
} from '@/features/site/api/site.api';

const TIPOS = 'image/png,image/jpeg,image/webp';

interface Textos {
  titulo: string;
  subtitulo: string;
  texto: string;
}

interface Etiquetas extends Textos {
  nuevo: string;
  vacio: string;
  conSubtitulo: boolean;
}

/** Cómo se llama cada campo según la colección: no es lo mismo un directivo que una foto. */
const EQUIPO: Etiquetas = {
  titulo: 'Nombre',
  subtitulo: 'Cargo',
  texto: 'Perfil',
  nuevo: 'Agregar persona',
  vacio: 'Sin personas cargadas: la sección no se publica hasta que agregue la primera.',
  conSubtitulo: true,
};

const GALERIA: Etiquetas = {
  titulo: 'Pie de foto',
  subtitulo: '',
  texto: '',
  nuevo: 'Agregar foto',
  vacio: 'Sin fotos cargadas: la sección no se publica hasta que suba la primera.',
  conSubtitulo: false,
};

export function SiteCardsEditor({
  coleccion,
  puedeEditar,
}: {
  coleccion: string;
  puedeEditar: boolean;
}) {
  const queryClient = useQueryClient();
  const etiquetas: Etiquetas = coleccion === 'galeria' ? GALERIA : EQUIPO;
  const fichas = useQuery({
    queryKey: ['site-cards', coleccion],
    queryFn: () => listSiteCards(coleccion),
  });

  const refrescar = () => {
    void queryClient.invalidateQueries({ queryKey: ['site-cards', coleccion] });
  };

  const crear = useMutation({
    mutationFn: () => createSiteCard(coleccion, { titulo: '', subtitulo: '', texto: '' }),
    onSuccess: refrescar,
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const mover = useMutation({
    mutationFn: async ({ a, b }: { a: SiteCard; b: SiteCard }) => {
      await updateSiteCard(coleccion, a.id, { orden: b.orden });
      await updateSiteCard(coleccion, b.id, { orden: a.orden });
    },
    onSuccess: refrescar,
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (fichas.isLoading) return <Skeleton className="h-32 w-full" />;
  if (fichas.error) {
    return <ErrorState error={fichas.error} onRetry={() => fichas.refetch()} />;
  }

  const lista = fichas.data ?? [];

  return (
    <div className="space-y-3">
      {lista.length === 0 && (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          {etiquetas.vacio}
        </p>
      )}
      {lista.map((ficha, i) => (
        <FichaEditable
          key={ficha.id}
          coleccion={coleccion}
          ficha={ficha}
          etiquetas={etiquetas}
          puedeEditar={puedeEditar}
          onCambio={refrescar}
          onSubir={vecino(lista, i - 1, ficha, mover.mutate)}
          onBajar={vecino(lista, i + 1, ficha, mover.mutate)}
        />
      ))}
      {puedeEditar && (
        <Button variant="outline" onClick={() => crear.mutate()} disabled={crear.isPending}>
          <Plus className="h-4 w-4" /> {etiquetas.nuevo}
        </Button>
      )}
    </div>
  );
}

/** Devuelve el callback para intercambiar con el vecino, o nada si no hay. */
function vecino(
  lista: SiteCard[],
  indice: number,
  ficha: SiteCard,
  intercambiar: (par: { a: SiteCard; b: SiteCard }) => void,
): (() => void) | undefined {
  const otro = lista[indice];
  if (!otro) return undefined;
  return () => intercambiar({ a: ficha, b: otro });
}

function FichaEditable({
  coleccion,
  ficha,
  etiquetas,
  puedeEditar,
  onCambio,
  onSubir,
  onBajar,
}: {
  coleccion: string;
  ficha: SiteCard;
  etiquetas: Etiquetas;
  puedeEditar: boolean;
  onCambio: () => void;
  onSubir?: () => void;
  onBajar?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [borrador, setBorrador] = useState<Textos>({
    titulo: ficha.titulo,
    subtitulo: ficha.subtitulo,
    texto: ficha.texto,
  });
  const [version, setVersion] = useState(() => Date.now());
  const [tieneFoto, setTieneFoto] = useState(ficha.tiene_foto);
  const [confirmando, setConfirmando] = useState(false);

  const cambiado =
    borrador.titulo !== ficha.titulo ||
    borrador.subtitulo !== ficha.subtitulo ||
    borrador.texto !== ficha.texto;

  const guardar = useMutation({
    mutationFn: () => updateSiteCard(coleccion, ficha.id, borrador),
    onSuccess: () => {
      onCambio();
      toast.success('Ficha guardada. Falta publicar para que se vea en el sitio.');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const cambiarVisible = useMutation({
    mutationFn: (visible: boolean) => updateSiteCard(coleccion, ficha.id, { visible }),
    onSuccess: onCambio,
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const borrar = useMutation({
    mutationFn: () => deleteSiteCard(coleccion, ficha.id),
    onSuccess: () => {
      onCambio();
      toast.success('Ficha eliminada.');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const subirFoto = useMutation({
    mutationFn: (file: File) => uploadSiteImage(cardImageKey(ficha.id), file),
    onSuccess: () => {
      setTieneFoto(true);
      setVersion(Date.now());
      onCambio();
      toast.success('Foto guardada. Falta publicar para que se vea en el sitio.');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const quitarFoto = useMutation({
    mutationFn: () => deleteSiteImage(cardImageKey(ficha.id)),
    onSuccess: () => {
      setTieneFoto(false);
      onCambio();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Card className={`p-4 ${ficha.visible ? '' : 'opacity-60'}`}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {tieneFoto ? (
              <img
                src={siteImageUrl(cardImageKey(ficha.id), version)}
                alt={borrador.titulo || 'Foto'}
                className="h-full w-full object-cover"
                onError={() => setTieneFoto(false)}
              />
            ) : (
              <ImageOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          {puedeEditar && (
            <>
              <input
                ref={input}
                type="file"
                accept={TIPOS}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) subirFoto.mutate(file);
                  e.target.value = '';
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => input.current?.click()}
                disabled={subirFoto.isPending}
              >
                <Upload className="h-3.5 w-3.5" />
                {subirFoto.isPending ? '…' : 'Foto'}
              </Button>
              {tieneFoto && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => quitarFoto.mutate()}
                >
                  Quitar foto
                </button>
              )}
            </>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor={`t-${ficha.id}`} className="mb-1.5 block">
                {etiquetas.titulo}
              </Label>
              <Input
                id={`t-${ficha.id}`}
                value={borrador.titulo}
                disabled={!puedeEditar}
                onChange={(e) => setBorrador((b) => ({ ...b, titulo: e.target.value }))}
              />
            </div>
            {etiquetas.conSubtitulo && (
              <div>
                <Label htmlFor={`s-${ficha.id}`} className="mb-1.5 block">
                  {etiquetas.subtitulo}
                </Label>
                <Input
                  id={`s-${ficha.id}`}
                  value={borrador.subtitulo}
                  disabled={!puedeEditar}
                  onChange={(e) => setBorrador((b) => ({ ...b, subtitulo: e.target.value }))}
                />
              </div>
            )}
          </div>
          {etiquetas.texto && (
            <div>
              <Label htmlFor={`p-${ficha.id}`} className="mb-1.5 block">
                {etiquetas.texto}
              </Label>
              <textarea
                id={`p-${ficha.id}`}
                rows={3}
                value={borrador.texto}
                disabled={!puedeEditar}
                onChange={(e) => setBorrador((b) => ({ ...b, texto: e.target.value }))}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
            </div>
          )}
          {puedeEditar && (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => guardar.mutate()} disabled={!cambiado || guardar.isPending}>
                Guardar ficha
              </Button>
              {onSubir && (
                <Button variant="ghost" size="sm" onClick={onSubir} title="Subir en el orden">
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
              {onBajar && (
                <Button variant="ghost" size="sm" onClick={onBajar} title="Bajar en el orden">
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}
              <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={ficha.visible}
                  onCheckedChange={(v) => cambiarVisible.mutate(v === true)}
                />
                Se publica
              </label>
              {confirmando ? (
                <span className="flex items-center gap-2 text-sm">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => borrar.mutate()}
                    disabled={borrar.isPending}
                  >
                    Sí, eliminar
                  </Button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setConfirmando(false)}
                  >
                    Cancelar
                  </button>
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmando(true)}
                  title="Eliminar la ficha"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
