import { packConfig } from "./pack";
import type { EngineConfig } from "./types";
import { lookTarget, orbitPosition } from "./types";
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

/** 完整配置 → rt_apply（经 pack 保证字段序） */
export function applyConfig(api: RayTracerApi, cfg: EngineConfig) {
  const p = packConfig(cfg);
  api.apply({
    width: p[0]!,
    height: p[1]!,
    sceneId: p[2]!,
    maxDepth: p[3]!,
    debugMode: p[4]!,
    bvh: p[5]! !== 0,
    nee: p[6]! !== 0,
    mis: p[7]! !== 0,
    rr: p[8]! !== 0,
    lx: p[9]!,
    ly: p[10]!,
    lz: p[11]!,
    ax: p[12]!,
    ay: p[13]!,
    az: p[14]!,
    vfov: p[15]!,
    defocus: p[16]!,
    focus: p[17]!,
    bg: [p[18]!, p[19]!, p[20]!],
  });
}

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
