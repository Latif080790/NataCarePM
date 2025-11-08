import { Worker } from '@/types';
import { CardPro, CardProContent, CardProHeader, CardProTitle, CardProDescription } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import { PlusCircle } from 'lucide-react';

interface MasterDataViewProps {
  workers: Worker[];
}

export default function MasterDataView({ workers }: MasterDataViewProps) {
  return (
    <div className="space-y-6">
      <CardPro variant="elevated" className="hover:shadow-lg transition-shadow">
        <CardProHeader>
          <div className="flex flex-row justify-between items-center">
            <div>
              <CardProTitle>Master Data</CardProTitle>
              <CardProDescription>
                Kelola data referensi seperti pekerja, material, dan pemasok.
              </CardProDescription>
            </div>
          </div>
        </CardProHeader>
        <CardProContent>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Daftar Tenaga Kerja</h3>
              <ButtonPro variant="primary" icon={PlusCircle}>
                Tambah Pekerja
              </ButtonPro>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-900">
                <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="p-3">ID Pekerja</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">Tipe</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr
                      key={worker.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 font-mono text-gray-600">{worker.id}</td>
                      <td className="p-3 font-medium text-gray-900">{worker.name}</td>
                      <td className="p-3 text-gray-700">{worker.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardProContent>
      </CardPro>
    </div>
  );
}
