"use client";

import { useState, useEffect, useRef } from "react";
import {
  Hash,
  MessageSquare,
  Search,
  Send,
  Plus,
  Smile,
  Pin,
  Trash2,
  Edit2,
  Paperclip,
  Check,
  X,
  User,
  MoreVertical,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  MapPin,
  BarChart3,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { formatTimeIST } from "@/lib/utils";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import EmojiPickerPopover from "@/components/chat/EmojiPickerPopover";
import PollModal from "@/components/chat/PollModal";
import LocationModal from "@/components/chat/LocationModal";
import LinkVerifyModal from "@/components/chat/LinkVerifyModal";
import MessageAttachments from "@/components/chat/MessageAttachments";
import { extractUrls, verifyUrl } from "@/lib/linkUtils";
import MonthlyBackupReminder, {
  MonthlyBackupHeaderActions,
} from "@/components/chat/MonthlyBackupReminder";

const EMOJI_LIST = ["👍", "❤️", "🚀", "🎉", "🔥", "👀", "🙌"];

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [directContacts, setDirectContacts] = useState<any[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"channels" | "chat">("chat");
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelTopic, setNewChannelTopic] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);

  // Rich Chat Features State (Images, Docs, Location, Poll, Emoji, Link Verify)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch current user & channels
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(console.error);

    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/chat/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
        setDirectContacts(data.directContacts || []);

        // Default to #general if nothing selected
        if (!activeChannelId && !activeRecipientId && data.channels?.length > 0) {
          const general = data.channels.find((c: any) => c.name === "general") || data.channels[0];
          setActiveChannelId(general.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Fetch messages for active channel or direct contact
  const fetchMessages = async () => {
    if (!activeChannelId && !activeRecipientId) return;

    try {
      const params = new URLSearchParams();
      if (activeChannelId) params.set("channelId", activeChannelId);
      if (activeRecipientId) params.set("recipientId", activeRecipientId);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/chat/messages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoadingMessages(true);
    fetchMessages().finally(() => setLoadingMessages(false));

    // Poll for new messages and message counts every 4 seconds
    const timer = setInterval(() => {
      fetchMessages();
      fetchChannels();
    }, 4000);
    return () => clearInterval(timer);
  }, [activeChannelId, activeRecipientId, searchQuery]);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (!editingMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachment({
        type: "image",
        name: file.name,
        url: reader.result as string,
        size: file.size,
      });
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Document file size should be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachment({
        type: "document",
        name: file.name,
        url: reader.result as string,
        size: file.size,
        ext: file.name.split(".").pop() || "doc",
      });
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !pendingAttachment) return;

    const textToSend = messageText.trim();
    const attachmentToSend = pendingAttachment ? [pendingAttachment] : null;

    setMessageText("");
    setPendingAttachment(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: activeChannelId,
          recipientId: activeRecipientId,
          content: textToSend,
          attachments: attachmentToSend,
        }),
      });

      if (res.ok) {
        fetchMessages();
        fetchChannels();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newChannelName,
          topic: newChannelTopic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsCreatingChannel(false);
        setNewChannelName("");
        setNewChannelTopic("");
        await fetchChannels();
        setActiveChannelId(data.channel.id);
        setActiveRecipientId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch("/api/chat/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      setShowEmojiPickerFor(null);
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePin = async (messageId: string, currentPin: boolean) => {
    try {
      await fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, isPinned: !currentPin }),
      });
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const ok = await confirmAction({
      title: "Delete Message",
      message: "Are you sure you want to delete this message? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await fetch(`/api/chat/messages?messageId=${messageId}`, {
        method: "DELETE",
      });
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingText.trim()) return;
    try {
      await fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, content: editingText }),
      });
      setEditingMessageId(null);
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeContact = directContacts.find((u) => u.id === activeRecipientId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6.5rem)] md:h-[calc(100dvh-7.5rem)] overflow-hidden panel-hover">
      {/* Left Chat Sidebar (Channels & DMs) */}
      <div
        className={`w-full md:w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 ${
          mobileTab === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Workspace Brand / Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
              #
            </div>
            <h2 className="font-bold text-sm text-white tracking-tight">Internal Channels</h2>
          </div>
          {currentUser?.role !== "EMPLOYEE" && (
            <button
              onClick={() => setIsCreatingChannel(true)}
              title="Create Channel"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Channels & DM scrollable list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
          {/* Public Group Channels */}
          <div>
            <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Channels
            </p>
            <div className="space-y-0.5">
              {channels.map((ch) => {
                const isActive = activeChannelId === ch.id;
                const count = ch.messageCount ?? ch._count?.messages ?? 0;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannelId(ch.id);
                      setActiveRecipientId(null);
                      setMobileTab("chat");
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? "bg-brand-600 text-white font-semibold shadow-xs"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate flex-1 text-left">{ch.name}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 font-semibold ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-slate-800 text-slate-300 border border-slate-700/60"
                        }`}
                        title={`${count} messages`}
                      >
                        {count > 999 ? "999+" : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages (1-on-1) */}
          <div>
            <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Direct Messages
            </p>
            <div className="space-y-0.5">
              {directContacts.map((contact) => {
                const isActive = activeRecipientId === contact.id;
                const count = contact.messageCount ?? 0;
                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setActiveRecipientId(contact.id);
                      setActiveChannelId(null);
                      setMobileTab("chat");
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? "bg-brand-600 text-white font-semibold shadow-xs"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-5 h-5 rounded-full bg-brand-500/30 text-brand-300 font-bold flex items-center justify-center text-[9px]">
                        {contact.name[0]}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                    </div>
                    <span className="truncate flex-1 text-left">{contact.name}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 font-semibold ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-slate-800 text-slate-300 border border-slate-700/60"
                        }`}
                        title={`${count} messages`}
                      >
                        {count > 999 ? "999+" : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Chat Main Pane */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-slate-50/40 ${
          mobileTab === "channels" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Chat Header */}
        <div className="h-14 px-3 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileTab("channels")}
              className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition shrink-0"
              title="Back to channels"
              aria-label="Back to channels"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {activeChannel ? (
              <>
                <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm shrink-0">
                  #
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      #{activeChannel.name}
                    </h3>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hidden xs:inline-block">
                      {messages.length} {messages.length === 1 ? "message" : "messages"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeChannel.topic || "Team workspace discussion"}
                  </p>
                </div>
              </>
            ) : activeContact ? (
              <>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-ink-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {activeContact.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {activeContact.name}
                    </h3>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hidden xs:inline-block">
                      {messages.length} {messages.length === 1 ? "message" : "messages"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeContact.designation || "Team Member"} • Direct Message
                  </p>
                </div>
              </>
            ) : (
              <h3 className="font-bold text-sm text-slate-700 truncate">Select a channel or message</h3>
            )}
          </div>

          {/* Search within this conversation & Backup Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative w-20 xs:w-32 sm:w-56 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/80 rounded-lg border border-slate-200/60 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>

            <MonthlyBackupHeaderActions />
          </div>
        </div>

        {/* 100-Day Retention Notice & Day 30 Monthly Backup Toast / Alert Banner */}
        <MonthlyBackupReminder />

        {/* Message Feed Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loadingMessages ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600 text-sm">No messages yet.</p>
              <p>Start the conversation with your team!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const isEditing = editingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`group relative flex gap-3 p-2.5 rounded-xl hover:bg-white hover:shadow-2xs transition ${
                    msg.isPinned ? "bg-amber-50/40 border-l-2 border-amber-500" : ""
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-ink-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                    {msg.sender?.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2) || "U"}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-slate-900">
                        {msg.sender?.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTimeIST(msg.createdAt)}
                      </span>
                      {msg.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      {msg.editedAt && (
                        <span className="text-[9px] text-slate-400 italic">(edited)</span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 mt-1">
                        <textarea
                          rows={2}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="px-2.5 py-1 bg-brand-600 text-white rounded text-[11px] font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.content && (
                          <p className="text-xs text-slate-700 leading-relaxed break-words whitespace-pre-line">
                            {msg.content}
                          </p>
                        )}
                        <MessageAttachments
                          attachmentsJson={msg.attachments}
                          messageText={msg.content || ""}
                          messageId={msg.id}
                          currentUserId={currentUser?.id}
                          onPollVoteSuccess={fetchMessages}
                        />
                      </>
                    )}

                    {/* Emoji Reactions Pill Bar */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {msg.reactions.map((r: any) => (
                          <button
                            key={r.id}
                            onClick={() => handleToggleReaction(msg.id, r.emoji)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[11px] font-medium text-slate-700 border border-slate-200 transition"
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[10px] font-semibold">{r.user?.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover Floating Actions Menu */}
                  <div className="opacity-0 group-hover:opacity-100 transition absolute right-3 top-2 bg-white shadow-md border border-slate-200 rounded-lg flex items-center p-1 gap-1 z-10">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)
                        }
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-brand-600"
                        title="Add reaction"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      {showEmojiPickerFor === msg.id && (
                        <div className="absolute right-0 top-7 bg-white shadow-xl border border-slate-200 rounded-xl p-1.5 flex gap-1 z-20">
                          {EMOJI_LIST.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-sm transition"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleTogglePin(msg.id, msg.isPinned)}
                      className={`p-1 rounded ${
                        msg.isPinned
                          ? "text-amber-600 bg-amber-50"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                      title={msg.isPinned ? "Unpin message" : "Pin message"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    {isMe && (
                      <button
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditingText(msg.content);
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-brand-600"
                        title="Edit message"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {(isMe || currentUser?.role === "SUPER_ADMIN") && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-600"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer & Rich Media Toolbar */}
        <div className="p-4 bg-white border-t border-slate-200/80 shrink-0">
          {/* Hidden File Upload Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />
          <input
            type="file"
            ref={docInputRef}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
            onChange={handleDocFileChange}
            className="hidden"
          />

          {/* Pending Attachment Preview Tray */}
          {pendingAttachment && (
            <div className="mb-2 p-2.5 bg-brand-50/80 border border-brand-200 rounded-xl flex items-center justify-between gap-2 text-xs animate-in fade-in duration-100">
              <div className="flex items-center gap-2.5 min-w-0">
                {pendingAttachment.type === "image" && (
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-brand-200 bg-white shadow-2xs">
                    <img
                      src={pendingAttachment.url}
                      alt="Pending"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {pendingAttachment.type === "document" && (
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                {pendingAttachment.type === "location" && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                )}
                {pendingAttachment.type === "poll" && (
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {pendingAttachment.type === "image" && `Photo: ${pendingAttachment.name}`}
                    {pendingAttachment.type === "document" && `Document: ${pendingAttachment.name}`}
                    {pendingAttachment.type === "location" && `Location: ${pendingAttachment.label}`}
                    {pendingAttachment.type === "poll" && `Poll: ${pendingAttachment.question}`}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {pendingAttachment.type === "image" && "Image attached • Ready to send"}
                    {pendingAttachment.type === "document" && "File attached • Ready to send"}
                    {pendingAttachment.type === "location" &&
                      `${pendingAttachment.latitude?.toFixed(4)}, ${pendingAttachment.longitude?.toFixed(4)}`}
                    {pendingAttachment.type === "poll" &&
                      `${pendingAttachment.options?.length} voting options created`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPendingAttachment(null)}
                className="p-1 hover:bg-brand-100 rounded-lg text-slate-400 hover:text-rose-600 transition"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Live Link Verification Notice if user typed a URL */}
          {(() => {
            const detected = extractUrls(messageText);
            if (!detected || detected.length === 0) return null;
            return (
              <div className="mb-2 flex items-center gap-1.5 flex-wrap">
                {detected.map((u, i) => {
                  const v = verifyUrl(u);
                  if (!v) return null;
                  return (
                    <div
                      key={i}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium border ${
                        v.isValid
                          ? v.isSecure
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}
                    >
                      {v.isValid ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <span className="truncate max-w-[240px]">
                        {v.isValid
                          ? `Verified link: ${v.hostname} (${v.isSecure ? "HTTPS Secure" : "HTTP"})`
                          : "Invalid link format"}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
            {/* Attachment Actions Menu Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu((prev) => !prev);
                  setShowEmojiPicker(false);
                }}
                className={`p-2.5 rounded-xl transition ${
                  showAttachMenu
                    ? "bg-brand-100 text-brand-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
                title="Attach photo, document, location, poll or verify link"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Attachments Dropdown Menu */}
              {showAttachMenu && (
                <div
                  className="absolute bottom-full mb-2 left-0 z-40 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-brand-700 hover:bg-slate-50 rounded-xl transition text-left"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>Photo / Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      docInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-brand-700 hover:bg-slate-50 rounded-xl transition text-left"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Document / File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      setIsLocationModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-brand-700 hover:bg-slate-50 rounded-xl transition text-left"
                  >
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>Share Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      setIsPollModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-brand-700 hover:bg-slate-50 rounded-xl transition text-left"
                  >
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    <span>Create Poll</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      setIsLinkModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-brand-700 hover:bg-slate-50 rounded-xl transition text-left"
                  >
                    <Link2 className="w-4 h-4 text-cyan-600" />
                    <span>Verify & Insert Link</span>
                  </button>
                </div>
              )}
            </div>

            {/* Emoji Picker Popover Toggle Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker((prev) => !prev);
                  setShowAttachMenu(false);
                }}
                className={`p-2.5 rounded-xl transition ${
                  showEmojiPicker
                    ? "bg-brand-100 text-brand-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
                title="Insert Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              {showEmojiPicker && (
                <EmojiPickerPopover
                  onSelectEmoji={(emoji) => {
                    setMessageText((prev) => prev + emoji);
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={
                activeChannel
                  ? `Message #${activeChannel.name}...`
                  : activeContact
                  ? `Message ${activeContact.name}...`
                  : "Type a message..."
              }
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
            />

            <button
              type="submit"
              disabled={!messageText.trim() && !pendingAttachment}
              className="p-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl shadow-xs transition disabled:opacity-40 shrink-0"
              title="Send Message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Modals for Rich Attachments */}
      <PollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onSubmitPoll={(poll) => setPendingAttachment(poll)}
      />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSubmitLocation={(loc) => setPendingAttachment({ type: "location", ...loc })}
      />

      <LinkVerifyModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onInsertLink={(url) => setMessageText((prev) => (prev ? `${prev} ${url}` : url))}
      />

      {/* Create Channel Modal */}
      {isCreatingChannel && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Create Channel</h3>
              <button
                onClick={() => setIsCreatingChannel(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Channel Name *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    #
                  </span>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. client-updates"
                    className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={newChannelTopic}
                  onChange={(e) => setNewChannelTopic(e.target.value)}
                  placeholder="What is this channel about?"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingChannel(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
