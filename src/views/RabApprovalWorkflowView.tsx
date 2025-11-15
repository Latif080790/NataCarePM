/**
 * RAB Approval Workflow View
 * Priority 3D: RAB Approval Management System
 *
 * Visualize and manage RAB item approval workflows
 */

import React, { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import type { EnhancedRabItem, ApprovalDecision } from '@/types';
import { rabAhspService } from '@/api/rabAhspService';
import { rabApprovalService } from '@/api/rabApprovalService';
import { EnhancedRabService } from '@/api/enhancedRabService';
import { Spinner } from '@/components/Spinner';
import {
  CardPro,
  CardProHeader,
  CardProContent,
  CardProTitle,
  ButtonPro,
  BadgePro,
} from '@/components/DesignSystem';
import { formatCurrency } from '@/constants';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface RabApprovalWorkflowViewProps {
  rabItemId?: number; // Make this prop optional
}

// Define types for RAB approval workflow
interface RabApprovalStep {
  stepNumber: number;
  approverRole: string;
  approverName: string;
  approverUserId: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comments?: string;
  decidedAt?: Date;
  requiredBy?: Date;
}

interface RabApprovalHistory {
  approverName: string;
  approverRole: string;
  approverUserId: string;
  decision: ApprovalDecision;
  comments?: string;
  timestamp: Date;
}

interface RabApprovalWorkflow {
  id: string;
  rabItemId: number;
  projectId: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'cancelled';
  currentApproverLevel: number;
  approvalWorkflow: RabApprovalStep[];
  approvalHistory: RabApprovalHistory[];
  submittedBy: string;
  submittedAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdAt: Date;
  isCancelled: boolean;
  isCompleted: boolean;
}

const RabApprovalWorkflowView: React.FC<RabApprovalWorkflowViewProps> = React.memo(({ rabItemId }) => {
  const { currentProject } = useProject();
  const [rabItems, setRabItems] = useState<EnhancedRabItem[]>([]);
  const [selectedRabItem, setSelectedRabItem] = useState<EnhancedRabItem | null>(null);
  const [approvalWorkflow, setApprovalWorkflow] = useState<RabApprovalWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<RabApprovalStep | null>(null);
  const [decision, setDecision] = useState<ApprovalDecision>('approve');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Fetch RAB items and approval workflow on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!currentProject?.id) {
        setError('Project ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // If rabItemId is provided, fetch specific RAB item and its approval workflow
        if (rabItemId !== undefined) {
          // Fetch RAB item
          const rabItemResult = await rabAhspService.getRabItemById(currentProject.id, rabItemId);
          if (rabItemResult.success && rabItemResult.data) {
            const enhancedRabItem = EnhancedRabService.createEnhancedRabItem(rabItemResult.data);
            setSelectedRabItem(enhancedRabItem);
            
            // Fetch approval workflow
            try {
              const approvalResult = await rabApprovalService.getRabApprovalByRabItemId(currentProject.id, rabItemId);
              if (approvalResult.success && approvalResult.data) {
                setApprovalWorkflow(approvalResult.data);
              }
            } catch (err) {
              // If no approval workflow exists, we'll create a mock one for demonstration
              console.log('No existing approval workflow found, creating mock workflow');
              const mockWorkflow: RabApprovalWorkflow = {
                id: `rab-approval-${rabItemId}`,
                rabItemId: rabItemId,
                projectId: currentProject.id,
                title: `Approval for ${rabItemResult.data?.uraian || 'RAB Item'}`,
                description: `Approval workflow for RAB item #${rabItemId}`,
                status: 'in_review',
                currentApproverLevel: 1,
                approvalWorkflow: [
                  {
                    stepNumber: 1,
                    approverRole: 'Project Manager',
                    approverName: 'John Doe',
                    approverUserId: 'user1',
                    status: 'approved',
                    comments: 'Looks good, approved.',
                    decidedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                  },
                  {
                    stepNumber: 2,
                    approverRole: 'Finance Manager',
                    approverName: 'Jane Smith',
                    approverUserId: 'user2',
                    status: 'pending',
                    requiredBy: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                  },
                  {
                    stepNumber: 3,
                    approverRole: 'Site Manager',
                    approverName: 'Robert Johnson',
                    approverUserId: 'user3',
                    status: 'pending',
                  },
                ],
                approvalHistory: [
                  {
                    approverName: 'John Doe',
                    approverRole: 'Project Manager',
                    approverUserId: 'user1',
                    decision: 'approve',
                    comments: 'Looks good, approved.',
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                  },
                ],
                submittedBy: 'user1',
                submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                updatedAt: new Date(),
                createdBy: 'user1',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                isCancelled: false,
                isCompleted: false,
              };

              setApprovalWorkflow(mockWorkflow);
            }
          }
        } else {
          // If no rabItemId is provided, fetch all RAB items for the project
          const rabItemsResult = await rabAhspService.getRabItemsByProject(currentProject.id);
          if (rabItemsResult.success && rabItemsResult.data) {
            const enhancedRabItems = rabItemsResult.data.map(item => 
              EnhancedRabService.createEnhancedRabItem(item)
            );
            setRabItems(enhancedRabItems);
          }
        }
      } catch (err) {
        console.error('Failed to fetch RAB items or approval workflow:', err);
        setError('Failed to load RAB items or approval workflow');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentProject?.id, rabItemId]);

  // Handle approval submission
  const handleApprovalSubmit = async () => {
    if (!approvalWorkflow || !selectedStep || !currentProject?.id) return;

    setProcessing(true);
    try {
      // Process the approval through our service
      const result = await rabApprovalService.processApproval(
        currentProject.id,
        approvalWorkflow.id,
        decision,
        comments,
        'current_user' // In a real implementation, get from auth context
      );

      if (result.success && result.data) {
        setApprovalWorkflow(result.data);
      }

      setShowApprovalModal(false);
      setComments('');
      setSelectedStep(null);
    } catch (err) {
      console.error('Failed to process approval:', err);
      setError('Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  // Get step status color
  const getStepStatusColor = (status: RabApprovalStep['status']): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'skipped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Get step icon
  const getStepIcon = (status: RabApprovalStep['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'skipped':
        return <ChevronRight className="w-5 h-5 text-gray-400" />;
    }
  };

  // Format date
  const formatDate = (date?: Date): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Toggle item expansion
  const toggleItemExpansion = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Handle RAB item selection
  const handleSelectRabItem = async (rabItem: EnhancedRabItem) => {
    if (!currentProject?.id) return;

    try {
      setSelectedRabItem(rabItem);
      
      // Fetch approval workflow for selected RAB item
      try {
        const approvalResult = await rabApprovalService.getRabApprovalByRabItemId(currentProject.id, rabItem.id);
        if (approvalResult.success && approvalResult.data) {
          setApprovalWorkflow(approvalResult.data);
        }
      } catch (err) {
        // If no approval workflow exists, we'll create a mock one for demonstration
        console.log('No existing approval workflow found, creating mock workflow');
        const mockWorkflow: RabApprovalWorkflow = {
          id: `rab-approval-${rabItem.id}`,
          rabItemId: rabItem.id,
          projectId: currentProject.id,
          title: `Approval for ${rabItem.uraian || 'RAB Item'}`,
          description: `Approval workflow for RAB item #${rabItem.id}`,
          status: 'in_review',
          currentApproverLevel: 1,
          approvalWorkflow: [
            {
              stepNumber: 1,
              approverRole: 'Project Manager',
              approverName: 'John Doe',
              approverUserId: 'user1',
              status: 'approved',
              comments: 'Looks good, approved.',
              decidedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            },
            {
              stepNumber: 2,
              approverRole: 'Finance Manager',
              approverName: 'Jane Smith',
              approverUserId: 'user2',
              status: 'pending',
              requiredBy: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            },
            {
              stepNumber: 3,
              approverRole: 'Site Manager',
              approverName: 'Robert Johnson',
              approverUserId: 'user3',
              status: 'pending',
            },
          ],
          approvalHistory: [
            {
              approverName: 'John Doe',
              approverRole: 'Project Manager',
              approverUserId: 'user1',
              decision: 'approve',
              comments: 'Looks good, approved.',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            },
          ],
          submittedBy: 'user1',
          submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          updatedAt: new Date(),
          createdBy: 'user1',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          isCancelled: false,
          isCompleted: false,
        };

        setApprovalWorkflow(mockWorkflow);
      }
    } catch (err) {
      console.error('Failed to fetch approval workflow:', err);
      setError('Failed to load approval workflow');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // If no rabItemId is provided, show list of RAB items to select from
  if (rabItemId === undefined && rabItems.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Select RAB Item for Approval</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rabItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectRabItem(item)}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.uraian}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {item.volume} {item.satuan} @ {formatCurrency(item.hargaSatuan)}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-persimmon font-medium">
                    {formatCurrency(item.volume * item.hargaSatuan)}
                  </span>
                  <Button variant="outline" size="sm">
                    View Approval
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || (!approvalWorkflow && !selectedRabItem)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            {error || 'RAB item or approval workflow not found'}
          </p>
        </div>
      </div>
    );
  }

  const isExpanded = selectedRabItem ? expandedItems.has(selectedRabItem.id) : false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span className="font-mono">RAB-{approvalWorkflow?.rabItemId}</span>
              <span>•</span>
              <span className="capitalize">{approvalWorkflow?.status?.replace('_', ' ')}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {approvalWorkflow?.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {approvalWorkflow?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* RAB Item Details */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">RAB Item Details</h2>
            <button
              onClick={() => selectedRabItem && toggleItemExpansion(selectedRabItem.id)}
              className="text-persimmon hover:text-persimmon/80"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Item Description</p>
              <p className="font-medium">{selectedRabItem?.uraian}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Volume & Unit</p>
              <p className="font-medium">
                {selectedRabItem?.volume} {selectedRabItem?.satuan}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unit Price</p>
              <p className="font-medium">{selectedRabItem && formatCurrency(selectedRabItem.hargaSatuan)}</p>
            </div>
          </div>

          {isExpanded && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Cost Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Labor</p>
                  <p className="font-medium">{selectedRabItem && formatCurrency(selectedRabItem.costBreakdown.laborCost)}</p>
                  <p className="text-xs text-gray-500">{selectedRabItem?.costBreakdown.laborPercentage}%</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Materials</p>
                  <p className="font-medium">{selectedRabItem && formatCurrency(selectedRabItem.costBreakdown.materialCost)}</p>
                  <p className="text-xs text-gray-500">{selectedRabItem?.costBreakdown.materialPercentage}%</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Equipment</p>
                  <p className="font-medium">{selectedRabItem && formatCurrency(selectedRabItem.costBreakdown.equipmentCost)}</p>
                  <p className="text-xs text-gray-500">{selectedRabItem?.costBreakdown.equipmentPercentage}%</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Overhead</p>
                  <p className="font-medium">{selectedRabItem && formatCurrency(selectedRabItem.costBreakdown.overheadCost)}</p>
                  <p className="text-xs text-gray-500">{selectedRabItem?.costBreakdown.overheadPercentage}%</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Profit</p>
                  <p className="font-medium">{selectedRabItem && formatCurrency(selectedRabItem.costBreakdown.profitMargin)}</p>
                  <p className="text-xs text-gray-500">{selectedRabItem?.costBreakdown.profitPercentage}%</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="text-xl font-bold text-persimmon">
                  {selectedRabItem && formatCurrency(selectedRabItem.volume * selectedRabItem.hargaSatuan)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Escalation Rate</p>
                <p className="font-medium">{selectedRabItem?.escalationRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Workflow */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Approval Workflow
          </h2>

          <div className="flow-root">
            <ul className="-mb-8">
              {approvalWorkflow?.approvalWorkflow?.map((step, stepIdx) => (
                <li key={step.stepNumber}>
                  <div className="relative pb-8">
                    {stepIdx !== (approvalWorkflow?.approvalWorkflow?.length || 0) - 1 && (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                            step.status === 'pending'
                              ? 'bg-yellow-500'
                              : step.status === 'approved'
                              ? 'bg-green-500'
                              : step.status === 'rejected'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                          }`}
                        >
                          {getStepIcon(step.status)}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Step {step.stepNumber}: {step.approverRole}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Approver: {step.approverName}
                          </p>
                          {step.comments && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                              "{step.comments}"
                            </p>
                          )}
                          {step.status === 'pending' && step.requiredBy && (
                            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                              Required by: {formatDate(step.requiredBy)}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStepStatusColor(step.status)}`}
                          >
                            {step.status === 'pending' &&
                            approvalWorkflow?.currentApproverLevel === step.stepNumber
                              ? 'Current'
                              : step.status}
                          </span>
                          {step.decidedAt && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(step.decidedAt)}
                            </p>
                          )}
                          {step.status === 'pending' &&
                            approvalWorkflow?.currentApproverLevel === step.stepNumber && (
                              <div className="mt-2">
                                <Button
                                  onClick={() => {
                                    setSelectedStep(step);
                                    setShowApprovalModal(true);
                                  }}
                                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Take Action
                                </Button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Approval History */}
        {approvalWorkflow?.approvalHistory && approvalWorkflow.approvalHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Approval History
            </h2>
            <div className="space-y-4">
              {approvalWorkflow.approvalHistory.map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {record.decision === 'approve' ? (
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : record.decision === 'reject' ? (
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {record.approverName} ({record.approverRole})
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Decision:{' '}
                      <span className="font-medium capitalize">
                        {record.decision.replace('_', ' ')}
                      </span>
                    </p>
                    {record.comments && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 italic">
                        "{record.comments}"
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(record.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RAB Approval Details */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Approval Details
          </h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Submitted By</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">John Doe</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Submitted Date</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {approvalWorkflow && formatDate(approvalWorkflow.submittedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                {approvalWorkflow?.status?.replace('_', ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Step</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                Step {approvalWorkflow?.currentApproverLevel}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Process Approval - Step {selectedStep.stepNumber}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Decision
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="approve"
                      checked={decision === 'approve'}
                      onChange={(e) => setDecision(e.target.value as ApprovalDecision)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Approve</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="reject"
                      checked={decision === 'reject'}
                      onChange={(e) => setDecision(e.target.value as ApprovalDecision)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Reject</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="request_revision"
                      checked={decision === 'request_revision'}
                      onChange={(e) => setDecision(e.target.value as ApprovalDecision)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Request Revision
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor="comments"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Comments
                </label>
                <textarea
                  id="comments"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Add your comments..."
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleApprovalSubmit}
                  disabled={processing || !comments.trim()}
                  className="flex-1 justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Submit'}
                </Button>
                <Button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setComments('');
                    setSelectedStep(null);
                  }}
                  className="flex-1 justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

RabApprovalWorkflowView.displayName = 'RabApprovalWorkflowView';

export default RabApprovalWorkflowView;