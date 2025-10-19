import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2, ClipboardCheck, Calendar, MapPin, User, FileText, AlertTriangle } from 'lucide-react';
import type { SafetyAudit, AuditType, AuditStatus } from '@/types/safety.types';

type ChecklistItem = SafetyAudit['checklist'][0];
type Finding = SafetyAudit['findings'][0];

interface AuditFormProps {
  projectId: string;
  initialData?: Partial<SafetyAudit>;
  onSubmit: (audit: Omit<SafetyAudit, 'id' | 'auditNumber' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const AuditForm: React.FC<AuditFormProps> = ({
  projectId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  // Form state
  const [formData, setFormData] = useState({
    type: initialData?.type || ('routine' as AuditType),
    status: initialData?.status || ('scheduled' as AuditStatus),
    title: initialData?.title || '',
    description: initialData?.description || '',
    scheduledDate: initialData?.scheduledDate 
      ? initialData.scheduledDate.toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    conductedDate: initialData?.conductedDate
      ? initialData.conductedDate.toISOString().slice(0, 16)
      : '',
    auditor: initialData?.auditor || '',
    auditorCertification: initialData?.auditorCertification || '',
    location: initialData?.location || '',
    followUpRequired: initialData?.followUpRequired || false,
    followUpDate: initialData?.followUpDate
      ? initialData.followUpDate.toISOString().slice(0, 10)
      : '',
    overallRating: initialData?.overallRating || (undefined as SafetyAudit['overallRating']),
    notes: initialData?.notes || '',
  });

  const [scope, setScope] = useState<string[]>(initialData?.scope || []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialData?.checklist || []);
  const [findings, setFindings] = useState<Finding[]>(initialData?.findings || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Scope management
  const [scopeInput, setScopeInput] = useState('');

  const addScopeItem = useCallback(() => {
    if (scopeInput.trim()) {
      setScope(prev => [...prev, scopeInput.trim()]);
      setScopeInput('');
    }
  }, [scopeInput]);

  const removeScopeItem = useCallback((index: number) => {
    setScope(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Checklist management
  const addChecklistItem = useCallback(() => {
    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      category: '',
      item: '',
      requirement: '',
      compliant: false,
      priority: 'minor',
    };
    setChecklist(prev => [...prev, newItem]);
  }, []);

  const updateChecklistItem = useCallback((id: string, updates: Partial<ChecklistItem>) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const removeChecklistItem = useCallback((id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  }, []);

  // Findings management
  const addFinding = useCallback(() => {
    const newFinding: Finding = {
      id: `finding-${Date.now()}`,
      category: '',
      severity: 'minor',
      finding: '',
      recommendation: '',
      status: 'open',
    };
    setFindings(prev => [...prev, newFinding]);
  }, []);

  const updateFinding = useCallback((id: string, updates: Partial<Finding>) => {
    setFindings(prev => prev.map(finding => 
      finding.id === id ? { ...finding, ...updates } : finding
    ));
  }, []);

  const removeFinding = useCallback((id: string) => {
    setFindings(prev => prev.filter(finding => finding.id !== id));
  }, []);

  // Calculate compliance metrics
  const complianceMetrics = useCallback(() => {
    const total = checklist.length;
    const compliant = checklist.filter(item => item.compliant).length;
    const nonCompliant = total - compliant;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
    
    return { total, compliant, nonCompliant, complianceRate };
  }, [checklist]);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.auditor.trim()) newErrors.auditor = 'Auditor is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (scope.length === 0) newErrors.scope = 'At least one scope item is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, scope]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const metrics = complianceMetrics();

    const auditData: Omit<SafetyAudit, 'id' | 'auditNumber' | 'createdAt' | 'updatedAt'> = {
      projectId,
      type: formData.type,
      status: formData.status,
      title: formData.title,
      description: formData.description || undefined,
      scheduledDate: new Date(formData.scheduledDate),
      conductedDate: formData.conductedDate ? new Date(formData.conductedDate) : undefined,
      auditor: formData.auditor,
      auditorCertification: formData.auditorCertification || undefined,
      location: formData.location,
      scope,
      checklist,
      totalItems: metrics.total,
      compliantItems: metrics.compliant,
      nonCompliantItems: metrics.nonCompliant,
      complianceRate: metrics.complianceRate,
      findings,
      followUpRequired: formData.followUpRequired,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate) : undefined,
      overallRating: formData.overallRating,
      photos: [],
      notes: formData.notes || undefined,
    };

    await onSubmit(auditData);
  }, [formData, scope, checklist, findings, projectId, validateForm, complianceMetrics, onSubmit]);

  const metrics = complianceMetrics();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {initialData ? 'Edit Safety Audit' : 'Create New Safety Audit'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Document safety compliance inspection
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
          
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Audit Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AuditType }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="routine">Routine Inspection</option>
                  <option value="spot_check">Spot Check</option>
                  <option value="incident_investigation">Incident Investigation</option>
                  <option value="regulatory">Regulatory Compliance</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as AuditStatus }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="follow_up_required">Follow-up Required</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Audit Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white ${
                  errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Monthly Site Safety Inspection"
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
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder="Audit purpose and overview..."
              />
            </div>

            {/* Auditor, Location, Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Auditor *
                </label>
                <input
                  type="text"
                  value={formData.auditor}
                  onChange={(e) => setFormData(prev => ({ ...prev, auditor: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white ${
                    errors.auditor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Name of auditor"
                  required
                />
                {errors.auditor && <p className="mt-1 text-sm text-red-600">{errors.auditor}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Auditor Certification
                </label>
                <input
                  type="text"
                  value={formData.auditorCertification}
                  onChange={(e) => setFormData(prev => ({ ...prev, auditorCertification: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., OSHA 510, CSP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white ${
                    errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Audit location"
                  required
                />
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Scheduled Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Scope</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scope Items * (Areas or topics to be audited)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scopeInput}
                  onChange={(e) => setScopeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addScopeItem())}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Add scope item (press Enter)"
                />
                <button
                  type="button"
                  onClick={addScopeItem}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {errors.scope && <p className="mt-1 text-sm text-red-600">{errors.scope}</p>}
              
              <div className="flex flex-wrap gap-2 mt-2">
                {scope.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full">
                    <span className="text-sm">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeScopeItem(index)}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Checklist</h3>
              <button
                type="button"
                onClick={addChecklistItem}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {checklist.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700 dark:text-blue-300 font-medium">Compliance Rate</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{metrics.complianceRate}%</p>
                  </div>
                  <div>
                    <p className="text-blue-700 dark:text-blue-300 font-medium">Compliant</p>
                    <p className="text-xl font-semibold text-green-600 dark:text-green-400">{metrics.compliant}/{metrics.total}</p>
                  </div>
                  <div>
                    <p className="text-blue-700 dark:text-blue-300 font-medium">Non-Compliant</p>
                    <p className="text-xl font-semibold text-red-600 dark:text-red-400">{metrics.nonCompliant}</p>
                  </div>
                </div>
              </div>
            )}

            {checklist.map((item) => (
              <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3 border border-gray-200 dark:border-gray-600">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={item.compliant}
                      onChange={(e) => updateChecklistItem(item.id, { compliant: e.target.checked })}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => updateChecklistItem(item.id, { category: e.target.value })}
                        placeholder="Category"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                      />
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => updateChecklistItem(item.id, { item: e.target.value })}
                        placeholder="Item to check"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                      />
                      <select
                        value={item.priority || 'minor'}
                        onChange={(e) => updateChecklistItem(item.id, { priority: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="critical">Critical</option>
                        <option value="major">Major</option>
                        <option value="minor">Minor</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={item.requirement}
                  onChange={(e) => updateChecklistItem(item.id, { requirement: e.target.value })}
                  placeholder="Requirement or standard"
                  rows={1}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            ))}
          </div>

          {/* Findings */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Findings</h3>
              <button
                type="button"
                onClick={addFinding}
                className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Finding
              </button>
            </div>

            {findings.map((finding) => (
              <div key={finding.id} className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg space-y-3 border border-orange-200 dark:border-orange-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={finding.category}
                      onChange={(e) => updateFinding(finding.id, { category: e.target.value })}
                      placeholder="Category"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <select
                      value={finding.severity}
                      onChange={(e) => updateFinding(finding.id, { severity: e.target.value as any })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="critical">Critical</option>
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                    </select>
                    <select
                      value={finding.status}
                      onChange={(e) => updateFinding(finding.id, { status: e.target.value as any })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFinding(finding.id)}
                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={finding.finding}
                  onChange={(e) => updateFinding(finding.id, { finding: e.target.value })}
                  placeholder="Describe the finding..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <textarea
                  value={finding.recommendation}
                  onChange={(e) => updateFinding(finding.id, { recommendation: e.target.value })}
                  placeholder="Recommendation for correction..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            ))}
          </div>

          {/* Overall Rating & Follow-up */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Assessment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Overall Rating
                </label>
                <select
                  value={formData.overallRating || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, overallRating: e.target.value as any || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Not Rated</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="acceptable">Acceptable</option>
                  <option value="poor">Poor</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={formData.followUpRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Follow-up Required
                  </label>
                </div>
                {formData.followUpRequired && (
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder="Additional notes or observations..."
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
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  {initialData ? 'Update Audit' : 'Create Audit'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
