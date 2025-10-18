import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
        const cspDirectives = isDev ? [
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
          "upgrade-insecure-requests"
        ] : [
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
          "upgrade-insecure-requests",
          "block-all-mixed-content"
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
    }
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
        securityHeadersPlugin()
      ],
      esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react',
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunk for core dependencies
              vendor: ['react', 'react-dom'],
              
              // Firebase chunk
              firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
              
              // UI library chunk
              icons: ['lucide-react'],
              
              // Large dashboard components
              dashboards: [
                './views/DashboardView.tsx',
                './views/EnhancedDashboardView.tsx',
                './views/EnterpriseAdvancedDashboardView.tsx'
              ],
              
              // Chart and visualization components
              charts: [
                './components/LineChart.tsx',
                './components/GaugeChart.tsx',
                './components/SimpleBarChart.tsx',
                './components/RobustCharts.tsx'
              ],
              
              // Project management views
              projectViews: [
                './views/GanttChartView.tsx',
                './views/InteractiveGanttView.tsx',
                './views/KanbanView.tsx',
                './views/TasksView.tsx',
                './views/TaskListView.tsx'
              ],
              
              // AI and monitoring features
              aiMonitoring: [
                './components/AiAssistantChat.tsx',
                './components/MonitoringDashboard.tsx',
                './api/monitoringService.ts'
              ]
            }
          }
        },
        chunkSizeWarningLimit: 1000 // Increase warning limit to 1MB
      }
    };
});
