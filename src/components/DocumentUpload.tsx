import React, { useState, useEffect, useCallback, useRef } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  AlertCircle,
  Brain,
  Zap,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

import { DocumentCategory, DocumentTemplate, IntelligentDocument } from '@/types';

import { intelligentDocumentService } from '@/api/intelligentDocumentService';

interface DocumentUploadProps {
  projectId?: string;
  onUploadComplete?: (document: IntelligentDocument) => void;
  onClose?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  document?: IntelligentDocument;
  preview?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  projectId,
  onUploadComplete,
  onClose,
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('other');
  const [enableAIProcessing, setEnableAIProcessing] = useState(true);
  const [enableOCR, setEnableOCR] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Supported file types
  const supportedTypes = {
    'application/pdf': 'PDF Document',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'Word Document (DOCX)',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPG Image',
    'image/png': 'PNG Image',
    'image/tiff': 'TIFF Image',
    'image/bmp': 'BMP Image',
    'text/plain': 'Text File',
    'application/rtf': 'RTF Document',
  };

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = Array.from(files).map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
    }));

    // Validate files
    const validFiles = newFiles.filter((uploadFile) => {
      const { file } = uploadFile;

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        uploadFile.status = 'error';
        uploadFile.error = 'File size exceeds 50MB limit';
        return true;
      }

      // Check file type
      if (!Object.keys(supportedTypes).includes(file.type)) {
        uploadFile.status = 'error';
        uploadFile.error = `Unsupported file type: ${file.type}`;
        return true;
      }

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadFile.preview = e.target?.result as string;
          setUploadFiles((prev) => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      return true;
    });

    setUploadFiles((prev) => [...prev, ...validFiles]);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      handleFileSelect(files);

      // Remove drag over styling
      if (dropZoneRef.current) {
        dropZoneRef.current.classList.remove('border-blue-500', 'bg-blue-50');
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Add drag over styling
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-blue-500', 'bg-blue-50');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove drag over styling
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500', 'bg-blue-50');
    }
  }, []);

  // Remove file from upload queue
  const removeFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Process individual file
  const processFile = async (uploadFile: UploadFile): Promise<void> => {
    try {
      // Update status to uploading
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 10 } : f))
      );

      // Simulate upload progress
      for (let progress = 20; progress <= 50; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUploadFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
        );
      }

      // Update status to processing
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'processing', progress: 60 } : f))
      );

      // Create document
      const newDocument = await intelligentDocumentService.createDocument(
        `Uploaded document: ${uploadFile.file.name}`,
        'Auto-uploaded document via DocumentUpload component',
        selectedCategory,
        projectId || 'default_project',
        'current_user', // In production, get from auth context
        uploadFile.file
      );

      // Update progress
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 90 } : f))
      );

      // Process with AI if enabled
      if (enableAIProcessing) {
        await intelligentDocumentService.processDocumentWithAI(newDocument, uploadFile.file);
      }

      // Complete
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                document: newDocument,
              }
            : f
        )
      );

      if (onUploadComplete) {
        onUploadComplete(newDocument);
      }
    } catch (error) {
      console.error('File processing failed:', error);
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
    }
  };

  // Process all files
  const processAllFiles = async () => {
    setIsProcessing(true);

    const pendingFiles = uploadFiles.filter((f) => f.status === 'pending');

    // Process files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await processFile(file);
    }

    setIsProcessing(false);
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (file.type === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />;
    if (file.type.includes('word')) return <FileText className="w-8 h-8 text-blue-600" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  // Get status icon
  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'uploading':
        return <Upload className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Brain className="w-5 h-5 text-purple-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-600">
          Upload documents for AI-powered processing, OCR extraction, and intelligent analysis
        </p>
      </div>

      {/* Upload Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="other">Other</option>
              <option value="contract">Contract</option>
              <option value="specification">Specification</option>
              <option value="drawing">Drawing</option>
              <option value="report">Report</option>
              <option value="permit">Permit</option>
              <option value="invoice">Invoice</option>
              <option value="certificate">Certificate</option>
              <option value="correspondence">Correspondence</option>
              <option value="procedure">Procedure</option>
              <option value="policy">Policy</option>
            </select>
          </div>

          {/* Processing Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableOCR"
                checked={enableOCR}
                onChange={(e) => setEnableOCR(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enableOCR" className="text-sm font-medium text-gray-700">
                Enable OCR Text Extraction
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableAI"
                checked={enableAIProcessing}
                onChange={(e) => setEnableAIProcessing(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enableAI" className="text-sm font-medium text-gray-700">
                Enable AI Analysis & Insights
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drop Zone */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors duration-200 hover:border-gray-400"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-gray-600 mb-4">
              Support for PDF, Word, Images, and Text files (Max: 50MB each)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff,.bmp,.txt,.rtf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              Choose Files
            </Button>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
              {Object.entries(supportedTypes)
                .slice(0, 8)
                .map(([type, name]) => (
                  <div key={type} className="text-center">
                    {name}
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Files ({uploadFiles.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={processAllFiles}
                disabled={
                  isProcessing || uploadFiles.filter((f) => f.status === 'pending').length === 0
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Process All
              </Button>
              <Button variant="outline" onClick={() => setUploadFiles([])} disabled={isProcessing}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* File Icon/Preview */}
                    <div className="flex-shrink-0">
                      {uploadFile.preview ? (
                        <img
                          src={uploadFile.preview}
                          alt={uploadFile.file.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        getFileIcon(uploadFile.file)
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {uploadFile.file.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(uploadFile.status)}
                          {uploadFile.status === 'pending' && (
                            <button
                              onClick={() => removeFile(uploadFile.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.file.size)} •{' '}
                          {supportedTypes[uploadFile.file.type as keyof typeof supportedTypes] ||
                            'Unknown type'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {uploadFile.status === 'processing'
                            ? 'AI Processing...'
                            : uploadFile.status}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      {(uploadFile.status === 'uploading' ||
                        uploadFile.status === 'processing') && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadFile.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {uploadFile.progress}% complete
                          </p>
                        </div>
                      )}

                      {/* Error Message */}
                      {uploadFile.status === 'error' && uploadFile.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          {uploadFile.error}
                        </div>
                      )}

                      {/* Success Message */}
                      {uploadFile.status === 'completed' && uploadFile.document && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Document processed successfully
                          {enableOCR && (
                            <span className="ml-2">
                              • OCR extracted{' '}
                              {uploadFile.document.ocrResults?.[0]?.extractedText?.length || 0}{' '}
                              characters
                            </span>
                          )}
                          {enableAIProcessing && (
                            <span className="ml-2">
                              • {uploadFile.document.aiInsights.length} AI insights generated
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Summary */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {uploadFiles.filter((f) => f.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {
                    uploadFiles.filter((f) => f.status === 'uploading' || f.status === 'processing')
                      .length
                  }
                </div>
                <div className="text-xs text-gray-500">Processing</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {uploadFiles.filter((f) => f.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {uploadFiles.filter((f) => f.status === 'error').length}
                </div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 mt-6">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
        <Button
          onClick={() => {
            const completedDocuments = uploadFiles
              .filter((f) => f.status === 'completed' && f.document)
              .map((f) => f.document!);

            if (completedDocuments.length > 0 && onUploadComplete) {
              completedDocuments.forEach((doc) => onUploadComplete(doc));
            }

            if (onClose) {
              onClose();
            }
          }}
          disabled={uploadFiles.filter((f) => f.status === 'completed').length === 0}
        >
          Done ({uploadFiles.filter((f) => f.status === 'completed').length} documents)
        </Button>
      </div>
    </div>
  );
};

export default DocumentUpload;
