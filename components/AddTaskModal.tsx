"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Calendar, Tag, Users, Image as ImageIcon, FileText } from "lucide-react";
import { TaskItem } from "./TaskCard";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (columnId: string, task: TaskItem) => void;
}

const availableTags = ["Web", "Design", "Backend", "Branding", "Mobile"];

const availableUsers = [
  { name: "Alice", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" },
  { name: "Bob", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
  { name: "Clara", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
  { name: "David", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" },
  { name: "Evan", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80" },
  { name: "Grace", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" },
];

export default function AddTaskModal({
  isOpen,
  onClose,
  onAddTask,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Web", "Design"]);
  const [dueDate, setDueDate] = useState("28 August");
  const [description, setDescription] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>(["Alice", "Bob"]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleUser = (userName: string) => {
    if (selectedUsers.includes(userName)) {
      setSelectedUsers(selectedUsers.filter((u) => u !== userName));
    } else {
      setSelectedUsers([...selectedUsers, userName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUsers = availableUsers.filter((u) =>
      selectedUsers.includes(u.name)
    );

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "No description provided.",
      tags: selectedTags.map((t) => ({ label: t, color: "" })),
      dueDate: dueDate || "Upcoming",
      users: assignedUsers.length > 0 ? assignedUsers : [availableUsers[0]],
      commentsCount: 0,
      attachmentsCount: previewImage ? 1 : 0,
      previewImage: previewImage.trim() || undefined,
    };

    onAddTask(status, newTask);
    onClose();

    // Reset form
    setTitle("");
    setDescription("");
    setPreviewImage("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-xl bg-[#161618] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1c1c1f]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#9D6FFF]/20 text-[#9D6FFF] rounded-lg">
              <Plus size={18} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Create New Ticket
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileText size={13} className="text-zinc-400" /> Task Title <span className="text-[#FF6B6B]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement User Authentication"
              className="w-full bg-[#1b1b1e] border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9D6FFF]"
            />
          </div>

          {/* Status Column Select */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Status Section <span className="text-[#FF6B6B]">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#1b1b1e] border border-white/10 px-3 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-[#9D6FFF]"
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="under_review">Under review</option>
                <option value="ready">Ready</option>
              </select>
            </div>

            {/* Due Date Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Calendar size={13} className="text-zinc-400" /> Due Date
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. 28 August"
                className="w-full bg-[#1b1b1e] border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9D6FFF]"
              />
            </div>
          </div>

          {/* Category Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Tag size={13} className="text-zinc-400" /> Tags
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                      isSelected
                        ? "bg-[#9D6FFF] text-white border-[#9D6FFF]"
                        : "bg-[#1b1b1e] text-zinc-400 border-white/10 hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, instructions, or CTA specs for this task..."
              className="w-full bg-[#1b1b1e] border border-white/10 p-3 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9D6FFF] resize-none"
            />
          </div>

          {/* Preview Image Attachment URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <ImageIcon size={13} className="text-zinc-400" /> Attachment Image URL (Optional)
            </label>
            <input
              type="url"
              value={previewImage}
              onChange={(e) => setPreviewImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-[#1b1b1e] border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9D6FFF]"
            />
          </div>

          {/* Assignees */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Users size={13} className="text-zinc-400" /> Assign Team Members
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {availableUsers.map((user) => {
                const isSelected = selectedUsers.includes(user.name);
                return (
                  <button
                    type="button"
                    key={user.name}
                    onClick={() => toggleUser(user.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      isSelected
                        ? "bg-white/15 text-white border-white/30"
                        : "bg-[#1b1b1e] text-zinc-500 border-white/10 hover:text-white"
                    }`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{user.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#9D6FFF] hover:bg-[#8b57ff] text-white font-medium text-xs rounded-xl shadow-lg shadow-[#9D6FFF]/25 transition-all active:scale-95"
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
