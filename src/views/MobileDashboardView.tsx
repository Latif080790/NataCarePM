/**
 * Mobile Dashboard View - Lightweight version for mobile devices
 * 
 * Key optimizations:
 * - Lazy-loaded charts (only on fast network)
 * - Simplified data display
 * - Touch-friendly UI
 * - Reduced API calls
 */

import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  FileText, 
  Package, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext.minimal';
import { useDeviceType, useDeviceCheck } from '@/hooks/useDeviceType';
import { MobileCard, MobileSection } from '@/components/MobileLayout';
import { SpinnerPro } from '@/components/SpinnerPro';

// Lazy load chart component (heavy dependency)
const MiniChart = lazy(() => import('@/components/MiniChart').catch(() => 
  // Fallback if component doesn't exist
  ({ default: () => <div className="text-sm text-gray-400">Chart unavailable</div> })
));

interface QuickStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

function QuickStat({ icon: Icon, label, value, trend, color = 'primary', onClick }: QuickStatProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
  };

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  return (
    <div 
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 active:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <TrendingUp 
            className={`w-4 h-4 ${trendColors[trend]} ${trend === 'down' ? 'rotate-180' : ''}`} 
          />
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

interface TaskItemProps {
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dueDate?: string;
  onClick?: () => void;
}

function TaskItem({ title, status, dueDate, onClick }: TaskItemProps) {
  const statusConfig = {
    'pending': { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
    'in-progress': { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
    'completed': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
    'overdue': { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div 
      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 active:bg-gray-50"
      onClick={onClick}
    >
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        {dueDate && (
          <p className="text-xs text-gray-500">{dueDate}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Mobile Dashboard View Component
 */
export default function MobileDashboardView() {
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const { currentUser } = useAuth();
  const { networkQuality } = useDeviceType();
  
  // Only show charts on fast network
  const shouldLoadChart = useDeviceCheck(
    device => device.networkQuality === 'fast'
  );

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Pilih proyek terlebih dahulu</p>
      </div>
    );
  }

  // Mock data - replace with real data from API
  const stats = {
    budget: 'Rp 2.5M',
    expenses: 'Rp 1.8M',
    progress: '72%',
    tasks: 12,
  };

  const recentTasks = [
    { id: 1, title: 'Pengecoran lantai 2', status: 'in-progress' as const, dueDate: 'Hari ini' },
    { id: 2, title: 'Pemeriksaan material', status: 'pending' as const, dueDate: 'Besok' },
    { id: 3, title: 'Laporan mingguan', status: 'overdue' as const, dueDate: '2 hari lalu' },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <MobileSection>
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-lg">
          <h2 className="text-lg font-bold mb-1">Selamat datang, {currentUser?.name?.split(' ')[0] || 'User'}!</h2>
          <p className="text-sm text-primary-100">{currentProject.name}</p>
        </div>
      </MobileSection>

      {/* Quick Stats */}
      <MobileSection title="Ringkasan">
        <div className="grid grid-cols-2 gap-3">
          <QuickStat
            icon={DollarSign}
            label="Anggaran"
            value={stats.budget}
            color="primary"
            onClick={() => navigate('/rab')}
          />
          <QuickStat
            icon={TrendingUp}
            label="Pengeluaran"
            value={stats.expenses}
            color="warning"
            trend="up"
            onClick={() => navigate('/finance')}
          />
          <QuickStat
            icon={CheckCircle}
            label="Progress"
            value={stats.progress}
            color="success"
            trend="up"
            onClick={() => navigate('/progress')}
          />
          <QuickStat
            icon={Package}
            label="Tugas Aktif"
            value={stats.tasks}
            color="primary"
            onClick={() => navigate('/tasks')}
          />
        </div>
      </MobileSection>

      {/* Progress Chart - Only on fast network */}
      {shouldLoadChart && (
        <MobileSection title="Tren Progress">
          <MobileCard>
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <SpinnerPro size="md" />
              </div>
            }>
              <MiniChart />
            </Suspense>
          </MobileCard>
        </MobileSection>
      )}

      {/* Recent Tasks */}
      <MobileSection title="Tugas Terbaru">
        <div className="space-y-2">
          {recentTasks.map(task => (
            <TaskItem
              key={task.id}
              title={task.title}
              status={task.status}
              dueDate={task.dueDate}
              onClick={() => navigate('/tasks')}
            />
          ))}
        </div>
      </MobileSection>

      {/* Quick Actions */}
      <MobileSection title="Aksi Cepat">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/daily-logs')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 border-primary-200 text-primary-600 active:bg-primary-50"
          >
            <FileText className="w-6 h-6" />
            <span className="text-sm font-medium">Buat Laporan</span>
          </button>
          <button
            onClick={() => navigate('/inventory')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 border-primary-200 text-primary-600 active:bg-primary-50"
          >
            <Package className="w-6 h-6" />
            <span className="text-sm font-medium">Cek Inventori</span>
          </button>
        </div>
      </MobileSection>

      {/* Network Quality Indicator (for debugging) */}
      {networkQuality !== 'fast' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            📶 Koneksi {networkQuality === 'slow' ? 'lambat' : 'sedang'} - Beberapa fitur dinonaktifkan
          </p>
        </div>
      )}
    </div>
  );
}
