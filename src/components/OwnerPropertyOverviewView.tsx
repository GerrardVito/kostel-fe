import React, { useState, useEffect } from "react";
import { Property } from "../types";
import { ArrowLeft, MapPin, DollarSign, BedDouble, Settings, Copy, Check, X } from "lucide-react";
import { getStoredToken } from "../services/auth";
import MultiImageUploader from "./MultiImageUploader";

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

  const authHeaders = (): Record<string, string> => {
    const token = getStoredToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${property.id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
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
      navigator.clipboard.writeText(code);
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
      const res = await fetch(`/api/properties/${property.id}`, {
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
      });
      if (res.ok) {
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

      {/* Property Code Card */}
      {inviteCode && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                Property Invite Code
              </p>
              <p className="font-mono text-2xl font-black text-white tracking-widest">
                {inviteCode}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Share this code with tenants so they can apply to your property
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
              title="Copy code"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-scale-up border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                <Settings className="w-5 h-5" /> Property Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
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
                <MultiImageUploader
                  initialUrls={editImages}
                  onUpload={(urls) => setEditImages(urls)}
                  maxImages={10}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
