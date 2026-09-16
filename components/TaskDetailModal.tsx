"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  AtSign,
  Check,
  ChevronDown,
  Eye,
  History,
  ImageIcon,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { TaskActivity, TaskComment, TaskItem } from "./TaskCard";
import RichTextEditor, { renderRichText } from "./RichTextEditor";
import ImageLightboxModal from "./ImageLightboxModal";
import { uploadImageToCloudinary } from "@/lib/upload";

interface TaskDetailModalProps {
  task: TaskItem & { statusTitle?: string; columnId?: string };
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (
    originalColumnId: string,
    targetColumnId: string,
    updatedTask: TaskItem
  ) => Promise<void> | void;
  onDeleteTask?: (taskId: string, columnId: string) => Promise<void> | void;
  columns?: { id: string; title: string }[];
  allTasks?: (TaskItem & { statusTitle?: string; columnId?: string })[];
  onSelectTask?: (task: TaskItem & { statusTitle?: string; columnId?: string }) => void;
}

const PRESET_TAGS = [
  "Web",
  "Design",
  "Backend",
  "Branding",
  "Mobile",
  "Frontend",
  "Testing",
  "DevOps",
];

const TAG_COLORS: Record<string, string> = {
  Web: "bg-[#6397FF]/15 text-[#6397FF] border-[#6397FF]/30",
  Design: "bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30",
  Backend: "bg-[#9D6FFF]/15 text-[#9D6FFF] border-[#9D6FFF]/30",
  Branding: "bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30",
  Mobile: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",
  Frontend: "bg-[#6397FF]/15 text-[#6397FF] border-[#6397FF]/30",
  Testing: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  DevOps: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  Discover: "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

function customTagColor(label: string): string {
  if (!label || typeof label !== "string") {
    return "bg-zinc-800 text-zinc-300 border-zinc-700";
  }
  const palette = [
    "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    "bg-rose-500/15 text-rose-300 border-rose-500/30",
    "bg-violet-500/15 text-violet-300 border-violet-500/30",
    "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "bg-teal-500/15 text-teal-300 border-teal-500/30",
    "bg-pink-500/15 text-pink-300 border-pink-500/30",
  ];
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) & 0xffffffff;
  }
  return palette[Math.abs(hash) % palette.length];
}

function getTagBadgeStyle(tag: string): string {
  if (!tag || typeof tag !== "string") {
    return "bg-zinc-800 text-zinc-300 border-zinc-700";
  }
  return TAG_COLORS[tag] ?? customTagColor(tag);
}

function getStatusBadgeStyle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("complete") || lower.includes("done")) {
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  }
  if (lower.includes("progress") || lower.includes("doing") || lower.includes("review")) {
    return "bg-[#6397FF]/15 text-[#6397FF] border-[#6397FF]/30";
  }
  if (lower.includes("ready")) {
    return "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30";
  }
  return "bg-[#9D6FFF]/15 text-[#9D6FFF] border-[#9D6FFF]/30";
}

function timeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatActivityDateTime(dateString?: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHour = (hours % 12 || 12).toString().padStart(2, "0");
  const timeStr = `${formattedHour}:${minutes}${ampm}`;
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${timeStr} | ${day} ${month}`;
}

function parseToInputDate(dateStr?: string): string {
  if (!dateStr || dateStr === "Upcoming") return "";
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime())) {
    return direct.toISOString().split("T")[0];
  }
  const currentYear = new Date().getFullYear();
  const withYear = new Date(`${dateStr} ${currentYear}`);
  if (!isNaN(withYear.getTime())) {
    return withYear.toISOString().split("T")[0];
  }
  return "";
}

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
  columns,
  allTasks,
  onSelectTask,
}: TaskDetailModalProps) {
  void allTasks;
  void onSelectTask;
  const { user } = useUser();
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "activity" | "description">("activity");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<{
    colId: string;
    fromStage: string;
    toStage: string;
  } | null>(null);
  const [stageNote, setStageNote] = useState("");

  // Editable task state
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [description, setDescription] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [targetColumnId, setTargetColumnId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [activityFilter, setActivityFilter] = useState<"all" | "status" | "comments">("all");
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prevTaskIdRef = useRef<string | null>(null);

  // Initialize fields whenever a different task opens
  useEffect(() => {
    if (isOpen && task && task.id !== prevTaskIdRef.current) {
      prevTaskIdRef.current = task.id;
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDueDate(parseToInputDate(task.dueDate));
      setTargetColumnId(
        task.columnId || (columns && columns.length > 0 ? columns[0].id : "todo")
      );

      const tagLabels = task.tags
        ? task.tags.flatMap((t) => {
            if (typeof t === "string" && (t as string).trim()) return [(t as string).trim()];
            if (t && typeof t.label === "string" && t.label.trim()) return [t.label.trim()];
            return [];
          })
        : [];
      setSelectedTags(tagLabels);

      // Initialize comments from task without hardcoded fallbacks
      const isLegacyMock = (name?: string, text?: string) => {
        const lName = (name || "").toLowerCase();
        const lText = (text || "").toLowerCase();
        return (
          lName.includes("alexandar") ||
          lName.includes("omah") ||
          lText.includes("thanks, omah") ||
          lText.includes("crucial for us to have a clear understanding")
        );
      };
      const cleanComments = (task.comments || []).filter(
        (c) => !isLegacyMock(c.userName, c.text)
      );
      setComments(cleanComments);

      // Initialize activities or create initial creation record
      let acts = task.activities ? [...task.activities] : [];
      if (acts.length === 0) {
        acts = [
          {
            id: `act-init-${task.id}`,
            type: "created",
            userName: task.creatorName || user?.fullName || user?.firstName || "You",
            userAvatar: task.creatorAvatar || user?.imageUrl || "",
            action: "created this task",
            timestamp: task.createdAt || new Date().toISOString(),
          },
        ];
      }
      setActivities(acts);

      setIsEditingTitle(false);
      setIsEditingDesc(false);
      setShowStatusMenu(false);
      setShowTagMenu(false);
      setShowDatePicker(false);
    }

    if (!isOpen) {
      prevTaskIdRef.current = null;
    }
  }, [isOpen, task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Closing animation handling
  useEffect(() => {
    if (isOpen || !isClosing) return;
    const timeoutId = window.setTimeout(() => {
      setIsClosing(false);
    }, 260);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isClosing]);

  const handleClose = () => {
    setIsClosing(true);
    onClose();
  };

  const tagMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Outside click listener for menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) {
        setShowTagMenu(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    if (showTagMenu || showStatusMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTagMenu, showStatusMenu]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showTagMenu) {
          setShowTagMenu(false);
          return;
        }
        if (showStatusMenu) {
          setShowStatusMenu(false);
          return;
        }
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showTagMenu, showStatusMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  const allAvailableTags = useMemo(() => {
    const list = [...PRESET_TAGS];
    selectedTags.forEach((t) => {
      if (!list.includes(t)) list.push(t);
    });
    return list;
  }, [selectedTags]);

  const filteredTags = useMemo(() => {
    const q = customTagInput.trim().toLowerCase();
    if (!q) return allAvailableTags;
    return allAvailableTags.filter((t) => t.toLowerCase().includes(q));
  }, [allAvailableTags, customTagInput]);

  const [expandedActivityIds, setExpandedActivityIds] = useState<Record<string, boolean>>({});

  const toggleActivityExpand = (id: string) => {
    setExpandedActivityIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const timelineEvents = useMemo(() => {
    const map = new Map<string, TaskActivity>();

    activities.forEach((act) => {
      map.set(act.id, act);
    });

    comments.forEach((c) => {
      const existingAct = activities.find(
        (a) => a.type === "comment_added" && (a.id === c.id || a.details === c.text)
      );
      if (!existingAct) {
        map.set(`c-${c.id}`, {
          id: c.id,
          type: "comment_added",
          userName: c.userName,
          userAvatar: c.userAvatar,
          action: "added a comment",
          details: c.text,
          timestamp: c.createdAt,
        });
      }
    });

    const list = Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (activityFilter === "status") {
      return list.filter((a) => a.type === "status_changed");
    }
    if (activityFilter === "comments") {
      return list.filter((a) => a.type === "comment_added");
    }
    return list;
  }, [activities, comments, activityFilter]);

  if ((!isOpen && !isClosing) || !task) return null;

  const originalColumnId = task.columnId || targetColumnId;
  const currentStageTitle =
    columns?.find((c) => c.id === targetColumnId)?.title ||
    task.statusTitle ||
    "In progress";

  // Save changes to parent & MongoDB
  const persistTaskUpdate = async (overrides: Partial<TaskItem> = {}, newColId?: string) => {
    const colToUse = newColId ?? targetColumnId;
    const finalPreviewImage =
      overrides.previewImage !== undefined ? overrides.previewImage : task.previewImage;

    const updated: TaskItem = {
      ...task,
      title: overrides.title !== undefined ? overrides.title : title.trim(),
      description: overrides.description !== undefined ? overrides.description : description,
      dueDate: overrides.dueDate !== undefined ? overrides.dueDate : task.dueDate,
      tags:
        overrides.tags !== undefined
          ? overrides.tags
          : selectedTags.map((t) => ({ label: t, color: "" })),
      comments: overrides.comments !== undefined ? overrides.comments : comments,
      commentsCount:
        overrides.comments !== undefined ? overrides.comments.length : comments.length,
      activities: overrides.activities !== undefined ? overrides.activities : activities,
      attachmentsCount:
        overrides.attachmentsCount !== undefined
          ? overrides.attachmentsCount
          : finalPreviewImage
          ? 1
          : 0,
      previewImage: finalPreviewImage,
      users: overrides.users !== undefined ? overrides.users : task.users,
      creatorName: task.creatorName,
      creatorAvatar: task.creatorAvatar,
      createdAt: task.createdAt,
    };

    await onUpdateTask(originalColumnId, colToUse, updated);
  };

  // Handle uploading / replacing image via Cloudinary
  const handleUploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadWarning(null);
    setIsUploadingImage(true);

    const res = await uploadImageToCloudinary(file, "task_attachments");
    setIsUploadingImage(false);

    if (res.url) {
      const currentUserName =
        user?.fullName || user?.firstName || user?.username || "You";
      const currentUserAvatar = user?.imageUrl || "";
      const newActivity: TaskActivity = {
        id: `act-${Date.now()}`,
        type: "updated",
        userName: currentUserName,
        userAvatar: currentUserAvatar,
        action: task.previewImage ? "updated the task preview image" : "attached an image to this task",
        timestamp: new Date().toISOString(),
      };

      const updatedActivities = [newActivity, ...activities];
      setActivities(updatedActivities);
      await persistTaskUpdate({
        previewImage: res.url,
        attachmentsCount: 1,
        activities: updatedActivities,
      });
    } else {
      setUploadWarning(res.error || "Could not upload image.");
    }
  };

  // Handle removing image
  const handleRemoveImage = async () => {
    const currentUserName =
      user?.fullName || user?.firstName || user?.username || "You";
    const currentUserAvatar = user?.imageUrl || "";
    const newActivity: TaskActivity = {
      id: `act-${Date.now()}`,
      type: "updated",
      userName: currentUserName,
      userAvatar: currentUserAvatar,
      action: "removed the task attachment",
      timestamp: new Date().toISOString(),
    };

    const updatedActivities = [newActivity, ...activities];
    setActivities(updatedActivities);
    await persistTaskUpdate({
      previewImage: undefined,
      attachmentsCount: 0,
      activities: updatedActivities,
    });
  };

  // Stage change initiator - prompts for transition note
  const handleInitiateStatusChange = (colId: string) => {
    setShowStatusMenu(false);
    if (colId === targetColumnId) return;

    const fromStage =
      columns?.find((c) => c.id === targetColumnId)?.title ||
      task.statusTitle ||
      targetColumnId;
    const toStage = columns?.find((c) => c.id === colId)?.title || colId;

    setPendingStageChange({
      colId,
      fromStage,
      toStage,
    });
    setStageNote("");
  };

  // Confirm stage change with or without note
  const handleConfirmStatusChange = (includeNote: boolean = true) => {
    if (!pendingStageChange) return;

    const { colId, fromStage, toStage } = pendingStageChange;
    const noteText = includeNote ? stageNote.trim() : "";
    const currentUserName = user?.fullName || user?.firstName || user?.username || "You";
    const currentUserAvatar = user?.imageUrl || "";

    const statusActivity: TaskActivity = {
      id: `act-${Date.now()}`,
      type: "status_changed",
      userName: currentUserName,
      userAvatar: currentUserAvatar,
      action: `changed status from "${fromStage}" to "${toStage}"`,
      details: `${fromStage} → ${toStage}`,
      note: noteText || undefined,
      timestamp: new Date().toISOString(),
    };

    const nextActivities = [statusActivity, ...activities];
    setActivities(nextActivities);
    setTargetColumnId(colId);
    setPendingStageChange(null);
    setStageNote("");

    void persistTaskUpdate({ activities: nextActivities }, colId);
  };

  // Due date change handler with lifecycle event tracking
  const handleDueDateChange = (newDateStr: string) => {
    setDueDate(newDateStr);
    setShowDatePicker(false);
    let display = "No due date";
    if (newDateStr) {
      const parsed = new Date(newDateStr);
      if (!isNaN(parsed.getTime())) {
        display = parsed.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }
    }
    const currentUserName = user?.fullName || user?.firstName || user?.username || "You";
    const currentUserAvatar = user?.imageUrl || "";

    const dateActivity: TaskActivity = {
      id: `act-${Date.now()}`,
      type: "due_date_changed",
      userName: currentUserName,
      userAvatar: currentUserAvatar,
      action: `updated due date to ${display}`,
      timestamp: new Date().toISOString(),
    };

    const nextActivities = [dateActivity, ...activities];
    setActivities(nextActivities);
    void persistTaskUpdate({ dueDate: display, activities: nextActivities });
  };

  // Title save
  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== task.title) {
      void persistTaskUpdate({ title: title.trim() });
    }
  };

  // Tag toggle handler
  const handleToggleTag = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(nextTags);
    void persistTaskUpdate({ tags: nextTags.map((t) => ({ label: t, color: "" })) });
  };

  // Add custom tag
  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      const nextTags = [...selectedTags, trimmed];
      setSelectedTags(nextTags);
      void persistTaskUpdate({ tags: nextTags.map((t) => ({ label: t, color: "" })) });
    }
    setCustomTagInput("");
  };

  // Save Description from WYSIWYG
  const handleSaveDescription = () => {
    setIsEditingDesc(false);
    void persistTaskUpdate({ description });
  };

  // Post comment with lifecycle event tracking
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const currentUserName =
        user?.fullName || user?.firstName || user?.username || "You";
      const currentUserAvatar = user?.imageUrl || "";
      const textToPost = newCommentText.trim();

      const newComment: TaskComment = {
        id: `c-${Date.now()}`,
        userName: currentUserName,
        userAvatar: currentUserAvatar,
        text: textToPost,
        createdAt: new Date().toISOString(),
        likes: 0,
      };

      const commentActivity: TaskActivity = {
        id: `act-${Date.now() + 1}`,
        type: "comment_added",
        userName: currentUserName,
        userAvatar: currentUserAvatar,
        action: `added a comment: "${textToPost.slice(0, 50)}${textToPost.length > 50 ? "..." : ""}"`,
        timestamp: new Date().toISOString(),
      };

      const nextComments = [newComment, ...comments];
      const nextActivities = [commentActivity, ...activities];
      setComments(nextComments);
      setActivities(nextActivities);
      setNewCommentText("");
      void persistTaskUpdate({ comments: nextComments, activities: nextActivities });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete comment
  const handleDeleteComment = (commentId: string) => {
    const nextComments = comments.filter((c) => c.id !== commentId);
    setComments(nextComments);
    void persistTaskUpdate({ comments: nextComments });
  };

  // Assigned user details
  const assigneeName =
    task.users && task.users.length > 0
      ? task.users[0].name
      : task.creatorName || user?.fullName || user?.firstName || "Unassigned";
  const assigneeAvatar =
    task.users && task.users.length > 0
      ? task.users[0].avatar
      : task.creatorAvatar || user?.imageUrl || "";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-stretch justify-end bg-black/75 backdrop-blur-md select-none ${
        !isOpen && isClosing ? "animate-drawerBackdropOut" : "animate-drawerBackdrop"
      }`}
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Drawer Container */}
      <div
        className={`relative z-10 flex h-full flex-col overflow-hidden bg-[#0d0d10] border-l border-white/10 shadow-2xl transition-all duration-300 w-full max-w-full sm:max-w-md md:max-w-[480px] lg:max-w-[500px] ${
          !isOpen && isClosing ? "animate-drawerOut" : "animate-drawerIn"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top-Right Controls: Delete (if supported) + Close (X) */}
        <div className="absolute top-3.5 right-4 z-20 flex items-center gap-1">
          {onDeleteTask && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete "${task.title}"?`)) {
                  void onDeleteTask(task.id, originalColumnId);
                  handleClose();
                }
              }}
              title="Delete task"
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            title="Close (Esc)"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* =================================================================== */}
        {/* SCROLLABLE BODY */}
        {/* =================================================================== */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 sm:px-6 pt-5 pb-6 space-y-4 sm:space-y-5">
          {/* 1. Large Task Title */}
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                  }}
                  className="w-full bg-black border border-white/15 px-2.5 py-1 rounded-lg text-base font-semibold text-white outline-none focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1.5 bg-[#9D6FFF] text-white rounded-lg"
                >
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title"
                className="text-base sm:text-lg font-semibold text-white tracking-tight leading-snug cursor-pointer hover:text-zinc-200 transition-colors group flex items-start justify-between gap-2"
              >
                <span>{title || "Untitled Task"}</span>
                <Pencil
                  size={13}
                  className="opacity-0 group-hover:opacity-60 transition-opacity mt-1 shrink-0 text-zinc-400"
                />
              </h2>
            )}

            {/* Ticket Creator & Lifecycle Timestamp Header */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
              <span>Created by</span>
              <div className="flex items-center gap-1.5 text-zinc-300 font-normal">
                {task.creatorAvatar || user?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={task.creatorAvatar || user?.imageUrl || ""}
                    alt="Creator"
                    className="w-4 h-4 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[#9D6FFF]/20 border border-[#9D6FFF]/30 flex items-center justify-center text-[9px] font-bold text-[#9D6FFF]">
                    {(task.creatorName || user?.fullName || user?.firstName || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <span>{task.creatorName || user?.fullName || user?.firstName || "You"}</span>
              </div>
              <span>•</span>
              <span
                title={task.createdAt ? new Date(task.createdAt).toLocaleString() : undefined}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {timeAgo(task.createdAt)}
              </span>
            </div>
          </div>

          {/* 2. Properties Meta Table (Status, Assigned to, Due Date, Labels) */}
          <div className="space-y-2.5 py-0.5">
            {/* Status row */}
            <div className="flex items-center text-xs">
              <span className="w-20 sm:w-24 shrink-0 text-zinc-500 font-normal">Status</span>
              <div className="relative" ref={statusMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${getStatusBadgeStyle(
                    currentStageTitle
                  )}`}
                >
                  <span>{currentStageTitle}</span>
                  <ChevronDown size={10} className="opacity-70" />
                </button>

                {showStatusMenu && (
                  <div className="absolute left-0 top-8 w-44 bg-[#141417] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 py-1.5 z-30 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    {columns && columns.length > 0 ? (
                      columns.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleInitiateStatusChange(col.id)}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 flex items-center justify-between transition-colors ${
                            col.id === targetColumnId ? "text-[#9D6FFF] font-semibold" : "text-zinc-300"
                          }`}
                        >
                          <span>{col.title}</span>
                          {col.id === targetColumnId && <Check size={12} />}
                        </button>
                      ))
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleInitiateStatusChange("todo")}
                          className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
                        >
                          To do
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInitiateStatusChange("in_progress")}
                          className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
                        >
                          In progress
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInitiateStatusChange("completed")}
                          className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
                        >
                          Completed
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned to row */}
            <div className="flex items-center text-xs">
              <span className="w-20 sm:w-24 shrink-0 text-zinc-500 font-normal">Assigned to</span>
              <div className="flex items-center gap-2">
                {assigneeAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={assigneeAvatar}
                    alt={assigneeName}
                    className="w-4 h-4 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[#9D6FFF]/20 border border-[#9D6FFF]/40 flex items-center justify-center text-[9px] font-medium text-[#9D6FFF]">
                    {(assigneeName || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-normal text-zinc-200">{assigneeName}</span>
              </div>
            </div>

            {/* Due Date row */}
            <div className="flex items-center text-xs relative">
              <span className="w-20 sm:w-24 shrink-0 text-zinc-500 font-normal">Due Date</span>
              {!showDatePicker ? (
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="text-zinc-200 font-normal hover:text-white flex items-center gap-1.5 group cursor-pointer"
                >
                  <span>{task.dueDate || "No due date"}</span>
                  <Pencil size={11} className="opacity-0 group-hover:opacity-60 text-zinc-400" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    autoFocus
                    value={dueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className="bg-black border border-white/15 px-2.5 py-1 rounded-lg text-xs text-white [color-scheme:dark] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Labels row */}
            <div className="flex items-start text-xs pt-0.5">
              <span className="w-20 sm:w-24 shrink-0 text-zinc-500 font-normal pt-1">Labels</span>
              <div className="flex items-center gap-1 flex-wrap flex-1">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-normal border ${getTagBadgeStyle(
                      tag
                    )}`}
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}

                {/* Add Tag button & Popover Modal */}
                <div className="relative" ref={tagMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowTagMenu(!showTagMenu)}
                    className={`p-1 rounded-full transition-all cursor-pointer ${
                      showTagMenu
                        ? "bg-[#9D6FFF]/20 text-[#9D6FFF] ring-1 ring-[#9D6FFF]/40"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/10"
                    }`}
                    title="Add Label"
                  >
                    <Plus size={13} />
                  </button>

                  {showTagMenu && (
                    <div
                      className="absolute left-0 sm:left-auto sm:right-0 top-8 w-64 bg-[#141417] border border-white/10 rounded-2xl shadow-2xl shadow-black/90 p-3 z-40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                          Labels
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {selectedTags.length} selected
                        </span>
                      </div>

                      {/* Search & Add Input */}
                      <div className="relative flex items-center">
                        <Search size={12} className="absolute left-2.5 text-zinc-500 pointer-events-none" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search or add label..."
                          value={customTagInput}
                          onChange={(e) => setCustomTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomTag();
                            }
                          }}
                          className="w-full bg-black/60 border border-white/10 focus:border-[#9D6FFF]/60 focus:ring-1 focus:ring-[#9D6FFF]/30 pl-8 pr-12 py-1.5 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-all"
                        />
                        {customTagInput.trim() && (
                          <button
                            type="button"
                            onClick={handleAddCustomTag}
                            className="absolute right-1 px-2 py-0.5 bg-[#9D6FFF] hover:bg-[#8B5CF6] text-white rounded-lg text-[10px] font-medium transition-all"
                          >
                            Add
                          </button>
                        )}
                      </div>

                      {/* Filtered Tags List */}
                      <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1 pt-1 border-t border-white/5">
                        {filteredTags.length > 0 ? (
                          filteredTags.map((t) => {
                            const isSelected = selectedTags.includes(t);
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => handleToggleTag(t)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer group ${
                                  isSelected
                                    ? "bg-white/[0.08] text-white"
                                    : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                                }`}
                              >
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${getTagBadgeStyle(
                                    t
                                  )}`}
                                >
                                  {t}
                                </span>
                                {isSelected ? (
                                  <div className="w-4 h-4 rounded-md bg-[#9D6FFF] text-white flex items-center justify-center shrink-0">
                                    <Check size={11} strokeWidth={2.5} />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-md border border-white/15 group-hover:border-white/30 shrink-0" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="py-2.5 text-center text-xs text-zinc-500">
                            No matching labels
                          </div>
                        )}

                        {/* Create new label prompt if typed query doesn't match */}
                        {customTagInput.trim() &&
                          !allAvailableTags.some(
                            (t) => t.toLowerCase() === customTagInput.trim().toLowerCase()
                          ) && (
                            <button
                              type="button"
                              onClick={handleAddCustomTag}
                              className="w-full mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-[#9D6FFF] bg-[#9D6FFF]/10 hover:bg-[#9D6FFF]/20 border border-[#9D6FFF]/25 transition-all font-medium text-left cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Create &quot;{customTagInput.trim()}&quot;</span>
                            </button>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attachment / Image Property Row */}
            <div className="flex items-start text-xs pt-1">
              <span className="w-20 sm:w-24 text-zinc-500 font-medium pt-1">Attachment</span>
              <div className="flex-1 min-w-0">
                {task.previewImage ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black max-w-sm group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={task.previewImage}
                        alt={task.title}
                        className="w-full max-h-44 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setShowLightbox(true)}
                      />

                      {/* Uploading indicator overlay */}
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                          <Loader2 size={20} className="text-[#9D6FFF] animate-spin" />
                          <span className="text-[11px] font-medium text-white">Uploading image...</span>
                        </div>
                      )}

                      {/* Hover action controls */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <button
                          type="button"
                          onClick={() => setShowLightbox(true)}
                          title="View full preview"
                          className="px-2.5 py-1.5 bg-black/70 hover:bg-black text-white text-[11px] font-medium rounded-lg backdrop-blur-sm transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          title="Replace image"
                          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium rounded-lg backdrop-blur-sm transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload size={12} />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          title="Delete image"
                          className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {uploadWarning && (
                      <p className="text-[11px] text-amber-400">{uploadWarning}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-white/20 hover:border-[#9D6FFF]/60 hover:bg-[#9D6FFF]/5 text-zinc-400 hover:text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-[#9D6FFF]" />
                          <span>Uploading image...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={13} className="text-[#9D6FFF]" />
                          <span>Attach image</span>
                        </>
                      )}
                    </button>
                    {uploadWarning && (
                      <p className="text-[11px] text-amber-400 mt-1">{uploadWarning}</p>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. Tabs: Activity history | Description */}
          <div className="border-b border-white/10 flex items-center gap-6 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`pb-2.5 text-xs font-medium tracking-normal flex items-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === "activity"
                  ? "text-white border-b-2 border-white -mb-[1px]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <History size={12} />
              <span>Activity history</span>
              <span className="px-1.5 py-0.2 bg-white/10 text-zinc-300 rounded text-[10px]">
                {timelineEvents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("description")}
              className={`pb-2.5 text-xs font-medium tracking-normal transition-all cursor-pointer relative ${
                activeTab === "description"
                  ? "text-white border-b-2 border-white -mb-[1px]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>Description</span>
            </button>
          </div>

          {/* 4. Tab Content */}
          {activeTab === "activity" ? (
            /* ── COMPLETE LIFECYCLE ACTIVITY HISTORY ──────────── */
            <div className="space-y-4 pt-1">
              {/* Add Comment / Note Box */}
              <form
                onSubmit={handleAddComment}
                className="bg-[#141416] border border-white/10 rounded-xl p-2.5 focus-within:border-white/20 transition-all space-y-2"
              >
                <textarea
                  rows={2}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment or update..."
                  className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 outline-none resize-none leading-normal"
                />

                <div className="flex items-center justify-between pt-0.5">
                  {/* Left tool icons: @, 🔗 */}
                  <div className="flex items-center gap-2 text-zinc-500">
                    <button
                      type="button"
                      onClick={() => setNewCommentText((prev) => prev + " @")}
                      className="hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                      title="Mention member"
                    >
                      <AtSign size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("Insert link URL:", "https://");
                        if (url) setNewCommentText((prev) => prev + ` ${url} `);
                      }}
                      className="hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                      title="Insert link"
                    >
                      <LinkIcon size={13} />
                    </button>
                  </div>

                  {/* Right Submit button */}
                  <button
                    type="submit"
                    disabled={!newCommentText.trim() || isSubmittingComment}
                    className="px-3.5 py-1 bg-[#0070F3] hover:bg-[#0060df] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-medium rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    {isSubmittingComment ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>

              {/* Section Header: Activity history & Filters */}
              <div className="flex items-center justify-between pt-0.5">
                <h3 className="text-xs font-semibold text-zinc-300 tracking-normal">
                  Activity history
                </h3>

                {/* Filter chips */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActivityFilter("all")}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-normal transition-colors cursor-pointer ${
                      activityFilter === "all"
                        ? "bg-white/15 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    All ({activities.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter("status")}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-normal transition-colors cursor-pointer ${
                      activityFilter === "status"
                        ? "bg-[#6397FF]/25 text-[#6397FF]"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Stage
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter("comments")}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-normal transition-colors cursor-pointer ${
                      activityFilter === "comments"
                        ? "bg-emerald-500/25 text-emerald-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Comments
                  </button>
                </div>
              </div>

              {/* Timeline feed matching media_1789543636271.png */}
              {timelineEvents.length === 0 ? (
                <div className="py-6 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-1.5 border border-dashed border-white/5 rounded-xl">
                  <History size={18} className="text-zinc-600" />
                  <p className="text-zinc-400 font-medium text-xs">No activity yet</p>
                  <p className="text-[11px] text-zinc-600">Events and comments will appear here chronologically.</p>
                </div>
              ) : (
                <div className="relative pl-6 pr-0.5 space-y-2.5 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[1.5px] before:bg-white/10">
                  {timelineEvents.map((act) => {
                    const isBoxed =
                      act.type === "comment_added" ||
                      act.type === "status_changed" ||
                      act.type === "created";

                    if (isBoxed) {
                      const textContent = act.details || act.action || "";
                      const isLong = textContent.length > 130;
                      const isExpanded = Boolean(expandedActivityIds[act.id]);

                      return (
                        <div
                          key={act.id}
                          className="relative flex items-start gap-3 text-xs group"
                        >
                          {/* Left: Circle Node on Timeline Line */}
                          <div className="relative z-10 w-6 h-6 rounded-full bg-[#18181b] border border-white/15 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            {act.type === "comment_added" ? (
                              act.userAvatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={act.userAvatar}
                                  alt={act.userName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-[#6397FF]/20 text-[#6397FF] font-medium flex items-center justify-center text-[9px]">
                                  {(act.userName || "U").charAt(0).toUpperCase()}
                                </div>
                              )
                            ) : act.type === "status_changed" ? (
                              <div className="w-full h-full rounded-full bg-[#6397FF]/15 text-[#6397FF] flex items-center justify-center">
                                <ArrowRight size={11} />
                              </div>
                            ) : (
                              <div className="w-full h-full rounded-full bg-[#9D6FFF]/15 text-[#9D6FFF] flex items-center justify-center">
                                <Plus size={11} />
                              </div>
                            )}
                          </div>

                          {/* Speech Bubble Boxed Card */}
                          <div className="relative flex-1 bg-[#121214] border border-white/10 rounded-xl overflow-hidden shadow-sm hover:border-white/20 transition-all">
                            {/* Triangular Speech Notch pointing left */}
                            <div className="absolute -left-1 top-2.5 w-2.5 h-2.5 bg-[#18181b] border-l border-b border-white/10 rotate-45 pointer-events-none" />

                            {/* Card Header */}
                            <div className="bg-[#18181b] px-3 py-1.5 flex items-center justify-between border-b border-white/10 text-[11px] gap-2">
                              <div className="flex items-center gap-1.5 min-w-0 pr-1 overflow-hidden">
                                <span className="font-medium text-zinc-100 shrink-0">
                                  {act.userName}
                                </span>
                                <span className="text-zinc-400 font-normal truncate">
                                  {act.action}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                                {formatActivityDateTime(act.timestamp)}
                              </span>
                            </div>

                            {/* Card Body */}
                            <div className="px-3 py-2 text-xs space-y-1.5">
                              {act.type === "status_changed" ? (
                                <div className="space-y-1">
                                  {act.details && (
                                    <div className="flex items-center gap-1.5 text-[11px]">
                                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-normal">
                                        {act.details.split("→")[0]?.trim()}
                                      </span>
                                      <ArrowRight size={10} className="text-zinc-500 shrink-0" />
                                      <span className="px-2 py-0.5 rounded-md bg-[#6397FF]/15 border border-[#6397FF]/30 text-[#6397FF] font-medium">
                                        {act.details.split("→")[1]?.trim()}
                                      </span>
                                    </div>
                                  )}
                                  {act.note && (
                                    <div className="mt-1.5 p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-zinc-300 leading-relaxed">
                                      <div className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                        <MessageSquare size={9} className="text-[#6397FF]" />
                                        <span>Stage Note</span>
                                      </div>
                                      <p className="whitespace-pre-wrap">{act.note}</p>
                                    </div>
                                  )}
                                </div>
                              ) : act.type === "created" ? (
                                <div className="space-y-0.5">
                                  <p className="text-zinc-400 text-[11px] leading-relaxed font-normal">
                                    Task initialized in stage{" "}
                                    <span className="text-zinc-200 font-medium">
                                      &quot;{currentStageTitle}&quot;
                                    </span>
                                    .
                                  </p>
                                </div>
                              ) : (
                                /* Comment card body */
                                <div className="space-y-1.5">
                                  <p className="text-zinc-300 text-[11px] font-normal leading-relaxed whitespace-pre-wrap">
                                    {isLong && !isExpanded
                                      ? `${textContent.slice(0, 130)}... `
                                      : textContent}
                                    {isLong && (
                                      <button
                                        type="button"
                                        onClick={() => toggleActivityExpand(act.id)}
                                        className="text-[#6397FF] hover:underline font-normal ml-1 cursor-pointer"
                                      >
                                        {isExpanded ? "View less" : "View more"}
                                      </button>
                                    )}
                                  </p>

                                  {/* Actions: Reply and Delete */}
                                  <div className="flex items-center justify-between pt-0.5 border-t border-white/5">
                                    <button
                                      type="button"
                                      onClick={() => setNewCommentText(`@${act.userName} `)}
                                      className="text-[10px] text-[#6397FF] hover:underline font-normal cursor-pointer"
                                    >
                                      Reply
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(act.id)}
                                      className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                                      title="Delete comment"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    /* Inline / Simple Row (Bullseye dot) */
                    return (
                      <div
                        key={act.id}
                        className="relative flex items-center gap-3 text-[11px] group py-0.5"
                      >
                        {/* Blue bullseye dot on the line */}
                        <div className="relative z-10 w-6 flex items-center justify-center shrink-0">
                          <div className="w-3 h-3 rounded-full border-[1.5px] border-[#0070F3] bg-[#0d0d10] flex items-center justify-center shadow-sm">
                            <div className="w-1 h-1 rounded-full bg-[#0070F3]" />
                          </div>
                        </div>

                        {/* Inline Content */}
                        <div className="flex-1 flex items-center justify-between gap-2 text-[11px] min-w-0">
                          <div className="truncate">
                            <span className="font-medium text-zinc-200">
                              {act.userName}
                            </span>{" "}
                            <span className="text-zinc-400 font-normal">
                              {act.action}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0 font-normal">
                            {formatActivityDateTime(act.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ── DESCRIPTION TAB (WYSIWYG & FORMATTED VIEW) ──── */
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">
                  Task Specification & Details
                </span>
                {!isEditingDesc ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingDesc(true)}
                    className="flex items-center gap-1 text-xs text-[#9D6FFF] hover:text-[#b18aff] font-medium"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(false)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      className="px-3 py-1 bg-[#9D6FFF] text-white text-xs font-medium rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {isEditingDesc ? (
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Enter detailed description..."
                  minHeight="160px"
                />
              ) : (
                <div
                  className="bg-[#141416] p-4 rounded-2xl border border-white/5 text-xs sm:text-sm text-zinc-200 leading-relaxed min-h-[100px] whitespace-pre-wrap select-text"
                  dangerouslySetInnerHTML={{
                    __html: renderRichText(description || "No description provided."),
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stage Change Note Modal Dialog */}
      {pendingStageChange && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setPendingStageChange(null);
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
                onClick={() => setPendingStageChange(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Transition Badge Row */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-black/50 border border-white/5 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-medium">
                {pendingStageChange.fromStage}
              </span>
              <ArrowRight size={13} className="text-zinc-500 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-[#6397FF]/20 border border-[#6397FF]/30 text-[#6397FF] font-semibold">
                {pendingStageChange.toStage}
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
                value={stageNote}
                onChange={(e) => setStageNote(e.target.value)}
                placeholder="Reason or notes for this stage change (e.g. Reviewed, passed QA, blocked on review)..."
                className="w-full bg-black/60 border border-white/10 focus:border-black focus:ring-1 focus:ring-black rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none resize-none leading-relaxed transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleConfirmStatusChange(Boolean(stageNote.trim()));
                  }
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingStageChange(null)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmStatusChange(false)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
              >
                Skip note
              </button>
              <button
                type="button"
                onClick={() => handleConfirmStatusChange(true)}
                disabled={!stageNote.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0070F3] hover:bg-[#0060df] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Save & Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {task.previewImage && (
        <ImageLightboxModal
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          imageUrl={task.previewImage}
          title={task.title}
        />
      )}
    </div>
  );
}
