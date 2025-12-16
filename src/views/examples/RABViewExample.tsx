/**
 * EXAMPLE: RAB View dengan RBAC dan Audit Trail
 * Menunjukkan bagaimana mengintegrasikan permission dan audit
 * Last Updated: December 16, 2025
 */

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate, AccessDenied } from '@/components/PermissionGate';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { rabAhspService } from '@/api/rabAhspService';
import { RabItem } from '@/types';
import ButtonPro from '@/components/ButtonPro';
import CardPro from '@/components/CardPro';
import SpinnerPro from '@/components/SpinnerPro';

export default function RABViewExample() {
  const { currentProject } = useProject();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const { 
    hasPermission, 
    canViewFinancials, 
    canEditRAB, 
    isOwner,
    currentRole,
    roleName 
  } = usePermissions();

  const [rabItems, setRabItems] = useState<RabItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRabItems();
  }, [currentProject]);

  const loadRabItems = async () => {
    if (!currentProject) return;

    try {
      setLoading(true);
      const result = await rabAhspService.RabAhspService.prototype.getRabItemsByProject(currentProject.id);
      
      if (result.success && result.data) {
        setRabItems(result.data);
      } else {
        addToast(result.error?.message || 'Gagal memuat RAB', 'error');
      }
    } catch (error) {
      addToast('Error loading RAB items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRAB = async (rabItemId: number, updates: Partial<RabItem>) => {
    if (!currentProject) return;

    // ✅ Check permission before action
    if (!canEditRAB) {
      addToast('Anda tidak memiliki izin untuk mengedit RAB', 'error');
      return;
    }

    try {
      const result = await rabAhspService.RabAhspService.prototype.updateRabItem(
        currentProject.id,
        rabItemId,
        updates
      );

      if (result.success) {
        addToast('RAB berhasil diupdate (Audit trail tercatat)', 'success');
        loadRabItems();
      } else {
        addToast(result.error?.message || 'Gagal update RAB', 'error');
      }
    } catch (error) {
      addToast('Error updating RAB', 'error');
    }
  };

  const handleDeleteRAB = async (rabItemId: number) => {
    if (!currentProject) return;

    // ✅ Only owner can delete
    if (!isOwner) {
      addToast('Hanya Owner yang dapat menghapus item RAB', 'error');
      return;
    }

    if (!confirm('Yakin ingin menghapus item RAB ini? Tindakan ini akan tercatat di audit trail.')) {
      return;
    }

    try {
      const result = await rabAhspService.RabAhspService.prototype.deleteRabItem(
        currentProject.id,
        rabItemId
      );

      if (result.success) {
        addToast('RAB berhasil dihapus (Audit trail tercatat)', 'success');
        loadRabItems();
      } else {
        addToast(result.error?.message || 'Gagal hapus RAB', 'error');
      }
    } catch (error) {
      addToast('Error deleting RAB', 'error');
    }
  };

  // ✅ Check view permission at page level
  if (!hasPermission('view_rab')) {
    return <AccessDenied message="Anda tidak memiliki akses untuk melihat RAB" />;
  }

  if (loading) {
    return <SpinnerPro size="lg" />;
  }

  return (
    <div className="p-6">
      {/* Role Badge */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rencana Anggaran Biaya (RAB)</h1>
        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          Role: {roleName}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="mb-4 flex gap-2">
        {/* ✅ Only show create button if user can edit */}
        <PermissionGate permission="edit_rab">
          <ButtonPro variant="primary" onClick={() => console.log('Create RAB')}>
            + Tambah Item RAB
          </ButtonPro>
        </PermissionGate>

        {/* ✅ Only Owner can see audit logs */}
        <PermissionGate anyOf={['view_audit_trail']}>
          <ButtonPro variant="secondary" onClick={() => console.log('View Audit')}>
            📋 Lihat Audit Trail
          </ButtonPro>
        </PermissionGate>
      </div>

      {/* RAB Items Table */}
      <CardPro>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">No</th>
              <th className="p-2 text-left">Uraian</th>
              <th className="p-2 text-right">Volume</th>
              <th className="p-2 text-right">Satuan</th>
              
              {/* ✅ Hide financial columns from Site Manager */}
              <PermissionGate permission="view_finances">
                <th className="p-2 text-right">Harga Satuan</th>
                <th className="p-2 text-right">Total</th>
              </PermissionGate>
              
              <th className="p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rabItems.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{item.no}</td>
                <td className="p-2">{item.uraian}</td>
                <td className="p-2 text-right">{item.volume}</td>
                <td className="p-2 text-right">{item.satuan}</td>
                
                {/* ✅ Financial data only for authorized roles */}
                <PermissionGate permission="view_finances">
                  <td className="p-2 text-right">
                    Rp {item.hargaSatuan.toLocaleString('id-ID')}
                  </td>
                  <td className="p-2 text-right font-semibold">
                    Rp {(item.hargaSatuan * item.volume).toLocaleString('id-ID')}
                  </td>
                </PermissionGate>
                
                <td className="p-2">
                  <div className="flex gap-2 justify-center">
                    {/* ✅ Edit button only for Owner/PM */}
                    <PermissionGate permission="edit_rab">
                      <ButtonPro
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateRAB(item.id, { volume: item.volume + 10 })}
                      >
                        ✏️ Edit
                      </ButtonPro>
                    </PermissionGate>
                    
                    {/* ✅ Delete button only for Owner */}
                    <PermissionGate 
                      permission="edit_rab" 
                      fallback={
                        <span className="text-xs text-gray-400">Owner only</span>
                      }
                    >
                      {isOwner && (
                        <ButtonPro
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteRAB(item.id)}
                        >
                          🗑️ Hapus
                        </ButtonPro>
                      )}
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ✅ Total only for financial viewers */}
        <PermissionGate permission="view_finances">
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total RAB:</span>
              <span className="text-xl font-bold text-blue-600">
                Rp {rabItems
                  .reduce((sum, item) => sum + item.hargaSatuan * item.volume, 0)
                  .toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </PermissionGate>
      </CardPro>

      {/* ✅ Profit Margin - Owner only */}
      <PermissionGate anyOf={['view_finances']}>
        {isOwner && (
          <CardPro className="mt-4 bg-green-50">
            <h3 className="font-semibold mb-2">🔒 Owner Only - Profit Margin</h3>
            <p className="text-green-700 text-lg font-bold">15.5%</p>
            <p className="text-sm text-gray-600">
              Data ini hanya terlihat oleh Owner (tidak terlihat oleh Site Manager)
            </p>
          </CardPro>
        )}
      </PermissionGate>

      {/* Info for non-financial users */}
      {!canViewFinancials && (
        <CardPro className="mt-4 bg-gray-50">
          <p className="text-sm text-gray-600">
            ℹ️ Sebagai <strong>{roleName}</strong>, Anda tidak dapat melihat data finansial.
            Hubungi Project Owner untuk mendapatkan akses.
          </p>
        </CardPro>
      )}
    </div>
  );
}
