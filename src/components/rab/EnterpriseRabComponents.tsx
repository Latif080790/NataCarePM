/**
 * 🏢 Enterprise RAB Components
 * Version Bar, Approval Timeline, AHSP Price Comparison
 * 
 * @description Enterprise-grade components for RAB management system
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import {
    GitBranch,
    Clock,
    ChevronDown,
    Check,
    X,
    AlertCircle,
    Users,
    ArrowLeftRight,
    History,
    FileText,
    Send,
    RotateCcw,
    Scale,
    TrendingDown,
    TrendingUp,
    Minus,
} from 'lucide-react';
import { formatCurrency } from '@/constants';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Version {
    id: string;
    number: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'superseded';
    createdAt: Date;
    createdBy: {
        id: string;
        name: string;
        avatar?: string;
    };
    changes: number;
    isBaseline: boolean;
    totalBudget: number;
    notes?: string;
}

export interface ApprovalStage {
    id: string;
    name: string;
    status: 'completed' | 'current' | 'pending' | 'rejected';
    approver?: {
        id: string;
        name: string;
        avatar?: string;
    };
    completedAt?: Date;
    comments?: string;
}

export interface PriceSource {
    id: string;
    name: string;
    type: 'master' | 'custom' | 'vendor' | 'government';
    unitPrice: number;
    lastUpdated: Date;
    variance: number;
    isRecommended?: boolean;
}

export interface WorkItem {
    id: string;
    no: string;
    description: string;
    volume: number;
    unit: string;
    currentPrice: number;
}

// ============================================================================
// VERSION BAR COMPONENT
// ============================================================================

interface VersionBarProps {
    currentVersion: Version;
    versions: Version[];
    onVersionChange: (versionId: string) => void;
    onCompareVersions: () => void;
    onRequestApproval: () => void;
    lastUpdated: Date;
    approvers: { id: string; name: string; avatar?: string }[];
}

export const VersionBar: React.FC<VersionBarProps> = ({
    currentVersion,
    versions,
    onVersionChange,
    onCompareVersions,
    onRequestApproval,
    lastUpdated,
    approvers,
}) => {
    const [showVersionDropdown, setShowVersionDropdown] = useState(false);

    const statusColors = {
        draft: 'bg-gray-100 text-gray-700',
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        superseded: 'bg-gray-100 text-gray-500',
    };

    const statusLabels = {
        draft: 'Draft',
        pending: 'Pending Approval',
        approved: 'Approved',
        rejected: 'Rejected',
        superseded: 'Superseded',
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left: Version Selector */}
                <div className="flex items-center gap-4">
                    {/* Version Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <GitBranch className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                                Version: {currentVersion.number}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>

                        {showVersionDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <div className="p-2 max-h-64 overflow-y-auto">
                                    {versions.map((version) => (
                                        <button
                                            key={version.id}
                                            onClick={() => {
                                                onVersionChange(version.id);
                                                setShowVersionDropdown(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${version.id === currentVersion.id
                                                    ? 'bg-orange-50 text-orange-700'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{version.number}</span>
                                                {version.isBaseline && (
                                                    <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                                        Baseline
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 text-xs rounded-full ${statusColors[version.status]}`}
                                            >
                                                {statusLabels[version.status]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Last Updated */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                            Last Updated:{' '}
                            {lastUpdated.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>

                    {/* Status Badge */}
                    <span
                        className={`px-3 py-1.5 text-sm font-medium rounded-full ${statusColors[currentVersion.status]}`}
                    >
                        {statusLabels[currentVersion.status]}
                    </span>
                </div>

                {/* Right: Approvers & Actions */}
                <div className="flex items-center gap-4">
                    {/* Approvers Avatars */}
                    {approvers.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Approvers:</span>
                            <div className="flex -space-x-2">
                                {approvers.slice(0, 3).map((approver, index) => (
                                    <div
                                        key={approver.id}
                                        className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                                        title={approver.name}
                                    >
                                        {approver.name.charAt(0).toUpperCase()}
                                    </div>
                                ))}
                                {approvers.length > 3 && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold border-2 border-white">
                                        +{approvers.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Compare Versions Button */}
                    <button
                        onClick={onCompareVersions}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeftRight className="w-4 h-4" />
                        Compare Versions
                    </button>

                    {/* Request Approval Button */}
                    {currentVersion.status === 'draft' && (
                        <button
                            onClick={onRequestApproval}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                            Request Approval
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// APPROVAL TIMELINE COMPONENT
// ============================================================================

interface ApprovalTimelineProps {
    stages: ApprovalStage[];
    onViewFullHistory: () => void;
}

export const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({
    stages,
    onViewFullHistory,
}) => {
    const getStageIcon = (status: ApprovalStage['status']) => {
        switch (status) {
            case 'completed':
                return <Check className="w-4 h-4 text-white" />;
            case 'current':
                return <Clock className="w-4 h-4 text-white" />;
            case 'rejected':
                return <X className="w-4 h-4 text-white" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStageColor = (status: ApprovalStage['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'current':
                return 'bg-amber-500';
            case 'rejected':
                return 'bg-red-500';
            default:
                return 'bg-gray-200';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Approval Timeline
            </h3>

            <div className="space-y-4">
                {stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${getStageColor(stage.status)}`}
                            >
                                {getStageIcon(stage.status)}
                            </div>
                            {index < stages.length - 1 && (
                                <div
                                    className={`w-0.5 h-8 my-1 ${stage.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                                        }`}
                                />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                    {index + 1}. {stage.name}
                                </p>
                                {stage.completedAt && (
                                    <span className="text-xs text-gray-500">
                                        {stage.completedAt.toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                    </span>
                                )}
                            </div>
                            {stage.approver && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    by {stage.approver.name}
                                    {stage.status === 'completed' && ' - Approved'}
                                    {stage.status === 'rejected' && ' - Rejected'}
                                </p>
                            )}
                            {stage.status === 'current' && (
                                <p className="text-xs text-amber-600 mt-0.5">
                                    Waiting for approval...
                                </p>
                            )}
                            {stage.status === 'pending' && (
                                <p className="text-xs text-gray-400 mt-0.5">Upcoming</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onViewFullHistory}
                className="w-full mt-4 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <History className="w-4 h-4" />
                View Full History
            </button>
        </div>
    );
};

// ============================================================================
// AHSP PRICE COMPARISON MODAL
// ============================================================================

interface AHSPPriceComparisonProps {
    isOpen: boolean;
    onClose: () => void;
    workItem: WorkItem;
    priceSources: PriceSource[];
    onApplyPrice: (sourceId: string) => void;
}

export const AHSPPriceComparison: React.FC<AHSPPriceComparisonProps> = ({
    isOpen,
    onClose,
    workItem,
    priceSources,
    onApplyPrice,
}) => {
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

    const bestPriceSource = priceSources.reduce((best, current) =>
        current.unitPrice < best.unitPrice ? current : best
    );

    const calculateSavings = () => {
        if (!selectedSourceId) return 0;
        const selectedSource = priceSources.find((s) => s.id === selectedSourceId);
        if (!selectedSource) return 0;
        return (workItem.currentPrice - selectedSource.unitPrice) * workItem.volume;
    };

    const getVarianceIcon = (variance: number) => {
        if (variance < -5) return <TrendingDown className="w-4 h-4 text-green-500" />;
        if (variance > 5) return <TrendingUp className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    const getSourceTypeLabel = (type: PriceSource['type']) => {
        const labels = {
            master: 'Master AHSP',
            custom: 'Custom',
            vendor: 'Vendor Quote',
            government: 'Government Std.',
        };
        return labels[type];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Scale className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                AHSP Price Comparison
                            </h2>
                            <p className="text-sm text-gray-500">{workItem.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Current Price Info */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Current Price</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(workItem.currentPrice)} / {workItem.unit}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Volume</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {workItem.volume.toLocaleString()} {workItem.unit}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Price Sources Table */}
                <div className="px-6 py-4 max-h-80 overflow-y-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase tracking-wide">
                                <th className="text-left py-2">Source</th>
                                <th className="text-right py-2">Unit Price</th>
                                <th className="text-right py-2">Last Updated</th>
                                <th className="text-right py-2">Variance</th>
                                <th className="text-center py-2">Select</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {priceSources.map((source) => (
                                <tr
                                    key={source.id}
                                    className={`transition-colors ${selectedSourceId === source.id
                                            ? 'bg-orange-50'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">
                                                {source.name}
                                            </span>
                                            {source.id === bestPriceSource.id && (
                                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                                                    Best Price
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {getSourceTypeLabel(source.type)}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span
                                            className={`font-semibold ${source.id === bestPriceSource.id
                                                    ? 'text-green-600'
                                                    : 'text-gray-900'
                                                }`}
                                        >
                                            {formatCurrency(source.unitPrice)}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right text-sm text-gray-500">
                                        {source.lastUpdated.toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {getVarianceIcon(source.variance)}
                                            <span
                                                className={`text-sm font-medium ${source.variance < 0
                                                        ? 'text-green-600'
                                                        : source.variance > 0
                                                            ? 'text-red-600'
                                                            : 'text-gray-500'
                                                    }`}
                                            >
                                                {source.variance > 0 ? '+' : ''}
                                                {source.variance}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <button
                                            onClick={() => setSelectedSourceId(source.id)}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedSourceId === source.id
                                                    ? 'border-orange-500 bg-orange-500'
                                                    : 'border-gray-300 hover:border-orange-400'
                                                }`}
                                        >
                                            {selectedSourceId === source.id && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Savings Calculator */}
                {selectedSourceId && (
                    <div className="px-6 py-4 bg-green-50 border-t border-green-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 font-medium">
                                    Potential Savings
                                </p>
                                <p className="text-xs text-green-600">
                                    Based on {workItem.volume.toLocaleString()} {workItem.unit}
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(calculateSavings())}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => selectedSourceId && onApplyPrice(selectedSourceId)}
                        disabled={!selectedSourceId}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedSourceId
                                ? 'text-white bg-orange-500 hover:bg-orange-600'
                                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            }`}
                    >
                        Apply Selected Price
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// QUICK TOOLS PANEL
// ============================================================================

interface QuickAction {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'warning';
}

interface QuickToolsPanelProps {
    actions: QuickAction[];
}

export const QuickToolsPanel: React.FC<QuickToolsPanelProps> = ({ actions }) => {
    const getButtonStyle = (variant: QuickAction['variant'] = 'default') => {
        switch (variant) {
            case 'primary':
                return 'bg-orange-500 text-white hover:bg-orange-600';
            case 'warning':
                return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
            default:
                return 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Quick Tools
            </h3>
            <div className="space-y-2">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.id}
                            onClick={action.onClick}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${getButtonStyle(action.variant)}`}
                        >
                            <Icon className="w-5 h-5" />
                            {action.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================================
// BUDGET DISTRIBUTION CHART
// ============================================================================

interface BudgetDistributionItem {
    label: string;
    value: number;
    percentage: number;
    color: string;
}

interface BudgetDistributionChartProps {
    items: BudgetDistributionItem[];
    totalItems: number;
}

export const BudgetDistributionChart: React.FC<BudgetDistributionChartProps> = ({
    items,
    totalItems,
}) => {
    // Calculate stroke dash for donut chart
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercentage = 0;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Budget Distribution
            </h3>

            <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {items.map((item, index) => {
                            const strokeDasharray = (item.percentage / 100) * circumference;
                            const strokeDashoffset = -(cumulativePercentage / 100) * circumference;
                            cumulativePercentage += item.percentage;

                            return (
                                <circle
                                    key={index}
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="transparent"
                                    stroke={item.color}
                                    strokeWidth="12"
                                    strokeDasharray={`${strokeDasharray} ${circumference}`}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-500"
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs text-gray-500">Total Items</span>
                        <span className="text-2xl font-bold text-gray-900">{totalItems}</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-gray-700">{item.label}</span>
                        </div>
                        <span className="font-medium text-gray-900">{item.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// ENHANCED SUMMARY CARD
// ============================================================================

interface EnhancedSummaryCardProps {
    title: string;
    value: string;
    subtitle?: string;
    indicator?: {
        type: 'progress' | 'status' | 'trend';
        value: number | string;
        status: 'positive' | 'negative' | 'neutral' | 'warning';
        label?: string;
    };
    icon?: React.ComponentType<{ className?: string }>;
}

export const EnhancedSummaryCard: React.FC<EnhancedSummaryCardProps> = ({
    title,
    value,
    subtitle,
    indicator,
    icon: Icon,
}) => {
    const getIndicatorColor = (status: string) => {
        switch (status) {
            case 'positive':
                return 'text-green-600 bg-green-50';
            case 'negative':
                return 'text-red-600 bg-red-50';
            case 'warning':
                return 'text-amber-600 bg-amber-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {title}
                </p>
                {Icon && (
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-orange-500" />
                    </div>
                )}
            </div>

            {/* Value */}
            <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>

            {/* Subtitle / Indicator */}
            {indicator && (
                <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-gray-500">{subtitle}</span>
                    <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getIndicatorColor(indicator.status)}`}
                    >
                        {indicator.label || indicator.value}
                    </span>
                </div>
            )}

            {indicator?.type === 'progress' && typeof indicator.value === 'number' && (
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">{subtitle}</span>
                        <span className="font-medium text-gray-900">{indicator.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${indicator.status === 'positive'
                                    ? 'bg-green-500'
                                    : indicator.status === 'warning'
                                        ? 'bg-amber-500'
                                        : indicator.status === 'negative'
                                            ? 'bg-red-500'
                                            : 'bg-orange-500'
                                }`}
                            style={{ width: `${Math.min(indicator.value, 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default {
    VersionBar,
    ApprovalTimeline,
    AHSPPriceComparison,
    QuickToolsPanel,
    BudgetDistributionChart,
    EnhancedSummaryCard,
};
