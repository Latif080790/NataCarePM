import React, { useState, useEffect, useCallback } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { 
    Signature, 
    Users, 
    Clock, 
    CheckCircle, 
    AlertTriangle,
    Send,
    Eye,
    Download,
    RefreshCw,
    Calendar,
    Mail,
    User,
    FileText,
    Shield,
    Plus,
    X,
    Info,
    ChevronRight,
    ChevronDown,
    Zap,
    History,
    AlertCircle
} from 'lucide-react';

import { 
    DigitalSignature, 
    SignatureWorkflow, 
    IntelligentDocument,
    SignatureStandard,
    SignatureMethod
} from '@/types';

import { digitalSignaturesService } from '@/api/digitalSignaturesService';
import { intelligentDocumentService } from '@/api/intelligentDocumentService';

interface SignatureWorkflowManagerProps {
    documentId?: string;
    onWorkflowComplete?: (workflow: SignatureWorkflow) => void;
}

interface SignerData {
    name: string;
    email: string;
    role?: string;
    order: number;
    required: boolean;
}

export const SignatureWorkflowManager: React.FC<SignatureWorkflowManagerProps> = ({ 
    documentId, 
    onWorkflowComplete 
}) => {
    const [workflows, setWorkflows] = useState<SignatureWorkflow[]>([]);
    const [documents, setDocuments] = useState<IntelligentDocument[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<SignatureWorkflow | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<IntelligentDocument | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());

    // Form state for creating workflows
    const [workflowTitle, setWorkflowTitle] = useState('');
    const [workflowDescription, setWorkflowDescription] = useState('');
    const [selectedDocumentId, setSelectedDocumentId] = useState(documentId || '');
    const [signers, setSigners] = useState<SignerData[]>([]);
    const [deadline, setDeadline] = useState('');
    const [sequentialSigning, setSequentialSigning] = useState(true);
    const [reminderInterval, setReminderInterval] = useState(24); // hours
    const [allowDelegation, setAllowDelegation] = useState(false);
    const [requireReason, setRequireReason] = useState(false);

    // Load data
    useEffect(() => {
        loadWorkflows();
        loadDocuments();
    }, [documentId]);

    const loadWorkflows = async () => {
        setIsLoading(true);
        try {
            const allWorkflows = digitalSignaturesService.getWorkflows();
            const filteredWorkflows = documentId 
                ? allWorkflows.filter(w => w.documentId === documentId)
                : allWorkflows;
            setWorkflows(filteredWorkflows);
        } catch (error) {
            console.error('Failed to load workflows:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadDocuments = async () => {
        try {
            const allDocs = await intelligentDocumentService.listAllDocuments();
            setDocuments(allDocs);
            
            if (documentId) {
                const doc = allDocs.find(d => d.id === documentId);
                setSelectedDocument(doc || null);
            }
        } catch (error) {
            console.error('Failed to load documents:', error);
        }
    };

    // Handle workflow creation
    const handleCreateWorkflow = async () => {
        if (!selectedDocumentId || signers.length === 0) {
            alert('Please select a document and add at least one signer');
            return;
        }

        setIsLoading(true);
        try {
            const signerEmails = signers.map(s => s.email);
            const deadlineDate = deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await intelligentDocumentService.initiateSignatureWorkflow(
                selectedDocumentId,
                signerEmails,
                sequentialSigning,
                deadlineDate,
                'current_user' // In production, get from auth context
            );

            await loadWorkflows();
            setShowCreateModal(false);
            resetForm();

            if (onWorkflowComplete) {
                onWorkflowComplete(null);
            }
        } catch (error) {
            console.error('Failed to create workflow:', error);
            alert('Failed to create signature workflow. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle workflow actions
    const handleCancelWorkflow = async (workflowId: string) => {
        if (!confirm('Are you sure you want to cancel this workflow?')) return;

        setIsLoading(true);
        try {
            await digitalSignaturesService.cancelWorkflow(workflowId);
            await loadWorkflows();
        } catch (error) {
            console.error('Failed to cancel workflow:', error);
            alert('Failed to cancel workflow. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendReminder = async (workflowId: string, signerEmail?: string) => {
        setIsLoading(true);
        try {
            await digitalSignaturesService.sendReminder(workflowId, signerEmail);
            alert('Reminder sent successfully');
        } catch (error) {
            console.error('Failed to send reminder:', error);
            alert('Failed to send reminder. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Form helpers
    const resetForm = () => {
        setWorkflowTitle('');
        setWorkflowDescription('');
        setSelectedDocumentId(documentId || '');
        setSigners([]);
        setDeadline('');
        setSequentialSigning(true);
        setReminderInterval(24);
        setAllowDelegation(false);
        setRequireReason(false);
    };

    const addSigner = () => {
        setSigners(prev => [...prev, {
            name: '',
            email: '',
            role: '',
            order: prev.length + 1,
            required: true
        }]);
    };

    const updateSigner = (index: number, field: keyof SignerData, value: any) => {
        setSigners(prev => prev.map((signer, i) =>
            i === index ? { ...signer, [field]: value } : signer
        ));
    };

    const removeSigner = (index: number) => {
        setSigners(prev => prev.filter((_, i) => i !== index).map((signer, i) => ({
            ...signer,
            order: i + 1
        })));
    };

    const toggleWorkflowExpansion = (workflowId: string) => {
        const newExpanded = new Set(expandedWorkflows);
        if (newExpanded.has(workflowId)) {
            newExpanded.delete(workflowId);
        } else {
            newExpanded.add(workflowId);
        }
        setExpandedWorkflows(newExpanded);
    };

    // Get workflow status
    const getWorkflowStatus = (workflow: SignatureWorkflow) => {
        if (workflow.isCancelled) return { status: 'cancelled', color: 'text-red-600', icon: <X className="w-4 h-4" /> };
        if (workflow.isCompleted) return { status: 'completed', color: 'text-green-600', icon: <CheckCircle className="w-4 h-4" /> };
        if (new Date() > workflow.deadline) return { status: 'overdue', color: 'text-red-600', icon: <AlertTriangle className="w-4 h-4" /> };
        return { status: 'pending', color: 'text-yellow-600', icon: <Clock className="w-4 h-4" /> };
    };

    // Get signer status
    const getSignerStatus = (signature: DigitalSignature | undefined) => {
        if (!signature) return { status: 'pending', color: 'text-gray-500' };
        if (signature.isRevoked) return { status: 'revoked', color: 'text-red-600' };
        if (signature.isValid) return { status: 'signed', color: 'text-green-600' };
        return { status: 'invalid', color: 'text-red-600' };
    };

    // Render workflow card
    const renderWorkflowCard = (workflow: SignatureWorkflow) => {
        const workflowStatus = getWorkflowStatus(workflow);
        const isExpanded = expandedWorkflows.has(workflow.id);
        const document = documents.find(d => d.id === workflow.documentId);
        const completedSignatures = workflow.requiredSigners.filter(email => 
            workflow.signatures.some(sig => sig.signerEmail === email && sig.isValid)
        ).length;

        return (
            <Card key={workflow.id} className="mb-4">
                <CardContent className="p-4">
                    <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleWorkflowExpansion(workflow.id)}
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${workflowStatus.color} bg-opacity-10`}>
                                {workflowStatus.icon}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">
                                    {workflow.title || `Workflow for ${document?.title || 'Unknown Document'}`}
                                </h4>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span>{completedSignatures}/{workflow.requiredSigners.length} signed</span>
                                    <span>•</span>
                                    <span className="capitalize">{workflowStatus.status}</span>
                                    <span>•</span>
                                    <span>Due {new Date(workflow.deadline).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            {!workflow.isCompleted && !workflow.isCancelled && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendReminder(workflow.id);
                                    }}
                                >
                                    <Mail className="w-4 h-4 mr-1" />
                                    Remind
                                </Button>
                            )}
                            
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWorkflow(workflow);
                                    setShowDetailsModal(true);
                                }}
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                Details
                            </Button>
                            
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            {workflow.description && (
                                <p className="text-gray-600 mb-4">{workflow.description}</p>
                            )}
                            
                            {/* Signers List */}
                            <div className="space-y-2">
                                <h5 className="font-medium text-gray-900">Signers</h5>
                                {workflow.requiredSigners.map((email, index) => {
                                    const signature = workflow.signatures.find(sig => sig.signerEmail === email);
                                    const signerStatus = getSignerStatus(signature);
                                    
                                    return (
                                        <div key={email} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium">{index + 1}.</span>
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm">{email}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-xs font-medium capitalize ${signerStatus.color}`}>
                                                    {signerStatus.status}
                                                </span>
                                                {signature && (
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(signature.signedAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {!signature && !workflow.isCompleted && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSendReminder(workflow.id, email)}
                                                    >
                                                        <Send className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                                <div className="text-xs text-gray-500">
                                    Created by {workflow.createdBy} on {new Date(workflow.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center space-x-2">
                                    {!workflow.isCompleted && !workflow.isCancelled && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCancelWorkflow(workflow.id)}
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Signature Workflows</h1>
                        <p className="text-gray-600 mt-2">
                            Manage digital signature workflows and track signing progress
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Workflow
                    </Button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {workflows.filter(w => !w.isCompleted && !w.isCancelled).length}
                            </div>
                            <div className="text-sm text-gray-500">Active Workflows</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {workflows.filter(w => w.isCompleted).length}
                            </div>
                            <div className="text-sm text-gray-500">Completed</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {workflows.filter(w => new Date() > w.deadline && !w.isCompleted).length}
                            </div>
                            <div className="text-sm text-gray-500">Overdue</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-600">
                                {workflows.reduce((sum, w) => sum + w.signatures.length, 0)}
                            </div>
                            <div className="text-sm text-gray-500">Total Signatures</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Workflows List */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : workflows.length > 0 ? (
                    <div>
                        {workflows.map(renderWorkflowCard)}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Signature className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                        <p className="text-gray-500 mb-6">
                            Create your first signature workflow to get started
                        </p>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Workflow
                        </Button>
                    </div>
                )}

                {/* Create Workflow Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        resetForm();
                    }}
                    title="Create Signature Workflow"
                >
                    <div className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Workflow Title
                                </label>
                                <input
                                    type="text"
                                    value={workflowTitle}
                                    onChange={(e) => setWorkflowTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter workflow title"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Document
                                </label>
                                <select
                                    value={selectedDocumentId}
                                    onChange={(e) => setSelectedDocumentId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a document</option>
                                    {documents.map((doc) => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={workflowDescription}
                                onChange={(e) => setWorkflowDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Describe the purpose of this signature workflow"
                            />
                        </div>

                        {/* Signers */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Signers
                                </label>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={addSigner}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Signer
                                </Button>
                            </div>
                            
                            <div className="space-y-3">
                                {signers.map((signer, index) => (
                                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Full name"
                                                value={signer.name}
                                                onChange={(e) => updateSigner(index, 'name', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            
                                            <input
                                                type="email"
                                                placeholder="Email address"
                                                value={signer.email}
                                                onChange={(e) => updateSigner(index, 'email', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            
                                            <input
                                                type="text"
                                                placeholder="Role/Title"
                                                value={signer.role}
                                                onChange={(e) => updateSigner(index, 'role', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            
                                            <input
                                                type="number"
                                                placeholder="Order"
                                                value={signer.order}
                                                onChange={(e) => updateSigner(index, 'order', parseInt(e.target.value))}
                                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                min="1"
                                            />
                                            
                                            <div className="flex items-center space-x-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={signer.required}
                                                        onChange={(e) => updateSigner(index, 'required', e.target.checked)}
                                                        className="mr-1"
                                                    />
                                                    Required
                                                </label>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => removeSigner(index)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {signers.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No signers added yet</p>
                                        <Button onClick={addSigner} className="mt-2">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add First Signer
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Workflow Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reminder Interval (hours)
                                </label>
                                <input
                                    type="number"
                                    value={reminderInterval}
                                    onChange={(e) => setReminderInterval(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    min="1"
                                    max="168"
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={sequentialSigning}
                                    onChange={(e) => setSequentialSigning(e.target.checked)}
                                    className="mr-2"
                                />
                                Sequential signing (signers must sign in order)
                            </label>
                            
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={allowDelegation}
                                    onChange={(e) => setAllowDelegation(e.target.checked)}
                                    className="mr-2"
                                />
                                Allow delegation to other signers
                            </label>
                            
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={requireReason}
                                    onChange={(e) => setRequireReason(e.target.checked)}
                                    className="mr-2"
                                />
                                Require reason for signing
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateWorkflow}
                                disabled={isLoading || !selectedDocumentId || signers.length === 0}
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4 mr-2" />
                                )}
                                Create Workflow
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Workflow Details Modal */}
                {selectedWorkflow && (
                    <Modal
                        isOpen={showDetailsModal}
                        onClose={() => {
                            setShowDetailsModal(false);
                            setSelectedWorkflow(null);
                        }}
                        title={`Workflow Details: ${selectedWorkflow.title}`}
                    >
                        <div className="p-6">
                            {/* Workflow details content would go here */}
                            <p className="text-gray-600">Detailed workflow information and signature history...</p>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};

export default SignatureWorkflowManager;
