import React, { useState, FormEvent } from "react";
import { Property } from "../types";
import { Building2, MapPin, BedDouble, ArrowRight, Plus, Search, Landmark, Trash2, ShieldCheck } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import MultiImageUploader from "./MultiImageUploader";
import Modal from "./ui/Modal";

interface OwnerPropertiesViewProps {
  properties: Property[];
  onAddProperty: (newProp: Omit<Property, "id">) => void;
  onDeleteProperty: (id: string) => Promise<void>;
  onViewDetails: (prop: Property) => void;
}

function PropertyCard({ prop, onDelete, onViewDetails }: { prop: Property; onDelete: (p: Property) => void; onViewDetails: (p: Property) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 transform hover:scale-[1.015] flex flex-col justify-between">
      <div>
        <div className="relative h-48 bg-slate-100 overflow-hidden group">
          <img
            referrerPolicy="no-referrer"
            src={prop.image || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80"}
            alt={prop.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-4 right-4 bg-primary-container/80 text-white font-mono text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs border border-white/10">
            {prop.occupancy}% Occupied
          </div>
          {prop.inviteCode && (
            <div className="absolute top-4 left-4 bg-slate-900/70 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs border border-white/10">
              Code: {prop.inviteCode}
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-display text-lg font-bold text-slate-900 mb-1.5 min-h-[1.5rem]">
            {prop.name}
          </h3>
          <p className="font-sans text-xs text-slate-500 flex items-center gap-1.5 mb-4 leading-tight min-h-[2.2rem]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            {prop.address}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-4 border-t border-slate-100 flex justify-between items-center">
        <button
          onClick={() => onDelete(prop)}
          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
          title="Delete property"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-700">
            <BedDouble className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs font-semibold">{prop.roomCount} Rooms</span>
          </div>
          <button
            onClick={() => onViewDetails(prop)}
            className="text-primary hover:text-primary-container font-mono text-xs font-bold flex items-center gap-1.5 group cursor-pointer"
          >
            Details
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerPropertiesView({ properties, onAddProperty, onDeleteProperty, onViewDetails }: OwnerPropertiesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  // New Property form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [inviteCode, setInviteCode] = useState("");

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;

    // Use default premium Unsplash building image if none is provided
    const image = images[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80";

    onAddProperty({
      name,
      address,
      roomCount: 0,
      occupancy: 0,
      image,
      inviteCode,
    });

    // Reset and close
    setName("");
    setAddress("");
    setImages([]);
    setInviteCode("");
    setShowAddModal(false);
  };

  // Filter properties
  const filteredProperties = properties.filter(prop =>
    (prop.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prop.address || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group properties by category
  const ownedProperties = filteredProperties.filter(p => p.category === 'owned' || !p.category);
  const delegatedProperties = filteredProperties.filter(p => p.category === 'delegated');
  const hasCategories = properties.some(p => p.category === 'delegated');

  // Stats
  const totalUnits = properties.reduce((acc, p) => acc + p.roomCount, 0);
  const avgOccupancy = Math.round(
    properties.reduce((acc, p) => acc + p.occupancy * p.roomCount, 0) / totalUnits
  ) || 0;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Portfolio Overview Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="font-mono text-xs text-secondary uppercase tracking-widest mb-1.5 font-semibold">
            Portfolio Overview
          </p>
          <h2 className="font-display text-3xl font-black text-on-surface tracking-tight">
            Your Properties
          </h2>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <div className="px-5 py-2.5 text-center border-r border-slate-250">
            <p className="font-mono text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Total Units
            </p>
            <p className="font-mono text-xl font-bold text-primary mt-0.5">
              {totalUnits}
            </p>
          </div>
          <div className="px-5 py-2.5 text-center">
            <p className="font-mono text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Occupancy
            </p>
            <p className="font-mono text-xl font-bold text-emerald-600 mt-0.5">
              {avgOccupancy}%
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter properties by name or region..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl md:text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-hidden shadow-2xs text-slate-700"
        />
      </div>

      {/* Grid */}
      {hasCategories ? (
        <div className="space-y-8">
          {/* Owned Properties */}
          {ownedProperties.length > 0 && (
            <div>
              <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Manages as Owner
                <span className="ml-auto font-mono text-xs text-slate-500">{ownedProperties.length} properties</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ownedProperties.map((prop) => (
                  <PropertyCard key={prop.id} prop={prop} onDelete={setDeleteTarget} onViewDetails={onViewDetails} />
                ))}
              </div>
            </div>
          )}

          {/* Delegated Properties */}
          {delegatedProperties.length > 0 && (
            <div>
              <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Manages as Admin
                <span className="ml-auto font-mono text-xs text-slate-500">{delegatedProperties.length} properties</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {delegatedProperties.map((prop) => (
                  <PropertyCard key={prop.id} prop={prop} onDelete={setDeleteTarget} onViewDetails={onViewDetails} />
                ))}
              </div>
            </div>
          )}

          {/* Create Card Shortcut */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setShowAddModal(true)}
              className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-primary hover:bg-slate-25/50 transition-all cursor-pointer group text-center min-h-[360px]"
            >
              <div className="w-16 h-16 rounded-full bg-primary/5 group-hover:scale-105 transition-transform flex items-center justify-center mb-4 text-primary">
                <Plus className="w-6 h-6" />
              </div>
              <p className="font-display text-lg font-bold text-slate-800">Add Property</p>
              <p className="font-sans text-xs text-slate-450 max-w-xs mt-1.5 leading-relaxed">
                Expand your rental portfolio by cataloging a new premium boarding house or residential complex.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProperties.map((prop) => (
            <PropertyCard key={prop.id} prop={prop} onDelete={setDeleteTarget} onViewDetails={onViewDetails} />
          ))}

          {/* Create Card Shortcut */}
          <div
            onClick={() => setShowAddModal(true)}
            className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-primary hover:bg-slate-25/50 transition-all cursor-pointer group text-center min-h-[360px]"
          >
            <div className="w-16 h-16 rounded-full bg-primary/5 group-hover:scale-105 transition-transform flex items-center justify-center mb-4 text-primary">
              <Plus className="w-6 h-6" />
            </div>
            <p className="font-display text-lg font-bold text-slate-800">Add Property</p>
            <p className="font-sans text-xs text-slate-450 max-w-xs mt-1.5 leading-relaxed">
              Expand your rental portfolio by cataloging a new premium boarding house or residential complex.
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-10 right-10 w-14 h-14 bg-primary hover:bg-primary-container text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 z-30 group"
      >
        <Plus className="w-6 h-6" />
        <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
          New Asset Property
        </span>
      </button>

      {/* Add Property Modal */}
      {showAddModal && (
        <Modal
          onClose={() => setShowAddModal(false)}
          title={
            <span className="flex items-center gap-2 text-primary">
              <Landmark className="w-5 h-5" /> Add Logged Asset
            </span>
          }
          footer={
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-property-form"
                className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                Submit Property
              </button>
            </div>
          }
        >
          <form id="add-property-form" onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                PROPERTY NAME
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Skyline Heights Tower C"
                maxLength={25}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                ADDRESS LOCATION
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Jl. Melati No. 45, Bandung"
                maxLength={200}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                INVITE CODE
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. SKYLINE"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm uppercase tracking-widest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                PROPERTY IMAGES
              </label>
              <div className="max-h-56 overflow-y-auto">
                <MultiImageUploader
                  initialUrls={images}
                  onUpload={(urls) => setImages(urls)}
                  maxImages={10}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Property"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently delete all room types and rooms associated with this property.`}
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          await onDeleteProperty(deleteTarget.id);
          setDeleting(false);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
