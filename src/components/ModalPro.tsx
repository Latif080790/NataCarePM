/**
 * ModalPro - Professional Modal Component
 * 
 * Accessible, enterprise-grade modal dialog with proper focus management.
 * Supports multiple sizes and variants.
 * 
 * @component
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { ButtonPro, ButtonProGroup } from './ButtonPro';

export interface ModalProProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

/**
 * Professional Modal Component
 */
export function ModalPro({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}: ModalProProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Size mappings
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={() => closeOnOverlay && onClose()}
        />

        {/* Modal Panel */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className={`
            relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl
            transform transition-all sm:my-8 sm:align-middle w-full
            ${sizeClasses[size]}
            ${className}
          `}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              {title && (
                <h3
                  id="modal-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Confirmation Modal - Pre-configured for confirmations
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  const confirmVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <ModalPro
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <ButtonProGroup>
          <ButtonPro
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            fullWidth
          >
            {cancelText}
          </ButtonPro>
          <ButtonPro
            variant={confirmVariant}
            onClick={handleConfirm}
            isLoading={isLoading}
            fullWidth
          >
            {confirmText}
          </ButtonPro>
        </ButtonProGroup>
      }
    >
      <p className="text-gray-700">{message}</p>
    </ModalPro>
  );
}

/**
 * Example Usage:
 * 
 * // Basic modal
 * <ModalPro
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Edit Profile"
 * >
 *   <p>Modal content here</p>
 * </ModalPro>
 * 
 * // Modal with custom footer
 * <ModalPro
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Create New Project"
 *   size="lg"
 *   footer={
 *     <ButtonProGroup>
 *       <ButtonPro variant="outline" onClick={() => setIsOpen(false)}>
 *         Cancel
 *       </ButtonPro>
 *       <ButtonPro variant="primary" onClick={handleSave}>
 *         Save
 *       </ButtonPro>
 *     </ButtonProGroup>
 *   }
 * >
 *   <form>...</form>
 * </ModalPro>
 * 
 * // Confirmation modal
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Project"
 *   message="Are you sure you want to delete this project? This action cannot be undone."
 *   confirmText="Delete"
 *   variant="danger"
 * />
 */
