import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './FormControls';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Bot, Send, X, User as UserIcon } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
// FIX: Import `Chat` type from `@google/genai` to correctly type the chat session object.
import { GoogleGenAI, Chat } from '@google/genai';
import { ChatMessage } from '../types';

export default function AiAssistantChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { getProjectContextForAI } = useProject();
    // FIX: Use a ref to persist the chat session across re-renders, preventing history loss on each message.
    const chatRef = useRef<Chat | null>(null);

    const chatContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContentRef.current) {
            chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
        }
    }, [history]);

    // Initialize a new chat session when the chat window is opened.
    useEffect(() => {
        if (isOpen) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const context = getProjectContextForAI();
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are NATA'CARA AI, an expert construction project management assistant. Use the provided project data to answer questions accurately and concisely. Today's date is ${new Date().toLocaleDateString()}. Project Data: ${context}`,
                },
            });
            // Clear visual history for the new session.
            setHistory([]);
        }
    }, [isOpen, getProjectContextForAI]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setHistory(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // FIX: Removed the `history` parameter from `sendMessageStream` as it is not a valid property.
            // The chat instance automatically manages conversation history.
            const stream = await chatRef.current.sendMessageStream({ message: currentInput });

            let modelResponse = '';
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = { role: 'model', parts: [{ text: modelResponse }] };
                    return newHistory;
                });
            }

        } catch (error) {
            console.error("Gemini API error:", error);
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: 'Maaf, terjadi kesalahan saat menghubungi AI.' }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Button size="icon" className="rounded-full w-14 h-14 shadow-lg" onClick={() => setIsOpen(true)}>
                    <Bot className="w-7 h-7" />
                </Button>
            </div>
            {isOpen && (
                <div className="fixed inset-0 bg-black/30 z-[99] animate-fade-in" onClick={() => setIsOpen(false)} />
            )}
            {isOpen && (
                 <div className="fixed bottom-6 right-6 z-[100] w-[400px] h-[600px] animate-slide-up">
                    <Card className="w-full h-full flex flex-col shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b">
                            <div className="flex items-center gap-2">
                                <Bot className="w-6 h-6 text-persimmon"/>
                                <CardTitle>NATA'CARA AI Assistant</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="w-5 h-5"/></Button>
                        </CardHeader>
                        <CardContent ref={chatContentRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                            {history.map((msg, index) => (
                                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && <Bot className="w-6 h-6 text-persimmon flex-shrink-0" />}
                                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-persimmon text-white rounded-br-none' : 'bg-violet-essence/50 text-night-black rounded-bl-none'}`}>
                                       {msg.parts[0].text || <span className="animate-pulse">...</span>}
                                    </div>
                                     {msg.role === 'user' && <UserIcon className="w-6 h-6 text-palladium flex-shrink-0" />}
                                </div>
                            ))}
                        </CardContent>
                        <div className="p-4 border-t">
                            <div className="flex items-center gap-2">
                                <Input 
                                    placeholder="Tanya tentang proyek..." 
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                                    disabled={isLoading}
                                />
                                <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                                    <Send className="w-4 h-4"/>
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
