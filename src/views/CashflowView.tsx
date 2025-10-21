import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Termin, Expense } from '@/types';
import { formatCurrency, formatDate } from '@/constants';

interface CashflowViewProps {
  termins: Termin[];
  expenses: Expense[];
}

export default function CashflowView({ termins, expenses }: CashflowViewProps) {
  const totalIncome = termins.reduce((sum, t) => sum + (t.status === 'Dibayar' ? t.amount : 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cashBalance = totalIncome - totalExpense;

  const combinedFlows = [
    ...termins.map((t) => ({
      date: t.date,
      description: `Penerimaan Termin: ${t.description}`,
      amount: t.amount,
      type: 'income' as const,
    })),
    ...expenses.map((e) => ({
      date: e.date,
      description: e.description,
      amount: e.amount,
      type: 'expense' as const,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arus Kas Proyek</CardTitle>
        <CardDescription>Monitor aliran masuk dan keluar dana proyek.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatBox
            label="Total Pemasukan"
            value={formatCurrency(totalIncome)}
            color="text-green-600"
          />
          <StatBox
            label="Total Pengeluaran"
            value={formatCurrency(totalExpense)}
            color="text-red-600"
          />
          <StatBox
            label="Saldo Kas"
            value={formatCurrency(cashBalance)}
            color={cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-night-black">
            <thead className="bg-violet-essence/50 text-xs uppercase">
              <tr>
                <th className="p-3 text-left">Tanggal</th>
                <th className="p-3 text-left">Deskripsi</th>
                <th className="p-3 text-right">Pemasukan</th>
                <th className="p-3 text-right">Pengeluaran</th>
              </tr>
            </thead>
            <tbody>
              {combinedFlows.map((flow, index) => (
                <tr
                  key={index}
                  className="border-b border-violet-essence hover:bg-violet-essence/30"
                >
                  <td className="p-2">{formatDate(flow.date)}</td>
                  <td className="p-2">{flow.description}</td>
                  <td className="p-2 text-right text-green-600 font-medium">
                    {flow.type === 'income' ? formatCurrency(flow.amount) : '-'}
                  </td>
                  <td className="p-2 text-right text-red-600 font-medium">
                    {flow.type === 'expense' ? formatCurrency(flow.amount) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

const StatBox = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="p-4 bg-violet-essence/30 rounded-lg text-center">
    <p className="text-sm text-palladium">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);
