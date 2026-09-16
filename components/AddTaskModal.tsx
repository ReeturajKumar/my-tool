"use client";
import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Eye, ImageIcon, Loader2, Plus, Upload, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { TaskActivity, TaskItem } from "./TaskCard";
import RichTextEditor from "./RichTextEditor";
import ImageLightboxModal from "./ImageLightboxModal";
import { uploadImageToCloudinary } from "@/lib/upload";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (columnId: string, task: TaskItem) => void;
  columns?: { id: string; title: string }[];
}

const PRESET_TAGS = ["Web", "Design", "Backend", "Branding", "Mobile", "Frontend", "Testing", "DevOps"];

const TAG_COLORS: Record<string, string> = {
  Web: "bg-[#6397FF] text-white border-[#6397FF]",
  Design: "bg-[#FF6B6B] text-white border-[#FF6B6B]",
  Backend: "bg-[#9D6FFF] text-white border-[#9D6FFF]",
  Branding: "bg-[#FF6B6B] text-white border-[#FF6B6B]",
  Mobile: "bg-[#F59E0B] text-white border-[#F59E0B]",
  Frontend: "bg-[#6397FF] text-white border-[#6397FF]",
  Testing: "bg-emerald-500 text-white border-emerald-500",
  DevOps: "bg-zinc-500 text-white border-zinc-500",
};

// Deterministic colour for custom tags based on label hash
function customTagColor(label: string): string {
  const palette = [
    "bg-cyan-500 text-white border-cyan-500",
    "bg-rose-500 text-white border-rose-500",
    "bg-violet-500 text-white border-violet-500",
    "bg-amber-500 text-white border-amber-500",
    "bg-teal-500 text-white border-teal-500",
    "bg-pink-500 text-white border-pink-500",
  ];
  let hash = 0;
  for (const ch of label) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return palette[Math.abs(hash) % palette.length];
}

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] ?? customTagColor(tag);
}

function getDefaultStatus(columns?: { id: string; title: string }[]): string {
  return columns && columns.length > 0 ? columns[0].id : "todo";
}

// shared field className — black border on focus
const fieldCls =
  "w-full bg-black border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:outline-none focus:ring-0 focus:border-black transition-colors";

export default function AddTaskModal({ isOpen, onClose, onAddTask, columns }: AddTaskModalProps) {
  const { user } = useUser();
  const [isClosing, setIsClosing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState(() => getDefaultStatus(columns));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [allTags, setAllTags] = useState<string[]>(PRESET_TAGS);

  // Drag & drop image + Cloudinary
  const [previewImageDataUrl, setPreviewImageDataUrl] = useState("");
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Adjust state during render when isOpen or columns changes
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setTitle("");
      setDescription("");
      setDueDate("");
      setStatus(getDefaultStatus(columns));
      setSelectedTags([]);
      setCustomTagInput("");
      setAllTags(PRESET_TAGS);
      setPreviewImageDataUrl("");
      setPreviewImageFile(null);
      setCloudinaryUrl("");
      setIsUploadingImage(false);
      setUploadWarning(null);
      setShowLightbox(false);
      setIsDragOver(false);
      setIsSubmitting(false);
    }
  }

  const [prevColumns, setPrevColumns] = useState(columns);
  if (columns !== prevColumns) {
    setPrevColumns(columns);
    if (columns && columns.length > 0 && !status) {
      setStatus(columns[0].id);
    }
  }

  const handleClose = () => {
    setIsClosing(true);
    onClose();
  };

  // Closing animation
  useEffect(() => {
    if (isOpen || !isClosing) return;
    const id = window.setTimeout(() => setIsClosing(false), 260);
    return () => window.clearTimeout(id);
  }, [isOpen, isClosing]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen && !isClosing) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!allTags.includes(trimmed)) {
      setAllTags((prev) => [...prev, trimmed]);
    }
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setCustomTagInput("");
  };

  // Image helpers + Cloudinary upload
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadWarning(null);
    setPreviewImageFile(file);

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImageDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Asynchronously upload to Cloudinary
    setIsUploadingImage(true);
    const res = await uploadImageToCloudinary(file, "task_previews");
    setIsUploadingImage(false);

    if (res.url) {
      setCloudinaryUrl(res.url);
      setPreviewImageDataUrl(res.url);
    } else {
      setUploadWarning(
        res.error || "Could not upload image. Using local preview."
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setPreviewImageDataUrl("");
    setPreviewImageFile(null);
    setCloudinaryUrl("");
    setUploadWarning(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting || isUploadingImage) return;
    setIsSubmitting(true);

    let displayDate = "";
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        displayDate = parsed.toLocaleDateString("en-IN", {
          day: "numeric", month: "long", timeZone: "Asia/Kolkata",
        });
      }
    }

    const currentUserName =
      user?.fullName || user?.firstName || user?.username || "You";
    const currentUserAvatar = user?.imageUrl || "";

    const creationTime = new Date().toISOString();
    const initialActivity: TaskActivity = {
      id: `act-${Date.now()}`,
      type: "created",
      userName: currentUserName,
      userAvatar: currentUserAvatar,
      action: "created this task",
      timestamp: creationTime,
    };

    const finalImage = cloudinaryUrl || previewImageDataUrl || undefined;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "No description provided.",
      tags: selectedTags.map((tag) => ({ label: tag, color: "" })),
      dueDate: displayDate || "Upcoming",
      users: currentUserAvatar
        ? [{ name: currentUserName, avatar: currentUserAvatar }]
        : [{ name: currentUserName, avatar: "" }],
      commentsCount: 0,
      attachmentsCount: finalImage ? 1 : 0,
      previewImage: finalImage,
      comments: [],
      activities: [initialActivity],
      creatorName: currentUserName,
      creatorAvatar: currentUserAvatar,
      createdAt: creationTime,
    };

    try {
      onAddTask(status, newTask);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-stretch justify-end bg-black/75 backdrop-blur-md select-none ${
        !isOpen && isClosing ? "animate-drawerBackdropOut" : "animate-drawerBackdrop"
      }`}
    >
      <div className="absolute inset-0" onClick={handleClose} />

      <div
        className={`relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden bg-[#0a0a0a] border-l border-white/10 shadow-2xl ${
          !isOpen && isClosing ? "animate-drawerOut" : "animate-drawerIn"
        }`}
      >
        {/* ── Fixed Header ──────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Create New Task</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Fill in the details below</p>
          </div>
          <button type="button" onClick={handleClose} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable Form Body ───────────────────────── */}
        <form id="add-task-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-5 space-y-5">

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Task Title <span className="text-[#FF6B6B]">*</span></label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement User Authentication"
              className={fieldCls}
            />
          </div>

          {/* Stage + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Stage <span className="text-[#FF6B6B]">*</span></label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-black border border-white/10 px-3 py-2.5 rounded-xl text-xs text-white outline-none focus:outline-none focus:ring-0 focus:border-black transition-colors"
              >
                {columns && columns.length > 0 ? (
                  columns.map((col) => <option key={col.id} value={col.id}>{col.title}</option>)
                ) : (
                  <>
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="under_review">Under review</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-black border border-white/10 px-3 py-2.5 rounded-xl text-xs text-white outline-none focus:outline-none focus:ring-0 focus:border-black transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Description (Rich Text Editor) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Description</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Add details, instructions, or CTA specs..."
              minHeight="130px"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Tags</label>
              <span className="text-[10px] text-zinc-500">
                {selectedTags.length} selected
              </span>
            </div>

            {/* Single unified list of tag chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                      isSelected
                        ? getTagColor(tag)
                        : "bg-white/[0.03] text-zinc-400 border-white/10 hover:text-white hover:border-white/25"
                    }`}
                  >
                    {isSelected && <Check size={11} strokeWidth={2.5} />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom tag input */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }
                }}
                placeholder="Add custom tag..."
                maxLength={24}
                className="flex-1 bg-black border border-white/10 px-3 py-1.5 rounded-lg text-xs text-white placeholder-zinc-600 outline-none focus:outline-none focus:ring-0 focus:border-black transition-colors"
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!customTagInput.trim()}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 hover:text-white text-xs font-medium rounded-lg border border-white/10 transition-all"
              >
                <Plus size={11} strokeWidth={2.5} />
                Add
              </button>
            </div>
          </div>

          {/* Preview Image — Drag & Drop */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">
              Preview Image <span className="text-zinc-600 font-normal">(optional)</span>
            </label>

            {previewImageDataUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-white/10 group bg-black/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewImageDataUrl} alt="Preview" className="w-full h-36 object-cover" />

                  {/* Uploading Overlay */}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 z-20">
                      <Loader2 size={20} className="text-[#9D6FFF] animate-spin" />
                      <span className="text-[11px] font-medium text-white">Uploading image...</span>
                    </div>
                  )}

                  {/* Hover Controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                    <button
                      type="button"
                      onClick={() => setShowLightbox(true)}
                      title="View full preview"
                      className="px-2.5 py-1.5 bg-black/70 hover:bg-black text-white text-[11px] font-medium rounded-lg backdrop-blur-sm transition-all border border-white/20 flex items-center gap-1"
                    >
                      <Eye size={12} />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium rounded-lg backdrop-blur-sm transition-all border border-white/20"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Remove image"
                      className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-all"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {previewImageFile && (
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/60 backdrop-blur-sm flex items-center justify-between">
                      <p className="text-[10px] text-zinc-300 truncate">{previewImageFile.name}</p>
                      {previewImageFile.size && (
                        <span className="text-[9px] text-zinc-500 shrink-0 ml-2">
                          {(previewImageFile.size / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {uploadWarning && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]">
                    <AlertCircle size={13} className="shrink-0" />
                    <span className="truncate">{uploadWarning}</span>
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2.5 w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? "border-[#9D6FFF] bg-[#9D6FFF]/10 scale-[0.99]"
                    : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDragOver ? "bg-[#9D6FFF]/20" : "bg-white/5"}`}>
                  {isDragOver ? <Upload size={17} className="text-[#9D6FFF]" /> : <ImageIcon size={17} className="text-zinc-500" />}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium transition-colors ${isDragOver ? "text-[#9D6FFF]" : "text-zinc-400"}`}>
                    {isDragOver ? "Drop image here" : "Drag & drop an image"}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">or click to browse · PNG, JPG, GIF, WebP</p>
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
          </div>
        </form>

        {/* ── Fixed Footer ────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10 bg-[#0a0a0a]">
          <button type="button" onClick={handleClose} className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-black hover:bg-zinc-900 rounded-xl transition-all border border-white/10">
            Cancel
          </button>
          <button
            type="submit"
            form="add-task-form"
            disabled={!title.trim() || isSubmitting || isUploadingImage}
            className="px-5 py-2 bg-[#9D6FFF] hover:bg-[#8b57ff] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-xl shadow-lg shadow-[#9D6FFF]/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Creating...</span>
              </>
            ) : isUploadingImage ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Uploading Image...</span>
              </>
            ) : (
              "Create Task"
            )}
          </button>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        imageUrl={cloudinaryUrl || previewImageDataUrl}
        title={title || "Task Preview Image"}
      />
    </div>
  );
}
