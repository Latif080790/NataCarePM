/**
 * Change Order Workflow View
 * Priority 3C: Change Order Management System
 *
 * Visualize and manage approval workflows
 */

import React, { useState, useEffect } from 'react';
import { useChangeOrder } from '@/contexts/ChangeOrderContext';
import type { ApprovalStep, ApprovalDecision } from '@/types/changeOrder.types';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';

interface ChangeOrderWorkflowViewProps {
  changeOrderId: string;
}

const ChangeOrderWorkflowView: React.FC<ChangeOrderWorkflowViewProps> = ({ changeOrderId }) => {
  const {
    selectedChangeOrder,
    changeOrdersLoading,
    changeOrdersError,
    fetchChangeOrderById,
    processApproval,
  } = useChangeOrder();

  // Local state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ApprovalStep | null>(null);
  const [decision, setDecision] = useState<ApprovalDecision>('approve');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch change order on mount
  useEffect(() => {
    fetchChangeOrderById(changeOrderId);
  }, [changeOrderId]);

  // Handle approval submission
  const handleApprovalSubmit = async () => {
    if (!selectedChangeOrder || !selectedStep) return;

    setProcessing(true);
    try {
      await processApproval(
        selectedChangeOrder.id,
        decision,
        comments,
        selectedStep.approverUserId
      );
      setShowApprovalModal(false);
      setComments('');
      setSelectedStep(null);
    } catch (error) {
      console.error('Failed to process approval:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Get step status color
  const getStepStatusColor = (status: ApprovalStep['status']): string => {
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
  const getStepIcon = (status: ApprovalStep['status']) => {
    switch (status) {
      case 'pending':
        return (
          <svg
            className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'approved':
        return (
          <svg
            className="w-6 h-6 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'rejected':
        return (
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'skipped':
        return (
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        );
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (changeOrdersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (changeOrdersError || !selectedChangeOrder) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            {changeOrdersError || 'Change order not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span className="font-mono">{selectedChangeOrder.changeNumber}</span>
              <span>•</span>
              <span className="capitalize">{selectedChangeOrder.status.replace('_', ' ')}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {selectedChangeOrder.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {selectedChangeOrder.description}
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Approval Workflow
          </h2>

          <div className="flow-root">
            <ul className="-mb-8">
              {selectedChangeOrder.approvalWorkflow.map((step, stepIdx) => (
                <li key={step.stepNumber}>
                  <div className="relative pb-8">
                    {stepIdx !== selectedChangeOrder.approvalWorkflow.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
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
                            selectedChangeOrder.currentApproverLevel === step.stepNumber
                              ? 'Current'
                              : step.status}
                          </span>
                          {step.decidedAt && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(step.decidedAt)}
                            </p>
                          )}
                          {step.status === 'pending' &&
                            selectedChangeOrder.currentApproverLevel === step.stepNumber && (
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
        {selectedChangeOrder.approvalHistory.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Approval History
            </h2>
            <div className="space-y-4">
              {selectedChangeOrder.approvalHistory.map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {record.decision === 'approve' ? (
                      <svg
                        className="w-6 h-6 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : record.decision === 'reject' ? (
                      <svg
                        className="w-6 h-6 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {record.approverName}
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

        {/* Change Order Details */}
        <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Change Order Details
          </h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                {selectedChangeOrder.changeType}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Requested By</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {selectedChangeOrder.requestedBy}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Requested Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(selectedChangeOrder.requestedDate)}
              </dd>
            </div>
            {selectedChangeOrder.requiredBy && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Required By
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(selectedChangeOrder.requiredBy)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost Impact</dt>
              <dd
                className={`mt-1 text-sm font-medium ${
                  selectedChangeOrder.costImpact >= 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              >
                {selectedChangeOrder.costImpact >= 0 ? '+' : ''}$
                {selectedChangeOrder.costImpact.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Schedule Impact
              </dt>
              <dd
                className={`mt-1 text-sm font-medium ${
                  selectedChangeOrder.scheduleImpact >= 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              >
                {selectedChangeOrder.scheduleImpact >= 0 ? '+' : ''}
                {selectedChangeOrder.scheduleImpact} days
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Justification</dt>
            <dd className="mt-2 text-sm text-gray-900 dark:text-white whitespace-pre-line">
              {selectedChangeOrder.justification}
            </dd>
          </div>

          {selectedChangeOrder.alternativesConsidered && (
            <div className="mt-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Alternatives Considered
              </dt>
              <dd className="mt-2 text-sm text-gray-900 dark:text-white whitespace-pre-line">
                {selectedChangeOrder.alternativesConsidered}
              </dd>
            </div>
          )}
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
};

export default ChangeOrderWorkflowView;

