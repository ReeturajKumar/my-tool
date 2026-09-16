"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Show, UserButton, useUser } from "@clerk/nextjs";
import {
  Plus,
  Search,
} from "lucide-react";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddTaskClick?: () => void;
  onAddStageClick?: () => void;
}

export default function Navbar({
  searchQuery,
  onSearchChange,
  onAddTaskClick,
  onAddStageClick,
}: NavbarProps) {
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const currentHour = currentTime.getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const userName = user?.firstName || user?.username || "there";

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Compact vs Full date formatting based on breakpoint
  const fullDate = currentTime.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const compactDate = currentTime.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const fullTime = currentTime.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const compactTime = currentTime.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 py-0.5 sm:py-1 w-full min-w-0">
      {/* Left: Dynamic Greeting & Proportional Realtime Clock */}
      <div className="flex items-center justify-between sm:block min-w-0">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg md:text-xl font-semibold tracking-tight text-white truncate leading-tight">
            {greeting}, <span className="text-zinc-200">{userName}</span>
          </h1>
          <p className="mt-0.5 text-[10px] sm:text-[11px] md:text-xs text-zinc-400 flex items-center gap-1 sm:gap-1.5 leading-none">
            {/* Short date on mobile, full date on medium+ */}
            <span className="sm:hidden">{compactDate}</span>
            <span className="hidden sm:inline">{fullDate}</span>

            <span className="text-zinc-600">·</span>

            {/* Short time on mobile (no jumping seconds), full with seconds on md+ */}
            <span className="font-mono text-zinc-300 sm:hidden">{compactTime}</span>
            <span className="font-mono text-zinc-300 hidden sm:inline">{fullTime}</span>
          </p>
        </div>

        {/* Mobile Profile / Auth Button */}
        <div className="flex items-center gap-1.5 sm:hidden shrink-0">
          <Show when="signed-out" treatPendingAsSignedOut>
            <Link
              href="/sign-in"
              className="px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:text-white bg-[#171719] hover:bg-white/10 rounded-lg transition-all border border-white/10"
            >
              Sign in
            </Link>
          </Show>

          <Show when="signed-in">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#171719] overflow-hidden">
              <UserButton />
            </div>
          </Show>
        </div>
      </div>

      {/* Right: Searchbar + Add Task + Auth Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto shrink-0">
        {/* Responsive Compact Search Input */}
        <div className="flex items-center gap-1.5 bg-[#171719] border border-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl shadow-inner flex-1 sm:w-48 md:w-56 lg:w-64 focus-within:border-white/20 transition-all min-w-0">
          <Search size={14} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="w-full bg-transparent text-[11px] sm:text-xs text-white placeholder-zinc-500 focus:outline-none min-w-0"
          />
        </div>

        {/* Add Stage Button */}
        {onAddStageClick && (
          <button
            onClick={onAddStageClick}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/10 hover:bg-white/15 text-white font-medium text-[11px] sm:text-xs rounded-lg sm:rounded-xl border border-white/10 transition-all duration-200 active:scale-95 shrink-0"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden xs:inline sm:inline">Add stage</span>
            <span className="inline xs:hidden sm:hidden">Stage</span>
          </button>
        )}

        {/* Add Task Compact Primary Button */}
        <button
          onClick={onAddTaskClick}
          className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#9D6FFF] hover:bg-[#8b57ff] text-white font-medium text-[11px] sm:text-xs rounded-lg sm:rounded-xl shadow-md shadow-[#9D6FFF]/20 transition-all duration-200 active:scale-95 shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span className="hidden xs:inline sm:inline">Add task</span>
          <span className="inline xs:hidden sm:hidden">Add</span>
        </button>

        {/* Desktop Profile / Auth Actions */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Show when="signed-out" treatPendingAsSignedOut>
            <Link
              href="/sign-in"
              className="px-3 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-[#171719] hover:bg-white/10 rounded-xl transition-all border border-white/10 shrink-0"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="px-3 py-1.5 text-xs font-medium text-black bg-white hover:bg-zinc-200 rounded-xl transition-all shadow-sm shrink-0"
            >
              Sign up
            </Link>
          </Show>

          <Show when="signed-in">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-xl border border-white/10 bg-[#171719] overflow-hidden">
              <UserButton />
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
}
