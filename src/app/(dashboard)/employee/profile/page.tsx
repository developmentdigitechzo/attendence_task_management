"use client";

import { useState, useEffect } from "react";
import {
  UserCheck,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  User,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";

export default function EmployeeProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setPhone(data.user.phone || "");
          setBio(data.user.bio || "");
          setSkills(data.user.skills || "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          phone,
          bio,
          skills,
        }),
      });

      if (res.ok) {
        setMessage("Profile updated successfully.");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage("Network error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Employee Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your organizational credentials, department, and contact information
        </p>
      </div>


      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 panel-hover">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-ink-500 text-white font-bold flex items-center justify-center text-2xl shadow-md shadow-brand-500/20 shrink-0">
          {user?.name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2) || "U"}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-xs text-brand-600 font-semibold">
                {user?.designation || "Staff"} • {user?.department?.name || "General Operations"}
              </p>
            </div>

            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 self-center sm:self-auto">
              ID: {user?.employeeId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 text-xs text-slate-600">
            <p className="flex items-center gap-2 justify-center sm:justify-start">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email}</span>
            </p>
            <p className="flex items-center gap-2 justify-center sm:justify-start">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.workLocation || "Headquarters"}</span>
            </p>
            <p className="flex items-center gap-2 justify-center sm:justify-start">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.workingHours || "09:00 - 18:00"}</span>
            </p>
            <p className="flex items-center gap-2 justify-center sm:justify-start">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Role: <strong>{user?.role}</strong></span>
            </p>
          </div>
        </div>
      </div>

      {/* Editable Fields Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 panel-hover">
        <h3 className="text-sm font-bold text-slate-900">
          Personal Information & Bio
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Core Skills & Specializations
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Next.js, TypeScript, UI/UX, Meta Ads"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Professional Bio
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A brief summary about your role and responsibilities..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
