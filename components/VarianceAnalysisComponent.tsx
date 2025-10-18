import React, { useState, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { Button } from './Button';
import { Progress } from './Progress';
import { LineChart } from './LineChart';
import { 
    TrendingUp, 
    TrendingDown, 
    AlertCircle,
    Clock,
    DollarSign,
    Target
} from 'lucide-react';
import { 
    EnhancedRabItem
} from '../types';
import { formatCurrency } from '../constants';

interface VarianceAnalysisComponentProps {
    rabItems: EnhancedRabItem[];
}

// Memoized component with custom comparison
export const VarianceAnalysisComponent: React.FC<VarianceAnalysisComponentProps> = React.memo(({
    rabItems
}) => {
    const [sortBy, setSortBy] = useState<'variance' | 'risk' | 'impact'>('variance');

    // Calculate overall project variance metrics
    const overallMetrics = useMemo(() => {
        const totalBudgeted = rabItems.reduce((sum, item) => sum + item.budgetVariance.budgetedCost * item.volume, 0);
        const totalActual = rabItems.reduce((sum, item) => sum + item.budgetVariance.actualCost * item.volume, 0);
        const totalVariance = totalActual - totalBudgeted;
        const variancePercentage = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

        const itemsOverBudget = rabItems.filter(item => item.budgetVariance.costVariance > 0).length;
        const itemsBehindSchedule = rabItems.filter(item => item.budgetVariance.timeVariance > 0).length;
        const criticalItems = rabItems.filter(item => item.budgetVariance.riskLevel === 'critical').length;

        return {
            totalBudgeted,
            totalActual,
            totalVariance,
            variancePercentage,
            itemsOverBudget,
            itemsBehindSchedule,
            criticalItems,
            totalItems: rabItems.length
        };
    }, [rabItems]);

    // Sort items based on selected criteria
    const sortedItems = useMemo(() => {
        return [...rabItems].sort((a, b) => {
            switch (sortBy) {
                case 'variance':
                    return Math.abs(b.budgetVariance.costVariancePercentage) - Math.abs(a.budgetVariance.costVariancePercentage);
                case 'risk':
                    const riskScores = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
                    return riskScores[b.budgetVariance.riskLevel] - riskScores[a.budgetVariance.riskLevel];
                case 'impact':
                    return Math.abs(b.budgetVariance.costVariance * b.volume) - Math.abs(a.budgetVariance.costVariance * a.volume);
                default:
                    return 0;
            }
        });
    }, [rabItems, sortBy]);

    // Generate trend data for chart
    const generateTrendData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const planned = months.map((_, index) => ({
            day: index + 1,
            cost: overallMetrics.totalBudgeted * (index + 1) / 6
        }));
        const actual = months.map((_, index) => ({
            day: index + 1,
            cost: overallMetrics.totalActual * (index + 1) / 6 * (1 + Math.random() * 0.1 - 0.05)
        }));
        
        return { planned, actual };
    };

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'critical': return 'text-red-600 bg-red-100';
            case 'high': return 'text-red-500 bg-red-50';
            case 'medium': return 'text-yellow-500 bg-yellow-50';
            case 'low': return 'text-green-500 bg-green-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return <TrendingDown className="w-4 h-4 text-green-500" />;
            case 'deteriorating': return <TrendingUp className="w-4 h-4 text-red-500" />;
            default: return <Target className="w-4 h-4 text-blue-500" />;
        }
    };

    const getPerformanceColor = (percentage: number) => {
        if (percentage > 10) return 'text-red-600';
        if (percentage > 5) return 'text-yellow-600';
        if (percentage < -5) return 'text-green-600';
        return 'text-blue-600';
    };

    return (
        <div className="space-y-6">
            {/* Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Total Variance</p>
                                <p className={`text-2xl font-bold ${getPerformanceColor(overallMetrics.variancePercentage)}`}>
                                    {overallMetrics.variancePercentage >= 0 ? '+' : ''}{overallMetrics.variancePercentage.toFixed(1)}%
                                </p>
                                <p className="text-xs text-palladium">{formatCurrency(overallMetrics.totalVariance)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-persimmon" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Over Budget Items</p>
                                <p className="text-2xl font-bold text-red-500">
                                    {overallMetrics.itemsOverBudget}
                                </p>
                                <p className="text-xs text-palladium">
                                    of {overallMetrics.totalItems} items
                                </p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Behind Schedule</p>
                                <p className="text-2xl font-bold text-yellow-500">
                                    {overallMetrics.itemsBehindSchedule}
                                </p>
                                <p className="text-xs text-palladium">
                                    items delayed
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Critical Items</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {overallMetrics.criticalItems}
                                </p>
                                <p className="text-xs text-palladium">
                                    need attention
                                </p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Variance Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Trend Variance Anggaran vs Aktual</CardTitle>
                    <CardDescription>Perbandingan kumulatif biaya yang direncanakan dengan aktual</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <LineChart 
                            data={generateTrendData()} 
                            width={800} 
                            height={250}
                        />
                    </div>
                    <div className="flex justify-center items-center gap-6 mt-4 text-sm text-palladium">
                        <div className="flex items-center gap-2">
                            <div className="w-8 border-t-2 border-dashed border-blue-500"></div> 
                            Anggaran Direncanakan
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-1 bg-persimmon"></div> 
                            Biaya Aktual
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        variant={sortBy === 'variance' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('variance')}
                    >
                        Sort by Variance
                    </Button>
                    <Button
                        variant={sortBy === 'risk' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('risk')}
                    >
                        Sort by Risk
                    </Button>
                    <Button
                        variant={sortBy === 'impact' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('impact')}
                    >
                        Sort by Impact
                    </Button>
                </div>
            </div>

            {/* Detailed Variance Analysis Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Analisis Variance Detail per Item</CardTitle>
                    <CardDescription>Breakdown variance untuk setiap item RAB</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-violet-essence/50 text-xs uppercase">
                                <tr>
                                    <th className="p-3 text-left">Item</th>
                                    <th className="p-3 text-right">Budget</th>
                                    <th className="p-3 text-right">Actual</th>
                                    <th className="p-3 text-right">Cost Variance</th>
                                    <th className="p-3 text-right">Time Variance</th>
                                    <th className="p-3 text-center">Performance</th>
                                    <th className="p-3 text-center">Trend</th>
                                    <th className="p-3 text-center">Risk Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedItems.map(item => {
                                    const variance = item.budgetVariance;
                                    const totalImpact = variance.costVariance * item.volume;
                                    
                                    return (
                                        <tr key={item.id} className="border-b border-violet-essence hover:bg-violet-essence/30">
                                            <td className="p-3">
                                                <div>
                                                    <p className="font-medium text-night-black">{item.uraian}</p>
                                                    <p className="text-xs text-palladium">
                                                        {item.kategori} • Vol: {item.volume} {item.satuan}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <p className="font-medium">{formatCurrency(variance.budgetedCost)}</p>
                                                <p className="text-xs text-palladium">per {item.satuan}</p>
                                            </td>
                                            <td className="p-3 text-right">
                                                <p className="font-medium">{formatCurrency(variance.actualCost)}</p>
                                                <p className="text-xs text-palladium">per {item.satuan}</p>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div>
                                                    <p className={`font-medium ${getPerformanceColor(variance.costVariancePercentage)}`}>
                                                        {variance.costVariancePercentage >= 0 ? '+' : ''}{variance.costVariancePercentage.toFixed(1)}%
                                                    </p>
                                                    <p className="text-xs text-palladium">{formatCurrency(totalImpact)}</p>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div>
                                                    <p className={`font-medium ${variance.timeVariance > 0 ? 'text-red-500' : variance.timeVariance < 0 ? 'text-green-500' : 'text-blue-500'}`}>
                                                        {variance.timeVariance >= 0 ? '+' : ''}{variance.timeVariance} days
                                                    </p>
                                                    <p className="text-xs text-palladium">
                                                        {variance.timeVariancePercentage >= 0 ? '+' : ''}{variance.timeVariancePercentage.toFixed(1)}%
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-12 mb-1">
                                                        <Progress 
                                                            value={Math.min(100, (1 / variance.performanceIndex) * 100)} 
                                                            className="h-2"
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-medium ${variance.performanceIndex <= 1 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {variance.performanceIndex.toFixed(2)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {getTrendIcon(variance.trend)}
                                                    <span className="text-xs capitalize">{variance.trend}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(variance.riskLevel)}`}>
                                                    {variance.riskLevel.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Cost Performance Index (CPI)</span>
                                <span className={`font-bold ${overallMetrics.variancePercentage <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(overallMetrics.totalBudgeted / overallMetrics.totalActual).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Budget Utilization</span>
                                <span className="font-bold text-night-black">
                                    {((overallMetrics.totalActual / overallMetrics.totalBudgeted) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Items On Track</span>
                                <span className="font-bold text-green-600">
                                    {overallMetrics.totalItems - overallMetrics.itemsOverBudget - overallMetrics.itemsBehindSchedule}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {['low', 'medium', 'high', 'critical'].map(risk => {
                                const count = rabItems.filter(item => item.budgetVariance.riskLevel === risk).length;
                                const percentage = (count / rabItems.length) * 100;
                                
                                return (
                                    <div key={risk} className="flex items-center gap-3">
                                        <span className={`w-16 text-xs font-medium ${getRiskColor(risk)}`}>
                                            {risk.toUpperCase()}
                                        </span>
                                        <div className="flex-1">
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                        <span className="text-sm font-medium w-12 text-right">
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison: Only re-render if rabItems actually changed
    return JSON.stringify(prevProps.rabItems) === JSON.stringify(nextProps.rabItems);
});

export default VarianceAnalysisComponent;
