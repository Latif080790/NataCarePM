import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase config (menggunakan config yang benar)
const firebaseConfig = {
  projectId: 'natacara-hns',
};

// Initialize Firebase Admin
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper untuk menambah hari
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const today = new Date();
const todayStr = getTodayDateString();
const startDate = addDays(today, -30);

// Real Data untuk Construction Project Management
const REAL_DATA = {
  // Master Data AHSP (Analisa Harga Satuan Pekerjaan)
  ahspData: {
    version: '2024',
    items: [
      {
        id: 'A.2.2.1.1',
        code: 'A.2.2.1.1',
        description: 'Pembersihan lapangan dan pemasangan bowplank',
        unit: 'm2',
        materialCosts: [
          { name: 'Kayu kelas III', quantity: 0.05, unit: 'm3', unitPrice: 2500000 },
          { name: 'Paku 5cm', quantity: 0.25, unit: 'kg', unitPrice: 18000 },
          { name: 'Tali rafia', quantity: 0.1, unit: 'kg', unitPrice: 25000 },
        ],
        laborCosts: [
          { type: 'Pekerja', coefficient: 0.5, wage: 120000 },
          { type: 'Tukang Kayu', coefficient: 0.25, wage: 150000 },
          { type: 'Kepala Tukang', coefficient: 0.025, wage: 160000 },
          { type: 'Mandor', coefficient: 0.0125, wage: 170000 },
        ],
        equipmentCosts: [{ name: 'Alat bantu', cost: 5000 }],
        totalUnitPrice: 185000,
      },
      {
        id: 'A.2.3.1.1',
        code: 'A.2.3.1.1',
        description: 'Galian tanah pondasi kedalaman 1-2 meter',
        unit: 'm3',
        materialCosts: [],
        laborCosts: [
          { type: 'Pekerja', coefficient: 0.75, wage: 120000 },
          { type: 'Mandor', coefficient: 0.025, wage: 170000 },
        ],
        equipmentCosts: [{ name: 'Alat bantu', cost: 5000 }],
        totalUnitPrice: 95250,
      },
      {
        id: 'A.4.1.1.5',
        code: 'A.4.1.1.5',
        description: 'Beton bertulang mutu K-250',
        unit: 'm3',
        materialCosts: [
          { name: 'Semen Portland', quantity: 384, unit: 'kg', unitPrice: 1300 },
          { name: 'Pasir beton', quantity: 0.692, unit: 'm3', unitPrice: 350000 },
          { name: 'Kerikil', quantity: 1.039, unit: 'm3', unitPrice: 410000 },
          { name: 'Air', quantity: 215, unit: 'liter', unitPrice: 15 },
          { name: 'Besi beton', quantity: 120, unit: 'kg', unitPrice: 14000 },
        ],
        laborCosts: [
          { type: 'Pekerja', coefficient: 1.65, wage: 120000 },
          { type: 'Tukang Batu', coefficient: 0.275, wage: 150000 },
          { type: 'Kepala Tukang', coefficient: 0.0275, wage: 160000 },
          { type: 'Mandor', coefficient: 0.083, wage: 170000 },
        ],
        equipmentCosts: [
          { name: 'Concrete mixer', cost: 50000 },
          { name: 'Concrete vibrator', cost: 25000 },
        ],
        totalUnitPrice: 2850000,
      },
      {
        id: 'A.4.4.1.1',
        code: 'A.4.4.1.1',
        description: 'Pasangan bata merah 1:4 tebal 1/2 batu',
        unit: 'm2',
        materialCosts: [
          { name: 'Bata merah', quantity: 70, unit: 'bh', unitPrice: 1000 },
          { name: 'Semen Portland', quantity: 11.5, unit: 'kg', unitPrice: 1300 },
          { name: 'Pasir pasang', quantity: 0.043, unit: 'm3', unitPrice: 300000 },
        ],
        laborCosts: [
          { type: 'Pekerja', coefficient: 0.3, wage: 120000 },
          { type: 'Tukang Batu', coefficient: 0.15, wage: 150000 },
          { type: 'Kepala Tukang', coefficient: 0.015, wage: 160000 },
          { type: 'Mandor', coefficient: 0.0075, wage: 170000 },
        ],
        equipmentCosts: [{ name: 'Alat bantu', cost: 3000 }],
        totalUnitPrice: 142750,
      },
    ],
  },

  // Data Pekerja Real
  workers: [
    {
      id: 'W001',
      name: 'Budi Santoso',
      type: 'Pekerja',
      dailyWage: 120000,
      skillLevel: 'Berpengalaman',
    },
    { id: 'W002', name: 'Cecep Permana', type: 'Pekerja', dailyWage: 120000, skillLevel: 'Pemula' },
    {
      id: 'W003',
      name: 'Eko Wahyudi',
      type: 'Pekerja',
      dailyWage: 120000,
      skillLevel: 'Berpengalaman',
    },
    {
      id: 'W004',
      name: 'Firman Setiawan',
      type: 'Pekerja',
      dailyWage: 120000,
      skillLevel: 'Menengah',
    },
    {
      id: 'T001',
      name: 'Asep Sunandar',
      type: 'Tukang Batu',
      dailyWage: 150000,
      skillLevel: 'Ahli',
    },
    {
      id: 'T002',
      name: 'Dedi Mulyadi',
      type: 'Tukang Kayu',
      dailyWage: 150000,
      skillLevel: 'Ahli',
    },
    {
      id: 'T003',
      name: 'Ahmad Yani',
      type: 'Tukang Besi',
      dailyWage: 150000,
      skillLevel: 'Berpengalaman',
    },
    {
      id: 'KT01',
      name: 'Suparman',
      type: 'Kepala Tukang',
      dailyWage: 160000,
      skillLevel: 'Expert',
    },
    { id: 'M001', name: 'Dadang Konelo', type: 'Mandor', dailyWage: 170000, skillLevel: 'Expert' },
  ],

  // Role dengan permission yang lengkap
  roles: [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full access to all system functions',
      permissions: ['read', 'write', 'delete', 'admin', 'user_management', 'system_config'],
      color: '#dc2626',
    },
    {
      id: 'pm',
      name: 'Project Manager',
      description: 'Manage projects, reports, and team coordination',
      permissions: ['read', 'write', 'project_management', 'reports', 'approvals'],
      color: '#2563eb',
    },
    {
      id: 'site_manager',
      name: 'Site Manager',
      description: 'On-site operations and daily reporting',
      permissions: ['read', 'write', 'daily_reports', 'progress_update', 'workforce_management'],
      color: '#059669',
    },
    {
      id: 'finance',
      name: 'Finance Manager',
      description: 'Financial oversight and purchase orders',
      permissions: ['read', 'write', 'financial_reports', 'purchase_orders', 'budget_control'],
      color: '#7c3aed',
    },
    {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access to assigned projects',
      permissions: ['read'],
      color: '#6b7280',
    },
  ],

  // Data Project Construction Real
  projects: [
    {
      id: 'PROJ-2024-001',
      name: 'Pembangunan Rumah Tinggal Cluster Green Valley',
      description:
        'Proyek pembangunan 12 unit rumah tinggal tipe 70 dengan konsep modern minimalis',
      location: 'Jl. Raya Bogor KM 25, Cibinong, Bogor',
      client: 'PT. Green Valley Development',
      contractor: "PT. NATA'CARA Construction",
      startDate: '2024-09-01',
      endDate: '2025-03-31',
      projectValue: 3600000000, // 3.6 Miliar
      status: 'On Progress',
      progress: 45.5,
      projectManager: 'user1',
      siteManager: 'user3',
      items: [
        {
          id: 1,
          no: 'I.1',
          uraian: 'Pekerjaan Persiapan dan Pembersihan Lahan',
          volume: 840,
          satuan: 'm2',
          hargaSatuan: 15000,
          kategori: 'Persiapan',
          ahspId: 'A.2.2.1.1',
          duration: 7,
          startDate: '2024-09-01',
          progress: 100,
        },
        {
          id: 2,
          no: 'II.1',
          uraian: 'Galian Tanah Pondasi dan Basement',
          volume: 420,
          satuan: 'm3',
          hargaSatuan: 95000,
          kategori: 'Struktur Bawah',
          ahspId: 'A.2.3.1.1',
          duration: 14,
          dependsOn: 1,
          startDate: '2024-09-08',
          progress: 100,
        },
        {
          id: 3,
          no: 'II.2',
          uraian: 'Pondasi Footplate dan Sloof K-250',
          volume: 85,
          satuan: 'm3',
          hargaSatuan: 2850000,
          kategori: 'Struktur Bawah',
          ahspId: 'A.4.1.1.5',
          duration: 21,
          dependsOn: 2,
          startDate: '2024-09-22',
          progress: 95,
        },
        {
          id: 4,
          no: 'III.1',
          uraian: 'Struktur Kolom dan Balok Lantai 1',
          volume: 125,
          satuan: 'm3',
          hargaSatuan: 2850000,
          kategori: 'Struktur Atas',
          ahspId: 'A.4.1.1.5',
          duration: 28,
          dependsOn: 3,
          startDate: '2024-10-13',
          progress: 75,
        },
        {
          id: 5,
          no: 'III.2',
          uraian: 'Pasangan Dinding Bata Lantai 1',
          volume: 1680,
          satuan: 'm2',
          hargaSatuan: 142750,
          kategori: 'Arsitektur',
          ahspId: 'A.4.4.1.1',
          duration: 35,
          dependsOn: 4,
          startDate: '2024-11-10',
          progress: 25,
        },
        {
          id: 6,
          no: 'IV.1',
          uraian: 'Plesteran dan Acian Dalam',
          volume: 3360,
          satuan: 'm2',
          hargaSatuan: 55000,
          kategori: 'Finishing',
          ahspId: 'A.4.4.2.3',
          duration: 28,
          dependsOn: 5,
          progress: 0,
        },
        {
          id: 7,
          no: 'IV.2',
          uraian: 'Instalasi MEP (Mechanical, Electrical, Plumbing)',
          volume: 12,
          satuan: 'unit',
          hargaSatuan: 18500000,
          kategori: 'MEP',
          ahspId: 'MEP.1',
          duration: 42,
          dependsOn: 5,
          progress: 0,
        },
        {
          id: 8,
          no: 'V.1',
          uraian: 'Pengecatan Interior dan Eksterior',
          volume: 3360,
          satuan: 'm2',
          hargaSatuan: 35000,
          kategori: 'Finishing',
          ahspId: 'A.4.7.1.1',
          duration: 21,
          dependsOn: 6,
          progress: 0,
        },
        {
          id: 9,
          no: 'VI.1',
          uraian: 'Pekerjaan Landscape dan Taman',
          volume: 600,
          satuan: 'm2',
          hargaSatuan: 125000,
          kategori: 'Landscape',
          ahspId: 'LAND.1',
          duration: 14,
          dependsOn: 8,
          progress: 0,
        },
      ],
    },
    {
      id: 'PROJ-2024-002',
      name: 'Renovasi Kantor Pusat PT. Digital Solusi',
      description: 'Renovasi total kantor 3 lantai dengan konsep modern workspace',
      location: 'Jl. Sudirman No. 45, Jakarta Pusat',
      client: 'PT. Digital Solusi Indonesia',
      contractor: "PT. NATA'CARA Construction",
      startDate: '2024-10-15',
      endDate: '2024-12-30',
      projectValue: 850000000, // 850 Juta
      status: 'On Progress',
      progress: 15.2,
      projectManager: 'user1',
      siteManager: 'user3',
      items: [
        {
          id: 11,
          no: 'I.1',
          uraian: 'Demolisi dan Pembongkaran',
          volume: 450,
          satuan: 'm2',
          hargaSatuan: 35000,
          kategori: 'Demolisi',
          duration: 10,
          progress: 100,
        },
        {
          id: 12,
          no: 'II.1',
          uraian: 'Pekerjaan Partisi Gypsum',
          volume: 280,
          satuan: 'm2',
          hargaSatuan: 185000,
          kategori: 'Interior',
          duration: 18,
          dependsOn: 11,
          progress: 45,
        },
        {
          id: 13,
          no: 'III.1',
          uraian: 'Instalasi Sistem HVAC',
          volume: 3,
          satuan: 'lantai',
          hargaSatuan: 45000000,
          kategori: 'MEP',
          duration: 25,
          dependsOn: 12,
          progress: 0,
        },
      ],
    },
  ],
};

async function setupRealData() {
  console.log('🚀 Memulai setup data real ke Firestore...');

  try {
    const batch = db.batch();

    // 1. Setup Master Data AHSP
    console.log('📊 Mengisi master data AHSP...');
    const ahspRef = db.collection('masterData').doc('ahsp');
    batch.set(ahspRef, REAL_DATA.ahspData);

    // 2. Setup Workers
    console.log('👷 Mengisi data workers...');
    for (const worker of REAL_DATA.workers) {
      const workerRef = db.collection('workers').doc(worker.id);
      batch.set(workerRef, worker);
    }

    // 3. Setup Roles
    console.log('🔐 Mengisi data roles...');
    for (const role of REAL_DATA.roles) {
      const roleRef = db.collection('roles').doc(role.id);
      batch.set(roleRef, role);
    }

    // Commit batch untuk master data
    await batch.commit();
    console.log('✅ Master data berhasil disimpan!');

    // 4. Setup Projects (satu per satu karena kompleks)
    console.log('🏗️ Mengisi data projects...');
    for (const project of REAL_DATA.projects) {
      const projectRef = db.collection('projects').doc(project.id);

      // Data utama project
      const projectData = {
        ...project,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await projectRef.set(projectData);

      // Tambahkan daily reports sample
      const dailyReportsData = [
        {
          id: `DR-${project.id}-001`,
          date: addDays(today, -5).toISOString().split('T')[0],
          weather: 'Cerah',
          notes: `Progres ${project.items[0]?.uraian || 'pekerjaan'} berjalan sesuai rencana.`,
          workforce: [
            { workerId: 'W001', workerName: 'Budi Santoso', hoursWorked: 8 },
            { workerId: 'T001', workerName: 'Asep Sunandar', hoursWorked: 8 },
          ],
          workProgress: [{ rabItemId: project.items[0]?.id || 1, completedVolume: 50 }],
          materialsConsumed: [
            { name: 'Semen', quantity: 10, unit: 'sak' },
            { name: 'Pasir', quantity: 2, unit: 'm3' },
          ],
          photos: [],
          comments: [],
          createdBy: 'user3',
          timestamp: addDays(today, -5).toISOString(),
        },
        {
          id: `DR-${project.id}-002`,
          date: addDays(today, -3).toISOString().split('T')[0],
          weather: 'Berawan',
          notes: `Koordinasi dengan supplier material untuk kelancaran pekerjaan.`,
          workforce: [
            { workerId: 'W001', workerName: 'Budi Santoso', hoursWorked: 8 },
            { workerId: 'W002', workerName: 'Cecep Permana', hoursWorked: 8 },
            { workerId: 'T001', workerName: 'Asep Sunandar', hoursWorked: 8 },
          ],
          workProgress: [{ rabItemId: project.items[1]?.id || 2, completedVolume: 30 }],
          materialsConsumed: [
            { name: 'Besi Beton', quantity: 500, unit: 'kg' },
            { name: 'Kawat Beton', quantity: 5, unit: 'kg' },
          ],
          photos: [],
          comments: [],
          createdBy: 'user3',
          timestamp: addDays(today, -3).toISOString(),
        },
      ];

      // Simpan daily reports
      for (const report of dailyReportsData) {
        const reportRef = db.collection(`projects/${project.id}/dailyReports`).doc(report.id);
        await reportRef.set(report);
      }

      // Tambahkan sample purchase orders
      const purchaseOrdersData = [
        {
          id: `PO-${project.id}-001`,
          poNumber: `PO/${project.id}/2024/001`,
          supplier: 'CV. Sumber Bangunan Jaya',
          requestDate: addDays(today, -10).toISOString(),
          requiredDate: addDays(today, 5).toISOString(),
          status: 'approved',
          items: [
            { name: 'Semen Portland', quantity: 100, unit: 'sak', unitPrice: 65000 },
            { name: 'Pasir Beton', quantity: 20, unit: 'm3', unitPrice: 350000 },
            { name: 'Kerikil', quantity: 25, unit: 'm3', unitPrice: 410000 },
          ],
          totalAmount: 23750000,
          approver: 'Jevline Kief',
          approvalDate: addDays(today, -8).toISOString(),
          createdBy: 'user3',
          timestamp: addDays(today, -10).toISOString(),
        },
      ];

      for (const po of purchaseOrdersData) {
        const poRef = db.collection(`projects/${project.id}/purchaseOrders`).doc(po.id);
        await poRef.set(po);
      }

      // Tambahkan attendance records
      const attendanceData = {
        id: `ATT-${project.id}-${todayStr}`,
        date: todayStr,
        records: [
          {
            workerId: 'W001',
            workerName: 'Budi Santoso',
            status: 'present',
            checkIn: '07:00',
            checkOut: '16:00',
          },
          {
            workerId: 'W002',
            workerName: 'Cecep Permana',
            status: 'present',
            checkIn: '07:15',
            checkOut: '16:00',
          },
          {
            workerId: 'T001',
            workerName: 'Asep Sunandar',
            status: 'present',
            checkIn: '07:00',
            checkOut: '16:00',
          },
          {
            workerId: 'M001',
            workerName: 'Dadang Konelo',
            status: 'present',
            checkIn: '06:45',
            checkOut: '16:15',
          },
        ],
        createdBy: 'user3',
        timestamp: new Date().toISOString(),
      };

      const attendanceRef = db.collection(`projects/${project.id}/attendances`).doc(attendanceData.id);
      await attendanceRef.set(attendanceData);

      console.log(`✅ Project ${project.name} berhasil disimpan!`);
    }

    // 5. Setup Notifications
    console.log('🔔 Mengisi notifications...');
    const notifications = [
      {
        id: 'notif-001',
        userId: 'user1',
        type: 'project_update',
        title: 'Progress Update',
        message: 'Proyek Green Valley mencapai 45.5% completion',
        timestamp: new Date().toISOString(),
        read: false,
      },
      {
        id: 'notif-002',
        userId: 'user1',
        type: 'task_assignment',
        title: 'New Task Assigned',
        message: 'Anda telah ditugaskan untuk review RAB proyek Digital Solusi',
        timestamp: addDays(today, -1).toISOString(),
        read: false,
      },
    ];

    for (const notification of notifications) {
      const notifRef = db.collection('notifications').doc(notification.id);
      await notifRef.set(notification);
    }

    console.log('✅ Notifications berhasil disimpan!');

    console.log('🚀 Setup selesai! Aplikasi siap digunakan dengan data real.');
  } catch (error) {
    console.error('❌ Error setting up real data:', error);
  }
}

// Run the setup
setupRealData();