import { useProject } from '@/contexts/ProjectContext';
import {
    Bot,
    History,
    PlusCircle,
    Send,
    Sparkles,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Input } from './FormControls';
import { taskService } from '@/api/taskService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ChatMessage } from '@/types';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function AiAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { getProjectContextForAI, currentProject } = useProject();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const chatContentRef = useRef<HTMLDivElement>(null);

  const storageKey = useMemo(
    () => `ai:chat:${currentProject?.id || 'no-project'}`,
    [currentProject?.id]
  );

  const suggestedPrompts = useMemo(() => {
    const today = new Date().toLocaleDateString();
    return [
      `Ringkas progres proyek minggu ini (${today})`,
      'Identifikasi 3 risiko teratas dan mitigasinya',
      'Analisa deviasi biaya vs rencana',
      'Rangkum 5 temuan dari laporan harian terbaru',
      'Rekomendasikan 3 tindakan percepatan jadwal',
    ];
  }, []);

  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [history]);

  // Load chat history from localStorage when opening
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setHistory(JSON.parse(saved));
      } catch (_) {}
    }
  }, [isOpen, storageKey]);

  // Persist chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (_) {}
  }, [history, storageKey]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ text: input }],
      createdAt: now,
    };
    setHistory((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Call Cloud Function for AI insight
      const functions = getFunctions();
      const generateAiInsight = httpsCallable(functions, 'generateAiInsight');
      
      const projectContext = getProjectContextForAI();
      const result = await generateAiInsight({
        projectContext,
        userMessage: currentInput,
        conversationHistory: history.slice(-10) // Send last 10 messages for context
      });

      const aiResponse = (result.data as any).summary || 'Sorry, I could not generate a response.';
      const modelMsgId = crypto.randomUUID();
      
      setHistory((prev) => [
        ...prev,
        {
          id: modelMsgId,
          role: 'model',
          parts: [{ text: aiResponse }],
          createdAt: new Date().toISOString(),
        },
      ]);
      
      addToast('AI response generated successfully', 'success');
    } catch (error) {
      console.error('Cloud Function error:', error);
      setHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          parts: [{ text: 'Maaf, terjadi kesalahan saat menghubungi AI.' }],
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePrompt = (prompt: string) => {
    setInput(prompt);
    // Optionally send immediately:
    // setTimeout(handleSend, 0);
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (_) {}
  };

  const exportTranscript = () => {
    const data = {
      projectId: currentProject?.id,
      createdAt: new Date().toISOString(),
      history,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${currentProject?.id || 'no-project'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Transkrip chat diekspor.', 'success');
  };

  // Simple AI action: create task from last model response or current input
  const createTaskFromText = async (text: string) => {
    if (!currentProject || !currentUser) return;
    try {
      const title = (text.split('\n')[0] || text).slice(0, 80) || 'Task dari AI';
      const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const taskId = await taskService.createTask(
        currentProject.id,
        {
          projectId: currentProject.id,
          title,
          description: text,
          status: 'todo',
          priority: 'medium',
          assignedTo: [currentUser.id],
          createdBy: currentUser.id,
          dueDate: due,
          dependencies: [],
          subtasks: [],
          progress: 0,
          tags: ['ai'],
        },
        currentUser
      );
      setHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          parts: [{ text: `✅ Task dibuat: "${title}" (ID: ${taskId}) • Jatuh tempo: ${due}` }],
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (e: any) {
      setHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          parts: [{ text: `Gagal membuat task: ${e?.message || e}` }],
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="w-7 h-7" />
        </Button>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[99] animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[100] w-[440px] h-[640px] animate-slide-up">
          <Card className="w-full h-full flex flex-col shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-persimmon" />
                <CardTitle>NATA'CARA AI Assistant</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Export transkrip"
                  onClick={exportTranscript}
                >
                  <History className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Bersihkan riwayat"
                  onClick={clearHistory}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            {/* Suggested prompts */}
            <div className="px-4 pt-3 border-b bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-palladium mb-2">
                <Sparkles className="w-3 h-3" /> Rekomendasi
              </div>
              <div className="flex flex-wrap gap-2 pb-3">
                {suggestedPrompts.map((p, i) => (
                  <button
                    key={i}
                    className="px-2 py-1 rounded-full bg-white border text-xs hover:bg-persimmon hover:text-white transition"
                    onClick={() => handleUsePrompt(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <CardContent ref={chatContentRef} className="flex-1 p-4 overflow-y-auto space-y-4">
              {history.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'model' && <Bot className="w-6 h-6 text-persimmon flex-shrink-0" />}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-persimmon text-white rounded-br-none' : 'bg-violet-essence/50 text-night-black rounded-bl-none'}`}
                  >
                    {msg.parts[0].text || <span className="animate-pulse">...</span>}
                  </div>
                  {msg.role === 'user' && (
                    <User className="w-6 h-6 text-palladium flex-shrink-0" />
                  )}
                </div>
              ))}
            </CardContent>
            <div className="p-4 border-t space-y-2">
              {/* AI Actions */}
              <div className="flex items-center gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentProject || !currentUser || isLoading}
                  onClick={() =>
                    createTaskFromText(
                      input ||
                        history.filter((h) => h.role === 'model').at(-1)?.parts[0].text ||
                        'Task dari AI'
                    )
                  }
                >
                  <PlusCircle className="w-4 h-4 mr-1" /> Buat Task dari Teks
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Tanya tentang proyek..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <style>{`
                @keyframes animate-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes animate-slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: animate-fade-in 0.3s ease-out; }
                .animate-slide-up { animation: animate-slide-up 0.3s ease-out; }
            `}</style>
    </>
  );
}

