import { AlertTriangle } from "lucide-react";
import Modal from "./ui/Modal";

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <Modal
      size="sm"
      onClose={onCancel}
      footer={
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-display font-bold text-lg text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
