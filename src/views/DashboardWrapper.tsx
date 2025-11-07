import React from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedDashboardView from './EnhancedDashboardView';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { ProjectMetrics } from '@/types';

/**
 * DashboardWrapper - Wraps EnhancedDashboardView with context data
 * This component fetches data from ProjectContext and passes it to EnhancedDashboardView
 */
const DashboardWrapper: React.FC = () => {
  const { currentProject, loading, error, notifications } = useProject();
  const { currentUser } = useAuth();

  // Show loading skeleton while data is being fetched
  if (loading || !currentProject) {
    return (
      <div className="layout-page">
        <div className="layout-content spacing-section">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // Show error state if project failed to load
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-4 text-center">
        <p className="font-bold text-lg mb-2">Gagal Memuat Dashboard</p>
        <p>{error.message || 'Tidak dapat memuat data dashboard.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  // Calculate project metrics from current project data
  const projectMetrics: ProjectMetrics = {
    totalBudget: currentProject.items?.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0) || 0,
    actualCost: currentProject.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0,
    budgetVariance: 0, // Will be calculated
    progressPercentage: 0, // Will be calculated from items
    tasksCompleted: 0,
    totalTasks: 0,
    onTimePerformance: 100,
    qualityScore: 95,
    safetyScore: 98,
    teamProductivity: 85,
    costPerformanceIndex: 1.0,
    schedulePerformanceIndex: 1.0,
    riskLevel: 'low' as const,
    forecastedCompletion: currentProject.startDate,
    criticalPath: [],
    resourceUtilization: 75,
    changeOrdersCount: 0,
    issuesCount: 0,
  };

  // Calculate budget variance
  projectMetrics.budgetVariance = projectMetrics.totalBudget - projectMetrics.actualCost;

  // Calculate progress percentage from completed volume
  const totalVolume = currentProject.items?.reduce((sum, item) => sum + item.volume, 0) || 1;
  const completedVolume = 0; // This would come from actual completion data
  projectMetrics.progressPercentage = totalVolume > 0 ? (completedVolume / totalVolume) * 100 : 0;

  // Prepare recent reports
  const recentReports = currentProject.dailyReports?.slice(0, 10) || [];

  // Update AI insight function
  const handleUpdateAiInsight = async () => {
    console.log('Updating AI insights for project:', currentProject.id);
    // This would call the actual AI service
  };

  return (
    <EnhancedDashboardView
      project={currentProject}
      projectMetrics={projectMetrics}
      recentReports={recentReports}
      notifications={notifications || []}
      updateAiInsight={handleUpdateAiInsight}
    />
  );
};

export default DashboardWrapper;
