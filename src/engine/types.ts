/** 前端唯一配置源 — C++ 只是这份配置的投影 */

export type SceneId = 0 | 1 | 2 | 3 | 4;
export type DebugMode = 0 | 1 | 2 | 3;

export type EngineConfig = {
  sceneId: SceneId;
  resIdx: number;
  spp: number;
  maxDepth: number;
  debugMode: DebugMode;
  bvh: boolean;
  nee: boolean;
  mis: boolean;
  rr: boolean;
  vfov: number;
  defocus: number;
  yaw: number;
  pitch: number;
  radius: number;
};

/** 课程「打开本课实验」只打补丁 */
export type ConfigPatch = Partial<EngineConfig> & { label?: string };

export const SCENES: { id: SceneId; name: string; desc: string }[] = [
  { id: 0, name: "经典三球", desc: "漫反射 · 玻璃 · 金属" },
  { id: 1, name: "玻璃气泡", desc: "空心介质 + 聚焦" },
  { id: 2, name: "金属走廊", desc: "高光金属阵列" },
  { id: 3, name: "康奈尔箱", desc: "面光源 + 红绿墙间接光" },
  { id: 4, name: "随机多球", desc: "BVH 压力测试 · 二百+ 球" },
];

export const DEBUG_MODES = [
  { id: 0 as const, name: "美观（路径追踪）" },
  { id: 1 as const, name: "法线" },
  { id: 2 as const, name: "深度" },
  { id: 3 as const, name: "发光体" },
];

export const RES_PRESETS = [
  { label: "快速 320×180", w: 320, h: 180 },
  { label: "均衡 480×270", w: 480, h: 270 },
  { label: "清晰 640×360", w: 640, h: 360 },
] as const;

export const ORBIT_YAW_SENS = 0.005;
export const ORBIT_PITCH_SENS = 0.004;

/** 场景默认（仅前端一份，不再在 C++ 里抢控制权） */
export function sceneDefaults(sceneId: SceneId): Pick<
  EngineConfig,
  "yaw" | "pitch" | "radius" | "vfov" | "defocus" | "maxDepth"
> {
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

export function defaultConfig(): EngineConfig {
  const sceneId: SceneId = 3;
  return {
    sceneId,
    resIdx: 0,
    spp: 1,
    debugMode: 0,
    bvh: true,
    nee: true,
    mis: true,
    rr: true,
    ...sceneDefaults(sceneId),
  };
}

export function selectScene(cfg: EngineConfig, sceneId: SceneId): EngineConfig {
  return { ...cfg, sceneId, ...sceneDefaults(sceneId) };
}

/** 课程 action → Config 补丁（兼容旧字段名） */
export function lessonToPatch(a: {
  sceneId?: SceneId;
  debugMode?: DebugMode;
  useNee?: boolean;
  useMis?: boolean;
  useBvh?: boolean;
  useRr?: boolean;
  maxDepth?: number;
}): ConfigPatch {
  const p: ConfigPatch = {};
  if (a.sceneId !== undefined) {
    Object.assign(p, sceneDefaults(a.sceneId), { sceneId: a.sceneId });
  }
  if (a.debugMode !== undefined) p.debugMode = a.debugMode;
  if (a.useNee !== undefined) p.nee = a.useNee;
  if (a.useMis !== undefined) p.mis = a.useMis;
  if (a.useBvh !== undefined) p.bvh = a.useBvh;
  if (a.useRr !== undefined) p.rr = a.useRr;
  if (a.maxDepth !== undefined) p.maxDepth = a.maxDepth;
  return p;
}

export function applyPatch(cfg: EngineConfig, patch: ConfigPatch): EngineConfig {
  const { label: _l, ...rest } = patch;
  return { ...cfg, ...rest };
}

export function orbitPosition(
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

export function lookTarget(sceneId: SceneId): [number, number, number] {
  return sceneId === 4 ? [0, 0, 0] : [0, 1, 0];
}

export function radiusRange(sceneId: SceneId) {
  if (sceneId === 3) return { min: 1.8, max: 6 };
  if (sceneId === 4) return { min: 6, max: 20 };
  return { min: 3, max: 14 };
}

export function statusLine(
  cfg: EngineConfig,
  samples: number,
  passMs: number,
  prims: number,
): string {
  const res = RES_PRESETS[cfg.resIdx]!;
  return `${res.w}×${res.h} · ${samples} spp · ${passMs.toFixed(0)} ms · ${prims} 体 · BVH ${cfg.bvh ? "开" : "关"} · NEE ${cfg.nee ? "开" : "关"} · MIS ${cfg.mis ? "开" : "关"} · RR ${cfg.rr ? "开" : "关"}`;
}
