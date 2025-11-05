import { useState } from 'react';

import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Select } from './FormControls';
import { PurchaseOrder, POItem, AhspData, User } from '@/types';
import { formatCurrency, getTodayDateString } from '@/constants';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { purchaseOrderSchema } from '@/schemas/projectSchemas';

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPO: (po: Omit<PurchaseOrder, 'id' | 'status' | 'items'> & { items: POItem[] }) => void;
  ahspData: AhspData;
  currentUser: User;
}

export function CreatePOModal({
  isOpen,
  onClose,
  onAddPO,
  ahspData,
  currentUser,
}: CreatePOModalProps) {
  const [prNumber, setPrNumber] = useState('');
  const [items, setItems] = useState<POItem[]>([
    { materialName: '', quantity: 1, unit: '', pricePerUnit: 0, totalPrice: 0 },
  ]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const availableMaterials = Object.keys(ahspData.materialPrices);

  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items];
    const currentItem = { ...newItems[index] };

    if (field === 'materialName') {
      currentItem.materialName = value;
      currentItem.pricePerUnit = ahspData.materialPrices[value] || 0;
      currentItem.unit = ahspData.materialUnits[value] || '';
    } else if (field === 'quantity') {
      currentItem.quantity = parseFloat(value) || 0;
    } else if (field === 'pricePerUnit') {
      currentItem.pricePerUnit = parseFloat(value) || 0;
    }

    currentItem.totalPrice = currentItem.quantity * currentItem.pricePerUnit;
    newItems[index] = currentItem;
    setItems(newItems);
    setValidationErrors([]); // Clear errors on change
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { materialName: '', quantity: 1, unit: '', pricePerUnit: 0, totalPrice: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validate using Zod schema
    const result = purchaseOrderSchema.safeParse({
      prNumber,
      items,
    });

    if (!result.success) {
      const errors = result.error.issues.map((err) => 
        err.path.length > 0 ? `${err.path.join('.')}: ${err.message}` : err.message
      );
      setValidationErrors(errors);
      alert('Harap perbaiki error validasi:\n' + errors.join('\n'));
      return;
    }

    onAddPO({
      prNumber,
      items: items.filter((i) => i.materialName),
      requester: currentUser.name,
      requestDate: getTodayDateString(),
    });
    setPrNumber('');
    setItems([{ materialName: '', quantity: 1, unit: '', pricePerUnit: 0, totalPrice: 0 }]);
    setValidationErrors([]);
    onClose();
  };

  const totalPOAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Purchase Order Baru">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Validation Errors</h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        <div>
          <label className="text-sm font-medium">Nomor PR (Purchase Request)</label>
          <Input
            value={prNumber}
            onChange={(e) => { setPrNumber(e.target.value); setValidationErrors([]); }}
            placeholder="Contoh: PR-00123"
          />
        </div>
        <h4 className="font-semibold pt-2 border-t">Item Material</h4>
        {items.map((item, index) => (
          <div key={index} className="p-2 border rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Item #{index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(index)}
                disabled={items.length === 1}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
            <Select
              value={item.materialName}
              onChange={(e) => handleItemChange(index, 'materialName', e.target.value)}
            >
              <option value="" disabled>
                Pilih Material
              </option>
              {availableMaterials.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                placeholder="Jumlah"
                min="0"
              />
              <Input value={item.unit} disabled placeholder="Satuan" />
              <Input
                type="number"
                value={item.pricePerUnit}
                onChange={(e) => handleItemChange(index, 'pricePerUnit', e.target.value)}
                placeholder="Harga/Satuan"
              />
            </div>
            <div className="text-right text-sm font-semibold">
              Subtotal: {formatCurrency(item.totalPrice)}
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Item
        </Button>
        <div className="pt-4 border-t mt-4 text-right">
          <p className="text-lg font-bold">Total PO: {formatCurrency(totalPOAmount)}</p>
          <div className="mt-4">
            <Button onClick={handleSubmit}>Ajukan Purchase Order</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
