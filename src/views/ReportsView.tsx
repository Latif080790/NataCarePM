/**
 * ReportsView - Professional Reports Management & Generation View
 * 
 * Consolidated view for managing and generating project reports.
 */

import React, { useState } from 'react';
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
    ModalPro,
    InputPro,
} from '@/components/DesignSystem';
import { formatDate, formatCurrency, getTodayDateString } from '@/constants';
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
import { Project, ProjectMetrics } from '@/types';

// Interface from ReportsViewPro
interface Report {
    id: string;
    title?: string;
    type?: string;
    date?: string;
    description?: string;
    status?: string;
}

interface ReportsViewProps {
    reports?: Report[];
    projectMetrics?: ProjectMetrics; // Added for Generation
    project?: Project; // Added for Generation
    isLoading?: boolean;
    onViewReport?: (reportId: string) => void;
    onDownloadReport?: (reportId: string) => void;
    onCreateReport?: () => void; // Optional if we handle it internally
}

export default function ReportsView({
    reports = [],
    projectMetrics,
    project,
    isLoading = false,
    onViewReport,
    onDownloadReport,
}: ReportsViewProps) {
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    // Generation State
    const [startDate, setStartDate] = useState(() => getTodayDateString());
    const [endDate, setEndDate] = useState(() => getTodayDateString());

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
            title="Reports Center"
            subtitle="View, generate, and manage project reports"
            breadcrumbs={[
                { label: 'Projects', href: '/' },
                { label: 'Reports' },
            ]}
            actions={
                <ButtonPro variant="primary" icon={Plus} onClick={() => setIsGenerateModalOpen(true)}>
                    Generate Report
                </ButtonPro>
            }
        >
            {/* Quick Action / Generator Teaser */}
            {(!reports || reports.length === 0) && (
                <EmptyState
                    icon={FileText}
                    title="No Reports Yet"
                    description="Get started by creating your first project report."
                    action={
                        <ButtonPro variant="primary" icon={Plus} onClick={() => setIsGenerateModalOpen(true)}>
                            Generate Report
                        </ButtonPro>
                    }
                />
            )}

            {/* Report Types Section */}
            {reports.length > 0 && Object.entries(reportsByType).map(([type, typeReports]) => {
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

            {/* Generate Report Modal (Merging ReportView Logic) */}
            <ModalPro
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                title="Generate New Report"
                size="lg"
                footer={
                    <div className="flex gap-3 justify-end">
                        <ButtonPro variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
                            Cancel
                        </ButtonPro>
                        <ButtonPro variant="primary" icon={Download}>
                            Generate PDF
                        </ButtonPro>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <InputPro type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <InputPro type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Preview Summary (Live)</h4>
                        {projectMetrics ? (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Total Budget:</span>
                                    <p className="font-medium">{formatCurrency(projectMetrics.totalBudget)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Actual Cost:</span>
                                    <p className="font-medium {projectMetrics.actualCost > projectMetrics.totalBudget ? 'text-red-600' : 'text-green-600'}">
                                        {formatCurrency(projectMetrics.actualCost)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">No project data available for preview.</p>
                        )}
                    </div>
                </div>
            </ModalPro>

        </EnterpriseLayout>
    );
}
