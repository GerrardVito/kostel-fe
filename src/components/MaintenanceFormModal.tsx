import React, { useState, FormEvent } from "react";
import { Wrench, X, AlertTriangle } from "lucide-react";
import { MaintenanceRequest } from "../types";

interface MaintenanceFormModalProps {
  onClose: () => void;
  onSubmit: (title: string, description: string, urgent: boolean, estimatedCost?: number, actualCost?: number) => void;
}

export default function MaintenanceFormModal({ onClose, onSubmit }: MaintenanceFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState("");
  const [actualCost, setActualCost] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const est = estimatedCost ? parseFloat(estimatedCost) : undefined;
    const act = actualCost ? parseFloat(actualCost) : undefined;
    onSubmit(title.trim(), description.trim(), urgent, est, act);
    setTitle("");
    setDescription("");
    setUrgent(false);
    setEstimatedCost("");
    setActualCost("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-up border border-slate-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-primary flex items-center gap-2">
            <Wrench className="w-5 h-5" /> Report Issue
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-705 tracking-wider mb-1.5">
              WHAT IS THE MAINTENANCE AREA?
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AC leaking water, loose balcony lock"
              maxLength={25}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-705 tracking-wider mb-1.5">
              DESCRIBE THE DISCREPANCY OR COMPLAINT
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact location inside the room, and when the issue started occurring..."
              maxLength={200}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm resize-none"
            />
          </div>

          {/* Urgent Trigger Switch */}
          <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5" />
              <div>
                <span className="block text-xs font-bold text-rose-800">Is this an urgent crisis?</span>
                <span className="block text-[10px] text-rose-600 leading-none">Flooding, structural locks, power failure etc.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 tracking-wider mb-1.5">
                ESTIMATED COST (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
              />
            </div>
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
            </div>
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
              className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold font-sans shadow-xs cursor-pointer transition-all"
            >
              Submit Dispatch Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
