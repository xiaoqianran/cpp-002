// 引擎配置：C++ 侧参数包（与前端 packConfig 布局一致）
#pragma once

#include "vec3.h"

struct CameraPose {
  point3 lookfrom = point3(0, 1, 3);
  point3 lookat = point3(0, 1, 0);
  vec3 vup = vec3(0, 1, 0);
  double vfov = 40;
  double defocus_angle = 0;
  double focus_dist = 3;
};

struct TraceFlags {
  int max_depth = 50;
  int debug_mode = 0;
  bool bvh = true;
  bool nee = true;
  bool mis = true;
  bool rr = true;
};

struct EngineConfig {
  int width = 320;
  int height = 180;
  int scene_id = 3;
  CameraPose pose;
  TraceFlags flags;
  color background = color(0, 0, 0);
};

inline color scene_background(int scene_id) {
  if (scene_id == 3) return color(0, 0, 0);
  if (scene_id == 2) return color(0.15, 0.16, 0.2);
  if (scene_id == 1) return color(0.55, 0.65, 0.85);
  return color(0.70, 0.80, 1.00);
}

/**
 * 打包布局（21 个 double，与 src/engine/pack.ts 一致）：
 *  0 width  1 height  2 scene_id
 *  3 max_depth  4 debug  5 bvh  6 nee  7 mis  8 rr
 *  9..11 lookfrom  12..14 lookat
 *  15 vfov  16 defocus  17 focus
 *  18..20 background rgb
 */
inline constexpr int kConfigPackSize = 21;

inline EngineConfig unpack_config(const double *p, int n) {
  EngineConfig cfg;
  if (!p || n < kConfigPackSize) return cfg;
  cfg.width = static_cast<int>(p[0]);
  cfg.height = static_cast<int>(p[1]);
  cfg.scene_id = static_cast<int>(p[2]);
  cfg.flags.max_depth = static_cast<int>(p[3]);
  cfg.flags.debug_mode = static_cast<int>(p[4]);
  cfg.flags.bvh = p[5] != 0;
  cfg.flags.nee = p[6] != 0;
  cfg.flags.mis = p[7] != 0;
  cfg.flags.rr = p[8] != 0;
  cfg.pose.lookfrom = point3(p[9], p[10], p[11]);
  cfg.pose.lookat = point3(p[12], p[13], p[14]);
  cfg.pose.vfov = p[15];
  cfg.pose.defocus_angle = p[16];
  cfg.pose.focus_dist = p[17];
  cfg.background = color(p[18], p[19], p[20]);
  if (cfg.width < 16) cfg.width = 16;
  if (cfg.height < 16) cfg.height = 16;
  if (cfg.width > 1280) cfg.width = 1280;
  if (cfg.height > 720) cfg.height = 720;
  if (cfg.flags.max_depth < 1) cfg.flags.max_depth = 1;
  return cfg;
}
