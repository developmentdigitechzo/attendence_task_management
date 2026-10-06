"use client";

import { useState } from "react";
import { Link2, ShieldCheck, ShieldAlert, ExternalLink, X, Check, Lock, Globe } from "lucide-react";
import { verifyUrl, VerifiedLinkInfo } from "@/lib/linkUtils";

interface LinkVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertLink: (url: string) => void;
  initialUrl?: string;
}

export default function LinkVerifyModal({
  isOpen,
  onClose,
  onInsertLink,
  initialUrl = "",
}: LinkVerifyModalProps) {
  const [urlInput, setUrlInput] = useState(initialUrl || "");
  const [verification, setVerification] = useState<VerifiedLinkInfo | null>(
    initialUrl ? verifyUrl(initialUrl) : null
  );

  if (!isOpen) return null;

  const handleInputChange = (val: string) => {
    setUrlInput(val);
    if (val.trim()) {
      setVerification(verifyUrl(val));
    } else {
      setVerification(null);
    }
  };

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verification || !verification.isValid) return;
    onInsertLink(verification.url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Verify & Insert Web Link</h3>
              <p className="text-[11px] text-slate-500">
                Check URL security and safety before sending
              </p>
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

        <form onSubmit={handleInsert} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Web Address (HTTP / HTTPS) *
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="https://example.com/document"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none font-mono"
                autoFocus
              />
            </div>
          </div>

          {/* Verification Status Card */}
          {verification && (
            <div
              className={`p-3.5 rounded-2xl border transition ${
                verification.isValid
                  ? verification.isSecure
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : "bg-amber-50/70 border-amber-200 text-amber-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {verification.isValid ? (
                  verification.isSecure ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}

                <div className="text-xs min-w-0 flex-1">
                  <p className="font-bold flex items-center gap-1.5">
                    {verification.isValid ? (
                      verification.isSecure ? (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          Verified Secure Link (HTTPS)
                        </span>
                      ) : (
                        <span className="text-amber-700">
                          Standard HTTP Link (Unencrypted)
                        </span>
                      )
                    ) : (
                      <span className="text-rose-700">Invalid Link Address</span>
                    )}
                  </p>

                  {verification.isValid ? (
                    <div className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                      <p>
                        Host: <strong className="font-mono text-slate-800">{verification.hostname}</strong>
                      </p>
                      <p className="truncate">
                        Target: <span className="font-mono text-slate-700">{verification.url}</span>
                      </p>
                      {verification.error && (
                        <p className="text-amber-700 font-medium">{verification.error}</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-rose-700">{verification.error}</p>
                  )}
                </div>
              </div>

              {verification.isValid && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <a
                    href={verification.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-brand-700 hover:underline flex items-center gap-1"
                  >
                    <span>Test open link in browser</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    Ready to send
                  </span>
                </div>
              )}
            </div>
          )}

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
              disabled={!verification?.isValid}
              className="px-5 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insert Verified Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
