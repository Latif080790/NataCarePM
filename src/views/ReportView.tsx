import { useState, useMemo } from 'react';

import { CardPro, CardProHeader, CardProContent, CardProTitle, CardProDescription } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import { Download } from 'lucide-react';
import { Project, ProjectMetrics } from '@/types';
import { formatCurrency, getTodayDateString } from '@/constants';
import { Input } from '@/components/FormControls';

interface ReportViewProps {
  projectMetrics: ProjectMetrics;
  project: Project;
}

export default function ReportView({ projectMetrics, project }: ReportViewProps) {
  const { totalBudget, actualCost, overallProgress, evm } = projectMetrics;
  const [startDate, setStartDate] = useState(project.startDate);
  const [endDate, setEndDate] = useState(getTodayDateString());

  const filteredMetrics = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filteredExpenses = project.expenses.filter((e) => {
      const eDate = new Date(e.date);
      return eDate >= start && eDate <= end;
    });

    const periodCost = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // This is a simplified calculation for demo purposes. A real implementation would be more complex.
    return {
      periodCost,
      itemsCompleted: project.dailyReports.filter((r) => {
        const rDate = new Date(r.date);
        return rDate >= start && rDate <= end;
      }).length,
    };
  }, [startDate, endDate, project]);

  return (
    <CardPro variant="elevated">
      <CardProHeader className="flex flex-row justify-between items-center flex-wrap gap-4">
        <div>
          <CardProTitle>Pusat Laporan</CardProTitle>
          <CardProDescription>
            Hasilkan laporan PDF ringkas mengenai status dan kinerja proyek.
          </CardProDescription>
        </div>
        <ButtonPro variant="primary" icon={Download}>
          Unduh Laporan PDF
        </ButtonPro>
      </CardProHeader>
      <CardProContent>
        <div className="flex items-center gap-4 mb-6 p-4 bg-violet-essence/30 rounded-lg">
          <div className="flex-1">
            <label className="text-sm font-medium">Tanggal Mulai</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">Tanggal Selesai</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="p-6 border border-violet-essence rounded-lg bg-white/5">
          <h3 className="text-lg font-bold text-center mb-1">Laporan Kemajuan Proyek</h3>
          <p className="text-sm text-center text-palladium mb-6">
            Periode: {startDate} s/d {endDate}
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div className="font-semibold text-palladium">Biaya Periode Ini:</div>
            <div className="font-bold text-lg text-persimmon">
              {formatCurrency(filteredMetrics.periodCost)}
            </div>

            <div className="font-semibold text-palladium">Laporan Harian Dibuat:</div>
            <div>{filteredMetrics.itemsCompleted} Laporan</div>
          </div>

          <h4 className="font-semibold mb-2 text-base border-t pt-4">
            Ringkasan Proyek Keseluruhan
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="font-semibold text-palladium">Progres Keseluruhan:</div>
            <div className="font-bold text-lg text-persimmon">{overallProgress.toFixed(2)}%</div>

            <div className="font-semibold text-palladium">Total Anggaran (BAC):</div>
            <div>{formatCurrency(totalBudget)}</div>

            <div className="font-semibold text-palladium">Biaya Aktual (AC):</div>
            <div>{formatCurrency(actualCost)}</div>

            <div className="font-semibold text-palladium">Kinerja Biaya (CPI):</div>
            <div className={evm.cpi < 1 ? 'text-red-500' : 'text-green-500'}>
              {evm.cpi.toFixed(2)} ({evm.cpi < 1 ? 'Over Budget' : 'Under Budget'})
            </div>

            <div className="font-semibold text-palladium">Kinerja Jadwal (SPI):</div>
            <div className={evm.spi < 1 ? 'text-red-500' : 'text-green-500'}>
              {evm.spi.toFixed(2)} ({evm.spi < 1 ? 'Behind Schedule' : 'Ahead of Schedule'})
            </div>
          </div>
        </div>
      </CardProContent>
    </CardPro>
  );
}
