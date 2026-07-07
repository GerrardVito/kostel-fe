import { useState } from "react";
import { X, DollarSign, Loader2, AlertTriangle } from "lucide-react";

interface Props {
  assignmentId: number;
  tenantName: string;
  roomNumber: string;
  depositRemaining: number;
  token: string;
  onClose: () => void;
  onDeducted: () => void;
}

export default function DepositCutModal({ assignmentId, tenantName, roomNumber, depositRemaining, token, onClose, onDeducted }: Props) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (numAmount > depositRemaining) {
      setError(`Amount exceeds remaining deposit (Rp ${depositRemaining.toLocaleString()})`);
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for the deduction");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/deduct-deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: numAmount, reason: reason.trim() }),
      });
      if (res.ok) {
        onDeducted();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to deduct deposit");
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
          <h3 className="font-display font-bold text-lg text-slate-900">Cut Deposit</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Info */}
        <div className="p-4 bg-slate-50 rounded-xl mb-4">
          <p className="text-sm font-semibold text-slate-900">{tenantName}</p>
          <p className="text-xs text-slate-500">{roomNumber}</p>
          <p className="text-sm font-mono font-bold text-amber-700 mt-2">
            Remaining Deposit: Rp {depositRemaining.toLocaleString()}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
              DEDUCTION AMOUNT (Rp)
            </label>
            <input
              type="number"
              min={1}
              max={depositRemaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
              REASON FOR DEDUCTION
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Describe the damage or reason for deduction..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !amount || !reason.trim()}
            className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><DollarSign className="w-3.5 h-3.5" /> Deduct Deposit</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
