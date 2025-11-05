import { Button } from '@/components/Button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export default function ConfirmationDialog({ isOpen, onClose, onConfirm, title, description }: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <p className="text-sm text-gray-600 mb-6">{description}</p>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={onConfirm}>Hapus</Button>
        </div>
      </div>
    </div>
  );
}