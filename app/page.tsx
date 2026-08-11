"use client";

import React, { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import StatusFilterBar from "@/components/StatusFilterBar";
import KanbanBoard, { mockColumns } from "@/components/KanbanBoard";
import ListView from "@/components/ListView";
import WorkflowView from "@/components/WorkflowView";
import TaskDetailModal from "@/components/TaskDetailModal";
import AddTaskModal from "@/components/AddTaskModal";

export default function Home() {
  const [activeView, setActiveView] = useState<"list" | "board" | "workflow">("board");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [columns, setColumns] = useState(mockColumns);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);

  const handleCreateTask = (targetColumnId: string, newTask: any) => {
    const nextCols = columns.map((col) => {
      if (col.id === targetColumnId) {
        return {
          ...col,
          count: col.tasks.length + 1,
          tasks: [newTask, ...col.tasks], // Prepend newly created ticket at top
        };
      }
      return col;
    });
    setColumns(nextCols);
  };

  const counts = useMemo(() => {
    let todo = 0,
      in_progress = 0,
      under_review = 0,
      ready = 0;
    columns.forEach((col) => {
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
  }, [columns]);

  const flattenedTasks = useMemo(() => {
    const list: Array<any> = [];
    columns.forEach((col) => {
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
  }, [columns, activeStatus, searchQuery]);

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden p-3 gap-4 font-sans select-none">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-transparent px-4 py-2 overflow-hidden gap-2">
        {/* Fixed Navbar Header */}
        <div className="shrink-0 z-30 py-1 bg-black/80 backdrop-blur-md">
          <Navbar
            activeView={activeView}
            onViewChange={setActiveView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddTaskClick={() => setIsAddTaskOpen(true)}
          />
        </div>

        {/* View Switcher Container */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeView === "board" && (
            <KanbanBoard
              activeStatus={activeStatus}
              searchQuery={searchQuery}
              columns={columns}
              onColumnsChange={setColumns}
              onCardClick={setSelectedTask}
            />
          )}

          {activeView === "list" && (
            <div className="h-full overflow-y-auto no-scrollbar pr-1 pb-4">
              <ListView tasks={flattenedTasks} onCardClick={setSelectedTask} />
            </div>
          )}

          {activeView === "workflow" && (
            <div className="h-full overflow-y-auto no-scrollbar pr-1 pb-4">
              <WorkflowView />
            </div>
          )}
        </div>
      </main>

      {/* Task Details Popup Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Create Ticket Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleCreateTask}
      />
    </div>
  );
}


