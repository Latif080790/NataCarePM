import { CardPro, CardProContent, CardProHeader, CardProTitle, CardProDescription } from '@/components/CardPro';
import { AuditLog } from '@/types';

interface AuditTrailViewProps {
  auditLog: AuditLog[];
}

export default function AuditTrailView({ auditLog }: AuditTrailViewProps) {
  return (
    <CardPro variant="elevated" className="hover:shadow-lg transition-shadow">
      <CardProHeader>
        <CardProTitle>Jejak Audit (Audit Trail)</CardProTitle>
        <CardProDescription>
          Catatan kronologis dari semua aktivitas penting dalam proyek.
        </CardProDescription>
      </CardProHeader>
      <CardProContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-900">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                <th className="p-3">Waktu</th>
                <th className="p-3">Pengguna</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3 whitespace-nowrap text-gray-600">
                    {new Date(log.timestamp).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="p-3 font-medium text-gray-900">{log.userName}</td>
                  <td className="p-3 text-gray-700">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardProContent>
    </CardPro>
  );
}
