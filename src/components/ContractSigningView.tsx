import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { PenLine, Check, Loader2, ArrowLeft, FileText } from "lucide-react";

interface ContractTemplate {
  propertyName: string;
  address: string;
  monthlyPrice: number;
  depositPrice: number;
  roomSize: string;
  contractFile: string;
  terms: string;
}

interface Props {
  propertyId: string;
  propertyName: string;
  roomId: number | null;
  roomNumber: string;
  userId: number;
  token: string;
  assignmentId?: number | null;
  onCompleted: () => void;
  onBack: () => void;
}

export default function ContractSigningView({ propertyId, propertyName, roomId, roomNumber, userId, token, assignmentId, onCompleted, onBack }: Props) {
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/contract-template`);
      if (res.ok) {
        setTemplate(await res.json());
      }
    } catch {
      setError("Failed to load contract template");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [template]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl("");
  };

  const uploadSignature = async (): Promise<string | null> => {
    if (!signatureDataUrl) return null;
    const blob = await (await fetch(signatureDataUrl)).blob();
    const formData = new FormData();
    formData.append("file", blob, "signature.png");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  };

  const handleSign = async () => {
    if (!signatureDataUrl) {
      setError("Please draw your signature");
      return;
    }
    setSigning(true);
    setError("");
    try {
      const sigUrl = await uploadSignature();
      if (!sigUrl) {
        setError("Failed to upload signature");
        setSigning(false);
        return;
      }

      if (assignmentId) {
        // Try to get existing contract, or create one
        let contractId: number | null = null;
        
        const contractRes = await fetch(`/api/contracts/by-assignment/${assignmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (contractRes.ok) {
          const contract = await contractRes.json();
          contractId = contract.contract_id;
        } else {
          // No contract exists - create one
          const now = new Date();
          const createRes = await fetch("/api/contracts", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              assignmentId: assignmentId,
              startDate: now.toISOString(),
              endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(),
            }),
          });
          if (createRes.ok) {
            const newContract = await createRes.json();
            contractId = newContract.contract_id;
          } else {
            setError("Failed to create contract");
            setSigning(false);
            return;
          }
        }

        if (contractId) {
          const res = await fetch(`/api/contracts/${contractId}/sign`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ signatureImage: sigUrl }),
          });
          if (res.ok) {
            onCompleted();
          } else {
            const data = await res.json();
            setError(data.error || "Failed to sign contract");
          }
        }
      } else {
        const res = await fetch("/api/contracts/sign-join", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId: userId.toString(), propertyId, signatureImage: sigUrl, roomId: roomId?.toString() }),
        });
        if (res.ok) {
          onCompleted();
        } else {
          const data = await res.json();
          setError(data.error || "Failed to sign contract");
        }
      }
    } catch {
      setError("Failed to sign contract");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center text-slate-500 text-sm">Failed to load contract</div>
      </div>
    );
  }

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
              <h2 className="font-display text-xl font-bold text-slate-900">Sign Your Contract</h2>
              <p className="text-xs text-slate-500">{propertyName}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Property</span>
              <span className="text-slate-900 font-bold">{template.propertyName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Room</span>
              <span className="text-slate-900 font-bold">{roomNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Address</span>
              <span className="text-slate-900 text-xs text-right max-w-[200px]">{template.address}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Room Size</span>
              <span className="text-slate-900 font-bold">{template.roomSize}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Monthly Rent</span>
              <span className="text-primary font-bold">Rp {template.monthlyPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Deposit</span>
              <span className="text-slate-900 font-bold">Rp {template.depositPrice.toLocaleString()}</span>
            </div>
          </div>

          {template.contractFile ? (
            <a
              href={template.contractFile}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-xs font-bold text-blue-700"
            >
              <FileText className="w-4 h-4" />
              View Contract PDF
            </a>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-h-40 overflow-y-auto">
              <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{template.terms}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PenLine className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Draw your signature below</span>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden">
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                className="w-full h-28 touch-none cursor-crosshair bg-white"
                style={{ display: "block" }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            {signatureDataUrl && (
              <button
                onClick={clearSignature}
                className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
              >
                Clear signature
              </button>
            )}
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 text-center">{error}</p>}

          <button
            onClick={handleSign}
            disabled={signing || !signatureDataUrl}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {signing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><Check className="w-4 h-4" /> Sign & Complete Registration</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
