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
  BellRing,
  Receipt,
  Clock,
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

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Base de datos mercadeo', to: '/prospects', icon: Users, permission: 'prospects.view' },
      { label: 'Envío de correos', to: '/emails', icon: Mail, permission: 'emails.send' },
      { label: 'Seguimiento de correo', to: '/aperturas', icon: MailOpen, permission: 'emails.send' },
      { label: 'Seguimiento de prospecto', to: '/seguimiento', icon: ClipboardList, permission: 'prospects.view' },
      { label: 'Clientes fidelizados', to: '/clients', icon: Briefcase, permission: 'clients.view' },
      { label: 'Facturas', to: '/invoices', icon: FileText, permission: 'invoices.view' },
      { label: 'Obligaciones', to: '/tax', icon: Receipt, permission: 'tax.view' },
      { label: 'Alertas', to: '/alerts', icon: BellRing, permission: 'dashboard.view' },
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, permission: 'dashboard.view' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Usuarios', to: '/admin/users', icon: Users, permission: 'users.view' },
      { label: 'Roles', to: '/admin/roles', icon: ShieldCheck, permission: 'roles.view' },
      { label: 'Sesiones', to: '/admin/sessions', icon: Clock, permission: 'audit.view' },
      { label: 'Auditoría', to: '/admin/audit', icon: ScrollText, permission: 'audit.view' },
      { label: 'Servicios', to: '/admin/services', icon: Settings, permission: 'services.view' },
    ],
  },
];
