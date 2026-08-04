import { useState } from "react";
import { motion } from "motion/react";
import { DollarSign, Loader2, ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";

interface Props {
  assignmentId: number;
  propertyName: string;
  roomNumber: string;
  roomTypeName: string;
  monthlyPrice: number;
  depositPrice: number;
  proratedAmount: number;
  token: string;
  onPaymentSubmitted: () => void;
  onBack: () => void;
}

export default function PaymentView({
  assignmentId,
  propertyName,
  roomNumber,
  roomTypeName,
  monthlyPrice,
  depositPrice,
  proratedAmount,
  token,
  onPaymentSubmitted,
  onBack,
}: Props) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const total = proratedAmount + depositPrice;

  const handlePay = async () => {
    setProcessing(true);
    setError("");
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/pay-bills`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onPaymentSubmitted();
      } else {
        const err = await res.json();
        setError(err.error || "Payment failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">Payment</h2>
              <p className="text-xs text-slate-500">{propertyName}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Room</span>
              <span className="text-slate-900 font-bold font-mono">{roomNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Type</span>
              <span className="text-slate-900 font-semibold">{roomTypeName}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-slate-900 text-sm">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Rent (Prorated)</p>
                    <p className="text-[10px] text-slate-400">First month - adjusted for check-in date</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900">Rp {proratedAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Security Deposit</p>
                    <p className="text-[10px] text-slate-400">Refundable</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900">Rp {depositPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-sm font-bold text-slate-900">Total Due Today</span>
              <span className="font-mono text-lg font-black text-primary">Rp {total.toLocaleString()}</span>
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 text-center">{error}</p>
          )}

          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Pay Now</>
            )}
          </button>

          <p className="text-[10px] text-slate-400 text-center">
            This is a demo payment. No real money will be charged.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
