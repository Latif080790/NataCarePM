import React, { useState, useEffect, useCallback } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import {
  FileText,
  Upload,
  Search,
  Eye,
  Edit,
  Share,
  GitBranch,
  History,
  Brain,
  CheckCircle,
  Clock,
  Tag,
  Archive,
  RefreshCw,
  PenTool as Signature,
  Lock,
} from 'lucide-react';

import {
  IntelligentDocument,
  DocumentCategory,
  DocumentStatus,
  DocumentTemplate,
  AIInsight,
} from '@/types';

import { intelligentDocumentService } from '@/api/intelligentDocumentService';
import { smartTemplatesEngine } from '@/api/smartTemplatesEngine';
import { sanitizeBasic } from '@/utils/sanitizer';

interface IntelligentDocumentSystemProps {
  projectId?: string;
}

export const IntelligentDocumentSystem: React.FC<IntelligentDocumentSystemProps> = ({
  projectId,
}) => {
  // State management
  const [documents, setDocuments] = useState<IntelligentDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<IntelligentDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<IntelligentDocument | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  // Removed unused showSignatureModal state
  const [activeView, setActiveView] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [refreshKey, setRefreshKey] = useState(0);

  // Load documents and templates
  useEffect(() => {
    loadDocuments();
    loadTemplates();
  }, [projectId, refreshKey]);

  // Filter documents based on search and filters
  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, categoryFilter, statusFilter]);

  // Load documents
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      let docs: IntelligentDocument[];
      if (projectId) {
        docs = await intelligentDocumentService.getDocumentsByProject(projectId);
      } else {
        docs = await intelligentDocumentService.listAllDocuments();
      }
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const allTemplates = smartTemplatesEngine.listTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, []);

  // Filter documents
  const filterDocuments = useCallback(() => {
    let filtered = [...documents];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.searchableContent.toLowerCase().includes(query) ||
          doc.keywords.some((keyword) => keyword.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
    }

    // Sort by updated date (newest first)
    filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, categoryFilter, statusFilter]);

  // Handle file upload
  const handleFileUpload = async (files: FileList | null, templateId?: string) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    try {
      const file = files[0];
      await intelligentDocumentService.createDocument(
        file.name.split('.')[0], // Remove extension for title
        `Uploaded document: ${file.name}`,
        'other', // Default category, can be changed later
        projectId || 'default',
        'current_user', // In production, get from auth context
        file,
        templateId
      );

      await loadDocuments();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template generation
  const handleTemplateGeneration = async (templateId: string, data: any) => {
    setIsLoading(true);
    try {
      await intelligentDocumentService.autoGenerateDocument(
        templateId,
        data,
        projectId || 'default',
        'current_user'
      );

      await loadDocuments();
      setShowTemplateModal(false);
    } catch (error) {
      console.error('Template generation failed:', error);
      alert('Failed to generate document from template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Removed unused handleDocumentSigning function

  // Get status icon
  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />;
      case 'in_review':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'pending_approval':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'published':
        return <Share className="w-4 h-4 text-purple-500" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-gray-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get category color - handles both DocumentCategory and TemplateCategory
  const getCategoryColor = (category: DocumentCategory | string) => {
    const colors: { [key: string]: string } = {
      // DocumentCategory values
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
      // TemplateCategory values
      progress_report: 'bg-blue-100 text-blue-800',
      financial_report: 'bg-green-100 text-green-800',
      safety_report: 'bg-red-100 text-red-800',
      quality_report: 'bg-purple-100 text-purple-800',
      material_report: 'bg-orange-100 text-orange-800',
      compliance_report: 'bg-teal-100 text-teal-800',
      contract_document: 'bg-red-100 text-red-800',
      inspection_report: 'bg-yellow-100 text-yellow-800',
      custom: 'bg-gray-100 text-gray-800',
    };
    return colors[category as string] || colors.other;
  };

  // Get AI insights summary
  const getAIInsightsSummary = (insights: AIInsight[]) => {
    const critical = insights.filter((i) => i.priority === 'critical').length;
    const high = insights.filter((i) => i.priority === 'high').length;
    const medium = insights.filter((i) => i.priority === 'medium').length;

    return { critical, high, medium, total: insights.length };
  };

  // Render document card
  const renderDocumentCard = (document: IntelligentDocument) => {
    const insightsSummary = getAIInsightsSummary(document.aiInsights);
    const hasSignatures = document.signatures.length > 0;
    const requiresSignature = document.requiresSignature && !hasSignatures;

    return (
      <Card key={document.id} className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-sm font-medium truncate">{document.title}</CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              {getStatusIcon(document.status)}
              {requiresSignature && <Signature className="w-4 h-4 text-red-500" />}
              {document.encryptionStatus.isEncrypted && <Lock className="w-4 h-4 text-green-500" />}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}
            >
              {document.category}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(document.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {document.description && (
            <div
              className="text-sm text-gray-600 mb-3 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: sanitizeBasic(document.description) }}
            />
          )}

          {/* AI Insights Summary */}
          {insightsSummary.total > 0 && (
            <div className="flex items-center space-x-2 mb-3">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-600">
                {insightsSummary.critical > 0 && (
                  <span className="text-red-600 font-medium">
                    {insightsSummary.critical} Critical
                  </span>
                )}
                {insightsSummary.high > 0 && (
                  <span className="text-orange-600 font-medium ml-1">
                    {insightsSummary.high} High
                  </span>
                )}
                {insightsSummary.medium > 0 && (
                  <span className="text-yellow-600 font-medium ml-1">
                    {insightsSummary.medium} Medium
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Tags */}
          {document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {document.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {document.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{document.tags.length - 3} more</span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDocument(document);
                  setShowDocumentViewer(true);
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>

              {document.allVersions.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show version history
                  }}
                >
                  <History className="w-4 h-4 mr-1" />
                  History
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {hasSignatures && (
                <div className="flex items-center">
                  <Signature className="w-3 h-3 mr-1 text-green-500" />
                  {document.signatures.length}
                </div>
              )}
              {document.allVersions.length > 1 && (
                <div className="flex items-center">
                  <GitBranch className="w-3 h-3 mr-1" />v{document.allVersions[0]?.versionNumber}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Filter */}
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | 'all')}
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

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Status</option>
        <option value="draft">Draft</option>
        <option value="in_review">In Review</option>
        <option value="pending_approval">Pending Approval</option>
        <option value="approved">Approved</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>

      {/* View Toggle */}
      <div className="flex items-center border border-gray-300 rounded-lg">
        <button
          onClick={() => setActiveView('grid')}
          className={`px-3 py-2 ${activeView === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
        >
          Grid
        </button>
        <button
          onClick={() => setActiveView('list')}
          className={`px-3 py-2 ${activeView === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
        >
          List
        </button>
        <button
          onClick={() => setActiveView('timeline')}
          className={`px-3 py-2 ${activeView === 'timeline' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
        >
          Timeline
        </button>
      </div>

      {/* Refresh */}
      <Button
        variant="outline"
        onClick={() => setRefreshKey((prev) => prev + 1)}
        disabled={isLoading}
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );

  // Render action buttons
  const renderActionButtons = () => (
    <div className="flex items-center space-x-3 mb-6">
      <Button onClick={() => setShowUploadModal(true)} className="bg-blue-600 hover:bg-blue-700">
        <Upload className="w-4 h-4 mr-2" />
        Upload Document
      </Button>

      <Button onClick={() => setShowTemplateModal(true)} variant="outline">
        <FileText className="w-4 h-4 mr-2" />
        Generate from Template
      </Button>

      <Button
        onClick={() => console.log('Signature feature coming soon')}
        variant="outline"
        disabled
      >
        <Signature className="w-4 h-4 mr-2" />
        Request Signatures
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Intelligent Document System</h1>
            <p className="text-gray-600 mt-2">
              AI-powered document management with OCR, smart templates, digital signatures, and
              version control
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{filteredDocuments.length}</div>
            <div className="text-sm text-gray-500">Documents</div>
          </div>
        </div>

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Filters */}
        {renderFilters()}

        {/* Document Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocuments.map(renderDocumentCard)}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Get started by uploading your first document'}
            </p>
            {!searchQuery && categoryFilter === 'all' && statusFilter === 'all' && (
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload First Document
              </Button>
            )}
          </div>
        )}

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Document"
        >
          <div className="p-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
              <input
                type="file"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                Choose Files
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TIFF (Max: 50MB)
            </p>
          </div>
        </Modal>

        {/* Template Modal */}
        <Modal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          title="Generate from Template"
        >
          <div className="p-6">
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}
                      >
                        {template.category}
                      </span>
                      <Button size="sm" onClick={() => handleTemplateGeneration(template.id, {})}>
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Modal>

        {/* Document Viewer Modal */}
        {selectedDocument && (
          <Modal
            isOpen={showDocumentViewer}
            onClose={() => setShowDocumentViewer(false)}
            title={selectedDocument.title}
            size="xl"
          >
            <div className="p-6">
              {/* Document details and viewer component would go here */}
              <p className="text-gray-600">Document viewer implementation...</p>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default IntelligentDocumentSystem;
