import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import {
  FileText,
  Plus,
  Edit,
  Eye,
  Copy,
  Trash2,
  Download,
  Upload,
  Zap,
  Settings,
  Tag,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  BookOpen,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Star,
  Share,
  Lock,
  Unlock,
} from 'lucide-react';

import {
  DocumentTemplate,
  DocumentCategory,
  TemplateCategory,
  TemplateVariable,
  IntelligentDocument,
} from '@/types';

import { smartTemplatesEngine } from '@/api/smartTemplatesEngine';
import { intelligentDocumentService } from '@/api/intelligentDocumentService';

interface TemplateManagerProps {
  projectId?: string;
  onTemplateSelect?: (template: DocumentTemplate) => void;
  onDocumentGenerated?: (document: IntelligentDocument) => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: DocumentCategory;
  content: string;
  variables: TemplateVariable[];
  isPublic: boolean;
  tags: string[];
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  projectId,
  onTemplateSelect,
  onDocumentGenerated,
}) => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'updated' | 'usage'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'other',
    content: '',
    variables: [],
    isPublic: false,
    tags: [],
  });
  const [generateData, setGenerateData] = useState<Record<string, any>>({});

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter and sort templates
  useEffect(() => {
    filterAndSortTemplates();
  }, [templates, searchQuery, categoryFilter, sortBy, sortOrder]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const allTemplates = smartTemplatesEngine.listTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortTemplates = () => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((template) => template.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'updated':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'usage':
          aValue = a.usageCount || 0;
          bValue = b.usageCount || 0;
          break;
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTemplates(filtered);
  };

  // Handle template creation
  const handleCreateTemplate = async () => {
    setIsLoading(true);
    try {
      const newTemplate = smartTemplatesEngine.createTemplate({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        version: '1.0.0',
        structure: {
          sections: [],
          styling: {
            fontFamily: 'Arial',
            fontSize: 12,
            lineHeight: 1.5,
            margins: { top: 20, right: 20, bottom: 20, left: 20 },
            colors: {
              primary: '#000000',
              secondary: '#666666',
              text: '#000000',
              background: '#ffffff',
            },
            spacing: { section: 10, paragraph: 5 },
          },
        },
        dataMapping: [],
        outputFormat: 'pdf',
        content: formData.content,
        variables: formData.variables,
        createdBy: 'current_user', // In production, get from auth context
        tags: formData.tags,
        isPublic: formData.isPublic,
        isActive: true,
        metadata: {
          industry: 'construction',
          regulatory: [],
          language: 'en',
          region: 'global',
          usageCount: 0,
        },
      });

      await loadTemplates();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template update
  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    setIsLoading(true);
    try {
      smartTemplatesEngine.updateTemplate(selectedTemplate.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        content: formData.content,
        variables: formData.variables,
        tags: formData.tags,
      });

      await loadTemplates();
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('Failed to update template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document generation
  const handleGenerateDocument = async () => {
    if (!selectedTemplate) return;

    setIsLoading(true);
    try {
      const document = await intelligentDocumentService.autoGenerateDocument(
        selectedTemplate.id,
        generateData,
        projectId || 'default',
        'current_user'
      );

      if (onDocumentGenerated) {
        onDocumentGenerated(document);
      }

      setShowGenerateModal(false);
      setGenerateData({});
    } catch (error) {
      console.error('Failed to generate document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setIsLoading(true);
    try {
      await smartTemplatesEngine.deleteTemplate(templateId);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'other',
      content: '',
      variables: [],
      isPublic: false,
      tags: [],
    });
    setSelectedTemplate(null);
  };

  // Populate form with template data
  const populateForm = (template: DocumentTemplate) => {
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      variables: template.variables,
      isPublic: template.isPublic,
      tags: template.tags,
    });
  };

  // Get template icon
  const getTemplateIcon = (category: DocumentCategory) => {
    const icons = {
      contract: <FileText className="w-5 h-5 text-red-500" />,
      specification: <BookOpen className="w-5 h-5 text-blue-500" />,
      drawing: <FileImage className="w-5 h-5 text-green-500" />,
      report: <FileSpreadsheet className="w-5 h-5 text-yellow-500" />,
      permit: <FileCode className="w-5 h-5 text-purple-500" />,
      invoice: <FileSpreadsheet className="w-5 h-5 text-orange-500" />,
      certificate: <Star className="w-5 h-5 text-teal-500" />,
      correspondence: <FileText className="w-5 h-5 text-pink-500" />,
      procedure: <BookOpen className="w-5 h-5 text-indigo-500" />,
      policy: <FileCode className="w-5 h-5 text-gray-500" />,
      other: <FileText className="w-5 h-5 text-gray-500" />,
    };
    return icons[category] || icons.other;
  };

  // Get category color
  const getCategoryColor = (category: DocumentCategory) => {
    const colors = {
      contract: 'bg-red-100 text-red-800',
      specification: 'bg-blue-100 text-blue-800',
      drawing: 'bg-green-100 text-green-800',
      report: 'bg-yellow-100 text-yellow-800',
      permit: 'bg-purple-100 text-purple-800',
      invoice: 'bg-orange-100 text-orange-800',
      certificate: 'bg-teal-100 text-teal-800',
      correspondence: 'bg-pink-100 text-pink-800',
      procedure: 'bg-indigo-100 text-indigo-800',
      policy: 'bg-gray-100 text-gray-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[category] || colors.other;
  };

  // Add variable to form
  const addVariable = () => {
    setFormData((prev) => ({
      ...prev,
      variables: [
        ...prev.variables,
        {
          name: '',
          type: 'text',
          description: '',
          required: true,
          defaultValue: '',
        },
      ],
    }));
  };

  // Remove variable from form
  const removeVariable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }));
  };

  // Update variable
  const updateVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.map((variable, i) =>
        i === index ? { ...variable, [field]: value } : variable
      ),
    }));
  };

  // Render filters
  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      {/* Search */}
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Filter */}
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value as TemplateCategory | 'all')}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Categories</option>
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
        <option value="other">Other</option>
      </select>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="updated">Last Updated</option>
        <option value="name">Name</option>
        <option value="category">Category</option>
        <option value="usage">Usage Count</option>
      </select>

      <Button variant="outline" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
        {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
      </Button>

      <Button variant="outline" onClick={loadTemplates} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );

  // Render template card
  const renderTemplateCard = (template: DocumentTemplate) => (
    <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getTemplateIcon(template.category)}
            <div>
              <CardTitle className="text-base font-medium">{template.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {template.isPublic ? (
              <Unlock className="w-4 h-4 text-green-500" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}
          >
            {template.category}
          </span>
          <span className="text-xs text-gray-500">{template.usageCount || 0} uses</span>
        </div>

        {/* Variables */}
        {template.variables.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">{template.variables.length} variables</div>
            <div className="flex flex-wrap gap-1">
              {template.variables.slice(0, 3).map((variable, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                  {variable.name}
                </span>
              ))}
              {template.variables.length > 3 && (
                <span className="text-xs text-gray-500">+{template.variables.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-xs text-blue-700"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {template.tags.length > 2 && (
                <span className="text-xs text-gray-500">+{template.tags.length - 2}</span>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTemplate(template);
                setShowGenerateModal(true);
              }}
            >
              <Zap className="w-4 h-4 mr-1" />
              Generate
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTemplate(template);
                setShowPreviewModal(true);
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTemplate(template);
                populateForm(template);
                setShowEditModal(true);
              }}
            >
              <Edit className="w-3 h-3" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTemplate(template.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Updated {new Date(template.updatedAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Manager</h1>
            <p className="text-gray-600 mt-2">
              Create, manage, and generate documents from smart templates
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Filters */}
        {renderFilters()}

        {/* Template Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map(renderTemplateCard)}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first template'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Template
              </Button>
            )}
          </div>
        )}

        {/* Create/Edit Template Modal */}
        <Modal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            resetForm();
          }}
          title={showCreateModal ? 'Create New Template' : 'Edit Template'}
        >
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value as DocumentCategory,
                    }))
                  }
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
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what this template is used for"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={12}
                placeholder="Enter template content with variables like {{variable_name}}"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use double curly braces for variables: {'{{variable_name}}'}
              </p>
            </div>

            {/* Variables */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Template Variables
                </label>
                <Button size="sm" variant="outline" onClick={addVariable}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Variable
                </Button>
              </div>

              <div className="space-y-3">
                {formData.variables.map((variable, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Variable name"
                        value={variable.name}
                        onChange={(e) => updateVariable(index, 'name', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />

                      <select
                        value={variable.type}
                        onChange={(e) => updateVariable(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Boolean</option>
                        <option value="select">Select</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Default value"
                        value={variable.defaultValue}
                        onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="flex items-center space-x-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={variable.required}
                            onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                            className="mr-1"
                          />
                          Required
                        </label>
                        <Button size="sm" variant="outline" onClick={() => removeVariable(index)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Description"
                      value={variable.description}
                      onChange={(e) => updateVariable(index, 'description', e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tags: e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="template, document, construction"
              />
            </div>

            {/* Options */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  className="mr-2"
                />
                Make this template public
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={showCreateModal ? handleCreateTemplate : handleUpdateTemplate}
                disabled={isLoading || !formData.name || !formData.content}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {showCreateModal ? 'Create Template' : 'Update Template'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Generate Document Modal */}
        <Modal
          isOpen={showGenerateModal}
          onClose={() => {
            setShowGenerateModal(false);
            setGenerateData({});
          }}
          title={`Generate Document: ${selectedTemplate?.name}`}
        >
          <div className="p-6">
            {selectedTemplate && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>

                {selectedTemplate.variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {variable.name}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {variable.type === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={generateData[variable.name] || false}
                        onChange={(e) =>
                          setGenerateData((prev) => ({
                            ...prev,
                            [variable.name]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    ) : variable.type === 'date' ? (
                      <input
                        type="date"
                        value={generateData[variable.name] || variable.defaultValue || ''}
                        onChange={(e) =>
                          setGenerateData((prev) => ({
                            ...prev,
                            [variable.name]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : variable.type === 'number' ? (
                      <input
                        type="number"
                        value={generateData[variable.name] || variable.defaultValue || ''}
                        onChange={(e) =>
                          setGenerateData((prev) => ({
                            ...prev,
                            [variable.name]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={generateData[variable.name] || variable.defaultValue || ''}
                        onChange={(e) =>
                          setGenerateData((prev) => ({
                            ...prev,
                            [variable.name]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={variable.description}
                      />
                    )}

                    {variable.description && (
                      <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowGenerateModal(false);
                      setGenerateData({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateDocument} disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Generate Document
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Preview Modal */}
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={`Template Preview: ${selectedTemplate?.name}`}
        >
          <div className="p-6">
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {selectedTemplate.content}
                  </pre>
                </div>

                {selectedTemplate.variables.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Variables:</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable.name} className="text-sm">
                          <span className="font-medium">{variable.name}</span>
                          <span className="text-gray-500 ml-2">({variable.type})</span>
                          {variable.required && <span className="text-red-500 ml-1">*</span>}
                          {variable.description && (
                            <div className="text-gray-600 text-xs">{variable.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default TemplateManager;
