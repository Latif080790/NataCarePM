import { Expense, ProjectMetrics } from '@/types';
import { CardPro, CardProContent, CardProHeader, CardProTitle, CardProDescription } from '@/components/CardPro';
import { formatCurrency, formatDate } from '@/constants';
import { Progress } from '@/components/Progress';
import { LineChart } from '@/components/LineChart';
import { useElementSize } from '@/hooks/useElementSize';
import { useRequirePermission } from '@/hooks/usePermissions';
import { Lock } from 'lucide-react';

interface FinanceViewProps {
  expenses: Expense[];
  projectMetrics: ProjectMetrics;
}

export default function FinanceView({ expenses, projectMetrics }: FinanceViewProps) {
  const { allowed, reason, suggestedAction } = useRequirePermission('view_finances');

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
        <Lock className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-night-black mb-2">Access Restricted</h2>
        <p className="text-gray-600 mb-4">{reason}</p>
        {suggestedAction && <p className="text-sm text-info">{suggestedAction}</p>}
      </div>
    );
  }
  const { totalBudget, actualCost, sCurveData } = projectMetrics;
  const expensePercentage = totalBudget > 0 ? (actualCost / totalBudget) * 100 : 0;
  const [chartContainerRef, { width }] = useElementSize();

  return (
    <div className="space-y-6">
      <CardPro variant="elevated" className="hover:shadow-lg transition-shadow">
        <CardProHeader>
          <CardProTitle>Perbandingan Anggaran & Biaya Aktual (S-Curve)</CardProTitle>
          <CardProDescription>
            Visualisasi kumulatif biaya yang direncanakan terhadap biaya aktual seiring waktu.
          </CardProDescription>
        </CardProHeader>
        <CardProContent>
          <div ref={chartContainerRef}>
            <LineChart data={sCurveData} width={width || 600} height={300} />
            <div className="flex justify-center items-center gap-6 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 border-t-2 border-dashed border-gray-400"></div> Biaya
                Direncanakan
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-blue-600"></div> Biaya Aktual
              </div>
            </div>
          </div>
        </CardProContent>
      </CardPro>
      <CardPro variant="elevated" className="hover:shadow-lg transition-shadow">
        <CardProHeader>
          <CardProTitle>Rincian Biaya Proyek</CardProTitle>
          <CardProDescription>
            Monitor semua pengeluaran yang tercatat untuk proyek ini.
          </CardProDescription>
        </CardProHeader>
        <CardProContent>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Total Pengeluaran</span>
              <span className="text-sm font-medium text-gray-600">Total Anggaran</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-bold text-info">
                {formatCurrency(actualCost)}
              </span>
              <span className="text-lg font-semibold text-night-black">
                {formatCurrency(totalBudget)}
              </span>
            </div>
            <Progress value={expensePercentage} />
            <p className="text-right text-xs mt-1 text-gray-600">
              {expensePercentage.toFixed(1)}% dari anggaran telah digunakan.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-night-black">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Deskripsi</th>
                  <th className="p-3">Tipe</th>
                  <th className="p-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {(!expenses || expenses.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Belum ada pengeluaran tercatat. Klik "Tambah Pengeluaran" untuk memulai.
                    </td>
                  </tr>
                ) : (
                  expenses
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3 text-gray-700">{formatDate(expense.date)}</td>
                        <td className="p-3 font-medium text-night-black">{expense.description}</td>
                        <td className="p-3 text-gray-700">{expense.type}</td>
                        <td className="p-3 text-right font-semibold text-night-black">
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </CardProContent>
      </CardPro>
    </div>
  );
}
