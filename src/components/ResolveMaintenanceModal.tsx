import React, { useState, FormEvent } from "react";
import { Wrench, X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-up border border-slate-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-primary flex items-center gap-2">
            <Wrench className="w-5 h-5" /> Resolve Issue
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

          <div className="pt-3 border-t border-slate-100 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-550 hover:bg-slate-50 rounded-xl text-xs font-bold font-sans cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-sans shadow-xs cursor-pointer transition-all"
            >
              Confirm Resolution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
