import React, { useState, useCallback } from 'react';
import { X, Plus, GraduationCap, Calendar, Users, FileText, Clock } from 'lucide-react';
import type { SafetyTraining, TrainingType, TrainingStatus } from '@/types/safety.types';

type TrainingAttendee = SafetyTraining['attendees'][0];

interface TrainingFormProps {
  projectId: string;
  initialData?: Partial<SafetyTraining>;
  onSubmit: (
    training: Omit<SafetyTraining, 'id' | 'trainingNumber' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const TrainingForm: React.FC<TrainingFormProps> = ({
  projectId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || ('safety_orientation' as TrainingType),
    title: initialData?.title || '',
    description: initialData?.description || '',
    instructor: initialData?.instructor || '',
    duration: initialData?.duration || 2,
    scheduledDate: initialData?.scheduledDate
      ? initialData.scheduledDate.toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    status: initialData?.status || ('scheduled' as TrainingStatus),
    location: initialData?.location || '',
    maxAttendees: initialData?.maxAttendees || 20,
    assessmentRequired: initialData?.assessmentRequired || false,
    passingScore: initialData?.passingScore || 80,
    regulatoryRequirement: initialData?.regulatoryRequirement || '',
    complianceStandard: initialData?.complianceStandard || '',
    cost: initialData?.cost || 0,
    notes: initialData?.notes || '',
  });

  const [topics, setTopics] = useState<string[]>(initialData?.topics || []);
  const [materials, setMaterials] = useState<string[]>(initialData?.materials || []);
  const [attendees, setAttendees] = useState<TrainingAttendee[]>(initialData?.attendees || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Topic management
  const [newTopic, setNewTopic] = useState('');

  const addTopic = useCallback(() => {
    if (newTopic.trim()) {
      setTopics((prev) => [...prev, newTopic.trim()]);
      setNewTopic('');
    }
  }, [newTopic]);

  const removeTopic = useCallback((index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Material management
  const [newMaterial, setNewMaterial] = useState('');

  const addMaterial = useCallback(() => {
    if (newMaterial.trim()) {
      setMaterials((prev) => [...prev, newMaterial.trim()]);
      setNewMaterial('');
    }
  }, [newMaterial]);

  const removeMaterial = useCallback((index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Attendee management
  const addAttendee = useCallback(() => {
    const newAttendee: TrainingAttendee = {
      userId: `temp-${Date.now()}`,
      name: '',
      role: '',
      attended: false,
      score: undefined,
      passed: undefined,
      certificateIssued: false,
      certificateNumber: undefined,
    };
    setAttendees((prev) => [...prev, newAttendee]);
  }, []);

  const updateAttendee = useCallback((userId: string, updates: Partial<TrainingAttendee>) => {
    setAttendees((prev) =>
      prev.map((attendee) => (attendee.userId === userId ? { ...attendee, ...updates } : attendee))
    );
  }, []);

  const removeAttendee = useCallback((userId: string) => {
    setAttendees((prev) => prev.filter((attendee) => attendee.userId !== userId));
  }, []);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.instructor.trim()) newErrors.instructor = 'Instructor is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    if (formData.maxAttendees <= 0) newErrors.maxAttendees = 'Max attendees must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const trainingData: Omit<
        SafetyTraining,
        'id' | 'trainingNumber' | 'createdAt' | 'updatedAt'
      > = {
        projectId,
        type: formData.type,
        title: formData.title,
        description: formData.description || undefined,
        instructor: formData.instructor,
        duration: formData.duration,
        scheduledDate: new Date(formData.scheduledDate),
        completedDate: formData.status === 'completed' ? new Date() : undefined,
        expiryDate:
          formData.status === 'completed'
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
            : undefined,
        status: formData.status,
        attendees,
        topics,
        materials,
        assessmentRequired: formData.assessmentRequired,
        passingScore: formData.assessmentRequired ? formData.passingScore : undefined,
        regulatoryRequirement: formData.regulatoryRequirement || undefined,
        complianceStandard: formData.complianceStandard || undefined,
        location: formData.location,
        maxAttendees: formData.maxAttendees || undefined,
        cost: formData.cost || undefined,
        notes: formData.notes || undefined,
      };

      await onSubmit(trainingData);
    },
    [formData, attendees, topics, materials, projectId, validateForm, onSubmit]
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {initialData ? 'Edit Training Session' : 'Schedule New Training'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure training session details and participants
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto"
        >
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Training Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Training Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value as TrainingType }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="safety_orientation">Safety Orientation</option>
                  <option value="fall_protection">Fall Protection</option>
                  <option value="confined_space">Confined Space</option>
                  <option value="hot_work">Hot Work</option>
                  <option value="scaffolding">Scaffolding</option>
                  <option value="crane_operation">Crane Operation</option>
                  <option value="excavation">Excavation</option>
                  <option value="hazmat">Hazmat</option>
                  <option value="first_aid">First Aid</option>
                  <option value="fire_safety">Fire Safety</option>
                  <option value="ppe_usage">PPE Usage</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value as TrainingStatus }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Training Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Fall Protection Certification"
                required
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Provide details about the training content and objectives..."
              />
            </div>

            {/* Instructor, Date, Duration, Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  Instructor *
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData((prev) => ({ ...prev, instructor: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.instructor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Instructor name"
                  required
                />
                {errors.instructor && (
                  <p className="mt-1 text-sm text-red-600">{errors.instructor}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Scheduled Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration (hours) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, duration: parseFloat(e.target.value) || 0 }))
                  }
                  min="0.5"
                  step="0.5"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.duration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Training location"
                  required
                />
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              </div>
            </div>
          </div>

          {/* Topics */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training Topics</h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                placeholder="Add a topic (press Enter)"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={addTopic}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {topics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full"
                >
                  <span className="text-sm">{topic}</span>
                  <button
                    type="button"
                    onClick={() => removeTopic(index)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assessment</h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="assessmentRequired"
                checked={formData.assessmentRequired}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, assessmentRequired: e.target.checked }))
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="assessmentRequired"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Assessment Required
              </label>
            </div>

            {formData.assessmentRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      passingScore: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  max="100"
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Compliance */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Regulatory Compliance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Regulatory Requirement
                </label>
                <input
                  type="text"
                  value={formData.regulatoryRequirement}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, regulatoryRequirement: e.target.value }))
                  }
                  placeholder="e.g., OSHA Requirement"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Compliance Standard
                </label>
                <input
                  type="text"
                  value={formData.complianceStandard}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, complianceStandard: e.target.value }))
                  }
                  placeholder="e.g., OSHA 1926.503"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Additional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Attendees
                </label>
                <input
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxAttendees: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cost ($)
                </label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Additional notes or instructions..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  {initialData ? 'Update Training' : 'Schedule Training'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
