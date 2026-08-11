"use client";

import React, { useState } from "react";
import { Search, ArrowUpDown, Filter } from "lucide-react";

interface SearchbarProps {
  onSearch?: (query: string) => void;
}

export default function Searchbar({ onSearch }: SearchbarProps) {
  const [query, setQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearch) onSearch(val);
  };

  return (
    <div className="flex items-center justify-between gap-4 w-full bg-[#171719] border border-white/10 px-4 py-2.5 rounded-2xl shadow-inner my-3">
      {/* Left: Input Search Area */}
      <div className="flex items-center gap-3 flex-1">
        <Search size={18} className="text-zinc-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search tasks..."
          className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
        />
      </div>

      {/* Right: Controls & Filters */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
          <ArrowUpDown size={14} className="text-zinc-400" />
          <span>Sort by</span>
        </button>

        <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
          <Filter size={14} className="text-zinc-400" />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
}
