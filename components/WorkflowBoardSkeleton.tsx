import React from "react";

export function NavbarSkeleton() {
  return (
    <header className="w-full flex items-center justify-between gap-3 py-1.5 sm:py-2.5 px-2 bg-transparent text-white border-b border-white/10">
      {/* Left Greeting & Date Skeleton */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="h-4 sm:h-5 w-36 sm:w-48 bg-white/10 rounded-md animate-pulse" />
        <div className="h-2.5 sm:h-3 w-48 sm:w-64 bg-white/5 rounded-md animate-pulse" />
      </div>

      {/* Right Controls Skeleton */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Searchbar Skeleton */}
        <div className="hidden sm:block w-36 sm:w-48 h-8 rounded-full bg-white/5 border border-white/10 animate-pulse" />
        {/* Add Stage Button Skeleton */}
        <div className="w-20 sm:w-24 h-7 sm:h-8 rounded-full bg-white/5 border border-white/10 animate-pulse" />
        {/* Add Task Button Skeleton */}
        <div className="w-20 sm:w-24 h-7 sm:h-8 rounded-full bg-[#9D6FFF]/30 animate-pulse" />
        {/* User Avatar Skeleton */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 animate-pulse" />
      </div>
    </header>
  );
}

export default function WorkflowBoardSkeleton() {
  // Pre-configured column templates for realistic variety
  const skeletonColumns = [
    { id: "col-1", cardCount: 2, hasImageOn: [1] },
    { id: "col-2", cardCount: 2, hasImageOn: [1] },
    { id: "col-3", cardCount: 2, hasImageOn: [] },
    { id: "col-4", cardCount: 1, hasImageOn: [0] },
    { id: "col-5", cardCount: 2, hasImageOn: [] },
  ];

  return (
    <div className="flex flex-row flex-nowrap items-stretch gap-3.5 sm:gap-4 w-full h-full overflow-hidden select-none pb-2.5">
      {skeletonColumns.map((col) => (
        <div
          key={col.id}
          className="flex flex-col h-full gap-3 min-w-[200px] flex-1 shrink-0 overflow-hidden rounded-2xl p-2 bg-transparent"
        >
          {/* Column Header Skeleton */}
          <div className="shrink-0 flex items-center justify-between px-1 border-b border-white/10 pb-2.5 pt-1">
            <div className="flex items-center gap-2">
              <div className="h-4 sm:h-5 w-20 sm:w-24 bg-white/10 rounded-md animate-pulse" />
              <div className="h-4 w-5 rounded-full bg-white/5 animate-pulse" />
            </div>
            <div className="h-4 w-4 rounded bg-white/5 animate-pulse" />
          </div>

          {/* Column Cards Skeleton List */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 pr-1">
            {Array.from({ length: col.cardCount }).map((_, cardIdx) => {
              const hasImage = col.hasImageOn.includes(cardIdx);

              return (
                <div
                  key={cardIdx}
                  className="bg-[#161617] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-lg animate-pulse"
                >
                  {/* Card Tags & Due Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-12 rounded-md bg-white/10" />
                      <div className="h-4 w-12 rounded-md bg-white/10" />
                    </div>
                    <div className="h-3 w-14 rounded bg-white/5" />
                  </div>

                  {/* Card Title & Desc */}
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-4/5 rounded bg-white/15" />
                    <div className="h-3 w-full rounded bg-white/5" />
                    <div className="h-3 w-3/5 rounded bg-white/5" />
                  </div>

                  {/* Preview Image Skeleton */}
                  {hasImage && (
                    <div className="w-full h-24 sm:h-28 rounded-xl bg-white/5 border border-white/5 mt-0.5" />
                  )}

                  {/* Bottom Row: Avatars & Stats */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex items-center -space-x-1.5">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 ring-2 ring-[#161617]" />
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 ring-2 ring-[#161617]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-6 rounded bg-white/5" />
                      <div className="h-3 w-6 rounded bg-white/5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FullDashboardSkeleton() {
  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden p-2 sm:p-3 font-sans select-none">
      <main className="flex-1 min-w-0 flex flex-col h-full bg-transparent px-1 sm:px-2 py-0.5 sm:py-1 overflow-hidden gap-1">
        <div className="shrink-0 z-30 py-0 bg-black/80 backdrop-blur-md">
          <NavbarSkeleton />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden pt-1">
          <WorkflowBoardSkeleton />
        </div>
      </main>
    </div>
  );
}
