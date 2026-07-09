// Contenido de ayuda ("¿Cómo funciona?") — guía completa, detallada y navegable.
// Texto sencillo y no técnico, con pasos concretos.

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
    intro:
      'El CRM acompaña todo el proceso comercial y contable: desde un posible cliente (prospecto) hasta facturarle como cliente fidelizado.',
    sections: [
      {
        heading: 'El recorrido de principio a fin',
        items: [
          '1) Base de datos mercadeo: busca empresas/personas y contáctalas.',
          '2) Envío de correos: mándales una campaña con una plantilla.',
          '3) Apertura de correos: mira quién abrió, hizo clic o respondió.',
          '4) Seguimiento: trabaja a los contactados (llamadas, correos, notas) hasta fidelizarlos.',
          '5) Clientes: al fidelizar, registra el contrato y los servicios con su valor.',
          '6) Facturas: genera la factura en PDF con el servicio ya cargado.',
          '7) Obligaciones y Alertas: controla vencimientos y pendientes.',
        ],
      },
      {
        heading: 'Cómo moverse',
        items: [
          'Menú de la izquierda: cambia de pantalla. Se puede contraer con el botón de abajo.',
          'Este botón "¿Cómo funciona?" está en todas las pantallas: abre en la ayuda de la que ves, y en el menú del popup puedes leer cualquier otra.',
          'Arriba a la derecha, el ícono con tu inicial: cerrar sesión.',
          'Casi todo lo que dice un número o una fecha se puede tocar para ir al detalle.',
        ],
      },
      {
        heading: 'Seguridad y acceso',
        items: [
          'Cada persona entra con su usuario y contraseña.',
          'Los permisos dependen del rol: no todos ven ni pueden hacer lo mismo.',
          'Está publicado en internet (en la nube), no depende de un computador en la oficina.',
        ],
      },
    ],
    tip: 'Si no sabes por dónde empezar: Base de datos mercadeo → filtra un grupo → envíales una campaña → revisa Apertura de correos.',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    intro: 'La foto general del negocio en un vistazo.',
    sections: [
      {
        heading: 'Indicadores de arriba',
        items: [
          'Prospectos nuevos, conversión (cuántos se vuelven clientes) y facturación.',
          'Sirven para ver la salud comercial del mes de un vistazo.',
        ],
      },
      {
        heading: 'Gráficas',
        items: [
          'Tendencia de prospectos (nuevos vs. ganados).',
          'Facturación por servicio (ingreso mensual de clientes activos).',
          'Prospectos por ciudad y por actividad económica.',
          'Top clientes por facturación.',
        ],
      },
      {
        heading: 'Cómo usarlo',
        items: [
          'Revísalo al iniciar el día para saber cómo va todo.',
          'Las estadísticas de correo (aperturas y %) están en "Apertura de correos".',
        ],
      },
    ],
    match: (p) => p === '/',
  },
  {
    id: 'prospects',
    title: 'Base de datos mercadeo',
    intro: 'Toda la base de posibles clientes para buscar, filtrar y contactar.',
    sections: [
      {
        heading: 'Buscar',
        items: [
          'Escribe el nombre (razón social) o el NIT en el buscador.',
          'La búsqueda es parcial: con parte del nombre ya te muestra coincidencias.',
        ],
      },
      {
        heading: 'Filtrar para segmentar',
        items: [
          'Actividad económica (CIIU): ej. solo empresas de cierto sector.',
          'Rango de ingresos (desde/hasta) y rango de patrimonio (activos).',
          'Segmento: personas naturales, jurídicas, alcaldías, ESE, otros.',
          'Estos filtros son los mismos que luego usas para enviar una campaña a ese grupo.',
        ],
      },
      {
        heading: 'Trabajar un prospecto',
        items: [
          'Botón "Corregir": abre la ficha completa para editar y hacer seguimiento.',
          'Al escribir el NIT, el sistema trae solo la razón social y la actividad.',
          'Al "Contactar" a un prospecto, pasa automáticamente a la pantalla de Seguimiento.',
        ],
      },
      {
        heading: 'Importar más prospectos',
        items: [
          'Usa la opción de importar y sube un archivo de Excel con la base.',
          'El sistema evita duplicados por NIT.',
        ],
      },
    ],
    tip: 'La base tiene ~137.700 prospectos reales cargados. Filtra siempre antes de enviar, para no mandarle a todo el mundo.',
    match: (p) => p === '/prospects',
  },
  {
    id: 'prospectDetail',
    title: 'Ficha (prospecto / cliente)',
    intro: 'Toda la información de una empresa/persona y su relación con ustedes.',
    sections: [
      {
        heading: 'Los dos recuadros (en este orden)',
        items: [
          '1º Apertura de correos: qué campañas se le enviaron, si las abrió (con fecha y hora), sus respuestas, y un botón para escribirle.',
          '2º Seguimiento: registra y consulta las interacciones (llamada, correo, reunión, nota).',
        ],
      },
      {
        heading: 'Cómo registrar un seguimiento',
        items: [
          'En el recuadro Seguimiento, elige el tipo (Llamada, Correo, Reunión, WhatsApp, Visita, Nota).',
          'Escribe la nota de qué pasó y dale "Agregar".',
          'Queda en el historial con la fecha, en orden.',
        ],
      },
      {
        heading: 'Editar datos',
        items: [
          'Botón "Editar": representante legal y su cédula, persona de contacto (nombre, cargo, teléfono, correo), dirección, teléfonos y actividad (CIIU).',
          'El correo del prospecto es importante: por ahí se emparejan sus respuestas.',
        ],
      },
      {
        heading: 'Convertir en cliente',
        items: [
          'Cuando se fideliza, usa "Convertir en cliente".',
          'Ahí registras el servicio contratado y su valor, que luego se usan para facturar.',
        ],
      },
    ],
    tip: 'Cuando el prospecto responde un correo, la respuesta aparece sola en su recuadro de Apertura de correos (sin que hagas nada).',
    match: (p) => p.startsWith('/prospects/') || p.startsWith('/clients/'),
  },
  {
    id: 'seguimiento',
    title: 'Seguimiento',
    intro: 'Solo los prospectos que ya contactaste, para no perderlos de vista.',
    sections: [
      {
        heading: 'Qué muestra',
        items: [
          'Únicamente los prospectos en estado "Contactado" (no toda la base).',
          'Cada uno con un mini-historial que puedes expandir.',
        ],
      },
      {
        heading: 'Los estados',
        items: [
          'Nuevo → Contactado → Fidelizado (o No fidelizado).',
          '"Contactado" entra aquí; "Fidelizado" es cuando ya es cliente.',
        ],
      },
      {
        heading: 'Cómo usarlo',
        items: [
          'Botón "Corregir" para abrir la ficha y registrar el siguiente contacto.',
          'Cuando cierres el negocio, márcalo "Fidelizado" y conviértelo en cliente.',
        ],
      },
    ],
    match: (p) => p.startsWith('/seguimiento'),
  },
  {
    id: 'emails',
    title: 'Envío de correos',
    intro: 'Crea plantillas y envía campañas masivas desde el dominio propio de Proyectamos.',
    sections: [
      {
        heading: 'Crear o elegir una plantilla',
        items: [
          'Ya vienen cargadas: "Proyectamos · ICA", "Renta (volante)" y "Renta (carta)".',
          'Para una nueva: "Nueva plantilla" → elige un diseño → edita textos, fechas y montos con la vista previa en vivo.',
          'También puedes pegar tu propio HTML si ya tienes un diseño.',
        ],
      },
      {
        heading: 'Personalizar por cada persona',
        items: [
          'Escribe $razon_social, $nit o $ciudad en el texto.',
          'Al enviar, cada uno recibe su dato (ej. "Estimado(a) Inversiones El Roble S.A.S.").',
          'En la carta, el "Att.:" usa el contacto; si no hay, el representante legal.',
        ],
      },
      {
        heading: 'Enviar una campaña (paso a paso)',
        items: [
          '1) Elige la plantilla.',
          '2) Elige el segmento/filtros (a quién le llega).',
          '3) Elige desde qué cuenta sale (info, contactenos, etc.).',
          '4) Envía. No se reenvía a quien ya recibió esa campaña (viene activado).',
        ],
      },
      {
        heading: 'Límite diario y privacidad',
        items: [
          'Si se agota la cuota diaria del proveedor, la campaña frena y se reanuda después sin perder trabajo.',
          'Cada correo lleva al pie el aviso de privacidad (Ley 1581) y un botón "Cancelar suscripción".',
          'Quien se da de baja queda excluido de futuras campañas automáticamente.',
        ],
      },
    ],
    tip: 'Para enviar 3.000/día se necesita el plan pago del proveedor de correo (Resend). El envío es real; los "abiertos" se miden en Apertura de correos.',
    match: (p) => p.startsWith('/emails'),
  },
  {
    id: 'aperturas',
    title: 'Apertura de correos',
    intro: 'Los resultados de las campañas: quién abrió, porcentajes, historial y respuestas.',
    sections: [
      {
        heading: 'Resumen (arriba)',
        items: [
          'Enviados, Abiertos, Clics y % de apertura, de todo lo enviado.',
        ],
      },
      {
        heading: 'Historial de campañas',
        items: [
          'Cada campaña con su fecha de inicio y de fin.',
          'Audiencia, enviados, abiertos, % apertura, clics y respuestas.',
          'Haz clic en una campaña para el detalle: quién abrió, quién hizo clic y quién respondió (con el texto), con fecha y hora por persona.',
          'Cada envío es una campaña independiente (la nueva empieza limpia).',
        ],
      },
      {
        heading: 'Correos abiertos',
        items: [
          'Lista de todos los abiertos con fecha y hora y la columna "Campaña".',
          'Botón "Escribir": rediges un mensaje propio (asunto + texto) a esa persona.',
        ],
      },
      {
        heading: 'Respuestas de clientes',
        items: [
          'Llegan solas: el CRM lee el buzón cada pocos minutos y las registra.',
          'Puedes leer la respuesta ahí mismo, sin abrir el correo.',
          'También aparecen en la ficha de ese prospecto (recuadro Apertura de correos).',
        ],
      },
    ],
    tip: 'Solo empareja respuestas que llegan desde el mismo correo que está en la ficha. Si escriben desde otro, queda en la bandeja para revisar a mano.',
    match: (p) => p.startsWith('/aperturas'),
  },
  {
    id: 'clients',
    title: 'Clientes',
    intro: 'Los prospectos fidelizados, con datos de cobro, contrato y servicios.',
    sections: [
      {
        heading: 'La lista',
        items: [
          'Columna "Valor del servicio": la suma del valor mensual de los servicios activos.',
          'Busca por razón social o NIT.',
        ],
      },
      {
        heading: 'La ficha del cliente',
        items: [
          'Datos de cobro (dirección, teléfono, correo) y contacto de contabilidad.',
          'Número y fecha de contrato.',
          'Servicios contratados: agrégalos con su valor mensual.',
          'También trae los recuadros de Apertura de correos y Seguimiento.',
        ],
      },
    ],
    match: (p) => p === '/clients',
  },
  {
    id: 'invoices',
    title: 'Facturas',
    intro: 'Genera facturas en PDF a partir de los datos del cliente.',
    sections: [
      {
        heading: 'Crear una factura (paso a paso)',
        items: [
          '1) "Nueva factura" y elige el cliente fidelizado.',
          '2) El ítem trae automáticamente su servicio y valor (puedes ajustarlo o agregar más).',
          '3) Ajusta IVA, fecha de vencimiento y observaciones.',
          '4) "Crear y descargar PDF": queda lista para enviar.',
        ],
      },
    ],
    match: (p) => p.startsWith('/invoices'),
  },
  {
    id: 'tax',
    title: 'Obligaciones tributarias',
    intro: 'Controla los vencimientos de tus clientes con semáforos 🟢🟡🔴.',
    sections: [
      {
        heading: 'Cómo funciona',
        items: [
          'Verde: falta tiempo. Amarillo: se acerca. Rojo: vencida o inminente.',
          'El sistema sugiere la fecha según el Calendario DIAN 2026 y el último dígito del NIT.',
        ],
      },
      {
        heading: 'Qué hacer',
        items: [
          'Revisa primero las amarillas y rojas para no pasarte de la fecha.',
          'Registra las obligaciones de cada cliente para llevar el control.',
        ],
      },
    ],
    match: (p) => p.startsWith('/tax'),
  },
  {
    id: 'alerts',
    title: 'Alertas',
    intro: 'El panel de lo que requiere tu atención hoy.',
    sections: [
      {
        heading: 'Qué encuentra',
        items: [
          'Prospectos contactados que llevan días sin seguimiento.',
          'Obligaciones tributarias próximas a vencer o vencidas.',
        ],
      },
      {
        heading: 'Cómo usarlo',
        items: [
          'Úsalo como lista de pendientes del día.',
          'Haz clic en cada alerta para ir directo a resolverla.',
        ],
      },
    ],
    match: (p) => p.startsWith('/alerts'),
  },
  {
    id: 'users',
    title: 'Usuarios',
    intro: 'Administra quién puede entrar al sistema.',
    sections: [
      {
        heading: 'Qué puedes hacer',
        items: [
          'Crear un usuario con su correo y asignarle un rol.',
          'El usuario nuevo debe cambiar su contraseña en el primer ingreso.',
          'Activar o desactivar el acceso de alguien.',
        ],
      },
    ],
    match: (p) => p.startsWith('/admin/users'),
  },
  {
    id: 'roles',
    title: 'Roles',
    intro: 'Define qué puede ver y hacer cada tipo de usuario.',
    sections: [
      {
        heading: 'Cómo funciona',
        items: [
          'Cada rol agrupa permisos (ej. ver prospectos, enviar correos, facturar).',
          'A cada usuario le asignas el rol que corresponde a su función.',
          'Así controlas que cada quien solo acceda a lo suyo.',
        ],
      },
    ],
    match: (p) => p.startsWith('/admin/roles'),
  },
  {
    id: 'audit',
    title: 'Auditoría',
    intro: 'El registro de las acciones importantes hechas en el sistema.',
    sections: [
      {
        heading: 'Para qué sirve',
        items: [
          'Ver quién hizo qué y cuándo (crear, editar, enviar, etc.).',
          'Útil para control interno y para revisar cambios.',
        ],
      },
    ],
    match: (p) => p.startsWith('/admin/audit'),
  },
  {
    id: 'services',
    title: 'Servicios',
    intro: 'El catálogo de servicios de la firma.',
    sections: [
      {
        heading: 'Qué puedes hacer',
        items: [
          'Crear y editar servicios con su valor por defecto.',
          'Estos servicios se usan al registrar los de un cliente y al facturar.',
          'Activar o desactivar los que ya no se ofrecen.',
        ],
      },
    ],
    match: (p) => p.startsWith('/admin/services'),
  },
];

/** Id del tema que corresponde a la ruta actual (o 'general'). */
export function currentTopicId(pathname: string): string {
  const found = HELP_TOPICS.find((t) => t.match?.(pathname));
  return found?.id ?? 'general';
}
