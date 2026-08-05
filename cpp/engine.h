// 引擎：编排 Camera + PathTracer + Film + Scene
#pragma once

#include "bvh.h"
#include "camera.h"
#include "color.h"
#include "config.h"
#include "hittable.h"
#include "path_tracer.h"
#include "scenes.h"
#include <vector>

class engine {
public:
  /** 完整应用配置（场景/分辨率/开关变化时） */
  void set(const EngineConfig &cfg) {
    config = cfg;
    ensure_buffers();
    rebuild_world();
    cam.set_pose(cfg.pose);
    cam.initialize(cfg.width, cfg.height);
    tracer.set_flags(cfg.flags);
    tracer.background = cfg.background;
    tracer.lights = &lights;
    reset_accum();
  }

  /** 仅姿态（轨道拖拽） */
  void set_pose(const CameraPose &pose) {
    config.pose = pose;
    cam.set_pose(pose);
    cam.initialize(config.width, config.height);
    reset_accum();
  }

  /** 仅积分开关 / 深度 / 调试 */
  void set_flags(const TraceFlags &flags) {
    config.flags = flags;
    // bvh 变化需要重建
    if (flags.bvh != use_bvh_built) {
      rebuild_world();
    }
    tracer.set_flags(flags);
    reset_accum();
  }

  void set_background(const color &c) {
    config.background = c;
    tracer.background = c;
    reset_accum();
  }

  void reset_accum() {
    std::fill(accum.begin(), accum.end(), 0.0);
    samples_done = 0;
  }

  void render_pass(int spp) {
    if (config.width <= 0 || config.height <= 0 || !scene_root) return;
    if (spp < 1) spp = 1;

    for (int j = 0; j < config.height; ++j) {
      for (int i = 0; i < config.width; ++i) {
        color pixel(0, 0, 0);
        for (int s = 0; s < spp; ++s) {
          ray r = cam.get_ray(i, j);
          pixel += tracer.trace(r, *scene_root);
        }
        const size_t idx = static_cast<size_t>((j * config.width + i) * 3);
        accum[idx + 0] += pixel.x();
        accum[idx + 1] += pixel.y();
        accum[idx + 2] += pixel.z();
      }
    }
    samples_done += spp;
    bake_rgba();
  }

  // —— 兼容旧 bridge 的细粒度 setter（内部改 config 再投影）——
  void setup(int w, int h, int scene_id) {
    config.width = w;
    config.height = h;
    config.scene_id = scene_id;
    config.background = scene_background(scene_id);
    ensure_buffers();
    rebuild_world();
    cam.set_pose(config.pose);
    cam.initialize(w, h);
    tracer.set_flags(config.flags);
    tracer.background = config.background;
    tracer.lights = &lights;
    reset_accum();
  }

  void set_camera(double lx, double ly, double lz, double ax, double ay, double az, double vfov,
                  double defocus, double focus) {
    config.pose.lookfrom = point3(lx, ly, lz);
    config.pose.lookat = point3(ax, ay, az);
    config.pose.vfov = vfov;
    config.pose.defocus_angle = defocus;
    config.pose.focus_dist = focus;
    set_pose(config.pose);
  }

  void set_max_depth(int d) {
    config.flags.max_depth = d < 1 ? 1 : d;
    tracer.set_flags(config.flags);
    reset_accum();
  }

  void set_debug_mode(int mode) {
    config.flags.debug_mode = mode < 0 ? 0 : mode;
    tracer.set_flags(config.flags);
    reset_accum();
  }

  void set_use_bvh(int enabled) {
    config.flags.bvh = enabled != 0;
    rebuild_world();
    reset_accum();
  }

  void set_use_nee(int enabled) {
    config.flags.nee = enabled != 0;
    tracer.set_flags(config.flags);
    reset_accum();
  }

  void set_use_mis(int enabled) {
    config.flags.mis = enabled != 0;
    tracer.set_flags(config.flags);
    reset_accum();
  }

  void set_use_rr(int enabled) {
    config.flags.rr = enabled != 0;
    tracer.set_flags(config.flags);
    reset_accum();
  }

  void set_scene(int id) {
    config.scene_id = id;
    config.background = scene_background(id);
    tracer.background = config.background;
    rebuild_world();
    reset_accum();
  }

  void set_background_rgb(double r, double g, double b) { set_background(color(r, g, b)); }

  int get_width() const { return config.width; }
  int get_height() const { return config.height; }
  int get_samples() const { return samples_done; }
  int get_scene() const { return config.scene_id; }
  int get_debug_mode() const { return config.flags.debug_mode; }
  int get_use_bvh() const { return config.flags.bvh ? 1 : 0; }
  int get_use_nee() const { return config.flags.nee ? 1 : 0; }
  int get_use_mis() const { return config.flags.mis ? 1 : 0; }
  int get_use_rr() const { return config.flags.rr ? 1 : 0; }
  int get_primitive_count() const { return primitive_count; }
  int get_light_count() const { return static_cast<int>(lights.size()); }
  unsigned char *get_rgba() { return rgba.data(); }
  size_t rgba_bytes() const { return rgba.size(); }
  const EngineConfig &get_config() const { return config; }

private:
  EngineConfig config;
  camera cam;
  path_tracer tracer;
  hittable_list raw_world;
  std::vector<shared_ptr<quad>> lights;
  shared_ptr<hittable> scene_root;
  std::vector<double> accum;
  std::vector<unsigned char> rgba;
  int samples_done = 0;
  int primitive_count = 0;
  bool use_bvh_built = true;

  void ensure_buffers() {
    const size_t n = static_cast<size_t>(config.width * config.height);
    accum.assign(n * 3, 0.0);
    rgba.assign(n * 4, 0);
  }

  void rebuild_world() {
    build_scene(config.scene_id, raw_world, lights);
    primitive_count = static_cast<int>(raw_world.objects.size());
    use_bvh_built = config.flags.bvh;
    tracer.lights = &lights;
    if (config.flags.bvh && primitive_count > 0) {
      scene_root = make_shared<bvh_node>(raw_world);
    } else {
      scene_root = make_shared<hittable_list>(raw_world);
    }
  }

  void bake_rgba() {
    if (samples_done <= 0) return;
    const double inv = 1.0 / samples_done;
    for (int n = 0; n < config.width * config.height; ++n) {
      color c(accum[static_cast<size_t>(n * 3 + 0)] * inv,
              accum[static_cast<size_t>(n * 3 + 1)] * inv,
              accum[static_cast<size_t>(n * 3 + 2)] * inv);
      write_color_rgba(&rgba[static_cast<size_t>(n * 4)], c);
    }
  }
};

// 兼容旧名
using renderer = engine;
