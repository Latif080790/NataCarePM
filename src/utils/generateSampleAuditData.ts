/**
 * SAMPLE AUDIT DATA GENERATOR
 * 
 * Generates realistic sample audit logs for testing Enhanced Audit Trail
 * Day 5 - Integration Testing
 */

import { auditHelper } from './auditHelper';

/**
 * Generate comprehensive sample audit data across all modules
 */
export async function generateSampleAuditData(): Promise<void> {
  console.log('🔄 Generating sample audit data...');

  try {
    // 1. PROCUREMENT MODULE - Vendor Creation
    await auditHelper.logCreate({
      module: 'procurement',
      subModule: 'vendor_management',
      entityType: 'vendor',
      entityId: 'vendor_sample_001',
      entityName: 'PT Sumber Makmur Konstruksi',
      newData: {
        vendorCode: 'VEN-20241215-001',
        vendorName: 'PT Sumber Makmur Konstruksi',
        category: 'materials',
        status: 'pending_approval',
        email: 'info@sumbermakmur.co.id',
        phone: '+62 21 5551234',
      },
      metadata: {
        category: 'materials',
        status: 'pending_approval',
      },
    });
    console.log('✅ 1/15 - Vendor creation logged');

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100));

    // 2. PROCUREMENT - Vendor Approval
    await auditHelper.logApproval({
      module: 'procurement',
      entityType: 'vendor',
      entityId: 'vendor_sample_001',
      entityName: 'PT Sumber Makmur Konstruksi',
      approvalStage: 'vendor_registration',
      decision: 'approved',
      oldStatus: 'pending_approval',
      newStatus: 'active',
      comments: 'Vendor memenuhi semua kriteria kualifikasi',
      metadata: {
        vendorCode: 'VEN-20241215-001',
        category: 'materials',
      },
    });
    console.log('✅ 2/15 - Vendor approval logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. PROCUREMENT - Vendor Update
    await auditHelper.logUpdate({
      module: 'procurement',
      subModule: 'vendor_management',
      entityType: 'vendor',
      entityId: 'vendor_sample_001',
      entityName: 'PT Sumber Makmur Konstruksi',
      oldData: {
        phone: '+62 21 5551234',
        address: 'Jakarta Selatan',
      },
      newData: {
        phone: '+62 21 5559999',
        address: 'Jl. Raya Pasar Minggu No. 123, Jakarta Selatan',
      },
      metadata: {
        vendorCode: 'VEN-20241215-001',
        updatedFields: ['phone', 'address'],
      },
    });
    console.log('✅ 3/15 - Vendor update logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. LOGISTICS - Goods Receipt Creation
    await auditHelper.logCreate({
      module: 'logistics',
      subModule: 'goods_receipt',
      entityType: 'goods_receipt',
      entityId: 'gr_sample_001',
      entityName: 'GR-20241215-001',
      newData: {
        grNumber: 'GR-20241215-001',
        poNumber: 'PO-20241210-005',
        projectId: 'proj_sample_001',
        totalItems: 5,
        totalValue: 125000000,
      },
      metadata: {
        grNumber: 'GR-20241215-001',
        poNumber: 'PO-20241210-005',
        totalItems: 5,
        totalValue: 125000000,
      },
    });
    console.log('✅ 4/15 - Goods receipt creation logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 5. LOGISTICS - Goods Receipt Update
    await auditHelper.logUpdate({
      module: 'logistics',
      subModule: 'goods_receipt',
      entityType: 'goods_receipt',
      entityId: 'gr_sample_001',
      entityName: 'GR-20241215-001',
      oldData: {
        status: 'draft',
        receiverNotes: '',
      },
      newData: {
        status: 'draft',
        receiverNotes: 'Semua material dalam kondisi baik, sesuai spesifikasi',
      },
      metadata: {
        grNumber: 'GR-20241215-001',
        updatedFields: ['receiverNotes'],
      },
    });
    console.log('✅ 5/15 - Goods receipt update logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 6. LOGISTICS - Status Change
    await auditHelper.logStatusChange({
      module: 'logistics',
      entityType: 'goods_receipt',
      entityId: 'gr_sample_001',
      entityName: 'GR-20241215-001',
      oldStatus: 'draft',
      newStatus: 'submitted',
      reason: 'Penerimaan barang selesai, menunggu inspeksi quality control',
      metadata: {
        grNumber: 'GR-20241215-001',
      },
    });
    console.log('✅ 6/15 - Status change logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 7. PROCUREMENT - Vendor Blacklist (High Impact)
    await auditHelper.logCustom({
      action: 'Vendor blacklisted: Kualitas material tidak sesuai spesifikasi berulang kali',
      actionType: 'update',
      actionCategory: 'security',
      module: 'procurement',
      entityType: 'vendor',
      entityId: 'vendor_sample_002',
      entityName: 'PT Supplier Bermasalah',
      beforeSnapshot: { isBlacklisted: false, status: 'active' },
      afterSnapshot: { isBlacklisted: true, status: 'blacklisted' },
      subModule: 'blacklist_management',
      metadata: {
        vendorCode: 'VEN-20241201-015',
        blacklistReason: 'Kualitas material tidak sesuai spesifikasi berulang kali',
        blacklistCategory: 'quality_issues',
        severity: 'high',
      },
    });
    console.log('✅ 7/15 - Vendor blacklist logged (HIGH IMPACT)');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 8. FINANCE - Export Operation
    await auditHelper.logCustom({
      action: 'Exported financial report to Excel',
      actionType: 'export',
      actionCategory: 'finance',
      module: 'finance',
      entityType: 'financial_report',
      entityId: 'export_sample_001',
      entityName: 'Laporan Keuangan Q4 2024',
      metadata: {
        exportFormat: 'xlsx',
        reportPeriod: 'Q4 2024',
        recordCount: 1250,
        fileSize: '2.3 MB',
      },
    });
    console.log('✅ 8/15 - Export operation logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 9. LOGISTICS - Bulk Operation
    await auditHelper.logBulkAction({
      module: 'logistics',
      action: 'Import',
      entityType: 'inventory_item',
      entityCount: 45,
      actionType: 'create',
      metadata: {
        importSource: 'Excel file',
        fileName: 'inventory_import_20241215.xlsx',
        successCount: 43,
        failedCount: 2,
      },
    });
    console.log('✅ 9/15 - Bulk import logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 10. PROCUREMENT - PO Approval
    await auditHelper.logApproval({
      module: 'procurement',
      entityType: 'purchase_order',
      entityId: 'po_sample_003',
      entityName: 'PO-20241215-003',
      approvalStage: 'manager_approval',
      decision: 'approved',
      oldStatus: 'pending_approval',
      newStatus: 'approved',
      comments: 'Budget tersedia, vendor terverifikasi, disetujui untuk proses lebih lanjut',
      metadata: {
        poNumber: 'PO-20241215-003',
        totalAmount: 250000000,
        approvalLevel: 'manager',
      },
    });
    console.log('✅ 10/15 - PO approval logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 11. SECURITY - Configuration Change (Critical Impact)
    await auditHelper.logCustom({
      action: 'Modified system security settings',
      actionType: 'update',
      actionCategory: 'security',
      module: 'system',
      entityType: 'system_config',
      entityId: 'config_security_001',
      entityName: 'Security Configuration',
      beforeSnapshot: {
        passwordMinLength: 8,
        requireMFA: false,
        sessionTimeout: 3600,
      },
      afterSnapshot: {
        passwordMinLength: 12,
        requireMFA: true,
        sessionTimeout: 1800,
      },
      subModule: 'security_settings',
      metadata: {
        changeReason: 'Compliance dengan standar keamanan ISO 27001',
        affectedUsers: 150,
      },
    });
    console.log('✅ 11/15 - Security config change logged (CRITICAL IMPACT)');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 12. PROJECT - Project Update
    await auditHelper.logUpdate({
      module: 'project',
      entityType: 'project',
      entityId: 'proj_sample_001',
      entityName: 'Pembangunan Gedung Perkantoran XYZ',
      oldData: {
        progress: 45.5,
        status: 'in_progress',
        budget: 5000000000,
      },
      newData: {
        progress: 52.3,
        status: 'in_progress',
        budget: 5250000000,
      },
      metadata: {
        projectCode: 'PROJ-2024-001',
        progressChange: 6.8,
        budgetRevision: 250000000,
      },
    });
    console.log('✅ 12/15 - Project update logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 13. LOGISTICS - Material Request Creation
    await auditHelper.logCreate({
      module: 'logistics',
      subModule: 'material_request',
      entityType: 'material_request',
      entityId: 'mr_sample_001',
      entityName: 'MR-20241215-001',
      newData: {
        mrNumber: 'MR-20241215-001',
        requestedBy: 'Site Engineer',
        projectId: 'proj_sample_001',
        totalItems: 8,
        priority: 'high',
      },
      metadata: {
        mrNumber: 'MR-20241215-001',
        priority: 'high',
        totalItems: 8,
      },
    });
    console.log('✅ 13/15 - Material request creation logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 14. FINANCE - Journal Entry Creation
    await auditHelper.logCreate({
      module: 'finance',
      subModule: 'journal_entries',
      entityType: 'journal_entry',
      entityId: 'je_sample_001',
      entityName: 'JE-20241215-001',
      newData: {
        journalNumber: 'JE-20241215-001',
        transactionType: 'material_purchase',
        debitAmount: 125000000,
        creditAmount: 125000000,
        description: 'Pembelian material konstruksi',
      },
      metadata: {
        journalNumber: 'JE-20241215-001',
        transactionType: 'material_purchase',
        totalAmount: 125000000,
      },
    });
    console.log('✅ 14/15 - Journal entry creation logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 15. PROCUREMENT - PO Rejection
    await auditHelper.logApproval({
      module: 'procurement',
      entityType: 'purchase_order',
      entityId: 'po_sample_004',
      entityName: 'PO-20241215-004',
      approvalStage: 'director_approval',
      decision: 'rejected',
      oldStatus: 'pending_approval',
      newStatus: 'rejected',
      comments: 'Harga terlalu tinggi dibanding market price, vendor tidak memiliki sertifikasi ISO',
      metadata: {
        poNumber: 'PO-20241215-004',
        totalAmount: 500000000,
        rejectionReason: 'price_too_high',
        approvalLevel: 'director',
      },
    });
    console.log('✅ 15/15 - PO rejection logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // ========================================================================
    // FINANCE MODULE - Journal Entries
    // ========================================================================

    // 16. FINANCE - Journal Entry Creation
    await auditHelper.logCreate({
      module: 'finance',
      entityType: 'journal_entry',
      entityId: 'je_sample_001',
      entityName: 'JE-2024-1215',
      newData: {
        entryNumber: 'JE-2024-1215',
        description: 'Material purchase payment',
        entryType: 'standard',
        totalDebit: 50000000,
        totalCredit: 50000000,
        isBalanced: true,
        linesCount: 2,
        status: 'draft',
      },
      metadata: {
        entryDate: new Date().toISOString(),
        baseCurrency: 'IDR',
      },
    });
    console.log('✅ 16/35 - Journal entry creation logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 17. FINANCE - Journal Entry Approval
    await auditHelper.logApproval({
      module: 'finance',
      entityType: 'journal_entry',
      entityId: 'je_sample_001',
      entityName: 'JE-2024-1215',
      approvalStage: 'manager_approval',
      decision: 'approved',
      oldStatus: 'pending_approval',
      newStatus: 'approved',
      metadata: {
        entryNumber: 'JE-2024-1215',
        totalDebit: 50000000,
        totalCredit: 50000000,
      },
    });
    console.log('✅ 17/35 - Journal entry approval logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 18. FINANCE - Large Journal Entry (High Impact)
    await auditHelper.logCreate({
      module: 'finance',
      entityType: 'journal_entry',
      entityId: 'je_sample_002',
      entityName: 'JE-2024-1216',
      newData: {
        entryNumber: 'JE-2024-1216',
        description: 'Project advance payment - 150M',
        entryType: 'standard',
        totalDebit: 150000000,
        totalCredit: 150000000,
        isBalanced: true,
        linesCount: 3,
        status: 'approved',
      },
      metadata: {
        entryDate: new Date().toISOString(),
        baseCurrency: 'IDR',
        impactLevel: 'high',
      },
    });
    console.log('✅ 18/35 - Large journal entry logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 19. FINANCE - Journal Entry Update
    await auditHelper.logUpdate({
      module: 'finance',
      entityType: 'journal_entry',
      entityId: 'je_sample_001',
      entityName: 'JE-2024-1215',
      oldData: {
        description: 'Material purchase payment',
        totalDebit: 50000000,
        totalCredit: 50000000,
        linesCount: 2,
      },
      newData: {
        description: 'Material purchase payment - Revised',
        totalDebit: 52000000,
        totalCredit: 52000000,
        linesCount: 3,
      },
      metadata: {
        entryNumber: 'JE-2024-1215',
        status: 'draft',
        updatedFields: ['description', 'lines', 'totalDebit', 'totalCredit'],
      },
    });
    console.log('✅ 19/35 - Journal entry update logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 20. FINANCE - Journal Entry Deletion
    await auditHelper.logDelete({
      module: 'finance',
      entityType: 'journal_entry',
      entityId: 'je_sample_draft',
      entityName: 'JE-2024-DRAFT-001',
      oldData: {
        entryNumber: 'JE-2024-DRAFT-001',
        description: 'Draft entry - to be deleted',
        status: 'draft',
        totalDebit: 1000000,
        totalCredit: 1000000,
      },
      metadata: {
        reason: 'Draft entry deleted - duplicate',
      },
    });
    console.log('✅ 20/35 - Journal entry deletion logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // ========================================================================
    // MATERIAL REQUEST MODULE - Full Workflow
    // ========================================================================

    // 21. MATERIAL REQUEST - MR Creation
    await auditHelper.logCreate({
      module: 'logistics',
      entityType: 'material_request',
      entityId: 'mr_sample_001',
      entityName: 'MR-20241215-0001',
      newData: {
        mrNumber: 'MR-20241215-0001',
        projectId: 'project_demo',
        status: 'draft',
        priority: 'high',
        requiredDate: '2024-12-20',
        totalItems: 5,
        totalEstimatedValue: 25000000,
      },
      metadata: {
        purpose: 'Construction materials for foundation work',
        requestedBy: 'Site Manager',
        itemsCount: 5,
      },
    });
    console.log('✅ 21/35 - Material request creation logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 22. MATERIAL REQUEST - MR Update
    await auditHelper.logUpdate({
      module: 'logistics',
      entityType: 'material_request',
      entityId: 'mr_sample_001',
      entityName: 'MR-20241215-0001',
      oldData: {
        priority: 'high',
        requiredDate: '2024-12-20',
        purpose: 'Construction materials for foundation work',
        totalItems: 5,
      },
      newData: {
        priority: 'urgent',
        requiredDate: '2024-12-18',
        purpose: 'URGENT: Construction materials for foundation work - Schedule accelerated',
        totalItems: 7,
      },
      metadata: {
        mrNumber: 'MR-20241215-0001',
        updatedFields: ['priority', 'requiredDate', 'purpose', 'items'],
      },
    });
    console.log('✅ 22/35 - Material request update logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 23. MATERIAL REQUEST - Site Manager Approval
    await auditHelper.logApproval({
      module: 'logistics',
      entityType: 'material_request',
      entityId: 'mr_sample_001',
      entityName: 'MR-20241215-0001',
      approvalStage: 'site_manager',
      decision: 'approved',
      comments: 'Materials urgently needed for foundation work. Approved.',
      oldStatus: 'submitted',
      newStatus: 'pm_review',
      metadata: {
        mrNumber: 'MR-20241215-0001',
        totalEstimatedValue: 27500000,
        approverRole: 'site_manager',
      },
    });
    console.log('✅ 23/35 - MR site manager approval logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 24. MATERIAL REQUEST - PM Approval
    await auditHelper.logApproval({
      module: 'logistics',
      entityType: 'material_request',
      entityId: 'mr_sample_001',
      entityName: 'MR-20241215-0001',
      approvalStage: 'pm',
      decision: 'approved',
      comments: 'Verified with project schedule. Approved for budget check.',
      oldStatus: 'pm_review',
      newStatus: 'budget_check',
      metadata: {
        mrNumber: 'MR-20241215-0001',
        totalEstimatedValue: 27500000,
        approverRole: 'pm',
      },
    });
    console.log('✅ 24/35 - MR PM approval logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 25. MATERIAL REQUEST - Budget Controller Approval
    await auditHelper.logApproval({
      module: 'logistics',
      entityType: 'material_request',
      entityId: 'mr_sample_001',
      entityName: 'MR-20241215-0001',
      approvalStage: 'budget_controller',
      decision: 'approved',
      comments: 'Budget available in WBS. Final approval granted.',
      oldStatus: 'budget_check',
      newStatus: 'approved',
      metadata: {
        mrNumber: 'MR-20241215-0001',
        totalEstimatedValue: 27500000,
        budgetStatus: 'sufficient',
      },
    });
    console.log('✅ 25/35 - MR budget approval logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 26. MATERIAL REQUEST - Convert to PO
    await auditHelper.logStatusChange({
      module: 'logistics',
      entityType: 'material_request',
      entityId: 'mr_sample_001',
      entityName: 'MR-20241215-0001',
      oldStatus: 'approved',
      newStatus: 'converted_to_po',
      metadata: {
        mrNumber: 'MR-20241215-0001',
        poNumber: 'PO-20241215-0001',
        poId: 'po_sample_003',
        vendorId: 'vendor_sample_001',
        totalAmount: 27500000,
        itemsCount: 7,
      },
    });
    console.log('✅ 26/35 - MR to PO conversion logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 27. MATERIAL REQUEST - Rejection
    await auditHelper.logApproval({
      module: 'logistics',
      entityType: 'material_request',
      entityId: 'mr_sample_002',
      entityName: 'MR-20241215-0002',
      approvalStage: 'budget_controller',
      decision: 'rejected',
      comments: 'Insufficient budget. Request WBS reallocation.',
      oldStatus: 'budget_check',
      newStatus: 'rejected',
      metadata: {
        mrNumber: 'MR-20241215-0002',
        totalEstimatedValue: 85000000,
        rejectionReason: 'Budget exceeded',
      },
    });
    console.log('✅ 27/35 - MR rejection logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 28. MATERIAL REQUEST - MR Deletion
    await auditHelper.logDelete({
      module: 'logistics',
      entityType: 'material_request',
      entityId: 'mr_sample_draft',
      entityName: 'MR-20241215-DRAFT',
      oldData: {
        mrNumber: 'MR-20241215-DRAFT',
        status: 'draft',
        totalItems: 2,
        totalEstimatedValue: 3000000,
        projectId: 'project_demo',
      },
      metadata: {
        reason: 'Draft MR deleted',
      },
    });
    console.log('✅ 28/35 - Material request deletion logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // ========================================================================
    // INVENTORY MODULE - Transactions & Stock Count
    // ========================================================================

    // 29. INVENTORY - Stock IN Transaction
    await auditHelper.logCreate({
      module: 'logistics',
      entityType: 'inventory_transaction',
      entityId: 'txn_sample_001',
      entityName: 'TXN-IN-20241215-001',
      newData: {
        transactionCode: 'TXN-IN-20241215-001',
        transactionType: 'IN',
        warehouseName: 'Central Warehouse',
        itemsCount: 3,
        totalValue: 15000000,
        status: 'draft',
      },
      metadata: {
        reason: 'Goods receipt from PO-20241215-0001',
        createdBy: 'Warehouse Staff',
      },
    });
    console.log('✅ 29/35 - Inventory IN transaction logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 30. INVENTORY - Stock OUT Transaction
    await auditHelper.logCreate({
      module: 'logistics',
      entityType: 'inventory_transaction',
      entityId: 'txn_sample_002',
      entityName: 'TXN-OUT-20241215-001',
      newData: {
        transactionCode: 'TXN-OUT-20241215-001',
        transactionType: 'OUT',
        warehouseName: 'Site Warehouse A',
        itemsCount: 5,
        totalValue: 8500000,
        status: 'draft',
      },
      metadata: {
        reason: 'Material issue for foundation work',
        createdBy: 'Site Engineer',
      },
    });
    console.log('✅ 30/35 - Inventory OUT transaction logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 31. INVENTORY - Stock Adjustment (Requires Approval)
    await auditHelper.logCreate({
      module: 'logistics',
      entityType: 'inventory_transaction',
      entityId: 'txn_sample_003',
      entityName: 'TXN-ADJ-20241215-001',
      newData: {
        transactionCode: 'TXN-ADJ-20241215-001',
        transactionType: 'ADJUSTMENT',
        warehouseName: 'Central Warehouse',
        itemsCount: 2,
        totalValue: -500000,
        status: 'pending_approval',
      },
      metadata: {
        reason: 'Damaged materials - water exposure',
        createdBy: 'Warehouse Manager',
      },
    });
    console.log('✅ 31/35 - Inventory adjustment logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 32. INVENTORY - Transaction Approval
    await auditHelper.logApproval({
      module: 'logistics',
      entityType: 'inventory_transaction',
      entityId: 'txn_sample_003',
      entityName: 'TXN-ADJ-20241215-001',
      approvalStage: 'manager_approval',
      decision: 'approved',
      comments: 'Verified damaged materials. Adjustment approved.',
      oldStatus: 'pending_approval',
      newStatus: 'approved',
      metadata: {
        transactionType: 'ADJUSTMENT',
        totalValue: -500000,
        approver: 'Logistics Manager',
      },
    });
    console.log('✅ 32/35 - Inventory transaction approval logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 33. INVENTORY - Transaction Completion
    await auditHelper.logStatusChange({
      module: 'logistics',
      entityType: 'inventory_transaction',
      entityId: 'txn_sample_001',
      entityName: 'TXN-IN-20241215-001',
      oldStatus: 'draft',
      newStatus: 'completed',
      metadata: {
        transactionType: 'IN',
        totalValue: 15000000,
        itemsCount: 3,
        completedBy: 'Warehouse Staff',
      },
    });
    console.log('✅ 33/35 - Inventory transaction completion logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 34. INVENTORY - Stock Transfer
    await auditHelper.logCreate({
      module: 'logistics',
      entityType: 'inventory_transaction',
      entityId: 'txn_sample_004',
      entityName: 'TXN-TRF-20241215-001',
      newData: {
        transactionCode: 'TXN-TRF-20241215-001',
        transactionType: 'TRANSFER',
        warehouseName: 'Central Warehouse → Site Warehouse B',
        itemsCount: 4,
        totalValue: 12000000,
        status: 'draft',
      },
      metadata: {
        reason: 'Stock transfer for new site location',
        createdBy: 'Warehouse Coordinator',
      },
    });
    console.log('✅ 34/35 - Inventory transfer logged');

    await new Promise(resolve => setTimeout(resolve, 100));

    // 35. INVENTORY - Stock Count Approval
    await auditHelper.logApproval({
      module: 'logistics',
      entityType: 'stock_count',
      entityId: 'count_sample_001',
      entityName: 'SC-20241215-001',
      approvalStage: 'stock_count_approval',
      decision: 'approved',
      oldStatus: 'completed',
      newStatus: 'approved',
      metadata: {
        countNumber: 'SC-20241215-001',
        warehouseId: 'warehouse_central',
        itemsCount: 150,
        discrepanciesFound: 5,
        adjustmentTransactionId: 'txn_adj_auto_001',
        approver: 'Logistics Manager',
      },
    });
    console.log('✅ 35/35 - Stock count approval logged');

    console.log('');
    console.log('🎉 Sample audit data generation COMPLETE!');
    console.log('📊 Generated 35 comprehensive audit logs across ALL modules:');
    console.log('   - Procurement: 7 logs (vendor, PO approvals)');
    console.log('   - Logistics (GR): 6 logs (goods receipt)');
    console.log('   - Finance: 6 logs (journal entries - create, update, approve, delete)');
    console.log('   - Material Request: 8 logs (full MR workflow with multi-stage approval)');
    console.log('   - Inventory: 8 logs (IN/OUT/ADJUSTMENT/TRANSFER, stock count)');
    console.log('');
    console.log('✨ All logs include realistic metadata, timestamps, and multi-level approval workflows');
    console.log('🔍 Navigate to /settings/audit-trail-enhanced to view all logs');
    console.log('🧪 Test filtering by: Module, Action Type, Status, Impact Level');

  } catch (error) {
    console.error('❌ Error generating sample audit data:', error);
    throw error;
  }
}

/**
 * Quick test function to verify audit logging works
 */
export async function testAuditLogging(): Promise<void> {
  console.log('🧪 Testing audit logging...');
  
  try {
    await auditHelper.logCreate({
      module: 'system',
      entityType: 'test',
      entityId: 'test_001',
      entityName: 'Test Audit Log',
      newData: { test: true },
    });
    
    console.log('✅ Audit logging test passed!');
  } catch (error) {
    console.error('❌ Audit logging test failed:', error);
    throw error;
  }
}
