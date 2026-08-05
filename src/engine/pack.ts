import type { EngineConfig } from "./types";
import { lookTarget, orbitPosition, RES_PRESETS } from "./types";

/** 与 rt_apply 21 参数顺序严格对齐 */
export const CONFIG_PACK_SIZE = 21;

export function packConfig(cfg: EngineConfig): Float64Array {
  const res = RES_PRESETS[cfg.resIdx] ?? RES_PRESETS[0]!;
  const target = lookTarget(cfg.sceneId);
  const eye = orbitPosition(cfg.yaw, cfg.pitch, cfg.radius, target);
  const bg = cfg.background;
  const p = new Float64Array(CONFIG_PACK_SIZE);
  p[0] = res.w;
  p[1] = res.h;
  p[2] = cfg.sceneId;
  p[3] = cfg.maxDepth;
  p[4] = cfg.debugMode;
  p[5] = cfg.bvh ? 1 : 0;
  p[6] = cfg.nee ? 1 : 0;
  p[7] = cfg.mis ? 1 : 0;
  p[8] = cfg.rr ? 1 : 0;
  p[9] = eye.x;
  p[10] = eye.y;
  p[11] = eye.z;
  p[12] = target[0];
  p[13] = target[1];
  p[14] = target[2];
  p[15] = cfg.vfov;
  p[16] = cfg.defocus;
  p[17] = cfg.radius;
  p[18] = bg[0];
  p[19] = bg[1];
  p[20] = bg[2];
  return p;
}
