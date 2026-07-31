import React, { useState, FormEvent } from "react";
import { Wrench } from "lucide-react";
import Modal from "./ui/Modal";

interface ResolveMaintenanceModalProps {
  onClose: () => void;
  onSubmit: (actualCost?: number) => void;
  title: string;
}

export default function ResolveMaintenanceModal({ onClose, onSubmit, title }: ResolveMaintenanceModalProps) {
  const [actualCost, setActualCost] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cost = actualCost ? parseFloat(actualCost) : undefined;
    onSubmit(cost);
  };

  return (
    <Modal
      size="sm"
      onClose={onClose}
      title={
        <span className="flex items-center gap-2 text-primary">
          <Wrench className="w-5 h-5" /> Resolve Issue
        </span>
      }
      footer={
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold font-sans cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="resolve-maintenance-form"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-sans shadow-xs cursor-pointer transition-all"
          >
            Confirm Resolution
          </button>
        </div>
      }
    >
      <form id="resolve-maintenance-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Marking <span className="font-bold">{title}</span> as resolved.
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-600 tracking-wider mb-1.5">
            ACTUAL COST (Rp)
          </label>
          <input
            type="number"
            min={0}
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
          />
          <p className="text-[10px] text-slate-400 mt-1">Optional. Leave empty if no cost incurred.</p>
        </div>
      </form>
    </Modal>
  );
}
