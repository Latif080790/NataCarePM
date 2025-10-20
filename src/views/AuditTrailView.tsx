
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { AuditLog } from '@/types';
import { formatDate } from '@/constants';

interface AuditTrailViewProps {
    auditLog: AuditLog[];
}

export default function AuditTrailView({ auditLog }: AuditTrailViewProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Jejak Audit (Audit Trail)</CardTitle>
                <CardDescription>Catatan kronologis dari semua aktivitas penting dalam proyek.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-night-black">
                        <thead className="bg-violet-essence/50 text-xs uppercase">
                            <tr>
                                <th className="p-3">Waktu</th>
                                <th className="p-3">Pengguna</th>
                                <th className="p-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditLog.map(log => (
                                <tr key={log.id} className="border-b border-violet-essence hover:bg-violet-essence/30">
                                    <td className="p-3 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString('id-ID', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </td>
                                    <td className="p-3 font-medium">{log.userName}</td>
                                    <td className="p-3">{log.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
