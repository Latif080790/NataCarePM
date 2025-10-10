import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layouts } from 'react-grid-layout';
import { Project, ProjectMetrics, Notification, AiInsight } from '../types';
import { StatCard } from '../components/StatCard';
import { RadialProgress } from '../components/GaugeChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Progress } from '../components/Progress';
import { formatCurrency, formatDate } from '../constants';
import { DollarSign, BarChart3, AlertTriangle, CheckCircle, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardViewProps {
  projectMetrics: ProjectMetrics;
  recentReports: any[]; // Simplified for grid
  notifications: Notification[];
  project: Project;
  updateAiInsight: () => Promise<void>;
}

const AiInsightWidget = ({ insight, onRefresh, isLoading }: { insight?: AiInsight, onRefresh: () => void, isLoading: boolean }) => (
    <Card className="flex flex-col h-full">
        <CardHeader>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-persimmon"/>
                    <CardTitle>AI Project Insights</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            <CardDescription>Analisis dan prediksi oleh Google Gemini</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            {isLoading ? (
                <div className="flex items-center justify-center h-full"><Spinner /></div>
            ) : !insight ? (
                <p className="text-sm text-palladium text-center">Belum ada insight. Klik refresh untuk menghasilkan.</p>
            ) : (
                <div className="space-y-3 text-sm">
                    <div>
                        <h4 className="font-semibold">Ringkasan</h4>
                        <p className="text-palladium">{insight.summary}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold">Potensi Risiko</h4>
                        <ul className="list-disc list-inside text-palladium">
                            {insight.risks.map((risk, i) => <li key={i}>{risk}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold">Prediksi</h4>
                        <p className="text-palladium">{insight.predictions}</p>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
);

const defaultLayouts: Layouts = {
    lg: [
      { i: 'progress', x: 0, y: 0, w: 1, h: 1 },
      { i: 'cost', x: 1, y: 0, w: 1, h: 1 },
      { i: 'cpi', x: 2, y: 0, w: 1, h: 1 },
      { i: 'spi', x: 3, y: 0, w: 1, h: 1 },
      { i: 'radial-progress', x: 0, y: 1, w: 1, h: 2 },
      { i: 'budget-summary', x: 1, y: 1, w: 1, h: 2 },
      { i: 'notifications', x: 2, y: 1, w: 2, h: 2 },
      { i: 'ai-insight', x: 0, y: 3, w: 4, h: 3 },
    ],
};

const getLayoutsFromLS = (key: string): Layouts | null => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Failed to parse dashboard layout from localStorage", e);
        return null;
    }
};

export default function DashboardView({ projectMetrics, recentReports, notifications, project, updateAiInsight }: DashboardViewProps) {
  const { totalBudget, actualCost, overallProgress, evm } = projectMetrics;
  const budgetUsedPercentage = totalBudget > 0 ? (actualCost / totalBudget) * 100 : 0;
  const [isAiLoading, setIsAiLoading] = useState(false);
  const layoutKey = `dashboard-layout-${project.id}`;
  const [layouts, setLayouts] = useState<Layouts>(getLayoutsFromLS(layoutKey) || defaultLayouts);
  
  const costPerformance = evm.cpi >= 1
    ? { text: 'Under Budget', icon: CheckCircle, color: 'text-green-500' }
    : { text: 'Over Budget', icon: AlertTriangle, color: 'text-red-500' };
  
  const schedulePerformance = evm.spi >= 1
    ? { text: 'Ahead of Schedule', icon: CheckCircle, color: 'text-green-500' }
    : { text: 'Behind Schedule', icon: AlertTriangle, color: 'text-red-500' };

  const handleRefreshInsight = async () => {
      setIsAiLoading(true);
      await updateAiInsight();
      setIsAiLoading(false);
  };
  
  const onLayoutChange = (layout: any, allLayouts: Layouts) => {
    localStorage.setItem(layoutKey, JSON.stringify(allLayouts));
    setLayouts(allLayouts);
  };

  return (
    <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={onLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={120}
        draggableHandle=".drag-handle"
    >
        <div key="progress" className="cursor-grab drag-handle">
            <StatCard title="Progres Proyek" value={`${overallProgress.toFixed(1)}%`} icon={BarChart3} description="Berdasarkan volume pekerjaan selesai" />
        </div>
        <div key="cost" className="cursor-grab drag-handle">
             <StatCard title="Biaya Aktual" value={formatCurrency(actualCost)} icon={DollarSign} description={`dari ${formatCurrency(totalBudget)}`} />
        </div>
        <div key="cpi" className="cursor-grab drag-handle">
            <StatCard title="Kinerja Biaya (CPI)" value={evm.cpi.toFixed(2)} icon={costPerformance.icon} description={costPerformance.text} color={costPerformance.color} />
        </div>
        <div key="spi" className="cursor-grab drag-handle">
            <StatCard title="Kinerja Jadwal (SPI)" value={evm.spi.toFixed(2)} icon={schedulePerformance.icon} description={schedulePerformance.text} color={schedulePerformance.color} />
        </div>
        <div key="radial-progress" className="cursor-grab drag-handle">
            <RadialProgress title="Progres Keseluruhan" description="Target: 100%" value={overallProgress} />
        </div>
        <div key="budget-summary" className="cursor-grab drag-handle">
            <Card>
                <CardHeader><CardTitle>Ringkasan Anggaran</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-center"><p className="text-sm text-palladium">Terpakai</p><p className="text-3xl font-bold text-persimmon">{formatCurrency(actualCost)}</p></div>
                        <Progress value={budgetUsedPercentage} />
                        <div className="flex justify-between text-sm"><span className="text-palladium">0%</span><span className="font-semibold">{formatCurrency(totalBudget)}</span></div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div key="notifications" className="cursor-grab drag-handle">
             <Card>
                <CardHeader><CardTitle>Notifikasi & Laporan Terbaru</CardTitle></CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {notifications.slice(0, 2).map(notif => (
                            <li key={notif.id} className="flex items-start text-sm"><Clock className="w-4 h-4 mr-3 mt-1 text-persimmon flex-shrink-0" /><div><p className={!notif.isRead ? 'font-semibold' : ''}>{notif.message}</p><p className="text-xs text-palladium">{formatDate(notif.timestamp)}</p></div></li>
                        ))}
                        {recentReports.slice(0, 2).map(report => (
                            <li key={report.id} className="flex items-start text-sm"><BarChart3 className="w-4 h-4 mr-3 mt-1 text-blue-500 flex-shrink-0" /><div><p>Laporan Harian ditambahkan.</p><p className="text-xs text-palladium">{formatDate(report.date)} - {report.notes}</p></div></li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
        <div key="ai-insight" className="cursor-grab drag-handle">
            <AiInsightWidget insight={project.aiInsight} onRefresh={handleRefreshInsight} isLoading={isAiLoading} />
        </div>
    </ResponsiveGridLayout>
  );
}