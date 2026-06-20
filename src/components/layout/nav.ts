import {
  LayoutDashboard,
  Users,
  Target,
  Briefcase,
  FileText,
  Mail,
  Settings,
  ShieldCheck,
  ScrollText,
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
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, permission: 'dashboard.view' },
      { label: 'Prospectos', to: '/prospects', icon: Users, permission: 'prospects.view' },
      { label: 'Oportunidades', to: '/opportunities', icon: Target, permission: 'opportunities.view' },
      { label: 'Clientes', to: '/clients', icon: Briefcase, permission: 'clients.view' },
      { label: 'Facturas', to: '/invoices', icon: FileText, permission: 'invoices.view' },
      { label: 'Correos', to: '/emails', icon: Mail, permission: 'emails.send' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Usuarios', to: '/admin/users', icon: Users, permission: 'users.view' },
      { label: 'Roles', to: '/admin/roles', icon: ShieldCheck, permission: 'roles.view' },
      { label: 'Auditoría', to: '/admin/audit', icon: ScrollText, permission: 'audit.view' },
      { label: 'Servicios', to: '/admin/services', icon: Settings, permission: 'services.view' },
    ],
  },
];
