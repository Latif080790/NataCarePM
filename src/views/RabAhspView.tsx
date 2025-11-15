import { useState } from 'react';
import { RabItem, AhspData } from '@/types';
import { CardPro, CardProHeader, CardProContent, CardProTitle, CardProDescription } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import { formatCurrency } from '@/constants';
import { Modal } from '@/components/Modal';
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
      <CardPro variant="elevated">
        <CardProContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-600">Loading data...</p>
          </div>
        </CardProContent>
      </CardPro>
    );
  }

  const totalBudget = items.reduce(
    (sum, item) => sum + (item?.volume || 0) * (item?.hargaSatuan || 0),
    0
  );

  const getAhspDetails = (ahspId: string) => {
    return {
      labors: ahspData?.labors?.[ahspId] || {},
      materials: ahspData?.materials?.[ahspId] || {},
    };
  };

  const handleExportCsv = () => {
    // Guard: Check if items exist and is array
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.warn('[RabAhspView] No items to export');
      return;
    }

    const headers = ['No', 'Uraian Pekerjaan', 'Volume', 'Satuan', 'Harga Satuan', 'Jumlah Harga'];
    const rows = items.map((item) =>
      [
        item?.no || '',
        `"${(item?.uraian || '').replace(/"/g, '""')}"`, // Escape quotes
        item?.volume || 0,
        item?.satuan || '',
        item?.hargaSatuan || 0,
        (item?.volume || 0) * (item?.hargaSatuan || 0),
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'rab_proyek.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <CardPro variant="elevated">
        <CardProHeader className="flex flex-row justify-between items-center">
          <div>
            <CardProTitle>Rencana Anggaran Biaya (RAB)</CardProTitle>
            <CardProDescription>
              Rincian item pekerjaan beserta anggaran biaya yang direncanakan.
            </CardProDescription>
          </div>
          <ButtonPro variant="outline" icon={Download} onClick={handleExportCsv}>
            Ekspor ke CSV
          </ButtonPro>
        </CardProHeader>
        <CardProContent>
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
                {(!items || !Array.isArray(items) || items.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    // Safe guard for undefined properties
                    if (!item) return null;

                  const hasAhspData = ahspData?.labors?.[item.ahspId];

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-violet-essence hover:bg-violet-essence/30"
                    >
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
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency((item.volume || 0) * (item.hargaSatuan || 0))}
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-violet-essence/50 text-base">
                  <td colSpan={5} className="p-4 text-right">
                    Total Anggaran Proyek (RAB)
                  </td>
                  <td className="p-4 text-right">{formatCurrency(totalBudget)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardProContent>
      </CardPro>

      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Detail AHSP: ${selectedItem.uraian}`}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-night-black mb-2">Tenaga Kerja</h4>
              <ul className="list-disc list-inside text-sm text-palladium space-y-1">
                {Object.entries(getAhspDetails(selectedItem.ahspId).labors || {}).map(
                  ([type, coef]) => (
                    <li key={type}>
                      {type}: {coef} OH
                    </li>
                  )
                )}
                {Object.keys(getAhspDetails(selectedItem.ahspId).labors || {}).length === 0 && (
                  <li className="text-palladium italic">Tidak ada data tenaga kerja</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-night-black mb-2">Material</h4>
              <ul className="list-disc list-inside text-sm text-palladium space-y-1">
                {Object.entries(getAhspDetails(selectedItem.ahspId).materials || {}).map(
                  ([name, coef]) => (
                    <li key={name}>
                      {name}: {coef} {ahspData?.materialUnits?.[name] || '-'}
                    </li>
                  )
                )}
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

