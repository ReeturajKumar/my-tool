"use client";

import React, { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

interface AddStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStage: (title: string) => Promise<void> | void;
}

export default function AddStageModal({ isOpen, onClose, onAddStage }: AddStageModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen || !isClosing) return;
    const timeoutId = window.setTimeout(() => {
      setIsClosing(false);
    }, 260);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isClosing]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen && !isClosing) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddStage(title.trim());
      setTitle("");
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none ${
        !isOpen && isClosing ? "animate-drawerBackdropOut" : "animate-drawerBackdrop"
      }`}
    >
      <div className="absolute inset-0" onClick={handleClose} />

      <div
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-[#161617] border border-white/10 shadow-2xl ${
          !isOpen && isClosing ? "animate-drawerOut" : "animate-drawerIn"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c1c1e]">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Create New Stage
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Stage Title <span className="text-[#FF6B6B]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. QA Testing, Deployment, Blocked"
              className="w-full bg-black border border-white/10 px-3.5 py-2 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:outline-none focus:ring-0 focus:border-black transition-colors"
            />
            <p className="text-[11px] text-zinc-500">
              This stage will be created specifically for your account and added to your workflow board.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-black hover:bg-zinc-900 rounded-xl transition-all border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-2 bg-[#9D6FFF] hover:bg-[#8b57ff] disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg shadow-[#9D6FFF]/25 transition-all active:scale-95"
            >
              {isSubmitting ? "Creating..." : "Create Stage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
