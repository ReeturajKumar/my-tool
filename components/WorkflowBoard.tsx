"use client";

import React, { useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import TaskCard, { TaskActivity, TaskItem } from "./TaskCard";

export interface ColumnData {
  id: string;
  title: string;
  count: number;
  tasks: TaskItem[];
  isCustom?: boolean;
}

// Default stage definitions — structure only, no hardcoded tasks
export const defaultStages: { id: string; title: string }[] = [
  { id: "todo", title: "To do" },
  { id: "in_progress", title: "In progress" },
  { id: "under_review", title: "Under review" },
  { id: "ready", title: "Ready" },
  { id: "completed", title: "Completed" },
];

interface WorkflowBoardProps {
  activeStatus?: string;
  searchQuery?: string;
  columns: ColumnData[];
  onColumnsChange?: (columns: ColumnData[]) => void;
  onCardClick?: (task: TaskItem & { statusTitle?: string; columnId?: string }) => void;
  onAddStage?: (title: string) => Promise<void> | void;
  onDeleteStage?: (stageId: string) => Promise<void> | void;
}

export default function WorkflowBoard({
  activeStatus = "all",
  searchQuery = "",
  columns,
  onColumnsChange,
  onCardClick,
  onAddStage,
  onDeleteStage,
}: WorkflowBoardProps) {
  const { user } = useUser();
  const updateColumns = (newCols: ColumnData[]) => {
    if (onColumnsChange) onColumnsChange(newCols);
  };

  const [draggedItem, setDraggedItem] = useState<{
    taskId: string;
    sourceColumnId: string;
  } | null>(null);

  const [pendingDropMove, setPendingDropMove] = useState<{
    taskId: string;
    sourceColumnId: string;
    targetColumnId: string;
    fromTitle: string;
    toTitle: string;
  } | null>(null);
  const [dropNote, setDropNote] = useState("");

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});

  const toggleColumnCollapse = (columnId: string) => {
    setCollapsedColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  // Convert vertical wheel scrolls on the board area to horizontal scrolling
  const handleBoardWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && boardContainerRef.current) {
      const target = e.target as HTMLElement;
      const isInsideCardList = target.closest(".overflow-y-auto");
      if (!isInsideCardList) {
        boardContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    taskId: string,
    sourceColumnId: string
  ) => {
    setDraggedItem({ taskId, sourceColumnId });
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ taskId, sourceColumnId })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    targetColumnId: string
  ) => {
    e.preventDefault();
    setDragOverColumnId(targetColumnId);
  };

  const handleDragLeave = (
    e: React.DragEvent<HTMLDivElement>,
    targetColumnId: string
  ) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverColumnId === targetColumnId) {
        setDragOverColumnId(null);
      }
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetColumnId: string
  ) => {
    e.preventDefault();
    setDragOverColumnId(null);

    let payload = draggedItem;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (raw) payload = JSON.parse(raw);
      } catch (err) {
        console.error("Failed to parse drag payload", err);
      }
    }

    if (!payload) return;

    const { taskId, sourceColumnId } = payload;
    if (sourceColumnId === targetColumnId) {
      setDraggedItem(null);
      return;
    }

    const sourceCol = columns.find((c) => c.id === sourceColumnId);
    const targetCol = columns.find((c) => c.id === targetColumnId);
    const taskToMove = sourceCol?.tasks.find((t) => t.id === taskId);

    if (!taskToMove) return;

    const fromTitle = sourceCol?.title || sourceColumnId;
    const toTitle = targetCol?.title || targetColumnId;

    setPendingDropMove({
      taskId,
      sourceColumnId,
      targetColumnId,
      fromTitle,
      toTitle,
    });
    setDropNote("");
    setDraggedItem(null);
  };

  const handleConfirmDropMove = (includeNote: boolean = true) => {
    if (!pendingDropMove) return;

    const { taskId, sourceColumnId, targetColumnId, fromTitle, toTitle } = pendingDropMove;
    const sourceCol = columns.find((c) => c.id === sourceColumnId);
    const taskToMove = sourceCol?.tasks.find((t) => t.id === taskId);

    if (!taskToMove) {
      setPendingDropMove(null);
      return;
    }

    const currentUserName = user?.fullName || user?.firstName || user?.username || "You";
    const currentUserAvatar = user?.imageUrl || "";
    const noteText = includeNote ? dropNote.trim() : "";

    const moveActivity: TaskActivity = {
      id: `act-${Date.now()}`,
      type: "status_changed",
      userName: currentUserName,
      userAvatar: currentUserAvatar,
      action: `moved task from "${fromTitle}" to "${toTitle}"`,
      details: `${fromTitle} → ${toTitle}`,
      note: noteText || undefined,
      timestamp: new Date().toISOString(),
    };

    const updatedTask: TaskItem = {
      ...taskToMove,
      isFloating: false,
      activities: [moveActivity, ...(taskToMove.activities || [])],
    };

    const nextColumns = columns.map((col) => {
      if (col.id === sourceColumnId) {
        return {
          ...col,
          count: Math.max(0, col.tasks.length - 1),
          tasks: col.tasks.filter((t) => t.id !== taskId),
        };
      }
      if (col.id === targetColumnId) {
        return {
          ...col,
          count: col.tasks.length + 1,
          tasks: [
            updatedTask,
            ...col.tasks,
          ],
        };
      }
      return col;
    });

    updateColumns(nextColumns);
    setPendingDropMove(null);
    setDropNote("");
  };

  const filteredColumns = columns
    .filter((col) => activeStatus === "all" || col.id === activeStatus)
    .map((col) => {
      if (!searchQuery.trim()) return col;
      const q = searchQuery.toLowerCase();
      return {
        ...col,
        tasks: col.tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some((tag) => tag.label.toLowerCase().includes(q))
        ),
      };
    });

  const hasExtraStages = filteredColumns.length > 5;

  const activeColumnId =
    filteredColumns.find((c) => c.id === selectedColumnId)?.id ||
    filteredColumns[0]?.id ||
    "";

  const scrollToColumn = (columnId: string) => {
    setSelectedColumnId(columnId);
    const el = columnRefs.current[columnId];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  const handleBoardScroll = () => {
    if (!boardContainerRef.current) return;
    const container = boardContainerRef.current;
    const scrollCenter = container.scrollLeft + container.clientWidth / 2;

    let closestId = activeColumnId;
    let minDiff = Infinity;

    filteredColumns.forEach((col) => {
      const el = columnRefs.current[col.id];
      if (el) {
        const elCenter = el.offsetLeft + el.offsetWidth / 2;
        const diff = Math.abs(elCenter - scrollCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestId = col.id;
        }
      }
    });

    if (closestId && closestId !== selectedColumnId) {
      setSelectedColumnId(closestId);
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-hidden">
      {/* ── Mobile Stage Selector & Navigator (sm:hidden) ── */}
      {filteredColumns.length > 1 && (
        <div className="sm:hidden shrink-0 flex items-center justify-between gap-1.5 px-1 py-1.5 border-b border-white/10 bg-[#0d0d0f]/60 backdrop-blur-xs mb-1">
          {/* Scrollable Stage Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {filteredColumns.map((col) => {
              const isActive = col.id === activeColumnId;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => scrollToColumn(col.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#9D6FFF] text-white shadow-sm shadow-[#9D6FFF]/30 font-semibold"
                      : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
                  }`}
                >
                  <span>{col.title}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-white/10 text-zinc-400"
                    }`}
                  >
                    {col.tasks.length}
                  </span>
                </button>
              );
            })}

            {onAddStage && (
              <button
                type="button"
                onClick={() => {
                  const title = window.prompt("Enter new stage title:");
                  if (title?.trim()) onAddStage(title.trim());
                }}
                title="Add stage"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-dashed border-white/20 whitespace-nowrap transition-all shrink-0 cursor-pointer"
              >
                <Plus size={12} />
                <span>Stage</span>
              </button>
            )}
          </div>

          {/* Quick Prev / Next Arrows on Mobile */}
          <div className="flex items-center gap-0.5 shrink-0 pl-1 border-l border-white/10">
            <button
              type="button"
              onClick={() => {
                const currIdx = filteredColumns.findIndex((c) => c.id === activeColumnId);
                if (currIdx > 0) {
                  scrollToColumn(filteredColumns[currIdx - 1].id);
                }
              }}
              disabled={filteredColumns.findIndex((c) => c.id === activeColumnId) <= 0}
              title="Previous stage"
              className="p-1 rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 hover:bg-white/10 transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                const currIdx = filteredColumns.findIndex((c) => c.id === activeColumnId);
                if (currIdx >= 0 && currIdx < filteredColumns.length - 1) {
                  scrollToColumn(filteredColumns[currIdx + 1].id);
                }
              }}
              disabled={
                filteredColumns.findIndex((c) => c.id === activeColumnId) >=
                filteredColumns.length - 1
              }
              title="Next stage"
              className="p-1 rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 hover:bg-white/10 transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Kanban Columns Container ── */}
      <div
        ref={boardContainerRef}
        onWheel={handleBoardWheel}
        onScroll={handleBoardScroll}
        className={`flex flex-row flex-nowrap items-stretch gap-3 sm:gap-4 w-full flex-1 min-h-0 overflow-x-auto overflow-y-hidden custom-scrollbar-x pb-2 pt-0.5 select-none snap-x snap-mandatory sm:snap-none scroll-smooth px-1 sm:px-0 overscroll-x-contain ${
          activeStatus !== "all" ? "max-w-md mx-auto" : ""
        }`}
      >
        {filteredColumns.map((col) => {
          const isTarget = dragOverColumnId === col.id;
          const isCollapsed = Boolean(collapsedColumns[col.id]);

          // Collapsed stage column view
          if (isCollapsed) {
            return (
              <div
                key={col.id}
                ref={(el) => {
                  columnRefs.current[col.id] = el;
                }}
                onClick={() => toggleColumnCollapse(col.id)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                title={`Click to expand ${col.title}`}
                className={`flex flex-col items-center justify-between h-full w-[38px] sm:w-[48px] flex-none py-3 px-1 rounded-2xl bg-[#161617]/70 hover:bg-[#161617] border border-white/10 hover:border-white/25 transition-all duration-200 cursor-pointer group select-none snap-start sm:snap-align-none ${
                  isTarget ? "bg-[#6397FF]/15 ring-2 ring-[#6397FF]/60 border-[#6397FF]/40" : ""
                }`}
              >
              {/* Top: Expand Icon & Count Badge */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleColumnCollapse(col.id);
                  }}
                  title="Expand stage"
                  className="p-1 rounded-lg text-zinc-400 group-hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-zinc-300">
                  {col.tasks.length}
                </span>
              </div>

              {/* Middle: Rotated Stage Title */}
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-white tracking-wide [writing-mode:vertical-lr] rotate-180 py-4 truncate max-h-[220px]">
                {col.title}
              </span>

              {/* Bottom: Custom stage delete or dot */}
              {col.isCustom && onDeleteStage ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete custom stage "${col.title}"?`)) {
                      onDeleteStage(col.id);
                    }
                  }}
                  title="Delete custom stage"
                  className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-[#9D6FFF] transition-colors mb-1" />
              )}
            </div>
          );
        }

        // Expanded full stage column view
        return (
          <div
            key={col.id}
            ref={(el) => {
              columnRefs.current[col.id] = el;
            }}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col h-full gap-2.5 sm:gap-3 ${
              hasExtraStages
                ? "w-[85vw] max-w-[340px] sm:w-[280px] md:w-[300px] flex-none shrink-0"
                : "w-[85vw] max-w-[340px] sm:w-auto sm:min-w-[220px] sm:flex-1 shrink-0"
            } snap-center sm:snap-align-none overflow-hidden rounded-2xl p-1.5 sm:p-2 transition-all duration-200 ${
              isTarget
                ? "bg-[#6397FF]/10 ring-2 ring-[#6397FF]/60 border-2 border-dashed border-[#6397FF]/40"
                : "bg-transparent border border-transparent"
            }`}
          >
            {/* Column Header */}
            <div className="shrink-0 flex items-center justify-between px-1 border-b border-white/10 pb-2 pt-0.5">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                  {col.title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-white/10 text-zinc-300 shrink-0">
                  {col.tasks.length}
                </span>
                {col.isCustom && (
                  <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-[#9D6FFF]/20 text-[#9D6FFF] border border-[#9D6FFF]/30 rounded uppercase tracking-wider shrink-0">
                    Custom
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                {/* Delete Custom Stage Button */}
                {col.isCustom && onDeleteStage && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete the custom stage "${col.title}" and its tasks?`)) {
                        onDeleteStage(col.id);
                      }
                    }}
                    title="Delete custom stage"
                    className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}

                {/* Collapse Button */}
                <button
                  type="button"
                  onClick={() => toggleColumnCollapse(col.id)}
                  title="Collapse stage"
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>

            {/* Cards List — empty state when no tasks */}
            <div className="flex-1 flex flex-col gap-3 sm:gap-4 overflow-y-auto no-scrollbar min-h-0 pr-0.5 sm:pr-1 pb-6 overscroll-contain">
              {isTarget && (
                <div className="p-3.5 rounded-2xl border-2 border-dashed border-[#6397FF]/60 bg-[#6397FF]/15 text-center text-xs font-semibold text-[#6397FF] animate-pulse">
                  Drop task here
                </div>
              )}

              {col.tasks.length === 0 && !isTarget && (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40 py-8">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center">
                    <span className="text-zinc-500 text-lg leading-none">+</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">No tasks yet</span>
                </div>
              )}

              {col.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  columnId={col.id}
                  onDragStart={handleDragStart}
                  isDragging={draggedItem?.taskId === task.id}
                  onClick={(t) => onCardClick?.({ ...t, statusTitle: col.title, columnId: col.id })}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Stage Change Note Dialog on Drag & Drop */}
      {pendingDropMove && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setPendingDropMove(null);
          }}
        >
          <div
            className="w-full max-w-[92vw] sm:max-w-md bg-[#141417] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#6397FF]/15 text-[#6397FF] flex items-center justify-center">
                  <ArrowRight size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Stage Transition Note</h4>
                  <p className="text-[11px] text-zinc-400">Add a note for moving this task</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingDropMove(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Transition Badge Row */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-black/50 border border-white/5 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-medium">
                {pendingDropMove.fromTitle}
              </span>
              <ArrowRight size={13} className="text-zinc-500 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-[#6397FF]/20 border border-[#6397FF]/30 text-[#6397FF] font-semibold">
                {pendingDropMove.toTitle}
              </span>
            </div>

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                <span>Transition Note</span>
                <span className="text-[10px] text-zinc-500">Saved to task timeline</span>
              </label>
              <textarea
                autoFocus
                rows={3}
                value={dropNote}
                onChange={(e) => setDropNote(e.target.value)}
                placeholder="Reason or notes for this stage change (e.g. Reviewed, passed QA, blocked on review)..."
                className="w-full bg-black/60  focus:border-black focus:ring-1 focus:ring-black rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none resize-none leading-relaxed transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleConfirmDropMove(Boolean(dropNote.trim()));
                  }
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingDropMove(null)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDropMove(false)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
              >
                Skip note
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDropMove(true)}
                disabled={!dropNote.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0070F3] hover:bg-[#0060df] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Save & Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
