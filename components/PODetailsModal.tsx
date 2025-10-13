

import { Modal } from './Modal';
import { PurchaseOrder } from '../types';
import { formatCurrency, formatDate } from '../constants';

interface PODetailsModalProps {
    po: PurchaseOrder;
    onClose: () => void;
}

export function PODetailsModal({ po, onClose }: PODetailsModalProps) {
    const totalAmount = po.items.reduce((sum, item) => sum + item.totalPrice, 0);

    return (
        <Modal isOpen={!!po} onClose={onClose} title={`Detail PO: ${po.prNumber}`}>
            <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 p-2 bg-violet-essence/30 rounded-md">
                    <strong className="text-palladium">Nomor PR:</strong><span>{po.prNumber}</span>
                    <strong className="text-palladium">Status:</strong><span>{po.status}</span>
                    <strong className="text-palladium">Pemohon:</strong><span>{po.requester}</span>
                    <strong className="text-palladium">Tanggal:</strong><span>{formatDate(po.requestDate)}</span>
                </div>
                
                <h4 className="font-semibold text-base pt-2 border-t">Rincian Item</h4>
                <div className="overflow-x-auto border rounded-md">
                    <table className="w-full">
                        <thead className="bg-violet-essence/50 text-xs uppercase">
                            <tr>
                                <th className="p-2 text-left">Material</th>
                                <th className="p-2 text-right">Jumlah</th>
                                <th className="p-2 text-left">Satuan</th>
                                <th className="p-2 text-right">Harga Satuan</th>
                                <th className="p-2 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {po.items.map((item, index) => (
                                <tr key={index} className="border-b last:border-b-0 border-violet-essence">
                                    <td className="p-2 font-medium">{item.materialName}</td>
                                    <td className="p-2 text-right">{item.quantity}</td>
                                    <td className="p-2">{item.unit}</td>
                                    <td className="p-2 text-right">{formatCurrency(item.pricePerUnit)}</td>
                                    <td className="p-2 text-right">{formatCurrency(item.totalPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-right pt-2 border-t mt-2">
                    <span className="text-palladium">Total Keseluruhan:</span>
                    <p className="text-xl font-bold text-persimmon">{formatCurrency(totalAmount)}</p>
                </div>
            </div>
        </Modal>
    );
}
