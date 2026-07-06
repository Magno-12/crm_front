// Contenido de ayuda ("¿Cómo funciona?") por pantalla.
// Texto sencillo y no técnico, pensado para quien usa el CRM día a día.

export interface HelpSection {
  heading: string;
  items: string[];
}

export interface HelpTopic {
  /** Título de la pantalla, se muestra en el encabezado del popup. */
  title: string;
  /** Frase corta que explica para qué sirve la pantalla. */
  intro: string;
  sections: HelpSection[];
  /** Consejo final opcional. */
  tip?: string;
}

const GENERAL: HelpTopic = {
  title: 'CRM Proyectamos',
  intro: 'Este es su CRM contable y tributario. Aquí gestiona prospectos, clientes, correos, facturas y obligaciones.',
  sections: [
    {
      heading: 'Cómo moverse',
      items: [
        'Use el menú de la izquierda para cambiar de pantalla.',
        'El botón "¿Cómo funciona?" (abajo a la derecha) está en todas las pantallas y explica la que esté viendo.',
        'Arriba a la derecha, en el ícono con su inicial, puede cerrar sesión.',
      ],
    },
    {
      heading: 'Orden recomendado',
      items: [
        'Base de datos mercadeo → busque y contacte prospectos.',
        'Seguimiento → trabaje los que ya contactó hasta fidelizarlos.',
        'Clientes y Facturas → registre el contrato y facture.',
        'Correos → envíe campañas y mida aperturas.',
      ],
    },
  ],
  tip: 'Cada pantalla tiene su propia ayuda: abra este botón dentro de la pantalla que quiera entender.',
};

const TOPICS: Record<string, HelpTopic> = {
  dashboard: {
    title: 'Dashboard',
    intro: 'Un resumen general del negocio: cómo van los prospectos, las ventas y los correos.',
    sections: [
      {
        heading: 'Qué muestra',
        items: [
          'Indicadores: prospectos nuevos, conversión, facturación y % de apertura de correos.',
          'Gráficas: tendencia de prospectos, facturación, ciudades, actividades y top clientes.',
          'Aperturas de correo: quiénes abrieron sus campañas.',
        ],
      },
      {
        heading: 'Cómo usarlo',
        items: [
          'Revíselo al iniciar el día para ver el estado general.',
          'En "Aperturas de correo", haga clic en un nombre para ir a la ficha de ese prospecto.',
        ],
      },
    ],
  },
  prospects: {
    title: 'Base de datos mercadeo',
    intro: 'Aquí está toda la base de prospectos (posibles clientes) para buscar, filtrar y contactar.',
    sections: [
      {
        heading: 'Buscar y filtrar',
        items: [
          'Busque por nombre (razón social) o por NIT.',
          'Filtre por actividad económica (CIIU), rango de ingresos y rango de patrimonio.',
          'Segmente por tipo: personas naturales, jurídicas, alcaldías, ESE, otros.',
        ],
      },
      {
        heading: 'Trabajar un prospecto',
        items: [
          'Haga clic en un prospecto para abrir su ficha completa.',
          'Al "Contactar", pasa automáticamente a la pantalla de Seguimiento.',
          'Puede importar más prospectos desde un archivo de Excel.',
        ],
      },
    ],
    tip: 'Al escribir el NIT, el sistema trae solo la razón social y la actividad económica.',
  },
  prospectDetail: {
    title: 'Ficha del prospecto',
    intro: 'Toda la información de un prospecto y su historial de contacto en un solo lugar.',
    sections: [
      {
        heading: 'Datos que puede editar',
        items: [
          'Representante legal y su cédula.',
          'Persona de contacto (nombre, cargo, teléfono, correo).',
          'Dirección, teléfonos, matrícula mercantil y actividad (CIIU).',
        ],
      },
      {
        heading: 'Seguimiento e historial',
        items: [
          'Registre interacciones: llamada, correo, reunión, WhatsApp, visita o nota.',
          'Vea los correos enviados y cuáles fueron abiertos.',
          'Cuando el prospecto se fideliza, se le invita a registrar el contrato/servicio.',
        ],
      },
    ],
  },
  seguimiento: {
    title: 'Seguimiento',
    intro: 'Solo los prospectos que ya contactó, para hacerles gestión hasta convertirlos en clientes.',
    sections: [
      {
        heading: 'Cómo funciona',
        items: [
          'Aparecen únicamente los prospectos en estado "Contactado".',
          'Abra cada uno para ver su mini-historial y registrar nuevas interacciones.',
          'Estados: Nuevo → Contactado → Fidelizado (o No fidelizado).',
        ],
      },
      {
        heading: 'Convertir en cliente',
        items: [
          'Al marcar un prospecto como "Fidelizado", regístrelo como cliente.',
          'Ahí anota el servicio contratado y el valor del contrato.',
        ],
      },
    ],
  },
  clients: {
    title: 'Clientes',
    intro: 'Los prospectos que ya se convirtieron en clientes, con sus datos de cobro y contrato.',
    sections: [
      {
        heading: 'Qué guarda',
        items: [
          'Datos de cobro: dirección, teléfono y correo.',
          'Contacto de contabilidad (nombre, teléfono, correo).',
          'Número y fecha del contrato, y los servicios contratados con su valor.',
        ],
      },
      {
        heading: 'Cómo usarlo',
        items: [
          'Abra un cliente para ver o editar sus datos.',
          'Desde aquí se generan las facturas con el servicio y valor ya cargados.',
        ],
      },
    ],
  },
  clientDetail: {
    title: 'Ficha del cliente',
    intro: 'Toda la información de un cliente: datos de cobro, contrato y servicios.',
    sections: [
      {
        heading: 'Qué puede hacer',
        items: [
          'Editar datos de cobro y el contacto de contabilidad.',
          'Registrar el número y la fecha del contrato.',
          'Ver y ajustar los servicios contratados y su valor.',
        ],
      },
    ],
  },
  emails: {
    title: 'Correos',
    intro: 'Cree plantillas, envíe correos individuales o campañas masivas y mida quién los abre.',
    sections: [
      {
        heading: 'Plantillas',
        items: [
          'Use "Nueva plantilla" y elija un diseño (incluye "Proyectamos · ICA" y "Proyectamos · Renta").',
          'Edite textos, fechas, montos y viñetas; la vista previa cambia en vivo.',
          'Personalice con $razon_social, $nit o $ciudad: se reemplazan por los datos de cada prospecto.',
          'También puede pegar su propio HTML si ya tiene un diseño.',
        ],
      },
      {
        heading: 'Enviar una campaña',
        items: [
          'Elija plantilla, segmento (a quién) y desde qué cuenta sale.',
          'Puede enviar a cualquier correo, sea o no prospecto.',
          'Marque "no repetir" para no reenviar la misma campaña a quien ya la recibió.',
          'Límite de hasta 3.000 correos por día.',
        ],
      },
      {
        heading: 'Aperturas',
        items: [
          'El sistema detecta quién abrió y quién hizo clic.',
          'Lo ve aquí, en la ficha de cada prospecto y en el Dashboard.',
        ],
      },
    ],
    tip: 'Las plantillas de ICA y Renta ya vienen cargadas y son 100% editables antes de enviar.',
  },
  invoices: {
    title: 'Facturas',
    intro: 'Genere facturas en PDF con buen diseño a partir de los datos del cliente.',
    sections: [
      {
        heading: 'Crear una factura',
        items: [
          'Use "Nueva" y elija un cliente fidelizado.',
          'El servicio y el valor se cargan automáticamente desde el cliente.',
          'Genere el PDF listo para enviar.',
        ],
      },
    ],
  },
  tax: {
    title: 'Obligaciones tributarias',
    intro: 'Controle los vencimientos tributarios de sus clientes con semáforos 🟢🟡🔴.',
    sections: [
      {
        heading: 'Cómo funciona',
        items: [
          'Cada obligación muestra un semáforo según qué tan cerca está el vencimiento.',
          'El sistema sugiere la fecha según el Calendario DIAN 2026 y el último dígito del NIT.',
        ],
      },
      {
        heading: 'Qué hacer',
        items: [
          'Revise las que estén en amarillo o rojo para no pasarse de la fecha.',
          'Registre las obligaciones de cada cliente para llevar el control.',
        ],
      },
    ],
  },
  alerts: {
    title: 'Alertas',
    intro: 'Un panel con lo que requiere su atención: prospectos sin gestión y vencimientos próximos.',
    sections: [
      {
        heading: 'Qué encuentra',
        items: [
          'Prospectos contactados que llevan tiempo sin seguimiento.',
          'Obligaciones tributarias próximas a vencer.',
        ],
      },
      {
        heading: 'Cómo usarlo',
        items: ['Úselo como lista de pendientes y haga clic para ir a resolver cada punto.'],
      },
    ],
  },
  users: {
    title: 'Usuarios',
    intro: 'Administre quién puede entrar al sistema y con qué permisos.',
    sections: [
      {
        heading: 'Qué puede hacer',
        items: [
          'Crear usuarios y asignarles un rol.',
          'Activar o desactivar el acceso.',
          'El usuario nuevo debe cambiar su contraseña en el primer ingreso.',
        ],
      },
    ],
  },
  roles: {
    title: 'Roles',
    intro: 'Defina conjuntos de permisos y asígnelos a los usuarios.',
    sections: [
      {
        heading: 'Cómo funciona',
        items: [
          'Cada rol agrupa permisos (qué puede ver y hacer).',
          'Asigne el rol adecuado a cada usuario según su función.',
        ],
      },
    ],
  },
  audit: {
    title: 'Auditoría',
    intro: 'El registro de las acciones importantes hechas en el sistema.',
    sections: [
      {
        heading: 'Para qué sirve',
        items: [
          'Ver quién hizo qué y cuándo.',
          'Útil para control interno y seguimiento de cambios.',
        ],
      },
    ],
  },
  services: {
    title: 'Servicios',
    intro: 'El catálogo de servicios que ofrece la firma y que se usan en clientes y facturas.',
    sections: [
      {
        heading: 'Qué puede hacer',
        items: [
          'Crear y editar servicios con su valor por defecto.',
          'Activar o desactivar los que ya no se ofrecen.',
        ],
      },
    ],
  },
};

/** Devuelve la ayuda que corresponde a la ruta actual. */
export function getHelpTopic(pathname: string): HelpTopic {
  if (pathname === '/') return TOPICS.dashboard!;
  if (pathname.startsWith('/prospects/')) return TOPICS.prospectDetail!;
  if (pathname === '/prospects') return TOPICS.prospects!;
  if (pathname.startsWith('/seguimiento')) return TOPICS.seguimiento!;
  if (pathname.startsWith('/clients/')) return TOPICS.clientDetail!;
  if (pathname === '/clients') return TOPICS.clients!;
  if (pathname.startsWith('/emails')) return TOPICS.emails!;
  if (pathname.startsWith('/invoices')) return TOPICS.invoices!;
  if (pathname.startsWith('/tax')) return TOPICS.tax!;
  if (pathname.startsWith('/alerts')) return TOPICS.alerts!;
  if (pathname.startsWith('/admin/users')) return TOPICS.users!;
  if (pathname.startsWith('/admin/roles')) return TOPICS.roles!;
  if (pathname.startsWith('/admin/audit')) return TOPICS.audit!;
  if (pathname.startsWith('/admin/services')) return TOPICS.services!;
  return GENERAL;
}
