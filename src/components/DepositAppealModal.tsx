import { useState } from "react";
import { X, AlertTriangle, Loader2, Send } from "lucide-react";

interface Deduction {
  id: number;
  amount: number;
  reason: string;
  date: string;
}

interface Props {
  deduction: Deduction;
  token: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function DepositAppealModal({ deduction, token, onClose, onSubmitted }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please explain why this deduction should be appealed");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/deposit-deductions/deductions/${deduction.id}/appeal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        onSubmitted();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit appeal");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-up border border-slate-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-display font-bold text-lg text-slate-900">Appeal Deduction</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deduction Info */}
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-4">
          <p className="text-xs font-bold text-rose-800 mb-1">Deduction Details</p>
          <p className="text-sm text-rose-900 font-semibold">{deduction.reason}</p>
          <p className="text-lg font-mono font-bold text-rose-700 mt-1">Rp {deduction.amount.toLocaleString()}</p>
          <p className="text-xs text-rose-600 mt-1">{deduction.date}</p>
        </div>

        {/* Appeal Form */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
            WHY SHOULD THIS BE APPEALED?
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Explain why this deduction should be reconsidered. Include any relevant details about the condition of the room..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm resize-none"
          />
          <p className="text-[10px] text-slate-400 mt-1">{reason.length}/500</p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            You have 7 days from the deduction date to submit an appeal. The property owner will review your appeal.
          </p>
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-600 text-center mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><Send className="w-3.5 h-3.5" /> Submit Appeal</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
