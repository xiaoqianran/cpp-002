// 引擎：Camera + PathTracer + Film；扫描线渐进渲染
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
  void apply(const EngineConfig &cfg) {
    const bool size_changed =
        cfg.width != config.width || cfg.height != config.height || accum.empty();
    const bool scene_changed = cfg.scene_id != config.scene_id || !scene_root;
    const bool bvh_changed = cfg.flags.bvh != config.flags.bvh;

    config = cfg;
    if (size_changed) ensure_buffers();
    if (scene_changed || bvh_changed) rebuild_world();

    cam.set_pose(cfg.pose);
    cam.initialize(cfg.width, cfg.height);
    tracer.set_flags(cfg.flags);
    tracer.background = cfg.background;
    tracer.lights = &lights;
    reset_accum();
  }

  void apply_pose(const CameraPose &pose) {
    config.pose = pose;
    cam.set_pose(pose);
    cam.initialize(config.width, config.height);
    reset_accum();
  }

  void reset_accum() {
    if (!accum.empty()) std::fill(accum.begin(), accum.end(), 0.0);
    samples_done = 0;
    scan_y = 0;
    pass_spp = 1;
  }

  /**
   * 扫描线渐进：
   * - rows_budget>0：本调用最多画这么多行，满高后 samples_done += pass_spp
   * - rows_budget<=0：一次画完整帧
   * bake 时已扫行用 (samples_done+pass_spp)，未扫行用 samples_done
   */
  void render_pass(int spp, int rows_budget = 0) {
    if (config.width <= 0 || config.height <= 0 || !scene_root || accum.empty()) return;
    if (spp < 1) spp = 1;

    const int H = config.height;
    const int W = config.width;
    if (scan_y == 0) pass_spp = spp;

    int budget = rows_budget <= 0 ? H : rows_budget;
    if (budget < 1) budget = 1;

    for (int n = 0; n < budget && scan_y < H; ++n) {
      const int j = scan_y;
      for (int i = 0; i < W; ++i) {
        color pixel(0, 0, 0);
        for (int s = 0; s < pass_spp; ++s) {
          ray r = cam.get_ray(i, j);
          pixel += tracer.trace(r, *scene_root);
        }
        const size_t idx = static_cast<size_t>((j * W + i) * 3);
        accum[idx + 0] += pixel.x();
        accum[idx + 1] += pixel.y();
        accum[idx + 2] += pixel.z();
      }
      ++scan_y;
    }

    if (scan_y >= H) {
      samples_done += pass_spp;
      scan_y = 0;
    }
    bake_rgba();
  }

  void setup(int w, int h, int scene_id) {
    config.width = w;
    config.height = h;
    config.scene_id = scene_id;
    config.background = scene_background(scene_id);
    apply(config);
  }

  void set_camera(double lx, double ly, double lz, double ax, double ay, double az, double vfov,
                  double defocus, double focus) {
    CameraPose p = config.pose;
    p.lookfrom = point3(lx, ly, lz);
    p.lookat = point3(ax, ay, az);
    p.vfov = vfov;
    p.defocus_angle = defocus;
    p.focus_dist = focus;
    apply_pose(p);
  }

  void set_max_depth(int d) {
    config.flags.max_depth = d < 1 ? 1 : d;
    apply(config);
  }
  void set_debug_mode(int mode) {
    config.flags.debug_mode = mode < 0 ? 0 : mode;
    apply(config);
  }
  void set_use_bvh(int enabled) {
    config.flags.bvh = enabled != 0;
    apply(config);
  }
  void set_use_nee(int enabled) {
    config.flags.nee = enabled != 0;
    apply(config);
  }
  void set_use_mis(int enabled) {
    config.flags.mis = enabled != 0;
    apply(config);
  }
  void set_use_rr(int enabled) {
    config.flags.rr = enabled != 0;
    apply(config);
  }
  void set_scene(int id) {
    config.scene_id = id;
    config.background = scene_background(id);
    apply(config);
  }
  void set_background_rgb(double r, double g, double b) {
    config.background = color(r, g, b);
    apply(config);
  }

  int get_width() const { return config.width; }
  int get_height() const { return config.height; }
  int get_samples() const { return samples_done; }
  int get_scan_y() const { return scan_y; }
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
  EngineConfig config{};
  camera cam;
  path_tracer tracer;
  hittable_list raw_world;
  std::vector<shared_ptr<quad>> lights;
  shared_ptr<hittable> scene_root;
  std::vector<double> accum;
  std::vector<unsigned char> rgba;
  int samples_done = 0;
  int primitive_count = 0;
  int scan_y = 0;
  int pass_spp = 1;

  void ensure_buffers() {
    const size_t n = static_cast<size_t>(std::max(1, config.width) * std::max(1, config.height));
    accum.assign(n * 3, 0.0);
    rgba.assign(n * 4, 0);
  }

  void rebuild_world() {
    build_scene(config.scene_id, raw_world, lights);
    primitive_count = static_cast<int>(raw_world.objects.size());
    tracer.lights = &lights;
    if (config.flags.bvh && primitive_count > 0) {
      scene_root = make_shared<bvh_node>(raw_world);
    } else {
      scene_root = make_shared<hittable_list>(raw_world);
    }
  }

  void bake_rgba() {
    if (rgba.empty()) return;
    const int W = config.width;
    const int H = config.height;
    const int done = samples_done;
    const int partial = (scan_y > 0) ? pass_spp : 0;

    for (int j = 0; j < H; ++j) {
      const int s =
          (j < scan_y) ? (done + partial) : done; // 本趟已写行多 pass_spp
      const double inv = s > 0 ? 1.0 / s : 0.0;
      for (int i = 0; i < W; ++i) {
        const size_t idx = static_cast<size_t>((j * W + i) * 3);
        color c(accum[idx + 0] * inv, accum[idx + 1] * inv, accum[idx + 2] * inv);
        write_color_rgba(&rgba[static_cast<size_t>((j * W + i) * 4)], c);
      }
    }
  }
};

using renderer = engine;
