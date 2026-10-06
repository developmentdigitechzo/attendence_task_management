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
  Users,
  Briefcase,
  FolderGit2,
} from "lucide-react";
import { formatDateDisplay, formatWorkingHours } from "@/lib/utils";
import PushPrivacyCard, { PushVisibilityMode } from "@/components/profile/PushPrivacyCard";

export default function LeadProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [subordinateCount, setSubordinateCount] = useState<number>(0);
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
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/team/workload").then((r) => (r.ok ? r.json() : { workload: [] })),
    ])
      .then(([meData, teamData]) => {
        if (meData.user) {
          setUser(meData.user);
          setPhone(meData.user.phone || "");
          setBio(meData.user.bio || "");
          setSkills(meData.user.skills || "");
          setPushMessageVisibility(meData.user.pushMessageVisibility || "VISIBLE");
        }
        if (teamData?.workload) {
          setSubordinateCount(teamData.workload.length);
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
        setMessage("Team Lead profile updated successfully.");
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to update profile.");
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
    } catch {
      setPasswordError("Network error changing password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        <span className="text-xs">Loading Team Lead profile...</span>
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TL";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 uppercase tracking-wider">
            Team Lead Credentials
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Account & Security Settings
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
          Team Lead Profile & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal lead details, contact information, and account security
        </p>
      </div>

      {/* Main Profile Identity Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs panel-hover">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-brand-600/20 ring-4 ring-brand-100">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/15 text-brand-700 border border-brand-500/30">
                  TEAM LEAD / MANAGER
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700">{user?.designation || "Engineering Lead"}</span>
                <span>•</span>
                <span>{user?.department?.name || "Development"}</span>
                <span>•</span>
                <span className="font-mono text-slate-400">{user?.employeeId}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center min-w-[90px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Size</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5 flex items-center justify-center gap-1">
                <Users className="w-4 h-4 text-brand-600" />
                <span>{subordinateCount}</span>
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center min-w-[90px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reports To</p>
              <p className="text-xs font-bold text-slate-800 mt-1 truncate max-w-[110px]" title={user?.manager?.name || "Director"}>
                {user?.manager?.name || "Director"}
              </p>
            </div>
          </div>
        </div>

        {/* Read-only Information Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs text-slate-600">
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate" title={user?.email}>{user?.email}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{user?.workLocation || "Headquarters"}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{formatWorkingHours(user?.workingHours || "10:00 AM - 07:00 PM")}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Joined {formatDateDisplay(user?.joiningDate || user?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Profile Form & Change Password Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: EDITABLE PROFILE DETAILS (7 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleUpdateProfile}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 panel-hover"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-600" />
                  <span>Lead Contact & Profile Details</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your contact phone, leadership bio, and skill competencies
                </p>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 text-xs rounded-xl flex items-center gap-2 border ${
                  message.includes("success")
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {message.includes("success") ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{message}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ""}
                  className="w-full px-3 py-2 text-xs bg-slate-100/70 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.employeeId || ""}
                  className="w-full px-3 py-2 text-xs bg-slate-100/70 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3 py-2 text-xs bg-slate-100/70 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone (10 digits)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technical & Leadership Skills
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Architecture, Sprint Planning, TypeScript, Node.js, Mentorship"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Comma-separated competencies displayed across task assignment & team directories.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bio / Leadership Scope
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of your technical focus and responsibilities..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition resize-none"
              />
            </div>

            {/* Push Message Notification Privacy (Hide/Visible Option) */}
            <PushPrivacyCard
              value={pushMessageVisibility}
              onChange={setPushMessageVisibility}
              disabled={saving}
            />

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: CHANGE PASSWORD (5 cols) */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleChangePassword}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 panel-hover"
          >
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-600" />
                <span>Change Password</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your login credentials securely
              </p>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter existing password"
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password (min. 6 characters) *
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
