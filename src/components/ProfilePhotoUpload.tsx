/**
 * Profile Photo Upload Component
 * Interactive profile photo upload with preview, cropping, and progress indicator
 */

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, Upload, X, Check, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadProfilePhoto } from '@/api/userProfileService';
import { useToast } from '@/contexts/ToastContext';
import {
  validateImageFile,
  createPreviewURL,
  revokePreviewURL,
  formatFileSize,
} from '@/utils/imageProcessing';
import type { CropArea } from '@/types/userProfile';

export const ProfilePhotoUpload: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCropModal, setShowCropModal] = useState(false);

  // Crop state
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        addToast(validation.errors.join(', '), 'error');
        return;
      }

      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        addToast(validation.warnings.join(', '), 'info');
      }

      // Set file and create preview
      setSelectedFile(file);
      const preview = createPreviewURL(file);
      setPreviewURL(preview);
      setShowCropModal(true);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addToast]
  );

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (Firebase Storage doesn't provide progress for uploadBytes)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Convert crop to CropArea format
      let cropArea: CropArea | undefined;
      if (completedCrop) {
        cropArea = {
          x: completedCrop.x,
          y: completedCrop.y,
          width: completedCrop.width,
          height: completedCrop.height,
          unit: 'px',
        };
      }

      // Upload photo
      const response = await uploadProfilePhoto(currentUser.id, selectedFile, cropArea);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.data) {
        addToast('Profile photo updated successfully! 📸', 'success');

        // Note: AuthContext doesn't have updateUser, so we'll rely on Firebase onAuthStateChanged
        // The user will see the update on next refresh or we can force a reload
        window.location.reload();

        // Cleanup
        handleCancel();
      } else {
        addToast(response.error?.message || 'Failed to upload photo', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      addToast('Failed to upload photo. Please try again.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (previewURL) {
      revokePreviewURL(previewURL);
    }
    setSelectedFile(null);
    setPreviewURL(null);
    setShowCropModal(false);
    setCrop({
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
    setCompletedCrop(null);
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Current photo URL with fallback
  const currentPhotoURL = currentUser?.avatarUrl || '/default-avatar.png';

  return (
    <>
      {/* Main Upload Section */}
      <div className="flex flex-col items-center space-y-4">
        {/* Profile Photo Display */}
        <div className="relative group">
          <img
            src={currentPhotoURL}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 shadow-lg"
          />

          {/* Upload Overlay on Hover */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={triggerFileInput}
          >
            <Camera className="w-8 h-8 text-white" />
          </div>

          {/* Uploading Spinner */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-full">
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <button
          onClick={triggerFileInput}
          disabled={uploading}
          className="flex items-center space-x-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Change Photo'}</span>
        </button>

        {/* File Info */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">JPG, PNG, WebP or HEIC</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Max size: 5MB • Recommended: Square, 800x800px
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Crop Modal */}
      {showCropModal && previewURL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Crop Your Photo
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crop Area */}
            <div className="p-6">
              <div className="flex justify-center items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={previewURL}
                    alt="Crop preview"
                    className="max-h-[60vh] object-contain"
                    onLoad={(e) => {
                      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
                      // Auto-center crop
                      const size = Math.min(width, height);
                      const x = (width - size) / 2;
                      const y = (height - size) / 2;
                      setCrop({
                        unit: 'px',
                        width: size,
                        height: size,
                        x,
                        y,
                      });
                    }}
                  />
                </ReactCrop>
              </div>

              {/* File Info */}
              {selectedFile && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-xs mt-1">
                        Size: {formatFileSize(selectedFile.size)} • Type: {selectedFile.type}
                      </p>
                      <p className="text-xs mt-1">
                        💡 Drag the circle to adjust your photo. It will be saved as a square.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

