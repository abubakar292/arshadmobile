import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Printer, Eye, Share2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { BillPreviewModal } from './BillPreviewModal';
import { getBillHtml } from '../../utils/printBill';
import { getWhatsAppSaleBillUrl } from '../../config/shopConfig';

interface PrintPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  billData: any;
  profit: number;
}

export function PrintPromptModal({ isOpen, onClose, billData, profit }: PrintPromptModalProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleOpenPreview = () => {
    setShowPreview(true);
  };

  const handleCloseAll = () => {
    setShowPreview(false);
    onClose();
  };

  const billHtml = billData ? getBillHtml(billData) : '';

  const handleWhatsAppShare = () => {
    if (!billData) return;
    const phone = billData.customerPhone || billData.phone || '';
    const name = billData.customerName || 'Customer';
    const amount = billData.totalSellPrice || billData.sellPrice || 0;
    const billNum = billData.billNumber || billData.id || '';
    const item = (billData.items && billData.items[0]?.modelName) || billData.itemName || billData.modelName || 'Mobile';
    const url = getWhatsAppSaleBillUrl(phone, name, amount, billNum, item);
    window.open(url, '_blank');
  };

  return (
    <>
      <Modal isOpen={isOpen && !showPreview} onClose={onClose} title="Success" size="sm">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="w-16 h-16 bg-accent-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-8 h-8 text-accent-emerald" />
          </motion.div>
          
          <h3 className="font-bold text-lg mb-1 text-slate-800">Sale Completed! 🎉</h3>
          <p className="text-slate-500 text-sm mb-2">
            Profit: <span className="text-accent-emerald font-bold">Rs. {profit.toLocaleString()}</span>
          </p>
          
          <div className="flex flex-col gap-2.5 mt-6">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-obsidian-dark font-extrabold" onClick={handleOpenPreview}>
              <Eye className="w-4 h-4 stroke-[2.5]" />
              Preview & Print Bill
            </Button>
            
            {billData?.customerPhone && (
              <Button variant="secondary" className="w-full flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" onClick={handleWhatsAppShare}>
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </Button>
            )}

            <Button variant="ghost" className="w-full text-slate-500" onClick={onClose}>
              Done / Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* IN-APP PREVIEW MODAL */}
      <BillPreviewModal
        isOpen={showPreview}
        onClose={handleCloseAll}
        htmlContent={billHtml}
        title="Sale Receipt"
        billNumber={billData?.billNumber || billData?.id}
        onShareWhatsApp={billData?.customerPhone ? handleWhatsAppShare : undefined}
      />
    </>
  );
}
