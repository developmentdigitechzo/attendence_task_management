"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
      } else {
        router.push(data.redirectUrl || "/");
        router.refresh();
      }
    } catch {
      setError("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Accent Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
      {/* Swoosh echoing the arc in the Digitechzo logo */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-56 pointer-events-none"
      >
        <path
          className="swoosh-draw"
          d="M -20 340 C 220 230, 560 190, 860 250 S 1140 330, 1230 280"
          fill="none"
          stroke="#5cb528"
          strokeOpacity="0.35"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          className="swoosh-draw"
          d="M -20 372 C 260 280, 600 250, 900 300 S 1150 370, 1230 330"
          fill="none"
          stroke="#5cb528"
          strokeOpacity="0.15"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-24 h-16 rounded-2xl bg-white flex items-center justify-center p-2 shadow-xl shadow-black/40 ring-1 ring-brand-500/40">
            <Image
              src="/digitechzo-mark.png"
              alt="Digitechzo"
              width={216}
              height={126}
              priority
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Digi<span className="text-brand-400">tech</span>zo WorkOS
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Internal Employee Management & Productivity System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl shadow-black/40 rounded-2xl sm:px-10 border border-slate-100 border-t-4 border-t-brand-500">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@digitechzo.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[10px] text-brand-600 cursor-pointer hover:underline">
                  Default: password123
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Signing in..." : "Sign in to WorkOS"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Switcher for the 3 Portals */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Direct Portal Quick Switch (1-Click Fill)
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@digitechzo.com")}
                className="w-full text-left p-2.5 rounded-xl border border-ink-300 bg-ink-50/50 hover:bg-ink-100/60 hover:border-ink-400 transition flex items-center justify-between"
              >
                <div>
                  <strong className="block text-xs text-ink-800 font-bold">
                    👑 1. Admin Portal (/admin)
                  </strong>
                  <span className="text-[10px] text-ink-600 font-medium">
                    admin@digitechzo.com • Super Admin
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ink-600 text-white shadow-xs">
                  Fill Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("manager@digitechzo.com")}
                className="w-full text-left p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 hover:border-amber-400 transition flex items-center justify-between"
              >
                <div>
                  <strong className="block text-xs text-amber-950 font-bold">
                    🎯 2. Team Lead Portal (/lead)
                  </strong>
                  <span className="text-[10px] text-amber-700 font-medium">
                    manager@digitechzo.com • Vikram Sharma
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                  Fill Lead
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("john@digitechzo.com")}
                className="w-full text-left p-2.5 rounded-xl border border-brand-200 bg-brand-50/50 hover:bg-brand-100/60 hover:border-brand-400 transition flex items-center justify-between"
              >
                <div>
                  <strong className="block text-xs text-brand-950 font-bold">
                    💻 3. Employee Portal (/employee)
                  </strong>
                  <span className="text-[10px] text-brand-700 font-medium">
                    john@digitechzo.com • John Fernandes
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-600 text-white shadow-xs">
                  Fill Employee
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
