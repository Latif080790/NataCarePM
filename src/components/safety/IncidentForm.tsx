import React, { useState, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  FileText,
} from 'lucide-react';
import type { SafetyIncident } from '@/types/safety.types';

type InjuredPerson = SafetyIncident['injuredPersons'][0];
type Witness = NonNullable<SafetyIncident['witnesses']>[0];
type CorrectiveAction = SafetyIncident['correctiveActions'][0];

interface IncidentFormProps {
  projectId: string;
  initialData?: Partial<SafetyIncident>;
  onSubmit: (
    incident: Omit<SafetyIncident, 'id' | 'incidentNumber' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({
  projectId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    type: initialData?.type || ('fall' as const),
    severity: initialData?.severity || ('minor' as const),
    status: initialData?.status || ('reported' as const),
    title: initialData?.title || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    occurredAt: initialData?.occurredAt
      ? initialData.occurredAt.toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    reportedAt: initialData?.reportedAt
      ? initialData.reportedAt.toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    reportedBy: initialData?.reportedBy || '',
    oshaRecordable: initialData?.oshaRecordable || false,
    oshaClassification: initialData?.oshaClassification || '',
    medicalCosts: initialData?.medicalCosts || 0,
    propertyCosts: initialData?.propertyCosts || 0,
    productivityCosts: initialData?.productivityCosts || 0,
  });

  const [injuredPersons, setInjuredPersons] = useState<InjuredPerson[]>(
    initialData?.injuredPersons || []
  );
  const [witnesses, setWitnesses] = useState<Witness[]>(initialData?.witnesses || []);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>(
    initialData?.correctiveActions || []
  );
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [documents, setDocuments] = useState<string[]>(initialData?.documents || []);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.reportedBy.trim()) newErrors.reportedBy = 'Reporter name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Add injured person
  const addInjuredPerson = useCallback(() => {
    const newPerson: InjuredPerson = {
      id: `person-${Date.now()}`,
      name: '',
      role: '',
      injuryType: '',
      injurySeverity: 'minor',
      medicalTreatment: 'none',
      daysLost: 0,
    };
    setInjuredPersons((prev) => [...prev, newPerson]);
  }, []);

  const updateInjuredPerson = useCallback((id: string, updates: Partial<InjuredPerson>) => {
    setInjuredPersons((prev) =>
      prev.map((person) => (person.id === id ? { ...person, ...updates } : person))
    );
  }, []);

  const removeInjuredPerson = useCallback((id: string) => {
    setInjuredPersons((prev) => prev.filter((person) => person.id !== id));
  }, []);

  // Add witness
  const addWitness = useCallback(() => {
    const newWitness: Witness = {
      id: `witness-${Date.now()}`,
      name: '',
      role: '',
      statement: '',
    };
    setWitnesses((prev) => [...prev, newWitness]);
  }, []);

  const updateWitness = useCallback((id: string, updates: Partial<Witness>) => {
    setWitnesses((prev) =>
      prev.map((witness) => (witness.id === id ? { ...witness, ...updates } : witness))
    );
  }, []);

  const removeWitness = useCallback((id: string) => {
    setWitnesses((prev) => prev.filter((witness) => witness.id !== id));
  }, []);

  // Add corrective action
  const addCorrectiveAction = useCallback(() => {
    const newAction: CorrectiveAction = {
      id: `action-${Date.now()}`,
      action: '',
      responsibility: '',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'pending',
    };
    setCorrectiveActions((prev) => [...prev, newAction]);
  }, []);

  const updateCorrectiveAction = useCallback((id: string, updates: Partial<CorrectiveAction>) => {
    setCorrectiveActions((prev) =>
      prev.map((action) => (action.id === id ? { ...action, ...updates } : action))
    );
  }, []);

  const removeCorrectiveAction = useCallback((id: string) => {
    setCorrectiveActions((prev) => prev.filter((action) => action.id !== id));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const incidentData: Omit<
        SafetyIncident,
        'id' | 'incidentNumber' | 'createdAt' | 'updatedAt'
      > = {
        projectId,
        type: formData.type,
        severity: formData.severity,
        status: formData.status,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        occurredAt: new Date(formData.occurredAt),
        reportedAt: new Date(formData.reportedAt),
        reportedBy: formData.reportedBy,
        injuredPersons,
        witnesses,
        correctiveActions,
        photos,
        documents,
        authoritiesNotified: false,
        oshaRecordable: formData.oshaRecordable,
        oshaClassification: formData.oshaClassification || undefined,
        medicalCosts: formData.medicalCosts || undefined,
        propertyCosts: formData.propertyCosts || undefined,
        productivityCosts: formData.productivityCosts || undefined,
      };

      await onSubmit(incidentData);
    },
    [
      formData,
      injuredPersons,
      witnesses,
      correctiveActions,
      photos,
      documents,
      projectId,
      validateForm,
      onSubmit,
    ]
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {initialData ? 'Edit Incident' : 'Report New Incident'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete all required fields marked with *
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
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Incident Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="fall">Fall</option>
                  <option value="struck_by">Struck By</option>
                  <option value="caught_in_between">Caught In/Between</option>
                  <option value="electrical">Electrical</option>
                  <option value="chemical">Chemical</option>
                  <option value="fire">Fire</option>
                  <option value="equipment">Equipment</option>
                  <option value="environmental">Environmental</option>
                  <option value="ergonomic">Ergonomic</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Severity *
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, severity: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="fatal">Fatal</option>
                  <option value="critical">Critical</option>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                  <option value="near_miss">Near Miss</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Incident Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white ${
                  errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Brief description of the incident"
                required
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Detailed Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white ${
                  errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Provide detailed information about what happened..."
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Location and Date/Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white ${
                    errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Where did this occur?"
                  required
                />
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Occurred At *
                </label>
                <input
                  type="datetime-local"
                  value={formData.occurredAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, occurredAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Reporter Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Reported By *
              </label>
              <input
                type="text"
                value={formData.reportedBy}
                onChange={(e) => setFormData((prev) => ({ ...prev, reportedBy: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white ${
                  errors.reportedBy ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Name of person reporting this incident"
                required
              />
              {errors.reportedBy && (
                <p className="mt-1 text-sm text-red-600">{errors.reportedBy}</p>
              )}
            </div>
          </div>

          {/* Injured Persons */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Injured Persons
              </h3>
              <button
                type="button"
                onClick={addInjuredPerson}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Person
              </button>
            </div>

            {injuredPersons.map((person) => (
              <div
                key={person.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">Injured Person</h4>
                  <button
                    type="button"
                    onClick={() => removeInjuredPerson(person.id)}
                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) => updateInjuredPerson(person.id, { name: e.target.value })}
                    placeholder="Name"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={person.role}
                    onChange={(e) => updateInjuredPerson(person.id, { role: e.target.value })}
                    placeholder="Role/Position"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={person.injuryType}
                    onChange={(e) => updateInjuredPerson(person.id, { injuryType: e.target.value })}
                    placeholder="Type of Injury"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <select
                    value={person.injurySeverity}
                    onChange={(e) =>
                      updateInjuredPerson(person.id, { injurySeverity: e.target.value as any })
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="fatal">Fatal</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                    <option value="none">None</option>
                  </select>
                  <input
                    type="number"
                    value={person.daysLost || 0}
                    onChange={(e) =>
                      updateInjuredPerson(person.id, { daysLost: parseInt(e.target.value) || 0 })
                    }
                    placeholder="Days Lost"
                    min="0"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={person.medicalTreatment || ''}
                    onChange={(e) =>
                      updateInjuredPerson(person.id, { medicalTreatment: e.target.value })
                    }
                    placeholder="Medical Treatment"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Corrective Actions */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Corrective Actions
              </h3>
              <button
                type="button"
                onClick={addCorrectiveAction}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Action
              </button>
            </div>

            {correctiveActions.map((action) => (
              <div
                key={action.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">Corrective Action</h4>
                  <button
                    type="button"
                    onClick={() => removeCorrectiveAction(action.id)}
                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  value={action.action}
                  onChange={(e) => updateCorrectiveAction(action.id, { action: e.target.value })}
                  placeholder="Describe the corrective action..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={action.responsibility}
                    onChange={(e) =>
                      updateCorrectiveAction(action.id, { responsibility: e.target.value })
                    }
                    placeholder="Responsible Person"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="date"
                    value={action.targetDate.toISOString().slice(0, 10)}
                    onChange={(e) =>
                      updateCorrectiveAction(action.id, { targetDate: new Date(e.target.value) })
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <select
                    value={action.status}
                    onChange={(e) =>
                      updateCorrectiveAction(action.id, { status: e.target.value as any })
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* OSHA Classification */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              OSHA Information
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="oshaRecordable"
                checked={formData.oshaRecordable}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, oshaRecordable: e.target.checked }))
                }
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label
                htmlFor="oshaRecordable"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                This is an OSHA Recordable Incident
              </label>
            </div>

            {formData.oshaRecordable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  OSHA Classification
                </label>
                <input
                  type="text"
                  value={formData.oshaClassification}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, oshaClassification: e.target.value }))
                  }
                  placeholder="e.g., OSHA 1904.7(b)(5)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Cost Information */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cost Impact (Optional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medical Costs ($)
                </label>
                <input
                  type="number"
                  value={formData.medicalCosts || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      medicalCosts: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Property Costs ($)
                </label>
                <input
                  type="number"
                  value={formData.propertyCosts || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      propertyCosts: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Productivity Costs ($)
                </label>
                <input
                  type="number"
                  value={formData.productivityCosts || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      productivityCosts: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  {initialData ? 'Update Incident' : 'Report Incident'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

