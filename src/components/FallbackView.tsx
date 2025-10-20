import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { 
  AlertTriangle, 
  Database, 
  WifiOff, 
  ArrowLeft,
  Construction,
  Calendar,
  Users,
  FileText,
  BarChart3,
  Settings,
  Zap
} from 'lucide-react';
import { Spinner } from './Spinner';

interface FallbackViewProps {
  type?: 'loading' | 'error' | 'empty' | 'offline' | 'coming-soon';
  title?: string;
  description?: string;
  action?: React.ReactNode;
  viewName?: string;
  viewId?: string;
  onNavigateBack?: () => void;
  comingSoonFeatures?: string[];
}

export const FallbackView: React.FC<FallbackViewProps> = ({
  type = 'loading',
  title,
  description,
  action,
  viewName,
  viewId,
  onNavigateBack,
  comingSoonFeatures = []
}) => {
  
  // Coming Soon View
  if (type === 'coming-soon' && viewName && viewId && onNavigateBack) {
    const getViewIcon = (id: string) => {
      const iconMap: { [key: string]: React.ComponentType<any> } = {
        'tasks': Calendar,
        'task_list': Calendar,
        'kanban': Users,
        'kanban_board': Users,
        'dependencies': BarChart3,
        'notifications': Settings,
        'laporan_harian': FileText,
        'progres': BarChart3,
        'absensi': Users,
        'biaya_proyek': BarChart3,
        'arus_kas': BarChart3,
        'strategic_cost': BarChart3,
        'logistik': Settings,
        'dokumen': FileText,
        'laporan': FileText,
        'user_management': Users,
        'master_data': Settings,
        'audit_trail': FileText,
        'profile': Users
      };
      
      return iconMap[id] || Construction;
    };

    const ViewIcon = getViewIcon(viewId);

    const defaultFeatures = [
      'Real-time data synchronization',
      'Advanced filtering and search',
      'Export functionality',
      'Mobile-responsive interface',
      'Role-based permissions',
      'Automated notifications'
    ];

    const features = comingSoonFeatures.length > 0 ? comingSoonFeatures : defaultFeatures;

    return (
      <div className="min-h-screen glass-bg p-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={onNavigateBack}
              className="mb-4 text-palladium hover:text-night-black"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl gradient-bg-primary flex items-center justify-center floating">
                <ViewIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">{viewName}</h1>
                <p className="text-palladium">Modul Professional Enterprise</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Development Status */}
            <Card className="glass-enhanced border-violet-essence/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Construction className="w-6 h-6 text-precious-persimmon" />
                  Status Pengembangan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="glass-subtle rounded-xl p-4 border border-violet-essence/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-night-black">Progress Pengembangan</span>
                    <span className="text-sm text-precious-persimmon font-bold">75%</span>
                  </div>
                  <div className="w-full bg-violet-essence-100 rounded-full h-3">
                    <div 
                      className="gradient-bg-primary h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                      style={{ width: '75%' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl glass-subtle">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-sm text-night-black">UI/UX Design - Selesai</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl glass-subtle">
                    <div className="w-3 h-3 rounded-full bg-precious-persimmon animate-pulse"></div>
                    <span className="text-sm text-night-black">Backend Integration - Dalam Proses</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl glass-subtle">
                    <div className="w-3 h-3 rounded-full bg-palladium"></div>
                    <span className="text-sm text-night-black">Testing & QA - Menunggu</span>
                  </div>
                </div>

                {description && (
                  <div className="glass-subtle rounded-xl p-4 border border-violet-essence/20">
                    <p className="text-sm text-palladium leading-relaxed">{description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coming Soon Features */}
            <Card className="glass-enhanced border-violet-essence/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Zap className="w-6 h-6 text-precious-persimmon" />
                  Fitur yang Akan Datang
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl glass-subtle hover:border-violet-essence/40 transition-all duration-300 group border border-violet-essence/20"
                    >
                      <div className="w-2 h-2 rounded-full bg-precious-persimmon group-hover:animate-pulse"></div>
                      <span className="text-sm text-night-black group-hover:text-precious-persimmon transition-colors">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl gradient-bg-secondary text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold">Estimasi Rilis</span>
                  </div>
                  <p className="text-sm opacity-90">Modul ini akan tersedia dalam update selanjutnya. Terima kasih atas kesabaran Anda!</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card className="glass-enhanced border-violet-essence/20">
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={onNavigateBack}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm">Kembali</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    <span className="text-sm">Refresh</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => console.log('Help center - Coming soon')}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">Bantuan</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => console.log('Feedback - Coming soon')}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-sm">Feedback</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Standard fallback views with enhanced design
  const getContent = () => {
    switch (type) {
      case 'loading':
        return {
          icon: <Spinner size="lg" />,
          title: title || 'Memuat Data...',
          description: description || 'Mohon tunggu sebentar sementara kami memuat data Anda.',
          bgColor: 'glass-bg',
          iconBg: 'gradient-bg-primary',
          iconColor: 'text-white'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-8 h-8" />,
          title: title || 'Terjadi Kesalahan',
          description: description || 'Kami mengalami masalah saat memuat tampilan ini.',
          bgColor: 'glass-bg',
          iconBg: 'bg-red-500',
          iconColor: 'text-white'
        };
      case 'empty':
        return {
          icon: <Database className="w-8 h-8" />,
          title: title || 'Tidak Ada Data',
          description: description || 'Belum ada data yang tersedia untuk ditampilkan.',
          bgColor: 'glass-bg',
          iconBg: 'bg-palladium',
          iconColor: 'text-white'
        };
      case 'offline':
        return {
          icon: <WifiOff className="w-8 h-8" />,
          title: title || 'Koneksi Terputus',
          description: description || 'Periksa koneksi internet Anda dan coba lagi.',
          bgColor: 'glass-bg',
          iconBg: 'bg-orange-500',
          iconColor: 'text-white'
        };
      default:
        return {
          icon: <Spinner size="lg" />,
          title: 'Memuat...',
          description: 'Mohon tunggu...',
          bgColor: 'glass-bg',
          iconBg: 'gradient-bg-primary',
          iconColor: 'text-white'
        };
    }
  };

  const content = getContent();

  return (
    <div className={`min-h-screen ${content.bgColor} p-6 flex items-center justify-center`}>
      <Card className="glass-enhanced border-violet-essence/20 max-w-md w-full">
        <CardContent className="p-12 text-center">
          <div className={`w-20 h-20 ${content.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-6 floating`}>
            <div className={content.iconColor}>
              {content.icon}
            </div>
          </div>
          <h2 className="text-2xl font-bold gradient-text mb-3">{content.title}</h2>
          <p className="text-palladium mb-8 leading-relaxed">{content.description}</p>
          {action && (
            <div className="space-y-3">
              {action}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FallbackView;
