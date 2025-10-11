export type Permission = 
    | 'view_dashboard'
    | 'view_rab'
    | 'edit_rab'
    | 'view_gantt'
    | 'view_daily_reports'
    | 'create_daily_reports'
    | 'view_progress'
    | 'update_progress'
    | 'view_attendance'
    | 'manage_attendance'
    | 'view_finances'
    | 'manage_expenses'
    | 'view_evm'
    | 'view_logistics'
    | 'create_po'
    | 'approve_po'
    | 'manage_inventory'
    | 'view_documents'
    | 'manage_documents'
    | 'view_reports'
    | 'view_users'
    | 'manage_users'
    | 'view_master_data'
    | 'manage_master_data'
    | 'view_audit_trail'
    | 'view_monitoring'
    | 'manage_monitoring';

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface RabItem {
    id: number;
    no: string;
    uraian: string;
    volume: number;
    satuan: string;
    hargaSatuan: number;
    kategori: string;
    ahspId: string;
    duration?: number;
    dependsOn?: number;
}

export interface User {
    uid: string; // Firebase UID
    id: string; // Application ID
    name: string;
    email: string;
    roleId: string; // Links to a Role
    avatarUrl: string;
    isOnline?: boolean;
    lastSeen?: string;
    permissions?: Permission[];
}

export interface Project {
    id: string;
    name: string;
    location: string;
    startDate: string;
    items: RabItem[];
    members: User[];
    dailyReports: DailyReport[];
    attendances: Attendance[];
    expenses: Expense[];
    documents: Document[];
    purchaseOrders: PurchaseOrder[];
    inventory: InventoryItem[];
    termins: Termin[];
    auditLog: AuditLog[];
    aiInsight?: AiInsight; // Optional AI-generated insight
}

export interface Workspace {
    id: string;
    name: string;
    projects: Project[];
}

export interface WorkProgress {
    rabItemId: number;
    completedVolume: number;
}

export interface MaterialConsumption {
    materialName: string;
    quantity: number;
    unit: string;
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
}

export interface DailyReport {
    id: string;
    date: string;
    weather: 'Cerah' | 'Berawan' | 'Hujan';
    notes: string;
    workforce: { workerId: string, workerName: string }[];
    workProgress: WorkProgress[];
    materialsConsumed: MaterialConsumption[];
    photos: string[];
    comments?: Comment[];
}

export interface Worker {
    id: string;
    name: string;
    type: 'Pekerja' | 'Tukang' | 'Mandor' | 'Kepala Tukang';
}

export interface Attendance {
    date: string;
    workerId: string;
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
}

export interface Expense {
    id:string;
    description: string;
    amount: number;
    date: string;
    type: 'Material' | 'Alat' | 'Upah Tenaga Kerja' | 'Lain-lain';
    rabItemId?: number;
    invoiceId?: string; // Link to an invoice
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    poId: string;
    vendorId: string;
    amount: number;
    issueDate: string;
    dueDate: string;
    status: 'Belum Dibayar' | 'Dibayar Sebagian' | 'Lunas';
    payments: Payment[];
}

export interface Payment {
    id: string;
    amount: number;
    paymentDate: string;
    notes?: string;
}

export interface Vendor {
    id: string;
    name: string;
    category: string;
    contactPerson: string;
    phone: string;
}

export interface AhspData {
    labors: { [key: string]: { [workerType: string]: number } };
    materials: { [key: string]: { [materialName: string]: number } };
    laborRates: { [workerType: string]: number };
    materialPrices: { [materialName: string]: number };
    materialUnits: { [materialName: string]: string };
}

export interface ProjectMetrics {
    totalBudget: number;
    actualCost: number;
    plannedValue: number;
    earnedValue: number;
    remainingBudget: number;
    overallProgress: number;
    evm: {
        cpi: number;
        spi: number;
        sv: number;
        cv: number;
    };
    sCurveData: {
        planned: { day: number, cost: number }[];
        actual: { day: number, cost: number }[];
    };
}

export interface POItem {
    materialName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalPrice: number;
}

export interface PurchaseOrder {
    id: string;
    prNumber: string;
    poNumber?: string;
    status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak' | 'PO Dibuat' | 'Dipesan' | 'Diterima Sebagian' | 'Diterima Penuh';
    items: POItem[];
    requester: string;
    requestDate: string;
    approver?: string;
    approvalDate?: string;
    vendorId?: string;
    grnStatus?: 'Belum Diterima' | 'Sebagian Diterima' | 'Lengkap';
    notes?: string;
}

export interface InventoryItem {
    materialName: string;
    quantity: number;
    unit: string;
}

export interface Document {
    id: string; // Changed from number to string for consistency
    name: string;
    category: string;
    uploadDate: string;
    url: string;
}

export interface Termin {
    id: string;
    description: string;
    percentage: number;
    amount: number;
    date: string;
    status: 'Direncanakan' | 'Dibayar';
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    timestamp: string;
    linkTo?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string; // e.g., "Created PO PR-12345", "Updated attendance for 2023-10-27"
}

export interface AiInsight {
    summary: string;
    risks: string[];
    predictions?: string;
    generatedAt: string;
    recommendations?: string[];
    timestamp?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    parts: { text: string }[];
    createdAt: string;
    actionId?: string;
}

export interface AiAssistantAction {
    id: string;
    title: string;
    description: string;
    prompt: string;
    icon: string;
}

// Task Management Types
export interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignedTo: string[]; // User IDs
    createdBy: string; // User ID
    dueDate: string;
    dependencies: string[]; // Task IDs
    subtasks: Subtask[];
    progress: number; // 0-100
    tags: string[];
    rabItemId?: number; // Link to RAB item if applicable
    createdAt: string;
    updatedAt: string;
}

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    assignedTo?: string; // User ID
    completedAt?: string;
}

export interface TaskComment {
    id: string;
    taskId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
}
