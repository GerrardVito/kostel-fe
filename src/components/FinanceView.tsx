import { useState, useEffect, useMemo } from "react";
import { Property } from "../types";
import { getStoredToken } from "../services/auth";
import Modal from "./ui/Modal";
import {
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Wallet,
  BedDouble,
  Calendar,
  Download,
} from "lucide-react";

interface FinanceViewProps {
  properties: Property[];
  token: string | null;
  userId?: number;
  financeSummary?: {
    total_income: number;
    total_expense: number;
    net_profit: number;
  };
  onRefresh?: () => void;
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
  room_number?: string;
  property_name?: string;
  category?: string;
}

interface RoomProfit {
  room_id: number;
  room_number: string;
  status: string;
  total_income: number;
  total_expense: number;
  profit: number;
}

interface Room {
  room_id: number;
  room_number: string;
  property_id: number;
}

function getStorageKey(userId?: number) {
  return `kostel_manual_transactions_${userId || "anonymous"}`;
}

function loadManualTransactions(userId?: number): Transaction[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveManualTransactions(userId: number | undefined, txs: Transaction[]) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(txs));
}

function normalizeApiTransaction(raw: any): Transaction {
  return {
    id: raw?.id ?? (raw?.transaction_id != null ? String(raw.transaction_id) : `api-${Math.random().toString(36).slice(2)}`),
    type: raw?.type === "expense" ? "expense" : "income",
    amount: Number(raw?.amount ?? 0),
    description: raw?.description ?? "",
    date: raw?.date ?? new Date().toISOString(),
    room_number: raw?.room_number ?? undefined,
    property_name: raw?.property_name ?? undefined,
    category: raw?.category ?? undefined,
  };
}

export default function FinanceView({ properties, token, userId, financeSummary, onRefresh }: FinanceViewProps) {
  const [roomProfits, setRoomProfits] = useState<RoomProfit[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [apiTransactions, setApiTransactions] = useState<Transaction[]>([]);
  const [manualTransactions, setManualTransactions] = useState<Transaction[]>(() => loadManualTransactions(userId));
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Income form state
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeRoomId, setIncomeRoomId] = useState("");
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split("T")[0]);
  const [incomeNotes, setIncomeNotes] = useState("");

  // Expense form state
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("maintenance");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expenseRoomId, setExpenseRoomId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const authToken = token || getStoredToken();

  useEffect(() => {
    fetchFinanceData();
  }, [token]);

  // Persist manual transactions whenever they change
  useEffect(() => {
    saveManualTransactions(userId, manualTransactions);
  }, [manualTransactions, userId]);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const [transactionsRes, roomsRes] = await Promise.all([
        fetch("/api/finances/transactions", { headers }),
        fetch("/api/rooms", { headers }),
      ]);

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        const normalized = (Array.isArray(data) ? data : []).map(normalizeApiTransaction);
        setApiTransactions(normalized);
      }

      if (roomsRes.ok) {
        const data = await roomsRes.json();
        setRooms(Array.isArray(data) ? data : []);
      }

      const allProfits: RoomProfit[] = [];
      for (const prop of properties) {
        const propId = prop.id.replace("prop-", "");
        try {
          const profitRes = await fetch(`/api/rooms/profit/property/${propId}`, { headers });
          if (profitRes.ok) {
            const profits = await profitRes.json();
            allProfits.push(...profits);
          }
        } catch {}
      }
      setRoomProfits(allProfits);
    } catch (e) {
      console.error("Failed to fetch finance data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Always merge: generated from roomProfits + API transactions + manual (localStorage)
  const allTransactions = useMemo(() => {
    const generated: Transaction[] = [];
    roomProfits.forEach((rp) => {
      if (rp.total_income > 0) {
        generated.push({
          id: `gen-income-${rp.room_id}`,
          type: "income",
          amount: rp.total_income,
          description: `Payment from Room ${rp.room_number}`,
          date: new Date().toISOString().split("T")[0],
          room_number: rp.room_number,
          category: "rent",
        });
      }
      if (rp.total_expense > 0) {
        generated.push({
          id: `gen-expense-${rp.room_id}`,
          type: "expense",
          amount: rp.total_expense,
          description: `Expense for Room ${rp.room_number}`,
          date: new Date().toISOString().split("T")[0],
          room_number: rp.room_number,
          category: "maintenance",
        });
      }
    });

    // Merge all sources, dedup by id
    const merged = new Map<string, Transaction>();
    generated.forEach((t) => merged.set(t.id, t));
    apiTransactions.forEach((t) => merged.set(t.id, t));
    manualTransactions.forEach((t) => merged.set(t.id, t));

    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [roomProfits, apiTransactions, manualTransactions]);

  // Available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allTransactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.add(key);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [allTransactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.room_number && t.room_number.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === "all" || t.type === typeFilter;

      let matchesMonth = true;
      if (monthFilter !== "all") {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        matchesMonth = key === monthFilter;
      }

      return matchesSearch && matchesType && matchesMonth;
    });
  }, [allTransactions, searchTerm, typeFilter, monthFilter]);

  // Summary: use shared API data by default, filtered data when user applies filters
  const isFiltered = monthFilter !== "all" || typeFilter !== "all" || searchTerm !== "";
  const filteredIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const filteredExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const filteredProfit = filteredIncome - filteredExpense;

  const totalIncome = isFiltered ? filteredIncome : (financeSummary?.total_income ?? filteredIncome);
  const totalExpense = isFiltered ? filteredExpense : (financeSummary?.total_expense ?? filteredExpense);
  const netProfit = isFiltered ? filteredProfit : (financeSummary?.net_profit ?? filteredProfit);

  const handleExportCsv = () => {
    const headers = ["Date", "Type", "Description", "Room", "Category", "Amount"];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleDateString("en-US"),
      t.type,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.room_number || "",
      t.category || "",
      t.type === "expense" ? -t.amount : t.amount,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finances_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getIncomeDescription = (roomId: string, notes: string) => {
    const room = rooms.find((r) => r.room_id.toString() === roomId);
    const roomLabel = room ? `Room ${room.room_number}` : "Unknown Room";
    const base = `Payment from ${roomLabel}`;
    return notes ? `${base} - ${notes}` : base;
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeAmount || !incomeRoomId) return;

    setSubmitting(true);
    const description = getIncomeDescription(incomeRoomId, incomeNotes);
    const room = rooms.find((r) => r.room_id.toString() === incomeRoomId);

    const newTransaction: Transaction = {
      id: `manual-income-${Date.now()}`,
      type: "income",
      amount: parseFloat(incomeAmount),
      description,
      date: incomeDate,
      room_number: room?.room_number,
      category: "manual_income",
    };

    // Try API first
    try {
      const res = await fetch("/api/finances/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: "income",
          amount: parseFloat(incomeAmount),
          description,
          date: incomeDate,
          room_id: parseInt(incomeRoomId),
          property_id: room?.property_id,
          category: "manual_income",
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setApiTransactions((prev) => [...prev, normalizeApiTransaction(saved)]);
        onRefresh?.();
      } else {
        setManualTransactions((prev) => [...prev, newTransaction]);
      }
    } catch {
      setManualTransactions((prev) => [...prev, newTransaction]);
    }

    setIncomeAmount("");
    setIncomeRoomId("");
    setIncomeNotes("");
    setIncomeDate(new Date().toISOString().split("T")[0]);
    setShowAddIncome(false);
    setSubmitting(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseDescription) return;

    setSubmitting(true);

    const room = rooms.find((r) => r.room_id.toString() === expenseRoomId);
    const roomLabel = room ? ` (Room ${room.room_number})` : "";

    const newTransaction: Transaction = {
      id: `manual-expense-${Date.now()}`,
      type: "expense",
      amount: parseFloat(expenseAmount),
      description: `${expenseDescription}${roomLabel}`,
      date: expenseDate,
      room_number: room?.room_number,
      category: expenseCategory,
    };

    try {
      const res = await fetch("/api/finances/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: "expense",
          amount: parseFloat(expenseAmount),
          description: `${expenseDescription}${roomLabel}`,
          date: expenseDate,
          room_id: expenseRoomId ? parseInt(expenseRoomId) : undefined,
          property_id: room?.property_id,
          category: expenseCategory,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setApiTransactions((prev) => [...prev, normalizeApiTransaction(saved)]);
        onRefresh?.();
      } else {
        setManualTransactions((prev) => [...prev, newTransaction]);
      }
    } catch {
      setManualTransactions((prev) => [...prev, newTransaction]);
    }

    setExpenseAmount("");
    setExpenseDescription("");
    setExpenseCategory("maintenance");
    setExpenseRoomId("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setShowAddExpense(false);
    setSubmitting(false);
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "rent":
        return "bg-blue-100 text-blue-700";
      case "maintenance":
        return "bg-amber-100 text-amber-700";
      case "utilities":
        return "bg-purple-100 text-purple-700";
      case "manual_income":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-20">
      {/* Header */}
      <section>
        <p className="font-mono text-xs text-secondary uppercase tracking-widest mb-1 font-semibold">
          Financial Management
        </p>
        <h2 className="font-display text-3xl font-black text-slate-900 tracking-tight">
          Finances
        </h2>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-semibold">
              Income
            </span>
          </div>
          <p className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Income
          </p>
          <h3 className="font-display text-2xl font-black text-emerald-600 mt-1">
            Rp {totalIncome.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="font-mono text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded font-semibold">
              Expense
            </span>
          </div>
          <p className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Expense
          </p>
          <h3 className="font-display text-2xl font-black text-red-500 mt-1">
            Rp {totalExpense.toLocaleString()}
          </h3>
        </div>

        <div className={`p-5 rounded-2xl border shadow-2xs hover:shadow-sm transition-all ${
          netProfit >= 0
            ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
            : "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
        }`}>
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2.5 rounded-xl ${
              netProfit >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <span className={`font-mono text-[10px] px-2 py-1 rounded font-semibold ${
              netProfit >= 0 ? "text-emerald-600 bg-emerald-100" : "text-red-600 bg-red-100"
            }`}>
              Net
            </span>
          </div>
          <p className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Net Profit
          </p>
          <h3 className={`font-display text-2xl font-black mt-1 ${
            netProfit >= 0 ? "text-emerald-700" : "text-red-600"
          }`}>
            Rp {netProfit.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-hidden text-sm text-slate-700"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Month Filter */}
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-semibold text-slate-600 cursor-pointer focus:ring-2 focus:ring-primary focus:outline-hidden appearance-none"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | "income" | "expense")}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 cursor-pointer focus:ring-2 focus:ring-primary focus:outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>

          <button
            onClick={() => setShowAddIncome(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Add Income
          </button>

          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            Add Expense
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Transaction History
            <span className="ml-auto font-mono text-[10px] text-slate-400 font-normal">
              {filteredTransactions.length} records
            </span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-25/50 font-sans text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-25/40 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
                      {new Date(t.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.type === "income"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {t.type === "income" ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-700">
                      {t.description}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
                      {t.room_number ? (
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3 h-3" />
                          {t.room_number}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getCategoryColor(t.category)}`}>
                        {(t.category || "other").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className={`px-6 py-3.5 text-right font-mono font-bold ${
                      t.type === "income" ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {t.type === "income" ? "+" : "-"} Rp {t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No transactions found. Add income or expense to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Income Modal */}
      {showAddIncome && (
        <Modal
          onClose={() => setShowAddIncome(false)}
          title={
            <span className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              Add Manual Income
            </span>
          }
          footer={
            <button
              type="submit"
              form="add-income-form"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding..." : "Add Income"}
            </button>
          }
        >
          <form id="add-income-form" onSubmit={handleAddIncome} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Amount (Rp)
              </label>
              <input
                type="number"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="e.g. 1500000"
                required
                min="0"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Room
              </label>
              <select
                value={incomeRoomId}
                onChange={(e) => setIncomeRoomId(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden text-sm cursor-pointer"
              >
                <option value="">Select room...</option>
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id}>
                    Room {r.room_number}
                  </option>
                ))}
              </select>
              {incomeRoomId && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Description will be: "{getIncomeDescription(incomeRoomId, incomeNotes)}"
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Additional Notes (Optional)
              </label>
              <input
                type="text"
                value={incomeNotes}
                onChange={(e) => setIncomeNotes(e.target.value)}
                placeholder="e.g. Late payment, partial payment..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden text-sm"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <Modal
          onClose={() => setShowAddExpense(false)}
          title={
            <span className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-red-500" />
              Add Expense
            </span>
          }
          footer={
            <button
              type="submit"
              form="add-expense-form"
              disabled={submitting}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding..." : "Add Expense"}
            </button>
          }
        >
          <form id="add-expense-form" onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Amount (Rp)
              </label>
              <input
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="e.g. 500000"
                required
                min="0"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="e.g. Plumbing repair, painting, cleaning..."
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden text-sm cursor-pointer"
              >
                <option value="maintenance">Maintenance</option>
                <option value="utilities">Utilities</option>
                <option value="renovation">Renovation</option>
                <option value="cleaning">Cleaning</option>
                <option value="supplies">Supplies</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Room (Optional)
              </label>
              <select
                value={expenseRoomId}
                onChange={(e) => setExpenseRoomId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden text-sm cursor-pointer"
              >
                <option value="">General / Not room-specific</option>
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id}>
                    Room {r.room_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden text-sm"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
