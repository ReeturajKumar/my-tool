"use client";

import React from "react";
import { TaskItem } from "./TaskCard";
import { Calendar, MessageSquare, Paperclip } from "lucide-react";

interface ListViewProps {
  tasks: (TaskItem & { statusTitle: string })[];
  onCardClick?: (task: TaskItem & { statusTitle: string }) => void;
}

export default function ListView({ tasks, onCardClick }: ListViewProps) {
  return (
    <div className="w-full bg-[#161617] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#1c1c1e] text-xs font-semibold text-zinc-400 border-b border-white/10">
        <div className="col-span-5">Task Name</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Due Date</div>
        <div className="col-span-2">Assignees</div>
        <div className="col-span-1 text-right">Metrics</div>
      </div>

      <div className="divide-y divide-white/5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onCardClick?.(task)}
            className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors cursor-pointer"
          >
            {/* Title & Tags */}
            <div className="col-span-5 flex flex-col gap-1">
              <h4 className="text-sm font-semibold text-white">{task.title}</h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {task.tags.map((tag) => (
                  <span
                    key={tag.label}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#6397FF]/15 text-[#6397FF] border border-[#6397FF]/20">
                {task.statusTitle}
              </span>
            </div>

            {/* Due Date */}
            <div className="col-span-2 text-xs text-zinc-400 flex items-center gap-1.5">
              <Calendar size={13} className="text-zinc-500" />
              <span>{task.dueDate}</span>
            </div>

            {/* Assignees */}
            <div className="col-span-2 flex items-center -space-x-2">
              {task.users.map((user, idx) => (
                <img
                  key={idx}
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border border-zinc-800 object-cover"
                />
              ))}
            </div>

            {/* Metrics */}
            <div className="col-span-1 flex items-center justify-end gap-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <MessageSquare size={12} />
                {task.commentsCount}
              </span>
              <span className="flex items-center gap-1">
                <Paperclip size={12} />
                {task.attachmentsCount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
