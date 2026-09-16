"use client";

import React from "react";
import { ArrowRight, CheckCircle2, Clock, PlayCircle, Eye } from "lucide-react";

export default function WorkflowView() {
  const steps = [
    {
      id: "todo",
      title: "To do",
      count: 12,
      icon: Clock,
      color: "text-[#6397FF]",
      bgColor: "bg-[#6397FF]/10",
      description: "Initial task backlog awaiting setup and design specs.",
    },
    {
      id: "in_progress",
      title: "In progress",
      count: 7,
      icon: PlayCircle,
      color: "text-[#9D6FFF]",
      bgColor: "bg-[#9D6FFF]/10",
      description: "Active development, frontend layout, and API integration.",
    },
    {
      id: "under_review",
      title: "Under review",
      count: 9,
      icon: Eye,
      color: "text-[#FF6B6B]",
      bgColor: "bg-[#FF6B6B]/10",
      description: "Peer code review, QA testing, and visual audit.",
    },
    {
      id: "ready",
      title: "Ready",
      count: 9,
      icon: CheckCircle2,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      description: "Approved for staging deployment and production release.",
    },
    {
      id: "completed",
      title: "Completed",
      count: 4,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      description: "Successfully shipped to production and closed.",
    },
  ];

  return (
    <div className="w-full bg-[#161617] border border-white/10 p-8 rounded-2xl shadow-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white">Pipeline Workflow Order</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Sequential stage ordering for all project tasks from backlog to release.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="relative p-6 bg-[#1b1b1e] border border-white/10 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${step.bgColor} ${step.color}`}>
                    <Icon size={22} />
                  </div>
                  <span className="px-2.5 py-1 bg-white/10 text-white rounded-full text-xs font-bold">
                    {step.count} Tasks
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-zinc-800 border border-white/20 items-center justify-center text-zinc-300">
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
