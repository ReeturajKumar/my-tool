"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Loader2,
  Quote,
  Strikethrough,
  Type,
} from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/upload";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  heading: boolean;
  subheading: boolean;
  link: boolean;
  quote: boolean;
  code: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  alignJustify: boolean;
  bulletList: boolean;
  numberedList: boolean;
}

const defaultActiveFormats: ActiveFormats = {
  bold: false,
  italic: false,
  strike: false,
  heading: false,
  subheading: false,
  link: false,
  quote: false,
  code: false,
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
  alignJustify: false,
  bulletList: false,
  numberedList: false,
};

// Utility to render rich HTML / Markdown content in view/preview contexts
export function renderRichText(content: string): string {
  if (!content) return "";

  let html = content;

  // ── Style existing HTML <ol> / <ul> / <li> tags from the contentEditable editor ──
  // These are already valid HTML but Tailwind resets their list-style. Add classes.
  html = html.replace(
    /<ol(\s[^>]*)?>/gi,
    '<ol$1 style="list-style-type: decimal; padding-left: 1.25rem; margin: 0.375rem 0;">'
  );
  html = html.replace(
    /<ul(\s[^>]*)?>/gi,
    '<ul$1 style="list-style-type: disc; padding-left: 1.25rem; margin: 0.375rem 0;">'
  );
  html = html.replace(
    /<li(\s[^>]*)?>/gi,
    '<li$1 style="margin: 0.125rem 0; color: #d4d4d8;">'
  );

  // ── Code blocks ```code``` (markdown) ──
  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-black/60 p-2.5 rounded-lg my-1.5 overflow-x-auto text-[11px] font-mono text-emerald-400 border border-white/10"><code>$1</code></pre>'
  );

  // ── Inline code `code` (markdown) ──
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-400">$1</code>'
  );

  // ── Markdown images ![alt](url) ──
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="max-h-48 rounded-lg my-2 border border-white/10 object-cover" />'
  );

  // ── Markdown links [text](url) ──
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#6397FF] underline hover:text-[#8cb3ff] transition-colors">$1</a>'
  );

  // ── Markdown Headings ──
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-white mt-2 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-white mt-2.5 mb-1">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-white mt-3 mb-1.5">$1</h1>');

  // ── Blockquote > text ──
  html = html.replace(
    /^> (.*$)/gim,
    '<blockquote class="border-l-2 border-[#9D6FFF] pl-3 py-0.5 my-1.5 text-zinc-400 italic bg-white/[0.02] rounded-r">$1</blockquote>'
  );

  // ── Bold **text** ──
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  // ── Italic *text* ──
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-zinc-300">$1</em>');

  // ── Strikethrough ~~text~~ ──
  html = html.replace(/~~([^~]+)~~/g, '<del class="line-through text-zinc-500">$1</del>');

  // ── Task list (markdown) ──
  html = html.replace(
    /^- \[x\] (.*$)/gim,
    '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="accent-[#9D6FFF] rounded" /><span class="line-through text-zinc-500">$1</span></div>'
  );
  html = html.replace(
    /^- \[ \] (.*$)/gim,
    '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="accent-[#9D6FFF] rounded" /><span class="text-zinc-300">$1</span></div>'
  );

  // ── Markdown bullet list ──
  html = html.replace(/^- (.*$)/gim, '<li style="list-style-type: disc; margin-left: 1.25rem; color: #d4d4d8;">$1</li>');

  // ── Markdown numbered list ──
  html = html.replace(/^\d+\. (.*$)/gim, '<li style="list-style-type: decimal; margin-left: 1.25rem; color: #d4d4d8;">$1</li>');

  return html;
}


export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Add details, instructions, or CTA specs...",
  minHeight = "140px",
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(defaultActiveFormats);

  // Sync external value to innerHTML when value changes from outside
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      if (!value && (!editorRef.current.innerHTML || editorRef.current.innerHTML === "<br>")) {
        return;
      }
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const updateActiveFormats = () => {
    if (typeof document === "undefined" || !editorRef.current) return;

    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !editorRef.current.contains(sel.anchorNode)) {
      return;
    }

    try {
      const isBold = document.queryCommandState("bold");
      const isItalic = document.queryCommandState("italic");
      const isStrike = document.queryCommandState("strikeThrough");
      const block = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      let isHeading = block.includes("h2");
      let isSubheading = block.includes("h3");
      let isQuote = block.includes("blockquote");
      const isBulletList = document.queryCommandState("insertUnorderedList");
      const isNumberedList = document.queryCommandState("insertOrderedList");
      const isAlignLeft = document.queryCommandState("justifyLeft");
      const isAlignCenter = document.queryCommandState("justifyCenter");
      const isAlignRight = document.queryCommandState("justifyRight");
      const isAlignJustify = document.queryCommandState("justifyFull");

      // Traverse parent hierarchy to detect custom wrapper elements (code, a, blockquote, h2, h3)
      let node: Node | null = sel.anchorNode;
      let isCode = false;
      let isLink = false;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();
          if (tag === "code" || tag === "pre") isCode = true;
          if (tag === "a") isLink = true;
          if (tag === "h2") isHeading = true;
          if (tag === "h3") isSubheading = true;
          if (tag === "blockquote") isQuote = true;
        }
        node = node.parentNode;
      }

      setActiveFormats({
        bold: isBold,
        italic: isItalic,
        strike: isStrike,
        heading: isHeading,
        subheading: isSubheading,
        link: isLink,
        quote: isQuote,
        code: isCode,
        alignLeft: isAlignLeft,
        alignCenter: isAlignCenter,
        alignRight: isAlignRight,
        alignJustify: isAlignJustify,
        bulletList: isBulletList,
        numberedList: isNumberedList,
      });
    } catch {
      // queryCommandState may throw in edge browser states
    }
  };

  // Listen to selection changes to track active formats live as cursor moves
  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveFormats();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (html === "<br>" || html.trim() === "") {
      onChange("");
    } else {
      onChange(html);
    }
    updateActiveFormats();
  };

  // Execute formatting command without losing selection (onMouseDown e.preventDefault is used)
  const exec = (command: string, valueArgument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, valueArgument);
    handleInput();
    setTimeout(updateActiveFormats, 0);
  };

  const handleLink = () => {
    const url = window.prompt("Enter URL:", "https://");
    if (url) {
      exec("createLink", url);
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const res = await uploadImageToCloudinary(file, "editor_images");
    setIsUploadingImage(false);
    if (res.url) {
      exec("insertImage", res.url);
    } else {
      const url = window.prompt(
        "Upload failed (" + (res.error || "error") + "). Enter image URL instead:",
        "https://"
      );
      if (url) exec("insertImage", url);
    }
    e.target.value = "";
  };

  const handleCode = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText.includes("\n") || selectedText.length > 30) {
      const pre = document.createElement("pre");
      pre.className =
        "bg-white/5 p-3 rounded-xl my-2 font-mono text-emerald-400 border border-white/10 overflow-x-auto text-xs";
      const code = document.createElement("code");
      code.textContent = selectedText || "console.log('code');";
      pre.appendChild(code);
      range.deleteContents();
      range.insertNode(pre);
    } else {
      const code = document.createElement("code");
      code.className =
        "bg-white/10 px-1.5 py-0.5 rounded font-mono text-emerald-400 text-xs";
      code.textContent = selectedText || "code";
      range.deleteContents();
      range.insertNode(code);
    }
    handleInput();
    setTimeout(updateActiveFormats, 0);
  };

  const handleTaskList = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const taskContainer = document.createElement("div");
    taskContainer.className = "flex items-center gap-2 my-1";
    taskContainer.innerHTML =
      '<input type="checkbox" class="accent-[#9D6FFF] rounded cursor-pointer" /><span>Task item</span>';
    range.deleteContents();
    range.insertNode(taskContainer);
    handleInput();
    setTimeout(updateActiveFormats, 0);
  };

  // Button styling helper that shows active vs inactive visual feedback
  const btnCls = (isActive: boolean) =>
    `p-1.5 rounded-lg transition-all cursor-pointer border ${
      isActive
        ? "bg-[#9D6FFF]/20 text-[#9D6FFF] border-[#9D6FFF]/35 shadow-sm"
        : "text-zinc-400 hover:text-white hover:bg-white/10 border-transparent"
    }`;

  return (
    <div
      className={`flex flex-col w-full rounded-xl border border-white/10 bg-[#0d0d0f] overflow-hidden transition-colors focus-within:border-black ${className}`}
    >
      {/* ── WYSIWYG Formatting Toolbar with Active Menu Highlights ── */}
      <div className="shrink-0 flex items-center px-2.5 py-1.5 bg-[#17171a] border-b border-white/10 gap-0.5 select-none flex-wrap">
        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("bold");
          }}
          title="Bold (Ctrl+B)"
          className={btnCls(activeFormats.bold)}
        >
          <Bold size={14} strokeWidth={2.5} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("italic");
          }}
          title="Italic (Ctrl+I)"
          className={btnCls(activeFormats.italic)}
        >
          <Italic size={14} strokeWidth={2.5} />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("strikeThrough");
          }}
          title="Strikethrough"
          className={btnCls(activeFormats.strike)}
        >
          <Strikethrough size={14} strokeWidth={2.5} />
        </button>

        {/* Heading */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("formatBlock", "<h2>");
          }}
          title="Heading (H2)"
          className={btnCls(activeFormats.heading)}
        >
          <Heading size={14} strokeWidth={2.5} />
        </button>

        {/* Subheading */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("formatBlock", "<h3>");
          }}
          title="Subheading (H3)"
          className={btnCls(activeFormats.subheading)}
        >
          <Type size={14} strokeWidth={2.5} />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* Link */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleLink();
          }}
          title="Insert Link"
          className={btnCls(activeFormats.link)}
        >
          <LinkIcon size={14} strokeWidth={2.2} />
        </button>

        {/* Quote */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("formatBlock", "<blockquote>");
          }}
          title="Quote"
          className={btnCls(activeFormats.quote)}
        >
          <Quote size={14} strokeWidth={2.2} />
        </button>

        {/* Code */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCode();
          }}
          title="Code block or inline code"
          className={btnCls(activeFormats.code)}
        >
          <Code size={14} strokeWidth={2.2} />
        </button>

        {/* Image */}
        <button
          type="button"
          disabled={isUploadingImage}
          onMouseDown={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
          title="Upload image"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent transition-all cursor-pointer disabled:opacity-50"
        >
          {isUploadingImage ? (
            <Loader2 size={14} className="animate-spin text-[#9D6FFF]" />
          ) : (
            <ImageIcon size={14} strokeWidth={2.2} />
          )}
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* Align Left */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("justifyLeft");
          }}
          title="Align Left"
          className={btnCls(activeFormats.alignLeft)}
        >
          <AlignLeft size={14} strokeWidth={2.2} />
        </button>

        {/* Align Center */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("justifyCenter");
          }}
          title="Align Center"
          className={btnCls(activeFormats.alignCenter)}
        >
          <AlignCenter size={14} strokeWidth={2.2} />
        </button>

        {/* Align Right */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("justifyRight");
          }}
          title="Align Right"
          className={btnCls(activeFormats.alignRight)}
        >
          <AlignRight size={14} strokeWidth={2.2} />
        </button>

        {/* Align Justify */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("justifyFull");
          }}
          title="Align Justify"
          className={btnCls(activeFormats.alignJustify)}
        >
          <AlignJustify size={14} strokeWidth={2.2} />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertUnorderedList");
          }}
          title="Bullet List"
          className={btnCls(activeFormats.bulletList)}
        >
          <List size={14} strokeWidth={2.2} />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertOrderedList");
          }}
          title="Numbered List"
          className={btnCls(activeFormats.numberedList)}
        >
          <ListOrdered size={14} strokeWidth={2.2} />
        </button>

        {/* Task List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleTaskList();
          }}
          title="Task Checklist"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent transition-all cursor-pointer"
        >
          <ListTodo size={14} strokeWidth={2.2} />
        </button>
      </div>

      {/* ── In-Place Single WYSIWYG Editor Surface ──────────────── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onFocus={updateActiveFormats}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="w-full bg-black px-4 py-3 text-xs sm:text-sm text-zinc-100 outline-none leading-relaxed transition-colors border-0 select-text overflow-y-auto focus:outline-none focus:ring-0 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-zinc-600 [&:empty]:before:pointer-events-none [&_strong]:font-bold [&_strong]:text-white [&_b]:font-bold [&_b]:text-white [&_em]:italic [&_em]:text-zinc-300 [&_i]:italic [&_i]:text-zinc-300 [&_del]:line-through [&_del]:text-zinc-500 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:my-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:my-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#9D6FFF] [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:text-zinc-400 [&_blockquote]:italic [&_blockquote]:bg-white/[0.02] [&_blockquote]:rounded-r [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-emerald-400 [&_code]:text-[11px] [&_pre]:bg-white/5 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:my-2 [&_pre]:font-mono [&_pre]:text-emerald-400 [&_pre]:border [&_pre]:border-white/10 [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1 [&_li]:text-zinc-300 [&_a]:text-[#6397FF] [&_a]:underline [&_img]:max-h-56 [&_img]:rounded-xl [&_img]:my-2 [&_img]:border [&_img]:border-white/10 [&_img]:object-cover"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
    </div>
  );
}
