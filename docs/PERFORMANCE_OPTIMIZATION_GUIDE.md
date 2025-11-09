# Performance Optimization & Lighthouse Guide

## Table of Contents
1. [Overview](#overview)
2. [Performance Metrics](#performance-metrics)
3. [Optimization Strategies](#optimization-strategies)
4. [Lighthouse Setup](#lighthouse-setup)
5. [Running Audits](#running-audits)
6. [Bundle Analysis](#bundle-analysis)
7. [Best Practices](#best-practices)
8. [Monitoring](#monitoring)

---

## Overview

NataCarePM is optimized for performance through:
- **Code Splitting** - Lazy loading routes and components
- **Tree Shaking** - Remove unused code
- **Minification** - Compress JavaScript/CSS
- **Caching** - Long-term browser caching for assets
- **CDN Ready** - Static assets optimized for CDN delivery

### Current Bundle Sizes (Production)

| Chunk | Size | Gzip | Description |
|-------|-----:|-----:|-------------|
| **firebase** | 430 KB | 128 KB | Firebase SDK |
| **vendor** | 684 KB | 201 KB | Third-party libraries |
| **sentry** | 314 KB | 100 KB | Error monitoring |
| **react-vendor** | 268 KB | 88 KB | React + React DOM |
| **contexts** | 100 KB | 26 KB | React contexts |
| **utils** | 62 KB | 20 KB | Utility functions |
| **views/** | 5-100 KB | 1-25 KB | Lazy-loaded views (38 routes) |

**Total Initial Load:** ~500 KB gzipped (React + Firebase + Core)

---

## Performance Metrics

### Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|-----:|------------------:|-----:|
| **FCP** (First Contentful Paint) | < 1.8s | 1.8s - 3.0s | > 3.0s |
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5s - 4.0s | > 4.0s |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |
| **TBT** (Total Blocking Time) | < 200ms | 200ms - 600ms | > 600ms |
| **SI** (Speed Index) | < 3.4s | 3.4s - 5.8s | > 5.8s |

### NataCarePM Targets

Based on Lighthouse configuration:
- **Performance Score:** ≥ 80
- **Accessibility Score:** ≥ 90
- **Best Practices Score:** ≥ 90
- **SEO Score:** ≥ 80

---

## Optimization Strategies

### 1. Code Splitting

**Implemented:**
- ✅ Route-based code splitting (38 lazy-loaded views)
- ✅ Vendor chunk splitting (Firebase, React, Charts, Sentry)
- ✅ Context/Utils chunk splitting
- ✅ CSS code splitting per chunk

**Example:**
```typescript
// Lazy-loaded route
const DashboardView = lazy(() => import('@/views/DashboardWrapper'));

// Usage in App.tsx
<Suspense fallback={<EnterpriseProjectLoader />}>
  <Route path="/dashboard" element={<DashboardView />} />
</Suspense>
```

---

### 2. Tree Shaking

**Configuration:** `vite.config.ts`

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        // Split node_modules by library
        if (id.includes('firebase')) return 'firebase';
        if (id.includes('react')) return 'react-vendor';
        // ... more splits
      }
    }
  }
}
```

**Result:**
- Unused Firebase modules excluded
- Only imported lodash/date-fns functions included
- Dead code eliminated

---

### 3. Minification

**Terser Configuration:**

```typescript
terserOptions: {
  compress: {
    drop_console: mode === 'production', // Remove console.log in production
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.debug', 'console.info'],
  },
  mangle: {
    safari10: true, // Fix Safari 10 bugs
  },
  format: {
    comments: false, // Remove all comments
  },
}
```

**Savings:**
- ~30% reduction in JavaScript size
- ~40% reduction with gzip compression

---

### 4. Asset Optimization

**Images:**
- ✅ WebP format for modern browsers
- ✅ Inline small images (< 4KB) as base64
- ✅ Lazy loading for off-screen images

**Fonts:**
- ✅ Preload critical fonts
- ✅ Font-display: swap (prevent FOIT)
- ✅ Subset fonts (only used characters)

**CSS:**
- ✅ Remove unused CSS (PurgeCSS)
- ✅ Critical CSS inlined
- ✅ Non-critical CSS lazy-loaded

---

### 5. Caching Strategy

**Cache-Control Headers:**

```
# Static assets (1 year)
/assets/*  Cache-Control: public, max-age=31536000, immutable

# HTML (no cache, always revalidate)
/*.html  Cache-Control: no-cache, must-revalidate

# Service worker
/sw.js  Cache-Control: no-cache
```

**Implemented:**
- ✅ Content hashing for assets (`[name].[hash].js`)
- ✅ Long-term caching for vendor chunks
- ✅ Service Worker caching (offline support)

---

## Lighthouse Setup

### 1. Install Dependencies

Already installed:
```bash
npm install --save-dev @lhci/cli lighthouse
```

### 2. Configuration

File: `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "url": [
        "http://localhost:4173/",
        "http://localhost:4173/login",
        "http://localhost:4173/dashboard"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

### 3. NPM Scripts

```json
{
  "scripts": {
    "lighthouse": "npm run build && lhci autorun",
    "lighthouse:desktop": "npm run build && lhci autorun --preset=desktop",
    "lighthouse:mobile": "npm run build && lhci autorun --preset=mobile"
  }
}
```

---

## Running Audits

### Local Development Audit

```bash
# Build + audit (3 URLs, desktop preset)
npm run lighthouse

# Mobile audit
npm run lighthouse:mobile

# Desktop audit
npm run lighthouse:desktop
```

**Output:**
- Reports saved to `lighthouse-reports/`
- Console summary with scores
- Warnings/errors for failed assertions

---

### Single Page Audit (Manual)

```bash
# Install Lighthouse CLI globally
npm install -g lighthouse

# Run audit on specific URL
lighthouse http://localhost:4173/dashboard \
  --preset=desktop \
  --output=html \
  --output-path=./lighthouse-reports/dashboard.html
```

---

### CI/CD Integration

Add to GitHub Actions workflow:

```yaml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run lighthouse
      - uses: actions/upload-artifact@v3
        with:
          name: lighthouse-reports
          path: lighthouse-reports/
```

---

## Bundle Analysis

### 1. Generate Visualization

Build includes bundle analyzer:

```bash
npm run build
```

**Output:** `dist/stats.html`

**Open in browser:**
```bash
# Windows
start dist/stats.html

# macOS
open dist/stats.html

# Linux
xdg-open dist/stats.html
```

---

### 2. Analyze Bundle

**Visualizer shows:**
- Treemap of all chunks
- Size of each module
- Gzip/Brotli sizes
- Duplicate dependencies

**Optimization tips:**
- **Large modules:** Consider lazy loading
- **Duplicates:** Check for multiple versions (use `npm dedupe`)
- **Unused code:** Review imports, remove dead code

---

### 3. Webpack Bundle Analyzer (Alternative)

```bash
npm install --save-dev rollup-plugin-visualizer

# Already configured in vite.config.ts
```

---

## Best Practices

### DO ✅

1. **Lazy Load Routes**
   ```typescript
   const HeavyView = lazy(() => import('@/views/HeavyView'));
   ```

2. **Use React.memo for Expensive Components**
   ```typescript
   const ExpensiveChart = React.memo(({ data }) => {
     // Heavy rendering logic
   });
   ```

3. **Debounce/Throttle Event Handlers**
   ```typescript
   import { debounce } from 'lodash';
   
   const handleSearch = debounce((term) => {
     // API call
   }, 300);
   ```

4. **Virtualize Long Lists**
   ```typescript
   import { FixedSizeList } from 'react-window';
   
   <FixedSizeList height={400} itemCount={1000} itemSize={50}>
     {({ index, style }) => <div style={style}>Item {index}</div>}
   </FixedSizeList>
   ```

5. **Optimize Images**
   ```html
   <img 
     src="image.webp" 
     loading="lazy" 
     width="800" 
     height="600" 
     alt="Description"
   />
   ```

6. **Preload Critical Resources**
   ```html
   <link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin />
   ```

---

### DON'T ❌

1. **Don't Import Entire Libraries**
   ```typescript
   // ❌ Imports entire lodash (70KB)
   import _ from 'lodash';
   
   // ✅ Import only what you need
   import debounce from 'lodash/debounce';
   ```

2. **Don't Inline Large SVGs**
   ```typescript
   // ❌ Inline SVG (blocks parsing)
   <svg>...</svg>
   
   // ✅ Use <img> or lazy-load
   <img src="icon.svg" alt="Icon" />
   ```

3. **Don't Forget to Memoize**
   ```typescript
   // ❌ Recreates on every render
   const options = data.map(d => ({ label: d.name, value: d.id }));
   
   // ✅ Memoize with useMemo
   const options = useMemo(() => 
     data.map(d => ({ label: d.name, value: d.id })), 
     [data]
   );
   ```

4. **Don't Block Main Thread**
   ```typescript
   // ❌ Synchronous heavy computation
   const result = heavyComputation(data);
   
   // ✅ Use Web Worker or defer with setTimeout
   setTimeout(() => {
     const result = heavyComputation(data);
     setResult(result);
   }, 0);
   ```

5. **Don't Over-Fetch Data**
   ```typescript
   // ❌ Fetch all 10,000 records
   const allData = await api.getAllRecords();
   
   // ✅ Paginate
   const page1 = await api.getRecords({ page: 1, limit: 20 });
   ```

---

## Monitoring

### 1. Real User Monitoring (RUM)

Implemented via Google Analytics 4:

```typescript
import { trackPageView, trackEngagement } from '@/utils/analytics';

// Track page views
trackPageView(window.location.pathname);

// Track engagement time
trackEngagement({ duration: timeOnPage, pageType: 'dashboard' });
```

**Metrics collected:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

---

### 2. Synthetic Monitoring

Use Lighthouse CI in GitHub Actions:

**Frequency:** On every push/PR
**Alerts:** Email if performance score < 80

---

### 3. Performance Dashboard

View in Google Analytics:
1. Go to **Reports → Engagement → Pages and screens**
2. Add secondary dimension: **Page load time**
3. Filter by **Avg page load time > 3s**

**Insights:**
- Slowest pages
- Performance trends over time
- User device/network impact

---

## Performance Checklist

Before production deployment:

- [ ] Run `npm run lighthouse` - all scores ≥ 80
- [ ] Bundle size < 1MB gzipped (initial load)
- [ ] FCP < 2.0s, LCP < 2.5s
- [ ] No console errors/warnings
- [ ] Images optimized (WebP, lazy loading)
- [ ] Fonts preloaded
- [ ] Service Worker enabled
- [ ] CDN configured for assets
- [ ] Gzip/Brotli compression enabled
- [ ] Cache-Control headers set

---

## Troubleshooting

### Lighthouse Score < 80

**Common issues:**
1. **Large JavaScript bundles**
   - Solution: Further code splitting, remove unused dependencies
   
2. **Render-blocking resources**
   - Solution: Defer non-critical CSS/JS, preload critical fonts
   
3. **Slow server response**
   - Solution: Use CDN, enable HTTP/2, optimize Firebase queries

4. **Images not optimized**
   - Solution: Convert to WebP, use srcset for responsive images

---

### High CLS (Layout Shift)

**Causes:**
- Images without width/height attributes
- Fonts loading late (FOIT/FOUT)
- Dynamic content inserted above viewport

**Solutions:**
- Set explicit dimensions: `<img width="800" height="600" />`
- Use `font-display: swap`
- Reserve space for dynamic content with skeleton loaders

---

### High TBT (Blocking Time)

**Causes:**
- Large JavaScript tasks (> 50ms)
- Heavy rendering/computations on main thread

**Solutions:**
- Break up long tasks with `setTimeout`
- Use Web Workers for heavy computations
- Defer non-critical JavaScript

---

## Summary

### Quick Commands

| Task | Command |
|------|---------|
| Build production | `npm run build` |
| Run Lighthouse audit | `npm run lighthouse` |
| View bundle analysis | `start dist/stats.html` |
| Local preview | `npm run preview` |

### Key Metrics

- **Bundle size:** 500 KB gzipped (initial)
- **Performance score:** Target ≥ 80
- **FCP:** Target < 2.0s
- **LCP:** Target < 2.5s
- **Routes:** 38 lazy-loaded views

### Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit)

---

**Updated:** 2024-01-15
**Version:** 1.0.0
**Author:** NataCarePM Team
