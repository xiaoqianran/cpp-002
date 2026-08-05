import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  Aperture,
  BookOpen,
  Camera,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { createRayTracer, type RayTracerApi } from "./lib/raytracer";
import { LearningPanel } from "./components/LearningPanel";

type SceneId = 0 | 1 | 2;

const SCENES: { id: SceneId; name: string; desc: string }[] = [
  { id: 0, name: "经典三球", desc: "漫反射 · 玻璃 · 金属" },
  { id: 1, name: "玻璃气泡", desc: "空心介质 + 聚焦" },
  { id: 2, name: "金属走廊", desc: "高光金属阵列" },
];

const RES_PRESETS = [
  { label: "快速 320×180", w: 320, h: 180 },
  { label: "均衡 480×270", w: 480, h: 270 },
  { label: "清晰 640×360", w: 640, h: 360 },
] as const;

function orbitPosition(
  yaw: number,
  pitch: number,
  radius: number,
  target: [number, number, number],
) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return {
    x: target[0] + radius * cp * sy,
    y: target[1] + radius * sp,
    z: target[2] + radius * cp * cy,
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<RayTracerApi | null>(null);
  const rafRef = useRef<number>(0);
  const dragRef = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [samples, setSamples] = useState(0);
  const [sceneId, setSceneId] = useState<SceneId>(0);
  const [resIdx, setResIdx] = useState(0);
  const [maxDepth, setMaxDepth] = useState(24);
  const [spp, setSpp] = useState(1);
  const [vfov, setVfov] = useState(30);
  const [defocus, setDefocus] = useState(0.25);
  const [yaw, setYaw] = useState(0.35);
  const [pitch, setPitch] = useState(0.18);
  const [radius, setRadius] = useState(6.2);
  const [showLearn, setShowLearn] = useState(true);
  const [passMs, setPassMs] = useState(0);

  const target = useMemo<[number, number, number]>(() => [0, 1, 0], []);
  const res = RES_PRESETS[resIdx]!;

  const paint = useCallback(() => {
    const api = apiRef.current;
    const canvas = canvasRef.current;
    if (!api || !canvas) return;
    const w = api.width();
    const h = api.height();
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rgba = api.rgba();
    const img = new ImageData(new Uint8ClampedArray(rgba), w, h);
    ctx.putImageData(img, 0, 0);
    setSamples(api.samples());
  }, []);

  const applyCamera = useCallback(
    (api: RayTracerApi) => {
      const p = orbitPosition(yaw, pitch, radius, target);
      api.setCamera(p.x, p.y, p.z, target[0], target[1], target[2], vfov, defocus, radius);
    },
    [yaw, pitch, radius, target, vfov, defocus],
  );

  const reinit = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    api.init(res.w, res.h, sceneId);
    api.setMaxDepth(maxDepth);
    applyCamera(api);
    paint();
  }, [res.w, res.h, sceneId, maxDepth, applyCamera, paint]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const api = await createRayTracer();
        if (cancelled) return;
        apiRef.current = api;
        api.init(res.w, res.h, sceneId);
        api.setMaxDepth(maxDepth);
        applyCamera(api);
        setStatus("ready");
        paint();
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
    // 仅首次加载模块
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    void reinit();
  }, [resIdx, sceneId, maxDepth, status, reinit]);

  useEffect(() => {
    if (status !== "ready" || !apiRef.current) return;
    applyCamera(apiRef.current);
    paint();
  }, [yaw, pitch, radius, vfov, defocus, status, applyCamera, paint]);

  useEffect(() => {
    if (status !== "ready" || !running) return;
    let alive = true;

    const loop = () => {
      if (!alive || !apiRef.current) return;
      const t0 = performance.now();
      apiRef.current.renderPass(spp);
      setPassMs(performance.now() - t0);
      paint();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [status, running, spp, paint]);

  const onPointerDown = (e: ReactPointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, yaw, pitch };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    setYaw(d.yaw + dx * 0.005);
    setPitch(Math.max(-0.35, Math.min(0.75, d.pitch + dy * 0.004)));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-5 md:px-6 md:py-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">
              cpp-002 · C++ / WASM
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">光线追踪学习器</h1>
            <p className="max-w-xl text-sm text-fg-muted md:text-base">
              核心路径追踪用 C++ 实现，经 Emscripten 编译为 WASM 在浏览器渐进渲染。拖动画布可环绕相机。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowLearn((v) => !v)}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-4 text-sm font-medium text-fg transition hover:border-border-strong"
            >
              <BookOpen className="size-4" />
              {showLearn ? "隐藏讲解" : "显示讲解"}
            </button>
            <button
              type="button"
              disabled={status !== "ready"}
              onClick={() => setRunning((v) => !v)}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 text-sm font-semibold text-accent-fg transition active:scale-[0.98]"
            >
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {running ? "暂停采样" : "继续采样"}
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-3">
            <div
              className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-bg-elevated"
              style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-fg-muted">
                  <Sparkles className="size-4 text-fg-subtle" />
                  <span className="font-mono tabular-nums">
                    {status === "loading" && "加载 WASM…"}
                    {status === "error" && "加载失败"}
                    {status === "ready" &&
                      `${res.w}×${res.h} · ${samples} spp · ${passMs.toFixed(0)} ms/pass`}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={status !== "ready"}
                  onClick={() => {
                    apiRef.current?.reset();
                    paint();
                    setSamples(0);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium text-fg-muted hover:text-fg"
                >
                  <RotateCcw className="size-3.5" />
                  清空累加
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                {status === "error" ? (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-fg-muted">
                    {error}
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="h-full w-full cursor-grab touch-none object-contain active:cursor-grabbing"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  />
                )}
                {status === "loading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-bg/80 text-sm text-fg-muted">
                    正在初始化 C++ 渲染器…
                  </div>
                )}
              </div>
              <p className="border-t border-border px-4 py-2 text-xs text-fg-subtle">
                拖拽旋转 · 用右侧「距离」拉近/推远 · 采样越多噪点越少
              </p>
            </div>

            {showLearn && (
              <div className="lg:hidden">
                <LearningPanel />
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <Panel title="场景" icon={<Layers className="size-4" />}>
              <div className="grid gap-2">
                {SCENES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSceneId(s.id)}
                    className={`rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition ${
                      sceneId === s.id
                        ? "border-border-strong bg-bg-subtle"
                        : "border-border bg-bg hover:border-border-strong"
                    }`}
                  >
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-fg-subtle">{s.desc}</div>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="分辨率 / 质量" icon={<Aperture className="size-4" />}>
              <label className="block space-y-1.5">
                <span className="text-xs text-fg-subtle">预设</span>
                <select
                  value={resIdx}
                  onChange={(e) => setResIdx(Number(e.target.value))}
                  className="h-11 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm"
                >
                  {RES_PRESETS.map((r, i) => (
                    <option key={r.label} value={i}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <Slider
                label={`每帧样本 spp = ${spp}`}
                min={1}
                max={4}
                step={1}
                value={spp}
                onChange={setSpp}
              />
              <Slider
                label={`反弹深度 = ${maxDepth}`}
                min={4}
                max={50}
                step={1}
                value={maxDepth}
                onChange={setMaxDepth}
              />
            </Panel>

            <Panel title="相机" icon={<Camera className="size-4" />}>
              <Slider
                label={`视野 FOV = ${vfov.toFixed(0)}°`}
                min={15}
                max={60}
                step={1}
                value={vfov}
                onChange={setVfov}
              />
              <Slider
                label={`距离 = ${radius.toFixed(1)}`}
                min={3}
                max={14}
                step={0.1}
                value={radius}
                onChange={setRadius}
              />
              <Slider
                label={`景深光圈 = ${defocus.toFixed(2)}`}
                min={0}
                max={1.2}
                step={0.05}
                value={defocus}
                onChange={setDefocus}
              />
            </Panel>

            {showLearn && (
              <div className="hidden lg:block">
                <LearningPanel compact />
              </div>
            )}
          </aside>
        </div>

        {showLearn && (
          <div className="hidden lg:block">
            <LearningPanel full />
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({
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

function Slider({
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
