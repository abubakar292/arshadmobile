import React from 'react';
import { motion } from 'framer-motion';
import { Check, Printer } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { printBillHtml } from '../../utils/printBill';

interface PrintPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  billData: any;
  profit: number;
}

export function PrintPromptModal({ isOpen, onClose, billData, profit }: PrintPromptModalProps) {
  const handlePrint = () => {
    if (billData) {
      printBillHtml(billData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Success" size="sm">
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
        
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Skip
          </Button>
          <Button variant="primary" className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Bill
          </Button>
        </div>
      </div>
    </Modal>
  );
}
