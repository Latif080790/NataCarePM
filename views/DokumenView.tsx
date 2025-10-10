import React, { useState } from 'react';
import { Document as DocumentType } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Upload, Download } from 'lucide-react';
import { formatDate, hasPermission } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { UploadDocumentModal } from '../components/UploadDocumentModal';
import { useProject } from '../contexts/ProjectContext';

interface DokumenViewProps {
    documents: DocumentType[];
}

export default function DokumenView({ documents }: DokumenViewProps) {
    const { currentUser } = useAuth();
    const { handleAddDocument } = useProject();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const canManageDocuments = hasPermission(currentUser, 'manage_documents');

    return (
    <>
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Manajemen Dokumen</CardTitle>
                    <CardDescription>Pusat penyimpanan untuk semua dokumen terkait proyek.</CardDescription>
                </div>
                {canManageDocuments && (
                    <Button onClick={() => setIsUploadModalOpen(true)}>
                        <Upload className="w-4 h-4 mr-2"/>Unggah Dokumen Baru
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-night-black">
                        <thead className="bg-violet-essence/50 text-xs uppercase">
                            <tr>
                                <th className="p-3">Nama Dokumen</th>
                                <th className="p-3">Kategori</th>
                                <th className="p-3">Tanggal Unggah</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map(doc => (
                                <tr key={doc.id} className="border-b border-violet-essence hover:bg-violet-essence/30">
                                    <td className="p-3 font-medium">{doc.name}</td>
                                    <td className="p-3">{doc.category}</td>
                                    <td className="p-3">{formatDate(doc.uploadDate)}</td>
                                    <td className="p-3 text-center">
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                <Download className="w-4 h-4"/>
                                            </a>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>

        {canManageDocuments && (
            <UploadDocumentModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onAddDocument={handleAddDocument}
            />
        )}
    </>
  );
}