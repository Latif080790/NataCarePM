/**
 * Offline Inspection Form View
 * Phase 3.5: Mobile Offline Inspections
 * 
 * Mobile-optimized inspection form with offline support
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Plus, Trash2, Save, CheckCircle, XCircle, MinusCircle, WifiOff, Wifi } from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import type { OfflineInspection } from '@/types/offline.types';

type ChecklistItem = OfflineInspection['data']['checklist'][0];

const OfflineInspectionFormView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isOnline, createInspection, updateInspection, addAttachment } = useOffline();
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<OfflineInspection['data']>({
    title: '',
    description: '',
    location: '',
    inspector: '',
    scheduledDate: new Date(),
    checklist: [],
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [currentInspectionId, setCurrentInspectionId] = useState<string | null>(null);

  // Add checklist item
  const addChecklistItem = useCallback(() => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      item: '',
      result: 'na',
    };
    setFormData((prev) => ({
      ...prev,
      checklist: [...prev.checklist, newItem],
    }));
  }, []);

  // Update checklist item
  const updateChecklistItem = useCallback((id: string, updates: Partial<ChecklistItem>) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  // Remove checklist item
  const removeChecklistItem = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== id),
    }));
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  }, []);

  // Calculate overall result
  const overallResult = useMemo(() => {
    if (formData.checklist.length === 0) return undefined;
    
    const hasFailures = formData.checklist.some((item) => item.result === 'fail');
    const allPass = formData.checklist.every((item) => item.result === 'pass' || item.result === 'na');
    
    if (hasFailures) return 'fail';
    if (allPass) return 'pass';
    return 'conditional';
  }, [formData.checklist]);

  // Validation
  const isValid = useMemo(() => {
    return (
      formData.title.trim() !== '' &&
      formData.location.trim() !== '' &&
      formData.inspector.trim() !== '' &&
      formData.checklist.length > 0 &&
      formData.checklist.every((item) => item.item.trim() !== '')
    );
  }, [formData]);

  // Save inspection
  const handleSave = useCallback(async () => {
    if (!isValid) return;

    setLoading(true);
    setSaved(false);

    try {
      let inspectionId = currentInspectionId;

      // Create or update inspection
      if (id) {
        await updateInspection(id, {
          ...formData,
          overallResult,
        });
        inspectionId = id;
      } else {
        const inspection = await createInspection(
          'project-1', // TODO: Get from context or params
          'general',
          {
            ...formData,
            overallResult,
          }
        );
        inspectionId = inspection.localId;
        setCurrentInspectionId(inspectionId);
      }

      // Upload attachments
      if (attachments.length > 0 && inspectionId) {
        for (const file of attachments) {
          await addAttachment(inspectionId, file);
        }
        setAttachments([]);
      }

      setSaved(true);
      
      setTimeout(() => {
        navigate('/inspections/offline');
      }, 1500);
      
    } catch (error) {
      console.error('Failed to save inspection:', error);
      alert('Failed to save inspection');
    } finally {
      setLoading(false);
    }
  }, [isValid, currentInspectionId, id, formData, overallResult, attachments, updateInspection, createInspection, addAttachment, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {id ? 'Edit Inspection' : 'New Inspection'}
            </h1>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-yellow-600" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          {!isOnline && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                You're offline. Data will sync automatically when you're back online.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter inspection title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Inspector *
              </label>
              <input
                type="text"
                value={formData.inspector}
                onChange={(e) => setFormData((prev) => ({ ...prev, inspector: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter inspector name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description (optional)"
              />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Inspection Checklist
            </h2>
            <button
              onClick={addChecklistItem}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {formData.checklist.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No checklist items yet. Add items to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.checklist.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) =>
                        updateChecklistItem(item.id, { item: e.target.value })
                      }
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="Checklist item"
                    />
                    <button
                      onClick={() => removeChecklistItem(item.id)}
                      className="flex-shrink-0 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 ml-8">
                    <button
                      onClick={() => updateChecklistItem(item.id, { result: 'pass' })}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border-2 text-sm font-medium ${
                        item.result === 'pass'
                          ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Pass
                    </button>
                    <button
                      onClick={() => updateChecklistItem(item.id, { result: 'fail' })}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border-2 text-sm font-medium ${
                        item.result === 'fail'
                          ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      Fail
                    </button>
                    <button
                      onClick={() => updateChecklistItem(item.id, { result: 'na' })}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border-2 text-sm font-medium ${
                        item.result === 'na'
                          ? 'border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <MinusCircle className="w-4 h-4" />
                      N/A
                    </button>
                  </div>

                  {item.notes !== undefined && (
                    <textarea
                      value={item.notes}
                      onChange={(e) =>
                        updateChecklistItem(item.id, { notes: e.target.value })
                      }
                      rows={2}
                      className="mt-2 ml-8 w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="Notes (optional)"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Photos & Attachments
          </h2>

          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={capturePhoto}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600"
              >
                <Plus className="w-5 h-5" />
                Add File
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                  >
                    <button
                      onClick={() => removeAttachment(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <p className="text-xs text-gray-600 dark:text-gray-400 pr-6 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Overall Result */}
        {overallResult && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Overall Result
            </h2>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                overallResult === 'pass'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : overallResult === 'fail'
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
              }`}
            >
              {overallResult === 'pass' && <CheckCircle className="w-5 h-5" />}
              {overallResult === 'fail' && <XCircle className="w-5 h-5" />}
              {overallResult === 'conditional' && <MinusCircle className="w-5 h-5" />}
              {overallResult.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || loading || saved}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium ${
              !isValid || loading || saved
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Inspection'}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <CheckCircle className="w-5 h-5" />
          <span>Inspection saved successfully!</span>
        </div>
      )}
    </div>
  );
};

export default OfflineInspectionFormView;
