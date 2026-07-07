import React from "react";
import { Property } from "../types";
import { ArrowLeft, MapPin, DollarSign, BedDouble, Building2 } from "lucide-react";

interface OwnerPropertyOverviewViewProps {
  property: Property;
  onBack: () => void;
  onViewFinances: () => void;
  onViewRooms: () => void;
}

export default function OwnerPropertyOverviewView({
  property,
  onBack,
  onViewFinances,
  onViewRooms,
}: OwnerPropertyOverviewViewProps) {
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
            <h3 className="font-display text-2xl font-bold mb-1">{property.name}</h3>
            <p className="font-sans text-sm flex items-center gap-1.5 opacity-90">
              <MapPin className="w-4 h-4" />
              {property.address}
            </p>
          </div>
        </div>
      </div>

      {/* Two Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
      </div>
    </div>
  );
}
