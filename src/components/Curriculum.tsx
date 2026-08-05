import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  ListTree,
} from "lucide-react";
import { CHAPTERS, findLesson } from "../curriculum/chapters";
import type { Lesson, LessonAction, LessonBlock } from "../curriculum/types";
import { MermaidBlock } from "./MermaidBlock";

const PROGRESS_KEY = "cpp002-course-progress-v1";

export type CourseApply = (action: LessonAction) => void;

export function Curriculum({
  onApply,
  onClose,
}: {
  onApply: CourseApply;
  onClose?: () => void;
}) {
  const [chapterId, setChapterId] = useState(CHAPTERS[0]!.id);
  const [lessonId, setLessonId] = useState(CHAPTERS[0]!.lessons[0]!.id);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: Record<string, boolean>) => {
    setDone(next);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const chapter = CHAPTERS.find((c) => c.id === chapterId) ?? CHAPTERS[0]!;
  const lesson = chapter.lessons.find((l) => l.id === lessonId) ?? chapter.lessons[0]!;

  const flat = useMemo(
    () => CHAPTERS.flatMap((c) => c.lessons.map((l) => ({ c, l }))),
    [],
  );
  const flatIndex = flat.findIndex((x) => x.l.id === lesson.id);
  const totalLessons = flat.length;
  const doneCount = Object.values(done).filter(Boolean).length;

  const go = (delta: number) => {
    const i = flatIndex + delta;
    if (i < 0 || i >= flat.length) return;
    const n = flat[i]!;
    setChapterId(n.c.id);
    setLessonId(n.l.id);
    setMobileNav(false);
  };

  const markDone = () => {
    persist({ ...done, [lesson.id]: true });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-bg-elevated">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-accent" />
          <div>
            <h2 className="text-sm font-semibold tracking-tight md:text-base">
              完整课程 · 路径追踪精读
            </h2>
            <p className="text-xs text-fg-subtle">
              对照 GAMES101 / Shirley / PBRT · 进度 {doneCount}/{totalLessons}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium md:hidden"
            onClick={() => setMobileNav((v) => !v)}
          >
            <ListTree className="size-3.5" />
            目录
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium text-fg-muted hover:text-fg"
            >
              返回实验台
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* 目录 */}
        <aside
          className={`${
            mobileNav ? "flex" : "hidden"
          } max-h-[40vh] w-full shrink-0 flex-col overflow-y-auto border-b border-border md:flex md:max-h-none md:w-72 md:border-r md:border-b-0`}
        >
          <div className="space-y-4 p-3">
            {CHAPTERS.map((c) => (
              <div key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setChapterId(c.id);
                    setLessonId(c.lessons[0]!.id);
                  }}
                  className={`mb-1.5 w-full rounded-[var(--radius-sm)] px-2 py-1.5 text-left ${
                    chapterId === c.id ? "bg-bg-subtle" : ""
                  }`}
                >
                  <div className="font-mono text-[10px] tracking-wider text-fg-subtle uppercase">
                    第 {c.index} 章
                  </div>
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className="text-[11px] text-fg-subtle">{c.subtitle}</div>
                </button>
                <ul className="ml-1 space-y-0.5 border-l border-border pl-2">
                  {c.lessons.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setChapterId(c.id);
                          setLessonId(l.id);
                          setMobileNav(false);
                        }}
                        className={`flex w-full items-start gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs transition ${
                          lessonId === l.id
                            ? "bg-accent/15 text-fg font-medium"
                            : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
                        }`}
                      >
                        {done[l.id] ? (
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
                        ) : (
                          <span className="mt-0.5 size-3.5 shrink-0 rounded-full border border-border" />
                        )}
                        <span>{l.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* 正文 */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-3xl space-y-5">
            <div>
              <p className="font-mono text-[11px] tracking-widest text-fg-subtle uppercase">
                第 {chapter.index} 章 · {chapter.title} · 约 {lesson.minutes} 分钟
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">{lesson.title}</h3>
              <p className="mt-2 text-sm text-fg-muted">{lesson.summary}</p>
              {lesson.refs.length > 0 && (
                <p className="mt-2 text-xs text-fg-subtle">
                  <BookMarked className="mr-1 inline size-3.5" />
                  对照：{lesson.refs.join(" · ")}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {lesson.blocks.map((b, i) => (
                <BlockView key={`${lesson.id}-${i}`} block={b} />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              {lesson.action && (
                <button
                  type="button"
                  onClick={() => {
                    onApply(lesson.action!);
                    onClose?.();
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 text-sm font-semibold text-accent-fg"
                >
                  <FlaskConical className="size-4" />
                  {lesson.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={markDone}
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-medium"
              >
                <CheckCircle2 className="size-4" />
                {done[lesson.id] ? "已标记完成" : "标记完成"}
              </button>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  disabled={flatIndex <= 0}
                  onClick={() => go(-1)}
                  className="inline-flex h-11 items-center gap-1 rounded-[var(--radius-md)] border border-border px-3 text-sm disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                  上一课
                </button>
                <button
                  type="button"
                  disabled={flatIndex >= flat.length - 1}
                  onClick={() => go(1)}
                  className="inline-flex h-11 items-center gap-1 rounded-[var(--radius-md)] border border-border px-3 text-sm disabled:opacity-40"
                >
                  下一课
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <RelatedNav
              lesson={lesson}
              onJump={(id) => {
                const f = findLesson(id);
                if (!f) return;
                setChapterId(f.chapter.id);
                setLessonId(f.lesson.id);
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function RelatedNav({ lesson, onJump }: { lesson: Lesson; onJump: (id: string) => void }) {
  // 简单：同章其他课
  const ch = CHAPTERS.find((c) => c.lessons.some((l) => l.id === lesson.id));
  if (!ch || ch.lessons.length < 2) return null;
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg p-4">
      <h4 className="mb-2 text-xs font-medium text-fg-subtle">本章其他课</h4>
      <div className="flex flex-wrap gap-2">
        {ch.lessons
          .filter((l) => l.id !== lesson.id)
          .map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onJump(l.id)}
              className="rounded-full border border-border px-3 py-1 text-xs text-fg-muted hover:border-border-strong hover:text-fg"
            >
              {l.title}
            </button>
          ))}
      </div>
    </div>
  );
}

function BlockView({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "p":
      return <p className="text-sm leading-relaxed text-fg-muted md:text-[15px]">{block.text}</p>;
    case "h":
      return <h4 className="text-sm font-semibold text-fg md:text-base">{block.text}</h4>;
    case "ul":
      return (
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg-muted">
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-fg-muted">
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ol>
      );
    case "formula":
      return (
        <div className="rounded-[var(--radius-md)] border border-border-strong/40 bg-bg px-4 py-3">
          {block.title && (
            <div className="mb-1 text-[11px] font-medium tracking-wide text-fg-subtle uppercase">
              {block.title}
            </div>
          )}
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-fg md:text-[13px]">
            {block.latex}
          </pre>
        </div>
      );
    case "code":
      return (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-bg">
          {block.title && (
            <div className="border-b border-border px-3 py-1.5 font-mono text-[11px] text-fg-subtle">
              {block.title}
            </div>
          )}
          <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-fg-muted md:text-xs">
            {block.code}
          </pre>
        </div>
      );
    case "mermaid":
      return <MermaidBlock code={block.code} title={block.title} />;
    case "callout": {
      const tone =
        block.tone === "warn"
          ? "border-amber-500/40 bg-amber-500/5"
          : block.tone === "tip"
            ? "border-accent/40 bg-accent/5"
            : "border-border bg-bg";
      const label = block.tone === "warn" ? "注意" : block.tone === "tip" ? "提示" : "说明";
      return (
        <div className={`rounded-[var(--radius-md)] border px-3 py-2.5 text-sm text-fg-muted ${tone}`}>
          <span className="mr-2 font-medium text-fg">{label}</span>
          {block.text}
        </div>
      );
    }
    case "map":
      return (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg text-xs text-fg-subtle">
              <tr>
                <th className="px-3 py-2 font-medium">源码</th>
                <th className="px-3 py-2 font-medium">职责</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r) => (
                <tr key={r.file} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs text-fg">{r.file}</td>
                  <td className="px-3 py-2 text-xs text-fg-muted">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "compare":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {[block.left, block.right].map((side) => (
            <div
              key={side.title}
              className="rounded-[var(--radius-md)] border border-border bg-bg p-3"
            >
              <div className="mb-1 text-xs font-semibold text-fg">{side.title}</div>
              <p className="text-xs leading-relaxed text-fg-muted">{side.body}</p>
            </div>
          ))}
        </div>
      );
    case "quiz":
      return <QuizBlock block={block} />;
    default:
      return null;
  }
}

function QuizBlock({
  block,
}: {
  block: Extract<LessonBlock, { type: "quiz" }>;
}) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-bg p-4">
      <div className="mb-2 text-xs font-medium text-fg-subtle">自测</div>
      <p className="mb-3 text-sm font-medium text-fg">{block.q}</p>
      <div className="space-y-2">
        {block.options.map((opt, i) => {
          const selected = pick === i;
          const correct = pick !== null && i === block.answer;
          const wrong = selected && i !== block.answer;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setPick(i)}
              className={`flex w-full rounded-[var(--radius-sm)] border px-3 py-2 text-left text-xs transition ${
                correct
                  ? "border-accent bg-accent/10 text-fg"
                  : wrong
                    ? "border-red-500/50 bg-red-500/10 text-fg"
                    : selected
                      ? "border-border-strong bg-bg-subtle"
                      : "border-border text-fg-muted hover:border-border-strong"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {pick !== null && (
        <p className="mt-3 text-xs text-fg-muted">
          {pick === block.answer ? "正确。" : "再想想。"} {block.explain}
        </p>
      )}
    </div>
  );
}
