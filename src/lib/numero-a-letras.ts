const UNIDADES: readonly string[] = [
  '',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
];
const DECENAS: readonly string[] = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS: readonly string[] = [
  '',
  'ciento',
  'doscientos',
  'trescientos',
  'cuatrocientos',
  'quinientos',
  'seiscientos',
  'setecientos',
  'ochocientos',
  'novecientos',
];

function hasta999(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (c > 0) partes.push(CENTENAS[c] ?? '');
  if (resto > 0) {
    if (resto <= 20) {
      partes.push(UNIDADES[resto] ?? '');
    } else if (resto < 30) {
      partes.push(`veinti${UNIDADES[resto - 20] ?? ''}`);
    } else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      partes.push(u > 0 ? `${DECENAS[d] ?? ''} y ${UNIDADES[u] ?? ''}` : (DECENAS[d] ?? ''));
    }
  }
  return partes.join(' ');
}

/** Escribe un valor en pesos, en letras. Se usa en contratos y facturas. */
export function numeroALetras(valor: number): string {
  const n = Math.floor(Math.abs(valor));
  if (n === 0) return 'cero pesos';

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];

  if (millones > 0) {
    partes.push(millones === 1 ? 'un millón' : `${hasta999(millones)} millones`);
  }
  if (miles > 0) {
    partes.push(miles === 1 ? 'mil' : `${hasta999(miles)} mil`);
  }
  if (resto > 0) partes.push(hasta999(resto));

  const texto = partes.join(' ').replace(/\s+/g, ' ').trim();
  return `${texto} pesos`;
}
