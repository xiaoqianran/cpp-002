import { GraduationCap } from "lucide-react";

/** 实验台侧栏：课程入口摘要 */
export function LearningPanel({ onOpenCourse }: { onOpenCourse?: () => void }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <GraduationCap className="size-4 text-accent" />
        完整课程
      </div>
      <p className="mb-3 text-xs leading-relaxed text-fg-muted">
        10 章 · 对照 GAMES101 / Shirley / PBRT：从射线求交到 NEE·MIS·SAH-BVH，含公式、图解、自测与「打开本课实验」。
      </p>
      <ul className="mb-3 space-y-1 text-[11px] text-fg-subtle">
        <li>· 导论与渲染方程</li>
        <li>· 几何 · 相机 · 材质 · 路径追踪</li>
        <li>· NEE / MIS / RR · BVH · 工程调试</li>
      </ul>
      {onOpenCourse && (
        <button
          type="button"
          onClick={onOpenCourse}
          className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-md)] bg-accent text-sm font-semibold text-accent-fg"
        >
          进入完整课程
        </button>
      )}
    </div>
  );
}
