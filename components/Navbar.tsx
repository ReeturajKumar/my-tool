"use client";

import React, { useState } from "react";
import {
  List,
  LayoutGrid,
  GitFork,
  Plus,
  Search,
  ArrowUpDown,
  Filter,
} from "lucide-react";

interface NavbarProps {
  activeView: "list" | "board" | "workflow";
  onViewChange: (view: "list" | "board" | "workflow") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Navbar({
  activeView,
  onViewChange,
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-2 w-full">
      {/* Left: Title */}
      <h1 className="text-3xl font-semibold tracking-tight text-white shrink-0">
        All projects
      </h1>

      {/* Right: Integrated Searchbar + View Toggle + Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 w-full lg:w-auto">
        {/* Compact Search Input */}
        <div className="flex items-center gap-2 bg-[#171719] border border-white/10 px-3.5 py-1.5 rounded-xl shadow-inner min-w-[200px] max-w-[280px] flex-1 lg:flex-none focus-within:border-white/20 transition-all">
          <Search size={15} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tasks..."
            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* View Toggle Bar (List | Board | Workflow) */}
        <div className="flex items-center bg-[#1c1c1e] border border-white/10 p-1 rounded-xl shrink-0">
          <button
            onClick={() => onViewChange("list")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeView === "list"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <List size={14} />
            <span>List</span>
          </button>

          <button
            onClick={() => onViewChange("board")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeView === "board"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LayoutGrid size={14} />
            <span>Board</span>
          </button>

          <button
            onClick={() => onViewChange("workflow")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeView === "workflow"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <GitFork size={14} />
            <span>Workflow</span>
          </button>
        </div>

        {/* Sort by Button */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#171719] hover:bg-white/10 rounded-xl transition-all border border-white/10 shrink-0">
          <ArrowUpDown size={13} className="text-zinc-400" />
          <span>Sort by</span>
        </button>

        {/* Filters Button */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#171719] hover:bg-white/10 rounded-xl transition-all border border-white/10 shrink-0">
          <Filter size={13} className="text-zinc-400" />
          <span>Filters</span>
        </button>

        {/* Add Task Primary Action Button */}
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#9D6FFF] hover:bg-[#8b57ff] text-white font-medium text-xs rounded-xl shadow-lg shadow-[#9D6FFF]/25 transition-all duration-200 active:scale-95 shrink-0">
          <Plus size={15} strokeWidth={2.5} />
          <span>Add task</span>
        </button>
      </div>
    </header>
  );
}
