// Contenido de ayuda ("¿Cómo funciona?") — guía completa y navegable.
// Texto sencillo y no técnico. Cada tema puede además "matchear" una ruta para
// mostrarse por defecto según la pantalla en la que esté el usuario.

export interface HelpSection {
  heading: string;
  items: string[];
}

export interface HelpTopic {
  id: string;
  title: string;
  intro: string;
  sections: HelpSection[];
  tip?: string;
  /** Devuelve true si este tema corresponde a la ruta actual. */
  match?: (pathname: string) => boolean;
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'general',
    title: 'Todo el sistema',
    intro: 'Visión general del CRM: para qué sirve cada parte y cómo se conecta todo.',
    sections: [
      {
        heading: 'El recorrido normal',
        items: [
          'Base de datos mercadeo → busca y contacta prospectos.',
          'Envío de correos → manda campañas con plantillas.',
          'Apertura de correos → mira quién abrió, los porcentajes y las respuestas.',
          'Seguimiento → trabaja a los contactados hasta fidelizarlos.',
          'Clientes y Facturas → registra el contrato y factura.',
        ],
      },
      {
        heading: 'Cómo moverse',
        items: [
          'Menú de la izquierda para cambiar de pantalla.',
          'Este botón "¿Cómo funciona?" está en todas las pantallas: por defecto explica la que ves, y en el menú de la izquierda del popup puedes leer cómo funciona cualquier otra.',
          'Arriba a la derecha, en el ícono con su inicial, cierra sesión.',
        ],
      },
    ],
    tip: 'Todo está publicado en internet, con usuario y contraseña, y con permisos por rol.',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    intro: 'Un resumen general del negocio: prospectos, facturación y actividad.',
    sections: [
      {
        heading: 'Qué muestra',
        items: [
          'Indicadores: prospectos nuevos, conversión y facturación.',
          'Gráficas: tendencia, facturación por servicio, ciudades, actividades y top clientes.',
        ],
      },
    ],
    tip: 'Las estadísticas de correo (aperturas y %) ahora están en "Apertura de correos".',
    match: (p) => p === '/',
  },
  {
    id: 'prospects',
    title: 'Base de datos mercadeo',
    intro: 'Toda la base de prospectos (posibles clientes) para buscar, filtrar y contactar.',
    sections: [
      {
        heading: 'Buscar y filtrar',
        items: [
          'Busca por nombre (razón social) o por NIT.',
          'Filtra por actividad (CIIU), rango de ingresos y rango de patrimonio.',
          'Segmenta por tipo: naturales, jurídicas, alcaldías, ESE, otros.',
        ],
      },
      {
        heading: 'Trabajar un prospecto',
        items: [
          'Botón "Corregir" abre la ficha completa para editar y hacer seguimiento.',
          'Al escribir el NIT, trae solo la razón social y la actividad.',
          'Puedes importar más prospectos desde un archivo de Excel.',
        ],
      },
    ],
    match: (p) => p === '/prospects',
  },
  {
    id: 'prospectDetail',
    title: 'Ficha (prospecto / cliente)',
    intro: 'Toda la información de un prospecto o cliente, con dos recuadros clave.',
    sections: [
      {
        heading: 'Orden de los recuadros',
        items: [
          '1º Apertura de correos: qué campañas se le enviaron, si las abrió (fecha y hora), sus respuestas y un botón para escribirle.',
          '2º Seguimiento: registra llamadas, correos, reuniones o notas, y ve el historial.',
        ],
      },
      {
        heading: 'Datos que puedes editar',
        items: [
          'Representante legal y su cédula.',
          'Persona de contacto (nombre, cargo, teléfono, correo).',
          'Dirección, teléfonos, actividad (CIIU) y más.',
        ],
      },
    ],
    tip: 'Cuando un prospecto responde un correo, la respuesta aparece sola en su recuadro de Apertura de correos.',
    match: (p) => p.startsWith('/prospects/') || p.startsWith('/clients/'),
  },
  {
    id: 'seguimiento',
    title: 'Seguimiento',
    intro: 'Solo los prospectos que ya contactaste, para gestionarlos hasta convertirlos.',
    sections: [
      {
        heading: 'Cómo funciona',
        items: [
          'Aparecen únicamente los prospectos en estado "Contactado".',
          'Estados: Nuevo → Contactado → Fidelizado (o No fidelizado).',
          'Al marcar "Fidelizado", regístralo como cliente con su contrato y servicio.',
        ],
      },
    ],
    match: (p) => p.startsWith('/seguimiento'),
  },
  {
    id: 'emails',
    title: 'Envío de correos',
    intro: 'Crea plantillas y envía campañas masivas desde el dominio propio.',
    sections: [
      {
        heading: 'Plantillas',
        items: [
          'Ya vienen cargadas "Proyectamos · ICA", "Renta (volante)" y "Renta (carta)".',
          'Puedes crear una nueva, editar textos/fechas/montos y ver la vista previa en vivo.',
          'Personaliza con $razon_social, $nit o $ciudad: se llenan solos por cada prospecto.',
          'También puedes pegar tu propio HTML.',
        ],
      },
      {
        heading: 'Enviar una campaña',
        items: [
          'Elige plantilla, segmento (a quién) y desde qué cuenta sale.',
          'No se reenvía a quien ya recibió esa campaña (viene activado).',
          'Si se agota la cuota diaria del proveedor, la campaña frena y se reanuda después sin perder trabajo.',
        ],
      },
      {
        heading: 'Privacidad (Ley 1581)',
        items: [
          'Cada correo lleva al pie el aviso de privacidad y un botón "Cancelar suscripción".',
          'Quien se da de baja queda excluido automáticamente de futuras campañas.',
          'El pie enlaza la Política de Tratamiento de Datos (PDF).',
        ],
      },
    ],
    tip: 'Para volumen alto (3.000/día) se requiere el plan pago del proveedor de correo (Resend).',
    match: (p) => p.startsWith('/emails'),
  },
  {
    id: 'aperturas',
    title: 'Apertura de correos',
    intro: 'Los resultados de las campañas: quién abrió, porcentajes, historial y respuestas.',
    sections: [
      {
        heading: 'Resumen (porcentajes)',
        items: [
          'Arriba ves Enviados, Abiertos, Clics y % de apertura.',
        ],
      },
      {
        heading: 'Historial de campañas',
        items: [
          'Cada campaña queda registrada con su fecha de inicio y de fin.',
          'Ves audiencia, enviados, abiertos, % apertura, clics y respuestas de cada una.',
          'Haz clic en una campaña para ver el detalle: quién abrió, quién hizo clic y quién respondió (con el texto).',
          'Cada envío es una campaña independiente (la nueva empieza limpia).',
        ],
      },
      {
        heading: 'Correos abiertos y respuestas',
        items: [
          'Lista de todos los abiertos con fecha y hora, y la columna "Campaña".',
          'Respuestas de clientes: puedes leerlas sin salir del sistema.',
          'Botón "Escribir": redactas un mensaje propio (asunto + texto) y lo envías; no reenvía lo mismo.',
        ],
      },
    ],
    tip: 'Las respuestas llegan solas: el CRM lee el buzón de correo cada pocos minutos y las registra.',
    match: (p) => p.startsWith('/aperturas'),
  },
  {
    id: 'clients',
    title: 'Clientes',
    intro: 'Los prospectos fidelizados, con sus datos de cobro, contrato y servicios.',
    sections: [
      {
        heading: 'Qué muestra',
        items: [
          'Lista con una columna de "Valor del servicio" (suma de los servicios activos).',
          'Ficha con datos de cobro, contacto de contabilidad, contrato y servicios.',
          'La ficha también trae los recuadros de Apertura de correos y Seguimiento.',
        ],
      },
    ],
    match: (p) => p === '/clients',
  },
  {
    id: 'invoices',
    title: 'Facturas',
    intro: 'Genera facturas en PDF con los datos del cliente.',
    sections: [
      {
        heading: 'Crear una factura',
        items: [
          'Elige un cliente fidelizado: el ítem trae automáticamente su servicio y valor.',
          'Ajusta IVA, vencimiento y observaciones.',
          'Genera el PDF listo para enviar.',
        ],
      },
    ],
    match: (p) => p.startsWith('/invoices'),
  },
  {
    id: 'tax',
    title: 'Obligaciones tributarias',
    intro: 'Controla los vencimientos con semáforos 🟢🟡🔴.',
    sections: [
      {
        heading: 'Cómo funciona',
        items: [
          'Cada obligación muestra un semáforo según qué tan cerca está el vencimiento.',
          'Sugiere la fecha según el Calendario DIAN 2026 y el último dígito del NIT.',
        ],
      },
    ],
    match: (p) => p.startsWith('/tax'),
  },
  {
    id: 'alerts',
    title: 'Alertas',
    intro: 'Lo que requiere atención: prospectos sin gestión y vencimientos próximos.',
    sections: [
      {
        heading: 'Cómo usarlo',
        items: [
          'Úsalo como lista de pendientes del día.',
          'Haz clic para ir a resolver cada punto.',
        ],
      },
    ],
    match: (p) => p.startsWith('/alerts'),
  },
  {
    id: 'admin',
    title: 'Administración',
    intro: 'Usuarios, roles, auditoría y catálogo de servicios.',
    sections: [
      {
        heading: 'Qué puedes hacer',
        items: [
          'Usuarios: crear personas y asignarles un rol; el nuevo cambia su clave al primer ingreso.',
          'Roles: definir qué puede ver y hacer cada tipo de usuario.',
          'Auditoría: ver quién hizo qué y cuándo.',
          'Servicios: el catálogo de servicios (con su valor) que se usa en clientes y facturas.',
        ],
      },
    ],
    match: (p) => p.startsWith('/admin'),
  },
];

/** Id del tema que corresponde a la ruta actual (o 'general'). */
export function currentTopicId(pathname: string): string {
  const found = HELP_TOPICS.find((t) => t.match?.(pathname));
  return found?.id ?? 'general';
}
