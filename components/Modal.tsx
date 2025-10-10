
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
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10">
            <CardTitle>{title}</CardTitle>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-palladium hover:bg-violet-essence"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}