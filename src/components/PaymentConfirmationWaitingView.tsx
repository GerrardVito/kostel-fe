import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { Clock, CheckCircle2, XCircle, RefreshCw, ArrowLeft } from "lucide-react";

interface ConfirmationItem {
  confirmation_id: number;
  bill_id: number;
  amount_claimed: number;
  status: string;
  rejection_reason?: string;
  bill?: { bill_title?: string; bill_type?: string; total_amount?: number };
}

interface ConfirmationResult {
  confirmations: ConfirmationItem[];
  allConfirmed: boolean;
  anyRejected: boolean;
}

interface Props {
  assignmentId: number;
  propertyName: string;
  roomNumber: string;
  token: string;
  onConfirmed: () => void;
  onRejected: () => void;
}

export default function PaymentConfirmationWaitingView({
  assignmentId,
  propertyName,
  roomNumber,
  token,
  onConfirmed,
  onRejected,
}: Props) {
  const [data, setData] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const confirmedCalled = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/payment-confirmations/assignment/${assignmentId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const result: ConfirmationResult = await res.json();
        setData(result);
        if (result.allConfirmed && !confirmedCalled.current) {
          confirmedCalled.current = true;
          setTimeout(() => onConfirmed(), 1500);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [assignmentId, token, onConfirmed]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const anyRejected = data?.anyRejected ?? false;
  const allConfirmed = data?.allConfirmed ?? false;
  const pendingCount =
    data?.confirmations.filter((c) => c.status === "pending").length ?? 0;
  const totalAmount =
    data?.confirmations.reduce((s, c) => s + Number(c.amount_claimed), 0) ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          {/* Status icon */}
          <div className="text-center">
            {allConfirmed ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            ) : anyRejected ? (
              <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-rose-600" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            )}
          </div>

          {/* Property info */}
          <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-sm">
                {propertyName}
              </h3>
              <p className="text-xs text-slate-500">Room {roomNumber}</p>
            </div>
          </div>

          {/* Status message */}
          <div className="text-center space-y-2">
            {allConfirmed && (
              <>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Payment Confirmed!
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your payment has been verified. Proceeding to contract
                  signing...
                </p>
              </>
            )}

            {anyRejected && !allConfirmed && (
              <>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Payment Rejected
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your payment confirmation was rejected by the property owner.
                  Please try again.
                </p>
                {data?.confirmations
                  .filter((c) => c.status === "rejected")
                  .map((c) => (
                    <div
                      key={c.confirmation_id}
                      className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left mt-2"
                    >
                      <p className="text-xs font-bold text-rose-800">
                        {c.bill?.bill_title || "Bill"}
                      </p>
                      {c.rejection_reason && (
                        <p className="text-[10px] text-rose-600 mt-1">
                          Reason: {c.rejection_reason}
                        </p>
                      )}
                    </div>
                  ))}
              </>
            )}

            {!allConfirmed && !anyRejected && (
              <>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Awaiting Payment Confirmation
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your payment of{" "}
                  <span className="font-bold">
                    Rp {totalAmount.toLocaleString()}
                  </span>{" "}
                  is being reviewed by the property owner.
                </p>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mt-3">
                  <div className="flex items-center justify-center gap-2 text-xs text-blue-700 font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {pendingCount} confirmation{pendingCount !== 1 ? "s" : ""}{" "}
                    pending
                  </div>
                  <p className="text-[10px] text-blue-600 mt-1">
                    This page will automatically update once confirmed.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Confirmation details */}
          {data?.confirmations && data.confirmations.length > 0 && (
            <div className="space-y-2">
              {data.confirmations.map((c) => (
                <div
                  key={c.confirmation_id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {c.bill?.bill_title || `Bill #${c.bill_id}`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Rp {Number(c.amount_claimed).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : c.status === "rejected"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {c.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action button for rejected */}
          {anyRejected && !allConfirmed && (
            <button
              onClick={onRejected}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Try Again
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
