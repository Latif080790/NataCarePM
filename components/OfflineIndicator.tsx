
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 mb-6 bg-night-black text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm z-[200]">
      <WifiOff className="w-4 h-4" />
      <span>Koneksi internet terputus. Beberapa fitur mungkin tidak berfungsi.</span>
    </div>
  );
}
