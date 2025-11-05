import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/FormControls';
import { Progress } from '@/components/Progress';
import { WorkProgress } from '@/types';

interface ProgressViewProps {
  itemsWithProgress: any[];
  onUpdateProgress: (updates: WorkProgress[]) => void;
}

export default function ProgressView({ itemsWithProgress, onUpdateProgress }: ProgressViewProps) {
  const [progressState, setProgressState] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    const newMap = new Map<number, number>();
    itemsWithProgress.forEach((item) => {
      newMap.set(item.id, item.completedVolume || 0);
    });
    setProgressState(newMap);
  }, [itemsWithProgress]);

  const handleVolumeChange = (rabItemId: number, value: string) => {
    const newVolume = Number(value);
    const item = itemsWithProgress.find((i) => i.id === rabItemId);
    if (item) {
      // Clamp value between 0 and total volume
      const clampedVolume = Math.max(0, Math.min(item.volume, newVolume));
      setProgressState(new Map(progressState.set(rabItemId, clampedVolume)));
    }
  };

  const handleSaveChanges = () => {
    // Only submit items that have changed
    const updates: WorkProgress[] = Array.from(progressState.entries())
      .filter(([rabItemId, completedVolume]) => {
        const originalItem = itemsWithProgress.find((i) => i.id === rabItemId);
        return originalItem && originalItem.completedVolume !== completedVolume;
      })
      .map(([rabItemId, completedVolume]) => {
        const originalItem = itemsWithProgress.find((i) => i.id === rabItemId);
        // Calculate the delta to report
        const deltaVolume = completedVolume - (originalItem?.completedVolume || 0);
        return {
          rabItemId,
          completedVolume: deltaVolume,
        };
      })
      .filter((update) => update.completedVolume > 0); // Only report positive progress

    if (updates.length > 0) {
      onUpdateProgress(updates);
      alert('Progres berhasil disimpan! Laporan harian baru telah dibuat dengan perubahan volume.');
    } else {
      alert('Tidak ada perubahan progres untuk disimpan.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Progres Manual (Berdasarkan Volume)</CardTitle>
        <CardDescription>
          Sesuaikan total volume pekerjaan yang telah selesai. Sistem akan otomatis membuat laporan
          harian baru untuk selisihnya. Gunakan hanya untuk koreksi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {itemsWithProgress.map((item) => {
            const currentVolume = progressState.get(item.id) || 0;
            const progressPercent = item.volume > 0 ? (currentVolume / item.volume) * 100 : 0;
            return (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center border-b border-violet-essence pb-2"
              >
                <div className="md:col-span-3">
                  <p className="font-medium text-sm">
                    {item.no} {item.uraian}
                  </p>
                  <p className="text-xs text-palladium">
                    Total Volume: {item.volume.toFixed(2)} {item.satuan}
                  </p>
                </div>
                <div className="md:col-span-3 flex items-center gap-4">
                  <Input
                    type="number"
                    value={String(currentVolume.toFixed(2))}
                    onChange={(e) => handleVolumeChange(item.id, e.target.value)}
                    className="w-28 text-center"
                  />
                  <span className="text-sm text-palladium">
                    / {item.volume.toFixed(2)} {item.satuan}
                  </span>
                  <div className="flex-grow">
                    <Progress value={progressPercent} />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">
                    {progressPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-right mt-6">
          <Button onClick={handleSaveChanges}>Simpan Perubahan & Buat Laporan</Button>
        </div>
      </CardContent>
    </Card>
  );
}
