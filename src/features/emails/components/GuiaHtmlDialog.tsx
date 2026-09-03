import { AlertTriangle, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Cómo debe venir un HTML para que sirva como plantilla de campaña.
 *
 * Vive dentro del CRM y no en un documento aparte: quien pega el HTML lo
 * necesita en ese momento, y un manual en otro lado no se abre.
 */
export function GuiaHtmlDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cómo debe ser el HTML de una campaña</DialogTitle>
          <DialogDescription>
            Un correo no es una página web: se abre en Gmail, Outlook y en el celular, y cada
            uno soporta cosas distintas. Estas son las reglas para que el diseño llegue igual
            a todos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <Paso n={1} titulo="Diseñe el afiche donde quiera y expórtelo a HTML">
            <p>
              Canva, Figma, Word o a mano: da igual. Lo único que importa es el archivo{' '}
              <Codigo>.html</Codigo> que salga de ahí. Lo que este CRM necesita es el{' '}
              <strong>contenido</strong>, no un archivo para descargar.
            </p>
          </Paso>

          <Paso n={2} titulo="Quítele la envoltura de página web">
            <p className="mb-2">
              Del archivo se copia <strong>solo lo que está dentro de</strong>{' '}
              <Codigo>&lt;body&gt;</Codigo>. Sobra —y hay que borrar— todo esto:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
              <li>
                <Codigo>&lt;!DOCTYPE&gt;</Codigo>, <Codigo>&lt;html&gt;</Codigo>,{' '}
                <Codigo>&lt;head&gt;</Codigo> y <Codigo>&lt;body&gt;</Codigo>
              </li>
              <li>
                el bloque <Codigo>&lt;style&gt;</Codigo> con las clases CSS
              </li>
              <li>
                cualquier <Codigo>&lt;script&gt;</Codigo>: los correos no ejecutan código y
                un correo con scripts se va derecho a spam
              </li>
            </ul>
          </Paso>

          <Paso n={3} titulo="Los estilos van pegados a cada etiqueta, no en clases">
            <p className="mb-2">
              Varios clientes de correo borran el <Codigo>&lt;style&gt;</Codigo> del
              encabezado. Si el diseño depende de clases, el correo llega sin formato.
            </p>
            <Comparacion
              malo={`<div class="titulo">Insolvencia</div>`}
              bueno={`<div style="font-size:22px;color:#1E3A8A;">Insolvencia</div>`}
            />
          </Paso>

          <Paso n={4} titulo="Arme la estructura con tablas, no con flex ni grid">
            <p className="mb-2">
              Outlook no entiende <Codigo>display:flex</Codigo> ni{' '}
              <Codigo>display:grid</Codigo>: las columnas se le apilan y el afiche se
              desarma. Las tablas las entienden todos.
            </p>
            <Comparacion
              malo={`<div style="display:grid;grid-template-columns:1fr 1fr">…`}
              bueno={`<table role="presentation" width="100%"><tr>
  <td width="50%">…</td><td width="50%">…</td>
</tr></table>`}
            />
          </Paso>

          <Paso n={5} titulo="Ancho fijo de 480 a 600 píxeles">
            <p>
              Más ancho que eso se corta en el celular. Use{' '}
              <Codigo>width="600" style="max-width:100%"</Codigo> en la tabla de afuera.
            </p>
          </Paso>

          <Paso n={6} titulo="Las imágenes deben estar publicadas en internet">
            <p className="mb-2">
              Una imagen pegada dentro del HTML (las que empiezan por{' '}
              <Codigo>data:image/…</Codigo>) hace el correo pesadísimo y muchos filtros lo
              marcan como spam. Súbala a un servidor y enlácela con su dirección completa.
            </p>
            <Comparacion
              malo={`<img src="data:image/png;base64,iVBORw0KG…">`}
              bueno={`<img src="https://susitio.com/afiche.png"
     width="600" alt="Insolvencia económica">`}
            />
            <p className="mt-2 text-muted-foreground">
              Siempre con <Codigo>alt</Codigo>: casi todos los clientes bloquean las
              imágenes al abrir, y ese texto es lo único que se ve al principio.
            </p>
          </Paso>

          <Paso n={7} titulo="Personalice con las variables del CRM">
            <p className="mb-2">
              Escriba el nombre de la variable con <Codigo>$</Codigo> adelante y el CRM la
              reemplaza por el dato de cada prospecto al enviar:
            </p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Variable</th>
                    <th className="px-3 py-2 text-left font-medium">Se reemplaza por</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['$razon_social', 'El nombre o razón social del prospecto'],
                    ['$nit', 'El NIT o la cédula'],
                    ['$ciudad', 'El municipio'],
                    ['$representante_legal', 'El representante legal'],
                    ['$contacto_nombre', 'La persona de contacto comercial'],
                    [
                      '$atencion',
                      'Para el «Att.:»: el contacto, o el representante legal, o «Representante Legal»',
                    ],
                  ].map(([v, d]) => (
                    <tr key={v} className="border-t">
                      <td className="px-3 py-1.5">
                        <Codigo>{v}</Codigo>
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-muted-foreground">
              Sirven también en el asunto. Si el prospecto no tiene ese dato, la variable
              queda vacía: no escriba frases que se rompan sin él.
            </p>
            <div className="mt-2 flex gap-2 rounded-md border border-warning/50 bg-warning/10 p-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-xs">
                Cuidado con los precios: <Codigo>$1.500.000</Codigo> está a salvo porque
                sigue un número, pero <Codigo>$total</Codigo> el CRM lo tomaría como
                variable y lo dejaría vacío.
              </p>
            </div>
          </Paso>

          <Paso n={8} titulo="No escriba el aviso de tratamiento de datos: lo pone el CRM">
            <p>
              Al final de cada correo el sistema agrega solo el aviso de privacidad de la
              Ley 1581 y el botón para darse de baja, con un enlace firmado para cada
              destinatario. Si lo escribe usted, el correo termina con el aviso repetido y
              el botón de baja del CRM es el único que funciona.
            </p>
          </Paso>

          <Paso n={9} titulo="Péguelo en el CRM y revise la vista previa">
            <p>
              En <strong>Correos → Nueva plantilla → HTML propio</strong>, pegue el
              contenido. La vista previa lo muestra con datos de ejemplo, tal como le va a
              llegar al prospecto. Revise ahí que no haya quedado ninguna variable sin
              reemplazar antes de guardar.
            </p>
          </Paso>

          <div className="rounded-md border bg-muted/30 p-3">
            <p className="mb-2 font-medium">Antes de enviar, verifique</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>· No quedó ningún <Codigo>&lt;style&gt;</Codigo>, <Codigo>&lt;head&gt;</Codigo> ni <Codigo>&lt;script&gt;</Codigo>.</li>
              <li>· No hay <Codigo>display:flex</Codigo> ni <Codigo>display:grid</Codigo>.</li>
              <li>· Todos los colores y tamaños están dentro de un <Codigo>style="…"</Codigo>.</li>
              <li>· Las imágenes tienen dirección completa (https://…) y su <Codigo>alt</Codigo>.</li>
              <li>· La vista previa se ve bien y no muestra variables sin reemplazar.</li>
              <li>· Se envió una prueba a un correo propio antes de lanzar la campaña.</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Paso({
  n,
  titulo,
  children,
}: {
  n: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-1.5 flex items-start gap-2 font-semibold">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {n}
        </span>
        {titulo}
      </h3>
      <div className="pl-7">{children}</div>
    </section>
  );
}

function Codigo({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{children}</code>
  );
}

/** El «así no / así sí», que es lo que de verdad se entiende. */
function Comparacion({ malo, bueno }: { malo: string; bueno: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2">
        <p className="mb-1 flex items-center gap-1 text-xs font-medium text-destructive">
          <X className="h-3.5 w-3.5" /> Así no
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10.5px] leading-relaxed">
          {malo}
        </pre>
      </div>
      <div className="rounded-md border border-success/40 bg-success/5 p-2">
        <p className="mb-1 flex items-center gap-1 text-xs font-medium text-success">
          <Check className="h-3.5 w-3.5" /> Así sí
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10.5px] leading-relaxed">
          {bueno}
        </pre>
      </div>
    </div>
  );
}
