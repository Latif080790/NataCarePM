import {
  LayoutDashboard,
  FileText,
  GanttChartSquare,
  DollarSign,
  Construction,
  CalendarDays,
  Truck,
  FileArchive,
  ShieldCheck,
  Users,
  BarChart3,
  Settings,
  History,
  UserCircle,
  CheckSquare,
  Bell,
  Monitor,
  Brain,
  BookOpen,
  BookText,
  FileDown,
  FileUp,
  Coins,
  Package,
  ClipboardList,
  Store,
  GitBranch,
  TrendingUp,
} from 'lucide-react';
import { Role, User, Permission } from '@/types';

export const ROLES_CONFIG: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    permissions: [
      'view_dashboard',
      'view_rab',
      'edit_rab',
      'approve_rab',  // Adding RAB approval permission
      'view_gantt',
      'view_daily_reports',
      'create_daily_reports',
      'view_progress',
      'update_progress',
      'view_attendance',
      'manage_attendance',
      'view_finances',
      'manage_expenses',
      'view_evm',
      'view_logistics',
      'manage_logistics',
      'create_po',
      'approve_po',
      'manage_inventory',
      'view_documents',
      'manage_documents',
      'view_reports',
      'view_users',
      'manage_users',
      'view_master_data',
      'manage_master_data',
      'view_audit_trail',
      'view_monitoring',
      'manage_monitoring',
    ],
  },
  {
    id: 'pm',
    name: 'Project Manager',
    permissions: [
      'view_dashboard',
      'view_rab',
      'edit_rab',
      'approve_rab',  // Adding RAB approval permission
      'view_gantt',
      'view_daily_reports',
      'create_daily_reports',
      'view_progress',
      'update_progress',
      'view_attendance',
      'manage_attendance',
      'view_finances',
      'manage_expenses',
      'view_evm',
      'view_logistics',
      'manage_logistics',
      'create_po',
      'approve_po',
      'manage_inventory',
      'view_documents',
      'manage_documents',
      'view_reports',
      'view_users',
      'view_master_data',
      'view_audit_trail',
      'view_monitoring',
    ],
  },
  {
    id: 'site_manager',
    name: 'Site Manager',
    permissions: [
      'view_dashboard',
      'view_gantt',
      'view_daily_reports',
      'create_daily_reports',
      'view_progress',
      'update_progress',
      'view_attendance',
      'manage_attendance',
      'view_logistics',
      'manage_logistics',
      'create_po',
      'manage_inventory',
      'view_documents',
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    permissions: ['view_dashboard', 'view_rab', 'view_finances', 'manage_expenses', 'view_evm'],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    permissions: [
      'view_dashboard',
      'view_rab',
      'view_gantt',
      'view_daily_reports',
      'view_progress',
      'view_attendance',
      'view_finances',
      'view_evm',
      'view_logistics',
      'view_documents',
    ],
  },
];

export const navLinksConfig = [
  {
    id: 'main-group',
    name: 'Utama',
    children: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: LayoutDashboard,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'analytics',
        name: 'Analytics Dashboard',
        icon: BarChart3,
        requiredPermission: 'view_dashboard',
      },
      { id: 'rab_ahsp', name: 'RAB & AHSP', icon: FileText, requiredPermission: 'view_rab' },
      {
        id: 'wbs_management',
        name: 'WBS Structure',
        icon: FileText,
        requiredPermission: 'view_rab',
      },
      {
        id: 'jadwal',
        name: 'Jadwal (Gantt)',
        icon: GanttChartSquare,
        requiredPermission: 'view_gantt',
      },
    ],
  },
  {
    id: 'ai-analytics-group',
    name: 'AI & Analytics',
    children: [
      {
        id: 'ai_resource_optimization',
        name: 'AI Resource Optimization',
        icon: Brain,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'predictive_analytics',
        name: 'Predictive Analytics',
        icon: TrendingUp,
        requiredPermission: 'view_dashboard',
      },
    ],
  },
  {
    id: 'monitoring-group',
    name: 'Monitoring',
    children: [
      {
        id: 'monitoring',
        name: 'System Monitoring',
        icon: Monitor,
        requiredPermission: 'view_monitoring',
      },
      {
        id: 'tasks',
        name: 'Task Management',
        icon: CheckSquare,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'kanban',
        name: 'Kanban Board',
        icon: CheckSquare,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'dependencies',
        name: 'Dependency Graph',
        icon: BarChart3,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'notifications',
        name: 'Notification Center',
        icon: Bell,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'laporan_harian',
        name: 'Laporan Harian',
        icon: Construction,
        requiredPermission: 'view_daily_reports',
      },
      {
        id: 'progres',
        name: 'Update Progres',
        icon: BarChart3,
        requiredPermission: 'view_progress',
      },
      { id: 'absensi', name: 'Absensi', icon: CalendarDays, requiredPermission: 'view_attendance' },
    ],
  },
  {
    id: 'keuangan-group',
    name: 'Keuangan & Akuntansi',
    children: [
      { id: 'arus_kas', name: 'Arus Kas', icon: DollarSign, requiredPermission: 'view_finances' },
      {
        id: 'biaya_proyek',
        name: 'Biaya Proyek',
        icon: DollarSign,
        requiredPermission: 'view_finances',
      },
      {
        id: 'strategic_cost',
        name: 'Biaya Strategis',
        icon: TrendingUp,
        requiredPermission: 'view_finances',
      },
      {
        id: 'cost_control',
        name: 'Cost Control Dashboard',
        icon: BarChart3,
        requiredPermission: 'view_finances',
      },
      {
        id: 'chart_of_accounts',
        name: 'Chart of Accounts',
        icon: BookOpen,
        requiredPermission: 'view_finances',
      },
      {
        id: 'journal_entries',
        name: 'Jurnal Umum',
        icon: BookText,
        requiredPermission: 'view_finances',
      },
      {
        id: 'accounts_payable',
        name: 'Hutang (AP)',
        icon: FileDown,
        requiredPermission: 'view_finances',
      },
      {
        id: 'accounts_receivable',
        name: 'Piutang (AR)',
        icon: FileUp,
        requiredPermission: 'view_finances',
      },
    ],
  },
  {
    id: 'lainnya-group',
    name: 'Lainnya',
    children: [
      { id: 'logistik', name: 'Logistik & PO', icon: Truck, requiredPermission: 'view_logistics' },
      {
        id: 'material_request',
        name: 'Material Request',
        icon: ClipboardList,
        requiredPermission: 'view_logistics',
      },
      {
        id: 'goods_receipt',
        name: 'Goods Receipt',
        icon: Package,
        requiredPermission: 'view_logistics',
      },
      {
        id: 'vendor_management',
        name: 'Vendor Management',
        icon: Store,
        requiredPermission: 'view_logistics',
      },
      {
        id: 'inventory_management',
        name: 'Inventory Management',
        icon: Package,
        requiredPermission: 'view_logistics',
      },
      {
        id: 'integration_dashboard',
        name: 'Integration & Automation',
        icon: GitBranch,
        requiredPermission: 'manage_settings',
      },
      { id: 'dokumen', name: 'Dokumen', icon: FileArchive, requiredPermission: 'view_documents' },
      {
        id: 'documents',
        name: 'Intelligent Documents',
        icon: Brain,
        requiredPermission: 'view_documents',
      },
      {
        id: 'custom_report_builder',
        name: 'Custom Report Builder',
        icon: FileText,
        requiredPermission: 'view_reports',
      },
      { id: 'laporan', name: 'Laporan Proyek', icon: FileText, requiredPermission: 'view_reports' },
    ],
  },
  {
    id: 'pengaturan-group',
    name: 'Pengaturan',
    children: [
      {
        id: 'profile',
        name: 'Profil Saya',
        icon: UserCircle,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'user_management',
        name: 'Manajemen User',
        icon: Users,
        requiredPermission: 'view_users',
      },
      {
        id: 'master_data',
        name: 'Master Data',
        icon: Settings,
        requiredPermission: 'view_master_data',
      },
      {
        id: 'audit_trail',
        name: 'Jejak Audit',
        icon: History,
        requiredPermission: 'view_audit_trail',
      },
    ],
  },
] as const;

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  // Development mode: if no user or role, allow all permissions for testing
  if (!user) {
    console.warn('⚠️ No user found - allowing all permissions for development');
    return true; // Allow access in development
  }

  const userRole = ROLES_CONFIG.find((r) => r.id === user.roleId);
  if (!userRole) {
    console.warn(
      `⚠️ No role found for roleId: ${user.roleId} - allowing all permissions for development`
    );
    return true; // Allow access if role not configured
  }

  const hasAccess = userRole.permissions.includes(permission);
  console.log(`🔐 Permission check: ${permission} for role ${userRole.name} = ${hasAccess}`);
  return hasAccess;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const addDays = (date: Date | string, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
