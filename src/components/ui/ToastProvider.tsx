"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, Bell, X } from "lucide-react";

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

const STYLES: Record<ToastType, { box: string; icon: string; Icon: any }> = {
  success: { box: "border-emerald-200", icon: "text-emerald-600 bg-emerald-50", Icon: CheckCircle2 },
  error: { box: "border-rose-200", icon: "text-rose-600 bg-rose-50", Icon: AlertCircle },
  info: { box: "border-slate-200", icon: "text-slate-600 bg-slate-100", Icon: Info },
  notification: { box: "border-brand-200", icon: "text-brand-600 bg-brand-50", Icon: Bell },
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

      let res: Response;
      try {
        res = await originalFetch(input, init);
      } catch (err) {
        if (!skip) toast.error("Network error. Please check your connection and try again.");
        throw err;
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
                {t.title && <p className="text-[13px] font-semibold text-slate-900">{t.title}</p>}
                <p className="text-[13px] text-slate-600 leading-snug break-words">{t.message}</p>
              </div>
            </>
          );
          return (
            <div
              key={t.id}
              role={t.type === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex items-start gap-3 bg-white border ${s.box} rounded-xl shadow-lg shadow-slate-900/10 p-3 animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              {t.href ? (
                <a href={t.href} onClick={() => dismiss(t.id)} className="flex items-start gap-3 flex-1 min-w-0">
                  {Content}
                </a>
              ) : (
                Content
              )}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
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
