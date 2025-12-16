import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa'; // Temporarily disabled
import { visualizer } from 'rollup-plugin-visualizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Security Headers Plugin
 * Adds HTTP security headers to development server responses
 *
 * CSP LEVELS:
 * - Development: Relaxed for hot reload, inline styles
 * - Production: Strict policy with nonces/hashes
 */
function securityHeadersPlugin() {
  return {
    name: 'security-headers',
    configureServer(server: any) {
      server.middlewares.use((_req: any, res: any, next: any) => {
        const isDev = process.env.NODE_ENV !== 'production';

        // Content Security Policy (CSP)
        // Development: More permissive for HMR and dev tools
        // Production: Strict policy for maximum security
        const cspDirectives = isDev
          ? [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Vite HMR
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebase.com wss://*.firebaseio.com ws://localhost:* http://localhost:*",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              'upgrade-insecure-requests',
            ]
          : [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'", // Allow inline scripts for React runtime
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https://*.googleapis.com https://firebasestorage.googleapis.com blob:",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebase.com https://generativelanguage.googleapis.com wss://*.firebaseio.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              'upgrade-insecure-requests',
              'block-all-mixed-content',
            ];

        res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

        // X-Frame-Options: Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');

        // X-Content-Type-Options: Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // X-XSS-Protection: Enable XSS filter (legacy browsers)
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Referrer-Policy: Control referrer information
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions-Policy: Restrict browser features
        res.setHeader(
          'Permissions-Policy',
          'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
        );

        // Strict-Transport-Security (HSTS): Force HTTPS (production only)
        if (!isDev) {
          res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
          );
        }

        // Cross-Origin Policies
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3001,
      host: '0.0.0.0',
      strictPort: true,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'lucide-react',
      ],
      exclude: ['xlsx', 'jspdf', 'jspdf-autotable'],
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router-dom'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
        'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
        'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      },
    },
    plugins: [
      react(),
      securityHeadersPlugin(),
      visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html',
      }) as any,
      // VitePWA temporarily disabled to prevent reload loop
    ],
    define: {
      // Gemini API key removed from client bundle - use Cloud Functions instead
      global: 'globalThis',
    },
    build: {
      target: ['es2015', 'chrome79', 'safari13', 'firefox72', 'edge79'],
      sourcemap: mode === 'production' ? 'hidden' : true, // Hidden source maps for production (for error tracking)
      rollupOptions: {
        input: 'index.html',
        external: [
          // Exclude Twilio SDK from bundle (loaded dynamically only when needed)
          'twilio',
          'jsonwebtoken',
        ],
        output: {
          // P2.1: Optimized manual chunking for better code splitting
          manualChunks: (id) => {
            // Core React ecosystem - always needed
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') ||
                id.includes('node_modules/react-router-dom') ||
                id.includes('node_modules/scheduler')) {
              return 'react-vendor';
            }
            
            // Firebase SDK - large but essential
            if (id.includes('node_modules/firebase') || 
                id.includes('node_modules/@firebase')) {
              return 'firebase';
            }
            
            // Heavy export libraries (dynamically imported)
            if (id.includes('node_modules/exceljs')) {
              return 'exceljs';
            }
            if (id.includes('node_modules/jspdf')) {
              return 'jspdf';
            }
            
            // Form libraries
            if (id.includes('node_modules/react-hook-form') || 
                id.includes('node_modules/zod') ||
                id.includes('node_modules/@hookform')) {
              return 'forms';
            }
            
            // UI libraries
            if (id.includes('node_modules/lucide-react') ||
                id.includes('node_modules/framer-motion') ||
                id.includes('node_modules/@headlessui')) {
              return 'ui-libs';
            }
            
            // Date utilities
            if (id.includes('node_modules/date-fns')) {
              return 'date-utils';
            }
            
            // Monitoring & Analytics
            if (id.includes('node_modules/@sentry') ||
                id.includes('node_modules/react-ga4') ||
                id.includes('node_modules/web-vitals')) {
              return 'monitoring';
            }
            
            // Global contexts (shared state)
            if (id.includes('src/contexts')) {
              return 'contexts';
            }
            
            // Other node_modules
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild', // Use esbuild minifier - better React 18 compatibility
      reportCompressedSize: true,
      cssCodeSplit: true, // Split CSS into separate files per chunk
      assetsInlineLimit: 4096, // Inline assets < 4KB as base64
    },
  };
});
