"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Crown,
  Briefcase,
  Users,
} from "lucide-react";

export type PortalType = "admin" | "lead" | "employee" | "general";

interface RoleLoginFormProps {
  portal: PortalType;
}

const PORTAL_CONFIG = {
  admin: {
    title: "Administrator Portal",
    subtitle: "Sign in with your Super Admin credentials",
    roleLabel: "SUPER ADMIN",
    badgeColor: "bg-brand-500/20 text-brand-300 border-brand-500/30",
    icon: Crown,
    emailPlaceholder: "admin@digitechzo.com",
    defaultRole: "SUPER_ADMIN",
    accentColor: "border-t-brand-500",
    btnColor: "bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-brand-600/20",
    targetRoute: "/admin",
  },
  lead: {
    title: "Team Lead Portal",
    subtitle: "Sign in with your Engineering / Delivery Lead credentials",
    roleLabel: "TEAM LEAD / MANAGER",
    badgeColor: "bg-brand-500/20 text-brand-300 border-brand-500/30",
    icon: Briefcase,
    emailPlaceholder: "lead@digitechzo.com",
    defaultRole: "MANAGER",
    accentColor: "border-t-brand-500",
    btnColor: "bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-brand-600/20",
    targetRoute: "/lead",
  },
  employee: {
    title: "Employee Portal",
    subtitle: "Sign in to access your attendance, tasks, and daily workspace",
    roleLabel: "EMPLOYEE WORKSPACE",
    badgeColor: "bg-brand-500/20 text-brand-300 border-brand-500/30",
    icon: Users,
    emailPlaceholder: "employee@digitechzo.com",
    defaultRole: "EMPLOYEE",
    accentColor: "border-t-brand-500",
    btnColor: "bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-brand-600/20",
    targetRoute: "/employee",
  },
  general: {
    title: "WorkOS Portal",
    subtitle: "Internal Employee Management & Productivity System",
    roleLabel: "UNIFIED LOGIN",
    badgeColor: "bg-brand-500/20 text-brand-300 border-brand-500/30",
    icon: ShieldCheck,
    emailPlaceholder: "name@digitechzo.com",
    defaultRole: "EMPLOYEE",
    accentColor: "border-t-brand-500",
    btnColor: "bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-brand-600/20",
    targetRoute: "/",
  },
};

const GREEN_SPHERES = {
  ball1: "from-[#a3e635] via-[#65a30d] to-[#14532d] border-lime-300/50 shadow-[0_0_50px_rgba(132,204,22,0.45)]",
  ball2: "from-[#4ade80] via-[#16a34a] to-[#052e16] border-emerald-300/50 shadow-[0_0_45px_rgba(34,197,94,0.4)]",
  ball3: "from-[#2dd4bf] via-[#0d9488] to-[#042f2e] border-teal-300/50 shadow-[0_0_40px_rgba(20,184,166,0.35)]",
  ambient1: "bg-brand-500/30",
  ambient2: "bg-emerald-600/25",
};

const SPHERE_THEMES = {
  admin: GREEN_SPHERES,
  lead: GREEN_SPHERES,
  employee: GREEN_SPHERES,
  general: GREEN_SPHERES,
};

function FloatingBall({
  style,
  sizeClass,
  themeClass,
  animClass,
}: {
  style: React.CSSProperties;
  sizeClass: string;
  themeClass: string;
  animClass: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{ ...style, pointerEvents: "auto" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`absolute ${sizeClass} rounded-full cursor-pointer select-none transition-all duration-300 ease-out group ${
        isHovered
          ? "z-30 scale-140 sm:scale-160 shadow-[0_0_60px_rgba(92,181,40,0.9)]"
          : `${animClass} hover:z-20`
      }`}
    >
      {/* Normal 3D Glossy Sphere (Fades out smoothly on hover) */}
      <div
        className={`w-full h-full rounded-full sphere-gloss bg-gradient-to-br ${themeClass} border transition-all duration-300 ${
          isHovered ? "opacity-0 scale-75" : "opacity-100 scale-100"
        }`}
      />

      {/* Popped up ball.png with spring zoom */}
      <div
        className={`absolute inset-0 flex items-center justify-center p-0.5 rounded-full overflow-hidden transition-all duration-300 ease-out z-10 ${
          isHovered
            ? "opacity-100 scale-110 drop-shadow-[0_15px_35px_rgba(0,0,0,0.7)]"
            : "opacity-0 scale-50 pointer-events-none"
        }`}
      >
        <Image
          src="/ball.png"
          alt="Digitechzo Ball"
          fill
          sizes="160px"
          unoptimized
          loading="lazy"
          className="object-contain"
        />
      </div>

      {/* Floating brand badge on hover */}
      <div
        className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/95 text-white border border-brand-400/60 text-[10px] font-bold tracking-wider uppercase transition-all duration-200 pointer-events-none whitespace-nowrap shadow-2xl z-40 ${
          isHovered
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-75"
        }`}
      >
        Digitechzo
      </div>
    </div>
  );
}

export default function RoleLoginForm({ portal }: RoleLoginFormProps) {
  const router = useRouter();
  const config = PORTAL_CONFIG[portal] || PORTAL_CONFIG.general;
  const sphereTheme = SPHERE_THEMES[portal] || SPHERE_THEMES.general;
  const PortalIcon = config.icon;

  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Sign In states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up states (allowed on employee & general portals)
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(config.defaultRole);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          portal: portal !== "general" ? portal : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
      } else {
        router.push(data.redirectUrl || config.targetRoute);
        router.refresh();
      }
    } catch {
      setError("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: signupEmail,
          password: signupPassword,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
      } else {
        setSuccessMessage("Account created successfully! Redirecting...");
        setTimeout(() => {
          router.push(data.redirectUrl || config.targetRoute);
          router.refresh();
        }, 800);
      }
    } catch {
      setError("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic Image */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <Image
          src="/login_background.png"
          alt="Login Background"
          fill
          priority
          unoptimized
          className="object-cover object-center opacity-50 scale-105"
        />
        {/* Dark Vignette Overlay for Contrast & Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/40 to-slate-950/85 backdrop-blur-[1px]" />
      </div>

      {/* Fixed Fullscreen Background Animated Spheres Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
        {/* Background Animated Ambient Glowing Orbs / Halos */}
        <div
          className={`absolute -top-32 -right-32 w-[480px] h-[480px] ${sphereTheme.ambient1} rounded-full blur-3xl animate-ball-1`}
        />
        <div
          className={`absolute -bottom-32 -left-32 w-[520px] h-[520px] ${sphereTheme.ambient2} rounded-full blur-3xl animate-ball-2`}
        />
        <div
          className="absolute top-1/3 -left-28 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-ball-3"
        />
        <div
          className="absolute bottom-1/3 -right-28 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-ball-4"
        />

        {/* LEFT SIDE 3D FLOATING BALLS */}
        <FloatingBall
          style={{ top: "12%", left: "7%" }}
          sizeClass="w-24 h-24 sm:w-28 sm:h-28"
          themeClass={sphereTheme.ball1}
          animClass="animate-ball-1"
        />
        <FloatingBall
          style={{ top: "48%", left: "5%" }}
          sizeClass="w-16 h-16 sm:w-20 sm:h-20"
          themeClass={sphereTheme.ball2}
          animClass="animate-ball-3"
        />
        <FloatingBall
          style={{ bottom: "12%", left: "10%" }}
          sizeClass="w-12 h-12 sm:w-14 sm:h-14"
          themeClass={sphereTheme.ball3}
          animClass="animate-ball-4"
        />

        {/* RIGHT SIDE 3D FLOATING BALLS */}
        <FloatingBall
          style={{ top: "14%", right: "7%" }}
          sizeClass="w-24 h-24 sm:w-28 sm:h-28"
          themeClass={sphereTheme.ball2}
          animClass="animate-ball-2"
        />
        <FloatingBall
          style={{ top: "50%", right: "5%" }}
          sizeClass="w-16 h-16 sm:w-20 sm:h-20"
          themeClass={sphereTheme.ball1}
          animClass="animate-ball-5"
        />
        <FloatingBall
          style={{ bottom: "14%", right: "10%" }}
          sizeClass="w-12 h-12 sm:w-14 sm:h-14"
          themeClass={sphereTheme.ball3}
          animClass="animate-ball-1"
        />

        {/* Decorative Wave lines */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 400"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-56 opacity-40"
        >
          <path
            d="M -20 340 C 220 230, 560 190, 860 250 S 1140 330, 1230 280"
            fill="none"
            stroke="#5cb528"
            strokeOpacity="0.25"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
      </div>


      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Logo Card */}
        <div className="flex justify-center">
          <div className="w-24 h-16 rounded-2xl bg-white flex items-center justify-center p-2 shadow-xl shadow-black/40 ring-1 ring-brand-500/40">
            <Image
              src="/digitechzo-mark.png"
              alt="Digitechzo"
              width={216}
              height={126}
              priority
              unoptimized
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Header Badges & Title */}
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border mb-1.5 tracking-wide uppercase shadow-sm">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.badgeColor}`}>
              <PortalIcon className="w-3.5 h-3.5" />
              <span>{config.roleLabel}</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">
            {config.title}
          </h2>
          <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
            {config.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className={`bg-white py-6 px-6 shadow-2xl shadow-black/40 rounded-2xl sm:px-10 border border-slate-100 border-t-4 ${config.accentColor}`}>
          {/* Segmented Sign In / Sign Up Switcher (Uniform across all portals) */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-all text-center ${
                mode === "signin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-all text-center ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === "signin" && (
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={config.emailPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Enter your password
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
                className={`w-full h-10 ${config.btnColor} text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2`}
              >
                <span>{loading ? "Authenticating..." : `Sign In to ${config.title}`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* SIGN UP FORM (Employees only) */}
          {mode === "signup" && (
            <form className="space-y-3.5" onSubmit={handleSignUp}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Fernandes"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="employee@digitechzo.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                  />
                </div>
              </div>

              {portal === "general" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition appearance-none cursor-pointer"
                    >
                      <option value="EMPLOYEE">Employee (Employee Portal)</option>
                      <option value="MANAGER">Team Lead (Lead Portal)</option>
                      <option value="SUPER_ADMIN">Administrator (Admin Portal)</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
              >
                <span>{loading ? "Registering..." : "Create WorkOS Account"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
