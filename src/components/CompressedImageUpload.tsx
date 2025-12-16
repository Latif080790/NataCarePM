/**
 * Image Upload Component with Compression
 * 
 * Drop-in replacement for standard file input with automatic compression
 * - Drag & drop support
 * - Preview thumbnails
 * - Progress tracking
 * - Compression stats display
 * 
 * @component
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { compressImage, compressImageBatch, formatFileSize, shouldCompress, CompressionResult } from '@/utils/imageCompression';
import { SpinnerPro } from '@/components/SpinnerPro';
import { ButtonPro } from '@/components/ButtonPro';

export interface CompressedImageUploadProps {
  onFilesCompressed: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

interface FileWithStatus {
  file: File;
  status: 'pending' | 'compressing' | 'completed' | 'error';
  progress: number;
  result?: CompressionResult;
  error?: string;
  preview?: string;
}

export function CompressedImageUpload({
  onFilesCompressed,
  maxFiles = 10,
  accept = 'image/*',
  disabled = false,
  className = '',
}: CompressedImageUploadProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);
    
    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      alert(`Maksimal ${maxFiles} file`);
      return;
    }

    // Create initial file status
    const newFiles: FileWithStatus[] = fileArray.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
      preview: URL.createObjectURL(file),
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Process files
    const compressedFiles: File[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const fileStatus = newFiles[i];
      const index = files.length + i;

      try {
        // Update status to compressing
        setFiles(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: 'compressing' };
          return updated;
        });

        // Check if compression needed
        if (!shouldCompress(fileStatus.file)) {
          // File already small enough
          setFiles(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              status: 'completed',
              progress: 100,
              result: {
                compressedFile: fileStatus.file,
                originalSize: fileStatus.file.size,
                compressedSize: fileStatus.file.size,
                compressionRatio: 0,
                processingTime: 0,
                dimensions: { width: 0, height: 0 },
              },
            };
            return updated;
          });
          compressedFiles.push(fileStatus.file);
          continue;
        }

        // Compress image
        const result = await compressImage(fileStatus.file, {
          onProgress: (progress) => {
            setFiles(prev => {
              const updated = [...prev];
              updated[index] = { ...updated[index], progress };
              return updated;
            });
          },
        });

        // Update status to completed
        setFiles(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            status: 'completed',
            progress: 100,
            result,
          };
          return updated;
        });

        compressedFiles.push(result.compressedFile);
      } catch (error) {
        // Update status to error
        setFiles(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            status: 'error',
            error: error instanceof Error ? error.message : 'Kompresi gagal',
          };
          return updated;
        });
      }
    }

    // Callback with compressed files
    if (compressedFiles.length > 0) {
      onFilesCompressed(compressedFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => {
      const updated = [...prev];
      // Revoke preview URL
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm font-medium text-gray-900 mb-1">
          Klik atau drag & drop foto
        </p>
        <p className="text-xs text-gray-500">
          Foto akan otomatis dikompres (target: &lt;500KB)
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Maksimal {maxFiles} file
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileStatus, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {fileStatus.preview ? (
                  <img
                    src={fileStatus.preview}
                    alt={fileStatus.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400 m-3" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileStatus.file.name}
                </p>
                
                {fileStatus.status === 'pending' && (
                  <p className="text-xs text-gray-500">Menunggu...</p>
                )}
                
                {fileStatus.status === 'compressing' && (
                  <div className="space-y-1">
                    <p className="text-xs text-primary-600">
                      Mengompres... {fileStatus.progress.toFixed(0)}%
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-primary-600 h-1 rounded-full transition-all"
                        style={{ width: `${fileStatus.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {fileStatus.status === 'completed' && fileStatus.result && (
                  <p className="text-xs text-green-600">
                    {formatFileSize(fileStatus.result.originalSize)} → {formatFileSize(fileStatus.result.compressedSize)}
                    {fileStatus.result.compressionRatio > 0 && (
                      <span className="ml-1">
                        (-{fileStatus.result.compressionRatio.toFixed(0)}%)
                      </span>
                    )}
                  </p>
                )}
                
                {fileStatus.status === 'error' && (
                  <p className="text-xs text-red-600">
                    {fileStatus.error}
                  </p>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {fileStatus.status === 'compressing' && (
                  <SpinnerPro size="sm" />
                )}
                
                {fileStatus.status === 'completed' && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
                
                {fileStatus.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Summary */}
          {files.some(f => f.status === 'completed') && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">
                📦 Kompresi Selesai
              </p>
              <p className="text-xs text-green-700 mt-1">
                Hemat: {formatFileSize(
                  files
                    .filter(f => f.result)
                    .reduce((sum, f) => sum + (f.result!.originalSize - f.result!.compressedSize), 0)
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
