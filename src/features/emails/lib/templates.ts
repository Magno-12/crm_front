// Diseños de correo HTML profesionales (firma contable).
// Cada diseño compone HTML email-safe (estilos inline, tablas) a partir de
// los textos editables. Las variables tipo $razon_social se conservan para
// personalizar al enviar; en la previsualización se reemplazan por ejemplos.

export interface TemplateFields {
  company: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  signature: string;
}

const TEAL = '#0d9488';
const DARK = '#111827';
const GRAY = '#6b7280';
const LINE = '#e5e7eb';

function paragraphs(text: string, color = '#374151'): string {
  return text
    .split(/\n\n+/)
    .filter((p) => p.trim() !== '')
    .map(
      (p) =>
        `<p style="margin:0 0 14px;color:${color};font-size:15px;line-height:1.65;">${p
          .trim()
          .replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

function button(label: string, url: string, bg = TEAL): string {
  if (!label.trim()) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;"><tr><td style="background:${bg};border-radius:8px;">
    <a href="${url || '#'}" style="display:inline-block;padding:12px 26px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">${label}</a>
  </td></tr></table>`;
}

function signatureBlock(text: string, color = GRAY): string {
  if (!text.trim()) return '';
  return `<p style="margin:26px 0 0;color:${color};font-size:14px;line-height:1.6;">${text
    .trim()
    .replace(/\n/g, '<br>')}</p>`;
}

export interface EmailDesign {
  id: string;
  name: string;
  description: string;
  render: (f: TemplateFields) => string;
}

export const DESIGNS: EmailDesign[] = [
  {
    id: 'corporativo',
    name: 'Corporativo',
    description: 'Encabezado con color, botón y pie. Ideal para comunicados.',
    render: (f) => `
<div style="background:#f4f5f7;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
    <tr><td style="background:${TEAL};padding:22px 32px;">
      <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:.3px;">${f.company}</span>
    </td></tr>
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 18px;color:${DARK};font-size:22px;line-height:1.3;">${f.title}</h1>
      ${paragraphs(f.body)}
      ${button(f.ctaLabel, f.ctaUrl)}
      ${signatureBlock(f.signature)}
    </td></tr>
    <tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid ${LINE};color:#9ca3af;font-size:12px;text-align:center;">
      ${f.company} · Mensaje enviado por nuestro equipo contable.
    </td></tr>
  </table>
</div>`,
  },
  {
    id: 'minimalista',
    name: 'Minimalista',
    description: 'Sobrio y elegante, tipografía serif. Tono cercano y formal.',
    render: (f) => `
<div style="background:#ffffff;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-top:4px solid ${TEAL};">
    <tr><td style="padding:30px 10px;">
      <p style="color:${TEAL};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;">${f.company}</p>
      <h1 style="margin:0 0 18px;color:${DARK};font-size:25px;font-weight:normal;line-height:1.3;">${f.title}</h1>
      ${paragraphs(f.body, '#1f2937')}
      ${button(f.ctaLabel, f.ctaUrl)}
      ${signatureBlock(f.signature, '#374151')}
    </td></tr>
    <tr><td style="padding:18px 10px;border-top:1px solid ${LINE};color:#9ca3af;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
      ${f.company}
    </td></tr>
  </table>
</div>`,
  },
  {
    id: 'boletin',
    name: 'Boletín',
    description: 'Con recuadro destacado. Perfecto para novedades o promociones.',
    render: (f) => `
<div style="background:#eef2f3;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${LINE};">
    <tr><td style="padding:26px 32px 10px;text-align:center;">
      <span style="color:${TEAL};font-size:16px;font-weight:bold;letter-spacing:.3px;">${f.company}</span>
    </td></tr>
    <tr><td style="padding:6px 32px 0;">
      <div style="background:#f0fdfa;border-left:4px solid ${TEAL};border-radius:0 8px 8px 0;padding:18px 20px;margin:0 0 22px;">
        <h1 style="margin:0;color:#0f766e;font-size:21px;line-height:1.3;">${f.title}</h1>
      </div>
      ${paragraphs(f.body)}
      ${button(f.ctaLabel, f.ctaUrl)}
      ${signatureBlock(f.signature)}
    </td></tr>
    <tr><td style="background:#0f766e;padding:16px 32px;color:#d1fae5;font-size:12px;text-align:center;">
      ${f.company} · Asesoría contable y tributaria
    </td></tr>
  </table>
</div>`,
  },
  {
    id: 'recordatorio',
    name: 'Recordatorio tributario',
    description: 'Aviso con fecha/vencimiento destacado. Para alertas y obligaciones.',
    render: (f) => `
<div style="background:#fffbeb;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #fde68a;border-radius:14px;overflow:hidden;">
    <tr><td style="background:#b45309;padding:18px 32px;">
      <span style="color:#ffffff;font-size:16px;font-weight:bold;">⏰ ${f.company}</span>
    </td></tr>
    <tr><td style="padding:30px 32px;">
      <h1 style="margin:0 0 16px;color:#92400e;font-size:22px;line-height:1.3;">${f.title}</h1>
      ${paragraphs(f.body)}
      ${button(f.ctaLabel, f.ctaUrl, '#b45309')}
      ${signatureBlock(f.signature)}
    </td></tr>
    <tr><td style="background:#fffbeb;padding:16px 32px;border-top:1px solid #fde68a;color:#a16207;font-size:12px;text-align:center;">
      ${f.company} · Este es un recordatorio informativo.
    </td></tr>
  </table>
</div>`,
  },
];

export const DEFAULT_FIELDS: TemplateFields = {
  company: 'Proyectamos Asesoría Integral S.A.S.',
  title: 'Información importante para su empresa',
  body:
    'Estimado(a) $razon_social,\n\nDesde nuestro equipo contable queremos compartirle información relevante para su gestión tributaria y financiera.\n\nQuedamos atentos a cualquier inquietud.',
  ctaLabel: 'Agendar una reunión',
  ctaUrl: 'https://',
  signature: 'Cordialmente,\nEquipo Proyectamos Asesoría Integral',
};

// Valores de ejemplo para la previsualización (no se guardan).
const SAMPLE: Record<string, string> = {
  razon_social: 'Inversiones El Roble S.A.S.',
  nit: '900.123.456-7',
  ciudad: 'Cali',
  representante_legal: 'Carlos Gómez',
  contacto_nombre: 'Ana Torres',
};

/** Reemplaza $tokens por ejemplos para mostrar la previsualización. */
export function withSampleData(html: string): string {
  return html.replace(/\$(\w+)/g, (m, key: string) => SAMPLE[key] ?? m);
}

/** Detecta las variables $token usadas en el HTML. */
export function detectVariables(html: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(/\$(\w+)/g)) {
    if (match[1]) found.add(match[1]);
  }
  return [...found];
}
