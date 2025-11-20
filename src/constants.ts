import { Permission, Role, User } from '@/types';
import {
    BarChart3,
    Bell,
    BookOpen,
    BookText,
    Brain,
    CalendarDays,
    CheckSquare,
    ClipboardList,
    DollarSign,
    FileDown,
    FileText,
    FileUp,
    GanttChartSquare,
    GitBranch,
    History,
    LayoutDashboard,
    Monitor,
    Package,
    Settings,
    Store,
    TrendingUp,
    Truck,
    UserCircle,
    Users,
} from 'lucide-react';

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
  {
    id: 'user',
    name: 'User',
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
      'view_reports',
    ],
  },
];

export const navLinksConfig = [
  {
    id: 'project-management',
    name: 'Manajemen Proyek',
    children: [
      {
        id: 'dashboard',
        name: 'Dashboard Utama',
        path: '/',
        icon: LayoutDashboard,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'schedule',
        name: 'Jadwal & Gantt',
        path: '/schedule',
        icon: GanttChartSquare,
        requiredPermission: 'view_gantt',
      },
      {
        id: 'tasks',
        name: 'Tugas & Kanban',
        path: '/tasks',
        icon: CheckSquare,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'wbs',
        name: 'Struktur WBS',
        path: '/wbs',
        icon: GitBranch,
        requiredPermission: 'view_rab',
      },
      {
        id: 'timeline',
        name: 'Timeline Tracking',
        path: '/timeline',
        icon: CalendarDays,
        requiredPermission: 'view_dashboard',
      },
    ],
  },
  {
    id: 'field-operations',
    name: 'Operasional Lapangan',
    children: [
      {
        id: 'daily-reports',
        name: 'Laporan Harian',
        path: '/reports/daily',
        icon: ClipboardList,
        requiredPermission: 'view_daily_reports',
      },
      {
        id: 'progress',
        name: 'Update Progres',
        path: '/reports/progress',
        icon: TrendingUp,
        requiredPermission: 'view_progress',
      },
      {
        id: 'attendance',
        name: 'Absensi Tim',
        path: '/attendance',
        icon: Users,
        requiredPermission: 'view_attendance',
      },
    ],
  },
  {
    id: 'finance-cost',
    name: 'Keuangan & Biaya',
    children: [
      {
        id: 'rab',
        name: 'RAB & AHSP',
        path: '/rab',
        icon: FileText,
        requiredPermission: 'view_rab',
      },
      {
        id: 'cost-control',
        name: 'Kontrol Biaya',
        path: '/finance/cost-control',
        icon: BarChart3,
        requiredPermission: 'view_finances',
      },
      {
        id: 'cashflow',
        name: 'Arus Kas',
        path: '/finance/cashflow',
        icon: DollarSign,
        requiredPermission: 'view_finances',
      },
      {
        id: 'journal',
        name: 'Jurnal Umum',
        path: '/finance/journal-entries',
        icon: BookText,
        requiredPermission: 'view_finances',
      },
      {
        id: 'coa',
        name: 'Chart of Accounts',
        path: '/finance/chart-of-accounts',
        icon: BookOpen,
        requiredPermission: 'view_finances',
      },
      {
        id: 'ap',
        name: 'Hutang (AP)',
        path: '/finance/accounts-payable',
        icon: FileDown,
        requiredPermission: 'view_finances',
      },
      {
        id: 'ar',
        name: 'Piutang (AR)',
        path: '/finance/accounts-receivable',
        icon: FileUp,
        requiredPermission: 'view_finances',
      },
    ],
  },
  {
    id: 'logistics-assets',
    name: 'Logistik & Aset',
    children: [
      {
        id: 'inventory',
        name: 'Inventaris & Stok',
        path: '/logistics/inventory',
        icon: Package,
        requiredPermission: 'view_logistics',
      },
      {
        id: 'material-request',
        name: 'Permintaan Material',
        path: '/logistics/material-request',
        icon: Truck,
        requiredPermission: 'view_logistics',
      },
      {
        id: 'goods-receipt',
        name: 'Penerimaan Barang',
        path: '/logistics/goods-receipt',
        icon: ClipboardList,
        requiredPermission: 'view_logistics',
      },
      {
        id: 'vendor-management',
        name: 'Manajemen Vendor',
        path: '/logistics/vendor-management',
        icon: Store,
        requiredPermission: 'view_logistics',
      },
    ],
  },
  {
    id: 'documents-reports',
    name: 'Dokumen & Laporan',
    children: [
      {
        id: 'documents',
        name: 'Dokumen Pintar',
        path: '/documents',
        icon: Brain,
        requiredPermission: 'view_documents',
      },
      {
        id: 'reports',
        name: 'Pusat Laporan',
        path: '/reports',
        icon: FileText,
        requiredPermission: 'view_reports',
      },
      {
        id: 'custom-report',
        name: 'Custom Report',
        path: '/reports/custom-builder',
        icon: FileText,
        requiredPermission: 'view_reports',
      },
    ],
  },
  {
    id: 'system-settings',
    name: 'Sistem & Pengaturan',
    children: [
      {
        id: 'profile',
        name: 'Profil Saya',
        path: '/profile',
        icon: UserCircle,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'notifications',
        name: 'Notifikasi',
        path: '/notifications',
        icon: Bell,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'users',
        name: 'Manajemen User',
        path: '/settings/users',
        icon: Users,
        requiredPermission: 'view_users',
      },
      {
        id: 'master-data',
        name: 'Master Data',
        path: '/settings/master-data',
        icon: Settings,
        requiredPermission: 'view_master_data',
      },
      {
        id: 'audit',
        name: 'Jejak Audit',
        path: '/settings/audit-trail',
        icon: History,
        requiredPermission: 'view_audit_trail',
      },
      {
        id: 'monitoring',
        name: 'Monitoring Sistem',
        path: '/monitoring',
        icon: Monitor,
        requiredPermission: 'view_monitoring',
      },
    ],
  },
] as const;

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  // Development mode: if no user or role, allow all permissions for testing
  if (!user) {
    return true; // Allow access in development
  }

  const userRole = ROLES_CONFIG.find((r) => r.id === user.roleId);
  if (!userRole) {
    // Silently allow access if role not configured (development mode)
    return true;
  }

  return userRole.permissions.includes(permission);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateInput: string | Date | { toDate?: () => Date } | null | undefined): string => {
  try {
    // Handle null/undefined
    if (!dateInput) {
      return '-';
    }

    // Handle Firestore Timestamp (has toDate method)
    if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      const date = dateInput.toDate();
      if (isNaN(date.getTime())) return '-';
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }

    // Handle Date object
    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) {
        console.warn('[formatDate] Invalid Date object:', dateInput);
        return '-';
      }
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(dateInput);
    }

    // Handle string (only possibility left after above checks)
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      
      // Validate date
      if (isNaN(date.getTime())) {
        console.warn('[formatDate] Invalid date string:', dateInput);
        return '-';
      }

      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }

    // Fallback for unexpected types
    console.warn('[formatDate] Unexpected date type:', typeof dateInput, dateInput);
    return '-';
  } catch (error) {
    console.error('[formatDate] Error formatting date:', error, dateInput);
    return '-';
  }
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const addDays = (date: Date | string, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
