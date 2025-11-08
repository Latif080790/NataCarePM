/**
 * ReportsViewPro - Professional Reports Management View
 * 
 * Enterprise-grade reporting with consistent design system.
 */

import {
  EnterpriseLayout,
  SectionLayout,
  GridLayout,
  CardPro,
  CardProHeader,
  CardProTitle,
  CardProDescription,
  CardProContent,
  ButtonPro,
  BadgePro,
  EmptyState,
  LoadingState,
} from '@/components/DesignSystem';
import { formatDate } from '@/constants';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  BarChart,
  PieChart,
  Plus,
} from 'lucide-react';

interface Report {
  id: string;
  title?: string;
  type?: string;
  date?: string;
  description?: string;
  status?: string;
}

interface ReportsViewProProps {
  reports: Report[];
  isLoading?: boolean;
  onViewReport?: (reportId: string) => void;
  onDownloadReport?: (reportId: string) => void;
  onCreateReport?: () => void;
}

export default function ReportsViewPro({
  reports = [],
  isLoading = false,
  onViewReport,
  onDownloadReport,
  onCreateReport,
}: ReportsViewProProps) {
  // Group reports by type
  const reportsByType = reports.reduce((acc, report) => {
    const type = report.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(report);
    return acc;
  }, {} as Record<string, Report[]>);

  // Get icon for report type
  const getReportIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      daily: FileText,
      progress: TrendingUp,
      financial: BarChart,
      analytics: PieChart,
    };
    return iconMap[type.toLowerCase()] || FileText;
  };

  // Get badge variant for report status
  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, any> = {
      draft: 'default',
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
    };
    return (
      <BadgePro variant={variantMap[status.toLowerCase()] || 'default'} size="sm">
        {status}
      </BadgePro>
    );
  };

  if (isLoading) {
    return (
      <EnterpriseLayout title="Reports">
        <LoadingState message="Loading reports..." size="lg" />
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout
      title="Reports"
      subtitle="View, create, and manage project reports"
      breadcrumbs={[
        { label: 'Projects', href: '/' },
        { label: 'Reports' },
      ]}
      actions={
        <ButtonPro variant="primary" icon={Plus} onClick={onCreateReport}>
          New Report
        </ButtonPro>
      }
    >
      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Reports Yet"
          description="Get started by creating your first project report."
          action={
            <ButtonPro variant="primary" icon={Plus} onClick={onCreateReport}>
              Create Report
            </ButtonPro>
          }
        />
      ) : (
        <>
          {/* Report Types Section */}
          {Object.entries(reportsByType).map(([type, typeReports]) => {
            const Icon = getReportIcon(type);
            
            return (
              <SectionLayout
                key={type}
                title={`${type} Reports`}
                description={`${typeReports.length} report(s) available`}
                className="mb-8"
              >
                <GridLayout columns={{ default: 1, md: 2, lg: 3 }}>
                  {typeReports.map((report) => (
                    <CardPro key={report.id} variant="elevated" hoverable>
                      <CardProHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <CardProTitle className="text-base">
                                {report.title || 'Untitled Report'}
                              </CardProTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {formatDate(report.date || new Date().toISOString())}
                                </span>
                              </div>
                            </div>
                          </div>
                          {report.status && getStatusBadge(report.status)}
                        </div>
                        {report.description && (
                          <CardProDescription className="text-sm mt-2 line-clamp-2">
                            {report.description}
                          </CardProDescription>
                        )}
                      </CardProHeader>
                      
                      <CardProContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <ButtonPro
                            variant="outline"
                            size="sm"
                            icon={Eye}
                            onClick={() => onViewReport?.(report.id)}
                            fullWidth
                          >
                            View
                          </ButtonPro>
                          <ButtonPro
                            variant="ghost"
                            size="sm"
                            icon={Download}
                            onClick={() => onDownloadReport?.(report.id)}
                            fullWidth
                          >
                            Download
                          </ButtonPro>
                        </div>
                      </CardProContent>
                    </CardPro>
                  ))}
                </GridLayout>
              </SectionLayout>
            );
          })}
        </>
      )}
    </EnterpriseLayout>
  );
}
