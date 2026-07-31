import React, { useState, useEffect } from "react";
import { Property } from "../types";
import { ArrowLeft, MapPin, DollarSign, BedDouble, Settings, Copy, Check, FileText } from "lucide-react";
import { getStoredToken } from "../services/auth";
import MultiImageUploader from "./MultiImageUploader";
import Modal from "./ui/Modal";

interface OwnerPropertyOverviewViewProps {
  property: Property;
  onBack: () => void;
  onViewFinances: () => void;
  onViewRooms: () => void;
}

interface PropertyDetail {
  property_id: number;
  property_name: string;
  property_type: string;
  description: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  image_urls: string[];
  invite_code: string;
}

export default function OwnerPropertyOverviewView({
  property,
  onBack,
  onViewFinances,
  onViewRooms,
}: OwnerPropertyOverviewViewProps) {
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [detail, setDetail] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editProvince, setEditProvince] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editInviteCode, setEditInviteCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [editTermsText, setEditTermsText] = useState("");
  const [editTermsFileUrl, setEditTermsFileUrl] = useState("");

  const authHeaders = (): Record<string, string> => {
    const token = getStoredToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [detailRes, termsRes] = await Promise.all([
        fetch(`/api/properties/${property.id}`, { headers: authHeaders() }),
        fetch(`/api/properties/${property.id}/terms`, { headers: authHeaders() }),
      ]);
      if (detailRes.ok) {
        const data = await detailRes.json();
        setDetail(data);
      }
      if (termsRes.ok) {
        const termsData = await termsRes.json();
        setEditTermsText(termsData.terms_text || "");
        setEditTermsFileUrl(termsData.terms_file_url || "");
      }
    } catch (e) {
      console.error("Failed to fetch property detail:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [property.id]);

  const handleCopyCode = () => {
    const code = detail?.invite_code || property.inviteCode;
    if (code) {
      const inviteLink = `${window.location.origin}/invite/${code}`;
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenSettings = () => {
    if (detail) {
      setEditName(detail.property_name);
      setEditType(detail.property_type || "");
      setEditDesc(detail.description || "");
      setEditAddress(detail.address);
      setEditCity(detail.city || "");
      setEditProvince(detail.province || "");
      setEditPostalCode(detail.postal_code || "");
      setEditImages(detail.image_urls || []);
      setEditInviteCode(detail.invite_code || "");
    }
    setShowSettings(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editAddress) return;
    setSaving(true);
    try {
      const [propRes] = await Promise.all([
        fetch(`/api/properties/${property.id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            name: editName,
            property_type: editType,
            description: editDesc,
            address: editAddress,
            city: editCity,
            province: editProvince,
            postal_code: editPostalCode,
            image_urls: editImages,
            invite_code: editInviteCode,
          }),
        }),
        fetch(`/api/properties/${property.id}/terms`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            terms_text: editTermsText,
            terms_file_url: editTermsFileUrl,
          }),
        }),
      ]);
      if (propRes.ok) {
        setShowSettings(false);
        fetchDetail();
      }
    } catch (e) {
      console.error("Failed to update property:", e);
    } finally {
      setSaving(false);
    }
  };

  const inviteCode = detail?.invite_code || property.inviteCode;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <p className="font-mono text-xs text-secondary uppercase tracking-widest font-semibold">
            Property Overview
          </p>
          <h2 className="font-display text-2xl font-black text-on-surface tracking-tight">
            {property.name}
          </h2>
        </div>
      </div>

      {/* Property Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="relative h-56 bg-slate-100">
          <img
            referrerPolicy="no-referrer"
            src={property.image || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"}
            alt={property.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <h3 className="font-display text-2xl font-bold mb-1">{detail?.property_name || property.name}</h3>
            <p className="font-sans text-sm flex items-center gap-1.5 opacity-90">
              <MapPin className="w-4 h-4" />
              {detail?.address || property.address}
              {detail?.city && `, ${detail.city}`}
              {detail?.province && `, ${detail.province}`}
            </p>
          </div>
        </div>
      </div>

      {/* Property Invite Link Card */}
      {inviteCode && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
            Tenant Invite Link
          </p>
          <p className="text-xs text-slate-400 mb-3">
            Share this link with tenants. They'll sign up directly at your property — no approval needed.
          </p>
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-700 rounded-xl p-3">
            <span className="font-mono text-sm text-emerald-400 break-all flex-1">
              {window.location.origin}/invite/{inviteCode}
            </span>
            <button
              onClick={handleCopyCode}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              title="Copy invite link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>
          <p className="font-mono text-[10px] text-slate-500 mt-2">
            Code: <span className="text-slate-300 font-bold tracking-widest">{inviteCode}</span>
          </p>
        </div>
      )}

      {/* Three Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Finances Card */}
        <button
          onClick={onViewFinances}
          className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer text-left group"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5 group-hover:bg-emerald-200 transition-colors">
            <DollarSign className="w-8 h-8 text-emerald-600" />
          </div>
          <h4 className="font-display text-xl font-bold text-slate-900 mb-2">
            Property Finances
          </h4>
          <p className="font-sans text-sm text-slate-500 leading-relaxed">
            View income, expenses, bills, and profit/loss breakdown for this property.
          </p>
        </button>

        {/* Rooms Card */}
        <button
          onClick={onViewRooms}
          className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer text-left group"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-5 group-hover:bg-blue-200 transition-colors">
            <BedDouble className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="font-display text-xl font-bold text-slate-900 mb-2">
            Rooms
          </h4>
          <p className="font-sans text-sm text-slate-500 leading-relaxed">
            Manage room types, individual rooms, tenant assignments, and room status.
          </p>
        </button>

        {/* Property Settings Card */}
        <button
          onClick={handleOpenSettings}
          className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs hover:shadow-lg hover:border-amber-300 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer text-left group"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-5 group-hover:bg-amber-200 transition-colors">
            <Settings className="w-8 h-8 text-amber-600" />
          </div>
          <h4 className="font-display text-xl font-bold text-slate-900 mb-2">
            Property Settings
          </h4>
          <p className="font-sans text-sm text-slate-500 leading-relaxed">
            Edit property details, address, images, and invite code.
          </p>
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Modal
          size="lg"
          onClose={() => setShowSettings(false)}
          title={
            <span className="flex items-center gap-2 text-primary">
              <Settings className="w-5 h-5" /> Property Settings
            </span>
          }
          footer={
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="property-settings-form"
                disabled={saving}
                className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          }
        >
          <form id="property-settings-form" onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                PROPERTY NAME
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                PROPERTY TYPE
              </label>
              <input
                type="text"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                placeholder="e.g. Kos, Apartment, Boarding House"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                DESCRIPTION
              </label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                placeholder="Describe your property..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                ADDRESS
              </label>
              <input
                type="text"
                required
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                  CITY
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                  PROVINCE
                </label>
                <input
                  type="text"
                  value={editProvince}
                  onChange={(e) => setEditProvince(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                  POSTAL CODE
                </label>
                <input
                  type="text"
                  value={editPostalCode}
                  onChange={(e) => setEditPostalCode(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                  INVITE CODE
                </label>
                <input
                  type="text"
                  value={editInviteCode}
                  onChange={(e) => setEditInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm uppercase tracking-widest"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                PROPERTY IMAGES
              </label>
              <div className="max-h-56 overflow-y-auto">
                <MultiImageUploader
                  initialUrls={editImages}
                  onUpload={(urls) => setEditImages(urls)}
                  maxImages={10}
                />
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-700 tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                TERMS & CONDITIONS
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Terms Text
                  </label>
                  <textarea
                    value={editTermsText}
                    onChange={(e) => setEditTermsText(e.target.value)}
                    placeholder="Enter terms and conditions text that tenants must agree to before signing the contract..."
                    rows={5}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Terms File URL (PDF or Image)
                  </label>
                  <input
                    type="url"
                    value={editTermsFileUrl}
                    onChange={(e) => setEditTermsFileUrl(e.target.value)}
                    placeholder="https://example.com/terms.pdf"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Upload a PDF or image and paste the URL here, or use the text field above
                  </p>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
