/**
 * Camera Capture Component
 * Mobile-first camera integration for document capture
 * 
 * Features:
 * - Native camera access via getUserMedia
 * - Image compression before upload
 * - Multiple photo selection
 * - Preview before submit
 * - Firebase Storage upload
 */

import { useState, useRef, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebaseConfig';
import { Button } from '@/components/Button';
import { Camera, X, Check, RotateCcw, Upload } from 'lucide-react';
import { trackCameraUpload } from '@/utils/mobileAnalytics';

interface CameraCaptureProps {
  onCapture: (imageUrls: string[]) => void;
  onCancel: () => void;
  maxPhotos?: number;
  compressionQuality?: number;
  projectId: string;
}

interface CapturedImage {
  id: string;
  dataUrl: string;
  file: File;
  uploaded: boolean;
  uploadProgress: number;
  downloadUrl?: string;
}

export function CameraCapture({
  onCapture,
  onCancel,
  maxPhotos = 5,
  compressionQuality = 0.8,
  projectId,
}: CameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Start camera stream
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Request camera permission and stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in settings.'
          : 'Unable to access camera. Please check device settings.'
      );
    }
  }, []);

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  /**
   * Capture photo from video stream
   */
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob with compression
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        // Create file from blob
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        // Create preview data URL
        const dataUrl = canvas.toDataURL('image/jpeg', compressionQuality);

        // Add to captured images
        const newImage: CapturedImage = {
          id: `img-${Date.now()}`,
          dataUrl,
          file,
          uploaded: false,
          uploadProgress: 0,
        };

        setCapturedImages(prev => [...prev, newImage]);

        // Stop camera if max photos reached
        if (capturedImages.length + 1 >= maxPhotos) {
          stopCamera();
        }
      },
      'image/jpeg',
      compressionQuality
    );
  }, [capturedImages.length, compressionQuality, maxPhotos, stopCamera]);

  /**
   * Remove captured image
   */
  const removeImage = useCallback((imageId: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  const uploadImages = useCallback(async () => {
    if (capturedImages.length === 0) return;

    setUploading(true);
    setError(null);

    const uploadStartTime = Date.now();

    try {
      const uploadPromises = capturedImages.map(async (image) => {
        const fileSize = image.file.size;
        const uploadStart = Date.now();

        // Create storage reference
        const storageRef = ref(
          storage,
          `projects/${projectId}/documents/${image.id}-${image.file.name}`
        );

        // Upload with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, image.file);

        return new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Update progress
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              
              setCapturedImages(prev =>
                prev.map(img =>
                  img.id === image.id
                    ? { ...img, uploadProgress: progress }
                    : img
                )
              );
            },
            (error) => {
              console.error('Upload error:', error);
              
              // Track failed upload
              trackCameraUpload({
                timestamp: Date.now(),
                success: false,
                fileSize,
                compressionRatio: 0,
                uploadDuration: Date.now() - uploadStart,
                errorMessage: error.message,
              });

              reject(error);
            },
            async () => {
              // Upload complete - get download URL
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              
              setCapturedImages(prev =>
                prev.map(img =>
                  img.id === image.id
                    ? { ...img, uploaded: true, downloadUrl }
                    : img
                )
              );

              // Track successful upload
              trackCameraUpload({
                timestamp: Date.now(),
                success: true,
                fileSize,
                compressionRatio: compressionQuality,
                uploadDuration: Date.now() - uploadStart,
              });

              resolve(downloadUrl);
            }
          );
        });
      });

      const urls = await Promise.all(uploadPromises);
      
      // Notify parent component
      onCapture(urls);
      
      // Stop camera
      stopCamera();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [capturedImages, projectId, onCapture, stopCamera, compressionQuality]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-night-black/90 backdrop-blur">
        <h2 className="text-white font-semibold">
          {isCapturing ? 'Capture Photo' : 'Review Photos'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 bg-red-500/90 text-white text-sm">
          {error}
        </div>
      )}

      {/* Camera View or Preview */}
      <div className="flex-1 relative overflow-hidden">
        {isCapturing ? (
          /* Camera Stream */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          /* Photo Preview */
          <div className="h-full overflow-auto bg-gray-900 p-4">
            {capturedImages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/60">
                <div className="text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No photos captured yet</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {capturedImages.map((image) => (
                  <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={image.dataUrl}
                      alt="Captured"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Upload Progress */}
                    {uploading && !image.uploaded && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Upload className="w-6 h-6 mx-auto mb-1 animate-pulse" />
                          <p className="text-xs">{Math.round(image.uploadProgress)}%</p>
                        </div>
                      </div>
                    )}

                    {/* Uploaded Check */}
                    {image.uploaded && (
                      <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Remove Button */}
                    {!uploading && (
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 left-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-night-black/90 backdrop-blur p-4">
        {isCapturing ? (
          /* Camera Controls */
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={stopCamera}
              className="border-white text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 transition shadow-lg"
              aria-label="Capture photo"
            />

            <div className="w-20 text-center text-white text-sm">
              {capturedImages.length}/{maxPhotos}
            </div>
          </div>
        ) : (
          /* Preview Controls */
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={startCamera}
              disabled={uploading || capturedImages.length >= maxPhotos}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Camera className="w-5 h-5 mr-2" />
              {capturedImages.length === 0 ? 'Start Camera' : 'Take More'}
            </Button>

            <Button
              onClick={uploadImages}
              disabled={capturedImages.length === 0 || uploading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {uploading ? (
                <>
                  <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload ({capturedImages.length})
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for using camera capture
 */
export function useCameraCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const openCamera = useCallback(() => {
    // Check if camera API is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera not supported on this device/browser');
      return;
    }
    setIsOpen(true);
  }, []);

  const closeCamera = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleCapture = useCallback((imageUrls: string[]) => {
    setImages(imageUrls);
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    images,
    openCamera,
    closeCamera,
    handleCapture,
  };
}
