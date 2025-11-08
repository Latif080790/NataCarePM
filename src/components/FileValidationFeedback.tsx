/**
 * 📁 File Validation Feedback Component
 * 
 * Provides visual feedback for file validation results
 * - Success/Error/Warning indicators
 * - Formatted file metadata display
 * - User-friendly error messages
 * - Upload button state management
 */

import React from 'react';
import { FileValidationResult, formatFileSize } from '@/utils/fileValidation';

interface FileValidationFeedbackProps {
  file: File;
  validationResult: FileValidationResult;
  onUpload?: () => void;
  showHelp?: boolean;
}

/**
 * Component that displays validation feedback for uploaded files
 */
const FileValidationFeedback: React.FC<FileValidationFeedbackProps> = ({
  file,
  validationResult,
  onUpload,
  showHelp = false,
}) => {
  const { valid, error, warnings } = validationResult;

  // Determine file type display name
  const getFileTypeDisplay = (mimeType: string): string => {
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'application/vnd.ms-excel': 'XLS',
      'text/plain': 'TXT',
      'text/csv': 'CSV',
    };
    return typeMap[mimeType] || mimeType;
  };

  return (
    <div className="file-validation-feedback p-4 border rounded-lg">
      {/* File Metadata */}
      <div className="file-info mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{file.name}</span>
          <span className="text-sm text-gray-500">
            ({formatFileSize(file.size)})
          </span>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
            {getFileTypeDisplay(file.type)}
          </span>
        </div>
      </div>

      {/* Validation Status */}
      <div className="validation-status mb-3">
        {/* Success State */}
        {valid && !warnings && (
          <div className="flex items-center gap-2 text-green-600">
            <span 
              data-testid="validation-success-icon" 
              className="text-green-500 text-xl"
            >
              ✓
            </span>
            <span className="font-medium">Siap untuk diunggah</span>
          </div>
        )}

        {/* Warning State */}
        {valid && warnings && warnings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-yellow-600 mb-2">
              <span 
                data-testid="validation-warning-icon" 
                className="text-yellow-500 text-xl"
              >
                ⚠️
              </span>
              <span className="font-medium">Peringatan</span>
            </div>
            <div data-testid="validation-warnings">
              <ul className="list-disc list-inside text-sm text-gray-700 ml-6">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Error State */}
        {!valid && error && (
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <span 
                data-testid="validation-error-icon" 
                className="text-red-500 text-xl"
              >
                ❌
              </span>
              <span className="font-medium">Kesalahan Validasi</span>
            </div>
            <div 
              data-testid="validation-error-message"
              className="text-sm text-red-700 bg-red-50 p-3 rounded"
            >
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      {showHelp && !valid && (
        <div className="help-section mt-3 p-3 bg-blue-50 rounded text-sm text-blue-900">
          {error?.includes('tidak diizinkan') && !error?.includes('karakter') && (
            <div>
              <strong>Tipe file yang diizinkan:</strong>
              <p className="mt-1">PDF, DOCX, XLSX, JPG, PNG, GIF, TXT, CSV, dan lainnya</p>
            </div>
          )}
          {error?.includes('melebihi batas maksimal') && (
            <div>
              <strong>Saran:</strong>
              <p className="mt-1">Kompres file Anda atau gunakan file dengan ukuran maksimal 10 MB</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      {onUpload && (
        <div className="upload-action mt-4">
          <button
            onClick={onUpload}
            disabled={!valid}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              valid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Upload
          </button>
        </div>
      )}
    </div>
  );
};

export default FileValidationFeedback;
