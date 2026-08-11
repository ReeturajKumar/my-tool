"use client";

import React, { useEffect } from "react";
import { TaskItem } from "./TaskCard";
import {
  X,
  Calendar,
  MessageSquare,
  Paperclip,
  Tag,
  Users,
  Send,
} from "lucide-react";

interface TaskDetailModalProps {
  task: TaskItem & { statusTitle?: string };
  isOpen: boolean;
  onClose: () => void;
}

const tagColorStyles: Record<string, string> = {
  Web: "bg-[#6397FF] text-white",
  Design: "bg-[#FF6B6B] text-white",
  Backend: "bg-[#9D6FFF] text-white",
  Branding: "bg-[#FF6B6B] text-white",
  Mobile: "bg-[#F59E0B] text-white",
};

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
}: TaskDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-[#161618] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1c1c1f]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#6397FF]/15 text-[#6397FF] border border-[#6397FF]/30">
              {task.statusTitle || "Task Details"}
            </span>
            <span className="text-xs text-zinc-500 font-mono">ID: #{task.id}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
              {task.title}
            </h2>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-[#1b1b1e] border border-white/10 rounded-2xl">
            {/* Tags */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                <Tag size={12} /> Tags
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {task.tags.map((tag) => (
                  <span
                    key={tag.label}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                      tagColorStyles[tag.label] || "bg-zinc-800 text-white"
                    }`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                <Calendar size={12} /> Due Date
              </span>
              <p className="text-xs font-semibold text-white">{task.dueDate}</p>
            </div>

            {/* Metrics */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                Activity
              </span>
              <div className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
                <span className="flex items-center gap-1">
                  <MessageSquare size={13} className="text-zinc-500" />
                  {task.commentsCount} comments
                </span>
                <span className="flex items-center gap-1">
                  <Paperclip size={13} className="text-zinc-500" />
                  {task.attachmentsCount} files
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Description
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed bg-[#1b1b1e] p-4 rounded-2xl border border-white/5">
              {task.description}
            </p>
          </div>

          {/* Optional Attachment Preview Image */}
          {task.previewImage && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Attachment Preview
              </h4>
              <div className="rounded-2xl overflow-hidden border border-white/10 max-h-64 bg-black">
                <img
                  src={task.previewImage}
                  alt={task.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Assignees Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Users size={14} /> Assigned Members
            </h4>
            <div className="flex items-center gap-3 flex-wrap">
              {task.users.map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#1b1b1e] border border-white/10 rounded-xl"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-white">{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discussion & Comments Input */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <MessageSquare size={14} /> Activity & Comments
            </h4>

            {/* Comment Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                className="flex-1 bg-[#1b1b1e] border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#6397FF]"
              />
              <button className="p-2.5 bg-[#6397FF] hover:bg-[#4f84f0] text-white rounded-xl transition-all">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#1c1c1f]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
