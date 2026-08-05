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
  Eye,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Boxes,
} from "lucide-react";
import { createRayTracer, type RayTracerApi } from "./lib/raytracer";
import { LearningPanel } from "./components/LearningPanel";

type SceneId = 0 | 1 | 2 | 3 | 4;

const SCENES: { id: SceneId; name: string; desc: string }[] = [
  { id: 0, name: "经典三球", desc: "漫反射 · 玻璃 · 金属" },
  { id: 1, name: "玻璃气泡", desc: "空心介质 + 聚焦" },
  { id: 2, name: "金属走廊", desc: "高光金属阵列" },
  { id: 3, name: "康奈尔箱", desc: "面光源 + 红绿墙间接光" },
  { id: 4, name: "随机多球", desc: "BVH 压力测试 · 二百+ 球" },
];

const DEBUG_MODES = [
  { id: 0, name: "美观（路径追踪）" },
  { id: 1, name: "法线" },
  { id: 2, name: "深度" },
  { id: 3, name: "发光体" },
] as const;

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

function sceneCameraDefaults(sceneId: SceneId) {
  if (sceneId === 4) {
    return { yaw: 0.25, pitch: 0.12, radius: 13, vfov: 20, defocus: 0.6, maxDepth: 12 };
  }
  if (sceneId === 3) {
    return { yaw: 0, pitch: 0.02, radius: 3.2, vfov: 40, defocus: 0, maxDepth: 50 };
  }
  if (sceneId === 1) {
    return { yaw: 0.2, pitch: 0.12, radius: 4.5, vfov: 35, defocus: 0.4, maxDepth: 40 };
  }
  if (sceneId === 2) {
    return { yaw: 0, pitch: 0.2, radius: 7, vfov: 28, defocus: 0, maxDepth: 30 };
  }
  return { yaw: 0.35, pitch: 0.18, radius: 6.2, vfov: 30, defocus: 0.25, maxDepth: 24 };
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
  const [sceneId, setSceneId] = useState<SceneId>(4);
  const [debugMode, setDebugMode] = useState(0);
  const [useBvh, setUseBvh] = useState(true);
  const [primCount, setPrimCount] = useState(0);
  const [resIdx, setResIdx] = useState(0);
  const defaults = sceneCameraDefaults(4);
  const [maxDepth, setMaxDepth] = useState(defaults.maxDepth);
  const [spp, setSpp] = useState(1);
  const [vfov, setVfov] = useState(defaults.vfov);
  const [defocus, setDefocus] = useState(defaults.defocus);
  const [yaw, setYaw] = useState(defaults.yaw);
  const [pitch, setPitch] = useState(defaults.pitch);
  const [radius, setRadius] = useState(defaults.radius);
  const [showLearn, setShowLearn] = useState(true);
  const [passMs, setPassMs] = useState(0);

  const target = useMemo<[number, number, number]>(
    () => (sceneId === 4 ? [0, 0, 0] : [0, 1, 0]),
    [sceneId],
  );
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
    setPrimCount(api.primitiveCount());
  }, []);

  const applyCamera = useCallback(
    (api: RayTracerApi) => {
      const p = orbitPosition(yaw, pitch, radius, target);
      api.setCamera(p.x, p.y, p.z, target[0], target[1], target[2], vfov, defocus, radius);
    },
    [yaw, pitch, radius, target, vfov, defocus],
  );

  const selectScene = (id: SceneId) => {
    setSceneId(id);
    const d = sceneCameraDefaults(id);
    setYaw(d.yaw);
    setPitch(d.pitch);
    setRadius(d.radius);
    setVfov(d.vfov);
    setDefocus(d.defocus);
    setMaxDepth(d.maxDepth);
  };

  const reinit = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    // 先设 BVH，再 init（init 内 rebuild 会读 use_bvh）
    api.setUseBvh(useBvh);
    api.init(res.w, res.h, sceneId);
    api.setUseBvh(useBvh);
    api.setMaxDepth(maxDepth);
    api.setDebugMode(debugMode);
    applyCamera(api);
    paint();
  }, [res.w, res.h, sceneId, maxDepth, debugMode, useBvh, applyCamera, paint]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const api = await createRayTracer();
        if (cancelled) return;
        apiRef.current = api;
        api.setUseBvh(useBvh);
        api.init(res.w, res.h, sceneId);
        api.setUseBvh(useBvh);
        api.setMaxDepth(maxDepth);
        api.setDebugMode(debugMode);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    void reinit();
  }, [resIdx, sceneId, maxDepth, debugMode, useBvh, status, reinit]);

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

  const radiusMax = sceneId === 3 ? 6 : sceneId === 4 ? 20 : 14;
  const radiusMin = sceneId === 3 ? 1.8 : sceneId === 4 ? 6 : 3;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-5 md:px-6 md:py-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">
              cpp-002 · C++ / WASM · BVH
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">光线追踪学习器</h1>
            <p className="max-w-xl text-sm text-fg-muted md:text-base">
              层次包围盒（BVH）加速求交。切到「随机多球」后开关 BVH，对比每帧毫秒数。
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
                      `${res.w}×${res.h} · ${samples} spp · ${passMs.toFixed(0)} ms · ${primCount} 体 · BVH ${useBvh ? "开" : "关"}`}
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
                多球场景关闭 BVH 会明显变慢（暴力 O(n) vs 约 O(log n)）。
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
                    onClick={() => selectScene(s.id)}
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

            <Panel title="加速结构" icon={<Boxes className="size-4" />}>
              <button
                type="button"
                data-testid="toggle-bvh"
                onClick={() => setUseBvh((v) => !v)}
                className={`flex h-11 w-full items-center justify-between rounded-[var(--radius-md)] border px-3 text-sm transition ${
                  useBvh
                    ? "border-border-strong bg-bg-subtle"
                    : "border-border bg-bg text-fg-muted"
                }`}
              >
                <span>BVH 层次包围盒</span>
                <span className="font-mono text-xs">{useBvh ? "ON" : "OFF"}</span>
              </button>
              <p className="text-xs text-fg-subtle">
                在「随机多球」对比状态栏 ms。图元 {primCount || "—"}。
              </p>
            </Panel>

            <Panel title="调试视图" icon={<Eye className="size-4" />}>
              <div className="grid grid-cols-2 gap-2">
                {DEBUG_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDebugMode(m.id)}
                    className={`rounded-[var(--radius-sm)] border px-2 py-2 text-left text-xs transition ${
                      debugMode === m.id
                        ? "border-border-strong bg-bg-subtle font-medium"
                        : "border-border bg-bg text-fg-muted hover:text-fg"
                    }`}
                  >
                    {m.name}
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
                max={80}
                step={1}
                value={maxDepth}
                onChange={setMaxDepth}
              />
            </Panel>

            <Panel title="相机" icon={<Camera className="size-4" />}>
              <Slider
                label={`视野 FOV = ${vfov.toFixed(0)}°`}
                min={15}
                max={70}
                step={1}
                value={vfov}
                onChange={setVfov}
              />
              <Slider
                label={`距离 = ${radius.toFixed(1)}`}
                min={radiusMin}
                max={radiusMax}
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
