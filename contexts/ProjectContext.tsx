import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { projectService } from '../api/projectService';
import { 
    Workspace, Project, AhspData, Worker, Notification, DailyReport, 
    PurchaseOrder, POItem, Attendance, WorkProgress, User, AiInsight, Comment, Document
} from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getTodayDateString } from '../constants';
import { GoogleGenAI } from '@google/genai';

interface ProjectContextType {
  workspaces: Workspace[];
  currentProject: Project | null;
  setCurrentProjectId: (id: string) => void;
  ahspData: AhspData | null;
  workers: Worker[];
  notifications: Notification[];
  loading: boolean;
  error: Error | null;
  handleAddDailyReport: (report: Omit<DailyReport, 'id' | 'comments'>) => Promise<void>;
  handleUpdateProgress: (updates: WorkProgress[]) => Promise<void>;
  handleUpdatePOStatus: (poId: string, status: PurchaseOrder['status']) => Promise<void>;
  handleAddPO: (po: Omit<PurchaseOrder, 'id' | 'status' | 'items'> & { items: POItem[] }) => Promise<void>;
  handleUpdateAttendance: (date: string, updates: Map<string, Attendance['status']>) => Promise<void>;
  handleUpdateAiInsight: () => Promise<void>;
  getProjectContextForAI: () => string;
  handleAddComment: (reportId: string, content: string) => Promise<void>;
  handleAddDocument: (doc: Omit<Document, 'id' | 'url'>, file: File) => Promise<void>;
  handleMarkNotificationsRead: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentProjectId, _setCurrentProjectId] = useState<string | null>(() => localStorage.getItem('lastProjectId'));
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [ahspData, setAhspData] = useState<AhspData | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const setCurrentProjectId = (id: string) => {
      localStorage.setItem('lastProjectId', id);
      _setCurrentProjectId(id);
  }

  // Effect for fetching static master data and workspaces list
  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return;
    };
    
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [wsRes, ahspRes, workersRes] = await Promise.all([
                projectService.getWorkspaces(),
                projectService.getAhspData(),
                projectService.getWorkers(),
            ]);
            setWorkspaces(wsRes);
            setAhspData(ahspRes);
            setWorkers(workersRes);

            const allProjectIds = wsRes.flatMap(ws => ws.projects.map(p => p.id));
            const lastProjectId = localStorage.getItem('lastProjectId');
            
            let projectIdToLoad = (lastProjectId && allProjectIds.includes(lastProjectId))
                ? lastProjectId
                : wsRes[0]?.projects[0]?.id;

            if (projectIdToLoad) {
                if (projectIdToLoad !== currentProjectId) {
                  _setCurrentProjectId(projectIdToLoad);
                }
            } else {
                 setError(new Error("No projects found for this workspace."));
            }
        } catch (err) {
            setError(err as Error);
            addToast('Gagal memuat data awal.', 'error');
        } finally {
            setLoading(false);
        }
    };
    fetchInitialData();
  }, [currentUser]);

  // Effect for REAL-TIME streaming of the selected project and notifications
  useEffect(() => {
    if (!currentProjectId) return;
    setLoading(true);
    setError(null);

    const unsubscribeProject = projectService.streamProjectById(currentProjectId, (project) => {
        if (project) {
            // Ensure all required properties exist with defaults
            const safeProject = {
                ...project,
                items: project.items || [],
                members: project.members || [],
                dailyReports: project.dailyReports || [],
                attendances: project.attendances || [],
                expenses: project.expenses || [],
                termins: project.termins || [],
                purchaseOrders: project.purchaseOrders || [],
                inventory: project.inventory || [],
                documents: project.documents || [],
                auditLog: project.auditLog || [],
            };
            setCurrentProject(safeProject);
        } else {
            setError(new Error(`Project with ID ${currentProjectId} not found`));
        }
        setLoading(false);
    });

    const unsubscribeNotifications = projectService.streamNotifications((notifs) => {
        setNotifications(notifs || []);
    });

    return () => {
        unsubscribeProject();
        unsubscribeNotifications();
    };
  }, [currentProjectId]);
  
  const handleAddDailyReport = useCallback(async (report: Omit<DailyReport, 'id' | 'comments'>) => {
    if (!currentProject || !currentUser) return;
    await projectService.addDailyReport(currentProject.id, report, currentUser);
    addToast('Laporan harian baru berhasil ditambahkan.', 'success');
  }, [currentProject, currentUser, addToast]);
  
  const handleUpdateProgress = useCallback(async (updates: WorkProgress[]) => {
      if (updates.length === 0) return;
      const newReport: Omit<DailyReport, 'id' | 'comments'> = {
          date: getTodayDateString(), weather: 'Cerah', notes: 'Koreksi progres manual dari sistem.',
          workforce: [], workProgress: updates, materialsConsumed: [], photos: []
      };
      await handleAddDailyReport(newReport);
  }, [handleAddDailyReport]);

  const handleUpdatePOStatus = useCallback(async (poId: string, status: PurchaseOrder['status']) => {
    if (!currentProject || !currentUser) return;
    await projectService.updatePOStatus(currentProject.id, poId, status, currentUser);
    addToast(`Status PO diperbarui menjadi ${status}.`, 'success');
  }, [currentProject, currentUser, addToast]);
  
  const handleAddPO = useCallback(async (po: Omit<PurchaseOrder, 'id' | 'status'>) => {
    if (!currentProject || !currentUser) return;
    await projectService.addPurchaseOrder(currentProject.id, po, currentUser);
    addToast(`Purchase Order ${po.prNumber} berhasil dibuat.`, 'success');
  }, [currentProject, currentUser, addToast]);

  const handleUpdateAttendance = useCallback(async (date: string, updates: Map<string, Attendance['status']>) => {
    if (!currentProject || !currentUser) return;
    await projectService.updateAttendance(currentProject.id, date, Array.from(updates.entries()), currentUser);
    addToast(`Absensi untuk tanggal ${date} berhasil disimpan.`, 'success');
  }, [currentProject, currentUser, addToast]);

  const handleAddComment = useCallback(async (reportId: string, content: string) => {
      if (!currentProject || !currentUser) return;
      await projectService.addCommentToDailyReport(currentProject.id, reportId, content, currentUser);
      addToast('Komentar ditambahkan.', 'success');
  }, [currentProject, currentUser, addToast]);
  
  const handleAddDocument = useCallback(async (doc: Omit<Document, 'id' | 'url'>, file: File) => {
    if (!currentProject || !currentUser) return;
    await projectService.addDocument(currentProject.id, doc, file, currentUser);
    addToast(`Dokumen "${doc.name}" berhasil diunggah.`, 'success');
  }, [currentProject, currentUser, addToast]);

  const handleMarkNotificationsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;
    await projectService.markNotificationsAsRead(unreadIds);
  }, [notifications]);

  const getProjectContextForAI = useCallback((): string => {
    if (!currentProject) return "No project data available.";
    const { name, location, startDate, items, expenses, dailyReports, inventory } = currentProject;
    const summary = {
        projectName: name, location, startDate,
        totalBudget: items.reduce((sum, i) => sum + i.volume * i.hargaSatuan, 0),
        totalActualCost: expenses.reduce((sum, e) => sum + e.amount, 0),
        workItems: items.map(i => ({ uraian: i.uraian, volume: i.volume, satuan: i.satuan})),
        recentReports: dailyReports.slice(0, 3).map(r => ({ date: r.date, notes: r.notes })),
        inventoryStatus: inventory.slice(0, 5),
    };
    return JSON.stringify(summary);
  }, [currentProject]);

  const handleUpdateAiInsight = useCallback(async () => {
    if(!currentProject) return;
    // This is a client-side update only, as it doesn't persist.
    // In a real app, this would be a server-side function and saved to the DB.
    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});
        const context = getProjectContextForAI();
        const prompt = `Based on the following project data, provide a short executive summary, identify the top 3 potential risks, and give a brief prediction of project outcome (cost and schedule). Format the response as a JSON object with keys: "summary", "risks" (an array of strings), and "predictions". Project data: ${context}`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const parsedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiResponse = JSON.parse(parsedText);

        const newInsight: AiInsight = {
            ...aiResponse,
            generatedAt: new Date().toISOString()
        };

        setCurrentProject(prev => prev ? {...prev, aiInsight: newInsight} : null);
        addToast('AI Insight berhasil diperbarui.', 'success');
    } catch (e) {
        console.error("Error generating AI insight:", e);
        addToast('Gagal menghasilkan insight dari AI.', 'error');
    }
  }, [currentProject, getProjectContextForAI, addToast]);
  
  return (
    <ProjectContext.Provider value={{ 
        workspaces, currentProject, setCurrentProjectId, ahspData, workers, notifications, loading, error,
        handleAddDailyReport, handleUpdateProgress, handleUpdatePOStatus, handleAddPO, handleUpdateAttendance,
        handleUpdateAiInsight, getProjectContextForAI, handleAddComment, handleAddDocument, handleMarkNotificationsRead
    }}>
      {children}
    </ProjectContext.Provider>
  );
};