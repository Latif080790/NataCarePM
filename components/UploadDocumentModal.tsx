import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Select } from './FormControls';
import { Document } from '../types';
import { getTodayDateString } from '../constants';

interface UploadDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddDocument: (doc: Omit<Document, 'id'|'url'>, file: File) => void;
}

export function UploadDocumentModal({ isOpen, onClose, onAddDocument }: UploadDocumentModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Teknis');
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = () => {
        if (!name || !category || !file) {
            alert('Harap lengkapi semua field dan pilih file.');
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
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Unggah Dokumen Baru">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Nama Dokumen</label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Shop Drawing Revisi 2" />
                </div>
                <div>
                    <label className="text-sm font-medium">Kategori</label>
                    <Select value={category} onChange={e => setCategory(e.target.value)}>
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
                        onChange={e => e.target.files && setFile(e.target.files[0])} 
                        className="pt-2"
                    />
                    {file && <p className="text-xs text-palladium mt-1">File dipilih: {file.name}</p>}
                </div>
                <div className="text-right pt-4">
                    <Button onClick={handleSubmit}>Simpan & Unggah</Button>
                </div>
            </div>
        </Modal>
    );
}
