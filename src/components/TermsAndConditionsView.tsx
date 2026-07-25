import { useState, useEffect } from "react";
import { FileText, CheckCircle, ArrowLeft, Loader2, ExternalLink, FileCheck } from "lucide-react";

interface Props {
  propertyId: string;
  propertyName: string;
  token: string;
  onAgreed: () => void;
  onBack: () => void;
}

export default function TermsAndConditionsView({
  propertyId,
  propertyName,
  token,
  onAgreed,
  onBack,
}: Props) {
  const [termsText, setTermsText] = useState("");
  const [termsFileUrl, setTermsFileUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/terms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTermsText(data.terms_text || "");
          setTermsFileUrl(data.terms_file_url || "");
        }
      } catch (e) {
        console.error("Failed to fetch terms:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, [propertyId, token]);

  const hasContent = termsText || termsFileUrl;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Step 1 of 3
            </p>
            <h2 className="font-display font-bold text-slate-900">
              Terms & Conditions
            </h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* Property Name */}
              <div className="text-center">
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {propertyName}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Please read the following terms and conditions carefully
                </p>
              </div>

              {/* Terms Content */}
              {hasContent ? (
                <div className="space-y-4">
                  {/* Text Terms */}
                  {termsText && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-bold text-slate-700">
                          Terms & Conditions
                        </h4>
                      </div>
                      <div className="p-5 max-h-80 overflow-y-auto">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {termsText}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* File Terms */}
                  {termsFileUrl && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-bold text-slate-700">
                          Terms Document
                        </h4>
                      </div>
                      <div className="p-5">
                        {termsFileUrl.toLowerCase().endsWith(".pdf") ? (
                          <div className="space-y-3">
                            <iframe
                              src={termsFileUrl}
                              className="w-full h-64 rounded-lg border border-slate-200"
                              title="Terms Document"
                            />
                            <a
                              href={termsFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open full document
                            </a>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <img
                              src={termsFileUrl}
                              alt="Terms Document"
                              className="max-w-full rounded-lg border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <a
                              href={termsFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View full image
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    No terms and conditions have been set for this property.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    You may proceed to the next step.
                  </p>
                </div>
              )}

              {/* Agreement Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        agreed
                          ? "bg-primary border-primary"
                          : "border-slate-300 hover:border-primary/50"
                      }`}
                    >
                      {agreed && (
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      I have read and agree to the terms and conditions
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {hasContent
                        ? "Please read the terms above before agreeing"
                        : "No terms to review, you may proceed"}
                    </p>
                  </div>
                </label>
              </div>

              {/* Continue Button */}
              <button
                onClick={onAgreed}
                disabled={!agreed}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Continue to Contract Signing
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
