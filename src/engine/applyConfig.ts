import type { EngineConfig } from "./types";
import { lookTarget, orbitPosition, RES_PRESETS } from "./types";
import type { RayTracerApi } from "./wasm";

function poseOf(cfg: EngineConfig) {
  const target = lookTarget(cfg.sceneId);
  const eye = orbitPosition(cfg.yaw, cfg.pitch, cfg.radius, target);
  return {
    lx: eye.x,
    ly: eye.y,
    lz: eye.z,
    ax: target[0],
    ay: target[1],
    az: target[2],
    vfov: cfg.vfov,
    defocus: cfg.defocus,
    focus: cfg.radius,
  };
}

/** 完整配置 → 单次 rt_apply */
export function applyConfig(api: RayTracerApi, cfg: EngineConfig) {
  const res = RES_PRESETS[cfg.resIdx] ?? RES_PRESETS[0]!;
  const pose = poseOf(cfg);
  api.apply({
    width: res.w,
    height: res.h,
    sceneId: cfg.sceneId,
    maxDepth: cfg.maxDepth,
    debugMode: cfg.debugMode,
    bvh: cfg.bvh,
    nee: cfg.nee,
    mis: cfg.mis,
    rr: cfg.rr,
    ...pose,
    bg: cfg.background,
  });
}

/** 仅相机 → rt_apply_pose */
export function applyCameraOnly(api: RayTracerApi, cfg: EngineConfig) {
  api.applyPose(poseOf(cfg));
}

export function configNeedsRebuild(a: EngineConfig, b: EngineConfig): boolean {
  return (
    a.sceneId !== b.sceneId ||
    a.resIdx !== b.resIdx ||
    a.maxDepth !== b.maxDepth ||
    a.debugMode !== b.debugMode ||
    a.bvh !== b.bvh ||
    a.nee !== b.nee ||
    a.mis !== b.mis ||
    a.rr !== b.rr ||
    a.background[0] !== b.background[0] ||
    a.background[1] !== b.background[1] ||
    a.background[2] !== b.background[2]
  );
}

export function configNeedsCamera(a: EngineConfig, b: EngineConfig): boolean {
  return (
    a.yaw !== b.yaw ||
    a.pitch !== b.pitch ||
    a.radius !== b.radius ||
    a.vfov !== b.vfov ||
    a.defocus !== b.defocus
  );
}
