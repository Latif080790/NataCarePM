import React from 'react';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { AlertTriangle, Database, Wifi, WifiOff } from 'lucide-react';

interface FallbackViewProps {
  type?: 'loading' | 'error' | 'empty' | 'offline';
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const FallbackView: React.FC<FallbackViewProps> = ({
  type = 'loading',
  title,
  description,
  action
}) => {
  const getContent = () => {
    switch (type) {
      case 'loading':
        return {
          icon: <Spinner size="lg" />,
          title: title || 'Loading...',
          description: description || 'Please wait while we load your data.',
          bgColor: 'from-blue-50 to-indigo-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-12 h-12" />,
          title: title || 'Something went wrong',
          description: description || 'We encountered an error while loading this view.',
          bgColor: 'from-red-50 to-pink-50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'empty':
        return {
          icon: <Database className="w-12 h-12" />,
          title: title || 'No data available',
          description: description || 'There is no data to display in this view.',
          bgColor: 'from-gray-50 to-slate-50',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
      case 'offline':
        return {
          icon: <WifiOff className="w-12 h-12" />,
          title: title || 'Connection lost',
          description: description || 'Please check your internet connection and try again.',
          bgColor: 'from-orange-50 to-yellow-50',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600'
        };
      default:
        return {
          icon: <Spinner size="lg" />,
          title: 'Loading...',
          description: 'Please wait...',
          bgColor: 'from-blue-50 to-indigo-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
    }
  };

  const content = getContent();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${content.bgColor} p-6 flex items-center justify-center`}>
      <Card className="p-12 bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl max-w-md w-full">
        <div className="text-center">
          <div className={`w-20 h-20 ${content.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <div className={content.iconColor}>
              {content.icon}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{content.title}</h2>
          <p className="text-gray-600 mb-8">{content.description}</p>
          {action && (
            <div className="space-y-3">
              {action}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FallbackView;