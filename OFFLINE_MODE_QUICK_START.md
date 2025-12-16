# 🎯 QUICK START: Offline Mode Integration

## 5 Menit Setup untuk Developer

### 1. Install (Sudah Done ✅)
```bash
npm install dexie --save
```

### 2. Import Hook di Component
```tsx
import { useOfflineSync } from '@/hooks/useOfflineSync';

function MyComponent() {
  const { isOnline, saveDailyLogOffline, syncNow } = useOfflineSync();
  
  // Your logic here
}
```

### 3. Save Data Offline
```tsx
const handleSubmit = async (data) => {
  if (!isOnline) {
    // Save offline
    const localId = await saveDailyLogOffline(data, projectId);
    addToast('Saved offline!', 'success');
  } else {
    // Save to Firestore normally
    await firestoreService.create(data);
  }
};
```

### 4. Add Indicator ke Layout
```tsx
import OfflineIndicator from '@/components/OfflineIndicator';

<Layout>
  <OfflineIndicator />
  {children}
</Layout>
```

## ✅ That's It!

Your app now works offline. Data will sync automatically when connection is restored.

---

## Common Patterns

### Pattern 1: Form dengan Offline Support
```tsx
const { isOnline, saveDailyLogOffline } = useOfflineSync();

<form onSubmit={async (e) => {
  e.preventDefault();
  
  if (!isOnline) {
    await saveDailyLogOffline(formData, projectId);
  } else {
    await normalSave(formData);
  }
}}>
  {/* form fields */}
</form>
```

### Pattern 2: Conditional Save Button
```tsx
<ButtonPro 
  onClick={handleSave}
  variant={isOnline ? 'primary' : 'warning'}
>
  {isOnline ? '💾 Save' : '📱 Save Offline'}
</ButtonPro>
```

### Pattern 3: Status Badge
```tsx
<div className={`badge ${isOnline ? 'online' : 'offline'}`}>
  {isOnline ? '🌐 Online' : '📱 Offline'}
</div>
```

---

## Testing

### Test Offline in Chrome DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Test your form
5. Check Application tab → IndexedDB → NataCarePMOffline
6. Uncheck "Offline"
7. Wait 2-3 seconds for auto-sync

### Test on Real Device
1. Turn on Airplane Mode
2. Create daily log
3. Turn off Airplane Mode
4. Wait for auto-sync toast

---

## API Reference

### useOfflineSync Hook
```typescript
const {
  isOnline: boolean,           // Connection status
  isSyncing: boolean,           // Sync in progress?
  pendingCount: number,         // Items waiting sync
  failedCount: number,          // Failed syncs
  storageSize: number,          // Bytes used
  
  saveDailyLogOffline: (data, projectId) => Promise<string>,
  syncNow: () => Promise<void>,
  formatStorageSize: (bytes) => string,
} = useOfflineSync();
```

### Direct Database Access (Advanced)
```typescript
import { offlineDb } from '@/db/offlineDatabase';

// Get all pending logs
const logs = await offlineDb.offlineDailyLogs
  .where('syncStatus')
  .equals('pending')
  .toArray();

// Get pending count
const count = await offlineDb.getPendingCount();

// Clear all (dangerous!)
await offlineDb.clearAll();
```

---

## FAQ

**Q: Berapa lama data disimpan offline?**  
A: Sampai berhasil sync atau user clear browser data.

**Q: Apakah data offline aman?**  
A: Aman dari external access, tapi tidak encrypted. Jangan simpan password.

**Q: Berapa kapasitas storage?**  
A: 50-100MB di mobile, 100MB+ di desktop. App akan warning jika >80%.

**Q: Bagaimana jika sync gagal terus?**  
A: Setelah 5 retries, mark as failed. User bisa clear manual dari Sync Status Panel.

**Q: Apakah bisa sync partial (sebagian data)?**  
A: Ya, sync per-item. Jika item 1-5 berhasil dan item 6 gagal, item 1-5 sudah tersimpan di server.

---

**Need Help?** Check [OFFLINE_MODE_IMPLEMENTATION_COMPLETE.md](OFFLINE_MODE_IMPLEMENTATION_COMPLETE.md) untuk detail lengkap.
