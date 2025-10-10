import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { ProjectMetrics } from '../types';
import { formatCurrency } from '../constants';

interface StrategicCostViewProps {
  projectMetrics: ProjectMetrics;
}

export default function StrategicCostView({ projectMetrics }: StrategicCostViewProps) {
  const { totalBudget, actualCost, earnedValue, plannedValue, evm } = projectMetrics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontrol Biaya Strategis (Earned Value Management)</CardTitle>
        <CardDescription>Analisis kinerja proyek menggunakan metrik Nilai Hasil (Earned Value).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Total Anggaran (BAC)" value={formatCurrency(totalBudget)} />
          <InfoItem label="Biaya Aktual (AC)" value={formatCurrency(actualCost)} />
          <InfoItem label="Nilai Hasil (EV)" value={formatCurrency(earnedValue)} />
          <InfoItem label="Nilai Rencana (PV)" value={formatCurrency(plannedValue)} />
          <InfoItem label="Varian Biaya (CV = EV - AC)" value={formatCurrency(evm.cv)} isNegative={evm.cv < 0} />
          <InfoItem label="Varian Jadwal (SV = EV - PV)" value={formatCurrency(evm.sv)} isNegative={evm.sv < 0} />
          <InfoItem label="Indeks Kinerja Biaya (CPI = EV / AC)" value={evm.cpi.toFixed(2)} isNegative={evm.cpi < 1} />
          <InfoItem label="Indeks Kinerja Jadwal (SPI = EV / PV)" value={evm.spi.toFixed(2)} isNegative={evm.spi < 1} />
        </div>
        <div className="mt-6 p-4 bg-violet-essence/30 rounded-lg">
          <h4 className="font-semibold mb-2">Interpretasi</h4>
          <p className="text-sm text-palladium">
            <strong>CPI {evm.cpi.toFixed(2)}:</strong> {evm.cpi >= 1 ? 'Biaya lebih efisien dari rencana (under budget).' : 'Biaya melebihi rencana (over budget).'}
            <br />
            <strong>SPI {evm.spi.toFixed(2)}:</strong> {evm.spi >= 1 ? 'Jadwal lebih cepat dari rencana (ahead of schedule).' : 'Jadwal terlambat dari rencana (behind schedule).'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const InfoItem = ({ label, value, isNegative }: { label: string; value: string; isNegative?: boolean }) => (
  <div className="p-3 bg-violet-essence/30 rounded-md">
    <p className="text-sm text-palladium">{label}</p>
    <p className={`text-xl font-bold ${isNegative ? 'text-red-500' : 'text-green-500'}`}>{value}</p>
  </div>
);