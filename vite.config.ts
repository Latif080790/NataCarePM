import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa'; // Temporarily disabled
import { visualizer } from 'rollup-plugin-visualizer';

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
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
      ],
      exclude: ['xlsx', 'jspdf', 'jspdf-autotable'],
      force: true, // Force re-optimize on next run
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime'], // Prevent duplicate React instances
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
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
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
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
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Split vendor libraries into separate chunks for better caching
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('@google-cloud')) return 'google-cloud';
              if (id.includes('tensorflow')) return 'tensorflow';
              // CRITICAL: Bundle React core + jsx-runtime together
              if (id.includes('react/jsx-runtime') || id.includes('react/jsx-dev-runtime')) return 'react-vendor';
              if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
              if (id.includes('framer-motion')) return 'framer-motion';
              if (id.includes('recharts') || id.includes('chart')) return 'charts';
              if (id.includes('@sentry')) return 'sentry';
              if (id.includes('tesseract')) return 'tesseract';
              return 'vendor';
            }
            // Lazy-loaded views are automatically split by dynamic imports
            if (id.includes('/src/views/')) {
              const viewName = id.split('/').pop()?.split('.')[0];
              return viewName ? `views/${viewName}` : undefined;
            }
            // Split contexts into separate chunk
            if (id.includes('/src/contexts/')) return 'contexts';
            // Split utils into separate chunk
            if (id.includes('/src/utils/')) return 'utils';
            // Default: no manual chunking
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
      minify: 'terser', // Re-enable minification for production
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // Remove console logs in production
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.debug', 'console.info'] : [],
        },
        mangle: {
          safari10: true, // Fix Safari 10 bugs
        },
        format: {
          comments: false, // Remove comments
        },
      },
      reportCompressedSize: true,
      cssCodeSplit: true, // Split CSS into separate files per chunk
      assetsInlineLimit: 4096, // Inline assets < 4KB as base64
    },
  };
});
