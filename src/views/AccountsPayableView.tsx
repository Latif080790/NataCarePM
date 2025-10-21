import React, { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@/constants';
import { accountsPayableService } from '@/api/accountsPayableService';
import type { AccountsPayable, PayableStatus, AgingReport } from '@/types/accounting';

interface AccountsPayableViewProps {
  onNavigate?: (view: string) => void;
}

const AccountsPayableView: React.FC<AccountsPayableViewProps> = ({ onNavigate }) => {
  const [payables, setPayables] = useState<AccountsPayable[]>([]);
  const [filteredPayables, setFilteredPayables] = useState<AccountsPayable[]>([]);
  const [agingReport, setAgingReport] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PayableStatus | 'all'>('all');
  const [selectedPayable, setSelectedPayable] = useState<AccountsPayable | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadPayables();
    loadAgingReport();
  }, []);

  useEffect(() => {
    filterPayables();
  }, [payables, searchTerm, selectedStatus]);

  const loadPayables = async () => {
    try {
      setLoading(true);
      const data = await accountsPayableService.getAllAccountsPayable();
      setPayables(data);
    } catch (error) {
      console.error('Failed to load payables:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgingReport = async () => {
    try {
      const report = await accountsPayableService.generateAgingReport();
      setAgingReport(report);
    } catch (error) {
      console.error('Failed to load aging report:', error);
    }
  };

  const filterPayables = () => {
    let filtered = payables;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((ap) => ap.status === selectedStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ap) =>
          ap.apNumber.toLowerCase().includes(term) ||
          ap.invoiceNumber.toLowerCase().includes(term) ||
          ap.vendorName.toLowerCase().includes(term)
      );
    }

    setFilteredPayables(filtered);
  };

  const handleApprove = async (apId: string) => {
    try {
      await accountsPayableService.approveAccountsPayable(apId, 'current_user', 'Approved');
      loadPayables();
    } catch (error) {
      alert('Failed to approve payable: ' + (error as Error).message);
    }
  };

  const handleRecordPayment = async (apId: string, amount: number) => {
    try {
      await accountsPayableService.recordPayment(
        apId,
        {
          amount,
          currency: 'IDR',
          paymentDate: new Date(),
          paymentMethod: 'bank_transfer',
          status: 'completed',
        },
        'current_user'
      );
      loadPayables();
      setShowPaymentModal(false);
    } catch (error) {
      alert('Failed to record payment: ' + (error as Error).message);
    }
  };

  const getStatusColor = (status: PayableStatus): string => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      partially_paid: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      disputed: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-gray-100 text-gray-600',
      void: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statuses: { value: PayableStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const totalPayable = payables
    .filter((ap) => ap.status !== 'paid' && ap.status !== 'cancelled')
    .reduce((sum, ap) => sum + ap.amountDue, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <BreadcrumbNavigation
        items={[
          { name: 'Dashboard', onClick: () => onNavigate?.('dashboard') },
          { name: 'Finance', onClick: () => onNavigate?.('finance') },
          { name: 'Accounts Payable' },
        ]}
      />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Accounts Payable</h1>
              <p className="text-sm text-gray-500">Manage vendor invoices and payments</p>
            </div>
          </div>
          <Button onClick={() => onNavigate?.('ap-form')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Payable</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalPayable)}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
          </Card>

          {agingReport &&
            agingReport.brackets.map((bracket) => (
              <Card key={bracket.bracket} className="p-4">
                <div className="text-sm text-gray-500 mb-1">{bracket.bracket} Days</div>
                <div className="text-2xl font-bold text-gray-900">{bracket.count}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {formatCurrency(bracket.totalAmount)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${bracket.percentage}%` }}
                  />
                </div>
              </Card>
            ))}
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as PayableStatus | 'all')}
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

        {/* Payables Table */}
        <Card>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading payables...</p>
            </div>
          ) : filteredPayables.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No payables found</p>
              <Button onClick={() => onNavigate?.('ap-form')} className="mt-4">
                Create First Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      AP Number
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Vendor
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Invoice
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Due Date
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                      Amount Due
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
                  {filteredPayables.map((ap) => {
                    const isOverdue = new Date(ap.dueDate) < new Date() && ap.status !== 'paid';
                    return (
                      <tr key={ap.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{ap.apNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{ap.vendorName}</div>
                          <div className="text-sm text-gray-500">{ap.vendorCode}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{ap.invoiceNumber}</td>
                        <td className="py-3 px-4">
                          <div
                            className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}
                          >
                            {isOverdue && <AlertCircle className="w-4 h-4" />}
                            {new Date(ap.dueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(ap.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-red-600">
                          {formatCurrency(ap.amountDue)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ap.status)}`}
                          >
                            {ap.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => {
                                setSelectedPayable(ap);
                                setShowDetails(true);
                              }}
                              className="p-2 hover:bg-blue-50 rounded text-blue-600"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {ap.status === 'pending' && (
                              <button
                                onClick={() => handleApprove(ap.id)}
                                className="p-2 hover:bg-green-50 rounded text-green-600"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {(ap.status === 'approved' || ap.status === 'partially_paid') && (
                              <button
                                onClick={() => {
                                  setSelectedPayable(ap);
                                  setShowPaymentModal(true);
                                }}
                                className="p-2 hover:bg-blue-50 rounded text-blue-600"
                                title="Record Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Details Modal - Similar to Journal Entries */}
      {showDetails && selectedPayable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Invoice Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Clock className="w-5 h-5" />
                </button>
              </div>
              {/* Add detailed view content here */}
              <div className="flex justify-end">
                <Button onClick={() => setShowDetails(false)}>Close</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AccountsPayableView;
