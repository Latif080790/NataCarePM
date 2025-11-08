import React, { useState } from 'react';
import { Clock, Users, CheckCircle, XCircle, Calendar } from 'lucide-react';
import {
  ButtonPro,
  StatCardPro,
  BadgePro,
  TablePro,
  type ColumnDef,
  EnterpriseLayout,
  PageHeader,
  SectionLayout,
} from '@/components/DesignSystem';
import { useProject } from '@/contexts/ProjectContext';

interface AttendanceRecord {
  id: string;
  userName: string;
  userId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late' | 'leave';
  location?: string;
  notes?: string;
}

export const AttendanceViewPro: React.FC = () => {
  const { currentProject } = useProject();
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Mock data - replace with actual data from context/API
  const attendanceRecords: AttendanceRecord[] = [];
  const stats = {
    present: 42,
    absent: 3,
    late: 5,
    onLeave: 2,
  };

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      key: 'userName',
      header: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">
              {row.userName.charAt(0)}
            </span>
          </div>
          <span className="font-medium text-gray-900">{row.userName}</span>
        </div>
      ),
    },
    {
      key: 'checkIn',
      header: 'Check In',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : '-'}
        </span>
      ),
    },
    {
      key: 'checkOut',
      header: 'Check Out',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const variantMap = {
          present: 'success',
          absent: 'error',
          late: 'warning',
          leave: 'default',
        } as const;
        return (
          <BadgePro variant={variantMap[row.status]}>
            {row.status.toUpperCase()}
          </BadgePro>
        );
      },
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.location || '-'}</span>
      ),
    },
  ];

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Attendance Management"
        subtitle={`Track and manage team attendance for ${currentProject?.name || 'Project'}`}
        actions={
          <div className="flex items-center gap-3">
            <ButtonPro variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Export Report
            </ButtonPro>
            <ButtonPro variant="primary">
              <Clock className="w-4 h-4 mr-2" />
              Mark Attendance
            </ButtonPro>
          </div>
        }
      />

      {/* View Mode Selector */}
      <SectionLayout>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
            {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </SectionLayout>

      {/* Stats Cards */}
      <SectionLayout title="Today's Summary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCardPro
            title="Present"
            value={stats.present}
            icon={CheckCircle}
            variant="success"
            trend={{ value: 5, label: 'vs yesterday' }}
          />
          <StatCardPro
            title="Absent"
            value={stats.absent}
            icon={XCircle}
            variant="error"
            trend={{ value: -2, label: 'vs yesterday', isPositiveGood: false }}
          />
          <StatCardPro
            title="Late"
            value={stats.late}
            icon={Clock}
            variant="warning"
            trend={{ value: 1, label: 'vs yesterday', isPositiveGood: false }}
          />
          <StatCardPro
            title="On Leave"
            value={stats.onLeave}
            icon={Users}
            variant="default"
          />
        </div>
      </SectionLayout>

      {/* Attendance Table */}
      <SectionLayout
        title="Attendance Records"
        description="Detailed attendance records for selected date"
      >
        <TablePro
          data={attendanceRecords}
          columns={columns}
          searchable
          searchPlaceholder="Search employees..."
          emptyMessage="No attendance records found"
        />
      </SectionLayout>
    </EnterpriseLayout>
  );
};

export default AttendanceViewPro;
