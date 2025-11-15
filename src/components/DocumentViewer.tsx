import React, { useState } from 'react';

import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { DigitalSignature } from '@/types';
import {
    AlertTriangle,
    Brain,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    Download,
    Edit,
    ExternalLink,
    FileText,
    FileX,
    GitBranch,
    History,
    Info,
    Lock,
    Share,
    Shield,
    Tag,
    Target,
    TrendingUp,
    Unlock,
    Users,
    Zap
} from 'lucide-react';

import { AIInsight, IntelligentDocument } from '@/types';

import { intelligentDocumentService } from '@/api/intelligentDocumentService';

interface DocumentViewerProps {
  document: IntelligentDocument;
  onDocumentUpdate?: (document: IntelligentDocument) => void;
  onClose?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onDocumentUpdate,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'content' | 'insights' | 'versions' | 'signatures' | 'compliance'
  >('content');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Toggle insight expansion
  const toggleInsightExpansion = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  // Get insight icon and color
  const getInsightIcon = (type: AIInsight['type'], priority: AIInsight['priority']) => {
    const icons = {
      summary: <FileText className="w-4 h-4" />,
      risk_analysis: <AlertTriangle className="w-4 h-4" />,
      compliance_check: <Shield className="w-4 h-4" />,
      anomaly_detection: <Zap className="w-4 h-4" />,
      recommendation: <TrendingUp className="w-4 h-4" />,
      compliance: <Shield className="w-4 h-4" />,
      risk: <AlertTriangle className="w-4 h-4" />,
      optimization: <TrendingUp className="w-4 h-4" />,
      accuracy: <Target className="w-4 h-4" />,
      dependency: <ExternalLink className="w-4 h-4" />,
      anomaly: <Zap className="w-4 h-4" />,
    };

    const colors = {
      critical: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      low: 'text-blue-600 bg-blue-50 border-blue-200',
    };

    return {
      icon: icons[type] || <Info className="w-4 h-4" />,
      colorClass: colors[priority] || colors.low,
    };
  };

  // Get signature status
  const getSignatureStatus = (signature: DigitalSignature) => {
    const now = new Date();
    if (signature.isRevoked)
      return { status: 'revoked', color: 'text-red-600', icon: <FileX className="w-4 h-4" /> };
    if (signature.expiresAt && now > signature.expiresAt)
      return { status: 'expired', color: 'text-gray-600', icon: <Clock className="w-4 h-4" /> };
    if (signature.isValid)
      return {
        status: 'valid',
        color: 'text-green-600',
        icon: <CheckCircle className="w-4 h-4" />,
      };
    return {
      status: 'invalid',
      color: 'text-red-600',
      icon: <AlertTriangle className="w-4 h-4" />,
    };
  };

  // Handle document encryption
  const handleEncryption = async (encrypt: boolean) => {
    setIsLoading(true);
    try {
      // Note: Encryption/decryption methods not implemented yet
      console.log(encrypt ? 'Encrypting document' : 'Decrypting document');
      // Refresh document
      const updated = await intelligentDocumentService.getDocument(document.id);
      if (updated && onDocumentUpdate) {
        onDocumentUpdate(updated);
      }
      setShowEncryptionModal(false);
    } catch (error) {
      console.error('Encryption operation failed:', error);
      alert('Encryption operation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signature request
  const handleSignatureRequest = async (signers: string[]) => {
    setIsLoading(true);
    try {
      await intelligentDocumentService.initiateSignatureWorkflow(
        document.id,
        signers,
        true, // Sequential
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        'current_user'
      );
      // Refresh document
      const updated = await intelligentDocumentService.getDocument(document.id);
      if (updated && onDocumentUpdate) {
        onDocumentUpdate(updated);
      }
      setShowSignatureModal(false);
    } catch (error) {
      console.error('Signature request failed:', error);
      alert('Signature request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render document header
  const renderDocumentHeader = () => (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{document.title}</h1>
          {document.description && <p className="text-gray-600 mb-4">{document.description}</p>}

          {/* Document metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Updated {new Date(document.updatedAt).toLocaleString()}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {document.collaborators?.length || 0} collaborators
            </div>
            <div className="flex items-center">
              <GitBranch className="w-4 h-4 mr-1" />
              Version {document.allVersions[0]?.versionNumber || '1.0.0'}
            </div>
            {document.encryptionStatus.isEncrypted && (
              <div className="flex items-center text-green-600">
                <Lock className="w-4 h-4 mr-1" />
                Encrypted
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 ml-6">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEncryptionModal(true)}>
            {document.encryptionStatus.isEncrypted ? (
              <Unlock className="w-4 h-4 mr-1" />
            ) : (
              <Lock className="w-4 h-4 mr-1" />
            )}
            {document.encryptionStatus.isEncrypted ? 'Decrypt' : 'Encrypt'}
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Tags */}
      {document.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {document.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // Render tabs
  const renderTabs = () => (
    <div className="bg-white border-b border-gray-200">
      <div className="flex space-x-8 px-6">
        {[
          { id: 'content', label: 'Content', icon: <FileText className="w-4 h-4" /> },
          {
            id: 'insights',
            label: `AI Insights (${document.aiInsights.length})`,
            icon: <Brain className="w-4 h-4" />,
          },
          {
            id: 'versions',
            label: `Versions (${document.allVersions.length})`,
            icon: <History className="w-4 h-4" />,
          },
          {
            id: 'signatures',
            label: `Signatures (${document.signatures.length})`,
            icon: <Signature className="w-4 h-4" />,
          },
          { id: 'compliance', label: 'Compliance', icon: <Shield className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Render content tab
  const renderContentTab = () => (
    <div className="p-6">
      <Card>
        <CardContent className="p-6">
          {/* OCR Results */}
          {document.ocrResults && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Extracted Content</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {document.ocrResults?.[0]?.extractedText}
                </pre>
              </div>
            </div>
          )}

          {/* Structured Data */}
          {document.ocrResults?.[0]?.structuredData &&
            Object.keys(document.ocrResults[0].structuredData).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Structured Data</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(document.ocrResults[0].structuredData).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">{key}</div>
                      <div className="text-sm text-gray-900">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* File Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">File Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">File Size</div>
                <div className="text-sm text-gray-900">
                  {document.fileSize ? `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">MIME Type</div>
                <div className="text-sm text-gray-900">{document.mimeType || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Checksum</div>
                <div className="text-sm text-gray-900 font-mono">{document.checksum}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Language</div>
                <div className="text-sm text-gray-900">{document.language || 'Auto-detected'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render insights tab
  const renderInsightsTab = () => (
    <div className="p-6">
      <div className="space-y-4">
        {document.aiInsights.map((insight) => {
          const { icon, colorClass } = getInsightIcon(insight.type, insight.priority);
          const isExpanded = expandedInsights.has(insight.id);

          return (
            <Card key={insight.id} className={`border-l-4 ${colorClass}`}>
              <CardContent className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleInsightExpansion(insight.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="capitalize">{insight.type}</span>
                        <span>•</span>
                        <span className="capitalize font-medium">{insight.priority}</span>
                        <span>•</span>
                        <span>{(insight.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-700 mb-4">{insight.description}</p>

                    {insight.recommendations && insight.recommendations.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Recommendations</h5>
                        <ul className="space-y-1">
                          {insight.recommendations?.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insight.affectedSections && insight.affectedSections.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Affected Sections</h5>
                        <div className="flex flex-wrap gap-2">
                          {insight.affectedSections?.map((section, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                            >
                              {section}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Generated on{' '}
                      {insight.generatedAt
                        ? new Date(insight.generatedAt).toLocaleString()
                        : 'Unknown'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {document.aiInsights.length === 0 && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI insights available</h3>
            <p className="text-gray-500">
              AI analysis will appear here once the document is processed.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Render versions tab
  const renderVersionsTab = () => (
    <div className="p-6">
      <div className="space-y-4">
        {document.allVersions.map((version, index) => (
          <Card key={version.id} className={index === 0 ? 'border-blue-200 bg-blue-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    v{version.versionNumber}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Version {version.versionNumber}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">(Current)</span>
                      )}
                    </h4>
                    <div className="text-sm text-gray-500">{version.comment || 'No comment'}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-900">{version.createdBy}</div>
                  <div className="text-xs text-gray-500">
                    {version.createdAt ? new Date(version.createdAt).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              </div>

              {version.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {version.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Render signatures tab
  const renderSignaturesTab = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Digital Signatures</h3>
        <Button onClick={() => setShowSignatureModal(true)}>
          <Signature className="w-4 h-4 mr-2" />
          Request Signature
        </Button>
      </div>

      <div className="space-y-4">
        {document.signatures.map((signature) => {
          const status = getSignatureStatus(signature);

          return (
            <Card key={signature.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${status.color} bg-opacity-10`}>
                      {status.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{signature.signerName}</h4>
                      <div className="text-sm text-gray-500">{signature.signerEmail}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-medium ${status.color}`}>
                      {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {signature.signedAt
                        ? new Date(signature.signedAt).toLocaleString()
                        : 'Pending'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Standard:</span> {signature.standard}
                  </div>
                  <div>
                    <span className="font-medium">Method:</span> {signature.signatureMethod}
                  </div>
                  <div>
                    <span className="font-medium">Certificate:</span> {signature.certificateId}
                  </div>
                  <div>
                    <span className="font-medium">Algorithm:</span> {signature.algorithm}
                  </div>
                </div>

                {signature.reason && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    <span className="font-medium">Reason:</span> {signature.reason}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {document.signatures.length === 0 && (
          <div className="text-center py-8">
            <Signature className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No signatures</h3>
            <p className="text-gray-500 mb-4">This document has not been digitally signed yet.</p>
            <Button onClick={() => setShowSignatureModal(true)}>Request Signature</Button>
          </div>
        )}
      </div>
    </div>
  );

  // Render compliance tab
  const renderComplianceTab = () => (
    <div className="p-6">
      <div className="space-y-6">
        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-800 font-medium">Document Integrity</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-800 font-medium">Access Control</span>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-800 font-medium">Retention Policy</span>
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-800 font-medium">Audit Trail</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {document.auditTrail.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{entry.action}</div>
                    <div className="text-sm text-gray-500">by {entry.userId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderDocumentHeader()}
      {renderTabs()}

      <div className="bg-white min-h-screen">
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'insights' && renderInsightsTab()}
        {activeTab === 'versions' && renderVersionsTab()}
        {activeTab === 'signatures' && renderSignaturesTab()}
        {activeTab === 'compliance' && renderComplianceTab()}
      </div>
    </div>
  );
};

export default DocumentViewer;

