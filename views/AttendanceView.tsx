import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select } from '../components/FormControls';
import { Attendance, Worker } from '../types';
// FIX: Added formatDate to imports to resolve reference error.
import { getTodayDateString, formatDate } from '../constants';
import { UserCheck, UserX, User, Server } from 'lucide-react';

interface AttendanceViewProps {
    attendances: Attendance[];
    workers: Worker[];
    onUpdateAttendance: (date: string, updates: Map<string, Attendance['status']>) => void;
}

export default function AttendanceView({ attendances, workers, onUpdateAttendance }: AttendanceViewProps) {
    const [selectedDate, setSelectedDate] = useState(getTodayDateString());
    const [localAttendance, setLocalAttendance] = useState<Map<string, Attendance['status']>>(new Map());

    useEffect(() => {
        // Populate local state based on global state for the selected date
        const attendanceMap = new Map<string, Attendance['status']>();
        const recordsForDate = attendances.filter(a => a.date === selectedDate);
        
        workers.forEach(worker => {
            const record = recordsForDate.find(r => r.workerId === worker.id);
            // Default to 'Alpa' if no record found for a worker on that day
            attendanceMap.set(worker.id, record ? record.status : 'Alpa');
        });
        setLocalAttendance(attendanceMap);
    }, [selectedDate, attendances, workers]);

    const handleStatusChange = (workerId: string, status: Attendance['status']) => {
        setLocalAttendance(new Map(localAttendance.set(workerId, status)));
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
            <Card>
                <CardHeader>
                    <CardTitle>Absensi Tenaga Kerja</CardTitle>
                    <CardDescription>Catat kehadiran harian dari daftar pekerja terdaftar untuk perhitungan upah yang akurat.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="w-auto"
                        />
                        <div className="flex gap-4 text-sm text-night-black">
                            <span className="flex items-center"><UserCheck className="w-4 h-4 mr-1 text-green-500"/>Hadir: {summary.Hadir || 0}</span>
                            <span className="flex items-center"><UserX className="w-4 h-4 mr-1 text-red-500"/>Alpa: {summary.Alpa || 0}</span>
                            <span className="flex items-center"><User className="w-4 h-4 mr-1 text-yellow-500"/>Izin/Sakit: {(summary.Izin || 0) + (summary.Sakit || 0)}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-night-black">
                            <thead className="bg-violet-essence/50 text-xs uppercase">
                                <tr>
                                    <th className="p-3">Nama Pekerja</th>
                                    <th className="p-3">Tipe</th>
                                    <th className="p-3 text-center">Status Kehadiran</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workers.map(worker => (
                                    <tr key={worker.id} className="border-b border-violet-essence hover:bg-violet-essence/30">
                                        <td className="p-3 font-medium">{worker.name}</td>
                                        <td className="p-3">{worker.type}</td>
                                        <td className="p-3 text-center">
                                            <Select 
                                                value={localAttendance.get(worker.id) || 'Alpa'} 
                                                onChange={e => handleStatusChange(worker.id, e.target.value as Attendance['status'])} 
                                                className="max-w-xs mx-auto"
                                            >
                                                <option>Hadir</option>
                                                <option>Sakit</option>
                                                <option>Izin</option>
                                                <option>Alpa</option>
                                            </Select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-right mt-6">
                        <Button onClick={handleSaveChanges}>Simpan Absensi untuk {formatDate(selectedDate)}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}