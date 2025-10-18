
import { Expense, ProjectMetrics } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { formatCurrency, formatDate } from '../constants';
import { Progress } from '../components/Progress';
import { LineChart } from '../components/LineChart';
import { useElementSize } from '../hooks/useElementSize';
import { PermissionGate } from '../components/PermissionGate';
import { useRequirePermission } from '../hooks/usePermissions';
import { Lock } from 'lucide-react';


interface FinanceViewProps {
  expenses: Expense[];
  projectMetrics: ProjectMetrics;
}

export default function FinanceView({ expenses, projectMetrics }: FinanceViewProps) {
  // Require permission to view finances
  const { allowed, reason, suggestedAction } = useRequirePermission('view_finances');
  
  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
        <Lock className="w-16 h-16 text-palladium mb-4" />
        <h2 className="text-2xl font-bold text-night-black mb-2">Access Restricted</h2>
        <p className="text-palladium mb-4">{reason}</p>
        {suggestedAction && (
          <p className="text-sm text-persimmon">{suggestedAction}</p>
        )}
      </div>
    );
  }
  const { totalBudget, actualCost, sCurveData } = projectMetrics;
  const expensePercentage = totalBudget > 0 ? (actualCost / totalBudget) * 100 : 0;
  const [chartContainerRef, { width }] = useElementSize();
  
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Perbandingan Anggaran & Biaya Aktual (S-Curve)</CardTitle>
                <CardDescription>Visualisasi kumulatif biaya yang direncanakan terhadap biaya aktual seiring waktu.</CardDescription>
            </CardHeader>
            <CardContent ref={chartContainerRef}>
                <LineChart data={sCurveData} width={width || 600} height={300} />
                <div className="flex justify-center items-center gap-6 mt-4 text-sm text-palladium">
                    <div className="flex items-center gap-2"><div className="w-8 border-t-2 border-dashed border-palladium"></div> Biaya Direncanakan</div>
                    <div className="flex items-center gap-2"><div className="w-8 h-1 bg-persimmon"></div> Biaya Aktual</div>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Rincian Biaya Proyek</CardTitle>
                <CardDescription>Monitor semua pengeluaran yang tercatat untuk proyek ini.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6 p-4 bg-violet-essence/30 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-palladium">Total Pengeluaran</span>
                        <span className="text-sm font-medium text-palladium">Total Anggaran</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl font-bold text-persimmon">{formatCurrency(actualCost)}</span>
                        <span className="text-lg font-semibold text-night-black">{formatCurrency(totalBudget)}</span>
                    </div>
                    <Progress value={expensePercentage} />
                    <p className="text-right text-xs mt-1 text-palladium">{expensePercentage.toFixed(1)}% dari anggaran telah digunakan.</p>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-night-black">
                        <thead className="bg-violet-essence/50 text-xs uppercase">
                            <tr>
                                <th className="p-3">Tanggal</th>
                                <th className="p-3">Deskripsi</th>
                                <th className="p-3">Tipe</th>
                                <th className="p-3 text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                <tr key={expense.id} className="border-b border-violet-essence hover:bg-violet-essence/30">
                                    <td className="p-3">{formatDate(expense.date)}</td>
                                    <td className="p-3 font-medium">{expense.description}</td>
                                    <td className="p-3">{expense.type}</td>
                                    <td className="p-3 text-right font-semibold">{formatCurrency(expense.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
