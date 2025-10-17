import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import { 
    Receipt, 
    Plus, 
    Search, 
    Filter, 
    Eye, 
    DollarSign,
    Send,
    AlertCircle,
    TrendingUp
} from 'lucide-react';
import { formatCurrency } from '../constants';
import { accountsReceivableService } from '../api/accountsReceivableService';
import type { AccountsReceivable, ReceivableStatus, AgingReport } from '../types/accounting';

interface AccountsReceivableViewProps {
    onNavigate?: (view: string) => void;
}

const AccountsReceivableView: React.FC<AccountsReceivableViewProps> = ({ onNavigate }) => {
    const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
    const [filteredReceivables, setFilteredReceivables] = useState<AccountsReceivable[]>([]);
    const [agingReport, setAgingReport] = useState<AgingReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<ReceivableStatus | 'all'>('all');
    const [selectedReceivable, setSelectedReceivable] = useState<AccountsReceivable | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadReceivables();
        loadAgingReport();
    }, []);

    useEffect(() => {
        filterReceivables();
    }, [receivables, searchTerm, selectedStatus]);

    const loadReceivables = async () => {
        try {
            setLoading(true);
            const data = await accountsReceivableService.getAllAccountsReceivable();
            setReceivables(data);
        } catch (error) {
            console.error('Failed to load receivables:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAgingReport = async () => {
        try {
            const report = await accountsReceivableService.generateAgingReport();
            setAgingReport(report);
        } catch (error) {
            console.error('Failed to load aging report:', error);
        }
    };

    const filterReceivables = () => {
        let filtered = receivables;

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(ar => ar.status === selectedStatus);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(ar => 
                ar.arNumber.toLowerCase().includes(term) ||
                ar.invoiceNumber.toLowerCase().includes(term) ||
                ar.customerName.toLowerCase().includes(term)
            );
        }

        setFilteredReceivables(filtered);
    };

    const handleRecordPayment = async (arId: string, amount: number) => {
        try {
            await accountsReceivableService.recordPayment(
                arId,
                {
                    amount,
                    currency: 'IDR',
                    paymentDate: new Date(),
                    paymentMethod: 'bank_transfer',
                    status: 'completed'
                },
                'current_user'
            );
            loadReceivables();
        } catch (error) {
            alert('Failed to record payment: ' + (error as Error).message);
        }
    };

    const handleSendReminder = async (arId: string) => {
        try {
            // Get AR to determine reminder type based on aging
            const ar = receivables.find(r => r.id === arId);
            if (!ar) {
                alert('Receivable not found');
                return;
            }
            
            // Determine reminder type based on aging
            let reminderType: 'gentle' | 'firm' | 'final' = 'gentle';
            if (ar.agingDays > 15) {
                reminderType = 'final';
            } else if (ar.agingDays > 0) {
                reminderType = 'firm';
            }
            
            await accountsReceivableService.sendPaymentReminder(
                arId,
                'current_user', // Replace with actual user ID from AuthContext
                reminderType
            );
            
            alert(`${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} reminder sent successfully!`);
        } catch (error) {
            alert('Failed to send reminder: ' + (error as Error).message);
        }
    };

    const getStatusColor = (status: ReceivableStatus): string => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            sent: 'bg-blue-100 text-blue-800',
            viewed: 'bg-purple-100 text-purple-800',
            partially_paid: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
            disputed: 'bg-orange-100 text-orange-800',
            write_off: 'bg-gray-100 text-gray-600',
            cancelled: 'bg-gray-100 text-gray-600',
            void: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const statuses: { value: ReceivableStatus | 'all'; label: string }[] = [
        { value: 'all', label: 'All Status' },
        { value: 'sent', label: 'Sent' },
        { value: 'viewed', label: 'Viewed' },
        { value: 'partially_paid', label: 'Partially Paid' },
        { value: 'paid', label: 'Paid' },
        { value: 'overdue', label: 'Overdue' }
    ];

    const totalReceivable = receivables
        .filter(ar => ar.status !== 'paid' && ar.status !== 'cancelled')
        .reduce((sum, ar) => sum + ar.amountDue, 0);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <BreadcrumbNavigation
                items={[
                    { name: 'Dashboard', onClick: () => onNavigate?.('dashboard') },
                    { name: 'Finance', onClick: () => onNavigate?.('finance') },
                    { name: 'Accounts Receivable' }
                ]}
            />

            <div className="mt-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                            <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Accounts Receivable</h1>
                            <p className="text-sm text-gray-500">Manage customer invoices and payments</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => onNavigate?.('ar-form')}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Invoice
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Total Receivable</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(totalReceivable)}
                                </div>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </Card>

                    {agingReport && agingReport.brackets.slice(0, 3).map(bracket => (
                        <Card key={bracket.bracket} className="p-4">
                            <div className="text-sm text-gray-500 mb-1">{bracket.bracket} Days</div>
                            <div className="text-2xl font-bold text-gray-900">{bracket.count}</div>
                            <div className="text-sm text-gray-600 mt-1">
                                {formatCurrency(bracket.totalAmount)}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div 
                                    className="bg-green-600 h-2 rounded-full" 
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
                                onChange={(e) => setSelectedStatus(e.target.value as ReceivableStatus | 'all')}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {statuses.map(status => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Receivables Table */}
                <Card>
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-500">Loading receivables...</p>
                        </div>
                    ) : filteredReceivables.length === 0 ? (
                        <div className="p-12 text-center">
                            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No receivables found</p>
                            <Button onClick={() => onNavigate?.('ar-form')} className="mt-4">
                                Create First Invoice
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                                            AR Number
                                        </th>
                                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                                            Customer
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
                                    {filteredReceivables.map((ar) => {
                                        const isOverdue = new Date(ar.dueDate) < new Date() && ar.status !== 'paid';
                                        return (
                                            <tr key={ar.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900">{ar.arNumber}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-medium">{ar.customerName}</div>
                                                    <div className="text-sm text-gray-500">{ar.customerCode}</div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {ar.invoiceNumber}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                                                        {isOverdue && <AlertCircle className="w-4 h-4" />}
                                                        {new Date(ar.dueDate).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium">
                                                    {formatCurrency(ar.totalAmount)}
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-green-600">
                                                    {formatCurrency(ar.amountDue)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ar.status)}`}>
                                                        {ar.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedReceivable(ar);
                                                                setShowDetails(true);
                                                            }}
                                                            className="p-2 hover:bg-blue-50 rounded text-blue-600"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {(ar.status === 'sent' || ar.status === 'viewed' || ar.status === 'overdue') && (
                                                            <button
                                                                onClick={() => handleSendReminder(ar.id)}
                                                                className="p-2 hover:bg-orange-50 rounded text-orange-600"
                                                                title="Send Reminder"
                                                            >
                                                                <Send className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {(ar.status !== 'paid' && ar.status !== 'cancelled') && (
                                                            <button
                                                                onClick={() => handleRecordPayment(ar.id, ar.amountDue)}
                                                                className="p-2 hover:bg-green-50 rounded text-green-600"
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
        </div>
    );
};

export default AccountsReceivableView;
