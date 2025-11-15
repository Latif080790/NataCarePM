import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Select } from './FormControls';
import { Document } from '@/types';
import { getTodayDateString } from '@/constants';
import FileValidationFeedback from './FileValidationFeedback';
import { validateFile, type ValidationResult } from '@/utils/fileValidation';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (doc: Omit<Document, 'id' | 'url'>, file: File) => void;
}

export function UploadDocumentModal({ isOpen, onClose, onAddDocument }: UploadDocumentModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Teknis');
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Validate file whenever it changes
  useEffect(() => {
    if (file) {
      const result = validateFile(file);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [file]);

  const handleSubmit = () => {
    if (!name || !category || !file) {
      alert('Harap lengkapi semua field dan pilih file.');
      return;
    }

    // Check file validation - block if errors exist
    if (validationResult && !validationResult.isValid) {
      alert('File tidak valid. Harap perbaiki masalah yang ditampilkan sebelum mengunggah.');
      return;
    }

    onAddDocument(
      {
        name,
        category,
        uploadDate: getTodayDateString(),
      },
      file
    );

    // Reset state and close
    setName('');
    setCategory('Teknis');
    setFile(null);
    setValidationResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Unggah Dokumen Baru">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nama Dokumen</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Shop Drawing Revisi 2"
            sanitize
          />
        </div>
        <div>
          <label className="text-sm font-medium">Kategori</label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Teknis</option>
            <option>Legal</option>
            <option>Keuangan</option>
            <option>Lainnya</option>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Pilih File</label>
          <Input
            type="file"
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
            className="pt-2"
          />
          
          {/* File Validation Feedback */}
          {file && validationResult && (
            <FileValidationFeedback
              file={file}
              validationResult={validationResult}
              showHelp={true}
              onUpload={handleSubmit}
            />
          )}
        </div>
        <div className="text-right pt-4">
          <Button onClick={handleSubmit}>Simpan & Unggah</Button>
        </div>
      </div>
    </Modal>
  );
}

