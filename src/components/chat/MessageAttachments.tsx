"use client";

import { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  File,
  Download,
  MapPin,
  ExternalLink,
  BarChart3,
  CheckCircle2,
  Lock,
  Globe,
  ShieldCheck,
  Maximize2,
  X,
} from "lucide-react";
import { extractUrls, verifyUrl } from "@/lib/linkUtils";

interface MessageAttachmentsProps {
  attachmentsJson?: string | null;
  messageText?: string | null;
  messageId?: string;
  currentUserId?: string | null;
  onPollVoteSuccess?: () => void;
}

export default function MessageAttachments({
  attachmentsJson,
  messageText = "",
  messageId = "",
  currentUserId = "",
  onPollVoteSuccess,
}: MessageAttachmentsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);

  let attachments: any[] = [];
  if (attachmentsJson) {
    try {
      const parsed = typeof attachmentsJson === "string" ? JSON.parse(attachmentsJson) : attachmentsJson;
      if (Array.isArray(parsed)) {
        attachments = parsed.filter((item) => item && typeof item === "object");
      } else if (parsed && typeof parsed === "object") {
        attachments = [parsed];
      }
    } catch {
      attachments = [];
    }
  }

  // Extract any web links from the message text
  const extractedUrls = extractUrls(messageText);

  const handleVote = async (optionId: string) => {
    if (!messageId || !optionId) return;
    setVotingOptionId(optionId);
    try {
      const res = await fetch("/api/chat/poll-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, optionId }),
      });
      if (res.ok) {
        onPollVoteSuccess?.();
      }
    } catch (e) {
      console.error("Poll vote error:", e);
    } finally {
      setVotingOptionId(null);
    }
  };

  const getDocIcon = (filename?: string) => {
    if (!filename || typeof filename !== "string") return File;
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (["pdf", "doc", "docx"].includes(ext)) return FileText;
    if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
    if (["zip", "rar", "7z", "tar"].includes(ext)) return FileArchive;
    if (["js", "ts", "json", "html", "css", "py"].includes(ext)) return FileCode;
    return File;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || typeof bytes !== "number" || isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const imageAttachments = Array.isArray(attachments)
    ? attachments.filter((a) => a && typeof a === "object" && a.type === "image" && Boolean(a.url))
    : [];
  const docAttachments = Array.isArray(attachments)
    ? attachments.filter((a) => a && typeof a === "object" && a.type === "document")
    : [];
  const locAttachments = Array.isArray(attachments)
    ? attachments.filter((a) => a && typeof a === "object" && a.type === "location")
    : [];
  const pollAttachments = Array.isArray(attachments)
    ? attachments.filter(
        (a) =>
          a &&
          typeof a === "object" &&
          (a.type === "poll" || (Boolean(a.question) && Array.isArray(a.options))) &&
          Array.isArray(a.options)
      )
    : [];

  const hasAnyAttachments =
    imageAttachments.length > 0 ||
    docAttachments.length > 0 ||
    locAttachments.length > 0 ||
    pollAttachments.length > 0 ||
    extractedUrls.length > 0;

  if (!hasAnyAttachments) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* 1. Attached Images */}
      {imageAttachments.map((img, idx) => (
        <div
          key={idx}
          className="relative group max-w-sm rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-900/5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.name || "Attached photo"}
            className="max-h-72 w-auto object-cover rounded-2xl cursor-pointer hover:opacity-95 transition"
            onClick={() => setSelectedImage(img.url)}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition bg-slate-900/75 backdrop-blur-xs text-white px-2 py-1 rounded-lg text-[10px]">
            <button
              type="button"
              onClick={() => setSelectedImage(img.url)}
              className="hover:underline flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" />
              View
            </button>
            <a
              href={img.url}
              download={img.name || "image.png"}
              className="hover:underline flex items-center gap-1 ml-1"
              title="Download image"
            >
              <Download className="w-3 h-3" />
            </a>
          </div>
        </div>
      ))}

      {/* 2. Attached Documents */}
      {docAttachments.map((doc, idx) => {
        const DocIcon = getDocIcon(doc.name);
        return (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl max-w-md transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <DocIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {doc.name || "Document"}
                </p>
                <p className="text-[10px] text-slate-500">
                  {formatFileSize(doc.size)}
                </p>
              </div>
            </div>

            {doc.url && (
              <a
                href={doc.url}
                download={doc.name || "document"}
                className="p-2 text-slate-500 hover:text-brand-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition shrink-0 ml-2"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        );
      })}

      {/* 3. Location Cards */}
      {locAttachments.map((loc, idx) => (
        <div
          key={idx}
          className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl max-w-sm space-y-2 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-950 truncate">
                {loc.label || "Shared Location"}
              </p>
              <p className="text-[10px] font-mono text-emerald-700 mt-0.5">
                {loc.latitude !== undefined && loc.longitude !== undefined
                  ? `${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}`
                  : "Location Pin"}
              </p>
            </div>
          </div>

          <a
            href={loc.mapsUrl || `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-100 rounded-xl text-[11px] font-semibold border border-emerald-200 transition"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>
        </div>
      ))}

      {/* 4. Interactive Poll Cards */}
      {pollAttachments.map((poll, idx) => {
        const totalVotes = Array.isArray(poll?.options)
          ? poll.options.reduce(
              (sum: number, o: any) => sum + (o && Array.isArray(o.votes) ? o.votes.length : 0),
              0
            )
          : 0;

        return (
          <div
            key={idx}
            className="p-4 bg-white border-2 border-purple-200/80 rounded-2xl max-w-md space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {poll?.question || "Poll"}
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full shrink-0">
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
              </span>
            </div>

            <div className="space-y-2">
              {Array.isArray(poll?.options) &&
                poll.options.map((opt: any) => {
                  if (!opt || typeof opt !== "object") return null;
                  const voteCount = Array.isArray(opt?.votes) ? opt.votes.length : 0;
                  const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                  const hasVoted = Boolean(
                    currentUserId && Array.isArray(opt?.votes) && opt.votes.includes(currentUserId)
                  );

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleVote(opt.id)}
                      disabled={votingOptionId === opt.id}
                      className={`w-full text-left relative overflow-hidden rounded-xl border p-2.5 transition group ${
                        hasVoted
                          ? "border-purple-600 bg-purple-50/50"
                          : "border-slate-200 hover:border-purple-300 bg-slate-50/50"
                      }`}
                    >
                      {/* Live Vote Progress Bar */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 transition-all duration-300 opacity-20 ${
                          hasVoted ? "bg-purple-600" : "bg-purple-300"
                        }`}
                        style={{ width: `${percent}%` }}
                      />

                      <div className="relative flex items-center justify-between text-xs z-10">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              hasVoted
                                ? "border-purple-600 bg-purple-600 text-white"
                                : "border-slate-300 group-hover:border-purple-400"
                            }`}
                          >
                            {hasVoted && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span
                            className={`font-semibold truncate ${
                              hasVoted ? "text-purple-950 font-bold" : "text-slate-800"
                            }`}
                          >
                            {opt.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <span className="text-[11px] font-mono font-bold text-slate-700">
                            {percent}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({voteCount})
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })}

      {/* 5. Verified Link Preview Cards for links detected in message */}
      {extractedUrls.map((url, idx) => {
        const verified = verifyUrl(url);
        if (!verified || !verified.isValid) return null;

        return (
          <div
            key={idx}
            className={`p-3 rounded-2xl border max-w-md transition ${
              verified.isSecure
                ? "bg-slate-50 hover:bg-slate-100/90 border-slate-200"
                : "bg-amber-50/70 border-amber-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    verified.isSecure
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {verified.isSecure ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {verified.isSecure ? "Verified HTTPS Link" : "HTTP Web Link"}
                    </span>
                    {verified.isSecure && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        <Lock className="w-2.5 h-2.5" /> Secure
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                    {verified.hostname}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    {verified.url}
                  </p>
                </div>
              </div>

              <a
                href={verified.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white border border-transparent hover:border-slate-200 transition shrink-0"
                title="Open in new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        );
      })}

      {/* Lightbox Image Zoom Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
              title="Close image"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Expanded preview"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain ring-1 ring-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
