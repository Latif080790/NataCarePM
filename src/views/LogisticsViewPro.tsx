import React, { useState } from 'react';
import { Package, Truck, MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import {
  ButtonPro,
  StatCardPro,
  BadgePro,
  CardPro,
  TablePro,
  type ColumnDef,
  EnterpriseLayout,
  PageHeader,
  SectionLayout,
} from '@/components/DesignSystem';
import { useProject } from '@/contexts/ProjectContext';

interface DeliveryItem {
  id: string;
  itemName: string;
  quantity: number;
  status: 'pending' | 'in-transit' | 'delivered' | 'delayed';
  origin: string;
  destination: string;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  supplier: string;
}

export const LogisticsViewPro: React.FC = () => {
  const { currentProject } = useProject();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-transit' | 'delivered'>('all');

  // Mock data - replace with actual logistics data
  const deliveries: DeliveryItem[] = [];
  const stats = {
    totalShipments: 156,
    inTransit: 23,
    delivered: 128,
    delayed: 5,
  };

  const columns: ColumnDef<DeliveryItem>[] = [
    {
      key: 'itemName',
      header: 'Item',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.itemName}</div>
          <div className="text-sm text-gray-500">Qty: {row.quantity}</div>
        </div>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => (
        <span className="text-sm text-gray-900">{row.supplier}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const variantMap = {
          pending: 'warning',
          'in-transit': 'primary',
          delivered: 'success',
          delayed: 'error',
        } as const;
        return (
          <BadgePro variant={variantMap[row.status]}>
            {row.status.replace('-', ' ').toUpperCase()}
          </BadgePro>
        );
      },
    },
    {
      key: 'origin',
      header: 'Route',
      render: (row) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin className="w-3 h-3" />
            {row.origin}
          </div>
          <div className="flex items-center gap-1 text-gray-900 font-medium mt-1">
            <MapPin className="w-3 h-3" />
            {row.destination}
          </div>
        </div>
      ),
    },
    {
      key: 'estimatedDelivery',
      header: 'Delivery Date',
      render: (row) => (
        <div className="text-sm">
          <div className="text-gray-600">
            Est: {new Date(row.estimatedDelivery).toLocaleDateString()}
          </div>
          {row.actualDelivery && (
            <div className="text-green-600 font-medium">
              Act: {new Date(row.actualDelivery).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Logistics Management"
        subtitle={`Track shipments and deliveries for ${currentProject?.name || 'Project'}`}
        actions={
          <div className="flex items-center gap-3">
            <ButtonPro variant="outline">
              <Package className="w-4 h-4 mr-2" />
              New Shipment
            </ButtonPro>
            <ButtonPro variant="primary">
              <Truck className="w-4 h-4 mr-2" />
              Track Delivery
            </ButtonPro>
          </div>
        }
      />

      {/* Stats Overview */}
      <SectionLayout title="Logistics Overview">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCardPro
            title="Total Shipments"
            value={stats.totalShipments}
            icon={Package}
            variant="primary"
            trend={{ value: 8, label: 'this month' }}
          />
          <StatCardPro
            title="In Transit"
            value={stats.inTransit}
            icon={Truck}
            variant="warning"
            trend={{ value: 12, label: 'active shipments' }}
          />
          <StatCardPro
            title="Delivered"
            value={stats.delivered}
            icon={CheckCircle}
            variant="success"
            trend={{ value: 15, label: 'this week' }}
          />
          <StatCardPro
            title="Delayed"
            value={stats.delayed}
            icon={AlertCircle}
            variant="error"
            trend={{ value: -3, label: 'vs last week', isPositiveGood: false }}
          />
        </div>
      </SectionLayout>

      {/* Status Filter */}
      <SectionLayout>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
            {(['all', 'pending', 'in-transit', 'delivered'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </SectionLayout>

      {/* Delivery Tracking Map Placeholder */}
      <SectionLayout title="Active Shipments Map">
        <CardPro>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Interactive map showing active shipment locations</p>
              <p className="text-sm mt-1">(Integration with mapping service required)</p>
            </div>
          </div>
        </CardPro>
      </SectionLayout>

      {/* Deliveries Table */}
      <SectionLayout
        title="Recent Deliveries"
        description="Track and manage all shipments and deliveries"
      >
        <TablePro
          data={deliveries}
          columns={columns}
          searchable
          searchPlaceholder="Search shipments..."
          emptyMessage="No deliveries found"
        />
      </SectionLayout>

      {/* Quick Actions */}
      <SectionLayout title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardPro className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Schedule Delivery</h3>
                <p className="text-sm text-gray-600">Plan new shipment</p>
              </div>
            </div>
          </CardPro>

          <CardPro className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Track Shipment</h3>
                <p className="text-sm text-gray-600">Real-time tracking</p>
              </div>
            </div>
          </CardPro>

          <CardPro className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Delivery History</h3>
                <p className="text-sm text-gray-600">View past deliveries</p>
              </div>
            </div>
          </CardPro>
        </div>
      </SectionLayout>
    </EnterpriseLayout>
  );
};

export default LogisticsViewPro;
