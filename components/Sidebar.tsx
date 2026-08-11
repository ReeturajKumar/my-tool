"use client";

import React, { useState } from "react";
import {
  Home,
  LayoutGrid,
  TrendingUp,
  SlidersHorizontal,
  MessageSquare,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: boolean;
}

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const topNavItems: NavItem[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
    { id: "analytics", icon: TrendingUp, label: "Analytics" },
    { id: "controls", icon: SlidersHorizontal, label: "Controls" },
    { id: "messages", icon: MessageSquare, label: "Messages", badge: true },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const bottomNavItems: NavItem[] = [
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "logout", icon: LogOut, label: "Logout" },
  ];

  return (
    <aside className="w-[80px] h-[95vh] my-auto bg-[#161617] border border-white/10 rounded-[28px] flex flex-col items-center justify-between py-6 px-3 shadow-2xl transition-all duration-300 select-none">
      {/* Top Section: Logo + Main Nav */}
      <div className="flex flex-col items-center w-full gap-8">
        {/* Brand Logo (3 Slanted Stripes) */}
        <div className="p-1.5 cursor-pointer hover:opacity-80 transition-opacity">
          <svg
            width="34"
            height="30"
            viewBox="0 0 34 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <rect
              x="2"
              y="3"
              width="26"
              height="5"
              rx="2.5"
              transform="rotate(-6 2 3)"
              fill="currentColor"
            />
            <rect
              x="4"
              y="12"
              width="26"
              height="5"
              rx="2.5"
              transform="rotate(-6 4 12)"
              fill="currentColor"
            />
            <rect
              x="6"
              y="21"
              width="26"
              height="5"
              rx="2.5"
              transform="rotate(-6 6 21)"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Navigation Items Stack */}
        <nav className="flex flex-col items-center gap-3.5 w-full">
          {topNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`relative group flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "w-12 h-12 bg-white text-black rounded-[18px] shadow-lg shadow-white/10"
                    : "w-11 h-11 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl"
                }`}
              >
                <Icon
                  size={isActive ? 22 : 20}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />

                {/* Badge Dot */}
                {item.badge && !isActive && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF6B6B] rounded-full border-2 border-[#161617]" />
                )}

                {/* Tooltip on Hover */}
                <span className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-xl border border-white/10 z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Actions & User Avatar */}
      <div className="flex flex-col items-center gap-4 w-full pt-4 border-t border-white/5">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`relative group flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? "w-12 h-12 bg-white text-black rounded-[18px]"
                  : "w-11 h-11 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl"
              }`}
            >
              <Icon size={20} strokeWidth={1.8} />

              {/* Tooltip */}
              <span className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-xl border border-white/10 z-50">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* User Profile Avatar (Squircle) */}
        <div className="relative group cursor-pointer mt-1">
          <div className="w-11 h-11 rounded-[16px] overflow-hidden border border-white/15 transition-transform duration-200 group-hover:scale-105 group-hover:border-white/40">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Status Dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#161617]" />

          {/* Profile Tooltip */}
          <span className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-xl border border-white/10 z-50">
            User Profile
          </span>
        </div>
      </div>
    </aside>
  );
}
