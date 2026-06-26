// Diseños de correo HTML profesionales y dinámicos (firma contable).
// Email-safe: tablas + estilos inline (compatibles con Gmail, Outlook, Apple Mail).
// Las variables $razon_social/$nit/etc. se conservan para personalizar al enviar;
// en la previsualización se reemplazan por ejemplos.

export interface TemplateFields {
  company: string;
  tagline: string;
  title: string;
  subtitle: string;
  body: string;
  highlight: string;
  points: string;
  ctaLabel: string;
  ctaUrl: string;
  signature: string;
  contact: string;
}

const TEAL = '#0d9488';
const TEAL_DARK = '#0f766e';
const TEAL_TINT = '#f0fdfa';
const TEAL_BORDER = '#99f6e4';
const INK = '#0f172a';
const TEXT = '#334155';
const MUTED = '#64748b';
const FAINT = '#94a3b8';
const LINE = '#e2e8f0';

function esc(s: string): string {
  return s;
}

function monogram(company: string): string {
  const words = company.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
  const a = words[0]?.[0] ?? 'C';
  const b = words[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

function paragraphs(text: string, color = TEXT): string {
  return text
    .split(/\n\n+/)
    .filter((p) => p.trim() !== '')
    .map(
      (p) =>
        `<p style="margin:0 0 14px;color:${color};font-size:15px;line-height:1.7;">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

function button(label: string, url: string, bg = TEAL): string {
  if (!label.trim()) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 2px;"><tr><td style="background:${bg};border-radius:10px;">
    <a href="${url || '#'}" style="display:inline-block;padding:14px 30px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;border-radius:10px;">${esc(label)} &nbsp;›</a>
  </td></tr></table>`;
}

function checkList(text: string, accent = TEAL): string {
  const items = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!items.length) return '';
  const rows = items
    .map(
      (it) =>
        `<tr><td valign="top" style="padding:5px 10px 5px 0;width:24px;">
          <span style="display:inline-block;width:20px;height:20px;background:${accent};border-radius:50%;color:#ffffff;text-align:center;line-height:20px;font-size:12px;font-weight:bold;">✓</span>
        </td><td valign="top" style="padding:5px 0;color:${TEXT};font-size:15px;line-height:1.5;">${esc(it)}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 18px;">${rows}</table>`;
}

function steps(text: string, accent = TEAL): string {
  const items = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!items.length) return '';
  const rows = items
    .map(
      (it, i) =>
        `<tr><td valign="top" style="padding:6px 12px 6px 0;width:30px;">
          <span style="display:inline-block;width:26px;height:26px;background:${accent};border-radius:50%;color:#ffffff;text-align:center;line-height:26px;font-size:13px;font-weight:bold;">${i + 1}</span>
        </td><td valign="top" style="padding:8px 0;color:${TEXT};font-size:15px;line-height:1.5;border-bottom:1px solid ${LINE};">${esc(it)}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 18px;">${rows}</table>`;
}

function highlightBox(text: string): string {
  if (!text.trim()) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:4px 0 20px;"><tr>
    <td style="background:${TEAL_TINT};border:1px solid ${TEAL_BORDER};border-radius:12px;padding:16px 20px;color:${TEAL_DARK};font-size:15px;line-height:1.6;font-weight:bold;">${esc(text)}</td>
  </tr></table>`;
}

function signatureBlock(text: string): string {
  if (!text.trim()) return '';
  return `<p style="margin:24px 0 0;color:${MUTED};font-size:14px;line-height:1.6;">${esc(text.trim()).replace(/\n/g, '<br>')}</p>`;
}

function header(company: string, tagline: string, bg: string, sub: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
    <td style="background:${bg};padding:22px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;">
          <div style="width:46px;height:46px;background:rgba(255,255,255,0.18);border-radius:12px;color:#ffffff;text-align:center;line-height:46px;font-size:18px;font-weight:bold;">${monogram(company)}</div>
        </td>
        <td>
          <div style="color:#ffffff;font-size:17px;font-weight:bold;line-height:1.2;">${esc(company)}</div>
          ${tagline ? `<div style="color:${sub};font-size:12px;letter-spacing:.3px;margin-top:2px;">${esc(tagline)}</div>` : ''}
        </td>
      </tr></table>
    </td>
  </tr></table>`;
}

function footer(company: string, contact: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
    <td style="background:#f8fafc;border-top:1px solid ${LINE};padding:20px 32px;text-align:center;">
      <div style="color:#475569;font-size:13px;font-weight:bold;">${esc(company)}</div>
      ${contact ? `<div style="color:${FAINT};font-size:12px;margin-top:4px;">${esc(contact)}</div>` : ''}
      <div style="color:#cbd5e1;font-size:11px;margin-top:10px;">Recibió este correo de su firma contable. <a href="#" style="color:${FAINT};text-decoration:underline;">Cancelar suscripción</a></div>
    </td>
  </tr></table>`;
}

function shell(inner: string, pageBg: string): string {
  return `<div style="background:${pageBg};padding:28px 12px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" align="center" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${LINE};">
      ${inner}
    </table>
  </div>`;
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
    description: 'Logo, sección destacada y lista con checks. Comunicado formal.',
    render: (f) =>
      shell(
        `<tr><td style="height:5px;background:${TEAL};font-size:0;line-height:0;">&nbsp;</td></tr>
        ${header(f.company, f.tagline, '#ffffff'.replace('#ffffff', '#0b3b34'), '#9fe1cb')}
        <tr><td style="padding:30px 32px 8px;">
          <h1 style="margin:0 0 6px;color:${INK};font-size:23px;line-height:1.3;">${esc(f.title)}</h1>
          ${f.subtitle ? `<p style="margin:0 0 18px;color:${TEAL_DARK};font-size:15px;font-weight:bold;">${esc(f.subtitle)}</p>` : ''}
          ${paragraphs(f.body)}
          ${highlightBox(f.highlight)}
          ${checkList(f.points)}
          ${button(f.ctaLabel, f.ctaUrl)}
          ${signatureBlock(f.signature)}
        </td></tr>
        <tr><td style="padding:0 32px;"><div style="height:1px;background:${LINE};margin:24px 0 0;"></div></td></tr>
        ${footer(f.company, f.contact)}`,
        '#eef2f6',
      ),
  },
  {
    id: 'boletin',
    name: 'Boletín',
    description: 'Banner de color, título en recuadro y novedades. Para campañas.',
    render: (f) =>
      shell(
        `${header(f.company, f.tagline, TEAL, '#bdeee0')}
        <tr><td style="padding:26px 32px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px;"><tr>
            <td style="background:${TEAL_TINT};border-left:4px solid ${TEAL};border-radius:0 10px 10px 0;padding:16px 20px;">
              <h1 style="margin:0;color:${TEAL_DARK};font-size:21px;line-height:1.3;">${esc(f.title)}</h1>
              ${f.subtitle ? `<p style="margin:6px 0 0;color:${MUTED};font-size:14px;">${esc(f.subtitle)}</p>` : ''}
            </td>
          </tr></table>
          ${paragraphs(f.body)}
          ${checkList(f.points)}
          ${highlightBox(f.highlight)}
          ${button(f.ctaLabel, f.ctaUrl)}
          ${signatureBlock(f.signature)}
        </td></tr>
        ${footer(f.company, f.contact)}`,
        '#e7eef0',
      ),
  },
  {
    id: 'recordatorio',
    name: 'Recordatorio tributario',
    description: 'Encabezado de alerta + tarjeta de vencimiento. Para obligaciones.',
    render: (f) =>
      shell(
        `<tr><td style="background:#b45309;padding:20px 32px;">
          <span style="color:#ffffff;font-size:16px;font-weight:bold;">⏰ ${esc(f.company)}</span>
          ${f.tagline ? `<div style="color:#fcd9a8;font-size:12px;margin-top:2px;">${esc(f.tagline)}</div>` : ''}
        </td></tr>
        <tr><td style="padding:26px 32px 6px;">
          <h1 style="margin:0 0 16px;color:#92400e;font-size:22px;line-height:1.3;">${esc(f.title)}</h1>
          ${
            f.highlight
              ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;"><tr>
                  <td style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:18px 22px;text-align:center;">
                    <div style="color:#b45309;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Fecha límite</div>
                    <div style="color:#92400e;font-size:22px;font-weight:bold;margin-top:4px;">${esc(f.highlight)}</div>
                  </td>
                </tr></table>`
              : ''
          }
          ${paragraphs(f.body)}
          ${checkList(f.points, '#b45309')}
          ${button(f.ctaLabel, f.ctaUrl, '#b45309')}
          ${signatureBlock(f.signature)}
        </td></tr>
        ${footer(f.company, f.contact)}`,
        '#fef3e2',
      ),
  },
  {
    id: 'bienvenida',
    name: 'Bienvenida',
    description: 'Cálida, con pasos numerados. Para nuevos clientes/prospectos.',
    render: (f) =>
      shell(
        `${header(f.company, f.tagline, '#0b3b34', '#9fe1cb')}
        <tr><td style="padding:30px 32px 6px;text-align:center;">
          <div style="display:inline-block;background:${TEAL_TINT};color:${TEAL_DARK};font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:6px 14px;border-radius:999px;">Bienvenido</div>
          <h1 style="margin:14px 0 6px;color:${INK};font-size:24px;line-height:1.3;">${esc(f.title)}</h1>
          ${f.subtitle ? `<p style="margin:0 0 8px;color:${MUTED};font-size:15px;">${esc(f.subtitle)}</p>` : ''}
        </td></tr>
        <tr><td style="padding:6px 32px 8px;">
          ${paragraphs(f.body)}
          ${steps(f.points)}
          ${highlightBox(f.highlight)}
          <div style="text-align:center;">${button(f.ctaLabel, f.ctaUrl)}</div>
          ${signatureBlock(f.signature)}
        </td></tr>
        ${footer(f.company, f.contact)}`,
        '#eef2f6',
      ),
  },
];

export const DEFAULT_FIELDS: TemplateFields = {
  company: 'Proyectamos Asesoría Integral S.A.S.',
  tagline: 'Asesoría contable y tributaria',
  title: 'Información importante para su empresa',
  subtitle: 'Un resumen claro para su gestión de este mes',
  body:
    'Estimado(a) $razon_social,\n\nDesde nuestro equipo contable queremos compartirle información relevante para su gestión tributaria y financiera, y recordarle que estamos atentos a acompañarle en cada obligación.',
  highlight: 'Su próxima declaración de IVA vence el 16 de marzo de 2026.',
  points:
    'Revisión de su información tributaria al día\nAcompañamiento en cada vencimiento\nReportes financieros claros cada mes',
  ctaLabel: 'Agendar una reunión',
  ctaUrl: 'https://',
  signature: 'Cordialmente,\nEquipo Proyectamos Asesoría Integral',
  contact: 'Cali, Valle del Cauca · Tel: (602) 000 0000 · contacto@proyectamos.co',
};

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
