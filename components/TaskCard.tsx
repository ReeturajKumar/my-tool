"use client";

import React from "react";
import { Calendar, MessageSquare, Paperclip } from "lucide-react";

export interface TaskTag {
  label: string;
  color: string; // Hex or tailwind class
}

export interface TaskUser {
  name: string;
  avatar: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  tags: TaskTag[];
  dueDate: string;
  users: TaskUser[];
  commentsCount: number;
  attachmentsCount: number;
  previewImage?: string;
  isFloating?: boolean;
}

interface TaskCardProps {
  task: TaskItem;
}

const tagColorStyles: Record<string, string> = {
  Web: "bg-[#6397FF] text-white",
  Design: "bg-[#FF6B6B] text-white",
  Backend: "bg-[#9D6FFF] text-white",
  Branding: "bg-[#FF6B6B] text-white",
  Mobile: "bg-[#F59E0B] text-white",
};

export default function TaskCard({ task }: TaskCardProps) {
  const isFloating = task.isFloating;

  if (isFloating) {
    return (
      <div className="relative group cursor-grab active:cursor-grabbing my-2 z-20 transform -rotate-3 scale-[1.03] transition-transform duration-200">
        {/* Floating White Card */}
        <div className="bg-white text-zinc-900 p-5 rounded-2xl shadow-2xl border border-white/20">
          {/* Tags & Date */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.tags.map((tag) => (
                <span
                  key={tag.label}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                    tagColorStyles[tag.label] || "bg-zinc-800 text-white"
                  }`}
                >
                  {tag.label}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium shrink-0">
              <Calendar size={13} />
              <span>{task.dueDate}</span>
            </div>
          </div>

          {/* Title & Description */}
          <h4 className="text-base font-bold text-zinc-900 tracking-tight leading-snug mb-1.5">
            {task.title}
          </h4>
          <p className="text-xs text-zinc-600 leading-relaxed mb-4 line-clamp-3">
            {task.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            {/* User Avatars Stack */}
            <div className="flex items-center -space-x-2">
              {task.users.map((user, idx) => (
                <img
                  key={idx}
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-3 text-xs text-zinc-600 font-medium">
              <div className="flex items-center gap-1">
                <MessageSquare size={13} className="text-zinc-500" />
                <span>{task.commentsCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Paperclip size={13} className="text-zinc-500" />
                <span>{task.attachmentsCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1b1b1e] hover:bg-[#202024] border border-white/10 p-5 rounded-2xl transition-all duration-200 hover:border-white/20 group cursor-pointer shadow-md">
      {/* Top: Tags & Date */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.tags.map((tag) => (
            <span
              key={tag.label}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium ${
                tagColorStyles[tag.label] || "bg-zinc-800 text-zinc-300"
              }`}
            >
              {tag.label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium shrink-0">
          <Calendar size={13} className="text-zinc-500" />
          <span>{task.dueDate}</span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-base font-semibold text-white tracking-tight leading-snug mb-1.5 group-hover:text-[#6397FF] transition-colors">
        {task.title}
      </h4>

      {/* Description */}
      <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-3">
        {task.description}
      </p>

      {/* Optional Attachment Image */}
      {task.previewImage && (
        <div className="my-3 rounded-xl overflow-hidden border border-white/10 max-h-36 bg-black/40">
          <img
            src={task.previewImage}
            alt={task.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        {/* User Avatars Stack */}
        <div className="flex items-center -space-x-2">
          {task.users.map((user, idx) => (
            <img
              key={idx}
              src={user.avatar}
              alt={user.name}
              className="w-6 h-6 rounded-full border-2 border-[#1b1b1e] object-cover"
            />
          ))}
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
          <div className="flex items-center gap-1">
            <MessageSquare size={13} className="text-zinc-500" />
            <span>{task.commentsCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Paperclip size={13} className="text-zinc-500" />
            <span>{task.attachmentsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
