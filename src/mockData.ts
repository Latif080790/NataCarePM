import { Workspace, AhspData, Worker, User, Role, AuditLog } from '@/types';
import { getTodayDateString, addDays, ROLES_CONFIG } from '@/constants';

const today = new Date();
const todayStr = getTodayDateString();
const startDate = addDays(today, -30);

export const MOCK_USERS: User[] = [
    { 
        uid: 'user1-firebase-uid', 
        id: 'user1', 
        name: 'Jevline Kief', 
        email: 'pm@natacara.dev', 
        roleId: 'pm', 
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
        isOnline: true,
        lastSeen: new Date().toISOString()
    },
    { 
        uid: 'user2-firebase-uid', 
        id: 'user2', 
        name: 'Admin Nata', 
        email: 'admin@natacara.dev', 
        roleId: 'admin', 
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
        isOnline: true,
        lastSeen: new Date().toISOString()
    },
    { 
        uid: 'user3-firebase-uid', 
        id: 'user3', 
        name: 'Bambang Lapangan', 
        email: 'site@natacara.dev', 
        roleId: 'site_manager', 
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
        isOnline: false,
        lastSeen: addDays(new Date(), -1).toISOString()
    },
    { 
        uid: 'user4-firebase-uid', 
        id: 'user4', 
        name: 'Siti Keuangan', 
        email: 'finance@natacara.dev', 
        roleId: 'finance', 
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705a',
        isOnline: true,
        lastSeen: new Date().toISOString()
    },
];

export const MOCK_WORKERS: Worker[] = [
    { id: 'W001', name: 'Budi Santoso', type: 'Pekerja' },
    { id: 'W002', name: 'Cecep Permana', type: 'Pekerja' },
    { id: 'W003', name: 'Eko Wahyudi', type: 'Pekerja' },
    { id: 'T001', name: 'Asep Sunandar', type: 'Tukang' },
    { id: 'T002', name: 'Dedi Mulyadi', type: 'Tukang' },
    { id: 'KT01', name: 'Suparman', type: 'Kepala Tukang' },
    { id: 'M001', name: 'Dadang Konelo', type: 'Mandor' },
];

const RAB_ITEMS_PROJECT1 = [
    { id: 1, no: 'I.1', uraian: 'Pekerjaan Persiapan', volume: 1, satuan: 'ls', hargaSatuan: 5000000, kategori: 'Persiapan', ahspId: 'A.2.2.1.1', duration: 7 },
    { id: 2, no: 'II.1', uraian: 'Galian Tanah Pondasi', volume: 50, satuan: 'm3', hargaSatuan: 75000, kategori: 'Struktur Bawah', ahspId: 'A.2.3.1.1', duration: 10, dependsOn: 1 },
    { id: 3, no: 'II.2', uraian: 'Beton Sloof 15x20', volume: 10, satuan: 'm3', hargaSatuan: 1200000, kategori: 'Struktur Bawah', ahspId: 'A.4.1.1.5', duration: 14, dependsOn: 2 },
    { id: 4, no: 'III.1', uraian: 'Pasangan Dinding Bata', volume: 150, satuan: 'm2', hargaSatuan: 150000, kategori: 'Arsitektur', ahspId: 'A.4.4.1.1', duration: 20, dependsOn: 3 },
    { id: 5, no: 'III.2', uraian: 'Plesteran & Acian', volume: 300, satuan: 'm2', hargaSatuan: 80000, kategori: 'Arsitektur', ahspId: 'A.4.4.2.3', duration: 15, dependsOn: 4 },
    { id: 6, no: 'IV.1', uraian: 'Instalasi Listrik', volume: 20, satuan: 'ttk', hargaSatuan: 250000, kategori: 'MEP', ahspId: 'MEP.1', duration: 10, dependsOn: 4 },
    { id: 7, no: 'V.1', uraian: 'Pengecatan', volume: 300, satuan: 'm2', hargaSatuan: 45000, kategori: 'Finishing', ahspId: 'A.4.7.1.1', duration: 12, dependsOn: 5 },
];
const MOCK_AUDIT_LOG_1: AuditLog[] = [
    {id: 'al1', timestamp: addDays(today, -1).toISOString(), userId: 'user3', userName: 'Bambang Lapangan', action: 'Membuat laporan harian baru.'},
    {id: 'al2', timestamp: addDays(today, -2).toISOString(), userId: 'user1', userName: 'Jevline Kief', action: 'Menyetujui Purchase Order PR-12346.'},
    {id: 'al3', timestamp: addDays(today, -3).toISOString(), userId: 'user4', userName: 'Siti Keuangan', action: 'Mencatat pengeluaran baru: Sewa Molen.'},
];


export const MOCK_DB: {
    workspaces: Workspace[];
    ahspData: AhspData;
    workers: Worker[];
    users: User[];
    roles: Role[];
    notifications: any[];
} = {
    workspaces: [
        {
            id: 'ws1',
            name: 'NATA\'CARA Corp Workspace',
            projects: [
                {
                    id: 'proj1',
                    name: 'Pembangunan Rumah Tinggal Tipe 70',
                    location: 'Jakarta Selatan',
                    startDate: startDate.toISOString().split('T')[0],
                    items: RAB_ITEMS_PROJECT1,
                    members: MOCK_USERS,
                    dailyReports: [
                        { id: 'dr1', date: addDays(today, -15).toISOString().split('T')[0], weather: 'Cerah', notes: 'Galian pondasi selesai sepenuhnya.', workforce: [{workerId: 'W001', workerName: 'Budi S.'}], workProgress: [{ rabItemId: 2, completedVolume: 30 }], materialsConsumed: [], photos: [], comments: [] },
                        { id: 'dr2', date: addDays(today, -14).toISOString().split('T')[0], weather: 'Cerah', notes: 'Galian pondasi selesai.', workforce: [{workerId: 'W001', workerName: 'Budi S.'}], workProgress: [{ rabItemId: 2, completedVolume: 20 }], materialsConsumed: [], photos: [], comments: [] },
                        { 
                          id: 'dr3', 
                          date: addDays(today, -7).toISOString().split('T')[0], 
                          weather: 'Hujan', 
                          notes: 'Pekerjaan beton sloof berjalan lancar, namun sedikit terhambat hujan di sore hari.', 
                          workforce: [{workerId: 'T001', workerName: 'Asep S.'}], 
                          workProgress: [{ rabItemId: 3, completedVolume: 8 }], 
                          materialsConsumed: [{ materialName: 'Semen PC', quantity: 20, unit: 'sak' }], 
                          photos: [],
                          comments: [
                              { id: 'c1', authorId: 'user1', authorName: 'Jevline Kief', authorAvatar: MOCK_USERS[0].avatarUrl, content: 'Pastikan kualitas beton tetap terjaga ya, Pak Bambang. Hujan bisa berpengaruh.', timestamp: addDays(today, -7).toISOString() },
                              { id: 'c2', authorId: 'user3', authorName: 'Bambang Lapangan', authorAvatar: MOCK_USERS[2].avatarUrl, content: 'Siap, Bu. Sudah kami antisipasi dengan terpal.', timestamp: addDays(today, -7).toISOString() }
                          ]
                        },
                    ],
                    attendances: [
                        { date: todayStr, workerId: 'W001', status: 'Hadir' }, { date: todayStr, workerId: 'T001', status: 'Hadir' }, { date: todayStr, workerId: 'M001', status: 'Hadir' }, { date: todayStr, workerId: 'W002', status: 'Sakit' },
                        { date: addDays(today, -1).toISOString().split('T')[0], workerId: 'W001', status: 'Hadir' },
                    ],
                    expenses: [
                        { id: 'ex1', description: 'Pembelian Semen 50 sak (Stok awal)', amount: 3500000, date: addDays(today, -20).toISOString().split('T')[0], type: 'Material' },
                        { id: 'ex2', description: 'Sewa Molen 3 hari', amount: 750000, date: addDays(today, -8).toISOString().split('T')[0], type: 'Alat' },
                        { id: 'ex3', description: 'Biaya konsumsi rapat', amount: 250000, date: addDays(today, -5).toISOString().split('T')[0], type: 'Lain-lain' },
                    ],
                    documents: [
                        { id: 'doc1', name: 'Kontrak_Kerja.pdf', category: 'Legal', uploadDate: addDays(today, -40).toISOString().split('T')[0], url: '#' },
                        { id: 'doc2', name: 'Gambar_Denah_Lantai_1.dwg', category: 'Teknis', uploadDate: addDays(today, -35).toISOString().split('T')[0], url: '#' },
                    ],
                    purchaseOrders: [
                        { id: 'po1', prNumber: 'PR-12345', status: 'Menunggu Persetujuan', items: [{ materialName: 'Besi Beton', quantity: 500, unit: 'kg', pricePerUnit: 12000, totalPrice: 6000000 }], requester: 'Bambang Lapangan', requestDate: addDays(today, -5).toISOString().split('T')[0] },
                        { id: 'po2', prNumber: 'PR-12346', poNumber: 'PO-12346', status: 'Diterima Penuh', items: [{ materialName: 'Semen PC', quantity: 100, unit: 'sak', pricePerUnit: 70000, totalPrice: 7000000 }], requester: 'Bambang Lapangan', requestDate: addDays(today, -12).toISOString().split('T')[0], approver: 'Jevline Kief' },
                    ],
                    inventory: [
                        { materialName: 'Semen PC', quantity: 100, unit: 'sak' }, { materialName: 'Pasir Pasang', quantity: 10, unit: 'm3' }, { materialName: 'Batu Bata', quantity: 5000, unit: 'bh' },
                    ],
                    termins: [
                        { id: 'T1', description: 'Uang Muka 20%', percentage: 20, amount: 85750000 * 0.20, date: addDays(today, -28).toISOString().split('T')[0], status: 'Dibayar' },
                        { id: 'T2', description: 'Progres 30%', percentage: 30, amount: 85750000 * 0.30, date: addDays(today, -10).toISOString().split('T')[0], status: 'Dibayar' },
                    ],
                    auditLog: MOCK_AUDIT_LOG_1
                },
                {
                    id: 'proj2',
                    name: 'Renovasi Kantor Cabang',
                    location: 'Bandung',
                    startDate: addDays(today, -10).toISOString().split('T')[0],
                    items: [
                        { id: 1, no: 'A.1', uraian: 'Pembongkaran Dinding Eksisting', volume: 50, satuan: 'm2', hargaSatuan: 50000, kategori: 'Persiapan', ahspId: 'A.2.2.1.1', duration: 5 },
                        { id: 2, no: 'B.1', uraian: 'Pekerjaan Partisi Gypsum', volume: 100, satuan: 'm2', hargaSatuan: 180000, kategori: 'Arsitektur', ahspId: 'A.4.4.1.1', duration: 10, dependsOn: 1 },
                    ],
                    members: [MOCK_USERS[0], MOCK_USERS[3]], // Jevline & Siti
                    dailyReports: [],
                    attendances: [],
                    expenses: [{ id: 'ex-b1', description: 'Uang muka vendor renovasi', amount: 10000000, date: addDays(today, -9).toISOString().split('T')[0], type: 'Lain-lain' }],
                    documents: [],
                    purchaseOrders: [],
                    inventory: [],
                    termins: [],
                    auditLog: [ {id: 'al-b1', timestamp: addDays(today, -9).toISOString(), userId: 'user4', userName: 'Siti Keuangan', action: 'Mencatat pengeluaran: Uang muka vendor.'},]
                }
            ]
        }
    ],
    ahspData: {
        labors: { 'A.4.4.1.1': { 'Pekerja': 0.3, 'Tukang': 0.1, 'Mandor': 0.015 } },
        materials: { 'A.4.4.1.1': { 'Batu Bata': 70, 'Semen PC': 0.2, 'Pasir Pasang': 0.043 } },
        laborRates: { 'Pekerja': 120000, 'Tukang': 150000, 'Mandor': 200000, 'Kepala Tukang': 175000 },
        materialPrices: { 'Batu Bata': 800, 'Semen PC': 70000, 'Pasir Pasang': 250000, 'Besi Beton': 12000, 'Papan Bekisting': 90000 },
        materialUnits: { 'Batu Bata': 'bh', 'Semen PC': 'sak', 'Pasir Pasang': 'm3', 'Besi Beton': 'kg', 'Papan Bekisting': 'lbr' },
    },
    workers: MOCK_WORKERS,
    users: MOCK_USERS,
    roles: ROLES_CONFIG,
    notifications: [
        { id: 'n1', message: 'Purchase Order PR-12345 membutuhkan persetujuan Anda.', isRead: false, timestamp: addDays(today, -2).toISOString(), linkTo: 'logistik' },
        { id: 'n2', message: 'Laporan harian untuk kemarin telah ditambahkan oleh Bambang.', isRead: false, timestamp: addDays(today, -1).toISOString(), linkTo: 'laporan_harian' },
        { id: 'n3', message: 'Pembayaran termin T2 telah dikonfirmasi.', isRead: true, timestamp: addDays(today, -10).toISOString(), linkTo: 'arus_kas' }
    ]
};