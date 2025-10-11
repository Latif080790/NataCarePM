import React, { useState } from 'react';
import { RabItem, AhspData } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { formatCurrency } from '../constants';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Download } from 'lucide-react';

interface RabAhspViewProps {
  items: RabItem[];
  ahspData: AhspData;
}

export default function RabAhspView({ items, ahspData }: RabAhspViewProps) {
  const [selectedItem, setSelectedItem] = useState<RabItem | null>(null);

  // Safe guard: Check if items and ahspData are defined
  if (!items || !ahspData) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-palladium">Loading data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalBudget = items.reduce((sum, item) => sum + (item?.volume || 0) * (item?.hargaSatuan || 0), 0);

  const getAhspDetails = (ahspId: string) => {
    return {
      labors: ahspData?.labors?.[ahspId] || {},
      materials: ahspData?.materials?.[ahspId] || {}
    };
  };

  const handleExportCsv = () => {
    const headers = ["No", "Uraian Pekerjaan", "Volume", "Satuan", "Harga Satuan", "Jumlah Harga"];
    const rows = items.map(item => [
      item.no,
      `"${item.uraian.replace(/"/g, '""')}"`, // Escape quotes
      item.volume,
      item.satuan,
      item.hargaSatuan,
      item.volume * item.hargaSatuan
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "rab_proyek.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Rencana Anggaran Biaya (RAB)</CardTitle>
              <CardDescription>Rincian item pekerjaan beserta anggaran biaya yang direncanakan.</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportCsv}>
                <Download className="w-4 h-4 mr-2" />
                Ekspor ke CSV
            </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-night-black">
              <thead className="bg-violet-essence/50 text-xs uppercase">
                <tr>
                  <th className="p-3">No.</th>
                  <th className="p-3">Uraian Pekerjaan</th>
                  <th className="p-3 text-right">Volume</th>
                  <th className="p-3">Satuan</th>
                  <th className="p-3 text-right">Harga Satuan</th>
                  <th className="p-3 text-right">Jumlah Harga</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  // Safe guard for undefined properties
                  if (!item) return null;
                  
                  const hasAhspData = ahspData?.labors?.[item.ahspId];
                  
                  return (
                    <tr key={item.id} className="border-b border-violet-essence hover:bg-violet-essence/30">
                      <td className="p-3 font-medium">{item.no || '-'}</td>
                      <td className="p-3">
                        <button 
                          onClick={() => setSelectedItem(item)} 
                          className={`${hasAhspData ? 'text-persimmon hover:underline font-semibold' : 'text-palladium cursor-default'}`}
                          disabled={!hasAhspData}
                        >
                          {item.uraian || 'N/A'}
                        </button>
                      </td>
                      <td className="p-3 text-right">{(item.volume || 0).toFixed(2)}</td>
                      <td className="p-3">{item.satuan || '-'}</td>
                      <td className="p-3 text-right">{formatCurrency(item.hargaSatuan || 0)}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency((item.volume || 0) * (item.hargaSatuan || 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-violet-essence/50 text-base">
                  <td colSpan={5} className="p-4 text-right">Total Anggaran Proyek (RAB)</td>
                  <td className="p-4 text-right">{formatCurrency(totalBudget)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {selectedItem && (
        <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={`Detail AHSP: ${selectedItem.uraian}`}>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-night-black mb-2">Tenaga Kerja</h4>
              <ul className="list-disc list-inside text-sm text-palladium space-y-1">
                {Object.entries(getAhspDetails(selectedItem.ahspId).labors || {}).map(([type, coef]) => (
                  <li key={type}>{type}: {coef} OH</li>
                ))}
                {Object.keys(getAhspDetails(selectedItem.ahspId).labors || {}).length === 0 && (
                  <li className="text-palladium italic">Tidak ada data tenaga kerja</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-night-black mb-2">Material</h4>
              <ul className="list-disc list-inside text-sm text-palladium space-y-1">
                 {Object.entries(getAhspDetails(selectedItem.ahspId).materials || {}).map(([name, coef]) => (
                  <li key={name}>{name}: {coef} {ahspData?.materialUnits?.[name] || '-'}</li>
                ))}
                {Object.keys(getAhspDetails(selectedItem.ahspId).materials || {}).length === 0 && (
                  <li className="text-palladium italic">Tidak ada data material</li>
                )}
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}