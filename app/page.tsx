"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SignIn, useAuth } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import WorkflowBoard, { defaultStages, type ColumnData } from "@/components/WorkflowBoard";
import ListView from "@/components/ListView";
import WorkflowView from "@/components/WorkflowView";
import TaskDetailModal from "@/components/TaskDetailModal";
import AddTaskModal from "@/components/AddTaskModal";
import AddStageModal from "@/components/AddStageModal";
import WorkflowBoardSkeleton, { FullDashboardSkeleton } from "@/components/WorkflowBoardSkeleton";
import type { TaskItem } from "@/components/TaskCard";

type TaskWithStatus = TaskItem & { statusTitle?: string; columnId?: string };
type PersistedTask = TaskItem & { columnId: string };

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const [activeView] = useState<"list" | "board" | "workflow">("board");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithStatus | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
  const [isAddStageOpen, setIsAddStageOpen] = useState<boolean>(false);

  const persistColumns = (nextColumns: typeof columns) => {
    if (!isSignedIn) return;

    const tasks = nextColumns.flatMap((column) =>
      column.tasks.map((task) => ({
        columnId: column.id,
        task: { ...task, isFloating: false, previewImage: task.previewImage || "" },
      }))
    );

    void fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const registerUser = async (retries = 3): Promise<void> => {
      const response = await fetch("/api/users", { method: "POST" });

      // 401 = session cookie not ready yet (SSO callback race condition) — retry
      if (response.status === 401 && retries > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        return registerUser(retries - 1);
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        console.error("DB registration failed:", body?.error ?? response.status);
      }
    };

    void registerUser();
  }, [isLoaded, isSignedIn]);


  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let isCurrent = true;

    const loadBoardData = async (retries = 3): Promise<void> => {
      try {
        const [stagesRes, tasksRes] = await Promise.all([
          fetch("/api/stages"),
          fetch("/api/tasks"),
        ]);

        if ((stagesRes.status === 401 || tasksRes.status === 401) && retries > 0) {
          await new Promise((r) => setTimeout(r, 1000));
          return loadBoardData(retries - 1);
        }

        const stagesData = stagesRes.ok
          ? ((await stagesRes.json()) as { stages: { id: string; title: string; isCustom?: boolean }[] })
          : { stages: defaultStages.map((s) => ({ ...s, isCustom: false })) };

        const tasksData = tasksRes.ok
          ? ((await tasksRes.json()) as { tasks: PersistedTask[] })
          : { tasks: [] };

        if (!isCurrent) return;

        // Use API stages; fall back to defaultStages if API returned none
        const stageList =
          stagesData.stages && stagesData.stages.length > 0
            ? stagesData.stages
            : defaultStages.map((s) => ({ ...s, isCustom: false as const }));

        // Build columns with only this user's tasks from the DB (never seed fake data)
        setColumns(
          stageList.map((stg) => {
            const columnTasks = tasksData.tasks
              .filter((task) => task.columnId === stg.id)
              .map((task) => {
                const taskCopy = { ...task };
                delete (taskCopy as { columnId?: string }).columnId;
                return taskCopy;
              });
            return {
              id: stg.id,
              title: stg.title,
              isCustom: Boolean(stg.isCustom),
              tasks: columnTasks,
              count: columnTasks.length,
            };
          })
        );
      } catch (err) {
        console.error("Unable to load board data", err);
      } finally {
        if (isCurrent) {
          setIsLoadingData(false);
        }
      }
    };

    void loadBoardData();

    return () => {
      isCurrent = false;
    };
  }, [isLoaded, isSignedIn]);

  const handleCreateTask = (targetColumnId: string, newTask: TaskItem) => {
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
    if (isSignedIn) {
      void fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: targetColumnId, task: newTask }),
      });
    }
  };

  const handleUpdateTask = async (
    originalColumnId: string,
    targetColumnId: string,
    updatedTask: TaskItem
  ) => {
    const sanitizedTaskForClient = { ...updatedTask };
    if (!sanitizedTaskForClient.previewImage) {
      delete sanitizedTaskForClient.previewImage;
    }

    const nextCols = columns.map((col) => {
      // If task remains in the same stage:
      if (originalColumnId === targetColumnId) {
        if (col.id === originalColumnId) {
          return {
            ...col,
            tasks: col.tasks.map((t) => (t.id === updatedTask.id ? sanitizedTaskForClient : t)),
          };
        }
        return col;
      }

      // If task moved to a different stage:
      if (col.id === originalColumnId) {
        return {
          ...col,
          count: Math.max(0, col.tasks.length - 1),
          tasks: col.tasks.filter((t) => t.id !== updatedTask.id),
        };
      }
      if (col.id === targetColumnId) {
        return {
          ...col,
          count: col.tasks.length + 1,
          tasks: [sanitizedTaskForClient, ...col.tasks],
        };
      }
      return col;
    });

    setColumns(nextCols);
    setSelectedTask((prev) => {
      if (!prev || prev.id !== updatedTask.id) return prev;
      const next: TaskWithStatus = {
        ...prev,
        ...updatedTask,
        columnId: targetColumnId,
        statusTitle:
          columns.find((c) => c.id === targetColumnId)?.title ||
          prev.statusTitle,
      };
      if (!updatedTask.previewImage) {
        delete next.previewImage;
      }
      return next;
    });

    if (isSignedIn) {
      try {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            columnId: targetColumnId,
            task: {
              ...updatedTask,
              previewImage: updatedTask.previewImage || "",
            },
          }),
        });
      } catch (err) {
        console.error("Failed to update task", err);
      }
    }
  };

  const handleDeleteTask = async (taskId: string, columnId: string) => {
    const nextCols = columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          count: Math.max(0, col.tasks.length - 1),
          tasks: col.tasks.filter((t) => t.id !== taskId),
        };
      }
      return col;
    });

    setColumns(nextCols);
    setSelectedTask(null);

    if (isSignedIn) {
      try {
        await fetch("/api/tasks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: taskId }),
        });
      } catch (err) {
        console.error("Failed to delete task", err);
      }
    }
  };

  const handleAddStage = async (title: string) => {
    if (!isSignedIn) return;
    try {
      const response = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        alert(body?.error || "Failed to create stage");
        return;
      }

      const { stage } = (await response.json()) as {
        stage: { id: string; title: string; isCustom: boolean };
      };

      const newCol = {
        id: stage.id,
        title: stage.title,
        isCustom: true,
        count: 0,
        tasks: [],
      };

      setColumns((prev) => [...prev, newCol]);
    } catch (error) {
      console.error("Error creating stage:", error);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!isSignedIn) return;
    try {
      const response = await fetch("/api/stages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stageId }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        alert(body?.error || "Failed to delete stage");
        return;
      }

      setColumns((prev) => prev.filter((col) => col.id !== stageId));
    } catch (error) {
      console.error("Error deleting stage:", error);
    }
  };

  const handleColumnsChange = (nextColumns: typeof columns) => {
    setColumns(nextColumns);
    persistColumns(nextColumns);
  };

  const flattenedTasks = useMemo(() => {
    const list: Array<TaskItem & { statusTitle: string; columnId: string }> = [];
    columns.forEach((col) => {
      col.tasks.forEach((task) => {
        if (
          searchQuery.trim() &&
          !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !task.description.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return;
        }
        list.push({ ...task, statusTitle: col.title, columnId: col.id });
      });
    });
    return list;
  }, [columns, searchQuery]);

  // Show skeleton loading while Clerk initializes
  if (!isLoaded) {
    return <FullDashboardSkeleton />;
  }

  // Show Clerk sign-in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <SignIn routing="hash" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden p-2 sm:p-3 font-sans select-none">
      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-full bg-transparent px-1 sm:px-2 py-0.5 sm:py-1 overflow-hidden gap-1">
        {/* Fixed Navbar Header */}
        <div className="shrink-0 z-30 py-0 bg-black/80 backdrop-blur-md">
          <Navbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddTaskClick={() => setIsAddTaskOpen(true)}
            onAddStageClick={() => setIsAddStageOpen(true)}
          />
        </div>

        {/* View Switcher Container */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoadingData ? (
            <WorkflowBoardSkeleton />
          ) : activeView === "board" ? (
            <WorkflowBoard
              searchQuery={searchQuery}
              columns={columns}
              onColumnsChange={handleColumnsChange}
              onCardClick={setSelectedTask}
              onAddStage={handleAddStage}
              onDeleteStage={handleDeleteStage}
            />
          ) : activeView === "list" ? (
            <div className="h-full overflow-y-auto no-scrollbar pr-1 pb-4">
              <ListView tasks={flattenedTasks} onCardClick={setSelectedTask} />
            </div>
          ) : (
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
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          columns={columns}
          allTasks={flattenedTasks}
          onSelectTask={setSelectedTask}
        />
      )}

      {/* Create Ticket Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleCreateTask}
        columns={columns}
      />

      {/* Create Custom Stage Modal */}
      <AddStageModal
        isOpen={isAddStageOpen}
        onClose={() => setIsAddStageOpen(false)}
        onAddStage={handleAddStage}
      />
    </div>
  );
}


