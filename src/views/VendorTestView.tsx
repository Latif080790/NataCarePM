/**
 * Vendor Test View - untuk testing import sample vendors
 * Temporary view untuk development/testing purposes
 */

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { ButtonPro } from '@/components/ButtonPro';
import { CardPro } from '@/components/CardPro';
import { useToast } from '@/contexts/ToastContext';
import { Database, Upload, CheckCircle, XCircle } from 'lucide-react';

const SAMPLE_VENDORS = [
  {
    vendorCode: 'VEN-20251112-001',
    vendorName: 'PT Semen Indonesia',
    legalName: 'PT Semen Indonesia (Persero) Tbk',
    category: 'materials',
    status: 'active',
    email: 'procurement@semenindonesia.com',
    phone: '021-5252525',
    mobile: '0812-3456-7890',
    website: 'https://www.semenindonesia.com',
    address: 'Gedung Utama Semen Indonesia, Jl. Veteran No. 30',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12550',
    country: 'Indonesia',
    taxId: '01.234.567.8-901.000',
    businessLicenseNumber: 'NIB-1234567890123',
    registrationNumber: '01.234.567.8-901.000',
    paymentTerms: 'Net 30',
    currency: 'IDR',
    contactPerson: {
      name: 'Budi Santoso',
      title: 'Procurement Manager',
      email: 'budi.santoso@semenindonesia.com',
      phone: '0812-3456-7891',
      isPrimary: true
    },
    bankAccounts: [
      {
        bankName: 'Bank Mandiri',
        accountNumber: '1234567890',
        accountName: 'PT Semen Indonesia',
        branchName: 'Jakarta Veteran',
        swiftCode: 'BMRIIDJA',
        isPrimary: true
      }
    ],
    certifications: [
      {
        type: 'ISO 9001:2015',
        certificateNumber: 'ISO-9001-2023-001',
        issueDate: Timestamp.fromDate(new Date('2023-01-15')),
        expiryDate: Timestamp.fromDate(new Date('2026-01-15')),
        issuingBody: 'BSI Group',
        status: 'active'
      }
    ],
    performance: {
      totalPOs: 15,
      totalValue: 5000000000,
      completedPOs: 14,
      ongoingPOs: 1,
      averageDeliveryTime: 5,
      onTimeDeliveryRate: 93.3,
      qualityScore: 95,
      rating: 4.8,
      riskLevel: 'low',
      history: [
        {
          date: Timestamp.fromDate(new Date('2025-10-01')),
          metric: 'delivery',
          score: 95,
          notes: 'Pengiriman tepat waktu, kualitas baik'
        }
      ]
    },
    tags: ['preferred', 'iso-certified', 'large-supplier'],
    notes: 'Vendor terpercaya untuk semen. Sudah bekerjasama >5 tahun.',
    createdBy: 'system',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    vendorCode: 'VEN-20251112-002',
    vendorName: 'PT Wijaya Karya Beton',
    legalName: 'PT Wijaya Karya Beton Tbk',
    category: 'materials',
    status: 'active',
    email: 'sales@wika-beton.co.id',
    phone: '021-7918888',
    mobile: '0813-8888-9999',
    website: 'https://www.wika-beton.co.id',
    address: 'Jl. D.I. Panjaitan Kav. 9',
    city: 'Jakarta Timur',
    province: 'DKI Jakarta',
    postalCode: '13340',
    country: 'Indonesia',
    taxId: '01.987.654.3-211.000',
    businessLicenseNumber: 'NIB-9876543210987',
    registrationNumber: '01.987.654.3-211.000',
    paymentTerms: 'Net 45',
    currency: 'IDR',
    contactPerson: {
      name: 'Siti Rahmawati',
      title: 'Sales Manager',
      email: 'siti.r@wika-beton.co.id',
      phone: '0813-8888-9998',
      isPrimary: true
    },
    bankAccounts: [
      {
        bankName: 'BNI',
        accountNumber: '9876543210',
        accountName: 'PT Wijaya Karya Beton Tbk',
        branchName: 'Jakarta Panjaitan',
        swiftCode: 'BNINIDJA',
        isPrimary: true
      }
    ],
    certifications: [
      {
        type: 'ISO 9001:2015',
        certificateNumber: 'ISO-9001-2024-002',
        issueDate: Timestamp.fromDate(new Date('2024-02-01')),
        expiryDate: Timestamp.fromDate(new Date('2027-02-01')),
        issuingBody: 'TUV Nord',
        status: 'active'
      }
    ],
    performance: {
      totalPOs: 8,
      totalValue: 2500000000,
      completedPOs: 7,
      ongoingPOs: 1,
      averageDeliveryTime: 7,
      onTimeDeliveryRate: 87.5,
      qualityScore: 92,
      rating: 4.5,
      riskLevel: 'low',
      history: []
    },
    tags: ['beton', 'precast'],
    notes: 'Supplier beton precast berkualitas.',
    createdBy: 'system',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    vendorCode: 'VEN-20251112-003',
    vendorName: 'CV Maju Jaya Teknik',
    legalName: 'CV Maju Jaya Teknik',
    category: 'equipment',
    status: 'active',
    email: 'info@majujayateknik.com',
    phone: '021-8765432',
    mobile: '0856-7890-1234',
    website: 'https://www.majujayateknik.com',
    address: 'Jl. Raya Bekasi Km 18',
    city: 'Bekasi',
    province: 'Jawa Barat',
    postalCode: '17530',
    country: 'Indonesia',
    taxId: '02.456.789.0-123.000',
    businessLicenseNumber: 'NIB-4567890123456',
    registrationNumber: '02.456.789.0-123.000',
    paymentTerms: 'Net 30',
    currency: 'IDR',
    contactPerson: {
      name: 'Agus Setiawan',
      title: 'Owner',
      email: 'agus@majujayateknik.com',
      phone: '0856-7890-1235',
      isPrimary: true
    },
    bankAccounts: [
      {
        bankName: 'BCA',
        accountNumber: '4567890123',
        accountName: 'CV Maju Jaya Teknik',
        branchName: 'Bekasi Timur',
        swiftCode: 'CENAIDJA',
        isPrimary: true
      }
    ],
    certifications: [
      {
        type: 'SIUJK',
        certificateNumber: 'SIUJK-2024-001',
        issueDate: Timestamp.fromDate(new Date('2024-01-10')),
        expiryDate: Timestamp.fromDate(new Date('2027-01-10')),
        issuingBody: 'LPJK',
        status: 'active'
      }
    ],
    performance: {
      totalPOs: 5,
      totalValue: 800000000,
      completedPOs: 5,
      ongoingPOs: 0,
      averageDeliveryTime: 3,
      onTimeDeliveryRate: 100,
      qualityScore: 90,
      rating: 4.6,
      riskLevel: 'low',
      history: []
    },
    tags: ['equipment', 'tools', 'reliable'],
    notes: 'Penyewaan alat konstruksi. Service cepat.',
    createdBy: 'system',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

export default function VendorTestView() {
  const { addToast } = useToast();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; total: number } | null>(null);

  const importVendors = async () => {
    setImporting(true);
    setResults(null);

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const vendor of SAMPLE_VENDORS) {
        try {
          const docRef = await addDoc(collection(db, 'vendors'), vendor);
          console.log(`✅ Imported: ${vendor.vendorName} (ID: ${docRef.id})`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to import ${vendor.vendorName}:`, error);
          errorCount++;
        }
      }

      setResults({
        success: successCount,
        failed: errorCount,
        total: SAMPLE_VENDORS.length
      });

      if (successCount > 0) {
        addToast(`Successfully imported ${successCount} vendors!`, 'success');
      }
      if (errorCount > 0) {
        addToast(`Failed to import ${errorCount} vendors`, 'error');
      }

    } catch (error) {
      console.error('Import error:', error);
      addToast('Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <CardPro className="p-8">
        <div className="text-center mb-8">
          <Database className="w-16 h-16 mx-auto mb-4 text-persimmon" />
          <h1 className="text-3xl font-bold text-night-black mb-2">
            Vendor Data Import Tool
          </h1>
          <p className="text-palladium">
            Import sample vendor data untuk testing Vendor Management feature
          </p>
        </div>

        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-night-black mb-2">📦 Sample Data:</h3>
          <ul className="list-disc list-inside text-sm text-palladium space-y-1">
            <li>PT Semen Indonesia - Active, Rating 4.8/5.0</li>
            <li>PT Wijaya Karya Beton - Active, Rating 4.5/5.0</li>
            <li>CV Maju Jaya Teknik - Active, Equipment, Rating 4.6/5.0</li>
          </ul>
        </div>

        {results && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-night-black mb-3">Import Results:</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-success flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  {results.success}
                </div>
                <div className="text-sm text-palladium mt-1">Success</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-error flex items-center justify-center gap-2">
                  <XCircle className="w-6 h-6" />
                  {results.failed}
                </div>
                <div className="text-sm text-palladium mt-1">Failed</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-info">
                  {results.total}
                </div>
                <div className="text-sm text-palladium mt-1">Total</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <ButtonPro
            onClick={importVendors}
            disabled={importing}
            variant="primary"
            icon={Upload}
            className="px-8 py-3"
          >
            {importing ? 'Importing...' : 'Import Sample Vendors'}
          </ButtonPro>
        </div>

        {results && results.success > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-palladium mb-3">Data berhasil diimport! Test vendor management:</p>
            <ButtonPro
              onClick={() => window.location.href = '/vendor_management'}
              variant="outline"
            >
              Go to Vendor Management →
            </ButtonPro>
          </div>
        )}
      </CardPro>
    </div>
  );
}
