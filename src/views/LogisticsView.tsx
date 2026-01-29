import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertCircle,
  Clock,
  PlusCircle,
} from 'lucide-react';
import {
  ButtonPro,
  StatCardPro,
  BadgePro,
  TablePro,
  type ColumnDef,
  EnterpriseLayout,
  SectionLayout,
  StatCardGrid,
} from '@/components/DesignSystem';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext.minimal';
import { hasPermission } from '@/constants';
import { CreatePOModal } from '@/components/CreatePOModal';
import { PODetailsModal } from '@/components/PODetailsModal';
import { PurchaseOrder, InventoryItem, AhspData, POItem } from '@/types';
import { debounce } from '@/utils/performanceOptimization';

// Interfaces for component props if used as a controlled component
// OR we fallback to internal contexts
interface LogisticsViewProps {
  purchaseOrders?: PurchaseOrder[];
  inventory?: InventoryItem[];
  onUpdatePOStatus?: (poId: string, status: PurchaseOrder['status']) => void;
  ahspData?: AhspData | null;
  onAddPO?: (po: Omit<PurchaseOrder, 'id' | 'status' | 'items'> & { items: POItem[] }) => void;
}

export default function LogisticsView({
  purchaseOrders: propPOs,
  inventory: propInventory,
  onUpdatePOStatus,
  ahspData,
  onAddPO,
}: LogisticsViewProps) {
  const { currentProject } = useProject();
  const { currentUser } = useAuth();

  // Prefer props, fallback to context (mock/structure for now if context lacks specific fields)
  // In a real scenario, we'd have a useLogistics() hook.
  const purchaseOrders = propPOs || (currentProject as any)?.purchaseOrders || [];
  const inventory = propInventory || (currentProject as any)?.inventory || [];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Permissions
  const canApprovePO = hasPermission(currentUser, 'approve_po');
  const canCreatePO = hasPermission(currentUser, 'create_po');

  // Stats Calculation
  const stats = useMemo(() => {
    return {
      totalPOs: purchaseOrders.length,
      pendingPOs: purchaseOrders.filter(po => po.status === 'Menunggu Persetujuan').length,
      lowStockItems: inventory.filter(item => item.quantity <= 10).length,
      totalInventory: inventory.length
    };
  }, [purchaseOrders, inventory]);

  // Inventory Columns
  const inventoryColumns: ColumnDef<InventoryItem>[] = [
    {
      key: 'materialName',
      header: 'Item Name',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.materialName}</span>
    },
    {
      key: 'quantity',
      header: 'Stock Level',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className={row.quantity <= 10 ? 'text-red-600 font-bold' : 'text-gray-900'}>
          {row.quantity.toFixed(2)}
        </span>
      )
    },
    {
      key: 'unit',
      header: 'Unit',
      align: 'center',
      render: (row) => <span className="text-gray-500 text-sm">{row.unit}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        let status = { text: 'In Stock', variant: 'success' as const };
        if (row.quantity <= 0) status = { text: 'Out of Stock', variant: 'error' as const };
        else if (row.quantity <= 10) status = { text: 'Low Stock', variant: 'warning' as const };

        return <BadgePro variant={status.variant}>{status.text}</BadgePro>;
      }
    }
  ];

  // PO Columns
  const poColumns: ColumnDef<PurchaseOrder>[] = [
    {
      key: 'prNumber',
      header: 'PO Number',
      render: (po) => <span className="font-medium text-blue-600">#{po.prNumber}</span>
    },
    {
      key: 'items',
      header: 'Summary',
      render: (po) => (
        <span className="text-gray-600 truncate max-w-[200px] block">
          {po.items?.map(i => i.materialName).join(', ') || 'No items'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (po) => {
        const variantMap: Record<string, any> = {
          'Ditolak': 'error',
          'Menunggu Persetujuan': 'warning',
          'Disetujuan': 'primary',
          'Diterima Penuh': 'success'
        };
        return <BadgePro variant={variantMap[po.status] || 'default'}>{po.status}</BadgePro>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (po) => (
        <div className="flex justify-end gap-2">
          <ButtonPro size="sm" variant="ghost" onClick={() => setSelectedPO(po)}>View</ButtonPro>
          {po.status === 'Menunggu Persetujuan' && canApprovePO && onUpdatePOStatus && (
            <ButtonPro
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePOStatus(po.id, 'Disetujuan');
              }}
            >
              Approve
            </ButtonPro>
          )}
        </div>
      )
    }
  ];

  // Filter logic
  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    return inventory.filter(item =>
      item.materialName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const filteredPOs = useMemo(() => {
    if (!searchTerm) return purchaseOrders;
    return purchaseOrders.filter(po =>
      po.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.items?.some(i => i.materialName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [purchaseOrders, searchTerm]);

  return (
    <EnterpriseLayout
      title="Logistics & Inventory"
      subtitle={`Manage supply chain for ${currentProject?.name || 'Project'}`}
      actions={
        canCreatePO && (
          <ButtonPro variant="primary" icon={PlusCircle} onClick={() => setIsCreateModalOpen(true)}>
            New PO
          </ButtonPro>
        )
      }
    >
      {/* Stats Overview */}
      <SectionLayout title="Overview" className="mb-6">
        <StatCardGrid>
          <StatCardPro
            title="Total Purchase Orders"
            value={stats.totalPOs}
            icon={FileText}
            variant="primary"
          />
          <StatCardPro
            title="Pending Approval"
            value={stats.pendingPOs}
            icon={Clock}
            variant={stats.pendingPOs > 0 ? 'warning' : 'success'}
          />
          <StatCardPro
            title="Inventory Items"
            value={stats.totalInventory}
            icon={Package}
            variant="default"
          />
          <StatCardPro
            title="Low Stock Alerts"
            value={stats.lowStockItems}
            icon={AlertCircle}
            variant={stats.lowStockItems > 0 ? 'error' : 'success'}
          />
        </StatCardGrid>
      </SectionLayout>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Section */}
        <SectionLayout title="Inventory Status" description="Current stock levels">
          <TablePro
            data={filteredInventory}
            columns={inventoryColumns}
            searchable
            onSearch={setSearchTerm}
            searchPlaceholder="Search inventory..."
            className="max-h-[400px] overflow-y-auto"
            emptyMessage="No inventory items found."
          />
        </SectionLayout>

        {/* PO Section */}
        <SectionLayout title="Recent Purchase Orders" description="Track PO status">
          <TablePro
            data={filteredPOs}
            columns={poColumns}
            searchable
            onSearch={setSearchTerm}
            searchPlaceholder="Search POs..."
            className="max-h-[400px] overflow-y-auto"
            emptyMessage="No purchase orders found."
          />
        </SectionLayout>
      </div>

      {isCreateModalOpen && ahspData && currentUser && (
        <CreatePOModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onAddPO={onAddPO!}
          ahspData={ahspData}
          currentUser={currentUser}
        />
      )}

      {selectedPO && <PODetailsModal po={selectedPO} onClose={() => setSelectedPO(null)} />}

    </EnterpriseLayout>
  );
}

// Helper icon component since FileText was used in stats but not imported
function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
