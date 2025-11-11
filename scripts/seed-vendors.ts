/**
 * SEED SCRIPT - VENDOR SAMPLE DATA
 * 
 * Script untuk menambahkan sample data vendor ke Firestore
 * Untuk testing dan demo purposes
 * 
 * Usage: Run this from Firebase console or node script
 */

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../src/firebaseConfig';

const SAMPLE_VENDORS = [
  {
    vendorCode: 'VEN-20251112-001',
    vendorName: 'PT Semen Indonesia',
    legalName: 'PT Semen Indonesia (Persero) Tbk',
    category: 'materials' as const,
    status: 'active' as const,
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
    businessType: 'PT',
    establishedYear: 1957,
    employeeCount: 5000,
    annualRevenue: 50000000000,
    paymentTerm: 'net_30' as const,
    currency: 'IDR',
    contacts: [
      {
        id: 'contact_1',
        name: 'Budi Santoso',
        position: 'Sales Manager',
        email: 'budi.santoso@semenindonesia.com',
        phone: '021-5252525',
        mobile: '0812-3456-7890',
        isPrimary: true
      }
    ],
    bankAccounts: [
      {
        id: 'bank_1',
        bankName: 'Bank Mandiri',
        accountNumber: '1234567890',
        accountHolderName: 'PT Semen Indonesia',
        branch: 'Jakarta Pusat',
        swiftCode: 'BMRIIDJA',
        isPrimary: true
      }
    ],
    performance: {
      vendorId: '',
      totalPOs: 15,
      totalPOValue: 5000000000,
      completedPOs: 12,
      cancelledPOs: 0,
      onTimeDeliveries: 11,
      lateDeliveries: 1,
      onTimeDeliveryRate: 91.67,
      averageDeliveryDelay: 0.5,
      totalGRs: 12,
      acceptedGRs: 12,
      rejectedGRs: 0,
      qualityAcceptanceRate: 100,
      totalPaid: 4500000000,
      totalOutstanding: 500000000,
      averagePaymentDelay: 2,
      totalEvaluations: 5,
      averageEvaluationScore: 92,
      latestRating: 'excellent' as const,
      performanceScore: 93.5,
      riskLevel: 'low' as const
    },
    certifications: ['ISO 9001:2015', 'ISO 14001:2015'],
    certificationExpiryDates: {
      'ISO 9001:2015': '2026-12-31',
      'ISO 14001:2015': '2026-12-31'
    },
    productServices: ['Semen Portland', 'Semen PCC', 'Agregat'],
    serviceAreas: ['DKI Jakarta', 'Jawa Barat', 'Banten'],
    capacity: '10,000 ton/month',
    overallRating: 'excellent' as const,
    isBlacklisted: false,
    blacklistRecords: [],
    createdBy: 'system',
    createdAt: new Date('2024-01-15').toISOString(),
    notes: 'Vendor terpercaya untuk material semen. Kualitas produk sangat baik dan pengiriman selalu tepat waktu.',
    tags: ['premium', 'reliable', 'certified']
  },
  {
    vendorCode: 'VEN-20251112-002',
    vendorName: 'PT Wijaya Karya Beton',
    legalName: 'PT Wijaya Karya Beton Tbk',
    category: 'materials' as const,
    status: 'active' as const,
    email: 'sales@wika-beton.co.id',
    phone: '021-7562929',
    mobile: '0813-8765-4321',
    website: 'https://www.wika-beton.co.id',
    address: 'Wisma WIKA, Jl. D.I. Panjaitan Kav. 9',
    city: 'Jakarta Timur',
    province: 'DKI Jakarta',
    postalCode: '13340',
    country: 'Indonesia',
    taxId: '01.345.678.9-012.000',
    businessLicenseNumber: 'NIB-2345678901234',
    registrationNumber: '01.345.678.9-012.000',
    businessType: 'PT',
    establishedYear: 1997,
    employeeCount: 3500,
    annualRevenue: 30000000000,
    paymentTerm: 'net_45' as const,
    currency: 'IDR',
    contacts: [
      {
        id: 'contact_1',
        name: 'Andi Wijaya',
        position: 'Marketing Director',
        email: 'andi.wijaya@wika-beton.co.id',
        phone: '021-7562929',
        mobile: '0813-8765-4321',
        isPrimary: true
      }
    ],
    bankAccounts: [
      {
        id: 'bank_1',
        bankName: 'Bank BNI',
        accountNumber: '0987654321',
        accountHolderName: 'PT Wijaya Karya Beton',
        branch: 'Jakarta Cikini',
        swiftCode: 'BNINIDJA',
        isPrimary: true
      }
    ],
    performance: {
      vendorId: '',
      totalPOs: 8,
      totalPOValue: 2500000000,
      completedPOs: 7,
      cancelledPOs: 0,
      onTimeDeliveries: 6,
      lateDeliveries: 1,
      onTimeDeliveryRate: 85.71,
      averageDeliveryDelay: 1,
      totalGRs: 7,
      acceptedGRs: 7,
      rejectedGRs: 0,
      qualityAcceptanceRate: 100,
      totalPaid: 2000000000,
      totalOutstanding: 500000000,
      averagePaymentDelay: 3,
      totalEvaluations: 3,
      averageEvaluationScore: 85,
      latestRating: 'good' as const,
      performanceScore: 87.5,
      riskLevel: 'low' as const
    },
    certifications: ['ISO 9001:2015'],
    certificationExpiryDates: {
      'ISO 9001:2015': '2025-12-31'
    },
    productServices: ['Beton Ready Mix', 'Precast', 'Pile Foundation'],
    serviceAreas: ['Jabodetabek', 'Jawa Barat'],
    capacity: '5,000 m³/month',
    overallRating: 'good' as const,
    isBlacklisted: false,
    blacklistRecords: [],
    createdBy: 'system',
    createdAt: new Date('2024-02-20').toISOString(),
    notes: 'Vendor beton ready mix dengan kualitas baik. Sesekali terlambat pengiriman.',
    tags: ['reliable', 'certified']
  },
  {
    vendorCode: 'VEN-20251112-003',
    vendorName: 'CV Maju Jaya Teknik',
    legalName: 'CV Maju Jaya Teknik',
    category: 'equipment' as const,
    status: 'active' as const,
    email: 'info@majujayateknik.com',
    phone: '021-8901234',
    mobile: '0821-9876-5432',
    website: 'https://www.majujayateknik.com',
    address: 'Jl. Raya Bekasi Km 18',
    city: 'Bekasi',
    province: 'Jawa Barat',
    postalCode: '17147',
    country: 'Indonesia',
    taxId: '02.456.789.0-123.000',
    businessLicenseNumber: 'NIB-3456789012345',
    registrationNumber: '02.456.789.0-123.000',
    businessType: 'CV',
    establishedYear: 2010,
    employeeCount: 150,
    annualRevenue: 5000000000,
    paymentTerm: 'net_30' as const,
    currency: 'IDR',
    contacts: [
      {
        id: 'contact_1',
        name: 'Hendra Gunawan',
        position: 'Owner',
        email: 'hendra@majujayateknik.com',
        phone: '021-8901234',
        mobile: '0821-9876-5432',
        isPrimary: true
      }
    ],
    bankAccounts: [
      {
        id: 'bank_1',
        bankName: 'Bank BCA',
        accountNumber: '5678901234',
        accountHolderName: 'CV Maju Jaya Teknik',
        branch: 'Bekasi Harapan Indah',
        swiftCode: 'CENAIDJA',
        isPrimary: true
      }
    ],
    performance: {
      vendorId: '',
      totalPOs: 5,
      totalPOValue: 1200000000,
      completedPOs: 4,
      cancelledPOs: 0,
      onTimeDeliveries: 3,
      lateDeliveries: 1,
      onTimeDeliveryRate: 75,
      averageDeliveryDelay: 2,
      totalGRs: 4,
      acceptedGRs: 4,
      rejectedGRs: 0,
      qualityAcceptanceRate: 100,
      totalPaid: 900000000,
      totalOutstanding: 300000000,
      averagePaymentDelay: 5,
      totalEvaluations: 2,
      averageEvaluationScore: 78,
      latestRating: 'good' as const,
      performanceScore: 79.2,
      riskLevel: 'medium' as const
    },
    certifications: [],
    certificationExpiryDates: {},
    productServices: ['Alat Berat', 'Scaffolding', 'Concrete Pump'],
    serviceAreas: ['Jabodetabek'],
    capacity: 'Varied by equipment type',
    overallRating: 'good' as const,
    isBlacklisted: false,
    blacklistRecords: [],
    createdBy: 'system',
    createdAt: new Date('2024-03-10').toISOString(),
    notes: 'Vendor peralatan konstruksi lokal. Harga kompetitif namun kadang terlambat.',
    tags: ['local', 'equipment']
  },
  {
    vendorCode: 'VEN-20251112-004',
    vendorName: 'PT Surya Steel Indonesia',
    legalName: 'PT Surya Steel Indonesia',
    category: 'materials' as const,
    status: 'pending_approval' as const,
    email: 'sales@suryasteel.co.id',
    phone: '021-4567890',
    mobile: '0822-3456-7890',
    website: 'https://www.suryasteel.co.id',
    address: 'Kawasan Industri Jababeka Blok D-10',
    city: 'Cikarang',
    province: 'Jawa Barat',
    postalCode: '17530',
    country: 'Indonesia',
    taxId: '03.567.890.1-234.000',
    businessLicenseNumber: 'NIB-4567890123456',
    registrationNumber: '03.567.890.1-234.000',
    businessType: 'PT',
    paymentTerm: 'net_30' as const,
    currency: 'IDR',
    contacts: [
      {
        id: 'contact_1',
        name: 'Rini Kurniawan',
        position: 'Sales Executive',
        email: 'rini@suryasteel.co.id',
        phone: '021-4567890',
        mobile: '0822-3456-7890',
        isPrimary: true
      }
    ],
    bankAccounts: [
      {
        id: 'bank_1',
        bankName: 'Bank Mandiri',
        accountNumber: '1357902468',
        accountHolderName: 'PT Surya Steel Indonesia',
        branch: 'Cikarang',
        swiftCode: 'BMRIIDJA',
        isPrimary: true
      }
    ],
    performance: {
      vendorId: '',
      totalPOs: 0,
      totalPOValue: 0,
      completedPOs: 0,
      cancelledPOs: 0,
      onTimeDeliveries: 0,
      lateDeliveries: 0,
      onTimeDeliveryRate: 0,
      averageDeliveryDelay: 0,
      totalGRs: 0,
      acceptedGRs: 0,
      rejectedGRs: 0,
      qualityAcceptanceRate: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      averagePaymentDelay: 0,
      totalEvaluations: 0,
      averageEvaluationScore: 0,
      latestRating: 'not_rated' as const,
      performanceScore: 0,
      riskLevel: 'low' as const
    },
    certifications: ['ISO 9001:2015'],
    certificationExpiryDates: {
      'ISO 9001:2015': '2026-06-30'
    },
    productServices: ['Besi Beton', 'WF Beam', 'Steel Plate'],
    serviceAreas: ['Jabodetabek', 'Jawa Barat'],
    capacity: '3,000 ton/month',
    overallRating: 'not_rated' as const,
    isBlacklisted: false,
    blacklistRecords: [],
    createdBy: 'system',
    createdAt: new Date('2024-11-01').toISOString(),
    notes: 'Vendor baru, sedang dalam proses approval.',
    tags: ['new', 'materials']
  },
  {
    vendorCode: 'VEN-20251112-005',
    vendorName: 'UD Berkah Jaya',
    legalName: 'UD Berkah Jaya',
    category: 'materials' as const,
    status: 'blacklisted' as const,
    email: 'berkah.jaya@gmail.com',
    phone: '021-9012345',
    mobile: '0823-4567-8901',
    address: 'Jl. Raya Cibinong No. 123',
    city: 'Bogor',
    province: 'Jawa Barat',
    postalCode: '16914',
    country: 'Indonesia',
    taxId: '04.678.901.2-345.000',
    businessLicenseNumber: 'NIB-5678901234567',
    registrationNumber: '04.678.901.2-345.000',
    businessType: 'UD',
    paymentTerm: 'cash' as const,
    currency: 'IDR',
    contacts: [
      {
        id: 'contact_1',
        name: 'Ahmad Yani',
        position: 'Owner',
        email: 'ahmad@berkahjaya.com',
        phone: '021-9012345',
        mobile: '0823-4567-8901',
        isPrimary: true
      }
    ],
    bankAccounts: [
      {
        id: 'bank_1',
        bankName: 'Bank BRI',
        accountNumber: '2468013579',
        accountHolderName: 'Ahmad Yani',
        branch: 'Cibinong',
        swiftCode: 'BRINIDJA',
        isPrimary: true
      }
    ],
    performance: {
      vendorId: '',
      totalPOs: 3,
      totalPOValue: 500000000,
      completedPOs: 1,
      cancelledPOs: 1,
      onTimeDeliveries: 0,
      lateDeliveries: 1,
      onTimeDeliveryRate: 0,
      averageDeliveryDelay: 15,
      totalGRs: 1,
      acceptedGRs: 0,
      rejectedGRs: 1,
      qualityAcceptanceRate: 0,
      totalPaid: 100000000,
      totalOutstanding: 0,
      averagePaymentDelay: 0,
      totalEvaluations: 1,
      averageEvaluationScore: 35,
      latestRating: 'poor' as const,
      performanceScore: 25.5,
      riskLevel: 'high' as const
    },
    certifications: [],
    certificationExpiryDates: {},
    productServices: ['Pasir', 'Batu Split', 'Sirtu'],
    serviceAreas: ['Bogor'],
    capacity: '100 ton/month',
    overallRating: 'poor' as const,
    isBlacklisted: true,
    blacklistRecords: [
      {
        id: 'bl_1',
        vendorId: '',
        projectId: '',
        blacklistedBy: 'system',
        blacklistedByName: 'System Admin',
        blacklistedAt: new Date('2024-10-15').toISOString(),
        reason: 'Kualitas material sangat buruk, banyak complain dari site. Pengiriman selalu terlambat lebih dari 2 minggu.',
        category: 'quality_issues' as const,
        severity: 'high' as const,
        effectiveFrom: new Date('2024-10-15').toISOString(),
        effectiveUntil: new Date('2025-10-15').toISOString(),
        isActive: true,
        attachments: []
      }
    ],
    createdBy: 'system',
    createdAt: new Date('2024-05-20').toISOString(),
    notes: 'VENDOR DI-BLACKLIST. Jangan gunakan untuk project apapun. Kualitas sangat buruk.',
    tags: ['blacklisted', 'problematic']
  }
];

export async function seedVendors() {
  console.log('🌱 Starting vendor seeding...');
  
  try {
    for (const vendor of SAMPLE_VENDORS) {
      const docRef = await addDoc(collection(db, 'vendors'), vendor);
      console.log(`✅ Created vendor: ${vendor.vendorName} (${docRef.id})`);
    }
    
    console.log(`\n🎉 Successfully seeded ${SAMPLE_VENDORS.length} vendors!`);
  } catch (error) {
    console.error('❌ Error seeding vendors:', error);
    throw error;
  }
}

// Uncomment to run directly
// seedVendors();
