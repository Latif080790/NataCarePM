/**
 * AUDIT TESTING PAGE
 * 
 * Simple page to test audit trail functionality and generate sample data
 * Day 5 - Integration Testing
 */

import { useState } from 'react';
import { generateSampleAuditData, testAuditLogging } from '@/utils/generateSampleAuditData';
import { CardPro } from '@/components/DesignSystem';

export default function AuditTestingView() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleGenerateSampleData = async () => {
    setLoading(true);
    setMessage('');
    setStatus('idle');

    try {
      await generateSampleAuditData();
      setStatus('success');
      setMessage('✅ Successfully generated 35 comprehensive audit logs! Navigate to Enhanced Audit Trail to view.');
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAuditLogging = async () => {
    setLoading(true);
    setMessage('');
    setStatus('idle');

    try {
      await testAuditLogging();
      setStatus('success');
      setMessage('✅ Audit logging test passed!');
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Audit Trail Testing</h1>
        <p className="text-gray-600 mt-1">
          Day 5 - Integration Testing & Sample Data Generation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generate Sample Data Card */}
        <CardPro className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Generate Sample Audit Data
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Generate 35 comprehensive audit logs covering all integrated modules with full workflows.
          </p>
          
          <div className="space-y-2 text-sm text-gray-700 mb-4">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <span>Procurement: 7 logs (vendor, PO approvals)</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span>Logistics (GR): 6 logs (goods receipt)</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              <span>Finance: 6 logs (journal entries)</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              <span>Material Request: 8 logs (full MR workflow)</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              <span>Inventory: 8 logs (transactions, stock count)</span>
            </div>
          </div>

          <button
            onClick={handleGenerateSampleData}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : '🔄 Generate Sample Data'}
          </button>
        </CardPro>

        {/* Test Audit Logging Card */}
        <CardPro className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Test Audit Logging
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Quick test to verify audit logging functionality is working correctly.
          </p>
          
          <div className="space-y-2 text-sm text-gray-700 mb-4">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
              <span>Creates a simple test audit log</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
              <span>Verifies Firebase connection</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
              <span>Validates audit helper functions</span>
            </div>
          </div>

          <button
            onClick={handleTestAuditLogging}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Testing...' : '🧪 Test Audit Logging'}
          </button>
        </CardPro>
      </div>

      {/* Status Message */}
      {message && (
        <div className="mt-6">
          <CardPro className={`p-4 ${
            status === 'success' ? 'bg-green-50 border-green-200' :
            status === 'error' ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <p className={`text-sm font-medium ${
              status === 'success' ? 'text-green-800' :
              status === 'error' ? 'text-red-800' :
              'text-gray-800'
            }`}>
              {message}
            </p>

            {status === 'success' && (
              <div className="mt-3">
                <a
                  href="/settings/audit-trail-enhanced"
                  className="inline-block px-4 py-2 bg-white border border-green-300 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors"
                >
                  📊 View Enhanced Audit Trail →
                </a>
              </div>
            )}
          </CardPro>
        </div>
      )}

      {/* Info Card */}
      <CardPro className="mt-6 p-6 bg-blue-50 border-blue-200">
        <h3 className="text-md font-semibold text-blue-900 mb-2">
          📘 How to Use
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Click "Test Audit Logging" to verify the system is working</li>
          <li>Click "Generate Sample Data" to create 35 comprehensive audit logs</li>
          <li>Navigate to Enhanced Audit Trail to view and test filtering by all modules</li>
          <li>Test export functionality (Excel, PDF, CSV, JSON)</li>
          <li>Verify before/after comparison and multi-stage approval workflows</li>
        </ol>

        <div className="mt-4 pt-4 border-t border-blue-300">
          <p className="text-xs text-blue-700">
            <strong>Day 6 - Complete Integration Testing</strong><br />
            Sample data includes: Finance (journal entries), Material Request (full approval workflow), 
            Inventory (transactions & stock count), Procurement, and Logistics. All with realistic metadata, 
            multi-stage approvals, and timestamps.
          </p>
        </div>
      </CardPro>
    </div>
  );
}

