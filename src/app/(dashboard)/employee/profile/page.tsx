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
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
} from "lucide-react";
import { formatDateDisplay, formatWorkingHours } from "@/lib/utils";
import PushPrivacyCard, { PushVisibilityMode } from "@/components/profile/PushPrivacyCard";

export default function EmployeeProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [pushMessageVisibility, setPushMessageVisibility] = useState<PushVisibilityMode>("VISIBLE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setPhone(data.user.phone || "");
          setBio(data.user.bio || "");
          setSkills(data.user.skills || "");
          setPushMessageVisibility(data.user.pushMessageVisibility || "VISIBLE");
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
          pushMessageVisibility,
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password.");
        return;
      }

      setPasswordSuccess("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.message || "Network error changing password.");
    } finally {
      setChangingPassword(false);
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
          My Profile & Account
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your credentials, manage personal information, and update your account security
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
              <span>{formatWorkingHours(user?.workingHours)}</span>
            </p>
            <p className="flex items-center gap-2 justify-center sm:justify-start">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Role: <strong>{user?.role}</strong></span>
            </p>
          </div>
        </div>
      </div>

      {/* Editable Personal Fields Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 panel-hover">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Personal Information & Bio
          </h3>
          {message && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {message}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Phone Number
            </label>
            <span className="text-[10px] text-slate-400">
              {phone ? `${phone.length}/10 digits` : "10 digits"}
            </span>
          </div>
          <input
            type="tel"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhone(cleaned);
            }}
            placeholder="9876543210"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none font-mono"
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

        {/* Push Message Notification Privacy (Hide/Visible Option) */}
        <PushPrivacyCard
          value={pushMessageVisibility}
          onChange={setPushMessageVisibility}
          disabled={saving}
        />

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
          </button>
        </div>
      </form>

      {/* Security & Change Password Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 panel-hover">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-2xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
              <p className="text-[11px] text-slate-500">Update your account credentials to keep your portal secure</p>
            </div>
          </div>
        </div>

        {passwordError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  title={showCurrentPassword ? "Hide password" : "Show password"}
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  New Password
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Min 6 chars</span>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  title={showNewPassword ? "Hide password" : "Show password"}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
