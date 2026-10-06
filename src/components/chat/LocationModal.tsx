"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2, X, ExternalLink, Check } from "lucide-react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitLocation: (locData: {
    latitude: number;
    longitude: number;
    label: string;
    mapsUrl: string;
  }) => void;
}

export default function LocationModal({
  isOpen,
  onClose,
  onSubmitLocation,
}: LocationModalProps) {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [label, setLabel] = useState("My Current Location");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleGetGPS();
    }
  }, [isOpen]);

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLat(13.0827);
      setLng(80.2707);
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.warn("GPS error:", err.message);
        setError("Could not retrieve precise GPS. Using default location coordinates.");
        // Fallback default coordinates (Chennai / Digitechzo)
        setLat(13.0827);
        setLng(80.2707);
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLat = lat ?? 13.0827;
    const finalLng = lng ?? 80.2707;
    const mapsUrl = `https://www.google.com/maps?q=${finalLat},${finalLng}`;

    onSubmitLocation({
      latitude: finalLat,
      longitude: finalLng,
      label: label.trim() || "Shared Location",
      mapsUrl,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Share Location Pin</h3>
              <p className="text-[11px] text-slate-500">Send coordinates or place to chat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location Name / Note
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Digitechzo Office, Client Office, On-site"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                Coordinates
              </span>
              <button
                type="button"
                onClick={handleGetGPS}
                disabled={locating}
                className="text-[11px] font-semibold text-brand-600 hover:underline flex items-center gap-1"
              >
                {locating && <Loader2 className="w-3 h-3 animate-spin" />}
                Refresh GPS
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Latitude</span>
                <span className="font-semibold text-slate-800">
                  {lat !== null ? lat.toFixed(5) : "Fetching..."}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Longitude</span>
                <span className="font-semibold text-slate-800">
                  {lng !== null ? lng.toFixed(5) : "Fetching..."}
                </span>
              </div>
            </div>

            {lat && lng && (
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-brand-600 hover:underline flex items-center gap-1 pt-1"
              >
                <span>Preview pin on Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Share Location</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
