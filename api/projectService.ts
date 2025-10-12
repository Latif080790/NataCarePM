import { db, storage } from '../firebaseConfig';
import { 
    collection, getDocs, getDoc, doc, addDoc, updateDoc, query, where, onSnapshot, serverTimestamp, orderBy, writeBatch 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
    Workspace, AhspData, DailyReport, Attendance, Document, PurchaseOrder, Worker, User, Notification, Project 
} from '../types';

// Helper to convert Firestore doc to our TypeScript types
const docToType = <T>(document: any): T => {
    const data = document.data();
    return { ...data, id: document.id } as T;
};

export const projectService = {
  // --- Real-time streaming ---
  streamProjectById: (projectId: string, callback: (project: Project) => void) => {
    const projectRef = doc(db, "projects", projectId);
    return onSnapshot(projectRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
            const projectData = docToType<Project>(docSnapshot);
            // Fetch subcollections
            const subCollections = ['dailyReports', 'attendances', 'expenses', 'documents', 'purchaseOrders', 'inventory', 'termins', 'auditLog'];
            for (const sc of subCollections) {
                const scQuery = query(collection(db, `projects/${projectId}/${sc}`), orderBy('timestamp', 'desc'));
                const scSnapshot = await getDocs(scQuery);
                (projectData as any)[sc] = scSnapshot.docs.map(d => docToType(d));
            }
            callback(projectData);
        } else {
            console.error("No such project!");
        }
    });
  },

  streamNotifications: (callback: (notifications: Notification[]) => void) => {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
        const notifs = querySnapshot.docs.map(d => docToType<Notification>(d));
        callback(notifs);
    });
  },

  // --- Read operations ---
  getWorkspaces: async (): Promise<Workspace[]> => {
      const projectsSnapshot = await getDocs(collection(db, "projects"));
      const projects = projectsSnapshot.docs.map(d => docToType<Project>(d));
      // In a real app with multiple workspaces, you'd fetch and structure them properly.
      // For now, we group all projects under one mock workspace.
      return [{ id: 'ws1', name: "NATA'CARA Corp Workspace", projects }];
  },
  
  getProjectById: async (projectId: string): Promise<Project | null> => {
      const docRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
          return docToType<Project>(docSnap);
      }
      return null;
  },

  getUserById: async (userId: string): Promise<User | null> => {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docToType<User>(docSnap) : null;
  },

  getAhspData: async (): Promise<AhspData> => (await getDoc(doc(db, "masterData", "ahsp"))).data() as AhspData,
  getWorkers: async (): Promise<Worker[]> => (await getDocs(collection(db, "workers"))).docs.map(d => docToType<Worker>(d)),
  getUsers: async (): Promise<User[]> => (await getDocs(collection(db, "users"))).docs.map(d => docToType<User>(d)),
  
  // --- Write operations ---
  addAuditLog: async (projectId: string, user: User, action: string) => {
      await addDoc(collection(db, `projects/${projectId}/auditLog`), {
          timestamp: serverTimestamp(), userId: user.id, userName: user.name, action
      });
  },

  updatePOStatus: async (projectId: string, poId: string, status: PurchaseOrder['status'], user: User): Promise<void> => {
      const poRef = doc(db, `projects/${projectId}/purchaseOrders`, poId);
      await updateDoc(poRef, { status, approver: user.name, approvalDate: new Date().toISOString() });
      const po = (await getDoc(poRef)).data();
      await projectService.addAuditLog(projectId, user, `Memperbarui status PO #${po?.prNumber} menjadi ${status}.`);
  },

  addDailyReport: async (projectId: string, reportData: Omit<DailyReport, 'id'|'comments'>, user: User): Promise<void> => {
      await addDoc(collection(db, `projects/${projectId}/dailyReports`), { ...reportData, timestamp: new Date(reportData.date) });
      await projectService.addAuditLog(projectId, user, `Menambahkan laporan harian untuk tanggal ${reportData.date}.`);
  },
  
  addPurchaseOrder: async (projectId: string, poData: Omit<PurchaseOrder, 'id' | 'status'>, user: User): Promise<void> => {
    await addDoc(collection(db, `projects/${projectId}/purchaseOrders`), { 
        ...poData, status: 'Menunggu Persetujuan', timestamp: new Date(poData.requestDate)
    });
    await projectService.addAuditLog(projectId, user, `Membuat Purchase Order baru: ${poData.prNumber}.`);
  },

  addDocument: async (projectId: string, docData: Omit<Document, 'id' | 'url'>, file: File, user: User): Promise<void> => {
    const storageRef = ref(storage, `projects/${projectId}/documents/${Date.now()}_${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(uploadResult.ref);
    
    await addDoc(collection(db, `projects/${projectId}/documents`), { 
        ...docData, url, timestamp: new Date(docData.uploadDate)
    });
    await projectService.addAuditLog(projectId, user, `Mengunggah dokumen baru: ${docData.name}.`);
  },

  updateAttendance: async (projectId: string, date: string, updates: [string, Attendance['status']][], user: User): Promise<void> => {
      const batch = writeBatch(db);
      const attendanceCol = collection(db, `projects/${projectId}/attendances`);

      // Query for existing docs on that date to update or create
      const q = query(attendanceCol, where("date", "==", date));
      const existingDocs = await getDocs(q);
      const existingMap = new Map(existingDocs.docs.map(d => [d.data().workerId, d.id]));

      updates.forEach(([workerId, status]) => {
          const docId = existingMap.get(workerId);
          const ref = docId ? doc(attendanceCol, docId) : doc(attendanceCol); // create new if not exists
          batch.set(ref, { workerId, status, date, timestamp: new Date(date) });
      });
      await batch.commit();
      await projectService.addAuditLog(projectId, user, `Memperbarui absensi untuk tanggal ${date}.`);
  },

  addCommentToDailyReport: async (projectId: string, reportId: string, content: string, user: User): Promise<void> => {
    const commentsCol = collection(db, `projects/${projectId}/dailyReports/${reportId}/comments`);
    await addDoc(commentsCol, {
        content,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatarUrl,
        timestamp: serverTimestamp()
    });
    await projectService.addAuditLog(projectId, user, `Menambahkan komentar pada laporan harian.`);
  },

  markNotificationsAsRead: async (notificationIds: string[]): Promise<void> => {
      const batch = writeBatch(db);
      notificationIds.forEach(id => {
          const notifRef = doc(db, 'notifications', id);
          batch.update(notifRef, { isRead: true });
      });
      await batch.commit();
  }
};