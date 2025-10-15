import React, { useState, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { PurchaseOrder, InventoryItem, AhspData, POItem } from '../types';
import { hasPermission } from '../constants';
import { CreatePOModal } from '../components/CreatePOModal';
import { PODetailsModal } from '../components/PODetailsModal';
import { Input } from '../components/FormControls';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LogisticsViewProps {
    purchaseOrders: PurchaseOrder[];
    inventory: InventoryItem[];
    onUpdatePOStatus: (poId: string, status: PurchaseOrder['status']) => void;
    ahspData: AhspData | null;
    onAddPO: (po: Omit<PurchaseOrder, 'id' | 'status' | 'items'> & { items: POItem[] }) => void;
}

export default function LogisticsView({ purchaseOrders, inventory, onUpdatePOStatus, ahspData, onAddPO }: LogisticsViewProps) {
    const { currentUser } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const canApprovePO = hasPermission(currentUser, 'approve_po');
    const canCreatePO = hasPermission(currentUser, 'create_po');

    const getStatusColor = (status: PurchaseOrder['status']) => {
        switch (status) {
            case 'Ditolak': return 'bg-red-100 text-red-800';
            case 'Menunggu Persetujuan': return 'bg-yellow-100 text-yellow-800';
            case 'Disetujuan': return 'bg-cyan-100 text-cyan-800';
            case 'Diterima Penuh': return 'bg-green-100 text-green-800';
            default: return 'bg-violet-essence text-night-black';
        }
    };
    
    const getStockStatus = (item: InventoryItem) => {
        if (item.quantity <= 0) return { text: 'Habis', color: 'bg-red-100 text-red-800' };
        if (item.quantity <= 10 && item.unit !== 'bh') return { text: 'Stok Rendah', color: 'bg-yellow-100 text-yellow-800' };
        if (item.quantity <= 100 && item.unit === 'bh') return { text: 'Stok Rendah', color: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Aman', color: 'bg-green-100 text-green-800' };
    };

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => item.materialName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [inventory, searchTerm]);


    return (
        <>
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Purchase Order (PO)</CardTitle>
                    {canCreatePO && (
                        <Button onClick={() => setIsCreateModalOpen(true)}><PlusCircle className="w-4 h-4 mr-2"/>Buat PO Baru</Button>
                    )}
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-night-black">
                            <thead className="bg-violet-essence/50 text-xs uppercase">
                                <tr>
                                    <th className="p-3">PR No.</th>
                                    <th className="p-3">Item</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>{purchaseOrders.map(po => (
                                <tr key={po.id} className="border-b border-violet-essence hover:bg-violet-essence/30 cursor-pointer" onClick={() => setSelectedPO(po)}>
                                    <td className="p-3 font-medium">{po.prNumber}</td>
                                    <td className="p-3 truncate" style={{maxWidth: '300px'}}>{po.items.map(i => `${i.materialName} (${i.quantity} ${i.unit})`).join(', ')}</td>
                                    <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColor(po.status)}`}>{po.status}</span></td>
                                    <td className="p-3 text-center">
                                        {po.status === 'Menunggu Persetujuan' && canApprovePO && (
                                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onUpdatePOStatus(po.id, 'Disetujuan'); }}>Setujui</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Inventaris Material</CardTitle>
                     <div className="mt-2">
                        <Input 
                            placeholder="Cari material..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="max-w-xs"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-night-black">
                             <thead className="bg-violet-essence/50 text-xs uppercase">
                                <tr>
                                    <th className="p-3">Nama Material</th>
                                    <th className="p-3 text-right">Jumlah Stok</th>
                                    <th className="p-3">Satuan</th>
                                    <th className="p-3">Status Stok</th>
                                </tr>
                            </thead>
                            <tbody>{filteredInventory.map(item => (
                                <tr key={item.materialName} className="border-b border-violet-essence hover:bg-violet-essence/30">
                                    <td className="p-3 font-medium">{item.materialName}</td>
                                    <td className="p-3 text-right">{item.quantity.toFixed(2)}</td>
                                    <td className="p-3">{item.unit}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStockStatus(item).color}`}>
                                            {getStockStatus(item).text}
                                        </span>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>

        {isCreateModalOpen && ahspData && currentUser && (
            <CreatePOModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onAddPO={onAddPO}
                ahspData={ahspData}
                currentUser={currentUser}
            />
        )}
        
        {selectedPO && (
            <PODetailsModal 
                po={selectedPO}
                onClose={() => setSelectedPO(null)}
            />
        )}

        </>
    );
}
