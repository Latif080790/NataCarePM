import { useState, useMemo, useEffect } from 'react';
import {
  User,
  Lock,
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  ButtonPro,
  InputPro,
  EnterpriseLayout,
  PageHeader,
  SectionLayout,
  StatCardPro,
  TablePro
} from '@/components/DesignSystem';
import { Attendance, Worker } from '@/types';
import { getTodayDateString, formatDate } from '@/constants';
import { usePermissions, useRequirePermission } from '@/hooks/usePermissions';
import { GPSCapture, GeolocationData } from '@/components/GPSCapture';
import { Modal } from '@/components/Modal';
import { useProject } from '@/contexts/ProjectContext';

interface AttendanceViewProps {
  attendances?: Attendance[];
  workers?: Worker[];
  onUpdateAttendance?: (date: string, updates: Map<string, Attendance['status']>) => void;
}

export default function AttendanceView({
  attendances = [],
  workers = [],
  onUpdateAttendance,
}: AttendanceViewProps) {
  const { allowed: canView, reason, suggestedAction } = useRequirePermission('view_attendance');
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('manage_attendance');
  const { currentProject } = useProject();

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [localAttendance, setLocalAttendance] = useState<Map<string, Attendance['status']>>(
    new Map()
  );
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [locationData, setLocationData] = useState<Map<string, GeolocationData>>(new Map());

  useEffect(() => {
    const attendanceMap = new Map<string, Attendance['status']>();
    const recordsForDate = attendances.filter((a) => a.date === selectedDate);

    workers.forEach((worker) => {
      const record = recordsForDate.find((r) => r.workerId === worker.id);
      attendanceMap.set(worker.id, record ? record.status : 'Alpa');
    });
    setLocalAttendance(attendanceMap);
  }, [selectedDate, attendances, workers]);

  useEffect(() => {
    // Optional: handle permission denial side effects
  }, [canView, reason]);

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
    if (onUpdateAttendance) {
      onUpdateAttendance(selectedDate, localAttendance);
      alert('Absensi berhasil disimpan!');
    }
  };

  const summary = useMemo(() => {
    const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
    for (const status of localAttendance.values()) {
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    }
    return counts;
  }, [localAttendance]);

  if (!canView) {
    return (
      <EnterpriseLayout>
        <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
          <Lock className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">{reason || " You don't have permission to view this page."}</p>
          {suggestedAction && <p className="text-sm text-orange-600">{suggestedAction}</p>}
        </div>
      </EnterpriseLayout>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Nama Pekerja',
      render: (worker: Worker) => <span className="font-medium">{worker.name}</span>,
    },
    {
      key: 'type',
      header: 'Tipe',
    },
    {
      key: 'status',
      header: 'Status Kehadiran',
      align: 'center' as const,
      render: (worker: Worker) => (
        <select
          value={localAttendance.get(worker.id) || 'Alpa'}
          onChange={(e) =>
            handleStatusChange(worker.id, e.target.value as Attendance['status'])
          }
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!canManage}
        >
          <option value="Hadir">Hadir</option>
          <option value="Sakit">Sakit</option>
          <option value="Izin">Izin</option>
          <option value="Alpa">Alpa</option>
        </select>
      ),
    },
  ];

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Manajemen Absensi"
        subtitle={`Catat kehadiran harian untuk proyek ${currentProject?.name || 'Proyek'}`}
        actions={
          <div className="flex items-center gap-3">
            <InputPro
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
              disabled={!canManage}
            />
            <ButtonPro onClick={() => setGpsModalOpen(true)} variant="secondary" icon={MapPin} disabled={!canManage}>
              GPS Check-in
            </ButtonPro>
            <ButtonPro onClick={handleSaveChanges} variant="primary" disabled={!canManage}>
              Simpan Perubahan
            </ButtonPro>
          </div>
        }
      />

      <SectionLayout title="Ringkasan Hari Ini">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCardPro
            title="Hadir"
            value={summary.Hadir}
            icon={CheckCircle}
            variant="success"
          />
          <StatCardPro
            title="Alpa"
            value={summary.Alpa}
            icon={XCircle}
            variant="error"
          />
          <StatCardPro
            title="Sakit"
            value={summary.Sakit}
            icon={User}
            variant="warning"
          />
          <StatCardPro
            title="Izin"
            value={summary.Izin}
            icon={User}
            variant="default"
          />
        </div>
      </SectionLayout>

      <SectionLayout
        title={`Daftar Pekerja - ${formatDate(selectedDate)}`}
        description="Kelola status kehadiran pekerja."
      >
        <TablePro
          data={workers}
          columns={columns}
          searchable
          searchPlaceholder="Cari pekerja..."
          emptyMessage={(!workers || workers.length === 0) ? "Tidak ada data pekerja. Silakan tambahkan pekerja terlebih dahulu." : "Tidak ada hasil pencarian."}
          rowKey="id"
        />
      </SectionLayout>

      <Modal isOpen={gpsModalOpen} onClose={() => setGpsModalOpen(false)} title="Capture GPS Location">
        <GPSCapture
          onCapture={handleGPSCapture}
          workSiteLocation={{ lat: -6.2088, lng: 106.8456, radius: 100 }}
        />
      </Modal>
    </EnterpriseLayout>
  );
}
