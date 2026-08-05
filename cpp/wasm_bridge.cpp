// WASM 桥接 → engine（细粒度 API 保留，内部统一）
#include "engine.h"

#include <cstdlib>
#include <emscripten.h>

static engine g_rt;

extern "C" {

EMSCRIPTEN_KEEPALIVE
void rt_init(int width, int height, int scene_id) {
  if (width < 16) width = 16;
  if (height < 16) height = 16;
  if (width > 1280) width = 1280;
  if (height > 720) height = 720;
  g_rt.setup(width, height, scene_id);
}

EMSCRIPTEN_KEEPALIVE
void rt_set_camera(double lx, double ly, double lz, double ax, double ay, double az, double vfov,
                   double defocus, double focus) {
  g_rt.set_camera(lx, ly, lz, ax, ay, az, vfov, defocus, focus);
}

EMSCRIPTEN_KEEPALIVE
void rt_set_scene(int scene_id) { g_rt.set_scene(scene_id); }

EMSCRIPTEN_KEEPALIVE
void rt_set_max_depth(int depth) { g_rt.set_max_depth(depth); }

EMSCRIPTEN_KEEPALIVE
void rt_set_background(double r, double g, double b) { g_rt.set_background_rgb(r, g, b); }

EMSCRIPTEN_KEEPALIVE
void rt_set_debug_mode(int mode) { g_rt.set_debug_mode(mode); }

EMSCRIPTEN_KEEPALIVE
void rt_set_use_bvh(int enabled) { g_rt.set_use_bvh(enabled); }

EMSCRIPTEN_KEEPALIVE
void rt_set_use_nee(int enabled) { g_rt.set_use_nee(enabled); }

EMSCRIPTEN_KEEPALIVE
void rt_set_use_mis(int enabled) { g_rt.set_use_mis(enabled); }

EMSCRIPTEN_KEEPALIVE
void rt_set_use_rr(int enabled) { g_rt.set_use_rr(enabled); }

EMSCRIPTEN_KEEPALIVE
void rt_reset() { g_rt.reset_accum(); }

EMSCRIPTEN_KEEPALIVE
void rt_render_pass(int spp) { g_rt.render_pass(spp); }

EMSCRIPTEN_KEEPALIVE
int rt_width() { return g_rt.get_width(); }

EMSCRIPTEN_KEEPALIVE
int rt_height() { return g_rt.get_height(); }

EMSCRIPTEN_KEEPALIVE
int rt_samples() { return g_rt.get_samples(); }

EMSCRIPTEN_KEEPALIVE
int rt_scene() { return g_rt.get_scene(); }

EMSCRIPTEN_KEEPALIVE
int rt_debug_mode() { return g_rt.get_debug_mode(); }

EMSCRIPTEN_KEEPALIVE
int rt_use_bvh() { return g_rt.get_use_bvh(); }

EMSCRIPTEN_KEEPALIVE
int rt_use_nee() { return g_rt.get_use_nee(); }

EMSCRIPTEN_KEEPALIVE
int rt_use_mis() { return g_rt.get_use_mis(); }

EMSCRIPTEN_KEEPALIVE
int rt_use_rr() { return g_rt.get_use_rr(); }

EMSCRIPTEN_KEEPALIVE
int rt_primitive_count() { return g_rt.get_primitive_count(); }

EMSCRIPTEN_KEEPALIVE
int rt_light_count() { return g_rt.get_light_count(); }

EMSCRIPTEN_KEEPALIVE
unsigned char *rt_rgba_ptr() { return g_rt.get_rgba(); }

EMSCRIPTEN_KEEPALIVE
int rt_rgba_bytes() { return static_cast<int>(g_rt.rgba_bytes()); }

} // extern "C"
