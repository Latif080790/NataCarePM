/**
 * EXAMPLE: Daily Log View dengan Offline Support
 * Demonstrasi offline-first implementation
 * Last Updated: December 16, 2025
 */

import React, { useState } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ButtonPro from '@/components/ButtonPro';
import CardPro from '@/components/CardPro';
import InputPro from '@/components/InputPro';

interface DailyLogFormData {
  date: string;
  weather: string;
  temperature: number;
  activities: string;
  issues: string;
  workProgress: Array<{
    rabItemId: number;
    completedVolume: number;
  }>;
  attendance: Array<{
    workerId: string;
    workerName: string;
    present: boolean;
  }>;
}

export default function DailyLogViewOfflineExample() {
  const { currentProject } = useProject();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const { 
    isOnline, 
    pendingCount, 
    saveDailyLogOffline 
  } = useOfflineSync();

  const [formData, setFormData] = useState<DailyLogFormData>({
    date: new Date().toISOString().split('T')[0],
    weather: 'sunny',
    temperature: 30,
    activities: '',
    issues: '',
    workProgress: [],
    attendance: [],
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProject || !currentUser) {
      addToast('Missing project or user context', 'error');
      return;
    }

    setLoading(true);

    try {
      if (!isOnline) {
        // ✅ OFFLINE MODE - Save to IndexedDB
        const localId = await saveDailyLogOffline(formData, currentProject.id);
        
        addToast(
          `📱 Daily log saved offline (${localId}). Will sync when online.`,
          'success'
        );
        
        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          weather: 'sunny',
          temperature: 30,
          activities: '',
          issues: '',
          workProgress: [],
          attendance: [],
        });
      } else {
        // ✅ ONLINE MODE - Save directly to Firestore
        // (Gunakan service yang sudah ada)
        // await dailyLogService.create(currentProject.id, formData);
        
        addToast('✅ Daily log saved successfully', 'success');
      }
    } catch (error) {
      addToast('Failed to save daily log', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Log Harian</h1>
        
        {/* Status Badge */}
        <div className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
        `}>
          {isOnline ? '🌐 Online' : '📱 Offline Mode'}
          {pendingCount > 0 && ` • ${pendingCount} pending`}
        </div>
      </div>

      {/* Offline Notice */}
      {!isOnline && (
        <CardPro className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Bekerja Offline
              </h3>
              <p className="text-sm text-yellow-800">
                Data akan disimpan di perangkat Anda dan otomatis ter-sync saat koneksi kembali.
              </p>
            </div>
          </div>
        </CardPro>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <CardPro>
          <h3 className="text-lg font-semibold mb-4">Input Log Harian</h3>

          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal</label>
              <InputPro
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            {/* Weather */}
            <div>
              <label className="block text-sm font-medium mb-1">Cuaca</label>
              <select
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="sunny">☀️ Cerah</option>
                <option value="cloudy">☁️ Berawan</option>
                <option value="rainy">🌧️ Hujan</option>
              </select>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Suhu ({formData.temperature}°C)
              </label>
              <input
                type="range"
                min="20"
                max="40"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Activities */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Kegiatan Hari Ini
              </label>
              <textarea
                value={formData.activities}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                placeholder="Contoh: Pengecoran lantai 2, pemasangan besi beton..."
                required
              />
            </div>

            {/* Issues */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Kendala / Masalah (Opsional)
              </label>
              <textarea
                value={formData.issues}
                onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Contoh: Material terlambat 2 hari, cuaca hujan mengganggu pekerjaan..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex gap-3">
            <ButtonPro
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Menyimpan...' : '💾 Simpan Log'}
            </ButtonPro>

            <ButtonPro
              type="button"
              variant="secondary"
              onClick={() => window.history.back()}
            >
              Batal
            </ButtonPro>
          </div>

          {/* Info Message */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            {isOnline ? (
              <>
                ℹ️ Data akan langsung tersimpan ke server
              </>
            ) : (
              <>
                📱 Mode Offline: Data disimpan lokal dan akan ter-sync otomatis saat online
              </>
            )}
          </div>
        </CardPro>
      </form>

      {/* Pending Sync Info */}
      {pendingCount > 0 && (
        <CardPro className="mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">
                📦 {pendingCount} data menunggu sync
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Data akan otomatis ter-sync saat koneksi internet kembali
              </p>
            </div>
          </div>
        </CardPro>
      )}
    </div>
  );
}
