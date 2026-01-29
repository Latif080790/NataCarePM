import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext.minimal';
import { useDeviceType } from '@/hooks/useDeviceType';
import {
    DollarSign,
    Target,
    Users,
    Clock,
    Download,
    Plus,
    TrendingUp,
    CheckCircle,
    Bell,
    Package,
    FileText
} from 'lucide-react';
import {
    StatCardPro,
    StatCardSkeleton,
    StatCardGrid,
    CardPro,
    ButtonPro,
    EnterpriseLayout
} from '@/components/DesignSystem';
import MobileLayout, { MobileSection, MobileCard } from '@/components/MobileLayout'; // Adjusted import based on assumption, will verify
import { ProjectMetrics } from '@/types';
import { formatCurrency, formatDate } from '@/constants';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

// --- Mobile Components (Inline for distinct mobile experience) ---
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
        primary: 'bg-blue-50 text-blue-600',
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
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 active:bg-gray-50 cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.primary}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <TrendingUp
                        className={`w-4 h-4 ${trendColors[trend]} ${trend === 'down' ? 'rotate-180' : ''}`}
                    />
                )}
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-xs text-gray-600">{label}</p>
        </div>
    );
}

// --- Main Dashboard Component ---

export default function DashboardView() {
    const { currentProject, loading, error, notifications } = useProject();
    const { currentUser } = useAuth();
    const { isMobile } = useDeviceType();
    const navigate = useNavigate();
    const [isLoadingUI, setIsLoadingUI] = useState(true);

    // Simulate UI loading for smooth transition
    useEffect(() => {
        const timer = setTimeout(() => setIsLoadingUI(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading || (!currentProject && !error)) {
        return isMobile ? (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        ) : (
            <div className="layout-page"><div className="layout-content"><DashboardSkeleton /></div></div>
        );
    }

    if (error || !currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-4 text-center">
                <p className="font-bold text-lg mb-2">Gagal Memuat Dashboard</p>
                <p>{error?.message || 'Tidak dapat memuat data dashboard.'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Muat Ulang
                </button>
            </div>
        );
    }

    // Calculate Metrics
    const totalBudget = currentProject.items?.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0) || 0;
    const actualCost = currentProject.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    const progressPercent = 35; // Mock progress
    const remainingBudget = totalBudget - actualCost;
    const budgetUtilization = totalBudget > 0 ? (actualCost / totalBudget) * 100 : 0;

    // --- Mobile View ---
    if (isMobile) {
        return (
            <div className="space-y-4 p-4 pb-20"> {/* pb-20 for bottom nav safety */}
                {/* Welcome Section */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                    <h2 className="text-lg font-bold mb-1">Hai, {currentUser?.name?.split(' ')[0] || 'User'}!</h2>
                    <p className="text-sm text-blue-100">{currentProject.name}</p>
                </div>

                {/* Quick Stats Grid */}
                <h3 className="font-semibold text-gray-800 ml-1">Ringkasan Proyek</h3>
                <div className="grid grid-cols-2 gap-3">
                    <QuickStat
                        icon={DollarSign}
                        label="Anggaran"
                        value={formatCurrency(totalBudget)}
                        color="primary"
                        onClick={() => navigate('/rab')}
                    />
                    <QuickStat
                        icon={TrendingUp}
                        label="Pengeluaran"
                        value={formatCurrency(actualCost)}
                        color="warning" // Warning color for spending
                        trend="up"
                        onClick={() => navigate('/finance')}
                    />
                    <QuickStat
                        icon={CheckCircle}
                        label="Progress"
                        value={`${progressPercent}%`}
                        color="success"
                        trend="up"
                        onClick={() => navigate('/progress')}
                    />
                    <QuickStat
                        icon={Package}
                        label="Tugas"
                        value="12 Aktif" // Mock
                        color="primary"
                        onClick={() => navigate('/tasks')}
                    />
                </div>

                {/* Quick Actions */}
                <h3 className="font-semibold text-gray-800 ml-1 pt-2">Aksi Cepat</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate('/daily-logs')}
                        className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 border-blue-50 text-blue-600 active:bg-blue-50 shadow-sm"
                    >
                        <FileText className="w-6 h-6" />
                        <span className="text-sm font-medium">Buat Laporan</span>
                    </button>
                    <button
                        onClick={() => navigate('/inventory')}
                        className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 border-blue-50 text-blue-600 active:bg-blue-50 shadow-sm"
                    >
                        <Package className="w-6 h-6" />
                        <span className="text-sm font-medium">Cek Inventori</span>
                    </button>
                </div>
            </div>
        );
    }

    // --- Desktop View ---
    return (
        <EnterpriseLayout>
            <header className="bg-white border-b border-gray-200 mb-8">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">{currentProject.name}</h1>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Updated {formatDate(new Date())}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>{currentProject.members?.length || 0} members</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ButtonPro variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </ButtonPro>
                            <ButtonPro variant="primary">
                                <Plus className="w-4 h-4 mr-2" />
                                New Task
                            </ButtonPro>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 pb-8">
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
                    {isLoadingUI ? (
                        <StatCardGrid>
                            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
                        </StatCardGrid>
                    ) : (
                        <StatCardGrid>
                            <StatCardPro
                                title="Total Budget"
                                value={formatCurrency(totalBudget)}
                                icon={DollarSign}
                                description={`${formatCurrency(remainingBudget)} remaining`}
                                variant="primary"
                            />
                            <StatCardPro
                                title="Overall Progress"
                                value={`${progressPercent}%`}
                                icon={Target}
                                trend={{ value: 5.2, label: 'vs last week' }}
                                variant="success"
                            />
                            <StatCardPro
                                title="Budget Utilized"
                                value={`${budgetUtilization.toFixed(1)}%`}
                                icon={TrendingUp}
                                description={`${formatCurrency(actualCost)} spent`}
                                variant={budgetUtilization > 90 ? 'warning' : 'default'}
                            />
                            <StatCardPro
                                title="Team Members"
                                value={currentProject.members?.length || 0}
                                icon={Users}
                                description="Active collaborators"
                            />
                        </StatCardGrid>
                    )}
                </section>

                {/* Detailed Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress Card */}
                        <CardPro className="bg-white border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4">Project Progress</h3>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Planning: 100%</span>
                                <span>Execution: 35%</span>
                                <span>Closing: 0%</span>
                            </div>
                        </CardPro>
                    </div>

                    <div className="space-y-6">
                        {/* Notifications */}
                        <CardPro className="bg-white border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                            <div className="space-y-4">
                                {notifications?.slice(0, 5).map(n => (
                                    <div key={n.id} className="flex gap-3 text-sm">
                                        <Bell className="w-4 h-4 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium">{n.title}</p>
                                            <p className="text-gray-500">{n.message}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!notifications || notifications.length === 0) && <p className="text-gray-500 text-sm">No new notifications.</p>}
                            </div>
                        </CardPro>
                    </div>
                </div>
            </div>
        </EnterpriseLayout>
    );
}
