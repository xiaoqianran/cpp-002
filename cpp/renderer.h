// 渐进式渲染器：多次 pass 累加 samples，供 WASM 实时预览
#pragma once

#include "camera.h"
#include "color.h"
#include "hittable.h"
#include "scenes.h"
#include <vector>

class renderer {
public:
  void setup(int w, int h, int scene_id) {
    width = w;
    height = h;
    this->scene_id = scene_id;
    accum.assign(static_cast<size_t>(w * h * 3), 0.0);
    rgba.assign(static_cast<size_t>(w * h * 4), 0);
    samples_done = 0;
    build_scene(scene_id, world);
    apply_camera_defaults_for_scene();
    cam.initialize(width, height);
  }

  void set_camera(double lx, double ly, double lz, double ax, double ay, double az, double vfov,
                  double defocus, double focus) {
    cam.lookfrom = point3(lx, ly, lz);
    cam.lookat = point3(ax, ay, az);
    cam.vfov = vfov;
    cam.defocus_angle = defocus;
    cam.focus_dist = focus;
    cam.initialize(width, height);
    reset_accum();
  }

  void set_max_depth(int d) {
    cam.max_depth = d < 1 ? 1 : d;
    reset_accum();
  }

  void set_background(double r, double g, double b) {
    cam.background = color(r, g, b);
    reset_accum();
  }

  void set_debug_mode(int mode) {
    cam.debug_mode = mode < 0 ? 0 : mode;
    reset_accum();
  }

  void set_scene(int id) {
    scene_id = id;
    build_scene(scene_id, world);
    apply_camera_defaults_for_scene();
    cam.initialize(width, height);
    reset_accum();
  }

  void reset_accum() {
    std::fill(accum.begin(), accum.end(), 0.0);
    samples_done = 0;
  }

  void render_pass(int spp) {
    if (width <= 0 || height <= 0) return;
    if (spp < 1) spp = 1;

    for (int j = 0; j < height; ++j) {
      for (int i = 0; i < width; ++i) {
        color pixel(0, 0, 0);
        for (int s = 0; s < spp; ++s) {
          ray r = cam.get_ray(i, j);
          pixel += cam.ray_color(r, cam.max_depth, world);
        }
        const size_t idx = static_cast<size_t>((j * width + i) * 3);
        accum[idx + 0] += pixel.x();
        accum[idx + 1] += pixel.y();
        accum[idx + 2] += pixel.z();
      }
    }
    samples_done += spp;
    bake_rgba();
  }

  int get_width() const { return width; }
  int get_height() const { return height; }
  int get_samples() const { return samples_done; }
  int get_scene() const { return scene_id; }
  int get_debug_mode() const { return cam.debug_mode; }
  unsigned char *get_rgba() { return rgba.data(); }
  size_t rgba_bytes() const { return rgba.size(); }

  // 供 UI 读取默认注视点 / 距离建议
  void default_look_at(double &x, double &y, double &z) const {
    if (scene_id == 3) {
      x = 0;
      y = 1;
      z = 0;
    } else {
      x = 0;
      y = 1;
      z = 0;
    }
  }

private:
  int width = 0;
  int height = 0;
  int scene_id = 0;
  int samples_done = 0;
  camera cam;
  hittable_list world;
  std::vector<double> accum;
  std::vector<unsigned char> rgba;

  void bake_rgba() {
    if (samples_done <= 0) return;
    const double inv = 1.0 / samples_done;
    for (int n = 0; n < width * height; ++n) {
      color c(accum[static_cast<size_t>(n * 3 + 0)] * inv,
              accum[static_cast<size_t>(n * 3 + 1)] * inv,
              accum[static_cast<size_t>(n * 3 + 2)] * inv);
      // 调试视图不做过亮曝光，美观模式也走 gamma
      write_color_rgba(&rgba[static_cast<size_t>(n * 4)], c);
    }
  }

  void apply_camera_defaults_for_scene() {
    if (scene_id == 1) {
      cam.lookfrom = point3(0, 1.2, 4.5);
      cam.lookat = point3(0, 1, 0);
      cam.vfov = 35;
      cam.defocus_angle = 0.4;
      cam.focus_dist = 4.5;
      cam.background = color(0.55, 0.65, 0.85);
    } else if (scene_id == 2) {
      cam.lookfrom = point3(0, 2.2, 7);
      cam.lookat = point3(0, 0.8, 0);
      cam.vfov = 28;
      cam.defocus_angle = 0.0;
      cam.focus_dist = 7.0;
      cam.background = color(0.15, 0.16, 0.2);
    } else if (scene_id == 3) {
      // 康奈尔箱：室内黑背景，只靠面光照明
      cam.lookfrom = point3(0, 1.0, 3.2);
      cam.lookat = point3(0, 1.0, 0);
      cam.vfov = 40;
      cam.defocus_angle = 0.0;
      cam.focus_dist = 3.2;
      cam.background = color(0, 0, 0);
      cam.max_depth = 50;
    } else {
      cam.lookfrom = point3(0, 1.5, 6);
      cam.lookat = point3(0, 1, 0);
      cam.vfov = 30;
      cam.defocus_angle = 0.3;
      cam.focus_dist = 6.0;
      cam.background = color(0.70, 0.80, 1.00);
    }
  }
};
