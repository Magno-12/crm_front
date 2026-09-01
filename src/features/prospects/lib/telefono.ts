/**
 * Teléfonos de la base de mercadeo.
 *
 * Los números llegan del RUES a diez dígitos y sin indicativo: los celulares
 * empiezan por 3 y los fijos por 60x (el formato colombiano vigente). Para
 * marcar o abrir WhatsApp hay que anteponerles el +57.
 */

const INDICATIVO = '57';

/** Deja solo los dígitos; la base a veces trae espacios o guiones. */
function soloDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '');
}

/** Un celular colombiano: diez dígitos que empiezan por 3. */
export function esCelular(valor: string | null | undefined): boolean {
  const d = soloDigitos(valor);
  return d.length === 10 && d.startsWith('3');
}

/** Número listo para marcar, con indicativo de país. */
export function paraMarcar(valor: string | null | undefined): string | null {
  const d = soloDigitos(valor);
  if (d.length < 7) return null;
  return d.startsWith(INDICATIVO) && d.length > 10 ? `+${d}` : `+${INDICATIVO}${d}`;
}

/** Enlace de WhatsApp. Solo para celulares: a un fijo no llega. */
export function enlaceWhatsapp(valor: string | null | undefined): string | null {
  if (!esCelular(valor)) return null;
  return `https://wa.me/${INDICATIVO}${soloDigitos(valor)}`;
}

/** Formato legible: 310 517 8947 / (602) 381 6003. */
export function formatearTelefono(valor: string | null | undefined): string | null {
  const d = soloDigitos(valor);
  if (!d) return null;
  if (esCelular(valor)) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6)}`;
  return valor ?? null;
}
