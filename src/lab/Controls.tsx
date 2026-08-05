import { Aperture, Boxes, Camera, Eye, Layers } from "lucide-react";
import {
  DEBUG_MODES,
  RES_PRESETS,
  SCENES,
  radiusRange,
  selectScene,
  type EngineConfig,
  type SceneId,
} from "../engine/types";
import { LearningPanel } from "../components/LearningPanel";
import { Panel, Slider, Toggle } from "./ui";

type Props = {
  cfg: EngineConfig;
  setCfg: (fn: (c: EngineConfig) => EngineConfig) => void;
  lightCount: number;
  primCount: number;
  showLearn: boolean;
  onOpenCourse: () => void;
};

export function Controls({
  cfg,
  setCfg,
  lightCount,
  primCount,
  showLearn,
  onOpenCourse,
}: Props) {
  const rr = radiusRange(cfg.sceneId);
  const patch = (p: Partial<EngineConfig>) => setCfg((c) => ({ ...c, ...p }));

  return (
    <aside className="space-y-4">
      <Panel title="场景" icon={<Layers className="size-4" />}>
        <div className="grid gap-2">
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCfg((c) => selectScene(c, s.id as SceneId))}
              className={`rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition ${
                cfg.sceneId === s.id
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

      <Panel title="加速 / 采样" icon={<Boxes className="size-4" />}>
        <Toggle
          label="BVH 层次包围盒"
          on={cfg.bvh}
          testId="toggle-bvh"
          onToggle={() => patch({ bvh: !cfg.bvh })}
        />
        <Toggle
          label="NEE 面光采样"
          on={cfg.nee}
          testId="toggle-nee"
          onToggle={() => patch({ nee: !cfg.nee })}
        />
        <Toggle
          label="MIS 多重重要性"
          on={cfg.mis}
          testId="toggle-mis"
          onToggle={() => patch({ mis: !cfg.mis })}
        />
        <Toggle
          label="俄罗斯轮盘"
          on={cfg.rr}
          testId="toggle-rr"
          onToggle={() => patch({ rr: !cfg.rr })}
        />
        <p className="text-xs text-fg-subtle">
          图元 {primCount || "—"} · 灯 {lightCount || "—"}
        </p>
      </Panel>

      <Panel title="调试视图" icon={<Eye className="size-4" />}>
        <div className="grid grid-cols-2 gap-2">
          {DEBUG_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => patch({ debugMode: m.id })}
              className={`rounded-[var(--radius-sm)] border px-2 py-2 text-left text-xs transition ${
                cfg.debugMode === m.id
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
            value={cfg.resIdx}
            onChange={(e) => patch({ resIdx: Number(e.target.value) })}
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
          label={`每帧样本 spp = ${cfg.spp}`}
          min={1}
          max={4}
          step={1}
          value={cfg.spp}
          onChange={(spp) => patch({ spp })}
        />
        <Slider
          label={`反弹深度 = ${cfg.maxDepth}`}
          min={4}
          max={80}
          step={1}
          value={cfg.maxDepth}
          onChange={(maxDepth) => patch({ maxDepth })}
        />
      </Panel>

      <Panel title="相机" icon={<Camera className="size-4" />}>
        <Slider
          label={`视野 FOV = ${cfg.vfov.toFixed(0)}°`}
          min={15}
          max={70}
          step={1}
          value={cfg.vfov}
          onChange={(vfov) => patch({ vfov })}
        />
        <Slider
          label={`距离 = ${cfg.radius.toFixed(1)}`}
          min={rr.min}
          max={rr.max}
          step={0.1}
          value={cfg.radius}
          onChange={(radius) => patch({ radius })}
        />
        <Slider
          label={`景深光圈 = ${cfg.defocus.toFixed(2)}`}
          min={0}
          max={1.2}
          step={0.05}
          value={cfg.defocus}
          onChange={(defocus) => patch({ defocus })}
        />
      </Panel>

      {showLearn && (
        <div className="hidden lg:block">
          <LearningPanel onOpenCourse={onOpenCourse} />
        </div>
      )}
    </aside>
  );
}
