/**
 * Import Vendor Sample Data to Firestore
 * Run with: npx tsx scripts/import-vendors.ts
 */

import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Load environment variables
config({ path: '.env.local' });

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBl8-t0rqqyl56G28HkgG8S32_SZUEqFY8',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'natacara-hns.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'natacara-hns',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'natacara-hns.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '118063816239',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:118063816239:web:11b43366e18bc71e9170da',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Vendor sample data (inline untuk menghindari dependency issues)
const vendors = [
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
        issueDate: new Date('2023-01-15'),
        expiryDate: new Date('2026-01-15'),
        issuingBody: 'BSI Group',
        status: 'active'
      },
      {
        type: 'SNI',
        certificateNumber: 'SNI-2023-SEM-001',
        issueDate: new Date('2023-03-01'),
        expiryDate: new Date('2026-03-01'),
        issuingBody: 'BSN',
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
          date: new Date('2025-10-01'),
          metric: 'delivery',
          score: 95,
          notes: 'Pengiriman tepat waktu, kualitas baik'
        },
        {
          date: new Date('2025-09-01'),
          metric: 'quality',
          score: 94,
          notes: 'Produk sesuai spesifikasi'
        }
      ]
    },
    tags: ['preferred', 'iso-certified', 'large-supplier'],
    notes: 'Vendor terpercaya untuk semen. Sudah bekerjasama >5 tahun.',
    createdBy: 'system'
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
        issueDate: new Date('2024-02-01'),
        expiryDate: new Date('2027-02-01'),
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
      history: [
        {
          date: new Date('2025-10-15'),
          metric: 'delivery',
          score: 90,
          notes: 'Sedikit delay tapi kualitas baik'
        }
      ]
    },
    tags: ['beton', 'precast'],
    notes: 'Supplier beton precast berkualitas.',
    createdBy: 'system'
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
        issueDate: new Date('2024-01-10'),
        expiryDate: new Date('2027-01-10'),
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
      history: [
        {
          date: new Date('2025-11-01'),
          metric: 'service',
          score: 92,
          notes: 'Responsive dan profesional'
        }
      ]
    },
    tags: ['equipment', 'tools', 'reliable'],
    notes: 'Penyewaan alat konstruksi. Service cepat.',
    createdBy: 'system'
  },
  {
    vendorCode: 'VEN-20251112-004',
    vendorName: 'PT Surya Steel Indonesia',
    legalName: 'PT Surya Steel Indonesia',
    category: 'materials',
    status: 'pending_approval',
    email: 'sales@suryasteel.co.id',
    phone: '021-5555666',
    mobile: '0821-9999-8888',
    website: 'https://www.suryasteel.co.id',
    address: 'Kawasan Industri Cikarang',
    city: 'Cikarang',
    province: 'Jawa Barat',
    postalCode: '17550',
    country: 'Indonesia',
    taxId: '03.111.222.3-456.000',
    businessLicenseNumber: 'NIB-1112223456789',
    registrationNumber: '03.111.222.3-456.000',
    paymentTerms: 'Net 30',
    currency: 'IDR',
    contactPerson: {
      name: 'Rudi Hermawan',
      title: 'Marketing Manager',
      email: 'rudi@suryasteel.co.id',
      phone: '0821-9999-8887',
      isPrimary: true
    },
    bankAccounts: [
      {
        bankName: 'Bank Mandiri',
        accountNumber: '5556667778',
        accountName: 'PT Surya Steel Indonesia',
        branchName: 'Cikarang',
        swiftCode: 'BMRIIDJA',
        isPrimary: true
      }
    ],
    certifications: [
      {
        type: 'SNI',
        certificateNumber: 'SNI-2025-STEEL-001',
        issueDate: new Date('2025-01-05'),
        expiryDate: new Date('2028-01-05'),
        issuingBody: 'BSN',
        status: 'active'
      }
    ],
    performance: {
      totalPOs: 0,
      totalValue: 0,
      completedPOs: 0,
      ongoingPOs: 0,
      averageDeliveryTime: 0,
      onTimeDeliveryRate: 0,
      qualityScore: 0,
      rating: 0,
      riskLevel: 'medium',
      history: []
    },
    tags: ['new-vendor', 'steel', 'pending'],
    notes: 'Vendor baru, sedang proses evaluasi.',
    createdBy: 'system'
  },
  {
    vendorCode: 'VEN-20251112-005',
    vendorName: 'UD Berkah Jaya',
    legalName: 'UD Berkah Jaya',
    category: 'materials',
    status: 'blacklisted',
    email: 'contact@berkahjaya.com',
    phone: '021-9999888',
    mobile: '0877-6666-5555',
    address: 'Jl. Raya Cibitung No. 45',
    city: 'Bekasi',
    province: 'Jawa Barat',
    postalCode: '17520',
    country: 'Indonesia',
    taxId: '04.888.777.6-555.000',
    businessLicenseNumber: 'NIB-8887776555444',
    registrationNumber: '04.888.777.6-555.000',
    paymentTerms: 'Net 30',
    currency: 'IDR',
    contactPerson: {
      name: 'Ahmad Yani',
      title: 'Owner',
      email: 'ahmad@berkahjaya.com',
      phone: '0877-6666-5554',
      isPrimary: true
    },
    bankAccounts: [
      {
        bankName: 'BRI',
        accountNumber: '3332221110',
        accountName: 'UD Berkah Jaya',
        branchName: 'Bekasi Cibitung',
        swiftCode: 'BRINIDJA',
        isPrimary: true
      }
    ],
    certifications: [],
    performance: {
      totalPOs: 3,
      totalValue: 450000000,
      completedPOs: 2,
      ongoingPOs: 0,
      averageDeliveryTime: 25,
      onTimeDeliveryRate: 33.3,
      qualityScore: 45,
      rating: 2.1,
      riskLevel: 'high',
      history: [
        {
          date: new Date('2025-08-15'),
          metric: 'quality',
          score: 40,
          notes: 'Kualitas produk sangat buruk, banyak reject'
        },
        {
          date: new Date('2025-09-01'),
          metric: 'delivery',
          score: 30,
          notes: 'Terlambat 20 hari dari jadwal'
        }
      ]
    },
    blacklist: {
      isBlacklisted: true,
      reason: 'Kualitas buruk, sering terlambat, tidak responsif',
      blacklistedBy: 'admin',
      blacklistedAt: new Date('2025-10-01'),
      severity: 'high',
      affectedProjects: ['PRJ-001', 'PRJ-003'],
      evidenceDocuments: [],
      canAppeal: true,
      appealDeadline: new Date('2025-12-01'),
      effectiveUntil: new Date('2026-10-01'),
      isActive: true,
      attachments: []
    },
    tags: ['blacklisted', 'problematic'],
    notes: 'VENDOR DI-BLACKLIST. Jangan gunakan untuk project apapun. Kualitas sangat buruk.',
    createdBy: 'system'
  }
];

async function importVendors() {
  console.log('🚀 Starting vendor data import...\n');

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const vendor of vendors) {
      try {
        // Convert Date objects to Firestore Timestamps
        const vendorData: any = {
          ...vendor,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          certifications: vendor.certifications.map((cert: any) => ({
            ...cert,
            issueDate: cert.issueDate instanceof Date ? Timestamp.fromDate(cert.issueDate) : cert.issueDate,
            expiryDate: cert.expiryDate instanceof Date ? Timestamp.fromDate(cert.expiryDate) : cert.expiryDate,
          })),
          performance: {
            ...vendor.performance,
            history: vendor.performance.history.map((h: any) => ({
              ...h,
              date: h.date instanceof Date ? Timestamp.fromDate(h.date) : h.date,
            })),
          },
        };

        // Add blacklist timestamps if exists
        if (vendorData.blacklist && vendorData.blacklist.blacklistedAt instanceof Date) {
          vendorData.blacklist = {
            ...vendorData.blacklist,
            blacklistedAt: Timestamp.fromDate(vendorData.blacklist.blacklistedAt),
          };
        }

        const docRef = await addDoc(collection(db, 'vendors'), vendorData);
        console.log(`✅ Imported: ${vendor.vendorName} (ID: ${docRef.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to import ${vendor.vendorName}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📦 Total: ${vendors.length}`);

    if (successCount > 0) {
      console.log('\n🎉 Vendor data imported successfully!');
      console.log('   You can now test vendor management at: http://localhost:3001/vendor_management');
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run import
importVendors();
