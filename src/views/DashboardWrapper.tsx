import React from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardPro from './DashboardPro';
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
  const totalBudget = currentProject.items?.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0) || 0;
  const actualCost = currentProject.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
  const progressPercent = 35; // Demo project has 35% progress
  
  // Calculate EVM values
  const earnedValue = (totalBudget * progressPercent) / 100;
  const plannedValue = totalBudget * 0.5; // Assume 50% should be done by now
  
  const projectMetrics: ProjectMetrics = {
    totalBudget: totalBudget,
    actualCost: actualCost,
    plannedValue: plannedValue,
    earnedValue: earnedValue,
    remainingBudget: totalBudget - actualCost,
    overallProgress: progressPercent,
    evm: {
      cpi: actualCost > 0 ? earnedValue / actualCost : 1.0,
      spi: plannedValue > 0 ? earnedValue / plannedValue : 1.0,
      cv: earnedValue - actualCost,
      sv: earnedValue - plannedValue,
    },
    sCurveData: {
      planned: [],
      actual: [],
    },
  };

  // Prepare recent reports
  const recentReports = currentProject.dailyReports?.slice(0, 10) || [];

  // Update AI insight function
  const handleUpdateAiInsight = async () => {
    console.log('Updating AI insights for project:', currentProject.id);
    // This would call the actual AI service
  };

  return (
    <DashboardPro
      project={currentProject}
      projectMetrics={projectMetrics}
      recentReports={recentReports}
      notifications={notifications || []}
      updateAiInsight={handleUpdateAiInsight}
    />
  );
};

export default DashboardWrapper;
