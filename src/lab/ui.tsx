import type { ReactNode } from "react";

export function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <span className="text-fg-subtle">{icon}</span>
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-fg-subtle">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}

export function Toggle({
  label,
  on,
  testId,
  onToggle,
}: {
  label: string;
  on: boolean;
  testId?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onToggle}
      className={`flex h-11 w-full items-center justify-between rounded-[var(--radius-md)] border px-3 text-sm transition ${
        on ? "border-border-strong bg-bg-subtle" : "border-border bg-bg text-fg-muted"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono text-xs">{on ? "ON" : "OFF"}</span>
    </button>
  );
}
