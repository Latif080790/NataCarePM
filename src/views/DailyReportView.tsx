// React default import removed (using automatic JSX runtime)
import { useState } from 'react';
import { DailyReport, RabItem, Worker, WorkProgress } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { formatDate, getTodayDateString, hasPermission } from '@/constants';
import { PlusCircle, Sun, Cloud, CloudRain } from 'lucide-react';
import { Input, Select } from '@/components/FormControls';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { CommentThread } from '@/components/CommentThread';

interface DailyReportViewProps {
  dailyReports: DailyReport[];
  rabItems: RabItem[];
  workers: Worker[];
  onAddReport: (report: Omit<DailyReport, 'id' | 'comments'>) => void;
}

const WeatherIcon = ({ weather }: { weather: DailyReport['weather'] }) => {
  switch (weather) {
    case 'Cerah':
      return <Sun className="w-5 h-5 text-yellow-500" />;
    case 'Berawan':
      return <Cloud className="w-5 h-5 text-gray-500" />;
    case 'Hujan':
      return <CloudRain className="w-5 h-5 text-blue-500" />;
    default:
      return null;
  }
};

export default function DailyReportView({
  dailyReports,
  rabItems,
  onAddReport,
}: DailyReportViewProps) {
  const { currentUser } = useAuth();
  const { handleAddComment } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

  const [newReport, setNewReport] = useState<Omit<DailyReport, 'id' | 'comments'>>({
    date: getTodayDateString(),
    weather: 'Cerah',
    notes: '',
    workforce: [],
    workProgress: [],
    materialsConsumed: [],
    photos: [],
  });

  const handleAddWorkProgress = () => {
    setNewReport((prev) => ({
      ...prev,
      workProgress: [...prev.workProgress, { rabItemId: 0, completedVolume: 0 }],
    }));
  };

  const handleWorkProgressChange = (index: number, field: keyof WorkProgress, value: any) => {
    const updated = [...newReport.workProgress];
    updated[index] = {
      ...updated[index],
      [field]: field === 'rabItemId' ? parseInt(value) : parseFloat(value),
    };
    setNewReport((prev) => ({ ...prev, workProgress: updated }));
  };

  const handleSubmit = () => {
    onAddReport(newReport);
    setIsModalOpen(false);
    setNewReport({
      date: getTodayDateString(),
      weather: 'Cerah',
      notes: '',
      workforce: [],
      workProgress: [],
      materialsConsumed: [],
      photos: [],
    });
  };

  const canCreateReport = hasPermission(currentUser, 'create_daily_reports');

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Laporan Harian Proyek</CardTitle>
            <CardDescription>
              Catatan harian mengenai progres, cuaca, tenaga kerja, dan material.
            </CardDescription>
          </div>
          {canCreateReport && (
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Buat Laporan Baru
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyReports
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((report) => (
                <div
                  key={report.id}
                  className="p-4 border border-violet-essence rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{formatDate(report.date)}</h3>
                      <p className="text-sm text-palladium flex items-center gap-2">
                        Cuaca: {report.weather} <WeatherIcon weather={report.weather} />
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                      Lihat Detail & Komentar
                    </Button>
                  </div>
                  <p className="text-sm mt-2 italic">"{report.notes}"</p>
                  <div className="text-xs mt-2 text-palladium">
                    {report.workProgress.length} item progres, {report.workforce.length} pekerja
                    hadir.
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Laporan Harian Baru"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <label className="block text-sm font-medium text-night-black">Tanggal</label>
          <Input
            type="date"
            value={newReport.date}
            onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
          />

          <label className="block text-sm font-medium text-night-black">Cuaca</label>
          <Select
            value={newReport.weather}
            onChange={(e) => setNewReport({ ...newReport, weather: e.target.value as any })}
          >
            <option>Cerah</option>
            <option>Berawan</option>
            <option>Hujan</option>
          </Select>

          <label className="block text-sm font-medium text-night-black">Catatan Umum</label>
          <Input
            placeholder="Contoh: Pengecoran kolom lantai 1 selesai"
            value={newReport.notes}
            onChange={(e) => setNewReport({ ...newReport, notes: e.target.value })}
          />

          <h4 className="font-semibold pt-2 border-t">Progres Pekerjaan</h4>
          {newReport.workProgress.map((wp, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Select
                className="flex-grow"
                value={wp.rabItemId}
                onChange={(e) => handleWorkProgressChange(index, 'rabItemId', e.target.value)}
              >
                <option value={0} disabled>
                  Pilih Pekerjaan
                </option>
                {rabItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.uraian}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                placeholder="Volume"
                className="w-24"
                value={wp.completedVolume || ''}
                onChange={(e) => handleWorkProgressChange(index, 'completedVolume', e.target.value)}
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddWorkProgress}>
            + Tambah Progres
          </Button>

          <div className="text-right pt-4">
            <Button onClick={handleSubmit}>Simpan Laporan</Button>
          </div>
        </div>
      </Modal>

      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Detail Laporan - ${formatDate(selectedReport.date)}`}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <p>
              <strong>Cuaca:</strong> {selectedReport.weather}
            </p>
            <p>
              <strong>Catatan:</strong> {selectedReport.notes}
            </p>
            <h4 className="font-bold mt-2">Progres:</h4>
            <ul className="list-disc list-inside text-sm pl-4">
              {selectedReport.workProgress.map((wp) => (
                <li key={wp.rabItemId}>
                  {rabItems.find((i) => i.id === wp.rabItemId)?.uraian}: {wp.completedVolume}{' '}
                  {rabItems.find((i) => i.id === wp.rabItemId)?.satuan}
                </li>
              ))}
            </ul>
            <div className="border-t pt-4 mt-4">
              <CommentThread
                comments={selectedReport.comments || []}
                onAddComment={(content) => handleAddComment(selectedReport.id, content)}
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
