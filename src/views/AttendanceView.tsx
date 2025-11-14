import { useState, useMemo, useEffect } from 'react';
import { CardPro, CardProContent, CardProHeader, CardProTitle, CardProDescription } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import { InputPro } from '@/components/DesignSystem';
import { Attendance, Worker } from '@/types';
import { getTodayDateString, formatDate } from '@/constants';
import { UserCheck, UserX, User, Lock, MapPin } from 'lucide-react';
import { usePermissions, useRequirePermission } from '@/hooks/usePermissions';
import { GPSCapture, GeolocationData } from '@/components/GPSCapture';
import { Modal } from '@/components/Modal';

interface AttendanceViewProps {
  attendances: Attendance[];
  workers: Worker[];
  onUpdateAttendance: (date: string, updates: Map<string, Attendance['status']>) => void;
}

export default function AttendanceView({
  attendances,
  workers,
  onUpdateAttendance,
}: AttendanceViewProps) {
  // Check view permission
  const { allowed: canView, reason, suggestedAction } = useRequirePermission('view_attendance');
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('manage_attendance');

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
        <Lock className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600 mb-4">{reason}</p>
        {suggestedAction && <p className="text-sm text-orange-600">{suggestedAction}</p>}
      </div>
    );
  }
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [localAttendance, setLocalAttendance] = useState<Map<string, Attendance['status']>>(
    new Map()
  );
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [locationData, setLocationData] = useState<Map<string, GeolocationData>>(new Map());

  useEffect(() => {
    // Populate local state based on global state for the selected date
    const attendanceMap = new Map<string, Attendance['status']>();
    
    // ✅ FIX: Add null check for attendances
    const recordsForDate = (attendances || []).filter((a) => a.date === selectedDate);

    // ✅ FIX: Add null check for workers
    (workers || []).forEach((worker) => {
      const record = recordsForDate.find((r) => r.workerId === worker.id);
      // Default to 'Alpa' if no record found for a worker on that day
      attendanceMap.set(worker.id, record ? record.status : 'Alpa');
    });
    setLocalAttendance(attendanceMap);
  }, [selectedDate, attendances, workers]);

  const handleStatusChange = (workerId: string, status: Attendance['status']) => {
    setLocalAttendance(new Map(localAttendance.set(workerId, status)));
  };

  const handleGPSCapture = (geoData: GeolocationData) => {
    const newLocationData = new Map(locationData);
    newLocationData.set(selectedDate, geoData);
    setLocationData(newLocationData);
    setGpsModalOpen(false);
  };

  const handleSaveChanges = () => {
    onUpdateAttendance(selectedDate, localAttendance);
    alert('Absensi berhasil disimpan!');
  };

  const summary = useMemo(() => {
    const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
    for (const status of localAttendance.values()) {
      counts[status]++;
    }
    return counts;
  }, [localAttendance]);

  return (
    <div className="space-y-6">
      <CardPro variant="elevated" className="hover:shadow-lg transition-shadow">
        <CardProHeader>
          <CardProTitle>Absensi Tenaga Kerja</CardProTitle>
          <CardProDescription>
            Catat kehadiran harian dari daftar pekerja terdaftar untuk perhitungan upah yang akurat.
          </CardProDescription>
        </CardProHeader>
        <CardProContent>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div className="flex gap-2">
              <InputPro 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
                disabled={!canManage}
              />
              <ButtonPro onClick={() => setGpsModalOpen(true)} variant="secondary" icon={MapPin} disabled={!canManage}>
                GPS
              </ButtonPro>
            </div>
            <div className="flex gap-4 text-sm text-gray-900">
              <span className="flex items-center">
                <UserCheck className="w-4 h-4 mr-1 text-green-500" />
                Hadir: {summary.Hadir || 0}
              </span>
              <span className="flex items-center">
                <UserX className="w-4 h-4 mr-1 text-red-500" />
                Alpa: {summary.Alpa || 0}
              </span>
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1 text-yellow-500" />
                Izin/Sakit: {(summary.Izin || 0) + (summary.Sakit || 0)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-900">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  <th className="p-3">Nama Pekerja</th>
                  <th className="p-3">Tipe</th>
                  <th className="p-3 text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {(!workers || workers.length === 0) ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      Tidak ada data pekerja. Silakan tambahkan pekerja terlebih dahulu.
                    </td>
                  </tr>
                ) : (
                  workers.map((worker) => (
                    <tr
                      key={worker.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 font-medium">{worker.name}</td>
                      <td className="p-3">{worker.type}</td>
                      <td className="p-3 text-center">
                        <select 
                          value={localAttendance.get(worker.id) || 'Alpa'}
                          onChange={(e) =>
                            handleStatusChange(worker.id, e.target.value as Attendance['status'])
                          }
                          className="max-w-xs mx-auto"
                          disabled={!canManage}
                        >
                          <option>Hadir</option>
                          <option>Sakit</option>
                          <option>Izin</option>
                          <option>Alpa</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="text-right mt-6">
            <ButtonPro onClick={handleSaveChanges} variant="primary" disabled={!canManage}>
              Simpan Absensi untuk {formatDate(selectedDate)}
            </ButtonPro>
            {!canManage && (
              <p className="text-xs text-gray-600 mt-2">
                You need "manage_attendance" permission to edit attendance
              </p>
            )}
          </div>
        </CardProContent>
      </CardPro>

      <Modal isOpen={gpsModalOpen} onClose={() => setGpsModalOpen(false)} title="Capture GPS Location">
        <GPSCapture 
          onCapture={handleGPSCapture}
          workSiteLocation={{ lat: -6.2088, lng: 106.8456, radius: 100 }}
        />
      </Modal>
    </div>
  );
}


