"use client";

import { useState } from "react";
import { Smile, Sparkles, Heart, ThumbsUp, Briefcase, Zap } from "lucide-react";

interface EmojiPickerPopoverProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    icon: Smile,
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😋", "😎", "🥳", "🤩"],
  },
  {
    name: "Reactions & Hands",
    icon: ThumbsUp,
    emojis: ["👍", "👎", "👏", "🙌", "🤝", "✌️", "🤞", "🤟", "👊", "🤛", "🤜", "👌", "🤌", "🤏", "👋", "🙏", "💪"],
  },
  {
    name: "Work & Tech",
    icon: Briefcase,
    emojis: ["💻", "📱", "⌨️", "🖥️", "🚀", "📊", "📈", "📁", "📂", "📝", "📋", "📌", "📍", "⏰", "⏳", "☕", "💡", "🛠️", "⚙️"],
  },
  {
    name: "Emotions & Hearts",
    icon: Heart,
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "✨", "🔥", "💥", "⭐", "🌟", "🎉", "🎊"],
  },
];

export default function EmojiPickerPopover({
  onSelectEmoji,
  onClose,
}: EmojiPickerPopoverProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div
      className="absolute bottom-full mb-2 left-0 sm:left-4 z-40 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Category Tabs Header */}
      <div className="flex items-center justify-between p-2 bg-slate-50 border-b border-slate-200/80">
        <div className="flex items-center gap-1">
          {EMOJI_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(idx)}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  activeCategory === idx
                    ? "bg-white text-brand-700 shadow-2xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                }`}
                title={cat.name}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 px-2 py-0.5 rounded-md hover:bg-slate-200/50"
        >
          Close
        </button>
      </div>

      {/* Emoji Grid */}
      <div className="p-3 max-h-52 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          {EMOJI_CATEGORIES[activeCategory].name}
        </p>

        <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelectEmoji(emoji)}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
