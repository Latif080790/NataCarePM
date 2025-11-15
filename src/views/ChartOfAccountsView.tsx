import React, { useState, useEffect } from 'react';
import { CardPro } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { formatCurrency } from '@/constants';
import { chartOfAccountsService } from '@/api/chartOfAccountsService';
import type { ChartOfAccount, AccountType } from '@/types/accounting';

interface ChartOfAccountsViewProps {
  onNavigate?: (view: string) => void;
}

const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = React.memo(({ onNavigate }) => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType | 'all'>('all');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, selectedType]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await chartOfAccountsService.getAllAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (selectedType !== 'all') {
      filtered = filtered.filter((acc) => acc.accountType === selectedType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (acc) =>
          acc.accountNumber.toLowerCase().includes(term) ||
          acc.accountName.toLowerCase().includes(term) ||
          acc.description?.toLowerCase().includes(term)
      );
    }

    setFilteredAccounts(filtered);
  };

  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      await chartOfAccountsService.deleteAccount(accountId, 'current_user');
      loadAccounts();
    } catch (error) {
      alert('Failed to delete account: ' + (error as Error).message);
    }
  };

  const getTypeColor = (type: AccountType): string => {
    const colors: Partial<Record<AccountType, string>> = {
      asset: 'bg-green-100 text-green-800',
      liability: 'bg-red-100 text-red-800',
      equity: 'bg-blue-100 text-blue-800',
      revenue: 'bg-purple-100 text-purple-800',
      expense: 'bg-orange-100 text-orange-800',
      cost_of_sales: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const accountTypes: { value: AccountType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'asset', label: 'Assets' },
    { value: 'liability', label: 'Liabilities' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expenses' },
  ];

  const buildAccountTree = (accounts: ChartOfAccount[], parentId?: string): ChartOfAccount[] => {
    return accounts
      .filter((acc) => acc.parentAccountId === parentId)
      .sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
  };

  const renderAccountRow = (account: ChartOfAccount, level: number = 0) => {
    const children = buildAccountTree(filteredAccounts, account.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedAccounts.has(account.id);

    return (
      <React.Fragment key={account.id}>
        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td className="py-3 px-4" style={{ paddingLeft: `${level * 24 + 16}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(account.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}
              <div>
                <div className="font-medium text-gray-900">
                  {account.accountNumber} - {account.accountName}
                </div>
                {account.description && (
                  <div className="text-sm text-gray-500">{account.description}</div>
                )}
              </div>
            </div>
          </td>
          <td className="py-3 px-4">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(account.accountType)}`}
            >
              {account.accountType.replace('_', ' ')}
            </span>
          </td>
          <td className="py-3 px-4 text-right font-medium">
            {formatCurrency(account.currentBalance || 0)}
          </td>
          <td className="py-3 px-4">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                account.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {account.status}
            </span>
          </td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  // TODO: Implement edit form
                  console.log('Edit account:', account);
                }}
                className="p-2 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="p-2 hover:bg-red-50 rounded text-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && children.map((child) => renderAccountRow(child, level + 1))}
      </React.Fragment>
    );
  };

  const rootAccounts = buildAccountTree(filteredAccounts);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <BreadcrumbNavigation
        items={[
          { name: 'Dashboard', onClick: () => onNavigate?.('dashboard') },
          { name: 'Finance', onClick: () => onNavigate?.('finance') },
          { name: 'Chart of Accounts' },
        ]}
      />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
              <p className="text-sm text-gray-500">Manage your company's accounts structure</p>
            </div>
          </div>
          <ButtonPro
            onClick={() => {
              // TODO: Implement create form
              console.log('Create new account');
            }}
            variant="primary"
            icon={Plus}
          >
            New Account
          </ButtonPro>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {accountTypes.slice(1).map((type) => {
            const typeAccounts = accounts.filter((acc) => acc.accountType === type.value);
            const totalBalance = typeAccounts.reduce(
              (sum, acc) => sum + (acc.currentBalance || 0),
              0
            );
            return (
              <CardPro key={type.value} className="p-4">
                <div className="text-sm text-gray-500 mb-1">{type.label}</div>
                <div className="text-2xl font-bold text-gray-900">{typeAccounts.length}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Balance: {formatCurrency(totalBalance)}
                </div>
              </CardPro>
            );
          })}
        </div>

        {/* Filters */}
        <CardPro className="p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as AccountType | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 transition-shadow"
              >
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardPro>

        {/* Accounts Table */}
        <CardPro>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading accounts...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No accounts found</p>
              <ButtonPro onClick={() => console.log('Create first account')} variant="primary" className="mt-4">
                Create First Account
              </ButtonPro>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Account
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                      Balance
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>{rootAccounts.map((account) => renderAccountRow(account))}</tbody>
              </table>
            </div>
          )}
        </CardPro>
      </div>
    </div>
  );
});

ChartOfAccountsView.displayName = 'ChartOfAccountsView';

export default ChartOfAccountsView;
