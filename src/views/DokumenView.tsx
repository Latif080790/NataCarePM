// React default import removed (using automatic JSX runtime)
import { useState, useMemo } from 'react';
import { Document as DocumentType } from '@/types';
import { DocumentWithVersions } from '@/types/components';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/FormControls';
import { Modal } from '@/components/Modal';
import {
  Upload,
  Download,
  Search,
  Eye,
  History,
  FileText,
  Image,
  FileVideo,
  Music,
  File,
  Trash2,
  Share2,
  Clock,
  User,
  Calendar,
  Tag,
  Archive,
  Camera,
} from 'lucide-react';
import { formatDate, hasPermission } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { UploadDocumentModal } from '@/components/UploadDocumentModal';
import { CameraCapture, useCameraCapture } from '@/components/CameraCapture';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';

interface DokumenViewProps {
  documents: DocumentType[];
}

const documentTypes = [
  'all',
  'contract',
  'specification',
  'drawing',
  'report',
  'image',
  'video',
  'other',
];

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
      return <FileText className="w-5 h-5" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return <Image className="w-5 h-5" />;
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return <FileVideo className="w-5 h-5" />;
    case 'mp3':
    case 'wav':
    case 'flac':
      return <Music className="w-5 h-5" />;
    default:
      return <File className="w-5 h-5" />;
  }
};

const getFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function DokumenView({ documents }: DokumenViewProps) {
  const { currentUser } = useAuth();
  const { handleAddDocument, currentProject } = useProject();
  const { addToast } = useToast();

  // Camera capture hook
  const { isOpen: isCameraOpen, openCamera, closeCamera, handleCapture } = useCameraCapture();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithVersions | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showArchived, setShowArchived] = useState(false);

  const canManageDocuments = hasPermission(currentUser, 'manage_documents');

  // Enhanced documents with versions (mock data for demo)
  const enhancedDocuments: DocumentWithVersions[] = useMemo(() => {
    return documents.map((doc) => ({
      ...doc,
      versions: [
        {
          id: `${doc.id}_v1`,
          documentId: doc.id,
          version: '1.0',
          name: doc.name,
          url: doc.url,
          uploadDate: doc.uploadDate,
          uploadedBy: 'John Doe',
          changeLog: 'Initial version',
          size: Math.floor(Math.random() * 10000000) + 100000,
          fileSize: Math.floor(Math.random() * 10000000) + 100000,
          comments: 'Initial upload',
        },
      ],
      currentVersion: '1.0',
      tags: ['construction', 'project'],
      lastModified: doc.uploadDate,
      modifiedBy: 'John Doe',
      isArchived: false,
    }));
  }, [documents]);

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    return enhancedDocuments.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesArchived = showArchived ? doc.isArchived : !doc.isArchived;

      return matchesSearch && matchesCategory && matchesArchived;
    });
  }, [enhancedDocuments, searchTerm, selectedCategory, showArchived]);

  const handleDocumentClick = (doc: DocumentWithVersions) => {
    setSelectedDocument(doc);
    setShowPreviewModal(true);
  };

  const handleVersionHistoryClick = (doc: DocumentWithVersions) => {
    setSelectedDocument(doc);
    setShowVersionHistory(true);
  };

  const handleArchiveDocument = async () => {
    // Mock archive functionality
    addToast('Dokumen berhasil diarsipkan', 'success');
  };

  const handleDeleteDocument = async () => {
    // Mock delete functionality
    addToast('Dokumen berhasil dihapus', 'success');
  };

  const handleShareDocument = async (doc: DocumentWithVersions) => {
    // Mock share functionality
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc.name,
          text: `Dokumen: ${doc.name}`,
          url: doc.url,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(doc.url);
        addToast('Link dokumen disalin ke clipboard', 'success');
      }
    } else {
      navigator.clipboard.writeText(doc.url);
      addToast('Link dokumen disalin ke clipboard', 'success');
    }
  };

  const renderDocumentCard = (doc: DocumentWithVersions) => (
    <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-essence rounded-lg">{getFileIcon(doc.name)}</div>
            <div className="flex-1">
              <h3
                className="font-semibold text-night-black hover:text-persimmon cursor-pointer"
                onClick={() => handleDocumentClick(doc)}
              >
                {doc.name}
              </h3>
              <p className="text-sm text-palladium">{doc.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleVersionHistoryClick(doc)}>
              <History className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleShareDocument(doc)}>
              <Share2 className="w-4 h-4" />
            </Button>
            {canManageDocuments && (
              <>
                <Button variant="ghost" size="sm" onClick={() => handleArchiveDocument()}>
                  <Archive className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument()}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2 text-xs text-palladium">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>Diunggah: {formatDate(doc.uploadDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" />
            <span>Oleh: {doc.modifiedBy}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Versi: {doc.currentVersion}</span>
          </div>
        </div>

        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {doc.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 bg-violet-essence text-night-black text-xs rounded-full"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Manajemen Dokumen Advanced</CardTitle>
            <CardDescription>
              Pusat penyimpanan dengan versioning, preview, dan pencarian advanced.
            </CardDescription>
          </div>
          {canManageDocuments && (
            <div className="flex gap-2">
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Unggah Dokumen
              </Button>
              <Button 
                onClick={openCamera}
                variant="outline"
                className="bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                <Camera className="w-4 h-4 mr-2" />
                Ambil Foto
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-palladium w-4 h-4" />
                <Input
                  placeholder="Cari dokumen, kategori, atau tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-palladium rounded-lg bg-white text-night-black"
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'Semua Kategori' : type}
                  </option>
                ))}
              </select>

              <Button
                variant={showArchived ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
              >
                <Archive className="w-4 h-4 mr-2" />
                Arsip
              </Button>

              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-violet-essence p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-night-black opacity-70">Total Dokumen</p>
                  <p className="text-2xl font-bold text-night-black">{filteredDocuments.length}</p>
                </div>
                <FileText className="w-8 h-8 text-night-black opacity-70" />
              </div>
            </div>

            <div className="bg-persimmon p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white opacity-70">Dokumen Baru (7 hari)</p>
                  <p className="text-2xl font-bold text-white">
                    {
                      filteredDocuments.filter(
                        (doc) =>
                          new Date(doc.uploadDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length
                    }
                  </p>
                </div>
                <Clock className="w-8 h-8 text-white opacity-70" />
              </div>
            </div>

            <div className="bg-green-500 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white opacity-70">Total Versi</p>
                  <p className="text-2xl font-bold text-white">
                    {filteredDocuments.reduce((sum, doc) => sum + doc.versions.length, 0)}
                  </p>
                </div>
                <History className="w-8 h-8 text-white opacity-70" />
              </div>
            </div>

            <div className="bg-blue-500 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white opacity-70">Ukuran Total</p>
                  <p className="text-2xl font-bold text-white">
                    {getFileSize(
                      filteredDocuments.reduce(
                        (sum, doc) =>
                          sum + doc.versions.reduce((vSum, version) => vSum + version.size, 0),
                        0
                      )
                    )}
                  </p>
                </div>
                <Archive className="w-8 h-8 text-white opacity-70" />
              </div>
            </div>
          </div>

          {/* Documents Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map(renderDocumentCard)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-night-black">
                <thead className="bg-violet-essence/50 text-xs uppercase">
                  <tr>
                    <th className="p-3">Dokumen</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Versi</th>
                    <th className="p-3">Ukuran</th>
                    <th className="p-3">Terakhir Dimodifikasi</th>
                    <th className="p-3">Tags</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-violet-essence hover:bg-violet-essence/30"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.name)}
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-xs text-palladium">oleh {doc.modifiedBy}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{doc.category}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-violet-essence rounded text-xs">
                          v{doc.currentVersion}
                        </span>
                      </td>
                      <td className="p-3">{getFileSize(doc.versions[0]?.size || 0)}</td>
                      <td className="p-3">{formatDate(doc.lastModified)}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 2 && (
                            <span className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                              +{doc.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentClick(doc)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVersionHistoryClick(doc)}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShareDocument(doc)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          {canManageDocuments && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchiveDocument()}
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument()}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-palladium mb-4" />
              <h3 className="text-lg font-semibold text-night-black mb-2">
                Tidak ada dokumen ditemukan
              </h3>
              <p className="text-palladium mb-4">
                {searchTerm
                  ? `Tidak ada dokumen yang cocok dengan "${searchTerm}"`
                  : 'Belum ada dokumen yang diunggah'}
              </p>
              {canManageDocuments && (
                <Button onClick={() => setIsUploadModalOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Unggah Dokumen Pertama
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {canManageDocuments && (
        <UploadDocumentModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAddDocument={handleAddDocument}
        />
      )}

      {/* Document Preview Modal */}
      {selectedDocument && showPreviewModal && (
        <Modal
          title="Document Preview"
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedDocument(null);
          }}
          size="xl"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Preview: {selectedDocument.name}</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href={selectedDocument.url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>

            <div className="bg-gray-100 p-8 rounded-lg text-center">
              {getFileIcon(selectedDocument.name)}
              <p className="mt-4 text-palladium">
                Preview akan ditampilkan di sini untuk format file yang didukung
              </p>
              <p className="text-sm text-palladium mt-2">
                Ukuran: {getFileSize(selectedDocument.versions[0]?.size || 0)}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">Informasi Dokumen</p>
                <p>Kategori: {selectedDocument.category}</p>
                <p>Versi: {selectedDocument.currentVersion}</p>
                <p>Diunggah: {formatDate(selectedDocument.uploadDate)}</p>
              </div>
              <div>
                <p className="font-semibold">Tags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedDocument.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-violet-essence rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Version History Modal */}
      {selectedDocument && showVersionHistory && (
        <Modal
          title="Version History"
          isOpen={showVersionHistory}
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedDocument(null);
          }}
          size="lg"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Riwayat Versi: {selectedDocument.name}</h2>

            <div className="space-y-3">
              {selectedDocument.versions.map((version) => (
                <div key={version.id} className="border border-palladium rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Versi {version.version}</p>
                      <p className="text-sm text-palladium">
                        {formatDate(version.uploadDate)} oleh {version.uploadedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-palladium">{getFileSize(version.size)}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={version.url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  {version.changeLog && (
                    <p className="text-sm text-palladium mt-2">Perubahan: {version.changeLog}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Camera Capture Modal */}
      {isCameraOpen && currentProject && (
        <CameraCapture
          projectId={currentProject.id}
          onCapture={async (imageUrls) => {
            handleCapture(imageUrls);
            
            // Convert URLs to documents
            try {
              for (let i = 0; i < imageUrls.length; i++) {
                const url = imageUrls[i];
                const timestamp = Date.now();
                
                // Fetch the image as blob
                const response = await fetch(url);
                const blob = await response.blob();
                
                // Create a File-like object
                const file = new Blob([blob], { type: 'image/jpeg' }) as File;
                Object.defineProperty(file, 'name', {
                  value: `photo_${timestamp}_${i + 1}.jpg`,
                  writable: false,
                });
                
                // Add document via context
                await handleAddDocument({
                  name: `Photo ${new Date().toLocaleTimeString()} #${i + 1}`,
                  category: 'image',
                  uploadDate: new Date().toISOString(),
                }, file);
              }
              
              addToast(`${imageUrls.length} foto berhasil diunggah`, 'success');
            } catch (error) {
              console.error('Error adding captured photos:', error);
              addToast('Gagal menambahkan foto', 'error');
            }
          }}
          onCancel={closeCamera}
          maxPhotos={5}
          compressionQuality={0.8}
        />
      )}
    </>
  );
}
