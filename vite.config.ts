import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Security Headers Plugin
 * Adds HTTP security headers to development server responses
 */
function securityHeadersPlugin() {
  return {
    name: 'security-headers',
    configureServer(server: any) {
      server.middlewares.use((_req: any, res: any, next: any) => {
        // Content Security Policy
        res.setHeader(
          'Content-Security-Policy',
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-inline needed for Vite dev
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebase.com wss://*.firebaseio.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
          ].join('; ')
        );
        
        // X-Frame-Options: Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');
        
        // X-Content-Type-Options: Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // X-XSS-Protection: Enable XSS filter (legacy, but doesn't hurt)
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Referrer-Policy: Control referrer information
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Permissions-Policy: Control browser features
        res.setHeader(
          'Permissions-Policy',
          'camera=(), microphone=(), geolocation=(), payment=()'
        );
        
        // Strict-Transport-Security (HSTS): Force HTTPS (production only)
        if (process.env.NODE_ENV === 'production') {
          res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
          );
        }
        
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
