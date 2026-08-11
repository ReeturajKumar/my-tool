"use client";

import React, { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import StatusFilterBar from "@/components/StatusFilterBar";
import KanbanBoard, { mockColumns } from "@/components/KanbanBoard";
import ListView from "@/components/ListView";
import WorkflowView from "@/components/WorkflowView";

export default function Home() {
  const [activeView, setActiveView] = useState<"list" | "board" | "workflow">("board");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const counts = useMemo(() => {
    let todo = 0,
      in_progress = 0,
      under_review = 0,
      ready = 0;
    mockColumns.forEach((col) => {
      if (col.id === "todo") todo = col.tasks.length;
      if (col.id === "in_progress") in_progress = col.tasks.length;
      if (col.id === "under_review") under_review = col.tasks.length;
      if (col.id === "ready") ready = col.tasks.length;
    });
    return {
      all: todo + in_progress + under_review + ready,
      todo,
      in_progress,
      under_review,
      ready,
    };
  }, []);

  const flattenedTasks = useMemo(() => {
    const list: Array<any> = [];
    mockColumns.forEach((col) => {
      if (activeStatus !== "all" && col.id !== activeStatus) return;
      col.tasks.forEach((task) => {
        if (
          searchQuery.trim() &&
          !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !task.description.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return;
        }
        list.push({ ...task, statusTitle: col.title });
      });
    });
    return list;
  }, [activeStatus, searchQuery]);

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden p-3 gap-4 font-sans select-none">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-transparent p-4 overflow-hidden gap-4">
        {/* Fixed Navbar Header & Status Filter Bar */}
        <div className="shrink-0 z-30 space-y-3 pt-1 pb-2 bg-black/80 backdrop-blur-md">
          <Navbar
            activeView={activeView}
            onViewChange={setActiveView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <StatusFilterBar
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
            counts={counts}
          />
        </div>

        {/* View Switcher Container */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeView === "board" && (
            <KanbanBoard activeStatus={activeStatus} searchQuery={searchQuery} />
          )}

          {activeView === "list" && (
            <div className="h-full overflow-y-auto no-scrollbar pr-1 pb-4">
              <ListView tasks={flattenedTasks} />
            </div>
          )}

          {activeView === "workflow" && (
            <div className="h-full overflow-y-auto no-scrollbar pr-1 pb-4">
              <WorkflowView />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


