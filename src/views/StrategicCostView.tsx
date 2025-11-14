import { CardPro, CardProContent, CardProHeader, CardProTitle, CardProDescription } from '@/components/DesignSystem';
import { ProjectMetrics } from '@/types';
import { formatCurrency } from '@/constants';

interface StrategicCostViewProps {
  projectMetrics: ProjectMetrics;
}

export default function StrategicCostView({ projectMetrics }: StrategicCostViewProps) {
  const { totalBudget, actualCost, earnedValue, plannedValue, evm } = projectMetrics;

  return (
    <CardPro variant="elevated" className="hover:shadow-lg transition-shadow">
      <CardProHeader>
        <CardProTitle>Kontrol Biaya Strategis (Earned Value Management)</CardProTitle>
        <CardProDescription>
          Analisis kinerja proyek menggunakan metrik Nilai Hasil (Earned Value).
        </CardProDescription>
      </CardProHeader>
      <CardProContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Total Anggaran (BAC)" value={formatCurrency(totalBudget)} />
          <InfoItem label="Biaya Aktual (AC)" value={formatCurrency(actualCost)} />
          <InfoItem label="Nilai Hasil (EV)" value={formatCurrency(earnedValue)} />
          <InfoItem label="Nilai Rencana (PV)" value={formatCurrency(plannedValue)} />
          <InfoItem
            label="Varian Biaya (CV = EV - AC)"
            value={formatCurrency(evm.cv)}
            isNegative={evm.cv < 0}
          />
          <InfoItem
            label="Varian Jadwal (SV = EV - PV)"
            value={formatCurrency(evm.sv)}
            isNegative={evm.sv < 0}
          />
          <InfoItem
            label="Indeks Kinerja Biaya (CPI = EV / AC)"
            value={evm.cpi.toFixed(2)}
            isNegative={evm.cpi < 1}
          />
          <InfoItem
            label="Indeks Kinerja Jadwal (SPI = EV / PV)"
            value={evm.spi.toFixed(2)}
            isNegative={evm.spi < 1}
          />
        </div>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold mb-2 text-gray-900">Interpretasi</h4>
          <p className="text-sm text-gray-700">
            <strong>CPI {evm.cpi.toFixed(2)}:</strong>{' '}
            {evm.cpi >= 1
              ? 'Biaya lebih efisien dari rencana (under budget).'
              : 'Biaya melebihi rencana (over budget).'}
            <br />
            <strong>SPI {evm.spi.toFixed(2)}:</strong>{' '}
            {evm.spi >= 1
              ? 'Jadwal lebih cepat dari rencana (ahead of schedule).'
              : 'Jadwal terlambat dari rencana (behind schedule).'}
          </p>
        </div>
      </CardProContent>
    </CardPro>
  );
}

const InfoItem = ({
  label,
  value,
  isNegative,
}: {
  label: string;
  value: string;
  isNegative?: boolean;
}) => (
  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
    <p className="text-sm text-gray-600">{label}</p>
    <p className={`text-xl font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>{value}</p>
  </div>
);
