import type { EngineConfig } from "./types";
import { packConfig } from "./pack";
import type { RayTracerApi } from "./wasm";

/** 唯一同步点：打包 Config → rt_apply_config */
export function applyConfig(api: RayTracerApi, cfg: EngineConfig) {
  api.applyConfigPacked(packConfig(cfg), 0);
}

export function applyCameraOnly(api: RayTracerApi, cfg: EngineConfig) {
  api.applyConfigPacked(packConfig(cfg), 1);
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
