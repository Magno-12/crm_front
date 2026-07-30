import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Briefcase,
  FileText,
  Mail,
  MailOpen,
  Settings,
  ShieldCheck,
  ScrollText,
  Receipt,
  FileSpreadsheet,
  BarChart3,
  Wallet,
  BellRing,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Permiso requerido para mostrar el ítem. */
  permission?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// Estructura acordada: mercadeo → pipeline comercial → facturación y cartera →
// administración del sistema.
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Mercadeo y prospección',
    items: [
      { label: 'Base de datos mercadeo', to: '/prospects', icon: Users, permission: 'prospects.view' },
      { label: 'Envío de correos y campañas', to: '/emails', icon: Mail, permission: 'emails.send' },
      { label: 'Seguimiento de correo', to: '/aperturas', icon: MailOpen, permission: 'emails.send' },
    ],
  },
  {
    title: 'Pipeline comercial',
    items: [
      { label: 'Seguimiento de prospecto', to: '/seguimiento', icon: ClipboardList, permission: 'prospects.view' },
      { label: 'Clientes fidelizados y contratos', to: '/clients', icon: Briefcase, permission: 'clients.view' },
      { label: 'Obligaciones y alertas', to: '/tax', icon: BellRing, permission: 'tax.view' },
    ],
  },
  {
    title: 'Facturación y cartera',
    items: [
      { label: 'Facturación', to: '/invoices', icon: FileText, permission: 'invoices.view' },
      { label: 'Recibos de caja', to: '/recibos', icon: Receipt, permission: 'payments.view' },
      { label: 'Cartera de clientes', to: '/cartera', icon: Wallet, permission: 'payments.view' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, permission: 'dashboard.view' },
      { label: 'Reportes', to: '/reportes', icon: BarChart3, permission: 'audit.view' },
      { label: 'Usuarios', to: '/admin/users', icon: Users, permission: 'users.view' },
      { label: 'Roles', to: '/admin/roles', icon: ShieldCheck, permission: 'roles.view' },
      // Sesiones dejó de ser una entrada aparte: el control de entrada y salida
      // vive dentro de Reportes, en el historial diario de cada usuario.
      { label: 'Auditoría', to: '/admin/audit', icon: ScrollText, permission: 'audit.view' },
      { label: 'Servicios', to: '/admin/services', icon: Settings, permission: 'services.view' },
      {
        label: 'Catálogo CIIU',
        to: '/admin/ciiu',
        icon: FileSpreadsheet,
        permission: 'prospects.view',
      },
    ],
  },
];
