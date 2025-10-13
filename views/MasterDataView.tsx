import React from 'react';

import { Worker } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { PlusCircle } from 'lucide-react';

interface MasterDataViewProps {
  workers: Worker[];
  // In a real app, you'd have callbacks to add/edit/delete workers
  // onAddWorker: (worker: Omit<Worker, 'id'>) => void;
}

export default function MasterDataView({ workers }: MasterDataViewProps) {
  // In a real app, you might have state for tabs: const [activeTab, setActiveTab] = useState('workers');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>Master Data</CardTitle>
                <CardDescription>Kelola data referensi seperti pekerja, material, dan pemasok.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
             {/* Tab implementation would go here */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Daftar Tenaga Kerja</h3>
                    <Button><PlusCircle className="w-4 h-4 mr-2"/>Tambah Pekerja</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-night-black">
                        <thead className="bg-violet-essence/50 text-xs uppercase">
                            <tr>
                                <th className="p-3">ID Pekerja</th>
                                <th className="p-3">Nama Lengkap</th>
                                <th className="p-3">Tipe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workers.map(worker => (
                                <tr key={worker.id} className="border-b border-violet-essence hover:bg-violet-essence/30">
                                    <td className="p-3 font-mono">{worker.id}</td>
                                    <td className="p-3 font-medium">{worker.name}</td>
                                    <td className="p-3">{worker.type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Placeholder for other master data, e.g., Materials */}
            {/* <div className="mt-8"> ... Table for Materials ... </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
