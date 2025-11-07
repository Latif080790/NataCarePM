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
              "script-src 'self' 'sha256-PRODUCTION_HASH'", // Replace with actual hash in production
              "style-src 'self' 'sha256-PRODUCTION_HASH' https://fonts.googleapis.com",
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
      port: 3000,
      host: '0.0.0.0',
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
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: ['es2015', 'chrome79', 'safari13', 'firefox72', 'edge79'],
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
              // Split vendor libraries into separate chunks
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('tensorflow')) return 'tensorflow';
              if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
              if (id.includes('framer-motion')) return 'framer-motion';
              if (id.includes('recharts')) return 'recharts';
              return 'vendor';
            }
            if (id.includes('/src/views/')) {
              const viewName = id.split('/').pop()?.split('.')[0];
              return viewName ? `views/${viewName}` : undefined;
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      minify: 'terser', // Re-enable minification
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      reportCompressedSize: true,
    },
  };
});
