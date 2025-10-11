
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { X } from 'lucide-react';

// FIX: Use React.PropsWithChildren to correctly type the `children` prop.
// This resolves multiple errors where the Modal component was incorrectly flagged as missing children.
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 bg-night-black/60 backdrop-blur-md"
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden animate-slideUp`}>
        <Card className="glass border-violet-essence/30 shadow-2xl backdrop-blur-xl">
          {/* Enhanced Header */}
          <CardHeader className="flex flex-row items-center justify-between sticky top-0 glass border-b border-violet-essence/20 z-10 backdrop-blur-xl">
            <CardTitle className="text-xl font-bold gradient-text flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              {title}
            </CardTitle>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-palladium hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 group glass-subtle border border-violet-essence/20"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </CardHeader>
          
          {/* Enhanced Content */}
          <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
            {children}
          </CardContent>
        </Card>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(230, 228, 230, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #F87941, #F9B095);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #F9B095, #F87941);
        }
      `}</style>
    </div>
  );
}