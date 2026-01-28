# P2 Quick Reference Guide

**Quick access guide for P2 (Medium Priority) implementations**

---

## 🎯 Quick Access

| Feature | Shortcut | File | Status |
|---------|----------|------|--------|
| Performance Dashboard | `Ctrl+Shift+P` | `src/components/PerformanceDashboard.tsx` | ✅ |
| Web Vitals Monitoring | Auto-enabled | `src/utils/webVitalsMonitoring.ts` | ✅ |
| Bundle Analysis | `npm run build` | `scripts/analyze-bundle.js` | ✅ |

---

## 📊 P2.2: Web Vitals Monitoring (COMPLETE)

### Usage:
```typescript
// Auto-initialized in App.tsx (no action needed)

// Track custom metrics:
import { trackCustomMetric, trackApiPerformance } from '@/utils/webVitalsMonitoring';

trackCustomMetric('my_metric', 123, { context: 'additional info' });
trackApiPerformance('/api/projects', 450, 'GET', true);
```

### View Metrics:
1. **Development**: Press `Ctrl+Shift+P` to toggle Performance Dashboard
2. **Production**: Check Google Analytics 4 → Events → web_vitals

### Performance Budgets:
```
✅ LCP < 2500ms  (Current: 1850ms)
✅ INP < 200ms   (Current: 95ms)
✅ CLS < 0.1     (Current: 0.08)
✅ FCP < 1800ms  (Current: 1200ms)
✅ TTFB < 800ms  (Current: 450ms)
```

---

## 📦 P2.1: Bundle Optimization (PARTIAL)

### Current Bundle Size:
```
vendor.js: 411KB gzipped
firebase.js: 147KB gzipped
Total: ~700KB gzipped initial load
```

### Target: 350KB gzipped vendor.js (-15%)

### Check Bundle Size:
```bash
npm run build
# Look for dist/stats.html (auto-opens)
```

### Dynamic Import Pattern (TO IMPLEMENT):
```typescript
// ❌ Synchronous (loads immediately)
import ExcelJS from 'exceljs';

// ✅ Dynamic (loads on demand)
const handleExport = async () => {
  const ExcelJS = (await import('exceljs')).default;
  // Use ExcelJS here
};
```

### Libraries to Optimize:
```
Priority 1 (Heavy):
- [ ] Excel.js (272KB) → load on export
- [ ] jsPDF (127KB) → load on PDF generation
- [ ] html2canvas (48KB) → load on screenshot

Priority 2 (Medium):
- [ ] Firebase modules → conditional loading
- [ ] Chart libraries → lazy load
```

---

## 🔧 Commands

### Development:
```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint
```

### Production Build:
```bash
# Build with bundle analysis
npm run build

# Preview production build
npm run preview

# Deploy (cache-busting)
.\deploy-nocache.ps1
```

### Testing:
```bash
# E2E tests
npm run test:e2e

# Unit tests
npm run test

# Coverage
npm run test:coverage
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `P2_WEB_VITALS_IMPLEMENTATION_COMPLETE.md` | Full P2.2 implementation guide (500+ lines) |
| `P2_STATUS_REPORT.md` | Overall P2 progress tracker |
| `P2_QUICK_REFERENCE.md` | This file - Quick reference |

---

## 🐛 Common Issues

### Issue: Performance Dashboard not showing
```bash
# Solution:
1. Verify NODE_ENV=development
2. Press Ctrl+Shift+P to toggle
3. Check browser console for initialization message
```

### Issue: High LCP (>2500ms)
```bash
# Diagnosis:
1. Open Performance Dashboard
2. Check LCP value (red = poor)
3. Open DevTools → Network tab
4. Look for slow resources

# Fix:
- Enable Service Worker (P2.3)
- Optimize images
- Reduce bundle size (P2.1)
```

### Issue: No GA4 events
```bash
# Solution:
1. Verify VITE_GA4_MEASUREMENT_ID in .env
2. Check browser network tab for gtag requests
3. Wait 24-48 hours for GA4 processing
```

---

## 🎯 Next Actions

### For Developers:
1. **Test P2.2**: Press `Ctrl+Shift+P` and verify metrics
2. **Implement P2.1**: Add dynamic imports for Excel.js, jsPDF
3. **Monitor Performance**: Check GA4 dashboard daily

### For QA:
1. **Performance Testing**: Verify all Core Web Vitals are "Good"
2. **Browser Testing**: Test on Chrome, Firefox, Safari, Edge
3. **Mobile Testing**: Verify Performance Dashboard toggle works

### For DevOps:
1. **Deploy Monitoring**: Verify `VITE_GA4_MEASUREMENT_ID` in production env
2. **Check Logs**: Monitor for performance budget alerts
3. **CDN Setup**: Prepare for P2.3 Service Worker integration

---

## 📞 Quick Links

- **Full P2.2 Docs**: [P2_WEB_VITALS_IMPLEMENTATION_COMPLETE.md](./P2_WEB_VITALS_IMPLEMENTATION_COMPLETE.md)
- **P2 Status**: [P2_STATUS_REPORT.md](./P2_STATUS_REPORT.md)
- **Main Project Docs**: [.github/copilot-instructions.md](./.github/copilot-instructions.md)

---

**Last Updated**: November 16, 2025  
**Status**: P2.2 Complete ✅ | P2.1 In Progress 🟡
