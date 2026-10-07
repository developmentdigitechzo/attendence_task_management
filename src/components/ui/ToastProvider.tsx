"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, Bell, X, Loader2 } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "notification";

export interface ToastOptions {
  title?: string;
  duration?: number; // ms, 0 = sticky
  href?: string;
}

interface ToastItem extends ToastOptions {
  id: number;
  type: ToastType;
  message: string;
}

const TOAST_EVENT = "app:toast";

/**
 * Global helper – usable anywhere on the client (components, handlers,
 * utilities) without needing the hook:
 *   toast.success("Saved"); toast.error("Something went wrong");
 */
function emit(type: ToastType, message: string, options: ToastOptions = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, { detail: { type, message, options } })
  );
}

export const toast = {
  success: (message: string, options?: ToastOptions) => emit("success", message, options),
  error: (message: string, options?: ToastOptions) => emit("error", message, options),
  info: (message: string, options?: ToastOptions) => emit("info", message, options),
  notification: (message: string, options?: ToastOptions) =>
    emit("notification", message, options),
};

const ToastContext = createContext(toast);
export const useToast = () => useContext(ToastContext);

export const MUTATION_EVENT = "app:mutation";

export function useIsMutating(): boolean {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const handler = (e: Event) => {
      const delta = (e as CustomEvent).detail?.delta || 0;
      setCount((prev) => Math.max(0, prev + delta));
    };
    window.addEventListener(MUTATION_EVENT, handler);
    return () => window.removeEventListener(MUTATION_EVENT, handler);
  }, []);
  return count > 0;
}

export const globalLoading = {
  start: () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(MUTATION_EVENT, { detail: { delta: 1 } }));
    }
  },
  stop: () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(MUTATION_EVENT, { detail: { delta: -1 } }));
    }
  },
};

const STYLES: Record<ToastType, { bg: string; box: string; icon: string; Icon: any }> = {
  success: {
    bg: "bg-emerald-700/95 backdrop-blur-md",
    box: "border-emerald-500/40 shadow-emerald-950/25",
    icon: "text-emerald-100 bg-white/15 border border-white/20",
    Icon: CheckCircle2,
  },
  error: {
    bg: "bg-rose-700/95 backdrop-blur-md",
    box: "border-rose-500/40 shadow-rose-950/25",
    icon: "text-rose-100 bg-white/15 border border-white/20",
    Icon: AlertCircle,
  },
  info: {
    bg: "bg-slate-900/95 backdrop-blur-md",
    box: "border-slate-700/50 shadow-black/35",
    icon: "text-brand-300 bg-brand-500/20 border border-brand-500/30",
    Icon: Info,
  },
  notification: {
    bg: "bg-brand-700/95 backdrop-blur-md",
    box: "border-brand-500/40 shadow-brand-950/25",
    icon: "text-brand-100 bg-white/15 border border-white/20",
    Icon: Bell,
  },
};

// Requests that should never raise automatic toasts (polling / high-frequency / silent)
const SILENT_PATHS = [
  "/api/notifications",
  "/api/push",
  "/api/auth/me",
  "/api/attendance/today",
  "/api/chat/",
];

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const lastRef = useRef<{ key: string; at: number }>({ key: "", at: 0 });

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string, options: ToastOptions = {}) => {
      // Drop exact duplicates fired within 1s (e.g. double handlers)
      const key = `${type}:${message}`;
      const now = Date.now();
      if (lastRef.current.key === key && now - lastRef.current.at < 1000) return;
      lastRef.current = { key, at: now };

      const id = ++idRef.current;
      const duration = options.duration ?? (type === "error" ? 6000 : 4000);
      setToasts((prev) => [...prev.slice(-4), { id, type, message, ...options }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  // Listen for toast events from the global helper
  useEffect(() => {
    const handler = (e: Event) => {
      const { type, message, options } = (e as CustomEvent).detail;
      push(type, message, options);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [push]);

  // Site-wide: toast the result of every mutating API call (POST/PUT/PATCH/DELETE)
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (
        init?.method || (input instanceof Request ? input.method : "GET")
      ).toUpperCase();
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.pathname
          : input.url;

      let path = url;
      try {
        path = new URL(url, window.location.origin).pathname;
      } catch {}

      const headers = new Headers(
        init?.headers || (input instanceof Request ? input.headers : undefined)
      );
      const skip =
        headers.get("x-skip-toast") === "1" ||
        !path.startsWith("/api/") ||
        SILENT_PATHS.some((p) => path.startsWith(p));
      const mutating = method !== "GET" && method !== "HEAD";
      const isActionMutation =
        mutating &&
        path.startsWith("/api/") &&
        !SILENT_PATHS.some((p) => path.startsWith(p));

      if (isActionMutation) {
        window.dispatchEvent(new CustomEvent(MUTATION_EVENT, { detail: { delta: 1 } }));
      }

      let res: Response;
      try {
        res = await originalFetch(input, init);
      } catch (err) {
        if (!skip) toast.error("Network error. Please check your connection and try again.");
        throw err;
      } finally {
        if (isActionMutation) {
          window.dispatchEvent(new CustomEvent(MUTATION_EVENT, { detail: { delta: -1 } }));
        }
      }

      if (!skip) {
        try {
          if (res.status === 401 && !path.startsWith("/api/auth/login")) {
            toast.error("Your session has expired. Please sign in again.");
          } else if (mutating || !res.ok) {
            const data = await res.clone().json().catch(() => null);
            if (!res.ok) {
              // Failed reads are toasted too, so nothing fails silently
              toast.error(data?.error || data?.message || `Request failed (${res.status}).`);
            } else if (mutating && data?.message) {
              toast.success(data.message);
            }
          }
        } catch {}
      }
      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
      >
        {toasts.map((t) => {
          const s = STYLES[t.type];
          const Content = (
            <>
              <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${s.icon}`}>
                <s.Icon className="w-[18px] h-[18px]" />
              </span>
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-[13px] font-semibold text-white">{t.title}</p>}
                <p className="text-[13px] text-white leading-snug break-words">{t.message}</p>
              </div>
            </>
          );
          return (
            <div
              key={t.id}
              role={t.type === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex items-start gap-3 ${s.bg} text-white border ${s.box} rounded-2xl shadow-2xl shadow-black/40 p-3.5 animate-in fade-in slide-in-from-bottom-3 duration-200 ease-out`}
            >
              {t.href ? (
                <a href={t.href} onClick={() => dismiss(t.id)} className="flex items-start gap-3 flex-1 min-w-0 text-white">
                  {Content}
                </a>
              ) : (
                Content
              )}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="shrink-0 p-1 text-white/80 hover:text-white rounded-md hover:bg-white/20 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
