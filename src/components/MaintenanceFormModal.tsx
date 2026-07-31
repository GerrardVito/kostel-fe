import React, { useState, FormEvent } from "react";
import { Wrench, AlertTriangle } from "lucide-react";
import Modal from "./ui/Modal";

interface MaintenanceFormModalProps {
  onClose: () => void;
  onSubmit: (title: string, description: string, urgent: boolean) => void;
}

export default function MaintenanceFormModal({ onClose, onSubmit }: MaintenanceFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgent, setUrgent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit(title.trim(), description.trim(), urgent);
    setTitle("");
    setDescription("");
    setUrgent(false);
  };

  return (
    <Modal
      onClose={onClose}
      title={
        <span className="flex items-center gap-2 text-primary">
          <Wrench className="w-5 h-5" /> Report Issue
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
            form="maintenance-form"
            className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold font-sans shadow-xs cursor-pointer transition-all"
          >
            Submit Dispatch Ticket
          </button>
        </div>
      }
    >
      <form id="maintenance-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
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
          <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
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
      </form>
    </Modal>
  );
}
