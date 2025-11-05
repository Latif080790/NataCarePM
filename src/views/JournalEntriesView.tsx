import React, { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Check,
  Send,
  X,
  FileText,
} from 'lucide-react';
import { formatCurrency } from '@/constants';
import { journalEntriesService } from '@/api/journalService';
import type { JournalEntry, JournalEntryStatus } from '@/types/accounting';

interface JournalEntriesViewProps {
  onNavigate?: (view: string) => void;
}

const JournalEntriesView: React.FC<JournalEntriesViewProps> = ({ onNavigate }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<JournalEntryStatus | 'all'>('all');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, selectedStatus]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await journalEntriesService.getAllJournalEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = entries;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((entry) => entry.status === selectedStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.entryNumber.toLowerCase().includes(term) ||
          entry.description.toLowerCase().includes(term) ||
          entry.reference?.toLowerCase().includes(term)
      );
    }

    setFilteredEntries(filtered);
  };

  const handleApprove = async (entryId: string) => {
    try {
      await journalEntriesService.approveEntry(entryId, 'current_user');
      loadEntries();
    } catch (error) {
      alert('Failed to approve entry: ' + (error as Error).message);
    }
  };

  const handlePost = async (entryId: string) => {
    if (!confirm('Are you sure you want to post this entry? This action cannot be undone.')) return;

    try {
      await journalEntriesService.postEntry(entryId, 'current_user');
      loadEntries();
    } catch (error) {
      alert('Failed to post entry: ' + (error as Error).message);
    }
  };

  const handleVoid = async (entryId: string) => {
    if (!confirm('Are you sure you want to void this entry?')) return;

    try {
      await journalEntriesService.voidEntry(entryId, 'current_user', 'Voided by user');
      loadEntries();
    } catch (error) {
      alert('Failed to void entry: ' + (error as Error).message);
    }
  };

  const getStatusColor = (status: JournalEntryStatus): string => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      posted: 'bg-blue-100 text-blue-800',
      void: 'bg-red-100 text-red-800',
      reversed: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statuses: { value: JournalEntryStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_approval', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'posted', label: 'Posted' },
    { value: 'void', label: 'Void' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <BreadcrumbNavigation
        items={[
          { name: 'Dashboard', onClick: () => onNavigate?.('dashboard') },
          { name: 'Finance', onClick: () => onNavigate?.('finance') },
          { name: 'Journal Entries' },
        ]}
      />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
              <p className="text-sm text-gray-500">Record and manage accounting transactions</p>
            </div>
          </div>
          <Button
            onClick={() => onNavigate?.('journal-entry-form')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {statuses.slice(1).map((status) => {
            const count = entries.filter((e) => e.status === status.value).length;
            return (
              <Card key={status.value} className="p-4">
                <div className="text-sm text-gray-500 mb-1">{status.label}</div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as JournalEntryStatus | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Entries Table */}
        <Card>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No journal entries found</p>
              <Button onClick={() => onNavigate?.('journal-entry-form')} className="mt-4">
                Create First Entry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Entry Number
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                      Debits
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                      Credits
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{entry.entryNumber}</div>
                        {entry.reference && (
                          <div className="text-sm text-gray-500">Ref: {entry.reference}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate">{entry.description}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(entry.totalDebit)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(entry.totalCredit)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}
                        >
                          {entry.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowDetails(true);
                            }}
                            className="p-2 hover:bg-blue-50 rounded text-blue-600"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {entry.status === 'pending_approval' && (
                            <button
                              onClick={() => handleApprove(entry.id)}
                              className="p-2 hover:bg-green-50 rounded text-green-600"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {entry.status === 'approved' && (
                            <button
                              onClick={() => handlePost(entry.id)}
                              className="p-2 hover:bg-blue-50 rounded text-blue-600"
                              title="Post"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {entry.status === 'posted' && (
                            <button
                              onClick={() => handleVoid(entry.id)}
                              className="p-2 hover:bg-red-50 rounded text-red-600"
                              title="Void"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Details Modal */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Journal Entry Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-500">Entry Number</div>
                  <div className="font-medium">{selectedEntry.entryNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium">
                    {new Date(selectedEntry.entryDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEntry.status)}`}
                  >
                    {selectedEntry.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Reference</div>
                  <div className="font-medium">{selectedEntry.reference || '-'}</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Description</div>
                <div>{selectedEntry.description}</div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Journal Lines</h3>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-3 text-left text-sm font-medium text-gray-700">
                        Account
                      </th>
                      <th className="py-2 px-3 text-right text-sm font-medium text-gray-700">
                        Debit
                      </th>
                      <th className="py-2 px-3 text-right text-sm font-medium text-gray-700">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEntry.lines.map((line) => (
                      <tr key={line.id} className="border-b">
                        <td className="py-2 px-3">
                          <div className="font-medium">
                            {line.accountNumber} - {line.accountName}
                          </div>
                          {line.description && (
                            <div className="text-sm text-gray-500">{line.description}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-gray-50">
                      <td className="py-2 px-3">Total</td>
                      <td className="py-2 px-3 text-right">
                        {formatCurrency(selectedEntry.totalDebit)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {formatCurrency(selectedEntry.totalCredit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button onClick={() => setShowDetails(false)} className="bg-gray-200 text-gray-800">
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JournalEntriesView;
