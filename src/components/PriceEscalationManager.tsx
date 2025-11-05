import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { Button } from './Button';
import { Input } from './FormControls';
import { Modal } from './Modal';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calculator,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { PriceEscalation, MarketFactor, EnhancedRabItem } from '@/types';
import { formatCurrency } from '@/constants';

interface PriceEscalationManagerProps {
  rabItems: EnhancedRabItem[];
  onUpdateEscalation: (escalation: PriceEscalation) => void;
}

export const PriceEscalationManager: React.FC<PriceEscalationManagerProps> = ({
  rabItems,
  onUpdateEscalation,
}) => {
  const [selectedItem, setSelectedItem] = useState<EnhancedRabItem | null>(null);
  const [escalationData, setEscalationData] = useState<PriceEscalation | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [projectionMonths, setProjectionMonths] = useState(12);

  // Default market factors
  const defaultMarketFactors: MarketFactor[] = [
    {
      id: 'inflation',
      factor: 'National Inflation Rate',
      currentValue: 3.2,
      historicalValues: [
        { date: '2024-01', value: 3.0, source: 'BPS' },
        { date: '2024-02', value: 3.1, source: 'BPS' },
        { date: '2024-03', value: 3.2, source: 'BPS' },
      ],
      weight: 0.6,
      trend: 'increasing',
      source: 'Bank Indonesia',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'oil_price',
      factor: 'Oil Price Index',
      currentValue: 85.5,
      historicalValues: [
        { date: '2024-01', value: 82.0, source: 'Trading Economics' },
        { date: '2024-02', value: 84.2, source: 'Trading Economics' },
        { date: '2024-03', value: 85.5, source: 'Trading Economics' },
      ],
      weight: 0.3,
      trend: 'increasing',
      source: 'International Markets',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'steel_index',
      factor: 'Steel Price Index',
      currentValue: 112.8,
      historicalValues: [
        { date: '2024-01', value: 108.5, source: 'Metal Bulletin' },
        { date: '2024-02', value: 110.2, source: 'Metal Bulletin' },
        { date: '2024-03', value: 112.8, source: 'Metal Bulletin' },
      ],
      weight: 0.1,
      trend: 'increasing',
      source: 'Commodity Markets',
      lastUpdated: new Date().toISOString(),
    },
  ];

  const calculateProjectedPrice = (item: EnhancedRabItem, months: number): number => {
    const monthlyRate = item.escalationRate / 12 / 100;
    let projectedPrice = item.hargaSatuan * Math.pow(1 + monthlyRate, months);

    // Apply market factor adjustments
    for (const factor of defaultMarketFactors) {
      const factorImpact = factor.weight * (factor.currentValue / 100 - 1);
      projectedPrice *= 1 + factorImpact;
    }

    return projectedPrice;
  };

  const getTrendIcon = (escalationRate: number) => {
    if (escalationRate > 10) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (escalationRate > 5) return <TrendingUp className="w-4 h-4 text-yellow-500" />;
    if (escalationRate < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <TrendingUp className="w-4 h-4 text-blue-500" />;
  };

  const getRiskLevel = (escalationRate: number): { level: string; color: string } => {
    if (escalationRate > 15) return { level: 'Critical', color: 'text-red-600' };
    if (escalationRate > 10) return { level: 'High', color: 'text-red-500' };
    if (escalationRate > 5) return { level: 'Medium', color: 'text-yellow-500' };
    return { level: 'Low', color: 'text-green-500' };
  };

  const handleCalculateEscalation = (item: EnhancedRabItem) => {
    setSelectedItem(item);
    setShowCalculator(true);

    // Create escalation data
    const newEscalation: PriceEscalation = {
      id: `escalation_${item.id}`,
      rabItemId: item.id,
      escalationType: 'material',
      basePrice: item.hargaSatuan,
      currentPrice: item.hargaSatuan,
      escalationRate: item.escalationRate,
      projectedPrice: calculateProjectedPrice(item, projectionMonths),
      effectiveDate: new Date().toISOString(),
      projectionDate: new Date(
        Date.now() + projectionMonths * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      marketFactors: defaultMarketFactors,
      escalationTriggers: [
        {
          id: 'monthly_review',
          triggerType: 'time_based',
          threshold: 30, // 30 days
          action: 'recalculate',
          isActive: true,
        },
        {
          id: 'variance_alert',
          triggerType: 'percentage_based',
          threshold: 10, // 10% variance
          action: 'alert',
          isActive: true,
        },
      ],
      isActive: true,
      lastCalculated: new Date().toISOString(),
    };

    setEscalationData(newEscalation);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Rata-rata Eskalasi</p>
                <p className="text-2xl font-bold text-night-black">
                  {(
                    rabItems.reduce((sum, item) => sum + item.escalationRate, 0) / rabItems.length
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-persimmon" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Items Berisiko Tinggi</p>
                <p className="text-2xl font-bold text-red-500">
                  {rabItems.filter((item) => item.escalationRate > 10).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Total Dampak Proyeksi</p>
                <p className="text-2xl font-bold text-persimmon">
                  {formatCurrency(
                    rabItems.reduce(
                      (sum, item) =>
                        sum + (calculateProjectedPrice(item, 12) - item.hargaSatuan) * item.volume,
                      0
                    )
                  )}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-persimmon" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Factors Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Faktor Pasar Saat Ini</CardTitle>
          <CardDescription>Indeks pasar yang mempengaruhi eskalasi harga</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {defaultMarketFactors.map((factor) => (
              <div key={factor.id} className="p-4 bg-violet-essence/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-night-black">{factor.factor}</span>
                  {factor.trend === 'increasing' ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-lg font-bold text-persimmon">{factor.currentValue}</p>
                <p className="text-xs text-palladium">
                  Weight: {(factor.weight * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RAB Items with Escalation Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analisis Eskalasi per Item</CardTitle>
          <CardDescription>Daftar item RAB dengan proyeksi eskalasi harga</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-violet-essence/50 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-right">Harga Saat Ini</th>
                  <th className="p-3 text-right">Eskalasi/Tahun</th>
                  <th className="p-3 text-right">Proyeksi 12 Bulan</th>
                  <th className="p-3 text-center">Risk Level</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rabItems.map((item) => {
                  const projectedPrice = calculateProjectedPrice(item, 12);
                  const riskLevel = getRiskLevel(item.escalationRate);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-violet-essence hover:bg-violet-essence/30"
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-night-black">{item.uraian}</p>
                          <p className="text-xs text-palladium">{item.kategori}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(item.hargaSatuan)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {getTrendIcon(item.escalationRate)}
                          <span className="font-medium">{item.escalationRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div>
                          <p className="font-medium text-persimmon">
                            {formatCurrency(projectedPrice)}
                          </p>
                          <p className="text-xs text-palladium">
                            +{formatCurrency(projectedPrice - item.hargaSatuan)}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${riskLevel.color} bg-opacity-20`}
                        >
                          {riskLevel.level}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCalculateEscalation(item)}
                        >
                          <Calculator className="w-4 h-4 mr-1" />
                          Analisis
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Escalation Calculator Modal */}
      {showCalculator && selectedItem && escalationData && (
        <Modal
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
          title={`Kalkulator Eskalasi: ${selectedItem.uraian}`}
        >
          <div className="space-y-6">
            {/* Current vs Projected Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-palladium">Harga Saat Ini</p>
                <p className="text-xl font-bold text-night-black">
                  {formatCurrency(escalationData.currentPrice)}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-palladium">Proyeksi {projectionMonths} Bulan</p>
                <p className="text-xl font-bold text-persimmon">
                  {formatCurrency(escalationData.projectedPrice)}
                </p>
              </div>
            </div>

            {/* Projection Settings */}
            <div>
              <label className="block text-sm font-medium text-night-black mb-2">
                Periode Proyeksi (Bulan)
              </label>
              <Input
                type="number"
                value={projectionMonths}
                onChange={(e) => {
                  const months = parseInt(e.target.value);
                  setProjectionMonths(months);
                  setEscalationData({
                    ...escalationData,
                    projectedPrice: calculateProjectedPrice(selectedItem, months),
                    projectionDate: new Date(
                      Date.now() + months * 30 * 24 * 60 * 60 * 1000
                    ).toISOString(),
                  });
                }}
                min="1"
                max="60"
              />
            </div>

            {/* Market Factors Impact */}
            <div>
              <h4 className="font-medium text-night-black mb-3">Dampak Faktor Pasar</h4>
              <div className="space-y-2">
                {escalationData.marketFactors.map((factor) => (
                  <div
                    key={factor.id}
                    className="flex justify-between items-center p-2 bg-violet-essence/20 rounded"
                  >
                    <span className="text-sm">{factor.factor}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium">{factor.currentValue}</span>
                      <span className="text-xs text-palladium ml-2">
                        ({(factor.weight * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  onUpdateEscalation(escalationData);
                  setShowCalculator(false);
                }}
                className="flex-1"
              >
                Simpan Proyeksi
              </Button>
              <Button variant="outline" onClick={() => setShowCalculator(false)} className="flex-1">
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PriceEscalationManager;
