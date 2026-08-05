// WASM：rt_apply / rt_apply_pose / rt_render_pass(rows)
#include "engine.h"

#include <emscripten.h>

static engine g_eng;

extern "C" {

EMSCRIPTEN_KEEPALIVE
void rt_apply(int width, int height, int scene_id, int max_depth, int debug_mode, int bvh,
              int nee, int mis, int rr, double lx, double ly, double lz, double ax, double ay,
              double az, double vfov, double defocus, double focus, double bg_r, double bg_g,
              double bg_b) {
  if (width < 16) width = 16;
  if (height < 16) height = 16;
  if (width > 1280) width = 1280;
  if (height > 720) height = 720;

  EngineConfig c;
  c.width = width;
  c.height = height;
  c.scene_id = scene_id;
  c.flags.max_depth = max_depth < 1 ? 1 : max_depth;
  c.flags.debug_mode = debug_mode < 0 ? 0 : debug_mode;
  c.flags.bvh = bvh != 0;
  c.flags.nee = nee != 0;
  c.flags.mis = mis != 0;
  c.flags.rr = rr != 0;
  c.pose.lookfrom = point3(lx, ly, lz);
  c.pose.lookat = point3(ax, ay, az);
  c.pose.vfov = vfov;
  c.pose.defocus_angle = defocus;
  c.pose.focus_dist = focus;
  c.background = color(bg_r, bg_g, bg_b);
  g_eng.apply(c);
}

EMSCRIPTEN_KEEPALIVE
void rt_apply_pose(double lx, double ly, double lz, double ax, double ay, double az, double vfov,
                   double defocus, double focus) {
  CameraPose p;
  p.lookfrom = point3(lx, ly, lz);
  p.lookat = point3(ax, ay, az);
  p.vfov = vfov;
  p.defocus_angle = defocus;
  p.focus_dist = focus;
  g_eng.apply_pose(p);
}

EMSCRIPTEN_KEEPALIVE
void rt_reset() { g_eng.reset_accum(); }

/** spp + 行预算（0=整帧） */
EMSCRIPTEN_KEEPALIVE
void rt_render_pass(int spp, int rows_budget) { g_eng.render_pass(spp, rows_budget); }

EMSCRIPTEN_KEEPALIVE
int rt_width() { return g_eng.get_width(); }

EMSCRIPTEN_KEEPALIVE
int rt_height() { return g_eng.get_height(); }

EMSCRIPTEN_KEEPALIVE
int rt_samples() { return g_eng.get_samples(); }

EMSCRIPTEN_KEEPALIVE
int rt_scan_y() { return g_eng.get_scan_y(); }

EMSCRIPTEN_KEEPALIVE
int rt_scene() { return g_eng.get_scene(); }

EMSCRIPTEN_KEEPALIVE
int rt_debug_mode() { return g_eng.get_debug_mode(); }

EMSCRIPTEN_KEEPALIVE
int rt_use_bvh() { return g_eng.get_use_bvh(); }

EMSCRIPTEN_KEEPALIVE
int rt_use_nee() { return g_eng.get_use_nee(); }

EMSCRIPTEN_KEEPALIVE
int rt_use_mis() { return g_eng.get_use_mis(); }

EMSCRIPTEN_KEEPALIVE
int rt_use_rr() { return g_eng.get_use_rr(); }

EMSCRIPTEN_KEEPALIVE
int rt_primitive_count() { return g_eng.get_primitive_count(); }

EMSCRIPTEN_KEEPALIVE
int rt_light_count() { return g_eng.get_light_count(); }

EMSCRIPTEN_KEEPALIVE
unsigned char *rt_rgba_ptr() { return g_eng.get_rgba(); }

EMSCRIPTEN_KEEPALIVE
int rt_rgba_bytes() { return static_cast<int>(g_eng.rgba_bytes()); }

// 旧 API
EMSCRIPTEN_KEEPALIVE
void rt_init(int width, int height, int scene_id) {
  EngineConfig c = g_eng.get_config();
  c.width = width;
  c.height = height;
  c.scene_id = scene_id;
  c.background = scene_background(scene_id);
  g_eng.apply(c);
}

EMSCRIPTEN_KEEPALIVE
void rt_set_camera(double lx, double ly, double lz, double ax, double ay, double az, double vfov,
                   double defocus, double focus) {
  g_eng.set_camera(lx, ly, lz, ax, ay, az, vfov, defocus, focus);
}

EMSCRIPTEN_KEEPALIVE
void rt_set_scene(int scene_id) { g_eng.set_scene(scene_id); }

EMSCRIPTEN_KEEPALIVE
void rt_set_max_depth(int depth) { g_eng.set_max_depth(depth); }

EMSCRIPTEN_KEEPALIVE
void rt_set_background(double r, double green, double b) {
  g_eng.set_background_rgb(r, green, b);
}

EMSCRIPTEN_KEEPALIVE
void rt_set_debug_mode(int mode) { g_eng.set_debug_mode(mode); }

EMSCRIPTEN_KEEPALIVE
void rt_set_use_bvh(int enabled) { g_eng.set_use_bvh(enabled); }

EMSCRIPTEN_KEEPALIVE
void rt_set_use_nee(int enabled) { g_eng.set_use_nee(enabled); }

EMSCRIPTEN_KEEPALIVE
void rt_set_use_mis(int enabled) { g_eng.set_use_mis(enabled); }

EMSCRIPTEN_KEEPALIVE
void rt_set_use_rr(int enabled) { g_eng.set_use_rr(enabled); }

} // extern "C"
