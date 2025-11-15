import React, { useState } from 'react';

import {
  Search,
  Clock,
  Star,
  Bookmark,
  ArrowRight,
  TrendingUp,
  Users,
  Calendar,
  FileText,
} from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  category: 'recent' | 'favorites' | 'shortcuts';
  badge?: string;
}

interface QuickAccessPanelProps {
  onNavigate: (viewName: string) => void;
  className?: string;
}

export default function QuickAccessPanel({ onNavigate, className = '' }: QuickAccessPanelProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'shortcuts'>('shortcuts');

  const quickActions: QuickAction[] = [
    // Shortcuts
    {
      id: 'create-task',
      title: 'Buat Tugas Baru',
      description: 'Tambah tugas baru ke project',
      icon: <Calendar className="w-5 h-5" />,
      onClick: () => {
        /* TODO: Open create task modal */
      },
      category: 'shortcuts',
      badge: 'Quick',
    },
    {
      id: 'dashboard',
      title: 'Dashboard Utama',
      description: 'Lihat ringkasan project dan KPI',
      icon: <TrendingUp className="w-5 h-5" />,
      onClick: () => onNavigate('dashboard'),
      category: 'shortcuts',
    },
    {
      id: 'team',
      title: 'Manajemen Tim',
      description: 'Kelola anggota tim dan roles',
      icon: <Users className="w-5 h-5" />,
      onClick: () => onNavigate('team'),
      category: 'shortcuts',
    },
    {
      id: 'reports',
      title: 'Laporan & Analisis',
      description: 'Buat dan lihat laporan project',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => onNavigate('report'),
      category: 'shortcuts',
    },

    // Recent (example data)
    {
      id: 'recent-1',
      title: 'Project Alpha Status',
      description: 'Terakhir dilihat 2 jam lalu',
      icon: <Clock className="w-5 h-5" />,
      onClick: () => onNavigate('dashboard'),
      category: 'recent',
    },
    {
      id: 'recent-2',
      title: 'Tim Development',
      description: 'Terakhir dilihat kemarin',
      icon: <Users className="w-5 h-5" />,
      onClick: () => onNavigate('team'),
      category: 'recent',
    },

    // Favorites
    {
      id: 'fav-1',
      title: 'Dashboard Analytics',
      description: 'Dashboard favorit Anda',
      icon: <Star className="w-5 h-5 text-precious-persimmon" />,
      onClick: () => onNavigate('dashboard'),
      category: 'favorites',
    },
    {
      id: 'fav-2',
      title: 'Laporan Bulanan',
      description: 'Template laporan yang sering digunakan',
      icon: <Bookmark className="w-5 h-5 text-precious-persimmon" />,
      onClick: () => onNavigate('report'),
      category: 'favorites',
    },
  ];

  const filteredActions = quickActions.filter((action) => action.category === activeTab);

  const tabs = [
    { id: 'shortcuts' as const, label: 'Quick Actions', icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'recent' as const, label: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { id: 'favorites' as const, label: 'Favorites', icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <Card className={`glass-enhanced border-violet-essence/20 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-night-black">Quick Access</h3>
          <div className="flex items-center space-x-1 bg-violet-essence/10 rounded-lg p-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? 'bg-white shadow-sm text-night-black'
                      : 'text-palladium hover:text-night-black hover:bg-white/50'
                  }
                `}
              >
                {tab.icon}
                <span className="text-xs font-medium">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredActions.map((action) => (
            <div
              key={action.id}
              onClick={action.onClick}
              className="group flex items-center justify-between p-3 rounded-lg glass-subtle hover:glass-enhanced cursor-pointer transition-all duration-200 hover:transform hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-violet-essence to-no-way-rose/20">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-night-black group-hover:text-precious-persimmon transition-colors">
                      {action.title}
                    </h4>
                    {action.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-precious-persimmon/10 text-precious-persimmon rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-palladium mt-0.5">{action.description}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-palladium group-hover:text-precious-persimmon group-hover:transform group-hover:translate-x-1 transition-all duration-200" />
            </div>
          ))}
        </div>

        {filteredActions.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-essence/10 flex items-center justify-center">
              <Search className="w-8 h-8 text-palladium" />
            </div>
            <p className="text-palladium text-sm">
              {activeTab === 'recent' && 'Belum ada aktivitas terbaru'}
              {activeTab === 'favorites' && 'Belum ada item favorit'}
              {activeTab === 'shortcuts' && 'Tidak ada shortcut tersedia'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

