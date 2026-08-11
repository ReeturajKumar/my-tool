"use client";

import React from "react";

interface StatusFilterBarProps {
  activeStatus: string;
  onStatusChange: (status: string) => void;
  counts: {
    all: number;
    todo: number;
    in_progress: number;
    under_review: number;
    ready: number;
  };
}

export default function StatusFilterBar({
  activeStatus,
  onStatusChange,
  counts,
}: StatusFilterBarProps) {
  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "todo", label: "To do", count: counts.todo },
    { id: "in_progress", label: "In progress", count: counts.in_progress },
    { id: "under_review", label: "Under review", count: counts.under_review },
    { id: "ready", label: "Ready", count: counts.ready },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {tabs.map((tab) => {
        const isActive = activeStatus === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onStatusChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
              isActive
                ? "bg-white text-black font-semibold shadow-md"
                : "bg-[#171719] text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? "bg-black/10 text-black" : "bg-white/10 text-zinc-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
