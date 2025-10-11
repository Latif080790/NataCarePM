import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
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
