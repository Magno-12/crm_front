// Diseños de correo HTML profesionales y dinámicos (firma contable).
// Email-safe: tablas + estilos inline (compatibles con Gmail, Outlook, Apple Mail).
// Las variables $razon_social/$nit/etc. se conservan para personalizar al enviar;
// en la previsualización se reemplazan por ejemplos.

export interface TemplateFields {
  company: string;
  tagline: string;
  preheader: string;
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
const TEAL_DEEP = '#0b3b34';
const TEAL_TINT = '#f0fdfa';
const TEAL_BORDER = '#99f6e4';
const INK = '#0f172a';
const TEXT = '#475569';
const MUTED = '#64748b';
const FAINT = '#94a3b8';
const LINE = '#e8edf2';
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function monogram(company: string): string {
  const words = company.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
  const a = words[0]?.[0] ?? 'C';
  const b = words[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

function preheader(text: string): string {
  if (!text.trim()) return '';
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent;height:0;width:0;">${text}</div>`;
}

function eyebrow(text: string, color = TEAL_DARK): string {
  if (!text.trim()) return '';
  return `<div style="color:${color};font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px;">${text}</div>`;
}

function paragraphs(text: string, color = TEXT): string {
  return text
    .split(/\n\n+/)
    .filter((p) => p.trim() !== '')
    .map(
      (p) =>
        `<p style="margin:0 0 15px;color:${color};font-size:15px;line-height:1.75;">${p.trim().replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

function button(label: string, url: string, bg = TEAL): string {
  if (!label.trim()) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 2px;"><tr><td style="background:${bg};border-radius:999px;">
    <a href="${url || '#'}" style="display:inline-block;padding:14px 34px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;letter-spacing:.2px;border-radius:999px;">${label} &nbsp;→</a>
  </td></tr></table>`;
}

function checkList(text: string, accent = TEAL): string {
  const items = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!items.length) return '';
  const rows = items
    .map(
      (it) =>
        `<tr><td valign="top" style="padding:6px 12px 6px 0;width:24px;">
          <span style="display:inline-block;width:22px;height:22px;background:${TEAL_TINT};border:1px solid ${accent};border-radius:50%;color:${accent};text-align:center;line-height:21px;font-size:12px;font-weight:bold;">✓</span>
        </td><td valign="top" style="padding:6px 0;color:${TEXT};font-size:15px;line-height:1.55;">${it}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 20px;">${rows}</table>`;
}

function steps(text: string, accent = TEAL): string {
  const items = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!items.length) return '';
  const rows = items
    .map(
      (it, i) =>
        `<tr><td valign="top" style="padding:8px 14px 8px 0;width:32px;">
          <span style="display:inline-block;width:28px;height:28px;background:${accent};border-radius:50%;color:#ffffff;text-align:center;line-height:28px;font-size:13px;font-weight:bold;">${i + 1}</span>
        </td><td valign="top" style="padding:10px 0;color:${TEXT};font-size:15px;line-height:1.55;border-bottom:1px solid ${LINE};">${it}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:10px 0 20px;">${rows}</table>`;
}

function highlightBox(text: string): string {
  if (!text.trim()) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 22px;"><tr>
    <td style="background:${TEAL_TINT};border:1px solid ${TEAL_BORDER};border-radius:14px;padding:18px 22px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td valign="top" style="padding-right:12px;font-size:20px;line-height:1;">💡</td>
        <td style="color:${TEAL_DARK};font-size:15px;line-height:1.6;font-weight:bold;">${text}</td>
      </tr></table>
    </td>
  </tr></table>`;
}

function signatureBlock(text: string): string {
  if (!text.trim()) return '';
  return `<p style="margin:26px 0 0;color:${MUTED};font-size:14px;line-height:1.6;">${text.trim().replace(/\n/g, '<br>')}</p>`;
}

function header(company: string, tagline: string, bg: string, sub: string): string {
  return `<tr><td style="background:${bg};padding:24px 36px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:14px;">
        <div style="width:48px;height:48px;background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.22);border-radius:14px;color:#ffffff;text-align:center;line-height:48px;font-size:18px;font-weight:bold;">${monogram(company)}</div>
      </td>
      <td>
        <div style="color:#ffffff;font-size:17px;font-weight:bold;line-height:1.25;">${company}</div>
        ${tagline ? `<div style="color:${sub};font-size:12px;letter-spacing:.3px;margin-top:3px;">${tagline}</div>` : ''}
      </td>
    </tr></table>
  </td></tr>`;
}

function footer(company: string, contact: string): string {
  const parts = contact
    .split(/\s*[·|]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const contactRow = parts.length
    ? `<div style="color:${FAINT};font-size:12px;margin-top:6px;line-height:1.7;">${parts.join(' &nbsp;·&nbsp; ')}</div>`
    : '';
  return `<tr><td style="background:#f8fafc;border-top:1px solid ${LINE};padding:24px 36px;text-align:center;">
    <div style="color:#334155;font-size:13px;font-weight:bold;letter-spacing:.2px;">${company}</div>
    ${contactRow}
    <div style="color:#cbd5e1;font-size:11px;margin-top:12px;line-height:1.6;">Recibió este correo de su firma contable.<br><a href="#" style="color:${FAINT};text-decoration:underline;">Cancelar suscripción</a></div>
  </td></tr>`;
}

function shell(inner: string, pageBg: string, pre: string): string {
  return `${preheader(pre)}<div style="background:${pageBg};padding:32px 14px;font-family:${FONT};">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" align="center" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid ${LINE};box-shadow:0 1px 2px rgba(15,23,42,0.04),0 10px 30px rgba(15,23,42,0.06);">
      ${inner}
    </table>
    <div style="max-width:600px;margin:14px auto 0;text-align:center;color:${FAINT};font-size:11px;font-family:${FONT};">Enviado con cuidado por su equipo contable.</div>
  </div>`;
}

export interface EmailDesign {
  id: string;
  name: string;
  description: string;
  render: (f: TemplateFields) => string;
  /** Textos por defecto que se cargan al elegir el diseño. */
  defaults?: Partial<TemplateFields>;
}

// ---- Marca Proyectamos (para las plantillas replicadas de los volantes) ----
const P_NAVY = '#2e3a5e';
const P_GREEN = '#8cc63f';
const P_ORANGE = '#ee6b2f';
const P_RED = '#e02323';

// Imágenes de marca alojadas en Cloudinary (los correos requieren URLs públicas).
const CLD = 'https://res.cloudinary.com/pcnyzhql/image/upload';
const LOGO_URL = `${CLD}/f_auto,q_auto,w_440/proyectamos/logo.png`;
const HERO_ICA_URL = `${CLD}/f_auto,q_auto:good,c_fill,g_auto,w_1360,h_620,e_sharpen:60/proyectamos/hero_ica.jpg`;
const HERO_RENTA_URL = `${CLD}/f_auto,q_auto:good,c_fill,g_auto:faces,w_1360,h_620,e_sharpen:60/proyectamos/hero_renta.jpg`;

// Chip blanco con el logo (visible sobre cualquier foto), esquina superior derecha.
function proyLogoChip(): string {
  return `<img src="${LOGO_URL}" width="160" alt="Proyectamos Asesoría Integral S.A.S." style="display:inline-block;background:#ffffff;border-radius:8px;padding:5px 9px;border:0;" />`;
}

// Bloque superior a sangre: la foto cubre toda la parte de arriba; el logo va
// montado arriba a la derecha y la banda azul del título se apoya sobre la foto.
// Usa fondo con imagen (con fallback navy) + VML para que también funcione en Outlook.
function proyHeroBg(url: string, height: number, inner: string): string {
  return `<tr><td style="padding:0;">
    <!--[if gte mso 9]>
    <v:image xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" src="${url}" style="width:620px;height:${height}px;" />
    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="false" stroke="false" style="position:absolute;width:620px;height:${height}px;"><v:textbox inset="0,0,0,0">
    <![endif]-->
    <div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" background="${url}" bgcolor="${P_NAVY}" style="background:${P_NAVY} url('${url}') center/cover no-repeat;border-collapse:collapse;">
        ${inner}
      </table>
    </div>
    <!--[if gte mso 9]></v:textbox></v:rect><![endif]-->
  </td></tr>`;
}

function proyBullets(text: string): string {
  const items = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const cell = (it: string) =>
    `<td valign="top" width="50%" style="padding:7px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
        <td valign="top" style="padding-right:8px;color:${P_GREEN};font-size:16px;line-height:1.4;">●</td>
        <td style="color:#334155;font-size:14px;line-height:1.5;text-align:left;">${it}</td>
      </tr></table>
    </td>`;
  let rows = '';
  for (let i = 0; i < items.length; i += 2) {
    rows += `<tr>${cell(items[i]!)}${items[i + 1] ? cell(items[i + 1]!) : '<td></td>'}</tr>`;
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>`;
}

function proyFooter(): string {
  return `
    <tr><td align="center" style="padding:20px 28px 10px;text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
        <td align="center" style="padding:0 14px;color:${P_NAVY};font-size:13px;">✉ info@proyectamosasesoria.net</td>
        <td style="color:${P_GREEN};font-size:14px;font-weight:bold;">·</td>
        <td align="center" style="padding:0 14px;color:${P_NAVY};font-size:13px;">✉ contactenos@proyectamosasesoria.net</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:${P_NAVY};padding:14px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td width="33.33%" align="center" style="color:#ffffff;font-size:14px;font-weight:bold;text-align:center;">📱 322 653 75 37</td>
        <td width="33.33%" align="center" style="color:#ffffff;font-size:14px;font-weight:bold;text-align:center;">📞 317 440 39 54</td>
        <td width="33.33%" align="center" style="color:#ffffff;font-size:14px;font-weight:bold;text-align:center;">☎ (602) 889 36 47</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:${P_GREEN};padding:13px 28px;text-align:center;color:${P_NAVY};font-size:14px;font-weight:bold;">
      Confíe en nosotros, su tranquilidad es nuestra prioridad.
    </td></tr>
    <tr><td align="center" style="padding:16px 28px;text-align:center;">
      <span style="display:inline-block;background:${P_ORANGE};border-radius:8px;padding:11px 24px;color:#ffffff;font-size:13px;font-weight:bold;">
        Tarifas ajustadas a SU PRESUPUESTO · ¡juntos ENCONTRAREMOS la mejor opción!
      </span>
    </td></tr>`;
}

function proyShell(inner: string, pre: string): string {
  return `${preheader(pre)}<div style="background:#eef2f6;padding:24px 12px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="620" align="center" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      ${inner}
      ${proyFooter()}
    </table>
  </div>`;
}

const ICA_YEARS = ['2020', '2021', '2022', '2023', '2024', '2025']
  .map(
    (y) =>
      `<span style="display:inline-block;background:${P_GREEN};color:${P_NAVY};font-size:14px;font-weight:bold;padding:3px 12px;border-radius:999px;margin:2px 3px;">${y}</span>`,
  )
  .join('');

export const DESIGNS: EmailDesign[] = [
  {
    id: 'proy-ica',
    name: 'Proyectamos · ICA',
    description: 'Volante Industria y Comercio (ICA) con la marca Proyectamos.',
    defaults: {
      tagline: 'IMPUESTO MUNICIPAL',
      preheader: 'ICA: si la Alcaldía lo requirió, regularice y reduzca sanciones.',
      title: 'INDUSTRIA Y COMERCIO - ICA',
      subtitle: 'SI HA SIDO REQUERIDO POR LA ALCALDÍA POR LOS AÑOS',
      highlight:
        'Si recibió un requerimiento de la Alcaldía, el tiempo corre a su favor si actúa ahora. Presentar las declaraciones pendientes reduce significativamente sanciones e intereses de mora.',
      points:
        'Revisamos su situación tributaria municipal sin costo\nCalculamos impuesto, sanciones e intereses de cada período\nPreparamos y presentamos todas sus declaraciones de ICA\nLo acompañamos ante la Alcaldía para regularizar su situación',
    },
    render: (f) =>
      proyShell(
        `${proyHeroBg(
          HERO_ICA_URL,
          320,
          `<tr><td style="padding:16px 22px 0;text-align:right;">${proyLogoChip()}</td></tr>
           <tr><td style="height:96px;font-size:0;line-height:0;">&nbsp;</td></tr>
           <tr><td valign="bottom" style="padding:0;">
             <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="background:${P_NAVY};padding:20px 28px;text-align:center;">
               <div style="color:#9aa7c2;font-size:14px;font-weight:bold;letter-spacing:1.5px;">${f.tagline}</div>
               <h1 style="margin:6px 0 4px;color:#ffffff;font-size:28px;font-weight:bold;line-height:1.12;">${f.title}</h1>
               <div style="color:${P_GREEN};font-size:15px;font-weight:bold;line-height:1.3;">${f.subtitle}</div>
               <div style="margin-top:12px;">${ICA_YEARS}</div>
             </td></tr></table>
           </td></tr>`,
        )}
        <tr><td style="padding:18px 28px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td valign="top" style="padding-right:10px;font-size:20px;line-height:1.3;">⚠️</td>
            <td style="color:#334155;font-size:14px;line-height:1.65;">${f.highlight}</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:10px 28px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:2px solid ${P_GREEN};border-radius:14px;"><tr><td style="padding:16px 20px;text-align:center;">
            <div style="color:${P_NAVY};font-size:16px;font-weight:bold;margin-bottom:8px;text-align:center;">¿Qué hacemos por usted?</div>
            ${proyBullets(f.points)}
          </td></tr></table>
        </td></tr>`,
        f.preheader,
      ),
  },
  {
    id: 'proy-renta',
    name: 'Proyectamos · Renta',
    description: 'Volante Declaración de Renta (personas obligadas) con la marca Proyectamos.',
    defaults: {
      tagline: 'PERSONA NATURAL',
      preheader: 'Declaración de renta 2026: verifique si está obligado y evite sanciones.',
      title: 'DECLARACIÓN DE RENTA - PERSONAS OBLIGADAS',
      subtitle: 'A PARTIR DEL 12 DE AGOSTO HASTA EL 26 DE OCTUBRE DE 2026',
      highlight: 'Evita que te sancionen',
      body: 'Si durante el año 2025 usted tuvo ingresos, consumos o consignaciones superiores a $69.718.600 (1.400 UVT), o un patrimonio bruto superior a $224.095.500 (4.500 UVT), es probable que esté obligado a declarar renta.',
    },
    render: (f) =>
      proyShell(
        `${proyHeroBg(
          HERO_RENTA_URL,
          320,
          `<tr><td style="padding:16px 22px 0;text-align:right;">${proyLogoChip()}</td></tr>
           <tr><td style="height:64px;font-size:0;line-height:0;">&nbsp;</td></tr>
           ${
             f.highlight
               ? `<tr><td align="center" style="padding:0 28px 10px;text-align:center;">
                    <span style="display:inline-block;background:${P_ORANGE};color:#ffffff;font-size:15px;font-weight:bold;padding:7px 18px;border-radius:8px;">${f.highlight} !</span>
                  </td></tr>`
               : ''
           }
           <tr><td valign="bottom" style="padding:0;">
             <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="background:${P_NAVY};padding:20px 28px;text-align:center;">
               <div style="color:#9aa7c2;font-size:14px;font-weight:bold;letter-spacing:1.5px;">${f.tagline}</div>
               <h1 style="margin:6px 0 6px;color:#ffffff;font-size:25px;font-weight:bold;line-height:1.15;">${f.title}</h1>
               <div style="color:${P_GREEN};font-size:15px;font-weight:bold;line-height:1.3;">${f.subtitle}</div>
             </td></tr></table>
           </td></tr>`,
        )}
        <tr><td style="padding:18px 28px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:2px solid ${P_GREEN};border-radius:14px;"><tr><td style="padding:18px 22px;color:#334155;font-size:15px;line-height:1.75;text-align:center;">
            ${f.body
              .replace(/\$([\d.]+)/g, `<span style="color:${P_RED};font-weight:bold;">$$$1</span>`)
              .replace(/\(([\d.]+ UVT)\)/g, `<span style="color:${P_RED};font-weight:bold;">($1)</span>`)}
          </td></tr></table>
        </td></tr>`,
        f.preheader,
      ),
  },
  {
    id: 'corporativo',
    name: 'Corporativo',
    description: 'Encabezado oscuro, dato destacado y lista con checks. Comunicado formal.',
    render: (f) =>
      shell(
        `<tr><td style="height:5px;background:${TEAL};font-size:0;line-height:0;">&nbsp;</td></tr>
        ${header(f.company, f.tagline, TEAL_DEEP, '#9fe1cb')}
        <tr><td style="padding:34px 36px 10px;">
          ${eyebrow(f.subtitle)}
          <h1 style="margin:0 0 18px;color:${INK};font-size:25px;line-height:1.3;font-weight:bold;">${f.title}</h1>
          ${paragraphs(f.body)}
          ${highlightBox(f.highlight)}
          ${checkList(f.points)}
          ${button(f.ctaLabel, f.ctaUrl)}
          ${signatureBlock(f.signature)}
        </td></tr>
        ${footer(f.company, f.contact)}`,
        '#eef2f6',
        f.preheader,
      ),
  },
  {
    id: 'boletin',
    name: 'Boletín',
    description: 'Banner de color y título en recuadro. Para campañas y novedades.',
    render: (f) =>
      shell(
        `${header(f.company, f.tagline, TEAL, '#c7f0e6')}
        <tr><td style="padding:28px 36px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;"><tr>
            <td style="background:${TEAL_TINT};border-left:4px solid ${TEAL};border-radius:0 12px 12px 0;padding:18px 22px;">
              <h1 style="margin:0;color:${TEAL_DARK};font-size:22px;line-height:1.3;">${f.title}</h1>
              ${f.subtitle ? `<p style="margin:7px 0 0;color:${MUTED};font-size:14px;">${f.subtitle}</p>` : ''}
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
        f.preheader,
      ),
  },
  {
    id: 'recordatorio',
    name: 'Recordatorio tributario',
    description: 'Alerta + tarjeta de fecha límite. Para obligaciones y vencimientos.',
    render: (f) =>
      shell(
        `<tr><td style="background:#b45309;padding:22px 36px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px;font-size:22px;line-height:1;">⏰</td>
            <td><div style="color:#ffffff;font-size:17px;font-weight:bold;">${f.company}</div>${f.tagline ? `<div style="color:#fcd9a8;font-size:12px;margin-top:3px;">${f.tagline}</div>` : ''}</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:30px 36px 8px;">
          <h1 style="margin:0 0 18px;color:#92400e;font-size:23px;line-height:1.3;">${f.title}</h1>
          ${
            f.highlight
              ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;"><tr>
                  <td style="background:#fffbeb;border:1px solid #fcd34d;border-radius:14px;padding:20px 24px;text-align:center;">
                    <div style="color:#b45309;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:bold;">Fecha límite</div>
                    <div style="color:#92400e;font-size:24px;font-weight:bold;margin-top:6px;">${f.highlight}</div>
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
        '#fdf2e2',
        f.preheader,
      ),
  },
  {
    id: 'bienvenida',
    name: 'Bienvenida',
    description: 'Cálida, centrada y con pasos numerados. Para nuevos clientes.',
    render: (f) =>
      shell(
        `${header(f.company, f.tagline, TEAL_DEEP, '#9fe1cb')}
        <tr><td style="padding:34px 36px 8px;text-align:center;">
          <div style="display:inline-block;background:${TEAL_TINT};color:${TEAL_DARK};font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;padding:7px 16px;border-radius:999px;">Bienvenido</div>
          <h1 style="margin:16px 0 6px;color:${INK};font-size:26px;line-height:1.3;font-weight:bold;">${f.title}</h1>
          ${f.subtitle ? `<p style="margin:0;color:${MUTED};font-size:15px;line-height:1.6;">${f.subtitle}</p>` : ''}
        </td></tr>
        <tr><td style="padding:10px 36px 8px;">
          ${paragraphs(f.body)}
          ${steps(f.points)}
          ${highlightBox(f.highlight)}
          <div style="text-align:center;">${button(f.ctaLabel, f.ctaUrl)}</div>
          ${signatureBlock(f.signature)}
        </td></tr>
        ${footer(f.company, f.contact)}`,
        '#eef2f6',
        f.preheader,
      ),
  },
];

export const DEFAULT_FIELDS: TemplateFields = {
  company: 'Proyectamos Asesoría Integral S.A.S.',
  tagline: 'Asesoría contable y tributaria',
  preheader: 'Información clave para su gestión contable de este mes.',
  title: 'Información importante para su empresa',
  subtitle: 'Resumen del mes',
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
