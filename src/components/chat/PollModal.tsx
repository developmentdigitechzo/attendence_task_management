"use client";

import { useState } from "react";
import { BarChart3, Plus, Trash2, X, Check } from "lucide-react";

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPoll: (pollData: {
    question: string;
    options: { id: string; text: string; votes: string[] }[];
  }) => void;
}

export default function PollModal({
  isOpen,
  onClose,
  onSubmitPoll,
}: PollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length >= 6) {
      setError("Maximum 6 options allowed per poll.");
      return;
    }
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setError("At least 2 options are required.");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!question.trim()) {
      setError("Please enter a poll question.");
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError("Please provide at least 2 non-empty poll options.");
      return;
    }

    const pollPayload = {
      question: question.trim(),
      options: cleanOptions.map((text, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        text,
        votes: [],
      })),
    };

    onSubmitPoll(pollPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Create Team Poll</h3>
              <p className="text-[11px] text-slate-500">Ask your team members to vote</p>
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

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Poll Question *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Best time for sprint review tomorrow?"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Options (2 to 6)
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 w-4 text-center">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Remove option"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2.5 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-brand-50 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another option</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Create Poll</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
