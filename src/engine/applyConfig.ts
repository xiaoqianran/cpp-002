import type { EngineConfig } from "./types";
import { lookTarget, orbitPosition, RES_PRESETS } from "./types";
import type { RayTracerApi } from "./wasm";

/** 把前端 Config 投影到 C++ —— 唯一同步点 */
export function applyConfig(api: RayTracerApi, cfg: EngineConfig) {
  const res = RES_PRESETS[cfg.resIdx] ?? RES_PRESETS[0]!;
  const target = lookTarget(cfg.sceneId);
  const eye = orbitPosition(cfg.yaw, cfg.pitch, cfg.radius, target);

  api.init(res.w, res.h, cfg.sceneId);
  api.setUseBvh(cfg.bvh);
  api.setUseNee(cfg.nee);
  api.setUseMis(cfg.mis);
  api.setUseRr(cfg.rr);
  api.setMaxDepth(cfg.maxDepth);
  api.setDebugMode(cfg.debugMode);
  api.setCamera(
    eye.x,
    eye.y,
    eye.z,
    target[0],
    target[1],
    target[2],
    cfg.vfov,
    cfg.defocus,
    cfg.radius,
  );
}

/** 仅相机（拖拽时避免重建场景） */
export function applyCameraOnly(api: RayTracerApi, cfg: EngineConfig) {
  const target = lookTarget(cfg.sceneId);
  const eye = orbitPosition(cfg.yaw, cfg.pitch, cfg.radius, target);
  api.setCamera(
    eye.x,
    eye.y,
    eye.z,
    target[0],
    target[1],
    target[2],
    cfg.vfov,
    cfg.defocus,
    cfg.radius,
  );
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
    a.rr !== b.rr
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
