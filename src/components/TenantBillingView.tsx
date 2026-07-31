import { useState } from "react";
import { Bill } from "../types";
import {
  CreditCard,
  Wallet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowRight,
  FileText,
  Landmark,
  Zap,
  Wifi,
  ShieldCheck,
  Check,
  Trash2,
  Upload,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import Modal from "./ui/Modal";
import { getStoredToken } from "../services/auth";

interface TenantBillingViewProps {
  bills: Bill[];
  onPayBill: (id: string) => void;
  onPayAllBills: () => void;
}

export default function TenantBillingView({
  bills,
  onPayBill,
  onPayAllBills,
}: TenantBillingViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [showLedgerReceipt, setShowLedgerReceipt] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteMessage, setDeleteMessage] = useState<string>("");
  const [markingBillId, setMarkingBillId] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string>("");

  const handleDeleteHistory = async () => {
    if (
      !window.confirm("Delete all paid bill history? This cannot be undone.")
    )
      return;
    setDeleting(true);
    setDeleteMessage("");
    try {
      const res = await fetch("/api/payments/history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify({ status: "paid" }),
      });
      if (res.ok) {
        const data = await res.json();
        setDeleteMessage(data.message || "History cleared");
        window.location.reload();
      } else {
        const data = await res.json();
        setDeleteMessage(data.error || "Failed to clear history");
      }
    } catch {
      setDeleteMessage("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkAsPaid = async (billId: string, amount: number) => {
    setSubmitting(true);
    setSubmitMessage("");
    try {
      const res = await fetch("/api/payment-confirmations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify({
          billId: Number(billId),
          amountClaimed: amount,
          paymentProof: paymentProof || undefined,
          notes: paymentNotes || undefined,
        }),
      });
      if (res.ok) {
        setSubmitMessage(
          "Payment confirmation submitted! Waiting for owner approval."
        );
        setMarkingBillId(null);
        setPaymentProof("");
        setPaymentNotes("");
        setTimeout(() => setSubmitMessage(""), 5000);
      } else {
        const data = await res.json();
        setSubmitMessage(data.message || "Failed to submit payment confirmation");
      }
    } catch {
      setSubmitMessage("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // Divide into unpaid/paid
  const unpaidBills = bills.filter(
    (b) =>
      b.status === "UNPAID" ||
      b.status === "OVERDUE" ||
      b.status === "LATE" ||
      b.status === "FAILED"
  );
  const paidBills = bills.filter(
    (b) => b.status === "PAID" || b.status === "PENDING" || b.status === "PARTIAL"
  );
  const totalOutstanding = unpaidBills.reduce((acc, b) => acc + b.amount, 0);

  // Filter bills in history based on selected month (or all)
  const filteredPaidBills = paidBills.filter((b) => {
    if (selectedMonth === "All") return true;
    return b.period.toLowerCase().includes(selectedMonth.toLowerCase());
  });

  // Unique billing months in state for the filter
  const months = ["All", "September", "August", "October"];

  // Select suitable icon based on bill type
  const getIconForBillType = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("rent")) {
      return <Landmark className="w-5 h-5 text-primary" />;
    }
    if (
      lower.includes("electricity") ||
      lower.includes("utilities") ||
      lower.includes("bolt")
    ) {
      return <Zap className="w-5 h-5 text-amber-500" />;
    }
    if (
      lower.includes("internet") ||
      lower.includes("wifi") ||
      lower.includes("web")
    ) {
      return <Wifi className="w-5 h-5 text-blue-500" />;
    }
    return <RefreshCw className="w-5 h-5 text-slate-500" />;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> PAID
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> PENDING
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            <AlertCircle className="w-3 h-3" /> PARTIAL
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
            <AlertTriangle className="w-3 h-3" /> LATE
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" /> FAILED
          </span>
        );
      case "UNPAID":
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
            <AlertCircle className="w-3 h-3" /> UNPAID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Submit Message */}
      {submitMessage && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold ${
            submitMessage.includes("Failed") || submitMessage.includes("error")
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {submitMessage}
        </div>
      )}

      {/* Dynamic Header */}
      <section className="flex justify-between items-center mb-2">
        <div>
          <span className="font-mono text-xs uppercase text-slate-500 tracking-wider">
            Financial Overview
          </span>
          <h2 className="font-display text-2xl font-bold text-slate-950">
            My Ledger
          </h2>
        </div>
      </section>

      {/* Balance Card */}
      <section className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet className="w-24 h-24" />
        </div>

        <div className="flex flex-col gap-1 relative z-10">
          <span className="font-sans text-xs uppercase tracking-widest text-slate-300 font-medium">
            Total Outstanding
          </span>
          <h2 className="font-mono text-4xl font-bold tracking-tight text-white mt-1">
            Rp{" "}
            {totalOutstanding.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </h2>
        </div>

        <div className="mt-6 flex justify-between items-end relative z-10">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
              Standard Due Date
            </span>
            <span className="font-sans text-sm font-semibold text-slate-100 mt-0.5">
              Oct 05, 2023
            </span>
          </div>

          <button
            onClick={onPayAllBills}
            disabled={unpaidBills.length === 0}
            className={`font-sans font-bold text-xs py-2.5 px-5 rounded-full shadow-xs active:scale-95 transition-all outline-hidden ${
              unpaidBills.length > 0
                ? "bg-secondary-container text-on-secondary-container hover:brightness-105 cursor-pointer"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            }`}
          >
            Pay All Now
          </button>
        </div>
      </section>

      {/* Unpaid Bills Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-lg font-bold text-primary">
            Unpaid Bills
          </h3>
          <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-sans text-xs font-semibold">
            {unpaidBills.length} Pending
          </span>
        </div>

        {unpaidBills.length > 0 ? (
          <div className="flex flex-col gap-3">
            {unpaidBills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-2xs">
                      {getIconForBillType(bill.type)}
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-slate-900 text-sm leading-tight">
                        {bill.type}
                      </h4>
                      <p className="font-sans text-xs text-slate-500">
                        {bill.period}
                      </p>
                      <div className="mt-1">{getStatusBadge(bill.status)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-primary/95 mb-1.5">
                      Rp {bill.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Mark as Paid form */}
                {markingBillId === bill.id ? (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600">
                        Payment Proof URL (optional)
                      </label>
                      <input
                        type="text"
                        value={paymentProof}
                        onChange={(e) => setPaymentProof(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                        placeholder="Enter payment proof URL"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600">
                        Notes (optional)
                      </label>
                      <textarea
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                        placeholder="Enter any notes"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleMarkAsPaid(bill.id, bill.amount)
                        }
                        disabled={submitting}
                        className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl flex-1 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Confirm Submission"}
                      </button>
                      <button
                        onClick={() => {
                          setMarkingBillId(null);
                          setPaymentProof("");
                          setPaymentNotes("");
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => onPayBill(bill.id)}
                      className="px-4 py-2 bg-primary text-white hover:bg-primary-container text-xs font-bold rounded-xl flex-1 cursor-pointer transition-colors"
                    >
                      Pay Now
                    </button>
                    <button
                      onClick={() => setMarkingBillId(bill.id)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl flex-1 cursor-pointer transition-colors flex items-center justify-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Mark as Paid
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-8 text-center text-slate-500">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-sans text-xs">
              A lease completely zeroed out. No pending bills found!
            </p>
          </div>
        )}
      </section>

      {/* Payment History Section */}
      <section className="mb-8 font-sans">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-lg font-bold text-primary">
            Payment History
          </h3>
          <div className="flex gap-2 text-xs items-center">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-hidden font-medium text-slate-700 shadow-2xs cursor-pointer"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m} 2023
                </option>
              ))}
            </select>
            <button
              onClick={handleDeleteHistory}
              disabled={deleting || paidBills.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete all paid bill history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Clearing..." : "Clear History"}
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="flex flex-col divide-y divide-slate-100">
            {filteredPaidBills.length > 0 ? (
              filteredPaidBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-4 flex justify-between items-center hover:bg-slate-25/50 transition-colors"
                >
                  <div className="flex gap-4 items-center">
                    {bill.status === "PAID" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : bill.status === "PARTIAL" ? (
                      <AlertCircle className="w-5 h-5 text-blue-500" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-amber-500 animate-spin-reverse" />
                    )}
                    <div>
                      <p className="font-sans font-semibold text-slate-800 text-sm">
                        {bill.type}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400">
                        {bill.status === "PAID"
                          ? `Paid on ${bill.paidDate || "Aug 30, 2023"}`
                          : bill.status === "PARTIAL"
                          ? "Partial Payment"
                          : "Processing Payment"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-slate-800">
                      Rp {bill.amount.toFixed(2)}
                    </p>
                    {getStatusBadge(bill.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No activity logs match the selected month filter.
              </div>
            )}
          </div>
          {deleteMessage && (
            <div className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border-t border-slate-100">
              {deleteMessage}
            </div>
          )}
          <button
            onClick={() => setShowLedgerReceipt(true)}
            className="w-full py-4 bg-slate-50 text-primary font-sans text-xs font-bold hover:bg-slate-100 transition-colors uppercase gap-1 flex items-center justify-center border-t border-slate-100 cursor-pointer"
          >
            <FileText className="w-4 h-4" /> View Full Ledger Statement
          </button>
        </div>
      </section>

      {/* Ledger statement modal */}
      {showLedgerReceipt && (
        <Modal
          onClose={() => setShowLedgerReceipt(false)}
          footer={
            <button
              onClick={() => setShowLedgerReceipt(false)}
              className="w-full py-3 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
            >
              Close Ledger View
            </button>
          }
        >
          <div className="text-center pb-4 border-b border-dashed border-slate-250">
            <h3 className="font-display font-black text-2xl text-slate-900 tracking-tight leading-none uppercase">
              KOSTEL LEDGER
            </h3>
            <p className="font-mono text-[10px] text-slate-500 mt-2">
              TRANS-BLOCK LEDGER RECEIPT | STABLE PROTOCOL
            </p>
          </div>

          <div className="mt-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">RECEIPT ID:</span>
              <span className="text-slate-900 font-bold">#KST-9001402</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TENANT NAME:</span>
              <span className="text-slate-900 font-bold">Alex Johnston</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ROOM KEY:</span>
              <span className="text-slate-900 font-bold">Room 402</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">LEASE TERM:</span>
              <span className="text-slate-900 font-bold">
                Skyline HEIGHTS
              </span>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-250 space-y-2">
              <p className="font-sans font-bold text-xs text-slate-900 mb-1">
                Ledger Line Items:
              </p>
              {bills.map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between text-[11px]"
                >
                  <span className="text-slate-500">
                    · {b.type} ({b.period})
                  </span>
                  <span
                    className={`font-bold ${
                      b.status === "PAID"
                        ? "text-slate-700"
                        : "text-rose-600"
                    }`}
                  >
                    Rp {b.amount.toFixed(2)}{" "}
                    {b.status === "PAID" ? "[PAID]" : "[DUE]"}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-dashed border-slate-250 flex justify-between text-sm font-bold">
              <span className="text-slate-800">TOTAL PAID AMOUNT:</span>
              <span className="text-emerald-600">
                Rp{" "}
                {bills
                  .filter((b) => b.status === "PAID")
                  .reduce((a, b) => a + b.amount, 0)
                  .toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-800 text-rose-600">
                OUTSTANDING TO PAY:
              </span>
              <span className="text-rose-600">
                Rp {totalOutstanding.toFixed(2)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
