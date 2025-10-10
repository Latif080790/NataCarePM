
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
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
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