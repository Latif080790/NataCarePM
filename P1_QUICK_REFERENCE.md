# P1 Quick Reference Guide

## 🚀 Quick Start

### Device Detection
```typescript
import { useDeviceType } from '@/hooks/useDeviceType';

const { isMobile, isTablet, isDesktop, networkQuality } = useDeviceType();
```

### Mobile Layout
```typescript
import { MobileLayout } from '@/components/MobileLayout';

<MobileLayout title="Page Title" showBottomNav={true}>
  {/* Your content */}
</MobileLayout>
```

### Image Compression
```typescript
import { compressImage } from '@/utils/imageCompression';

const result = await compressImage(file, {
  maxSizeMB: 0.5,
  onProgress: (p) => setProgress(p)
});

console.log(`Saved ${result.compressionRatio.toFixed(0)}%`);
```

### Compressed Upload Component
```typescript
import { CompressedImageUpload } from '@/components/CompressedImageUpload';

<CompressedImageUpload 
  onFilesCompressed={(files) => uploadFiles(files)}
  maxFiles={10}
/>
```

---

## 📱 Layout Switching

**Automatic:** App.tsx detects device and loads appropriate layout

**Manual Override:**
```typescript
const LayoutComponent = forceMobile ? MobileLayout : EnterpriseLayout;
```

**Conditional Features:**
```typescript
import { MobileFeatureFlags } from '@/utils/deviceAwareLoader';

if (MobileFeatureFlags.LOAD_CHARTS(device)) {
  return <ChartComponent />;
}
```

---

## 🧪 Testing Commands

```powershell
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/rbac.spec.ts

# Run in UI mode (debug)
npx playwright test --ui

# Run on specific device
npx playwright test --project=mobile-chrome
npx playwright test --project=offline-mode

# Run with headed browser
npx playwright test --headed

# Generate HTML report
npx playwright show-report
```

---

## 🔍 Testing Scenarios

### Test RBAC for Site Manager
```powershell
npx playwright test e2e/rbac.spec.ts -g "Site Manager"
```
**Expected:** No access to financial data, can create daily logs

### Test Offline Mode
```powershell
npx playwright test e2e/offline.spec.ts --project=offline-mode
```
**Expected:** Data saved to IndexedDB, syncs when online

### Test Accessibility
```powershell
npx playwright test e2e/accessibility.spec.ts
```
**Expected:** 0 WCAG AA violations

---

## 📊 Image Compression Profiles

| Profile | Size | Resolution | Quality | Use Case |
|---------|------|------------|---------|----------|
| **HIGH_QUALITY** | 1.0 MB | 2560px | 90% | WiFi/4G |
| **BALANCED** | 500 KB | 1920px | 85% | Default |
| **LOW_BANDWIDTH** | 250 KB | 1280px | 75% | 3G |
| **MINIMAL** | 150 KB | 1024px | 70% | 2G/Data Saver |

**Auto-detection:** Uses `navigator.connection.effectiveType`

---

## 🎨 Mobile UI Components

### MobileCard
```typescript
<MobileCard title="Stats" action={<Button>View</Button>}>
  <p>Content here</p>
</MobileCard>
```

### MobileSection
```typescript
<MobileSection title="Recent Tasks">
  <TaskList />
</MobileSection>
```

### Bottom Navigation
Automatically shown when using `MobileLayout` with `showBottomNav={true}`

**5 Tabs:** Beranda, Laporan, RAB, Inventori, Menu

---

## 🔧 Device Feature Flags

```typescript
import { MobileFeatureFlags } from '@/utils/deviceAwareLoader';

// Available flags:
MobileFeatureFlags.LOAD_CHARTS          // Desktop or fast network
MobileFeatureFlags.LOAD_AI_FEATURES     // Desktop only
MobileFeatureFlags.LOAD_LIVE_CURSORS    // Desktop only
MobileFeatureFlags.LOAD_COMMAND_PALETTE // Desktop only
MobileFeatureFlags.LOAD_ANALYTICS       // Desktop or tablet landscape
MobileFeatureFlags.LOAD_OCR             // All except slow network
```

---

## 📁 Key Files Location

```
src/
├── hooks/
│   └── useDeviceType.ts              # Device detection hook
├── components/
│   ├── MobileLayout.tsx              # Mobile layout component
│   └── CompressedImageUpload.tsx     # Image upload with compression
├── views/
│   └── MobileDashboardView.tsx       # Mobile-optimized dashboard
├── utils/
│   ├── deviceAwareLoader.ts          # Lazy loading utilities
│   └── imageCompression.ts           # Compression API
└── App.tsx                            # Layout switching logic

e2e/
├── auth.spec.ts                       # Authentication tests
├── rbac.spec.ts                       # Permission tests
├── offline.spec.ts                    # Offline mode tests
└── accessibility.spec.ts              # WCAG AA tests

playwright.config.ts                   # Test configuration
```

---

## ⚡ Performance Tips

### 1. Lazy Load Heavy Components
```typescript
const HeavyChart = lazy(() => import('./HeavyChart'));

<Suspense fallback={<Spinner />}>
  {isDesktop && <HeavyChart />}
</Suspense>
```

### 2. Use Device Check Hook
```typescript
const shouldLoad = useDeviceCheck(d => d.isDesktop || d.networkQuality === 'fast');
```

### 3. Compress Before Upload
```typescript
if (shouldCompress(file)) {
  file = await compressImage(file);
}
await uploadToStorage(file);
```

### 4. Debounce Expensive Operations
```typescript
const { screenWidth } = useDeviceType(); // Already debounced (150ms)
```

---

## 🐛 Debugging

### Check Device Info
```typescript
const device = useDeviceType();
console.log(device);
// → { isMobile: true, networkQuality: 'fast', ... }
```

### Test Offline Mode (Chrome DevTools)
1. Open DevTools → Network tab
2. Check "Offline"
3. Create daily log
4. Check IndexedDB: `NataCarePMOffline.pendingOperations`
5. Uncheck "Offline"
6. Wait for auto-sync

### Verify Compression
```typescript
const result = await compressImage(file);
console.log(`${result.originalSize} → ${result.compressedSize}`);
console.log(`Saved ${result.compressionRatio}%`);
```

### Check Test Results
```powershell
npx playwright show-report
# Opens HTML report in browser
```

---

## 📝 Common Patterns

### Responsive Component
```typescript
function MyComponent() {
  const { isMobile } = useDeviceType();
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### Network-Aware Loading
```typescript
const { networkQuality } = useDeviceType();

if (networkQuality === 'slow') {
  return <LightweightComponent />;
}
```

### Conditional Rendering
```typescript
{!isMobile && !isTablet && (
  <DesktopOnlyFeature />
)}
```

### Batch Image Compression
```typescript
const results = await compressImageBatch(files);
console.log(`Total savings: ${formatFileSize(results.totalSavings)}`);
```

---

## ✅ Checklist for New Views

- [ ] Use `useDeviceType()` to detect device
- [ ] Implement mobile-specific layout if needed
- [ ] Lazy load heavy dependencies
- [ ] Compress images before upload
- [ ] Add E2E tests
- [ ] Test on mobile devices
- [ ] Verify offline functionality
- [ ] Check WCAG AA compliance
- [ ] Test RBAC permissions

---

## 🆘 Troubleshooting

**Q: Layout not switching on mobile**  
A: Check viewport width in DevTools. Breakpoint is 1024px.

**Q: Image compression not working**  
A: Check browser console for errors. Ensure `browser-image-compression` installed.

**Q: E2E tests failing**  
A: Run `npm run dev` first. Check `playwright.config.ts` baseURL matches.

**Q: Offline sync not working**  
A: Check IndexedDB in DevTools → Application tab. Verify service is initialized.

**Q: Accessibility violations**  
A: Run `npx playwright test e2e/accessibility.spec.ts` to see details.

---

**Quick Links:**
- [Full Documentation](./P1_IMPLEMENTATION_COMPLETE.md)
- [Playwright Docs](https://playwright.dev)
- [Image Compression Library](https://www.npmjs.com/package/browser-image-compression)

---

**Last Updated:** December 16, 2025  
**Version:** P1 Complete
