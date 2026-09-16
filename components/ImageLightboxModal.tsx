"use client";

import React, { useEffect, useState } from "react";
import { Download, ExternalLink, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export default function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title,
}: ImageLightboxModalProps) {
  const [prevKey, setPrevKey] = useState("");
  const [zoom, setZoom] = useState(1);
  const [isFullFit, setIsFullFit] = useState(true);

  const currentKey = `${isOpen}-${imageUrl}`;
  if (isOpen && currentKey !== prevKey) {
    setPrevKey(currentKey);
    setZoom(1);
    setIsFullFit(true);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = (title ? title.replace(/[^a-z0-9]/gi, "_").toLowerCase() : "task-attachment") + ".png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-xl animate-drawerBackdrop select-none">
      {/* ── Top Header Toolbar ────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-[#0d0d0f]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[#9D6FFF] shrink-0" />
          <div className="truncate">
            <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
              {title || "Image Preview"}
            </h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">Attachment Preview</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
            disabled={zoom <= 0.5}
            title="Zoom out"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 rounded-lg transition-all"
          >
            <ZoomOut size={16} />
          </button>

          {/* Zoom % label */}
          <span className="text-[11px] font-mono text-zinc-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}
            disabled={zoom >= 3}
            title="Zoom in"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 rounded-lg transition-all"
          >
            <ZoomIn size={16} />
          </button>

          {/* Fit / Original Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsFullFit(!isFullFit);
              setZoom(1);
            }}
            title={isFullFit ? "Actual size" : "Fit to screen"}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            {isFullFit ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
          </button>

          <div className="w-[1px] h-4 bg-white/15 mx-1" />

          {/* Open in new tab */}
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open original in new tab"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all inline-flex items-center"
          >
            <ExternalLink size={15} />
          </a>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download image"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <Download size={15} />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="p-1.5 ml-1 text-zinc-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Main Canvas ───────────────────────────────────────────── */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center cursor-zoom-out"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title || "Preview"}
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          className={`transition-transform duration-150 rounded-xl shadow-2xl border border-white/10 object-contain cursor-default ${
            isFullFit ? "max-h-[82vh] max-w-full" : "max-w-none"
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
