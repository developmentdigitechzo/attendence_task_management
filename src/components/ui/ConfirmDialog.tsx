"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  /** When set, shows a text box; the promise resolves to the typed note (or null if cancelled) */
  noteLabel?: string;
  notePlaceholder?: string;
}

const CONFIRM_EVENT = "app:confirm";

interface Pending {
  options: ConfirmOptions;
  resolve: (value: any) => void;
}

/** Resolves true/false. Usage: if (!(await confirmAction({ message: "Sure?" }))) return; */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(CONFIRM_EVENT, { detail: { options, resolve } }));
  });
}

/** Resolves the note string (may be empty) on confirm, or null on cancel. */
export function promptAction(options: ConfirmOptions): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent(CONFIRM_EVENT, {
        detail: { options: { noteLabel: "Note (optional)", ...options }, resolve },
      })
    );
  });
}

export default function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [note, setNote] = useState("");
  const confirmBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Pending;
      setNote("");
      setPending(detail);
    };
    window.addEventListener(CONFIRM_EVENT, handler);
    return () => window.removeEventListener(CONFIRM_EVENT, handler);
  }, []);

  const close = useCallback(
    (ok: boolean) => {
      if (!pending) return;
      const isPrompt = !!pending.options.noteLabel;
      pending.resolve(isPrompt ? (ok ? note.trim() : null) : ok);
      setPending(null);
    },
    [pending, note]
  );

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    if (!pending.options.noteLabel) confirmBtn.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, close]);

  if (!pending) return null;
  const o = pending.options;
  const danger = o.variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && close(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3">
          <span
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              danger ? "bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-600"
            }`}
          >
            {danger ? <AlertTriangle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-slate-900">{o.title || "Please confirm"}</h3>
            <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">{o.message}</p>
          </div>
        </div>

        {o.noteLabel && (
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">{o.noteLabel}</label>
            <textarea
              autoFocus
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={o.notePlaceholder || "Add a remark..."}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none resize-none"
            />
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            onClick={() => close(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            {o.cancelText || "Cancel"}
          </button>
          <button
            ref={confirmBtn}
            onClick={() => close(true)}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {o.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}