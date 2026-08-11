"use client";

import React from "react";
import TaskCard, { TaskItem } from "./TaskCard";

export interface ColumnData {
  id: string;
  title: string;
  count: number;
  tasks: TaskItem[];
}

const mockColumns: ColumnData[] = [
  {
    id: "todo",
    title: "To do",
    count: 12,
    tasks: [
      {
        id: "task-1",
        title: "Pricing Comparison Page",
        description: "Create a plan comparison page focused on benefits and CTA buttons.",
        tags: [{ label: "Web", color: "" }, { label: "Design", color: "" }],
        dueDate: "23 June",
        users: [
          { name: "Alice", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" },
          { name: "Bob", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" }
        ],
        commentsCount: 2,
        attachmentsCount: 1
      },
      {
        id: "task-2",
        title: "Feedback Form Redesign",
        description: "Improve the feedback form by reducing fields and increasing conversion.",
        tags: [{ label: "Web", color: "" }, { label: "Design", color: "" }],
        dueDate: "29 June",
        previewImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
        users: [
          { name: "Clara", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
          { name: "David", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" }
        ],
        commentsCount: 5,
        attachmentsCount: 3
      }
    ]
  },
  {
    id: "in_progress",
    title: "In progress",
    count: 7,
    tasks: [
      {
        id: "task-3",
        title: "Roles and Permissions Setup",
        description: "Implement a flexible permissions system for admins, managers, and team members.",
        tags: [{ label: "Backend", color: "" }],
        dueDate: "17 June",
        users: [
          { name: "Evan", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80" }
        ],
        commentsCount: 1,
        attachmentsCount: 1,
        isFloating: true
      },
      {
        id: "task-4",
        title: "Calendar Integration",
        description: "Connect task synchronization with external calendar services.",
        tags: [{ label: "Branding", color: "" }],
        dueDate: "12 June",
        previewImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        users: [
          { name: "Grace", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" }
        ],
        commentsCount: 2,
        attachmentsCount: 1
      }
    ]
  },
  {
    id: "under_review",
    title: "Under review",
    count: 9,
    tasks: [
      {
        id: "task-5",
        title: "Promo Materials Preparation",
        description: "Create visuals for social media, banners, and email campaigns in a consistent style.",
        tags: [{ label: "Branding", color: "" }],
        dueDate: "16 May",
        users: [
          { name: "Hannah", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" },
          { name: "Ian", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" }
        ],
        commentsCount: 2,
        attachmentsCount: 1
      },
      {
        id: "task-6",
        title: "Onboarding Tour Module",
        description: "Add a step-by-step introduction to the interface after sign-up.",
        tags: [{ label: "Web", color: "" }, { label: "Design", color: "" }],
        dueDate: "5 June",
        users: [
          { name: "Julia", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" },
          { name: "Kevin", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80" }
        ],
        commentsCount: 8,
        attachmentsCount: 5
      },
      {
        id: "task-7",
        title: "Social Media Banners",
        description: "Create a series of banners in a consistent style for promotional campaigns.",
        tags: [{ label: "Mobile", color: "" }, { label: "Design", color: "" }],
        dueDate: "17 May",
        users: [
          { name: "Leo", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80" }
        ],
        commentsCount: 1,
        attachmentsCount: 1
      }
    ]
  },
  {
    id: "ready",
    title: "Ready",
    count: 9,
    tasks: [
      {
        id: "task-8",
        title: "Server Response Optimization",
        description: "Reduce response time and improve system stability.",
        tags: [{ label: "Backend", color: "" }],
        dueDate: "13 May",
        users: [
          { name: "Mia", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" },
          { name: "Noah", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" }
        ],
        commentsCount: 1,
        attachmentsCount: 3
      },
      {
        id: "task-9",
        title: "Campaign Landing Page",
        description: "Create a landing page to promote a new feature.",
        tags: [{ label: "Web", color: "" }, { label: "Design", color: "" }],
        dueDate: "29 April",
        previewImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
        users: [
          { name: "Olivia", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" }
        ],
        commentsCount: 2,
        attachmentsCount: 1
      }
    ]
  }
];

export { mockColumns };

interface KanbanBoardProps {
  activeStatus?: string;
  searchQuery?: string;
}

export default function KanbanBoard({ activeStatus = "all", searchQuery = "" }: KanbanBoardProps) {
  const filteredColumns = mockColumns
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

  return (
    <div
      className={`grid gap-5 w-full h-full items-start overflow-x-auto no-scrollbar pb-2 ${
        activeStatus === "all"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 max-w-2xl mx-auto"
      }`}
    >
      {filteredColumns.map((col) => (
        <div key={col.id} className="flex flex-col h-full gap-3 min-w-[260px] overflow-hidden">
          {/* Column Header (Fixed per column) */}
          <div className="shrink-0 flex items-center justify-between px-1 border-b border-white/10 pb-2 pt-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white tracking-tight">
                {col.title}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-zinc-300">
                {col.tasks.length}
              </span>
            </div>
          </div>

          {/* Cards List (Section-wise Independent Scroll area) */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar min-h-0 pr-1 pb-6">
            {col.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
