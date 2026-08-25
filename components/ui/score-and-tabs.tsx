"use client";

import { cn } from "@/lib/utils";
import { scoreLabel } from "@/lib/utils";

export function ScoreRing({ score }: { score: number | null | undefined }) {
  const value = score ?? 0;
  const label = scoreLabel(score);
  const color =
    value >= 80 ? "#0F766E" : value >= 60 ? "#B45309" : value >= 40 ? "#64748B" : "#94A3B8";

  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-14 w-14 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${value * 3.6}deg, #E7E2D9 0deg)`,
        }}
        aria-label={`Opportunity score ${value} out of 100`}
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-semibold text-ink">
          {score ?? "\u2014"}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">
          {score != null ? `${score} / 100` : "Not scored"}
        </p>
        <p className="text-xs text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-paper-muted p-1" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
            value === tab.id ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
