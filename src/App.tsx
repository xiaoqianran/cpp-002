import { useState } from "react";
import { BookOpen, FlaskConical, GraduationCap, Pause, Play } from "lucide-react";
import { Curriculum } from "./components/Curriculum";
import { LearningPanel } from "./components/LearningPanel";
import {
  applyPatch,
  defaultConfig,
  lessonToPatch,
  type EngineConfig,
} from "./engine/types";
import { useEngine } from "./engine/useEngine";
import { Controls } from "./lab/Controls";
import { Viewport } from "./lab/Viewport";
import type { LessonAction } from "./curriculum/types";

/**
 * 壳组件：只持有 Config + 视图模式。
 * 渲染逻辑在 useEngine，控件在 lab/*，课程在 course/*。
 */
export default function App() {
  const [cfg, setCfg] = useState<EngineConfig>(defaultConfig);
  const [running, setRunning] = useState(true);
  const [viewMode, setViewMode] = useState<"lab" | "course">("lab");
  const [showLearn, setShowLearn] = useState(true);

  const { canvasRef, snap, reset } = useEngine(cfg, running);

  const applyLesson = (a: LessonAction) => {
    setCfg((c) => applyPatch(c, lessonToPatch(a)));
    setRunning(true);
    setViewMode("lab");
  };

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-5 md:px-6 md:py-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">
              cpp-002 · Config 驱动 · C++/WASM
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">光线追踪学习器</h1>
            <p className="max-w-xl text-sm text-fg-muted md:text-base">
              单一配置源同步引擎。课程与实验台共享同一 Config。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-border bg-bg-elevated p-1">
              <Tab
                active={viewMode === "lab"}
                onClick={() => setViewMode("lab")}
                icon={<FlaskConical className="size-3.5" />}
                label="实验台"
              />
              <Tab
                active={viewMode === "course"}
                onClick={() => setViewMode("course")}
                icon={<GraduationCap className="size-3.5" />}
                label="完整课程"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowLearn((v) => !v)}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-4 text-sm font-medium"
            >
              <BookOpen className="size-4" />
              {showLearn ? "隐藏摘要" : "显示摘要"}
            </button>
            <button
              type="button"
              disabled={snap.status !== "ready"}
              onClick={() => setRunning((v) => !v)}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 text-sm font-semibold text-accent-fg"
            >
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {running ? "暂停采样" : "继续采样"}
            </button>
          </div>
        </header>

        {viewMode === "course" ? (
          <div className="flex min-h-[70dvh] flex-col">
            <Curriculum onApply={applyLesson} onClose={() => setViewMode("lab")} />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="space-y-3">
              <Viewport
                canvasRef={canvasRef}
                cfg={cfg}
                snap={snap}
                onOrbit={(yaw, pitch) => setCfg((c) => ({ ...c, yaw, pitch }))}
                onReset={reset}
              />
              {showLearn && (
                <div className="lg:hidden">
                  <LearningPanel onOpenCourse={() => setViewMode("course")} />
                </div>
              )}
            </section>
            <Controls
              cfg={cfg}
              setCfg={setCfg}
              lightCount={snap.lightCount}
              primCount={snap.primCount}
              showLearn={showLearn}
              onOpenCourse={() => setViewMode("course")}
            />
          </div>
        )}

        {viewMode === "lab" && showLearn && (
          <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-4 text-sm text-fg-muted">
            <p className="font-medium text-fg">架构</p>
            <p className="mt-1 text-xs leading-relaxed">
              <code className="text-fg">EngineConfig</code> →{" "}
              <code className="text-fg">useEngine</code> → WASM。侧栏与课程只改 Config，不直接碰
              C API。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-xs font-medium transition ${
        active ? "bg-bg-subtle text-fg" : "text-fg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
