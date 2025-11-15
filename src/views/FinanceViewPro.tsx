/**
 * FinanceViewPro - Professional Finance Management View
 * 
 * Enterprise-grade financial tracking with consistent design system.
 */

import {
  EnterpriseLayout,
  SectionLayout,
  StatCardPro,
  StatCardGrid,
  TablePro,
  ColumnDef,
  BadgePro,
  AlertPro,
  LoadingState,
} from '@/components/DesignSystem';
import { Expense, ProjectMetrics } from '@/types';
import { formatCurrency, formatDate } from '@/constants';
import { LineChart } from '@/components/LineChart';
import { useElementSize } from '@/hooks/useElementSize';
import { useRequirePermission } from '@/hooks/usePermissions';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Calendar,
  FileText,
  PieChart,
} from 'lucide-react';

interface FinanceViewProProps {
  expenses: Expense[];
  projectMetrics: ProjectMetrics;
  isLoading?: boolean;
}

export default function FinanceViewPro({
  expenses = [],
  projectMetrics,
  isLoading = false,
}: FinanceViewProProps) {
  const { allowed, reason, suggestedAction } = useRequirePermission('view_finances');
  const [chartContainerRef, { width }] = useElementSize();

  // Access control
  if (!allowed) {
    return (
      <EnterpriseLayout
        title="Finance Management"
        subtitle="Access Restricted"
        showHeader={false}
      >
        <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
          <Lock className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-night-black mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">{reason}</p>
          {suggestedAction && <p className="text-sm text-info">{suggestedAction}</p>}
        </div>
      </EnterpriseLayout>
    );
  }

  const { totalBudget = 0, actualCost = 0, sCurveData = [] } = projectMetrics || {};
  const expensePercentage = totalBudget > 0 ? (actualCost / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - actualCost;
  const isOverBudget = actualCost > totalBudget;

  // Calculate expense type breakdown
  const expensesByType = expenses.reduce((acc, expense) => {
    acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Table columns
  const columns: ColumnDef<Expense>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (expense) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(expense.date)}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (expense) => (
        <span className="font-medium text-night-black">{expense.description}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (expense) => <BadgePro variant="default">{expense.type}</BadgePro>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      render: (expense) => (
        <span className="font-semibold text-night-black">{formatCurrency(expense.amount)}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <EnterpriseLayout title="Finance Management">
        <LoadingState message="Loading financial data..." size="lg" />
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout
      title="Finance Management"
      subtitle="Track project budget, expenses, and financial performance"
      breadcrumbs={[
        { label: 'Projects', href: '/' },
        { label: 'Finance' },
      ]}
    >
      {/* Key Financial Metrics */}
      <SectionLayout title="Financial Overview" className="mb-8">
        <StatCardGrid>
          <StatCardPro
            title="Total Budget"
            value={formatCurrency(totalBudget)}
            icon={DollarSign}
            variant="primary"
            description="Allocated project budget"
          />
          <StatCardPro
            title="Actual Cost"
            value={formatCurrency(actualCost)}
            icon={TrendingUp}
            variant={isOverBudget ? 'error' : 'success'}
            trend={{
              value: expensePercentage,
              label: 'of budget used',
            }}
          />
          <StatCardPro
            title="Remaining Budget"
            value={formatCurrency(remainingBudget)}
            icon={isOverBudget ? TrendingDown : TrendingUp}
            variant={isOverBudget ? 'warning' : 'success'}
            description={isOverBudget ? 'Over budget' : 'Available funds'}
          />
          <StatCardPro
            title="Expense Items"
            value={expenses.length}
            icon={FileText}
            variant="default"
            description="Total transactions"
          />
        </StatCardGrid>
      </SectionLayout>

      {/* Budget Alert */}
      {isOverBudget && (
        <div className="mb-6">
          <AlertPro variant="error" title="Budget Exceeded">
            Project costs have exceeded the allocated budget by{' '}
            {formatCurrency(Math.abs(remainingBudget))}. Immediate action required.
          </AlertPro>
        </div>
      )}

      {expensePercentage > 90 && !isOverBudget && (
        <div className="mb-6">
          <AlertPro variant="warning" title="Budget Warning">
            You have used {expensePercentage.toFixed(1)}% of the total budget. Consider reviewing
            upcoming expenses.
          </AlertPro>
        </div>
      )}

      {/* S-Curve Chart */}
      <SectionLayout
        title="Budget vs Actual Cost (S-Curve)"
        description="Cumulative visualization of planned vs actual costs over time"
        variant="card"
        className="mb-8"
      >
        <div ref={chartContainerRef} className="min-h-[300px]">
          {sCurveData && typeof sCurveData === 'object' && 'planned' in sCurveData && 'actual' in sCurveData ? (
            <>
              <LineChart data={sCurveData} width={width || 600} height={300} />
              <div className="flex justify-center items-center gap-6 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-8 border-t-2 border-dashed border-gray-400"></div>
                  <span>Planned Cost</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-blue-600"></div>
                  <span>Actual Cost</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No S-Curve data available</p>
              </div>
            </div>
          )}
        </div>
      </SectionLayout>

      {/* Expense Breakdown by Type */}
      {Object.keys(expensesByType).length > 0 && (
        <SectionLayout
          title="Expense Breakdown by Type"
          description="Distribution of expenses across categories"
          variant="card"
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(expensesByType).map(([type, amount]) => (
              <div
                key={type}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{type}</span>
                  <BadgePro variant="default" size="sm">
                    {((amount / actualCost) * 100).toFixed(1)}%
                  </BadgePro>
                </div>
                <p className="text-xl font-bold text-night-black">{formatCurrency(amount)}</p>
              </div>
            ))}
          </div>
        </SectionLayout>
      )}

      {/* Expense Details Table */}
      <SectionLayout
        title="Expense Details"
        description="Detailed list of all project expenses"
      >
        <TablePro
          data={expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
          columns={columns}
          searchable
          searchPlaceholder="Search expenses by description..."
          hoverable
          stickyHeader
          emptyMessage="No expenses recorded yet."
        />
      </SectionLayout>
    </EnterpriseLayout>
  );
}

